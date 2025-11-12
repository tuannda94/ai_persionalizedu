# 🌐 Remote API Server

## 📋 Tổng Quan

Remote API Server chạy trên **SERVER**, xử lý authentication, telemetry, version management, và file hosting.

**KHÔNG** xử lý chat, RAG, hoặc AI generation (tất cả chạy local trên máy sinh viên).

## 🎯 Mục Đích

- ✅ Authentication (JWT tokens)
- ✅ User management (CRUD)
- ✅ Version management (app versions + learning packages)
- ✅ Model package management
- ✅ Feedback collection và processing
- ✅ Telemetry collection và analytics
- ✅ Document management
- ✅ File hosting (installers, packages, documents)

## 🏗️ Kiến Trúc

```
Student Apps (Nhiều máy)
    ↓ HTTPS
Remote API Server (api.fpt.edu.vn)
    ↓
PostgreSQL Database
    ↓
File Storage (Local hoặc MinIO)
```

## 📁 Cấu Trúc

```
remote-api/
├── app/
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Server configuration
│   ├── database.py                # PostgreSQL setup
│   │
│   ├── api/v1/                    # API Endpoints
│   │   ├── auth.py                # Authentication (login, refresh, me)
│   │   ├── users.py               # User management (CRUD)
│   │   ├── updates.py             # Version management
│   │   │   ├── POST /check        # Check for updates
│   │   │   ├── GET /versions      # List versions
│   │   │   ├── POST /admin/versions/upload  # Upload version
│   │   │   └── PUT /admin/versions/{id}     # Update version
│   │   │
│   │   ├── packages.py            # Model package management
│   │   │   ├── GET /list          # List packages
│   │   │   ├── POST /check        # Check package updates
│   │   │   └── POST /admin/upload # Upload package
│   │   │
│   │   ├── feedback.py            # Feedback system
│   │   │   ├── POST /             # Create feedback
│   │   │   ├── GET /              # List feedback (admin)
│   │   │   └── PUT /{id}          # Update feedback (admin)
│   │   │
│   │   ├── telemetry.py           # Telemetry collection
│   │   │   ├── POST /             # Submit telemetry
│   │   │   └── GET /stats         # Get statistics (admin)
│   │   │
│   │   ├── documents.py           # Document management
│   │   ├── files.py               # File hosting/download
│   │   └── __init__.py
│   │
│   ├── models/                    # SQLAlchemy Models
│   │   ├── user.py                # User model
│   │   ├── version.py            # AppVersion, UpdateLog models
│   │   ├── package.py            # ModelPackage model
│   │   ├── feedback.py            # Feedback model
│   │   ├── telemetry.py           # Telemetry model
│   │   └── document.py            # Document model
│   │
│   ├── schemas/                    # Pydantic Schemas
│   │   ├── user.py                # User schemas
│   │   ├── version.py             # Version schemas
│   │   ├── package.py             # Package schemas
│   │   ├── feedback.py            # Feedback schemas
│   │   ├── telemetry.py           # Telemetry schemas
│   │   └── document.py            # Document schemas
│   │
│   ├── services/                  # Business Logic Services
│   │   ├── file_service.py       # File upload/download (local/MinIO)
│   │   └── minio_service.py      # MinIO client (optional)
│   │
│   └── core/                      # Core Utilities
│       └── security.py            # JWT, password hashing, auth dependencies
│
├── migrations/                    # Database Migrations
│   ├── add_learning_package_to_versions.sql
│   ├── create_feedback_table.sql
│   ├── create_model_packages_table.sql
│   ├── run_add_learning_package_migration.sh
│   └── run_migration.py
│
├── scripts/                       # Utility Scripts
│   ├── create_sample_data.py      # Create sample data for testing
│   └── create_sample_data.sh
│
├── storage/                       # Server Storage (local or MinIO)
│   ├── installers/                # App installer files
│   ├── packages/                  # Model package files
│   ├── learning-packages/         # Learning package files
│   └── documents/                 # Document files
│
├── requirements.txt               # Python dependencies
└── README.md
```

## 🚀 Cài Đặt

```bash
cd remote-api
python3 -m venv venv  # hoặc .venv
source venv/bin/activate  # hoặc .venv/bin/activate
pip install -r requirements.txt
```

## ⚙️ Cấu Hình

Tạo file `.env`:

```env
# Database (PostgreSQL - Required)
DATABASE_URL=postgresql://user:password@localhost:5432/poly_ai_db

# JWT (Required)
JWT_SECRET_KEY=your-secret-key-here-change-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173,https://app.fpt.edu.vn,https://admin.fpt.edu.vn

# Admin (Auto-created on startup)
ADMIN_EMAIL=admin@fpt.edu.vn
ADMIN_PASSWORD=changeme

# Storage
STORAGE_TYPE=local  # local or minio
STORAGE_PATH=./storage
BASE_URL=http://localhost:8001  # Base URL for download links

# MinIO (Optional - if STORAGE_TYPE=minio)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false
```

## ▶️ Chạy

### Development

```bash
uvicorn app.main:app --reload --port 8001
```

### Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### Từ Script

```bash
# Từ project root
bash scripts/start/start_remote_api.sh
```

## 📡 API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Đăng nhập
  - Body: `{ email, password }`
  - Response: `{ access_token, refresh_token, user }`

- `POST /api/v1/auth/refresh` - Refresh token
  - Body: `{ refresh_token }`
  - Response: `{ access_token }`

- `GET /api/v1/auth/me` - Lấy user info (requires auth)

### Users (Admin Only)

- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/{id}` - Get user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Versions

- `POST /api/v1/updates/check` - Check for updates
  - Body: `{ platform, current_version, current_version_code }`
  - Response: `{ has_update, latest_version, download_url, has_learning_package, ... }`

- `GET /api/v1/updates/versions` - List versions (optional auth)

- `POST /api/v1/updates/admin/versions/upload` - Upload version (admin)
  - FormData: `file, version, version_code, platform, learning_package?, ...`

- `PUT /api/v1/updates/admin/versions/{id}` - Update version (admin)

### Packages

- `GET /api/v1/packages/list` - List packages
- `POST /api/v1/packages/check` - Check for package updates
- `POST /api/v1/packages/admin/upload` - Upload package (admin)

### Feedback

- `POST /api/v1/feedback` - Create feedback (optional auth)
- `GET /api/v1/feedback` - List feedback (admin)
- `PUT /api/v1/feedback/{id}` - Update feedback (admin)

### Telemetry

- `POST /api/v1/telemetry` - Submit telemetry (optional auth)
- `GET /api/v1/telemetry/stats` - Get statistics (admin)

### Documents

- `GET /api/v1/documents` - List documents
- `POST /api/v1/documents/admin/upload` - Upload document (admin)

### Files

- `GET /api/v1/files/{subdirectory}/{filename}` - Download file

## 🗄️ Database Schema

### Users

- `id` (UUID), `email`, `password_hash`, `full_name`, `student_id`, `role`, `is_active`, `created_at`, `updated_at`

### App Versions

- `id`, `version`, `version_code`, `platform`, `release_type`, `download_url`, `file_size`, `file_hash`, `is_mandatory`, `min_version_code`, `published_at`, `published_by`
- **Learning Package fields**: `has_learning_package`, `learning_package_url`, `learning_package_hash`, `learning_package_size`, `learning_package_manifest`

### Model Packages

- `id`, `subject`, `version`, `file_path`, `file_size`, `file_hash`, `download_url`, `description`, `is_active`, `published_at`, `published_by`

### Feedback

- `id`, `user_id`, `type`, `category`, `title`, `message`, `status`, `priority`, `assigned_to`, `resolution`, `created_at`, `updated_at`, `resolved_at`

### Telemetry

- `id`, `user_id`, `conversation_id`, `question`, `answer_length`, `used_segments`, `duration_ms`, `detected_subject`, `timestamp`

### Update Logs

- `id`, `user_id`, `from_version`, `to_version`, `platform`, `status`, `error_message`, `started_at`, `completed_at`

## 🔒 Security

- ✅ **HTTPS only** (production)
- ✅ **JWT authentication** với refresh tokens
- ✅ **Password hashing** (bcrypt)
- ✅ **Input validation** (Pydantic)
- ✅ **SQL injection protection** (SQLAlchemy ORM)
- ✅ **CORS configuration** (configurable origins)
- ✅ **Rate limiting** (recommended for production)

## 📦 File Storage

### Local Storage

Files được lưu trong `storage/` directory:
- `storage/installers/` - App installer files
- `storage/packages/` - Model package files
- `storage/learning-packages/` - Learning package files
- `storage/documents/` - Document files

### MinIO Storage (Optional)

Nếu `STORAGE_TYPE=minio`, files được lưu trong MinIO buckets:
- `installers` bucket
- `packages` bucket
- `learning-packages` bucket
- `documents` bucket

## 🚀 Deployment

### Option 1: Standalone

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### Option 2: Gunicorn (Production)

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

### Option 3: Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

## 📊 Database Migrations

Chạy migrations:

```bash
# Migration cho learning package fields
bash migrations/run_add_learning_package_migration.sh

# Hoặc chạy migration script
python3 migrations/run_migration.py
```

## 🧪 Sample Data

Tạo dữ liệu mẫu cho testing:

```bash
python3 scripts/create_sample_data.py
```

Hoặc:

```bash
bash scripts/create_sample_data.sh
```

## 📈 Scaling

- **Lightweight**: Chỉ xử lý auth/telemetry (không phải AI)
- **Stateless**: Có thể scale horizontal
- **Database**: PostgreSQL (có thể shard nếu cần)
- **File Storage**: MinIO hoặc S3 cho production

## 📚 Tài Liệu Liên Quan

- [Version Management Guide](../docs/VERSION_MANAGEMENT_GUIDE.md)
- [Learning Package Structure](../docs/LEARNING_PACKAGE_STRUCTURE.md)
- [MinIO Setup](../docs/MINIO_SETUP.md)
- [Storage Architecture](../docs/STORAGE_ARCHITECTURE.md)

