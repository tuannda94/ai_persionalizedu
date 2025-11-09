# 🔧 Scripts Fixes - Đã Sửa

## Vấn Đề Đã Phát Hiện và Sửa

### 1. Đường Dẫn (Paths)

#### ✅ Đã Sửa:
- **start_student_app.sh**: Sử dụng absolute paths với `$PROJECT_ROOT`
- **start_remote_api.sh**: Sử dụng absolute paths, đổi port thành 8001 để tránh conflict
- **build_data_pipeline.sh**: Sử dụng absolute paths
- **build_student_app.sh**: Sử dụng absolute paths
- **backend_launcher.js**: Sửa đường dẫn từ `../../../backend` → `../../local-backend`
- **config.py**: Đơn giản hóa đường dẫn MODEL_PACKAGES_DIR

### 2. Dependencies

#### ✅ Đã Thêm:
- **remote-api/requirements.txt**: Thêm `minio>=7.2.0` cho MinIO integration

#### ✅ Đã Kiểm Tra:
- **student-app/local-backend/requirements.txt**: Đầy đủ (fastapi, uvicorn, chromadb, requests, sqlalchemy)
- **data-pipeline/requirements.txt**: Đầy đủ (sentence-transformers, numpy, faiss-cpu)

### 3. Port Conflicts

#### ✅ Đã Sửa:
- **Local Backend**: Port 8000 (localhost:8000)
- **Remote API**: Port 8001 (0.0.0.0:8001) - tránh conflict

### 4. Renderer Build

#### ✅ Đã Sửa:
- **start_student_app.sh**: Build renderer từ desktop directory, không phải renderer directory
- Sử dụng `npm run build:renderer` từ desktop/package.json

### 5. Virtual Environment

#### ✅ Đã Cải Thiện:
- Tất cả scripts tạo venv nếu chưa có
- Upgrade pip trước khi install
- Check dependencies trước khi chạy

### 6. Error Handling

#### ✅ Đã Thêm:
- Check Python và Node.js trước khi chạy
- Check directories tồn tại
- Better error messages
- Cleanup on exit (trap)

## Cách Sử Dụng

### Start Student App
```bash
./scripts/start/start_student_app.sh
```

**Lưu ý:**
- Tự động tạo venv nếu chưa có
- Install dependencies tự động
- Start backend trên port 8000
- Build renderer nếu chưa có
- Start Electron app

### Start Remote API
```bash
./scripts/start/start_remote_api.sh
```

**Lưu ý:**
- Cần file `.env` với DATABASE_URL và JWT_SECRET_KEY
- Chạy trên port 8001 (không conflict với local backend)
- Tự động tạo sample .env nếu chưa có

### Build Data Pipeline
```bash
./scripts/build/build_data_pipeline.sh
```

**Lưu ý:**
- Tạo model packages từ sample_texts
- Output vào storage/model-packages/

### Build Student App
```bash
./scripts/build/build_student_app.sh
```

**Lưu ý:**
- Build backend executable với PyInstaller
- Build renderer với webpack
- Build Electron app với electron-builder

## Troubleshooting

### Backend không start được

1. **Check Python:**
```bash
python3 --version  # Should be 3.8+
```

2. **Check dependencies:**
```bash
cd student-app/local-backend
source .venv/bin/activate
pip list
```

3. **Check port:**
```bash
lsof -i :8000  # Check if port 8000 is in use
```

### Remote API không start được

1. **Check .env file:**
```bash
cd remote-api
cat .env  # Should have DATABASE_URL and JWT_SECRET_KEY
```

2. **Check database:**
```bash
# Make sure PostgreSQL is running
psql -U postgres -l
```

3. **Run migration:**
```bash
cd remote-api
python migrations/run_migration.py
```

### Renderer không build được

1. **Check Node.js:**
```bash
node --version  # Should be 16+
npm --version
```

2. **Install dependencies:**
```bash
cd student-app/desktop
npm install
```

3. **Build manually:**
```bash
cd student-app/desktop
npm run build:renderer
```

## Path Structure

```
PROJECT_ROOT/
├── student-app/
│   ├── local-backend/     # Python backend
│   │   └── app/
│   │       └── config.py  # BASE_DIR = local-backend/app
│   └── desktop/           # Electron app
│       └── src/main/
│           └── backend_launcher.js  # Points to ../../local-backend
├── remote-api/            # Remote API server
├── data-pipeline/         # Data processing
└── storage/               # Shared storage
    └── model-packages/    # RAG packages
```

## Environment Variables

### Local Backend (.env - optional)
```env
REMOTE_API_URL=https://api.fpt.edu.vn
TELEMETRY_ENABLED=true
FEEDBACK_ENABLED=true
APP_VERSION=1.0.0
```

### Remote API (.env - required)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET_KEY=your-secret-key
ADMIN_EMAIL=admin@fpt.edu.vn
ADMIN_PASSWORD=changeme
STORAGE_TYPE=local
```

