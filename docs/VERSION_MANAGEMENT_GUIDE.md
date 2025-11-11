# 📦 Hướng Dẫn Quản Lý Phiên Bản (Version Management)

## Tổng Quan

Hệ thống quản lý phiên bản cho phép admin tạo và phân phối các phiên bản mới của ứng dụng, bao gồm cả installer và learning package (nếu có).

## Cấu Trúc Version

Mỗi version bao gồm:

### 1. Metadata
- **Version name**: `1.2.3` (semantic versioning)
- **Version code**: `10203` (integer, tăng dần)
- **Platform**: `windows`, `macos`, `linux`
- **Release type**: `stable`, `beta`, `alpha`
- **Ngày phát hành**: Tự động set khi publish
- **Changelog**: Release notes mô tả thay đổi

### 2. Installer File
- **Windows**: `.exe` hoặc `.msi`
- **macOS**: `.dmg`
- **Linux**: `.AppImage` hoặc `.deb`

### 3. Learning Package (Optional)
File ZIP chứa:
- **Embeddings**: Dữ liệu vector (.json, .csv, .bin, hoặc .chroma)
- **RAG Index**: Chroma vector database
- **Config**: `config/model_config.json`, `config/rag_config.json`
- **Scripts**: Local inference scripts (nếu có thay đổi)

Xem chi tiết tại: [LEARNING_PACKAGE_STRUCTURE.md](./LEARNING_PACKAGE_STRUCTURE.md)

## Quy Trình Tạo Version (Admin)

### Bước 1: Chuẩn bị Installer

1. **Build ứng dụng**:
   ```bash
   cd student-app/desktop
   npm run dist:mac    # hoặc dist:win, dist:linux
   ```

2. **Kiểm tra file**:
   - File phải có đúng format cho platform
   - File size hợp lý
   - Test installer trên máy thật

### Bước 2: Chuẩn bị Learning Package (Nếu có)

1. **Tạo package structure**:
   ```
   learning-package-v1.2.3/
   ├── manifest.json
   ├── embeddings/
   ├── rag_index/
   ├── config/
   └── scripts/
   ```

2. **Tạo manifest.json**:
   ```json
   {
     "version": "1.2.3",
     "version_code": 10203,
     "created_at": "2024-11-12T10:00:00Z",
     "description": "Learning package for version 1.2.3",
     "contents": {
       "embeddings": {
         "format": "json",
         "path": "embeddings/embeddings.json",
         "count": 1000,
         "dimension": 384
       },
       "rag_index": {
         "type": "chroma",
         "path": "rag_index/",
         "collection_name": "poly_ai_documents"
       },
       "config": {
         "model_config": "config/model_config.json",
         "rag_config": "config/rag_config.json"
       }
     }
   }
   ```

3. **Đóng gói**:
   ```bash
   zip -r learning-package-v1.2.3.zip learning-package-v1.2.3/
   ```

### Bước 3: Upload qua Admin Dashboard

1. **Truy cập**: `http://localhost:5173/versions` (hoặc port của admin dashboard)

2. **Click "Upload New Version"**

3. **Điền thông tin**:
   - **Installer File**: Chọn file installer (.exe, .dmg, .AppImage)
   - **Version**: `1.2.3`
   - **Version Code**: `10203` (phải lớn hơn version trước)
   - **Platform**: Chọn platform tương ứng
   - **Release Type**: `stable`, `beta`, hoặc `alpha`
   - **Release Notes**: Mô tả thay đổi
   - **Mandatory Update**: Check nếu bắt buộc update
   - **Minimum Version Code**: Version code tối thiểu (nếu có)

4. **Learning Package (Optional)**:
   - **Learning Package File**: Chọn file .zip
   - **Package Manifest**: Paste JSON manifest (hoặc để trống, system sẽ tự generate)

5. **Click "Upload"**

## Quy Trình Update (Student App)

### 1. Check for Updates

App tự động check định kỳ hoặc khi user mở app:

```javascript
// Check for updates
const response = await fetch(`${REMOTE_API_URL}/api/v1/updates/check`, {
  method: 'POST',
  body: JSON.stringify({
    current_version: '1.2.2',
    current_version_code: 10202,
    platform: 'macos'
  })
});

const updateInfo = await response.json();
```

### 2. Download và Install

Nếu có update:

1. **Download installer** (nếu có thay đổi app):
   ```javascript
   // Download installer
   const installerUrl = updateInfo.download_url;
   // Use electron-updater hoặc manual download
   ```

2. **Download learning package** (nếu có):
   ```javascript
   if (updateInfo.has_learning_package) {
     const packageUrl = updateInfo.learning_package_url;
     const packageHash = updateInfo.learning_package_hash;

     // Download và verify hash
     await downloadAndInstallLearningPackage(packageUrl, packageHash);
   }
   ```

### 3. Install Learning Package

```python
# student-app/local-backend/app/services/learning_package_service.py

def install_learning_package(package_path: Path, manifest: dict):
    """
    Install learning package:
    1. Extract to storage/learning-packages/v{version}/
    2. Validate manifest và checksums
    3. Update RAG engine với dữ liệu mới
    4. Reload config
    """
    # Extract package
    extract_path = MODEL_PACKAGES_DIR / f"v{manifest['version']}"
    shutil.unpack_archive(package_path, extract_path)

    # Validate
    validate_package(extract_path, manifest)

    # Update RAG engine
    update_rag_engine(extract_path)

    # Reload config
    reload_config(extract_path / "config")
```

## Best Practices

### Version Numbering

- **Semantic Versioning**: `MAJOR.MINOR.PATCH`
  - **MAJOR**: Breaking changes
  - **MINOR**: New features (backward compatible)
  - **PATCH**: Bug fixes

- **Version Code**: Integer tăng dần
  - `1.0.0` → `10000`
  - `1.0.1` → `10001`
  - `1.1.0` → `10100`
  - `2.0.0` → `20000`

### Learning Package

1. **Chỉ upload khi có thay đổi**: Nếu không có thay đổi learning data, không cần upload package
2. **Incremental updates**: Chỉ include files thay đổi (nếu có thể)
3. **Compression**: Sử dụng compression tốt để giảm size
4. **Validation**: Luôn validate manifest và checksums
5. **Rollback**: Giữ lại package cũ để có thể rollback

### Testing

1. **Test installer** trên máy thật trước khi upload
2. **Test learning package** với app version tương ứng
3. **Test update flow** từ version cũ lên version mới
4. **Test rollback** nếu có vấn đề

## Tham Khảo Các Phần Mềm Desktop

### 1. VS Code
- **Auto-update**: Background download và install
- **Incremental updates**: Chỉ download files thay đổi
- **Rollback**: Có thể rollback về version trước

### 2. Discord
- **Silent updates**: Update trong background
- **Mandatory updates**: Force update khi có security fix
- **Progress indicator**: Hiển thị progress khi download

### 3. Slack
- **Scheduled updates**: Update vào thời điểm phù hợp
- **User notification**: Thông báo khi có update
- **Skip version**: Cho phép skip version (không mandatory)

## Implementation Checklist

- [x] Mở rộng AppVersion model với learning package fields
- [x] Tạo migration script
- [x] Cập nhật API endpoint upload_version
- [x] Cập nhật admin dashboard UI
- [ ] Chạy migration để update database
- [ ] Implement download learning package trong student app
- [ ] Implement install và update RAG engine
- [ ] Implement auto-update mechanism
- [ ] Test end-to-end flow

