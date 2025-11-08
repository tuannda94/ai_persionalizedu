# Hướng dẫn chạy AI Personalized Learning App (Full Flow)

## Luồng hoạt động

```
Sinh viên mở app (Electron)
    ↓
Renderer (React) gửi câu hỏi qua FastAPI backend
    ↓
Backend gọi RAG engine:
  - Lấy các đoạn văn bản gần nhất trong ChromaDB
  - Ghép prompt
    ↓
Backend gửi request đến Model API (Ollama local)
    ↓
Model sinh câu trả lời và trả về backend
    ↓
Backend lưu log + gửi lại frontend hiển thị
    ↓
(Tùy chọn) Backend gửi telemetry về cloud server của trường
```

## Yêu cầu hệ thống

- Python 3.8+
- Node.js 16+
- Ollama đã được cài đặt
- Model Ollama đã được pull (mistral, llama3, hoặc phi3:mini)

## Bước 1: Cài đặt Ollama

### macOS/Linux:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows:
Download từ https://ollama.ai/download

### Pull model:
```bash
# Option 1: Mistral (recommended, ~4GB)
ollama pull mistral

# Option 2: Llama3 (~4.7GB)
ollama pull llama3

# Option 3: Phi-3-mini (nhẹ hơn, ~2GB)
ollama pull phi3:mini
```

## Bước 2: Build Vector Store (RAG)

```bash
cd data_pipeline
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Đảm bảo có cấu trúc: sample_texts/CS101/*.txt, CS102/*.txt, etc.
# Chạy script để build model packages
python embed_and_build_package.py
```

Output: `model_packages/CS101_v1/CS101_segments.jsonl` và `manifest.json`

## Bước 3: Setup Backend

```bash
cd backend

# Cài đặt dependencies
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Setup environment variables
source example_env.sh  # Windows: copy và set manually
# hoặc export:
# export OLLAMA_URL=http://localhost:11434/v1/generate
# export OLLAMA_MODEL=mistral

# (Tùy chọn) Setup cloud telemetry
# export CLOUD_TELEMETRY_URL=https://your-school-server.com/api/telemetry
# export TELEMETRY_API_KEY=your-api-key

# Start server
uvicorn app:app --reload --port 8000
# hoặc
python app.py
```

Backend sẽ chạy tại `http://localhost:8000`

### Kiểm tra backend:
```bash
curl http://localhost:8000/health
```

Response sẽ có:
```json
{
  "ok": true,
  "subjects": ["CS101", "CS102"],
  "rag_ready": true
}
```

## Bước 4: Setup Desktop App

```bash
cd desktop

# Cài đặt dependencies
npm install

# Build React renderer
npm run build
```

## Bước 5: Chạy ứng dụng

### Terminal 1: Backend
```bash
cd backend
source .venv/bin/activate
uvicorn app:app --reload --port 8000
```

### Terminal 2: Desktop App
```bash
cd desktop
npm start
```

## Sử dụng

1. Mở Electron app
2. Chọn môn học từ dropdown (tự động load từ backend)
3. Nhập câu hỏi (VD: "Giải thích về variables trong programming")
4. Click "Hỏi AI"
5. Xem kết quả từ RAG + Ollama

## Logs

Backend tự động lưu logs:
- `query.log`: Chi tiết các query đã xử lý
- `telemetry.log`: Telemetry events

Xem logs:
```bash
tail -f query.log
tail -f telemetry.log
```

## Troubleshooting

### Backend không load subjects:
- Kiểm tra `model_packages/` có chứa `*_v1/` folders
- Chạy lại `data_pipeline/embed_and_build_package.py`
- Kiểm tra console output của backend khi start

### Ollama không trả lời:
- Kiểm tra Ollama đang chạy: `ollama list`
- Kiểm tra model đã được pull: `ollama list`
- Kiểm tra OLLAMA_URL và OLLAMA_MODEL trong env
- Test Ollama manual: `curl http://localhost:11434/v1/generate -d '{"model":"mistral","prompt":"test"}'`

### Frontend không kết nối backend:
- Kiểm tra backend đang chạy: `curl http://localhost:8000/health`
- Kiểm tra CORS settings trong backend
- Kiểm tra console trong Electron DevTools

### RAG không tìm thấy segments:
- Kiểm tra ChromaDB collection đã được load (xem console khi backend start)
- Kiểm tra embeddings trong JSONL files
- Thử query với từ khóa đơn giản hơn

## Production Deployment

### Backend:
- Set `CLOUD_TELEMETRY_URL` để gửi telemetry về server trường
- Set `TELEMETRY_API_KEY` cho authentication
- Có thể deploy backend lên server riêng
- Frontend sẽ cần update `BACKEND_URL` environment variable

### Desktop App:
- Build production: `npm run build` (trong renderer/)
- Package với electron-builder
- Distribute installer (MSI/DMG/AppImage)

## Environment Variables

### Backend:
- `OLLAMA_URL`: URL của Ollama API (default: http://localhost:11434/v1/generate)
- `OLLAMA_MODEL`: Model name (default: mistral)
- `CLOUD_TELEMETRY_URL`: (Optional) Cloud server endpoint
- `TELEMETRY_API_KEY`: (Optional) API key cho cloud telemetry

### Desktop:
- `BACKEND_URL`: URL của backend API (default: http://localhost:8000)
