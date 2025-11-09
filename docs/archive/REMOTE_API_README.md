# 🌐 Remote API Server - Authentication & Management

## Mục đích

Remote API Server chạy trên **SERVER**, xử lý:
- ✅ Authentication (JWT tokens)
- ✅ User management
- ✅ Telemetry collection
- ✅ Version management
- ✅ Update distribution

**KHÔNG** xử lý chat, RAG, hoặc AI generation (tất cả chạy local).

## Kiến trúc

```
┌─────────────────────────────────┐
│   Desktop Apps (Nhiều máy)      │
│   - Local Backend               │
│   - RAG Engine                  │
│   - Ollama                      │
└────────────┬────────────────────┘
             │ HTTPS
             │
┌────────────▼────────────────────┐
│   Remote API Server             │
│   - Authentication              │
│   - Telemetry                   │
│   - Version Management          │
└─────────────────────────────────┘
```

## Cấu trúc

Có thể dùng cùng codebase `backend/` nhưng deploy lên server với config khác:

```
remote-api/
├── app/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Server config
│   │
│   ├── api/v1/
│   │   ├── auth.py         # Authentication
│   │   ├── telemetry.py    # Telemetry collection
│   │   └── updates.py      # Version management
│   │
│   └── ...
│
└── requirements.txt
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
- `GET /api/v1/updates/check` - Kiểm tra updates
- `GET /api/v1/updates/versions` - Lấy danh sách versions
- `POST /api/v1/updates/log` - Log update progress

### Admin (Admin Dashboard)
- `GET /api/v1/admin/users` - Quản lý users
- `POST /api/v1/admin/versions` - Tạo version mới
- `GET /api/v1/admin/analytics` - Analytics

## Configuration

```env
# Server
DATABASE_URL=postgresql://user:pass@localhost/ai_learning
JWT_SECRET_KEY=production-secret-key

# CORS
ALLOWED_ORIGINS=https://app.fpt.edu.vn,https://admin.fpt.edu.vn

# File Storage (cho installers)
STORAGE_TYPE=s3
S3_BUCKET=ai-learning-installers
```

## Deployment

### Option 1: Deploy cùng codebase
```bash
# Deploy backend/ lên server
# Set REMOTE_API_URL trong config
# Enable only auth/telemetry/updates endpoints
```

### Option 2: Separate service
```bash
# Tách thành service riêng
# Chỉ chứa auth/telemetry/updates logic
```

## Database Schema

### Users
- id, email, password_hash, role, is_active

### Telemetry
- id, user_id, question, answer, duration, timestamp

### App Versions
- id, version, platform, download_url, is_mandatory

### Update Logs
- id, user_id, from_version, to_version, status

## Security

- ✅ HTTPS only
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection protection
- ✅ CORS configuration

## Scaling

- Lightweight: Chỉ xử lý auth/telemetry (không phải AI)
- Stateless: Có thể scale horizontal
- Database: PostgreSQL (có thể shard nếu cần)

