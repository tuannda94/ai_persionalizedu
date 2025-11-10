# 📦 Hướng dẫn Đóng gói và Tạo Version

## Tổng quan

Hướng dẫn này mô tả cách đóng gói Student App thành installer và tạo version đầu tiên trên hệ thống.

## Yêu cầu

- Node.js 18+
- Python 3.10+
- electron-builder
- PyInstaller
- MinIO (hoặc S3) đã được cấu hình

## Bước 1: Build Student App

### 1.1 Build Backend (Python)

```bash
cd student-app/local-backend
source .venv/bin/activate
pip install pyinstaller
pyinstaller build_backend.spec
```

Backend executable sẽ được tạo tại: `student-app/local-backend/dist/local-backend`

### 1.2 Build Renderer (React)

```bash
cd student-app/desktop
npm install
npm run build:renderer
```

### 1.3 Build Electron App

```bash
cd student-app/desktop
npm run dist
```

Hoặc build cho platform cụ thể:

```bash
# macOS
npm run dist:mac

# Windows
npm run dist:win

# Linux
npm run dist:linux
```

Installer sẽ được tạo trong `student-app/desktop/dist/`

## Bước 2: Tạo Version trên Remote API

### 2.1 Chuẩn bị Metadata

Tạo file `version_info.json`:

```json
{
  "version": "1.0.0",
  "version_code": 10000,
  "platform": "macos",
  "release_type": "stable",
  "release_notes": "Version đầu tiên của AI Personalized Learning System",
  "is_mandatory": false
}
```

### 2.2 Upload Version qua Admin Dashboard

1. Đăng nhập vào Admin Dashboard: http://localhost:3001
2. Vào trang **Versions**
3. Click **Upload Version**
4. Điền thông tin:
   - **File**: Chọn installer file từ `student-app/desktop/dist/`
   - **Version**: `1.0.0`
   - **Version Code**: `10000` (format: major * 10000 + minor * 100 + patch)
   - **Platform**: `macos`, `windows`, hoặc `linux`
   - **Release Type**: `stable`, `beta`, hoặc `alpha`
   - **Release Notes**: Mô tả version
   - **Is Mandatory**: `false` (cho version đầu tiên)
5. Click **Upload**

### 2.3 Upload qua API (Alternative)

```bash
curl -X POST http://localhost:8001/api/v1/updates/admin/versions/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@student-app/desktop/dist/AI-Personalized-Learning-1.0.0.dmg" \
  -F "version=1.0.0" \
  -F "version_code=10000" \
  -F "platform=macos" \
  -F "release_type=stable" \
  -F "release_notes=Version đầu tiên" \
  -F "is_mandatory=false"
```

## Bước 3: Kiểm tra Version

### 3.1 Kiểm tra trên Admin Dashboard

1. Vào trang **Versions**
2. Xác nhận version mới đã được tạo
3. Kiểm tra download URL

### 3.2 Test Update Check

```bash
curl -X POST http://localhost:8001/api/v1/updates/check \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "macos",
    "current_version": "0.0.0",
    "current_version_code": 0
  }'
```

Response sẽ trả về thông tin version mới nếu có.

## Bước 4: Cấu hình MinIO (nếu chưa có)

### 4.1 Setup MinIO

```bash
# Chạy MinIO với Docker
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

### 4.2 Cấu hình Remote API

Thêm vào `remote-api/.env`:

```env
STORAGE_TYPE=minio
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false
MINIO_BUCKET_INSTALLERS=installers
```

### 4.3 Khởi động lại Remote API

```bash
cd remote-api
source .venv/bin/activate
uvicorn app.main:app --reload --port 8001
```

## Checklist Version Đầu Tiên

- [ ] Backend đã được build thành executable
- [ ] Renderer đã được build
- [ ] Electron app đã được đóng gói thành installer
- [ ] Version metadata đã được chuẩn bị
- [ ] Installer đã được upload lên MinIO/local storage
- [ ] Version record đã được tạo trong database
- [ ] Download URL hoạt động đúng
- [ ] Update check API trả về đúng version

## Lưu ý

1. **Version Code**: Phải tăng dần theo thời gian. Format: `major * 10000 + minor * 100 + patch`
   - `1.0.0` → `10000`
   - `1.0.1` → `10001`
   - `1.1.0` → `10100`
   - `2.0.0` → `20000`

2. **File Naming**: Installer file nên có format: `{platform}-{version}-{filename}`
   - Ví dụ: `macos-1.0.0-AI-Personalized-Learning.dmg`

3. **Storage**:
   - Local storage: Files được lưu tại `remote-api/storage/installers/`
   - MinIO: Files được lưu trong bucket `installers`

4. **Security**:
   - Đảm bảo MinIO credentials được bảo mật
   - Sử dụng HTTPS trong production
   - Giới hạn quyền truy cập bucket

## Troubleshooting

### Lỗi: "File not found"
- Kiểm tra file đã được upload đúng chưa
- Kiểm tra MinIO bucket và object name

### Lỗi: "Version code already exists"
- Tăng version code lên
- Hoặc xóa version cũ (nếu cần)

### Lỗi: "MinIO connection failed"
- Kiểm tra MinIO đang chạy
- Kiểm tra credentials trong `.env`
- Kiểm tra network connectivity
