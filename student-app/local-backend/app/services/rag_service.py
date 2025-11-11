"""
RAG Service - Local Backend
Xử lý RAG queries từ model packages local hoặc learning packages
"""
import chromadb
import json
from pathlib import Path
from typing import Optional, List, Tuple

from app.config import settings
from app.services.learning_package_service import get_learning_package_paths, get_current_learning_package_version

# Model packages directory từ config
MODEL_PACKAGES = Path(settings.MODEL_PACKAGES_DIR)

# Setup chroma client (in-memory)
client = chromadb.Client()
collections = {}


def load_subject_collection(subject_code: str) -> Tuple[chromadb.Collection, int]:
    """Load subject collection từ JSONL file"""
    coll_name = subject_code
    try:
        collection = client.get_collection(coll_name)
        client.delete_collection(coll_name)
    except Exception:
        pass

    collection = client.create_collection(coll_name)

    jsonl = MODEL_PACKAGES / f"{subject_code}_v1" / f"{subject_code}_segments.jsonl"
    if not jsonl.exists():
        raise FileNotFoundError(f"Segments file not found: {jsonl}")

    count = 0
    with jsonl.open("r", encoding="utf-8") as fh:
        for line in fh:
            seg = json.loads(line.strip())
            collection.add(
                ids=[seg["segment_id"]],
                documents=[seg["text"]],
                metadatas=[{"source": seg.get("source"), "offset": seg.get("offset")}],
                embeddings=[seg["embedding"]]
            )
            count += 1

    return collection, count


def init_rag_engine():
    """Khởi tạo RAG engine - load từ learning package hoặc model packages"""
    global collections

    print("=== Loading RAG Engine ===")

    # Clear existing collections
    collections = {}

    # Priority 1: Try to load from learning package
    current_package = get_current_learning_package_version()
    if current_package:
        package_paths = get_learning_package_paths(current_package.get("version"))
        rag_index_path = package_paths.get("rag_index")

        if rag_index_path and rag_index_path.exists():
            print(f"📦 Loading from learning package: {current_package.get('version')}")
            print(f"   RAG index path: {rag_index_path}")

            try:
                # Try to load ChromaDB from learning package
                # ChromaDB can load from a persistent directory
                import chromadb
                persistent_client = chromadb.PersistentClient(path=str(rag_index_path))

                # List all collections in the persistent client
                all_collections = persistent_client.list_collections()

                for coll_info in all_collections:
                    collection = persistent_client.get_collection(coll_info.name)
                    # Get count
                    count = collection.count()
                    collections[coll_info.name] = collection
                    print(f"✅ Loaded {coll_info.name}: {count} segments from learning package")

                if len(collections) > 0:
                    print(f"✅ RAG Engine ready with {len(collections)} subjects from learning package: {list(collections.keys())}")
                    return
            except Exception as e:
                print(f"⚠️  Failed to load from learning package: {e}")
                print("   Falling back to model packages...")

    # Priority 2: Load from model packages (legacy)
    print(f"Looking for model packages in: {MODEL_PACKAGES}")

    if not MODEL_PACKAGES.exists():
        print(f"⚠️  WARNING: Model packages directory not found: {MODEL_PACKAGES}")
        print("   Please install a learning package or run: cd data-pipeline && python embed_and_build_package.py")
        return

    SUBJECTS = [p.name.replace('_v1', '') for p in (MODEL_PACKAGES.glob('*_v1')) if p.is_dir()]
    print(f"Found {len(SUBJECTS)} subject(s): {SUBJECTS}")

    for s in SUBJECTS:
        try:
            coll, cnt = load_subject_collection(s)
            collections[s] = coll
            print(f"✅ Loaded {s}: {cnt} segments")
        except Exception as e:
            print(f"⚠️  Skipping {s} -> {e}")

    if len(collections) == 0:
        print("❌ No subjects loaded! RAG Engine is not ready.")
    else:
        print(f"✅ RAG Engine ready with {len(collections)} subjects: {list(collections.keys())}")


def get_rag_context(
    question: str,
    subject: Optional[str] = None,
    conversation_history: Optional[List[dict]] = None
) -> Tuple[Optional[str], Optional[str], int]:
    """
    Lấy RAG context và build prompt

    Returns:
        (prompt, detected_subject, used_segments) hoặc (None, None, None) nếu không tìm thấy
    """
    if not collections:
        return None, None, None

    # Tự động detect subject hoặc search across all
    if subject and subject in collections:
        collection = collections[subject]
        print(f"🔍 Querying RAG for subject: {subject}, question: {question[:50]}...")
        res = collection.query(query_texts=[question], n_results=5)
        docs = res.get('documents', [[]])[0]
        metadatas = res.get('metadatas', [[]])[0]
        detected_subject = subject
    else:
        # Search across all subjects
        print(f"🔍 Auto-detecting subject, searching across all subjects...")
        all_docs = []
        all_metadatas = []
        best_subject = None

        for subject_name, coll in collections.items():
            try:
                res = coll.query(query_texts=[question], n_results=3)
                subject_docs = res.get('documents', [[]])[0]
                subject_metas = res.get('metadatas', [[]])[0]

                if subject_docs:
                    all_docs.extend(subject_docs[:2])
                    all_metadatas.extend(subject_metas[:2])
                    if not best_subject:
                        best_subject = subject_name
            except Exception as e:
                print(f"⚠️  Error querying {subject_name}: {e}")
                continue

        docs = all_docs[:5]
        metadatas = all_metadatas[:5]
        detected_subject = best_subject or "unknown"

    if not docs or len(docs) == 0:
        return None, None, None

    # Build prompt với conversation history
    # System instruction - nhấn mạnh trả lời bằng tiếng Việt
    prompt = """Bạn là một trợ lý học tập AI chuyên nghiệp. Nhiệm vụ của bạn là trả lời câu hỏi của sinh viên DỰA TRÊN các đoạn văn bản được cung cấp.

QUAN TRỌNG: Bạn PHẢI trả lời BẰNG TIẾNG VIỆT. Không được trả lời bằng tiếng Anh hoặc ngôn ngữ khác.

"""

    # Thêm conversation history nếu có (chỉ lấy 6 lượt gần nhất để không quá dài)
    if conversation_history and len(conversation_history) > 0:
        recent_history = conversation_history[-6:]  # Lấy 6 messages gần nhất
        prompt += "Lịch sử hội thoại trước đó:\n"
        for msg in recent_history:
            role_label = "Sinh viên" if msg['role'] == 'user' else "Trợ lý"
            prompt += f"{role_label}: {msg['message']}\n"
        prompt += "\n"

    prompt += "Các đoạn văn bản tham khảo:\n"
    for i, d in enumerate(docs):
        meta = metadatas[i] if i < len(metadatas) else {}
        source_file = meta.get('source', 'unknown')
        prompt += f"\n---Đoạn {i+1} (từ {source_file})---\n{d}\n"

    prompt += f"\n\nCâu hỏi hiện tại: {question}\n\n"
    prompt += "Hãy trả lời một cách chi tiết và dễ hiểu BẰNG TIẾNG VIỆT. Nếu không có thông tin trong các đoạn trên, hãy nói rõ."

    return prompt, detected_subject, len(docs)


def get_loaded_subjects() -> List[str]:
    """Lấy danh sách subjects đã load"""
    return list(collections.keys())
