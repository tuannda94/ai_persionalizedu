# 🚀 Quick Start Guide

## Yêu cầu

- Python 3.11+
- Node.js 18+
- Ollama (đã cài và có model llama3)

## Bước 1: Build Data Pipeline

Tạo model packages từ sample texts:

```bash
./scripts/build/build_data_pipeline.sh
```

**Output**: `storage/model-packages/`

## Bước 2: Start Student App

Chạy desktop app + local backend:

```bash
./scripts/start/start_student_app.sh
```

- Desktop app sẽ mở tự động
- Local backend chạy tại: `http://localhost:8000`

## Bước 3: Start Remote API (Optional)

Chỉ cần nếu muốn test authentication/telemetry:

```bash
cd remote-api
# Tạo .env với:
# DATABASE_URL=postgresql://user:pass@localhost/dbname
# JWT_SECRET_KEY=your-secret-key
./scripts/start/start_remote_api.sh
```

## Cấu trúc Components

```
student-app/          # Phần mềm sinh viên (desktop + local backend)
remote-api/           # API server (auth, telemetry, updates)
admin-dashboard/      # Web quản trị
data-pipeline/        # Xử lý data
storage/              # Lưu trữ (model-packages, logs)
scripts/              # Build & start scripts
```

## Scripts Available

### Build Scripts
- `scripts/build/build_data_pipeline.sh` - Build model packages
- `scripts/build/build_student_app.sh` - Build student app executable

### Start Scripts
- `scripts/start/start_student_app.sh` - Start desktop + local backend
- `scripts/start/start_remote_api.sh` - Start remote API server

## Troubleshooting

### Ollama không chạy
```bash
ollama serve
ollama pull llama3
```

### Model packages không tìm thấy
Chạy lại: `./scripts/build/build_data_pipeline.sh`

### Backend không start
Kiểm tra port 8000 đã được dùng chưa:
```bash
lsof -i :8000
```

### Port conflict
Nếu port 8000 đã được dùng, thay đổi trong:
- `student-app/local-backend/app/config.py` (cho local backend)
- `remote-api/app/config.py` (cho remote API)
