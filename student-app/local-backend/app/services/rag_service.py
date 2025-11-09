"""
RAG Service - Local Backend
Xử lý RAG queries từ model packages local
"""
import chromadb
import json
from pathlib import Path
from typing import Optional, List, Tuple

from app.config import settings

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
    """Khởi tạo RAG engine - load tất cả subjects"""
    global collections

    print("=== Loading RAG Engine ===")
    print(f"Looking for model packages in: {MODEL_PACKAGES}")

    if not MODEL_PACKAGES.exists():
        print(f"⚠️  WARNING: Model packages directory not found: {MODEL_PACKAGES}")
        print("   Please run: cd data-pipeline && python embed_and_build_package.py")
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
    prompt = "Bạn là một trợ lý học tập AI. Hãy trả lời câu hỏi DỰA TRÊN các đoạn văn bản sau đây. Trả lời BẰNG TIẾNG VIỆT.\n\n"

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
