# 📁 Cấu Trúc Dự Án Chi Tiết

## Tổng Quan

Dự án được tổ chức thành **4 components độc lập** với mục đích và trách nhiệm rõ ràng:

1. **Student App** - Phần mềm desktop cho sinh viên
2. **Remote API** - API server của trường
3. **Admin Dashboard** - Web quản trị
4. **Data Pipeline** - Xử lý và build learning packages

## Cấu Trúc Thư Mục Chi Tiết

```
AI_PersonalizedU/
│
├── student-app/                    # 🎓 PHẦN MỀM SINH VIÊN
│   │
│   ├── desktop/                    # Desktop Application (Electron)
│   │   ├── src/
│   │   │   ├── main/               # Electron Main Process
│   │   │   │   ├── main.js         # Main entry point, window management
│   │   │   │   ├── backend_launcher.js  # Start/stop local backend
│   │   │   │   └── updater.js      # Auto-update mechanism
│   │   │   │
│   │   │   ├── preload/            # Preload Scripts (IPC Bridge)
│   │   │   │   └── preload.js      # Expose APIs to renderer
│   │   │   │
│   │   │   └── renderer/          # React Renderer Process
│   │   │       └── src/
│   │   │           ├── renderer.js        # Main React component
│   │   │           ├── components/         # React components
│   │   │           │   ├── LoginModal.jsx
│   │   │           │   ├── FeedbackModal.jsx
│   │   │           │   ├── FileUpload.jsx
│   │   │           │   ├── LearningPackageUpdateModal.jsx
│   │   │           │   └── MarkdownRenderer.jsx
│   │   │           ├── components.js      # Inline components
│   │   │           └── polyfills/          # Polyfills for browser compatibility
│   │   │
│   │   ├── resources/              # Resources
│   │   │   └── icons/              # App icons
│   │   │
│   │   ├── index.html              # HTML entry point
│   │   ├── package.json            # Dependencies và scripts
│   │   └── electron-builder.yml    # Electron builder config
│   │
│   └── local-backend/              # Local Backend (FastAPI)
│       ├── app/
│       │   ├── main.py             # FastAPI app entry point
│       │   ├── config.py           # Configuration (local settings)
│       │   ├── database.py         # SQLite database setup
│       │   │
│       │   ├── api/v1/             # API Endpoints
│       │   │   ├── chat.py         # Chat endpoints (stream, conversations)
│       │   │   ├── packages.py    # Package update endpoints
│       │   │   ├── feedback.py     # Feedback endpoints
│       │   │   ├── learning_package.py  # Learning package endpoints
│       │   │   └── offline_logs.py # Offline logs
│       │   │
│       │   ├── services/           # Business Logic Services
│       │   │   ├── rag_service.py      # RAG engine (ChromaDB)
│       │   │   ├── chat_service.py     # Chat logic
│       │   │   ├── ollama_service.py   # Ollama client
│       │   │   ├── package_service.py  # Model package management
│       │   │   ├── learning_package_service.py  # Learning package management
│       │   │   ├── feedback_service.py # Feedback sending
│       │   │   └── file_processor.py   # File processing (OCR, PDF, etc.)
│       │   │
│       │   ├── models/             # SQLAlchemy Models
│       │   │   └── conversation.py # Conversation model (SQLite)
│       │   │
│       │   └── schemas/            # Pydantic Schemas
│       │       └── chat.py         # Request/Response schemas
│       │
│       ├── storage/                # Local Storage
│       │   ├── databases/          # SQLite files
│       │   │   └── chat_history.db
│       │   ├── logs/               # Application logs
│       │   └── learning-packages/ # Downloaded learning packages
│       │
│       ├── requirements.txt        # Python dependencies
│       └── README.md
│
├── remote-api/                     # 🌐 API SERVER CỦA TRƯỜNG
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── config.py               # Server configuration
│   │   ├── database.py             # PostgreSQL setup
│   │   │
│   │   ├── api/v1/                 # API Endpoints
│   │   │   ├── auth.py             # Authentication (login, refresh, me)
│   │   │   ├── users.py            # User management (CRUD)
│   │   │   ├── updates.py           # Version management
│   │   │   │   ├── POST /check     # Check for updates
│   │   │   │   ├── GET /versions   # List versions
│   │   │   │   ├── POST /admin/versions/upload  # Upload version
│   │   │   │   └── PUT /admin/versions/{id}     # Update version
│   │   │   │
│   │   │   ├── packages.py         # Model package management
│   │   │   │   ├── GET /list       # List packages
│   │   │   │   ├── POST /check     # Check package updates
│   │   │   │   └── POST /admin/upload  # Upload package
│   │   │   │
│   │   │   ├── feedback.py         # Feedback system
│   │   │   │   ├── POST /          # Create feedback
│   │   │   │   ├── GET /           # List feedback (admin)
│   │   │   │   └── PUT /{id}       # Update feedback (admin)
│   │   │   │
│   │   │   ├── telemetry.py        # Telemetry collection
│   │   │   │   ├── POST /          # Submit telemetry
│   │   │   │   └── GET /stats      # Get statistics (admin)
│   │   │   │
│   │   │   ├── documents.py       # Document management
│   │   │   ├── files.py            # File hosting/download
│   │   │   └── __init__.py
│   │   │
│   │   ├── models/                 # SQLAlchemy Models
│   │   │   ├── user.py             # User model
│   │   │   ├── version.py          # AppVersion, UpdateLog models
│   │   │   ├── package.py          # ModelPackage model
│   │   │   ├── feedback.py         # Feedback model
│   │   │   ├── telemetry.py        # Telemetry model
│   │   │   └── document.py         # Document model
│   │   │
│   │   ├── schemas/                # Pydantic Schemas
│   │   │   ├── user.py             # User schemas
│   │   │   ├── version.py          # Version schemas
│   │   │   ├── package.py         # Package schemas
│   │   │   ├── feedback.py         # Feedback schemas
│   │   │   ├── telemetry.py        # Telemetry schemas
│   │   │   └── document.py         # Document schemas
│   │   │
│   │   ├── services/               # Business Logic Services
│   │   │   ├── file_service.py    # File upload/download (local/MinIO)
│   │   │   └── minio_service.py   # MinIO client (optional)
│   │   │
│   │   └── core/                   # Core Utilities
│   │       └── security.py        # JWT, password hashing, auth dependencies
│   │
│   ├── migrations/                # Database Migrations
│   │   ├── add_learning_package_to_versions.sql
│   │   ├── create_feedback_table.sql
│   │   ├── create_model_packages_table.sql
│   │   ├── run_add_learning_package_migration.sh
│   │   └── run_migration.py
│   │
│   ├── scripts/                    # Utility Scripts
│   │   ├── create_sample_data.py  # Create sample data for testing
│   │   └── create_sample_data.sh
│   │
│   ├── storage/                    # Server Storage (local or MinIO)
│   │   ├── installers/            # App installer files
│   │   ├── packages/               # Model package files
│   │   ├── learning-packages/      # Learning package files
│   │   └── documents/              # Document files
│   │
│   ├── requirements.txt            # Python dependencies
│   └── README.md
│
├── admin-dashboard/                # 👨‍💼 WEB QUẢN TRỊ
│   ├── src/
│   │   ├── pages/                  # Page Components
│   │   │   ├── Dashboard.jsx       # Overview dashboard
│   │   │   ├── Users.jsx           # User management
│   │   │   ├── Versions.jsx        # Version management
│   │   │   ├── Packages.jsx         # Package management
│   │   │   ├── Feedback.jsx        # Feedback management
│   │   │   ├── Analytics.jsx       # Analytics/telemetry stats
│   │   │   ├── Documents.jsx       # Document management
│   │   │   └── Login.jsx            # Login page
│   │   │
│   │   ├── components/             # Reusable Components
│   │   │   ├── ProtectedRoute.jsx  # Route protection
│   │   │   └── AuthStatus.jsx      # Auth status indicator
│   │   │
│   │   ├── services/               # API Client
│   │   │   ├── api.js              # Axios client với interceptors
│   │   │   └── errorHandler.js     # Error handling utilities
│   │   │
│   │   ├── utils/                  # Utilities
│   │   │   └── errorHandler.js     # Error handling
│   │   │
│   │   ├── App.antd.jsx            # Main App component (Ant Design)
│   │   ├── App.jsx                 # Alternative App component
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Global styles
│   │
│   ├── public/                     # Static files
│   ├── index.html                  # HTML entry point
│   ├── package.json                # Dependencies
│   ├── vite.config.js              # Vite configuration
│   └── README.md
│
├── data-pipeline/                  # 📊 DATA PIPELINE
│   ├── embed_and_build_package.py  # Main script: chunk, embed, build packages
│   ├── requirements.txt            # Python dependencies
│   └── sample_texts/               # Sample learning materials
│       ├── CS101/                  # Computer Science 101
│       ├── CS102/                  # Data Structures
│       ├── PHP1/                   # Programming Fundamentals 1
│       ├── PHP2/                   # Programming Fundamentals 2
│       └── PHP3/                   # Advanced Programming
│
├── storage/                        # 💾 SHARED STORAGE
│   ├── model-packages/             # RAG Model Packages (output từ data-pipeline)
│   │   ├── CS101_v1/
│   │   ├── CS102_v1/
│   │   └── ...
│   ├── databases/                  # Shared databases (nếu cần)
│   └── logs/                       # Shared logs
│       ├── query.log
│       └── telemetry.log
│
├── scripts/                        # 🔧 AUTOMATION SCRIPTS
│   ├── start/                      # Start Scripts
│   │   ├── start_all.sh            # Start tất cả services
│   │   ├── start_remote_api.sh     # Start Remote API
│   │   ├── start_student_app.sh    # Start Student App
│   │   └── start_dev.sh            # Development mode
│   │
│   ├── build/                      # Build Scripts
│   │   ├── build_all.sh            # Build tất cả
│   │   ├── build_data_pipeline.sh  # Build learning packages
│   │   └── build_student_app.sh    # Build Student App executable
│   │
│   ├── setup/                      # Setup Scripts
│   │   ├── setup_minio.sh          # Setup MinIO storage
│   │   └── init_minio_buckets.py   # Initialize MinIO buckets
│   │
│   ├── test/                       # Test Scripts
│   │   ├── test_all.sh             # Test tất cả features
│   │   ├── test_api_endpoints.sh   # Test API endpoints
│   │   ├── test_backend_connection.sh
│   │   ├── test_feedback.sh
│   │   └── ...
│   │
│   └── verify_scripts.sh           # Verify all scripts
│
├── docs/                           # 📚 DOCUMENTATION
│   ├── README.md                   # Documentation index
│   ├── QUICK_START.md              # Quick start guide
│   ├── architecture.md              # System architecture
│   ├── PROJECT_STRUCTURE.md        # This file
│   ├── VERSION_MANAGEMENT_GUIDE.md # Version management guide
│   ├── LEARNING_PACKAGE_STRUCTURE.md # Learning package structure
│   ├── api.md                      # API documentation
│   ├── TESTING_GUIDE.md            # Testing guide
│   ├── troubleshooting.md          # Troubleshooting
│   ├── STORAGE_ARCHITECTURE.md     # Storage architecture
│   ├── MINIO_SETUP.md              # MinIO setup guide
│   └── archive/                     # Archived documentation
│
├── .gitignore                      # Git ignore rules
└── README.md                       # Main README
```

## Chi Tiết Từng Component

### 1. Student App (`student-app/`)

**Mục đích**: Phần mềm desktop cho sinh viên để học tập với AI

#### Desktop (`desktop/`)

**Tech Stack**: Electron + React + Webpack

**Chức năng**:
- UI cho chat interface
- Quản lý conversations
- Authentication UI
- File upload (hình ảnh, PDF, DOCX)
- Markdown rendering
- Auto-update notifications
- Learning package update UI

**Key Files**:
- `src/main/main.js`: Electron main process, window management, backend launcher
- `src/main/updater.js`: Auto-update mechanism, learning package updates
- `src/preload/preload.js`: IPC bridge, expose APIs to renderer
- `renderer/src/renderer.js`: Main React component
- `renderer/src/components/`: React components (Login, Feedback, FileUpload, etc.)

#### Local Backend (`local-backend/`)

**Tech Stack**: FastAPI + SQLite + ChromaDB + Ollama

**Chức năng**:
- Chat endpoints với streaming
- RAG engine (tìm context từ learning packages)
- Ollama integration (generate AI responses)
- Conversation history (SQLite)
- File processing (OCR, PDF, DOCX extraction)
- Package update management
- Learning package download/install
- Feedback sending (to remote API)
- Telemetry (gửi đến remote API - optional)

**Key Files**:
- `app/main.py`: FastAPI app entry point
- `app/services/rag_service.py`: RAG engine với ChromaDB
- `app/services/ollama_service.py`: Ollama client
- `app/services/file_processor.py`: File processing (OCR, PDF, DOCX)
- `app/services/learning_package_service.py`: Learning package management
- `app/api/v1/chat.py`: Chat streaming endpoint

### 2. Remote API (`remote-api/`)

**Mục đích**: API server của trường, xử lý authentication, telemetry, version management

**Tech Stack**: FastAPI + PostgreSQL + SQLAlchemy

**Chức năng**:
- Authentication (JWT tokens)
- User management (CRUD)
- Version management (app versions + learning packages)
- Model package management
- Feedback collection và processing
- Telemetry collection và analytics
- Document management
- File hosting (installers, packages, documents)

**KHÔNG xử lý**:
- ❌ Chat/AI generation (chạy local trên máy sinh viên)
- ❌ RAG engine (chạy local)
- ❌ Ollama (chạy local)

**Key Files**:
- `app/main.py`: FastAPI app, CORS setup
- `app/core/security.py`: JWT, password hashing, auth dependencies
- `app/api/v1/auth.py`: Authentication endpoints
- `app/api/v1/updates.py`: Version management endpoints
- `app/api/v1/packages.py`: Model package endpoints
- `app/api/v1/feedback.py`: Feedback endpoints
- `app/services/file_service.py`: File upload/download (local/MinIO)

### 3. Admin Dashboard (`admin-dashboard/`)

**Mục đích**: Web interface cho quản trị viên

**Tech Stack**: React 18 + Vite + Ant Design

**Chức năng**:
- User management (CRUD, roles)
- Version management (upload, publish, learning packages)
- Package management (upload, activate/deactivate)
- Feedback management (view, assign, resolve)
- Analytics (telemetry stats, usage patterns)
- Document management

**Key Files**:
- `src/pages/Versions.jsx`: Version management với learning package support
- `src/pages/Users.jsx`: User management
- `src/pages/Packages.jsx`: Package management
- `src/pages/Feedback.jsx`: Feedback management
- `src/pages/Analytics.jsx`: Analytics dashboard
- `src/services/api.js`: API client với interceptors

### 4. Data Pipeline (`data-pipeline/`)

**Mục đích**: Xử lý và build learning packages từ raw text

**Chức năng**:
- Đọc sample texts từ `sample_texts/`
- Chunk text thành segments
- Tạo embeddings (vector representations)
- Build ChromaDB index
- Output model packages vào `storage/model-packages/`

**Key Files**:
- `embed_and_build_package.py`: Main script

## Data Flow

### Chat Flow (100% Local)

```
Student Desktop App
    ↓ HTTP Request
Local Backend (localhost:8000)
    ↓
┌─────────────┬──────────────┬─────────────┐
│             │              │             │
RAG Engine  Ollama      SQLite      Learning Packages
(ChromaDB)  (Local)     (History)   (storage/learning-packages/)
```

### Authentication Flow

```
Student Desktop App
    ↓ HTTPS Request
Remote API (api.fpt.edu.vn)
    ↓
PostgreSQL Database
    ↓
JWT Tokens → Desktop App (stored locally)
```

### Update Flow

```
Student Desktop App
    ↓ Check for updates (periodic)
Remote API
    ↓
┌─────────────────┬──────────────────┐
│                 │                  │
App Update    Learning Package   Notification
(Installer)   (ZIP file)         (Modal)
```

## Storage Locations

### Local Storage (Student App)

- **Conversations**: `student-app/local-backend/storage/databases/chat_history.db`
- **Logs**: `student-app/local-backend/storage/logs/`
- **Learning Packages**: `student-app/local-backend/storage/learning-packages/`

### Server Storage (Remote API)

- **Installers**: `remote-api/storage/installers/` (hoặc MinIO bucket)
- **Model Packages**: `remote-api/storage/packages/` (hoặc MinIO bucket)
- **Learning Packages**: `remote-api/storage/learning-packages/` (hoặc MinIO bucket)
- **Documents**: `remote-api/storage/documents/` (hoặc MinIO bucket)

### Shared Storage

- **Model Packages**: `storage/model-packages/` (output từ data-pipeline)
- **Logs**: `storage/logs/`

## Environment Variables

### Student App - Local Backend

```env
# Ollama
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3

# Remote API (Optional)
REMOTE_API_URL=http://localhost:8001
FEEDBACK_ENABLED=true
TELEMETRY_ENABLED=true
```

### Remote API

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/poly_ai_db

# JWT
JWT_SECRET_KEY=your-secret-key-here

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173

# Admin
ADMIN_EMAIL=admin@fpt.edu.vn
ADMIN_PASSWORD=changeme

# Storage
STORAGE_TYPE=local  # local or minio
```

### Admin Dashboard

```env
VITE_API_URL=http://localhost:8001
```

## Ports

- **Local Backend**: `8000`
- **Remote API**: `8001`
- **Admin Dashboard**: `3001` (dev), `3000` (alternative)
- **Ollama**: `11434` (default)

## Dependencies

### Python (Remote API, Local Backend)

- FastAPI
- SQLAlchemy
- Pydantic
- PostgreSQL driver (psycopg2)
- JWT (python-jose)
- Password hashing (passlib)
- ChromaDB (local backend)
- Requests (HTTP client)

### Node.js (Desktop, Admin Dashboard)

- Electron
- React
- Ant Design
- Webpack
- Vite
- Axios

## Development Workflow

1. **Setup**: Clone, install dependencies
2. **Build Data**: Run data pipeline để tạo learning packages
3. **Start Services**: Use `start_all.sh` hoặc start từng service
4. **Develop**: Make changes, test locally
5. **Test**: Run test scripts
6. **Build**: Build executables khi ready
7. **Deploy**: Deploy to production

## Best Practices

1. **Local-First**: Luôn ưu tiên xử lý local
2. **Error Handling**: Proper error handling và logging
3. **Security**: Validate inputs, use JWT, hash passwords
4. **Documentation**: Keep docs updated
5. **Testing**: Test before committing
6. **Version Control**: Use meaningful commit messages

