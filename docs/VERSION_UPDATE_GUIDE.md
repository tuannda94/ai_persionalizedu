# 🔄 Hướng dẫn Cập nhật Version

## Tổng quan

Hướng dẫn này mô tả cách tạo và publish version mới của Student App sau khi đã có version đầu tiên.

## Quy trình Cập nhật Version

### Bước 1: Cập nhật Version Number

#### 1.1 Cập nhật package.json

```bash
cd student-app/desktop
# Sửa version trong package.json
# Ví dụ: từ "1.0.0" → "1.0.1"
```

Hoặc sử dụng npm:

```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
```

#### 1.2 Tính Version Code

Version code = `major * 10000 + minor * 100 + patch`

Ví dụ:
- `1.0.0` → `10000`
- `1.0.1` → `10001`
- `1.1.0` → `10100`
- `2.0.0` → `20000`

### Bước 2: Build Version Mới

```bash
# 1. Build backend
cd student-app/local-backend
source .venv/bin/activate
pyinstaller build_backend.spec

# 2. Build renderer
cd ../desktop
npm run build:renderer

# 3. Build installer
npm run dist
```

### Bước 3: Upload Version Mới

#### Cách 1: Qua Admin Dashboard (Khuyên dùng)

1. Đăng nhập Admin Dashboard: http://localhost:3001
2. Vào trang **Versions**
3. Click **Upload Version**
4. Điền thông tin:
   - **File**: Chọn installer mới
   - **Version**: Version mới (ví dụ: `1.0.1`)
   - **Version Code**: Version code tương ứng (ví dụ: `10001`)
   - **Platform**: `macos`, `windows`, hoặc `linux`
   - **Release Type**:
     - `stable`: Version ổn định, khuyên dùng
     - `beta`: Version thử nghiệm
     - `alpha`: Version phát triển
   - **Release Notes**: Mô tả thay đổi
   - **Is Mandatory**:
     - `true`: Bắt buộc update (không thể bỏ qua)
     - `false`: Tùy chọn update
   - **Min Version Code** (optional): Version code tối thiểu để update
5. Click **Upload**

#### Cách 2: Qua API

```bash
curl -X POST http://localhost:8001/api/v1/updates/admin/versions/upload \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@student-app/desktop/dist/AI-Personalized-Learning-1.0.1.dmg" \
  -F "version=1.0.1" \
  -F "version_code=10001" \
  -F "platform=macos" \
  -F "release_type=stable" \
  -F "release_notes=Bug fixes and performance improvements" \
  -F "is_mandatory=false"
```

### Bước 4: Publish Version

Sau khi upload, version sẽ tự động được publish (nếu `published_at` được set).

Để unpublish hoặc republish:

1. Vào trang **Versions** trong Admin Dashboard
2. Tìm version cần quản lý
3. Click **Edit** hoặc **Publish/Unpublish**

### Bước 5: Kiểm tra Update

#### Test Update Check API

```bash
curl -X POST http://localhost:8001/api/v1/updates/check \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "macos",
    "current_version": "1.0.0",
    "current_version_code": 10000
  }'
```

Response mong đợi:

```json
{
  "has_update": true,
  "latest_version": "1.0.1",
  "latest_version_code": 10001,
  "download_url": "http://localhost:8001/api/v1/files/download/installers/macos-1.0.1-installer.dmg",
  "release_notes": "Bug fixes and performance improvements",
  "is_mandatory": false,
  "file_size": 12345678
}
```

#### Test trong Student App

1. Mở Student App
2. Click nút **Update** (nếu có update)
3. Kiểm tra update flow hoạt động đúng

## Quản lý Multiple Platforms

Khi cần publish cho nhiều platform:

1. Build installer cho từng platform:
   ```bash
   npm run dist:mac
   npm run dist:win
   npm run dist:linux
   ```

2. Upload từng installer với cùng version nhưng platform khác nhau:
   - `macos-1.0.1-installer.dmg`
   - `windows-1.0.1-installer.exe`
   - `linux-1.0.1-installer.AppImage`

## Version Strategy

### Semantic Versioning

- **MAJOR** (2.0.0): Breaking changes
- **MINOR** (1.1.0): New features, backward compatible
- **PATCH** (1.0.1): Bug fixes, backward compatible

### Release Types

- **stable**: Production-ready, tested
- **beta**: Feature-complete, testing phase
- **alpha**: Early development, may have bugs

### Mandatory Updates

Đặt `is_mandatory: true` khi:
- Security fixes
- Critical bugs
- Breaking changes cần migration

## Rollback Version

Nếu version mới có vấn đề:

1. **Unpublish version mới**:
   - Vào Admin Dashboard → Versions
   - Tìm version có vấn đề
   - Click **Unpublish**

2. **Hoặc publish version cũ**:
   - Tìm version ổn định trước đó
   - Click **Publish**

3. **Hoặc tạo hotfix**:
   - Tạo version patch mới (ví dụ: `1.0.2`)
   - Upload và publish ngay

## Best Practices

1. **Test trước khi publish**:
   - Test installer trên clean machine
   - Test update flow từ version cũ
   - Test rollback nếu cần

2. **Release Notes rõ ràng**:
   - Liệt kê thay đổi chính
   - Breaking changes (nếu có)
   - Known issues (nếu có)

3. **Versioning consistency**:
   - Giữ version code tăng dần
   - Không skip version numbers
   - Document version history

4. **Staging environment**:
   - Test trên staging trước
   - Publish beta version trước stable
   - Monitor update adoption

## Automation (Future)

Có thể tự động hóa bằng CI/CD:

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  build-and-upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build
        run: |
          cd student-app/desktop
          npm run dist
      - name: Upload Version
        run: |
          curl -X POST $API_URL/api/v1/updates/admin/versions/upload \
            -H "Authorization: Bearer $API_TOKEN" \
            -F "file=@dist/installer.dmg" \
            -F "version=$VERSION" \
            -F "version_code=$VERSION_CODE" \
            ...
```

## Troubleshooting

### Update không hiển thị
- Kiểm tra version code > current version code
- Kiểm tra platform khớp
- Kiểm tra version đã được publish chưa

### Download failed
- Kiểm tra MinIO/storage accessible
- Kiểm tra file size và permissions
- Kiểm tra network connectivity

### Installer không chạy
- Kiểm tra file integrity (hash)
- Kiểm tra platform compatibility
- Test trên clean environment

