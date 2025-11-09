# 📁 Cấu trúc Dự án - Tổ chức Chuyên nghiệp

## Nguyên tắc Tổ chức

1. **Desktop App**: Ứng dụng desktop (Electron + React)
2. **Backend API**: FastAPI backend service
3. **Admin Dashboard**: Web quản trị (React/Vue)
4. **Data Pipeline**: Xử lý và build model packages
5. **Storage**: Model packages, databases, logs
6. **Scripts**: Build và deployment scripts
7. **Docs**: Tài liệu

## Cấu trúc Thư mục

```
AI_PersonalizedU/
│
├── desktop/                       # 🖥️ DESKTOP APP
│   ├── src/
│   │   ├── main/                  # Electron main process
│   │   │   ├── main.js
│   │   │   └── backend_launcher.js
│   │   ├── preload/               # Preload scripts
│   │   │   └── preload.js
│   │   └── renderer/             # React renderer
│   │       ├── src/
│   │       │   └── renderer.js
│   │       └── webpack.config.js
│   ├── resources/                 # Resources (icons, assets)
│   │   └── icons/
│   ├── index.html
│   ├── package.json
│   └── electron-builder.yml
│
├── backend/                       # 🔌 LOCAL BACKEND (chạy trên máy sinh viên)
│   ├── app/                       # FastAPI application
│   │   ├── main.py               # Main FastAPI app
│   │   ├── config.py            # Configuration (local + remote API)
│   │   ├── database.py        # Database setup (SQLite local)
│   │   │
│   │   ├── api/v1/              # API endpoints
│   │   │   ├── auth.py         # Authentication
│   │   │   ├── chat.py         # Chat endpoints
│   │   │   └── updates.py      # Update management
│   │   │
│   │   ├── core/                # Core utilities
│   │   │   └── security.py     # JWT, password hashing
│   │   │
│   │   ├── models/              # Database models
│   │   │   ├── user.py
│   │   │   ├── conversation.py
│   │   │   └── version.py
│   │   │
│   │   ├── schemas/             # Pydantic schemas
│   │   │   ├── user.py
│   │   │   └── version.py
│   │   │
│   │   └── services/            # Business logic
│   │       ├── rag_service.py  # RAG engine
│   │       └── chat_service.py # Conversation management
│   │
│   ├── migrations/               # Alembic migrations
│   ├── storage/                  # LOCAL storage (chỉ trên máy sinh viên)
│   │   ├── databases/           # SQLite databases (conversations, user data)
│   │   └── logs/                # Application logs
│   │
│   ├── build_backend.spec       # PyInstaller spec
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── admin-dashboard/              # 🌐 ADMIN DASHBOARD
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Pages
│   │   ├── services/            # API services
│   │   └── App.jsx
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── data-pipeline/                # 📊 DATA PIPELINE
│   ├── embed_and_build_package.py
│   ├── sample_texts/            # Sample text files
│   │   ├── CS101/
│   │   ├── PHP1/
│   │   └── ...
│   ├── requirements.txt
│   └── README.md
│
├── storage/                      # 💾 SHARED STORAGE
│   ├── model_packages/           # RAG model packages
│   │   ├── CS101_v1/
│   │   ├── PHP1_v1/
│   │   └── ...
│   ├── databases/               # Shared databases (nếu cần)
│   └── logs/                    # Shared logs
│
├── scripts/                      # 🔧 BUILD & DEPLOYMENT SCRIPTS
│   ├── build/
│   │   ├── build_data_pipeline.sh
│   │   ├── build_backend.sh
│   │   ├── build_desktop.sh
│   │   └── build_all.sh
│   ├── start/
│   │   ├── start_backend.sh
│   │   ├── start_desktop.sh
│   │   └── start_admin.sh
│   └── deploy/
│       └── deploy.sh
│
├── docs/                         # 📚 DOCUMENTATION
│   ├── architecture.md
│   ├── implementation_plan.md
│   ├── api.md
│   ├── packaging_guide.md
│   └── build_instructions.md
│
├── .gitignore
├── README.md
└── package.json                  # Root package.json (nếu cần)
```

## Chi tiết từng Component

### 1. Desktop App (`desktop/`)
**Mục đích**: Ứng dụng desktop cho sinh viên
**Chạy trên**: Máy sinh viên (local)

**Cấu trúc**:
- `src/main/`: Electron main process
- `src/renderer/`: React UI
- `src/preload/`: Preload scripts
- `resources/`: Icons, assets

**Build**: `npm run dist` → Installer (.exe, .dmg, .AppImage)

### 2. Local Backend (`backend/`)
**Mục đích**: FastAPI backend chạy LOCAL trên máy sinh viên
**Chạy trên**: Máy sinh viên (localhost:8000)
**Chức năng**:
- ✅ Xử lý chat requests (100% local)
- ✅ RAG engine (tìm context từ model packages)
- ✅ Ollama integration (generate AI responses)
- ✅ Conversation history (SQLite local)
- ✅ Telemetry (gửi đến remote API - optional)

**Cấu trúc**:
- `app/`: Application code
  - `api/v1/`: API endpoints
  - `models/`: Database models
  - `schemas/`: Pydantic schemas
  - `services/`: Business logic
  - `core/`: Core utilities
- `migrations/`: Database migrations
- `storage/`: Local storage (databases, logs)

**Run**: `uvicorn app.main:app --reload --port 8000`
**Lưu ý**: Backend này chạy LOCAL, không phải trên server. Server chỉ dùng cho authentication, telemetry, updates.

### 3. Remote API Server
**Mục đích**: API server chạy trên SERVER (không phải local)
**Chạy trên**: Server (api.fpt.edu.vn)
**Chức năng**:
- ✅ Authentication (JWT tokens)
- ✅ User management
- ✅ Telemetry collection
- ✅ Version management
- ✅ Update distribution
**Lưu ý**: Có thể dùng cùng codebase `backend/` nhưng deploy với config khác, chỉ enable auth/telemetry/updates endpoints.

### 4. Admin Dashboard (`admin-dashboard/`)
**Mục đích**: Web interface cho quản trị viên
**Chạy trên**: Server (admin.fpt.edu.vn)

**Cấu trúc**:
- `src/`: React/Vue source
- `public/`: Static assets

**Run**: `npm start` → `http://localhost:3000`

### 5. Data Pipeline (`data-pipeline/`)
**Mục đích**: Xử lý và build model packages

**Cấu trúc**:
- `embed_and_build_package.py`: Main script
- `sample_texts/`: Input text files
- Output → `storage/model_packages/`

**Run**: `python embed_and_build_package.py`

### 6. Storage (`storage/`)
**Mục đích**: Lưu trữ dữ liệu dùng chung

**Cấu trúc**:
- `model_packages/`: RAG model packages (output từ data-pipeline)
- `databases/`: Shared databases (nếu cần)
- `logs/`: Shared logs

### 7. Scripts (`scripts/`)
**Mục đích**: Automation scripts

**Cấu trúc**:
- `build/`: Build scripts
- `start/`: Start scripts
- `deploy/`: Deployment scripts

## Quy tắc Tổ chức

### 1. Separation of Concerns
- Mỗi component độc lập
- Không có circular dependencies
- Shared code → `shared/` (nếu cần)

### 2. Storage Management
- **Backend storage**: `backend/storage/` (local databases, logs)
- **Shared storage**: `storage/` (model packages, shared data)
- **Component storage**: Trong từng component nếu chỉ dùng riêng

### 3. Build & Deployment
- Build scripts trong `scripts/build/`
- Start scripts trong `scripts/start/`
- Mỗi component có thể build độc lập

### 4. Configuration
- Mỗi component có `.env.example`
- Shared config trong `docs/`
- Production config tách riêng

## Workflow

### Development
```bash
# 1. Build data pipeline
./scripts/build/build_data_pipeline.sh

# 2. Start backend
./scripts/start/start_backend.sh

# 3. Start desktop (development)
./scripts/start/start_desktop.sh

# 4. Start admin dashboard
./scripts/start/start_admin.sh
```

### Production Build
```bash
# Build all
./scripts/build/build_all.sh

# Hoặc build từng component
./scripts/build/build_backend.sh
./scripts/build/build_desktop.sh
```

## Migration từ Cấu trúc Hiện tại

### Files cần di chuyển:

1. **Demo code** → Giữ lại hoặc xóa (nếu không cần)
   - `backend/app.py` → Có thể giữ làm reference hoặc xóa
   - `backend/chat_storage.py` → Đã được thay bằng `app/services/chat_service.py`

2. **Data pipeline** → `data-pipeline/`
   - `data_pipeline/` → `data-pipeline/`

3. **Model packages** → `storage/model_packages/`
   - `model_packages/` → `storage/model_packages/`

4. **Scripts** → `scripts/`
   - `build_data_pipeline.sh` → `scripts/build/build_data_pipeline.sh`
   - `start_backend.sh` → `scripts/start/start_backend.sh`
   - `start_desktop.sh` → `scripts/start/start_desktop.sh`

5. **Backend storage** → `backend/storage/`
   - `backend/*.db` → `backend/storage/databases/`
   - `backend/*.log` → `backend/storage/logs/`

## Benefits

1. ✅ **Rõ ràng**: Mỗi component có vị trí riêng
2. ✅ **Dễ maintain**: Dễ tìm và sửa code
3. ✅ **Scalable**: Dễ thêm component mới
4. ✅ **Professional**: Cấu trúc chuẩn industry
5. ✅ **Production-ready**: Sẵn sàng deploy
