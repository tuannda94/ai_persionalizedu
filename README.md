# Poly Demo — AI Personalized Learning

Ứng dụng desktop AI hỗ trợ học tập cá nhân hóa sử dụng RAG (Retrieval-Augmented Generation) và LLM local.

## 🚀 Quick Start

### Bước 1: Build Data Pipeline (Vector Store)
```bash
./build_data_pipeline.sh
# hoặc
cd data_pipeline
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python embed_and_build_package.py
```

### Bước 2: Cài đặt Ollama và Pull Model
```bash
# Cài Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull model
ollama pull mistral
# hoặc
ollama pull llama3
```

### Bước 3: Start Backend
```bash
./start_backend.sh
# hoặc
cd backend
source .venv/bin/activate
uvicorn app:app --reload --port 8000
```

### Bước 4: Start Desktop App
```bash
./start_desktop.sh
# hoặc
cd desktop
npm install
npm run build
npm start
```

## 📋 Luồng hoạt động

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
(Tùy chọn) Backend gửi telemetry về cloud server
```

## 🏗️ Cấu trúc dự án

```
poly-demo/
├─ data_pipeline/          # Build model packages từ documents
│  ├─ embed_and_build_package.py
│  └─ sample_texts/        # sample_texts/CS101/*.txt, CS102/*.txt
├─ model_packages/         # Generated: CS101_v1/, CS102_v1/
├─ backend/                # FastAPI server
│  ├─ app.py
│  └─ requirements.txt
├─ desktop/                # Electron + React app
│  ├─ main.js
│  └─ renderer/
└─ docs/                   # Documentation
```

## ⚠️ Troubleshooting

### Lỗi: "Subject 'CS101' not loaded. Available: []"

**Nguyên nhân:** Model packages chưa được build.

**Giải pháp:**
```bash
./build_data_pipeline.sh
```

Hoặc thủ công:
```bash
cd data_pipeline
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python embed_and_build_package.py
```

Sau đó restart backend.

### Lỗi 404 khi POST /query

Xem [docs/troubleshooting.md](docs/troubleshooting.md)

## 📚 Documentation

- [Hướng dẫn chạy chi tiết](docs/run_instructions.md)
- [Troubleshooting](docs/troubleshooting.md)

## 📝 Notes

- Tất cả code là mẫu demo
- Trước khi dùng production, cần audit bảo mật
- Tuân thủ license của models (Mistral, Llama3, etc.)

## 📄 License

MIT
