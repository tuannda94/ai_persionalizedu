# 🚧 Tính năng Cần Implement

## Tổng quan

Để đáp ứng yêu cầu:
- ✅ Đóng gói toàn bộ để cài trên máy tính
- ❌ Tự động update khi có version mới
- ❌ Admin quản trị versions, RAG mới, model mới
- ❌ Install update linh hoạt theo tốc độ mạng

## 1. Auto-Update System

### Desktop App (`student-app/desktop/`)

#### Cần implement:

1. **electron-updater Integration**
   ```bash
   cd student-app/desktop
   npm install electron-updater
   ```

2. **Update Check Logic**
   - Check khi app start
   - Check định kỳ (mỗi giờ)
   - Manual check button

3. **Download với Progress**
   - Background download
   - Progress bar trong UI
   - Pause/Resume support
   - Retry logic cho slow network
   - Resume từ breakpoint

4. **Install Logic**
   - Verify file hash
   - Install update
   - Restart app

#### Files cần tạo/sửa:

**`student-app/desktop/src/main/updater.js`** (NEW):
```javascript
const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron');

// Configure update server
autoUpdater.setFeedURL({
  provider: 'generic',
  url: process.env.UPDATE_SERVER_URL || 'https://api.fpt.edu.vn/updates'
});

// Check for updates
function checkForUpdates() {
  autoUpdater.checkForUpdates();
}

// Handle update events
autoUpdater.on('update-available', (info) => {
  // Notify renderer
});

autoUpdater.on('download-progress', (progress) => {
  // Send progress to renderer
});

autoUpdater.on('update-downloaded', () => {
  // Notify user, install on next restart
});
```

**`student-app/desktop/src/renderer/components/UpdateDialog.jsx`** (NEW):
- Progress bar
- Pause/Resume button
- Cancel button
- Network speed indicator

**`student-app/desktop/package.json`**:
- Add `electron-updater` dependency

**`student-app/desktop/electron-builder.yml`**:
```yaml
publish:
  provider: generic
  url: https://api.fpt.edu.vn/updates
```

### Remote API (`remote-api/`)

#### Cần implement:

1. **File Hosting**
   - Upload installer files
   - Store files (local hoặc S3)
   - Generate download URLs

2. **Update Metadata**
   - File size
   - File hash (SHA-256)
   - Changelog
   - Release date

#### Files cần tạo/sửa:

**`remote-api/app/api/v1/updates.py`**:
- Thêm `POST /admin/versions/upload` - Upload installer
- Thêm file storage logic

**`remote-api/app/services/file_service.py`** (NEW):
- File upload
- File storage
- Hash calculation
- Download URL generation

**`remote-api/app/models/version.py`**:
- Đã có: `file_size`, `file_hash`
- Cần thêm: `file_path` (storage path)

## 2. Model Package Updates

### Desktop App

#### Cần implement:

1. **Package Check Logic**
   - Check định kỳ cho packages mới
   - Compare versions với server

2. **Package Download**
   - Download từ remote API
   - Background download
   - Progress tracking
   - Retry logic cho slow network

3. **Package Update**
   - Verify package hash
   - Extract to `storage/model-packages/`
   - Reload RAG engine

#### Files cần tạo:

**`student-app/local-backend/app/services/package_service.py`** (NEW):
```python
def check_for_package_updates():
    """Check for new packages from remote API"""
    pass

def download_package(package_id, progress_callback):
    """Download package with progress"""
    pass

def update_package(package_path):
    """Extract and update package"""
    pass
```

**`student-app/desktop/src/renderer/components/PackageUpdateDialog.jsx`** (NEW):
- Package list
- Download progress
- Update status

### Remote API

#### Cần implement:

1. **Package Management Endpoints**
   - `POST /admin/packages/upload` - Upload package
   - `GET /packages/list` - List packages
   - `GET /packages/check` - Check for updates
   - `GET /packages/{id}/download` - Download package

2. **Package Storage**
   - Store packages (local hoặc S3)
   - Package versioning
   - Package metadata

#### Files cần tạo:

**`remote-api/app/api/v1/packages.py`** (NEW):
- Package management endpoints

**`remote-api/app/models/package.py`** (NEW):
```python
class ModelPackage(Base):
    id = Column(UUID)
    subject = Column(String)  # CS101, PHP1, ...
    version = Column(String)  # v1, v2, ...
    file_path = Column(String)
    file_size = Column(BigInteger)
    file_hash = Column(String)
    published_at = Column(DateTime)
```

**`remote-api/app/services/package_service.py`** (NEW):
- Package upload
- Package storage
- Package download

## 3. Admin Dashboard

### Version Management UI

#### Cần implement:

**`admin-dashboard/src/pages/Versions.jsx`**:
```jsx
// Upload Version
- Drag & drop installer
- Version metadata form
- Platform selection
- Mandatory flag
- Publish button

// Version List
- Table với versions
- Filters (platform, status)
- Actions (publish, rollback, delete)
- Download stats
```

**Files cần tạo**:
- `admin-dashboard/src/components/VersionUpload.jsx`
- `admin-dashboard/src/components/VersionList.jsx`
- `admin-dashboard/src/components/VersionForm.jsx`

### Package Management UI

#### Cần implement:

**`admin-dashboard/src/pages/Packages.jsx`** (NEW):
```jsx
// Upload Package
- Drag & drop JSONL + manifest
- Subject selection
- Version input
- Upload button

// Package List
- Table với packages
- Filters (subject, version)
- Actions (publish, delete)
- Usage stats
```

**Files cần tạo**:
- `admin-dashboard/src/pages/Packages.jsx`
- `admin-dashboard/src/components/PackageUpload.jsx`
- `admin-dashboard/src/components/PackageList.jsx`

### Analytics Dashboard

#### Cần implement:

**`admin-dashboard/src/pages/Analytics.jsx`**:
- Update statistics (success rate, errors)
- Package usage (which subjects used most)
- User analytics (active users, queries)
- Performance metrics (response times)

## 4. Network-Aware Updates

### Slow Network Support

#### Cần implement:

1. **Progress Tracking**
   - Real-time download speed
   - Estimated time remaining
   - Bytes downloaded/total

2. **Retry Logic**
   - Exponential backoff
   - Max retries
   - Resume từ breakpoint

3. **Pause/Resume**
   - Pause download
   - Resume later
   - Save progress

4. **Network Detection**
   - Detect slow network
   - Adjust download strategy
   - Optional: Download only when on WiFi

#### Implementation:

**`student-app/desktop/src/main/updater.js`**:
```javascript
// Detect network speed
function detectNetworkSpeed() {
  // Measure download speed
  // Return: 'fast', 'medium', 'slow'
}

// Adjust download strategy
if (networkSpeed === 'slow') {
  // Use smaller chunks
  // More retries
  // Lower priority
}
```

## Implementation Priority

### 🔴 High Priority (Cần ngay)
1. Auto-update system (electron-updater)
2. File hosting (Remote API)
3. Version management UI (Admin)
4. Update check/download logic

### 🟡 Medium Priority
1. Model package updates
2. Package management UI (Admin)
3. Update progress tracking
4. Retry logic (slow network)

### 🟢 Low Priority
1. Analytics dashboard
2. Code signing
3. CDN integration
4. Network detection

## Estimated Time

- Auto-update system: 2-3 days
- File hosting: 1 day
- Version management UI: 2-3 days
- Package updates: 2-3 days
- Package management UI: 2 days
- **Total: ~10-12 days**
