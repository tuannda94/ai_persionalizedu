# 📁 Cấu trúc Dự án - Final

## Tổng quan

Dự án được tổ chức thành **4 components độc lập**:

1. **Student App** - Phần mềm sinh viên (desktop + local backend)
2. **Remote API** - API server của trường
3. **Admin Dashboard** - Web quản trị
4. **Storage** - Lưu trữ dữ liệu

## Cấu trúc Thư mục (Hiện tại)

```
AI_PersonalizedU/
│
├── student-app/                    # 🎓 PHẦN MỀM SINH VIÊN
│   ├── desktop/                    # Desktop application
│   │   ├── src/
│   │   │   ├── main/              # Electron main process
│   │   │   ├── renderer/          # React UI
│   │   │   └── preload/           # Preload scripts
│   │   ├── resources/
│   │   ├── index.html
│   │   └── package.json
│   │
│   └── local-backend/              # Local backend (máy SV)
│       ├── app/
│       │   ├── main.py            # FastAPI - CHỈ chat
│       │   ├── config.py          # Local config
│       │   ├── database.py        # SQLite
│       │   ├── api/v1/
│       │   │   └── chat.py        # Chat endpoints
│       │   ├── services/
│       │   │   ├── rag_service.py
│       │   │   ├── chat_service.py
│       │   │   └── ollama_service.py
│       │   └── models/
│       │       └── conversation.py
│       ├── storage/
│       │   ├── databases/         # SQLite files
│       │   └── logs/
│       └── requirements.txt
│
├── remote-api/                     # 🌐 API SERVER CỦA TRƯỜNG
│   ├── app/
│   │   ├── main.py                # FastAPI - CHỈ auth/telemetry/updates
│   │   ├── config.py              # PostgreSQL config
│   │   ├── database.py            # PostgreSQL
│   │   ├── api/v1/
│   │   │   ├── auth.py            # Authentication
│   │   │   ├── telemetry.py      # Telemetry
│   │   │   └── updates.py         # Version management
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── version.py
│   │   │   └── telemetry.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── version.py
│   │   │   └── telemetry.py
│   │   └── core/
│   │       └── security.py
│   ├── migrations/
│   └── requirements.txt
│
├── admin-dashboard/                # 👨‍💼 WEB QUẢN TRỊ
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Versions.jsx
│   │   │   └── Analytics.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── data-pipeline/                  # 📊 DATA PIPELINE
│   ├── embed_and_build_package.py
│   ├── sample_texts/
│   │   ├── CS101/
│   │   ├── PHP1/
│   │   └── ...
│   └── requirements.txt
│
├── storage/                        # 💾 LƯU TRỮ
│   ├── model-packages/            # RAG model packages
│   │   ├── CS101_v1/
│   │   ├── PHP1_v1/
│   │   └── ...
│   ├── databases/                 # Shared databases (nếu cần)
│   └── logs/                      # Shared logs
│
├── scripts/                        # 🔧 SCRIPTS
│   ├── build/
│   │   ├── build_data_pipeline.sh
│   │   └── build_student_app.sh
│   ├── start/
│   │   ├── start_student_app.sh
│   │   └── start_remote_api.sh
│   └── deploy/
│
├── docs/                           # 📚 DOCUMENTATION
│   ├── README.md                  # Index
│   ├── FINAL_STRUCTURE.md         # Cấu trúc
│   ├── QUICK_START.md             # Quick start
│   ├── PROJECT_STATUS.md          # Tiến độ
│   ├── architecture.md            # Kiến trúc
│   └── ...
│
├── .gitignore
└── README.md
```

## Chi tiết Components

### 1. Student App (`student-app/`)

**Mục đích**: Phần mềm cho sinh viên

**Desktop** (`desktop/`):
- Electron app với React UI
- Gửi requests đến local backend
- Quản lý authentication token

**Local Backend** (`local-backend/`):
- FastAPI chạy trên máy sinh viên (localhost:8000)
- Chỉ xử lý chat (RAG + Ollama)
- Lưu conversation history (SQLite)
- Gửi telemetry đến remote API (optional)

### 2. Remote API (`remote-api/`)

**Mục đích**: API server của trường

**Chức năng**:
- Authentication (JWT tokens)
- Telemetry collection
- Version management
- Update distribution

**KHÔNG**:
- ❌ Không xử lý chat
- ❌ Không có RAG engine
- ❌ Không có Ollama

### 3. Admin Dashboard (`admin-dashboard/`)

**Mục đích**: Web quản trị

**Chức năng**:
- Quản lý users
- Quản lý app versions
- Xem analytics/telemetry
- Upload new versions

### 4. Data Pipeline (`data-pipeline/`)

**Mục đích**: Xử lý và build model packages

**Chức năng**:
- Đọc sample texts
- Chunk và tạo embeddings
- Output model packages → `storage/model-packages/`

### 5. Storage (`storage/`)

**Mục đích**: Lưu trữ dữ liệu dùng chung

**Cấu trúc**:
- `model-packages/`: RAG data (output từ data-pipeline)
- `databases/`: Shared databases (nếu cần)
- `logs/`: Shared logs

### 6. Scripts (`scripts/`)

**Mục đích**: Automation

**Cấu trúc**:
- `build/`: Build scripts
- `start/`: Start scripts
- `deploy/`: Deployment scripts

## Quy tắc Tổ chức

### 1. Separation of Concerns
- Mỗi component độc lập hoàn toàn
- Không có shared code (trừ storage)
- Mỗi component có thể build/deploy riêng

### 2. Clear Boundaries
- **Student App**: Chỉ xử lý local, không phụ thuộc server
- **Remote API**: Chỉ authentication, telemetry, updates
- **Admin Dashboard**: Chỉ gọi Remote API
- **Storage**: Dữ liệu dùng chung

### 3. Independent Deployment
- Student App: Build thành installer, bundle tất cả
- Remote API: Deploy lên server
- Admin Dashboard: Deploy lên server (hoặc CDN)
