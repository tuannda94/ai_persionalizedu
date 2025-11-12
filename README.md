# 🤖 AI Personalized Learning System

Hệ thống học tập AI cá nhân hóa cho sinh viên FPT Polytechnic - Hỗ trợ học tập thông minh với RAG (Retrieval-Augmented Generation) và AI local-first.

## 📋 Tổng Quan

Hệ thống gồm **4 components chính**:

1. **Student App** - Ứng dụng desktop cho sinh viên (Electron + React + Local Backend)
2. **Remote API** - API server của trường (FastAPI + PostgreSQL)
3. **Admin Dashboard** - Web quản trị (React + Vite)
4. **Data Pipeline** - Xử lý và build learning packages

### 🎯 Kiến Trúc Local-First

- ✅ **100% Local Processing**: Chat, RAG, AI generation chạy hoàn toàn trên máy sinh viên
- ✅ **Offline Support**: Hoạt động offline sau khi đăng nhập lần đầu
- ✅ **Privacy First**: Dữ liệu conversation không gửi lên server
- ✅ **Remote API**: Chỉ dùng cho authentication, telemetry, và version updates

## 🏗️ Cấu Trúc Dự Án

```
AI_PersonalizedU/
├── student-app/              # 🎓 Phần mềm sinh viên
│   ├── desktop/              # Desktop app (Electron + React)
│   │   ├── src/
│   │   │   ├── main/         # Electron main process
│   │   │   ├── renderer/     # React UI components
│   │   │   └── preload/      # Preload scripts (IPC bridge)
│   │   ├── resources/        # Icons, assets
│   │   └── package.json
│   │
│   └── local-backend/        # Local backend (FastAPI)
│       ├── app/
│       │   ├── api/v1/       # API endpoints (chat, packages, feedback)
│       │   ├── services/     # RAG, chat, file processing services
│       │   ├── models/       # SQLAlchemy models
│       │   └── schemas/      # Pydantic schemas
│       └── storage/          # SQLite databases, logs
│
├── remote-api/               # 🌐 API Server của trường
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   │   ├── auth.py      # Authentication
│   │   │   ├── users.py     # User management
│   │   │   ├── updates.py   # Version management
│   │   │   ├── packages.py  # Model packages
│   │   │   ├── feedback.py  # Feedback system
│   │   │   ├── telemetry.py # Telemetry collection
│   │   │   ├── documents.py # Document management
│   │   │   └── files.py     # File hosting
│   │   ├── models/          # Database models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── core/            # Security, utilities
│   ├── migrations/          # Database migrations
│   └── scripts/             # Utility scripts
│
├── admin-dashboard/          # 👨‍💼 Web quản trị
│   ├── src/
│   │   ├── pages/           # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Versions.jsx
│   │   │   ├── Packages.jsx
│   │   │   ├── Feedback.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Documents.jsx
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API client
│   │   └── utils/           # Utilities
│   └── package.json
│
├── data-pipeline/           # 📊 Xử lý và build learning packages
│   ├── embed_and_build_package.py
│   └── sample_texts/        # Sample learning materials
│
├── storage/                 # 💾 Lưu trữ dữ liệu
│   ├── model-packages/      # RAG model packages (output từ data-pipeline)
│   ├── databases/           # Shared databases (nếu cần)
│   └── logs/                # Shared logs
│
├── scripts/                 # 🔧 Automation scripts
│   ├── start/               # Start scripts
│   │   ├── start_all.sh     # Start tất cả services
│   │   ├── start_remote_api.sh
│   │   └── start_student_app.sh
│   ├── build/               # Build scripts
│   │   ├── build_all.sh
│   │   ├── build_data_pipeline.sh
│   │   └── build_student_app.sh
│   ├── setup/               # Setup scripts
│   └── test/                # Test scripts
│
└── docs/                    # 📚 Documentation
    ├── README.md            # Documentation index
    ├── QUICK_START.md       # Quick start guide
    ├── architecture.md      # System architecture
    ├── VERSION_MANAGEMENT_GUIDE.md
    ├── LEARNING_PACKAGE_STRUCTURE.md
    └── ...
```

## 🚀 Quick Start

### Yêu Cầu

- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL** (cho Remote API)
- **Ollama** (đã cài và có model, ví dụ: `llama3`)

### Bước 1: Clone và Setup

```bash
git clone <repository-url>
cd AI_PersonalizedU
```

### Bước 2: Setup Remote API (Nếu cần)

```bash
cd remote-api
python3 -m venv venv
source venv/bin/activate  # hoặc .venv/bin/activate trên Windows
pip install -r requirements.txt

# Tạo file .env
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/poly_ai_db
JWT_SECRET_KEY=your-secret-key-here-change-in-production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
ADMIN_EMAIL=admin@fpt.edu.vn
ADMIN_PASSWORD=changeme
EOF

# Chạy migration (nếu cần)
bash migrations/run_add_learning_package_migration.sh

# Tạo dữ liệu mẫu (optional)
python3 scripts/create_sample_data.py
```

### Bước 3: Setup Student App

```bash
cd student-app/local-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Tạo file .env (optional)
cat > .env << EOF
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3
REMOTE_API_URL=http://localhost:8001
FEEDBACK_ENABLED=true
TELEMETRY_ENABLED=true
EOF

cd ../desktop
npm install
```

### Bước 4: Setup Admin Dashboard

```bash
cd admin-dashboard
npm install

# Tạo file .env
cat > .env << EOF
VITE_API_URL=http://localhost:8001
EOF
```

### Bước 5: Build Data Pipeline (Tạo Learning Packages)

```bash
# Từ project root
bash scripts/build/build_data_pipeline.sh
```

### Bước 6: Start Tất Cả Services

```bash
# Từ project root
bash scripts/start/start_all.sh
```

Hoặc start từng service riêng:

```bash
# Start Remote API
bash scripts/start/start_remote_api.sh

# Start Admin Dashboard (terminal mới)
cd admin-dashboard && npm run dev

# Start Student App
bash scripts/start/start_student_app.sh
```

## 📚 Documentation

### Tài Liệu Chính

- **[Quick Start Guide](docs/QUICK_START.md)** - Hướng dẫn bắt đầu nhanh
- **[System Architecture](docs/architecture.md)** - Kiến trúc hệ thống chi tiết
- **[Project Structure](docs/FINAL_STRUCTURE.md)** - Cấu trúc dự án
- **[Version Management Guide](docs/VERSION_MANAGEMENT_GUIDE.md)** - Quản lý phiên bản
- **[Learning Package Structure](docs/LEARNING_PACKAGE_STRUCTURE.md)** - Cấu trúc learning package

### Component READMEs

- [Student App - Desktop](student-app/desktop/README.md)
- [Student App - Local Backend](student-app/local-backend/README.md)
- [Remote API](remote-api/README.md)
- [Admin Dashboard](admin-dashboard/README.md)

### Tài Liệu Tham Khảo

- [API Documentation](docs/api.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Storage Architecture](docs/STORAGE_ARCHITECTURE.md)
- [MinIO Setup](docs/MINIO_SETUP.md)

## 🔑 Tính Năng Chính

### Student App

- ✅ **Chat với AI**: Hỏi đáp về học liệu với RAG + Ollama (100% local)
- ✅ **File Upload**: Hỏi đáp bằng hình ảnh và các loại file (OCR, PDF, DOCX)
- ✅ **Conversation History**: Lưu trữ lịch sử chat (SQLite local)
- ✅ **Auto Update**: Tự động kiểm tra và cập nhật app + learning packages
- ✅ **Offline Mode**: Hoạt động offline sau khi đăng nhập
- ✅ **Feedback System**: Gửi feedback về bugs, suggestions

### Remote API

- ✅ **Authentication**: JWT-based authentication
- ✅ **User Management**: Quản lý users, roles
- ✅ **Version Management**: Quản lý app versions và learning packages
- ✅ **Telemetry**: Thu thập dữ liệu sử dụng (optional)
- ✅ **Feedback System**: Xử lý feedback từ students
- ✅ **File Hosting**: Host installer files và learning packages

### Admin Dashboard

- ✅ **User Management**: CRUD users, quản lý roles
- ✅ **Version Management**: Upload versions, learning packages, publish/unpublish
- ✅ **Package Management**: Quản lý model packages
- ✅ **Analytics**: Xem thống kê telemetry, usage patterns
- ✅ **Feedback Management**: Xem và xử lý feedback
- ✅ **Document Management**: Upload và quản lý tài liệu

## 🛠️ Development

### Tech Stack

**Student App:**
- Electron (Desktop framework)
- React (UI framework)
- FastAPI (Local backend)
- SQLite (Local database)
- ChromaDB (Vector database cho RAG)
- Ollama (Local LLM)

**Remote API:**
- FastAPI (API framework)
- PostgreSQL (Database)
- SQLAlchemy (ORM)
- Pydantic (Data validation)
- JWT (Authentication)

**Admin Dashboard:**
- React 18
- Vite (Build tool)
- Ant Design (UI components)
- React Router (Routing)
- Axios (HTTP client)

### Scripts

**Start Scripts:**
- `scripts/start/start_all.sh` - Start tất cả services
- `scripts/start/start_remote_api.sh` - Start Remote API
- `scripts/start/start_student_app.sh` - Start Student App

**Build Scripts:**
- `scripts/build/build_all.sh` - Build tất cả
- `scripts/build/build_data_pipeline.sh` - Build learning packages
- `scripts/build/build_student_app.sh` - Build Student App executable

**Test Scripts:**
- `scripts/test/test_all.sh` - Test tất cả features
- `scripts/test/test_api_endpoints.sh` - Test API endpoints

## 🔒 Security

- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Password Hashing**: Bcrypt password hashing
- ✅ **CORS Configuration**: Proper CORS setup
- ✅ **Input Validation**: Pydantic validation
- ✅ **SQL Injection Protection**: SQLAlchemy ORM
- ✅ **HTTPS Support**: Production-ready HTTPS

## 📦 Version Management

Hệ thống hỗ trợ quản lý phiên bản với:

- **App Versions**: Installer files (.exe, .dmg, .AppImage)
- **Learning Packages**: Embeddings, RAG index, config, scripts
- **Auto Update**: Tự động kiểm tra và download updates
- **Mandatory Updates**: Force update cho critical versions

Xem chi tiết: [VERSION_MANAGEMENT_GUIDE.md](docs/VERSION_MANAGEMENT_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Specify license here]

## 📞 Support

- **Documentation**: Xem [docs/](docs/) folder
- **Issues**: Tạo issue trên GitHub
- **Email**: [contact email]

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app support
- [ ] Collaborative features
- [ ] Advanced RAG optimizations

---

**Last Updated**: 2024-11-12
