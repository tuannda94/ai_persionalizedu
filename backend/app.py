from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import chromadb
import json
import os
import requests
import time
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
import asyncio

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PACKAGES = BASE_DIR / "model_packages"
TELEMETRY_LOG = BASE_DIR / "telemetry.log"
QUERY_LOG = BASE_DIR / "query.log"

app = FastAPI(title="PolyDemo Backend")

# CORS middleware để Electron app có thể gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong production nên giới hạn
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup chroma client (in-memory)
client = chromadb.Client()

# helper: load local package into chroma collection
def load_subject_collection(subject_code):
    coll_name = subject_code
    try:
        collection = client.get_collection(coll_name)
        # remove existing docs if any
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

# Load default subject(s) at startup
print("=== Loading RAG Engine ===")
print(f"Looking for model packages in: {MODEL_PACKAGES}")

if not MODEL_PACKAGES.exists():
    print(f"⚠️  WARNING: Model packages directory not found: {MODEL_PACKAGES}")
    print("   Please run: cd data_pipeline && python embed_and_build_package.py")
    SUBJECTS = []
else:
    SUBJECTS = [p.name.replace('_v1', '') for p in (MODEL_PACKAGES.glob('*_v1')) if p.is_dir()]
    print(f"Found {len(SUBJECTS)} subject(s): {SUBJECTS}")

collections = {}

for s in SUBJECTS:
    try:
        coll, cnt = load_subject_collection(s)
        collections[s] = coll
        print(f"✅ Loaded {s}: {cnt} segments")
    except Exception as e:
        print(f"⚠️  Skipping {s} -> {e}")

if len(collections) == 0:
    print("❌ No subjects loaded! RAG Engine is not ready.")
    print("   To fix this:")
    print("   1. cd data_pipeline")
    print("   2. python -m venv .venv")
    print("   3. source .venv/bin/activate")
    print("   4. pip install -r requirements.txt")
    print("   5. python embed_and_build_package.py")
else:
    print(f"✅ RAG Engine ready with {len(collections)} subjects: {list(collections.keys())}")

class QueryReq(BaseModel):
    question: str
    subject: Optional[str] = None  # Optional: tự động detect nếu không có

class TelemetryReq(BaseModel):
    event: str
    subject: Optional[str] = None
    question: Optional[str] = None
    answer_length: Optional[int] = None
    used_segments: Optional[int] = None
    duration_ms: Optional[int] = None
    timestamp: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

def log_query(subject: str, question: str, answer: str, used_segments: int, duration_ms: int):
    """Log query details to file"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "subject": subject,
        "question": question[:200],  # Truncate for privacy
        "answer_length": len(answer),
        "used_segments": used_segments,
        "duration_ms": duration_ms
    }
    with QUERY_LOG.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

def get_rag_context(question: str, subject: Optional[str] = None):
    """Helper function để lấy RAG context và build prompt"""
    # Step 0: Tự động detect subject hoặc search across all
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

    # Build prompt
    prompt = "Bạn là một trợ lý học tập AI. Hãy trả lời câu hỏi DỰA TRÊN các đoạn văn bản sau đây. Trả lời BẰNG TIẾNG VIỆT.\n\n"
    prompt += "Các đoạn văn bản tham khảo:\n"
    for i, d in enumerate(docs):
        meta = metadatas[i] if i < len(metadatas) else {}
        source_file = meta.get('source', 'unknown')
        prompt += f"\n---Đoạn {i+1} (từ {source_file})---\n{d}\n"

    prompt += f"\n\nCâu hỏi: {question}\n\n"
    prompt += "Hãy trả lời một cách chi tiết và dễ hiểu BẰNG TIẾNG VIỆT. Nếu không có thông tin trong các đoạn trên, hãy nói rõ."

    return prompt, detected_subject, len(docs)

@app.post('/query/stream')
def query_stream(req: QueryReq):
    """
    Streaming RAG Query Flow:
    1. Tự động detect subject hoặc search across all subjects
    2. Query ChromaDB để lấy các đoạn văn bản gần nhất
    3. Ghép prompt với context
    4. Stream response từ Ollama (yêu cầu trả lời bằng tiếng Việt)
    """
    start_time = time.time()

    # Get RAG context
    prompt, detected_subject, used_segments = get_rag_context(req.question, req.subject)

    if not prompt:
        def error_stream():
            yield f"data: {json.dumps({'error': 'Không tìm thấy thông tin liên quan trong database.'})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    # Ollama config
    ollama_url = os.environ.get('OLLAMA_URL', 'http://localhost:11434/api/generate')
    ollama_model = os.environ.get('OLLAMA_MODEL', 'llama3')
    payload = {
        "model": ollama_model,
        "prompt": prompt,
        "stream": True  # Enable streaming
    }

    print(f"🤖 Streaming from Ollama API: {ollama_url} with model: {ollama_model}")

    def stream():
        full_answer = ""
        try:
            with requests.post(ollama_url, json=payload, stream=True, timeout=300) as r:
                r.raise_for_status()

                for line in r.iter_lines():
                    if line:
                        try:
                            chunk_data = json.loads(line.decode('utf-8'))
                            token = chunk_data.get('response', '')

                            if token:
                                full_answer += token
                                # Send token to client
                                yield f"data: {json.dumps({'token': token, 'done': False})}\n\n"

                            # Check if done
                            if chunk_data.get('done', False):
                                # Send final metadata
                                duration_ms = int((time.time() - start_time) * 1000)
                                yield f"data: {json.dumps({'done': True, 'used_segments': used_segments, 'duration_ms': duration_ms, 'detected_subject': detected_subject})}\n\n"

                                # Log query
                                log_query(detected_subject, req.question, full_answer, used_segments, duration_ms)
                                print(f"✅ Streaming completed in {duration_ms}ms, used {used_segments} segments")
                                break
                        except json.JSONDecodeError:
                            continue
                        except Exception as e:
                            print(f"⚠️  Error processing chunk: {e}")
                            continue
        except Exception as e:
            error_msg = f"Ollama streaming error: {str(e)}"
            print(f"❌ {error_msg}")
            yield f"data: {json.dumps({'error': error_msg})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")

@app.post('/query')
def query(req: QueryReq):
    """
    Non-streaming RAG Query (backward compatibility)
    """
    start_time = time.time()

    # Get RAG context
    prompt, detected_subject, used_segments = get_rag_context(req.question, req.subject)

    if not prompt:
        return {"answer": "Không tìm thấy thông tin liên quan trong database.", "used_segments": 0}

    # Step 3: Gửi request đến Ollama
    ollama_url = os.environ.get('OLLAMA_URL', 'http://localhost:11434/api/generate')
    ollama_model = os.environ.get('OLLAMA_MODEL', 'llama3')
    payload = {
        "model": ollama_model,
        "prompt": prompt,
        "stream": False
    }

    print(f"🤖 Calling Ollama API: {ollama_url} with model: {ollama_model}")
    try:
        r = requests.post(ollama_url, json=payload, timeout=240)
        r.raise_for_status()
        answer_data = r.json()
        if isinstance(answer_data, dict):
            answer = answer_data.get('response', '')
            if not answer:
                answer = answer_data.get('text', str(answer_data))
        else:
            answer = str(answer_data)
    except Exception as e:
        error_msg = f"Ollama error: {str(e)}"
        print(f"❌ {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

    # Step 4: Lưu log
    duration_ms = int((time.time() - start_time) * 1000)
    log_query(detected_subject, req.question, answer, used_segments, duration_ms)
    print(f"✅ Query completed in {duration_ms}ms, used {used_segments} segments, subject: {detected_subject}")

    return {
        "answer": answer,
        "used_segments": used_segments,
        "duration_ms": duration_ms,
        "detected_subject": detected_subject
    }

@app.post('/telemetry')
def telemetry(req: TelemetryReq):
    """
    Telemetry endpoint: Lưu events và có thể gửi về cloud server
    """
    telemetry_data = {
        "timestamp": req.timestamp or datetime.now().isoformat(),
        "event": req.event,
        "subject": req.subject,
        "question": req.question[:100] if req.question else None,  # Truncate for privacy
        "answer_length": req.answer_length,
        "used_segments": req.used_segments,
        "duration_ms": req.duration_ms,
        "data": req.data
    }

    # Lưu vào file log
    with TELEMETRY_LOG.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(telemetry_data, ensure_ascii=False) + "\n")

    # (Tùy chọn) Gửi về cloud server của trường
    cloud_telemetry_url = os.environ.get('CLOUD_TELEMETRY_URL')
    if cloud_telemetry_url:
        try:
            requests.post(
                cloud_telemetry_url,
                json=telemetry_data,
                timeout=5,
                headers={"Authorization": f"Bearer {os.environ.get('TELEMETRY_API_KEY', '')}"}
            )
            print(f"📡 Telemetry sent to cloud: {req.event}")
        except Exception as e:
            print(f"⚠️  Failed to send telemetry to cloud: {e}")

    return {"ok": True, "logged": True}

@app.get('/health')
def health():
    """Health check endpoint"""
    return {
        "ok": True,
        "subjects": list(collections.keys()),
        "rag_ready": len(collections) > 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
