# 🎓 Student App - Local Backend

## 📋 Tổng Quan

Local Backend chạy **TRÊN MÁY SINH VIÊN**, xử lý tất cả logic chat và AI generation (100% local).

## 🎯 Mục Đích

- ✅ Chat requests với streaming (100% local)
- ✅ RAG engine (tìm context từ learning packages hoặc model packages)
- ✅ Ollama integration (generate AI responses)
- ✅ Conversation history (SQLite local)
- ✅ File processing (OCR, PDF, DOCX extraction)
- ✅ Package update management
- ✅ Learning package download/install
- ✅ Feedback sending (to remote API)
- ✅ Telemetry (gửi đến remote API - optional, background)

## 🏗️ Kiến Trúc

```
Desktop App (Electron)
    ↓ HTTP Request
Local Backend (localhost:8000)
    ↓
┌─────────────┬──────────────┬─────────────┬──────────────┐
│             │              │             │              │
RAG Engine  Ollama      SQLite      Learning Packages  File Processor
(ChromaDB)  (Local)     (History)   (storage/)        (OCR, PDF)
```

## 📁 Cấu Trúc

```
local-backend/
├── app/
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Configuration (local settings)
│   ├── database.py                # SQLite database setup
│   │
│   ├── api/v1/                    # API Endpoints
│   │   ├── chat.py                # Chat endpoints (stream, conversations)
│   │   ├── packages.py            # Package update endpoints
│   │   ├── feedback.py            # Feedback endpoints
│   │   ├── learning_package.py    # Learning package endpoints
│   │   └── offline_logs.py        # Offline logs
│   │
│   ├── services/                  # Business Logic Services
│   │   ├── rag_service.py         # RAG engine (ChromaDB)
│   │   ├── chat_service.py        # Chat logic
│   │   ├── ollama_service.py      # Ollama client
│   │   ├── package_service.py     # Model package management
│   │   ├── learning_package_service.py  # Learning package management
│   │   ├── feedback_service.py    # Feedback sending
│   │   └── file_processor.py      # File processing (OCR, PDF, DOCX)
│   │
│   ├── models/                    # SQLAlchemy Models
│   │   └── conversation.py       # Conversation model (SQLite)
│   │
│   └── schemas/                   # Pydantic Schemas
│       └── chat.py                # Request/Response schemas
│
├── storage/                       # Local Storage
│   ├── databases/                 # SQLite files
│   │   └── chat_history.db
│   ├── logs/                      # Application logs
│   └── learning-packages/         # Downloaded learning packages
│
├── requirements.txt               # Python dependencies
└── README.md
```

## 🚀 Cài Đặt

```bash
cd student-app/local-backend
python3 -m venv venv  # hoặc .venv
source venv/bin/activate  # hoặc .venv/bin/activate
pip install -r requirements.txt
```

## ⚙️ Cấu Hình

Tạo file `.env`:

```env
# Ollama (Local - Required)
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3

# Model Packages (Local)
MODEL_PACKAGES_DIR=../../storage/model-packages

# Remote API (Optional - cho telemetry, feedback, updates)
REMOTE_API_URL=http://localhost:8001
FEEDBACK_ENABLED=true
TELEMETRY_ENABLED=true

# Database (SQLite - Local)
DATABASE_URL=./storage/databases/chat_history.db
```

## ▶️ Chạy

### Development

```bash
uvicorn app.main:app --reload --port 8000
```

### Production

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Từ Script

```bash
# Từ project root
bash scripts/start/start_student_app.sh
```

## 📡 API Endpoints

### Chat

- `POST /api/v1/chat/stream` - Stream chat response (SSE)
  - Body: `{ question, user_id, conversation_id, files? }`
  - Response: Server-Sent Events stream

- `GET /api/v1/chat/conversations?user_id={id}` - Lấy danh sách conversations

- `GET /api/v1/chat/conversations/{id}/history` - Lấy lịch sử conversation

- `DELETE /api/v1/chat/conversations/{id}` - Xóa conversation

- `GET /api/v1/chat/conversations/new?user_id={id}` - Tạo conversation mới

### Packages

- `GET /api/v1/packages/current` - Lấy danh sách packages hiện tại
- `POST /api/v1/packages/check` - Check for package updates
- `POST /api/v1/packages/update` - Update một package
- `POST /api/v1/packages/update-all` - Update tất cả packages

### Learning Package

- `GET /api/v1/learning-package/current` - Lấy thông tin learning package hiện tại
- `POST /api/v1/learning-package/check` - Check for learning package update
- `POST /api/v1/learning-package/install` - Install learning package

### Feedback

- `POST /api/v1/feedback/send` - Gửi feedback đến remote API

### Health

- `GET /health` - Health check

## 🔄 Luồng Chat (100% Local)

1. **Desktop App** gửi request đến `http://localhost:8000/api/v1/chat/stream`
2. **Local Backend**:
   - Load conversation history từ SQLite
   - Process uploaded files (nếu có) → extract text
   - Gọi RAG engine để tìm context từ learning packages hoặc model packages
   - Build prompt với context + history + file content
   - Gọi Ollama (local) để generate response
   - Stream response về Desktop App (SSE)
   - Lưu conversation vào SQLite

## 📦 RAG Engine

RAG engine load từ:
1. **Learning Packages** (ưu tiên): `storage/learning-packages/{version}/rag_index/`
2. **Model Packages** (fallback): `storage/model-packages/{subject}_v{version}/`

### Learning Package Structure

```
learning-packages/
└── 1.2.3/
    ├── rag_index/
    │   └── chroma_db/        # ChromaDB persistent storage
    ├── embeddings/
    ├── config/
    │   └── model_config.json
    └── scripts/
```

## 💾 Storage

### Databases

- **Conversations**: `storage/databases/chat_history.db` (SQLite)
  - Tables: `conversations`, `messages`

### Logs

- **Application logs**: `storage/logs/`
- **Query logs**: `storage/logs/query.log`
- **Telemetry logs**: `storage/logs/telemetry.log`

### Learning Packages

- **Downloaded packages**: `storage/learning-packages/{version}/`
- **Current version info**: `storage/learning-packages/current_version.json`

## 🔨 Build Executable

```bash
# Build với PyInstaller
pyinstaller build_backend.spec

# Output: dist/ai-learning-backend/
```

Executable này sẽ được bundle vào desktop app.

## 🔑 Tính Năng

### File Processing

- **Images**: OCR với pytesseract (nếu cài đặt)
- **PDF**: Text extraction với PyPDF2
- **DOCX**: Text extraction với python-docx
- **Text files**: Direct reading

### Package Management

- Download và extract model packages
- Download và install learning packages
- Verify package hash (SHA-256)
- Auto-reload RAG engine sau khi update

### Offline Support

- Hoạt động hoàn toàn offline sau khi đăng nhập lần đầu
- Queue telemetry và feedback khi offline
- Sync khi online lại

## 🐛 Troubleshooting

### Ollama không chạy

```bash
# Start Ollama
ollama serve

# Pull model
ollama pull llama3
```

### RAG Engine không load

- Kiểm tra learning packages hoặc model packages có trong `storage/`
- Xem logs trong console
- Kiểm tra ChromaDB có thể access được không

### Port 8000 đã được dùng

```bash
# Tìm process đang dùng port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

### File processing lỗi

- Cài đặt optional dependencies:
  ```bash
  pip install Pillow pytesseract PyPDF2 python-docx
  ```
- Cài đặt Tesseract OCR (cho image OCR):
  ```bash
  # macOS
  brew install tesseract

  # Ubuntu
  sudo apt-get install tesseract-ocr
  ```

## 📚 Tài Liệu Liên Quan

- [Desktop App README](../desktop/README.md)
- [Learning Package Structure](../../docs/LEARNING_PACKAGE_STRUCTURE.md)
- [Version Management Guide](../../docs/VERSION_MANAGEMENT_GUIDE.md)

## ⚠️ Lưu Ý

- ✅ **100% Local**: Không phụ thuộc server cho chat
- ✅ **Offline**: Hoạt động hoàn toàn offline (sau khi đăng nhập lần đầu)
- ✅ **Privacy**: Data không gửi lên server (trừ telemetry optional)
- ⚠️ **Remote API**: Chỉ dùng cho authentication, telemetry, updates (optional)
- ⚠️ **Ollama Required**: Cần Ollama đã cài và model đã pull

