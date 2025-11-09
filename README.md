# 🤖 AI Personalized Learning System

Hệ thống học tập AI cá nhân hóa cho sinh viên FPT Polytechnic.

## 🏗️ Kiến trúc

### Local-First Architecture
- **Toàn bộ xử lý chính chạy LOCAL trên máy sinh viên**
- Chat, RAG, AI generation → 100% local
- Remote API chỉ dùng cho: Authentication, Telemetry, Updates

## 📁 Cấu trúc Dự án

```
AI_PersonalizedU/
├── student-app/          # 🎓 Phần mềm sinh viên
│   ├── desktop/         # Desktop app (Electron + React)
│   └── local-backend/   # Local backend (FastAPI - chat, RAG, Ollama)
│
├── remote-api/          # 🌐 API Server của trường
│   └── app/            # FastAPI (auth, telemetry, updates)
│
├── admin-dashboard/     # 👨‍💼 Web quản trị
│   └── src/            # React dashboard
│
├── data-pipeline/       # 📊 Xử lý và build model packages
│
├── storage/             # 💾 Lưu trữ (model packages, logs)
│
├── scripts/             # 🔧 Build & deployment scripts
│
└── docs/                # 📚 Documentation
```

Xem chi tiết: [docs/FINAL_STRUCTURE.md](docs/FINAL_STRUCTURE.md)

**Bắt đầu nhanh**: [docs/QUICK_START.md](docs/QUICK_START.md)

## 🚀 Quick Start

### 1. Build Data Pipeline
```bash
./scripts/build/build_data_pipeline.sh
```

### 2. Start Student App
```bash
./scripts/start/start_student_app.sh
```

### 3. Start Remote API (nếu cần)
```bash
cd remote-api
# Tạo .env với DATABASE_URL và JWT_SECRET_KEY
./scripts/start/start_remote_api.sh
```

## 📚 Documentation

Xem [docs/README.md](docs/README.md) để biết danh sách đầy đủ.

**Tài liệu chính**:
- [Quick Start](docs/QUICK_START.md) - Bắt đầu nhanh
- [Cấu trúc Dự án](docs/FINAL_STRUCTURE.md) - Cấu trúc chi tiết
- [Trạng thái Dự án](docs/PROJECT_STATUS.md) - Tiến độ hiện tại
- [Kiến trúc](docs/architecture.md) - Kiến trúc hệ thống

## 🔑 Key Points

### Student App (Local)
- ✅ Chạy trên máy sinh viên (localhost:8000)
- ✅ Xử lý chat, RAG, Ollama (100% local)
- ✅ Lưu conversation history (SQLite)
- ✅ Gửi telemetry đến remote API (optional)

### Remote API (Server)
- ✅ Chạy trên server
- ✅ Authentication (JWT)
- ✅ Telemetry collection
- ✅ Version management
- ❌ KHÔNG xử lý chat/RAG/AI

## 🛠️ Development

Xem [docs/](docs/) để biết chi tiết về:
- Architecture
- Implementation plan
- API documentation
- Build instructions

## 📦 Build

```bash
# Build all
./scripts/build/build_all.sh

# Hoặc build từng component
./scripts/build/build_student_app.sh
```

## 🔒 Security

- JWT authentication
- Local data encryption
- HTTPS for remote API
- Input validation
