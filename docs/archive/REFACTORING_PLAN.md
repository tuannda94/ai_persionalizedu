# 🔄 Kế hoạch Refactoring - Tổ chức lại Codebase

## Mục tiêu

Tách biệt rõ ràng và tổ chức lại codebase thành 4 components độc lập:
1. **Student App** - Phần mềm sinh viên (desktop + local backend)
2. **Remote API** - API server của trường
3. **Admin Dashboard** - Web quản trị
4. **Storage** - Lưu trữ dữ liệu

## Cấu trúc Mới (Chuyên nghiệp)

```
AI_PersonalizedU/
│
├── student-app/                    # 🎓 PHẦN MỀM SINH VIÊN
│   ├── desktop/                    # Desktop application
│   │   ├── src/
│   │   │   ├── main/              # Electron main process
│   │   │   ├── renderer/           # React UI
│   │   │   └── preload/           # Preload scripts
│   │   ├── resources/
│   │   ├── package.json
│   │   └── electron-builder.yml
│   │
│   └── backend/                    # Local backend (chạy trên máy SV)
│       ├── app/
│       │   ├── main.py            # FastAPI app
│       │   ├── config.py          # Local config
│       │   ├── database.py        # SQLite setup
│       │   │
│       │   ├── api/
│       │   │   └── v1/
│       │   │       ├── chat.py    # Chat endpoints (LOCAL)
│       │   │       └── health.py  # Health check
│       │   │
│       │   ├── services/
│       │   │   ├── rag_service.py # RAG engine
│       │   │   ├── chat_service.py # Conversation
│       │   │   └── ollama_service.py # Ollama client
│       │   │
│       │   └── models/            # Local models
│       │       └── conversation.py
│       │
│       ├── storage/               # Local storage
│       │   ├── databases/         # SQLite
│       │   └── logs/
│       │
│       ├── requirements.txt
│       └── README.md
│
├── remote-api/                     # 🌐 API SERVER CỦA TRƯỜNG
│   ├── app/
│   │   ├── main.py                # FastAPI app
│   │   ├── config.py              # Server config
│   │   ├── database.py            # PostgreSQL setup
│   │   │
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth.py        # Authentication
│   │   │       ├── telemetry.py   # Telemetry
│   │   │       ├── updates.py     # Version management
│   │   │       └── users.py       # User management
│   │   │
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── telemetry_service.py
│   │   │   └── update_service.py
│   │   │
│   │   ├── models/                # Database models
│   │   │   ├── user.py
│   │   │   ├── version.py
│   │   │   └── telemetry.py
│   │   │
│   │   └── schemas/               # Pydantic schemas
│   │
│   ├── migrations/                # Alembic migrations
│   ├── requirements.txt
│   └── README.md
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
│   │   │   └── api.js             # API client
│   │   └── App.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── storage/                        # 💾 LƯU TRỮ DỮ LIỆU
│   ├── model-packages/            # RAG model packages
│   │   ├── CS101_v1/
│   │   ├── PHP1_v1/
│   │   └── ...
│   │
│   ├── databases/                 # Shared databases (nếu cần)
│   └── logs/                      # Shared logs
│
├── data-pipeline/                 # 📊 DATA PIPELINE
│   ├── embed_and_build_package.py
│   ├── sample_texts/
│   ├── requirements.txt
│   └── README.md
│
├── scripts/                        # 🔧 SCRIPTS
│   ├── build/
│   │   ├── build_student_app.sh
│   │   ├── build_remote_api.sh
│   │   └── build_all.sh
│   │
│   ├── start/
│   │   ├── start_student_app.sh
│   │   └── start_remote_api.sh
│   │
│   └── deploy/
│
├── docs/                           # 📚 DOCUMENTATION
│   ├── architecture.md
│   ├── api/
│   │   ├── student-app-api.md
│   │   └── remote-api.md
│   └── deployment/
│
├── .gitignore
├── README.md
└── docker-compose.yml              # (Optional) cho development
```

## Nguyên tắc Tổ chức

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

## Migration Steps

### Phase 1: Tạo cấu trúc mới
1. Tạo thư mục `student-app/`, `remote-api/`, `admin-dashboard/`
2. Tạo thư mục `storage/` với subdirectories

### Phase 2: Di chuyển Student App
1. `desktop/` → `student-app/desktop/`
2. Tách backend code:
   - Local endpoints → `student-app/backend/`
   - Remote endpoints → `remote-api/`

### Phase 3: Tách Remote API
1. Extract auth/telemetry/updates từ backend
2. Tạo `remote-api/` với code riêng
3. Setup PostgreSQL config

### Phase 4: Setup Admin Dashboard
1. Tạo `admin-dashboard/` structure
2. Setup React/Vue project
3. Tạo API client

### Phase 5: Reorganize Storage
1. `model_packages/` → `storage/model-packages/`
2. Move databases/logs vào storage

### Phase 6: Update Scripts & Docs
1. Update build scripts
2. Update documentation
3. Update README

## Benefits

1. ✅ **Rõ ràng**: Mỗi component có mục đích riêng
2. ✅ **Maintainable**: Dễ tìm và sửa code
3. ✅ **Scalable**: Dễ thêm features
4. ✅ **Deployable**: Mỗi component deploy độc lập
5. ✅ **Professional**: Cấu trúc chuẩn industry
