# 🧪 Testing Guide

## Tổng quan

Hệ thống có các test scripts để verify:
- Code structure và integration
- API endpoints
- Database migrations
- System verification

## Test Scripts

### 1. Structure Tests

Kiểm tra code structure và integration:

```bash
# Run all structure tests
./scripts/test/test_all.sh

# Individual tests
./scripts/test/test_auto_update.sh
./scripts/test/test_file_hosting.sh
./scripts/test/test_package_updates.sh
./scripts/test/test_migration.sh
```

### 2. API Endpoint Tests

Kiểm tra API endpoints (cần server đang chạy):

```bash
# Test Remote API
API_URL=http://localhost:8000 ./scripts/test/test_api_endpoints.sh

# Test Local Backend
BACKEND_URL=http://localhost:8000 ./scripts/test/test_local_backend.sh
```

### 3. System Verification

Verify toàn bộ hệ thống:

```bash
./scripts/test/verify_system.sh
```

## Manual Testing

### 1. Test Auto-Update

1. **Start Remote API**:
```bash
cd remote-api
# Tạo .env với DATABASE_URL và JWT_SECRET_KEY
./scripts/start/start_remote_api.sh
```

2. **Upload a version** (qua Admin Dashboard hoặc API):
```bash
curl -X POST http://localhost:8000/api/v1/updates/admin/versions/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@installer.exe" \
  -F "version=1.1.0" \
  -F "version_code=10100" \
  -F "platform=windows" \
  -F "release_type=stable"
```

3. **Start Desktop App**:
```bash
./scripts/start/start_student_app.sh
```

4. **Check for updates**:
   - App sẽ tự động check khi start
   - Hoặc manual check từ UI

### 2. Test Package Updates

1. **Upload a package** (qua Admin Dashboard):
   - Go to Packages page
   - Upload package file (zip/tar.gz)
   - Fill subject, version, description
   - Publish

2. **Check from Local Backend**:
```bash
curl -X POST http://localhost:8000/api/v1/packages/check \
  -H "Content-Type: application/json" \
  -d '{
    "remote_api_url": "http://localhost:8000",
    "current_packages": [{"subject": "CS101", "version": "v1"}]
  }'
```

3. **Update package**:
```bash
curl -X POST http://localhost:8000/api/v1/packages/update \
  -H "Content-Type: application/json" \
  -d '{
    "download_url": "http://localhost:8000/api/v1/files/download/packages/CS101_v2.zip",
    "subject": "CS101",
    "version": "v2"
  }'
```

### 3. Test Admin Dashboard

1. **Start Admin Dashboard**:
```bash
cd admin-dashboard
npm install
npm run dev
```

2. **Login**:
   - Go to http://localhost:5173
   - Login với admin credentials

3. **Test Features**:
   - Upload version
   - Upload package
   - View lists
   - Publish/Unpublish

## Database Migration

### Run Migration

```bash
cd remote-api

# Make sure .env has DATABASE_URL and JWT_SECRET_KEY
python migrations/run_migration.py
```

### Verify Migration

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Check if table exists
\dt model_packages

# Check table structure
\d model_packages
```

## Troubleshooting

### Tests Fail

1. **Check if files exist**:
```bash
ls -la student-app/desktop/src/main/updater.js
ls -la remote-api/app/services/file_service.py
```

2. **Check dependencies**:
```bash
cd student-app/desktop && npm list electron-updater
cd remote-api && pip list | grep fastapi
```

3. **Check imports**:
```bash
cd remote-api && python -c "from app.models.package import ModelPackage; print('OK')"
```

### API Tests Fail

1. **Check if server is running**:
```bash
curl http://localhost:8000/health
```

2. **Check logs**:
```bash
# Remote API logs
tail -f remote-api/logs/app.log

# Local Backend logs
tail -f student-app/local-backend/storage/logs/app.log
```

3. **Check database connection**:
```bash
cd remote-api
python -c "from app.database import engine; print(engine.connect())"
```

## Continuous Testing

Để chạy tests tự động trong CI/CD:

```bash
# In CI pipeline
./scripts/test/test_all.sh
./scripts/test/verify_system.sh
```

## Test Coverage

Hiện tại tests cover:
- ✅ Code structure
- ✅ File existence
- ✅ Integration points
- ✅ API endpoints (basic)
- ⚠️  Unit tests (cần thêm)
- ⚠️  Integration tests (cần thêm)
- ⚠️  E2E tests (cần thêm)

## Next Steps

1. Add unit tests (pytest)
2. Add integration tests
3. Add E2E tests (Playwright/Cypress)
4. Setup CI/CD pipeline

