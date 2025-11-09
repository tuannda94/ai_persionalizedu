# 🪣 MinIO Setup Guide

## Tổng quan

MinIO là một object storage server tương thích với S3 API, được sử dụng để **lưu trữ và phân phối updates**:
- **App installers** (versions) - để sinh viên download và cập nhật phần mềm
- **Model packages** (RAG data) - để sinh viên download và cập nhật model packages về local

### ⚠️ Lưu ý quan trọng

**Phần mềm vẫn đóng gói toàn bộ ở local máy sinh viên** khi cài đặt lần đầu.

**MinIO chỉ dùng để:**
- Lưu trữ các phiên bản mới (versions) trên server
- Lưu trữ các model packages mới trên server
- Phân phối updates cho sinh viên khi có phiên bản/package mới
- Sinh viên download từ MinIO về local máy của mình khi có update

**Flow hoạt động:**
1. Initial install: Phần mềm được đóng gói toàn bộ → cài đặt local
2. Check updates: App check Remote API → có version/package mới?
3. Download: Nếu có → download từ MinIO về local
4. Apply: Cài đặt version mới hoặc extract package mới vào local
5. Run: App tiếp tục chạy hoàn toàn local

Xem [STORAGE_ARCHITECTURE.md](STORAGE_ARCHITECTURE.md) để hiểu rõ hơn về kiến trúc storage.

## Lợi ích của MinIO

1. **Scalable**: Có thể mở rộng dễ dàng
2. **S3-compatible**: Tương thích với S3 API
3. **High Performance**: Hiệu suất cao
4. **Easy Management**: Dễ quản lý qua web console
5. **Production Ready**: Sẵn sàng cho production

## Cài đặt MinIO

### Option 1: Docker (Recommended)

```bash
# Run setup script
./scripts/setup/setup_minio.sh

# Hoặc manual
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v "$(pwd)/storage/minio-data:/data" \
  minio/minio server /data --console-address ":9001"
```

### Option 2: Binary

Download từ https://min.io/download và chạy:

```bash
minio server /path/to/data --console-address ":9001"
```

## Cấu hình Remote API

### 1. Update `.env` file

```env
# Storage type
STORAGE_TYPE=minio

# MinIO configuration
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false

# Buckets
MINIO_BUCKET_INSTALLERS=installers
MINIO_BUCKET_PACKAGES=packages
```

### 2. Initialize buckets

```bash
cd remote-api
python scripts/setup/init_minio_buckets.py
```

Hoặc buckets sẽ được tạo tự động khi server start.

## Sử dụng

### Upload Files

Files sẽ tự động được upload vào MinIO khi:
- Admin upload version qua Admin Dashboard
- Admin upload package qua Admin Dashboard

### Download Files

Files có thể được download qua:
1. **Presigned URL** (tự động, valid 1 hour)
2. **API endpoint** (`/api/v1/files/download/{subdirectory}/{filename}`)

### MinIO Console

Truy cập MinIO Console tại: http://localhost:9001

- Login với: `minioadmin` / `minioadmin`
- Quản lý buckets và files
- Xem statistics
- Set policies

## Migration từ Local Storage

### 1. Backup local files

```bash
# Backup installers
cp -r remote-api/storage/installers /backup/installers

# Backup packages
cp -r remote-api/storage/packages /backup/packages
```

### 2. Upload to MinIO

Có thể upload thủ công qua MinIO Console hoặc viết script migration.

### 3. Update STORAGE_TYPE

```env
STORAGE_TYPE=minio
```

### 4. Restart server

```bash
cd remote-api
./scripts/start/start_remote_api.sh
```

## Production Setup

### 1. Change Default Credentials

```env
MINIO_ROOT_USER=your-secure-username
MINIO_ROOT_PASSWORD=your-secure-password
```

### 2. Use HTTPS

```env
MINIO_SECURE=true
MINIO_ENDPOINT=minio.yourdomain.com:443
```

### 3. Setup MinIO Cluster (High Availability)

Xem: https://min.io/docs/minio/linux/operations/install-deploy-manage/deploy-minio-multi-node-multi-drive.html

### 4. Backup Strategy

- Setup MinIO replication
- Regular backups to external storage
- Versioning (nếu cần)

## Troubleshooting

### MinIO không kết nối được

1. **Check MinIO is running**:
```bash
docker ps | grep minio
curl http://localhost:9000/minio/health/live
```

2. **Check credentials**:
```bash
# Test connection
python -c "from app.services.minio_service import get_minio_service; s = get_minio_service(); print('OK' if s.client else 'FAILED')"
```

3. **Check network**:
```bash
telnet localhost 9000
```

### Files không upload được

1. Check bucket exists
2. Check permissions
3. Check disk space
4. Check logs: `docker logs minio`

### Download URL không hoạt động

1. Check presigned URL expiration
2. Check MinIO endpoint accessibility
3. Fallback to API endpoint

## Monitoring

### MinIO Metrics

- Access MinIO Console: http://localhost:9001
- View statistics, usage, performance

### Application Logs

Check Remote API logs for MinIO operations:
```bash
tail -f remote-api/logs/app.log | grep -i minio
```

## Best Practices

1. **Use separate buckets** cho installers và packages
2. **Set bucket policies** để control access
3. **Enable versioning** nếu cần rollback
4. **Regular backups** của MinIO data
5. **Monitor disk usage** và set alerts
6. **Use HTTPS** trong production
7. **Rotate access keys** định kỳ

## References

- MinIO Documentation: https://min.io/docs/
- MinIO Python SDK: https://min.io/docs/minio/linux/developers/python/API.html
- S3 API Compatibility: https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html

