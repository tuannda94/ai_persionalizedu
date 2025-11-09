# 🌐 Remote API Server

## Mục đích

Remote API Server chạy trên **SERVER**, xử lý:
- ✅ Authentication (JWT tokens)
- ✅ User management
- ✅ Telemetry collection
- ✅ Version management
- ✅ Update distribution

**KHÔNG** xử lý chat, RAG, hoặc AI generation (tất cả chạy local trên máy sinh viên).

## Kiến trúc

```
Student Apps (Nhiều máy)
    ↓ HTTPS
Remote API Server (api.fpt.edu.vn)
    ↓
PostgreSQL Database
```

## Cấu trúc

```
remote-api/
├── app/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Server config
│   ├── database.py          # PostgreSQL setup
│   │
│   ├── api/v1/
│   │   ├── auth.py         # Authentication
│   │   ├── telemetry.py    # Telemetry
│   │   └── updates.py      # Version management
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── telemetry_service.py
│   │   └── update_service.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── version.py
│   │   └── telemetry.py
│   │
│   └── schemas/
│       ├── user.py
│       ├── version.py
│       └── telemetry.py
│
├── migrations/              # Alembic migrations
└── requirements.txt
```

## Cài đặt

```bash
cd remote-api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Cấu hình

Tạo file `.env`:

```env
# Database (PostgreSQL - Required)
DATABASE_URL=postgresql://user:pass@localhost/ai_learning

# JWT (Required)
JWT_SECRET_KEY=your-secret-key-here

# CORS
ALLOWED_ORIGINS=https://app.fpt.edu.vn,https://admin.fpt.edu.vn

# Admin
ADMIN_EMAIL=admin@fpt.edu.vn
ADMIN_PASSWORD=changeme
```

## Chạy

```bash
# Development
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Lấy user info

### Telemetry
- `POST /api/v1/telemetry` - Gửi telemetry data
- `GET /api/v1/telemetry/stats` - Analytics (admin only)

### Updates
- `POST /api/v1/updates/check` - Kiểm tra updates
- `GET /api/v1/updates/versions` - Lấy danh sách versions
- `POST /api/v1/updates/log` - Log update progress

### Admin
- `POST /api/v1/updates/admin/versions` - Tạo version (admin)
- `PUT /api/v1/updates/admin/versions/{id}` - Update version (admin)
- `GET /api/v1/updates/admin/logs` - Lấy update logs (admin)

## Database Schema

### Users
- id, email, password_hash, role, is_active

### Telemetry
- id, user_id, question, answer_length, used_segments, duration_ms, timestamp

### App Versions
- id, version, version_code, platform, download_url, is_mandatory

### Update Logs
- id, user_id, from_version, to_version, status

## Security

- ✅ HTTPS only (production)
- ✅ JWT authentication
- ✅ Rate limiting (recommended)
- ✅ Input validation
- ✅ SQL injection protection
- ✅ CORS configuration

## Deployment

### Option 1: Standalone
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Option 2: Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Option 3: Gunicorn (Production)
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Scaling

- Lightweight: Chỉ xử lý auth/telemetry (không phải AI)
- Stateless: Có thể scale horizontal
- Database: PostgreSQL (có thể shard nếu cần)
