# 📦 Storage Architecture

## Tổng quan

Hệ thống sử dụng **hybrid storage architecture**:
- **Local Storage** (máy sinh viên): Lưu trữ toàn bộ phần mềm và model packages
- **MinIO** (server): Lưu trữ và phân phối updates

## Kiến trúc Storage

```
┌─────────────────────────────────────────────────────────────┐
│                    REMOTE API SERVER                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MinIO Storage (Server)                   │   │
│  │                                                       │   │
│  │  Bucket: installers/                                 │   │
│  │    - windows-1.0.0-installer.exe                    │   │
│  │    - windows-1.1.0-installer.exe                    │   │
│  │    - macos-1.0.0-installer.dmg                      │   │
│  │                                                       │   │
│  │  Bucket: packages/                                    │   │
│  │    - CS101_v1_package.zip                            │   │
│  │    - CS101_v2_package.zip                            │   │
│  │    - PHP1_v1_package.zip                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Download updates
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              STUDENT MACHINE (Local)                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Application Installation                     │   │
│  │                                                       │   │
│  │  /Applications/PolyAI/                                │   │
│  │    ├── app.exe (or app.app)                          │   │
│  │    ├── backend/                                       │   │
│  │    ├── models/                                        │   │
│  │    └── ...                                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Model Packages (Local)                       │   │
│  │                                                       │   │
│  │  ~/.polyai/model-packages/                           │   │
│  │    ├── CS101_v1/                                      │   │
│  │    │   ├── chunks.jsonl                               │   │
│  │    │   ├── embeddings.npy                             │   │
│  │    │   └── manifest.json                              │   │
│  │    ├── CS101_v2/                                      │   │
│  │    └── PHP1_v1/                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Flow hoạt động

### 1. Initial Installation (Lần đầu cài đặt)

```
Student downloads installer
    │
    ▼
Install to local machine
    │
    ▼
All files bundled locally:
    - Application executable
    - Backend server
    - Initial model packages (if any)
    - Dependencies
```

**Kết quả**: Toàn bộ phần mềm chạy hoàn toàn local, không cần internet.

### 2. Version Update Flow

```
App checks for updates
    │
    ▼
Query Remote API: /api/v1/updates/check
    │
    ▼
If new version available:
    │
    ▼
Download installer from MinIO
    │
    ▼
Install new version locally
    │
    ▼
Replace old version
```

**Kết quả**: Version mới được cài đặt local, app tiếp tục chạy local.

### 3. Model Package Update Flow

```
App checks for package updates
    │
    ▼
Query Remote API: /api/v1/packages/check
    │
    ▼
If new package available:
    │
    ▼
Download package from MinIO
    │
    ▼
Extract to ~/.polyai/model-packages/
    │
    ▼
Reload RAG engine with new package
```

**Kết quả**: Package mới được download về local, RAG engine sử dụng package local.

## Storage Types

### Local Storage (Default)

- **Location**: `remote-api/storage/` (trên server)
- **Use case**: Development, testing, small deployments
- **Pros**: Đơn giản, không cần setup thêm
- **Cons**: Không scalable, khó quản lý nhiều files

### MinIO Storage (Production)

- **Location**: MinIO server (có thể deploy riêng hoặc dùng Docker)
- **Use case**: Production, large deployments, cần scalability
- **Pros**:
  - Scalable
  - High performance
  - S3-compatible
  - Easy management qua web console
  - Presigned URLs cho secure downloads
- **Cons**: Cần setup và maintain MinIO server

## Configuration

### Local Storage

```env
STORAGE_TYPE=local
STORAGE_PATH=./storage
```

### MinIO Storage

```env
STORAGE_TYPE=minio
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false
MINIO_BUCKET_INSTALLERS=installers
MINIO_BUCKET_PACKAGES=packages
```

## File Organization

### On Server (MinIO or Local)

```
installers/
  ├── windows-1.0.0-installer.exe
  ├── windows-1.1.0-installer.exe
  ├── macos-1.0.0-installer.dmg
  └── linux-1.0.0-installer.AppImage

packages/
  ├── CS101_v1_package.zip
  ├── CS101_v2_package.zip
  ├── PHP1_v1_package.zip
  └── PHP2_v1_package.zip
```

### On Student Machine (Local)

```
Application:
  /Applications/PolyAI/ (macOS)
  C:\Program Files\PolyAI\ (Windows)
  ~/Applications/PolyAI/ (Linux)

Model Packages:
  ~/.polyai/model-packages/
    ├── CS101_v1/
    ├── CS101_v2/
    └── PHP1_v1/
```

## Download URLs

### Presigned URLs (MinIO)

Khi dùng MinIO, download URLs là presigned URLs:
- Valid trong 1 hour
- Secure, không cần authentication
- Direct download từ MinIO

### API Endpoints (Local Storage)

Khi dùng local storage, download qua API:
- `/api/v1/files/download/installers/{filename}`
- `/api/v1/files/download/packages/{filename}`
- API sẽ proxy file từ local storage

## Best Practices

1. **Initial Package**: Bundle một số model packages cơ bản trong installer
2. **Update Strategy**:
   - Check updates định kỳ (mỗi khi app start)
   - Download updates trong background
   - Apply updates khi user restart app
3. **Storage Management**:
   - Clean up old packages trên server
   - Archive old versions
   - Monitor storage usage
4. **Security**:
   - Verify file hashes khi download
   - Use HTTPS cho MinIO trong production
   - Rotate access keys định kỳ

## Migration từ Local sang MinIO

1. Setup MinIO server
2. Upload existing files lên MinIO
3. Update `.env`: `STORAGE_TYPE=minio`
4. Restart Remote API
5. Verify downloads hoạt động

Xem [MINIO_SETUP.md](MINIO_SETUP.md) để biết chi tiết.

