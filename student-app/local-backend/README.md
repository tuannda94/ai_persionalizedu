# 🎓 Student App - Local Backend

## Mục đích

Local Backend chạy **TRÊN MÁY SINH VIÊN**, xử lý:
- ✅ Chat requests (100% local)
- ✅ RAG engine (tìm context từ model packages)
- ✅ Ollama integration (generate AI responses)
- ✅ Conversation history (SQLite local)
- ✅ Telemetry (gửi đến remote API - optional, background)

## Kiến trúc

```
Desktop App (Electron)
    ↓
Local Backend (localhost:8000)
    ↓
┌─────────────┬──────────────┐
│             │              │
RAG Engine  Ollama      SQLite
(ChromaDB)  (Local)     (Conversations)
```

## Cấu trúc

```
local-backend/
├── app/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Local config
│   ├── database.py          # SQLite setup
│   │
│   ├── api/v1/
│   │   └── chat.py         # Chat endpoints ONLY
│   │
│   ├── services/
│   │   ├── rag_service.py  # RAG engine
│   │   ├── chat_service.py # Conversation
│   │   └── ollama_service.py # Ollama client
│   │
│   └── models/
│       └── conversation.py  # Local conversation model
│
├── storage/
│   ├── databases/          # SQLite files
│   └── logs/
│
└── requirements.txt
```

## Cài đặt

```bash
cd student-app/local-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Cấu hình

Tạo file `.env`:

```env
# Ollama (Local)
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3

# Model Packages
MODEL_PACKAGES_DIR=../../storage/model-packages

# Remote API (Optional - cho telemetry)
REMOTE_API_URL=https://api.fpt.edu.vn
TELEMETRY_ENABLED=true
```

## Chạy

```bash
# Development
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## API Endpoints

### Chat (Local)
- `POST /api/v1/chat/stream` - Stream chat response
- `GET /api/v1/chat/conversations` - Lấy conversations
- `GET /api/v1/chat/conversations/{id}/history` - Lấy history
- `DELETE /api/v1/chat/conversations/{id}` - Xóa conversation
- `GET /api/v1/chat/conversations/new` - Tạo conversation mới

### Health
- `GET /health` - Health check

## Luồng Chat (100% Local)

1. Desktop App gửi request đến `http://localhost:8000/api/v1/chat/stream`
2. Local Backend:
   - Load conversation history từ SQLite
   - Gọi RAG engine để tìm context
   - Build prompt với context + history
   - Gọi Ollama (local) để generate response
   - Stream response về Desktop App
   - Lưu conversation vào SQLite

## Storage

- **Conversations**: `storage/databases/chat_history.db` (SQLite)
- **Logs**: `storage/logs/`

## Build thành Executable

```bash
# Build với PyInstaller
pyinstaller build_backend.spec

# Output: dist/ai-learning-backend/
```

Executable này sẽ được bundle vào desktop app.

## Lưu ý

- ✅ **100% Local**: Không phụ thuộc server cho chat
- ✅ **Offline**: Hoạt động hoàn toàn offline (sau khi đăng nhập lần đầu)
- ✅ **Privacy**: Data không gửi lên server (trừ telemetry optional)
- ⚠️ **Remote API**: Chỉ dùng cho authentication, telemetry, updates (optional)
