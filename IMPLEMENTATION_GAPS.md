# ⚠️ Gaps trong Implementation - Cần Bổ sung

## 1. Auto-Update System

### Yêu cầu
- Tự động check updates từ Remote API
- Download updates trong background
- Install updates với progress tracking
- Mandatory vs optional updates
- Rollback nếu fail

### Hiện trạng
- ❌ Chưa có electron-updater
- ❌ Chưa có update logic
- ❌ Chưa có update UI

### Cần implement

#### 1.1 Install electron-updater
```bash
cd student-app/desktop
npm install electron-updater
```

#### 1.2 Tạo updater service
File: `student-app/desktop/src/main/updater.js`

```javascript
const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron');

// Configure auto-updater
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://api.fpt.edu.vn/api/v1/updates/download'
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

autoUpdater.on('update-downloaded', (info) => {
  // Notify user, install on restart
});
```

#### 1.3 Tích hợp vào main.js
- Call checkForUpdates() khi app start
- Setup IPC để renderer có thể trigger update

#### 1.4 Update UI trong renderer
- Progress bar
- Update notification
- Install button

## 2. RAG Model Package Updates

### Yêu cầu
- Check for new model packages từ Remote API
- Download model packages mới
- Replace model packages cũ
- Reload RAG engine
- Version tracking

### Hiện trạng
- ❌ Chưa có API endpoint cho model packages
- ❌ Chưa có download logic
- ❌ Chưa có version tracking

### Cần implement

#### 2.1 Remote API - Model Package Management
File: `remote-api/app/api/v1/model_packages.py`

```python
@router.get("/model-packages/check")
async def check_model_updates(
    current_versions: dict,  # {"CS101": "v1", "PHP1": "v1"}
    db: Session = Depends(get_db)
):
    """Check for model package updates"""
    # Compare với versions trong database
    # Return list of updates available

@router.get("/model-packages/{subject}/download")
async def download_model_package(
    subject: str,
    version: str,
    db: Session = Depends(get_db)
):
    """Download model package (stream)"""
    # Stream file từ storage
```

#### 2.2 Model Package Model
File: `remote-api/app/models/model_package.py`

```python
class ModelPackage(Base):
    subject: str
    version: str
    file_url: str
    file_size: int
    file_hash: str
    created_at: datetime
```

#### 2.3 Local Backend - Update Service
File: `student-app/local-backend/app/services/model_update_service.py`

```python
def check_for_updates(current_versions: dict) -> List[dict]:
    """Check for model package updates"""
    # Call remote API
    # Return updates available

def download_model_package(subject: str, version: str) -> Path:
    """Download và save model package"""
    # Download từ remote API
    # Save vào storage/model-packages/
    # Return path

def install_model_package(subject: str, version: str):
    """Install model package"""
    # Replace old version
    # Reload RAG engine
```

#### 2.4 Desktop - Update UI
- Check for updates button
- Download progress
- Install notification

## 3. Admin Dashboard - Version Management

### Yêu cầu
- Upload installer files
- Tạo version mới
- Set mandatory updates
- Quản lý model packages
- Analytics

### Hiện trạng
- ⚠️ Có API endpoints (trong remote-api)
- ❌ Chưa có UI

### Cần implement

#### 3.1 Versions Page
File: `admin-dashboard/src/pages/Versions.jsx`

- List versions
- Upload installer form
- Create version form
- Set mandatory toggle
- Delete version

#### 3.2 Model Packages Page
File: `admin-dashboard/src/pages/ModelPackages.jsx`

- List model packages
- Upload model package form
- Version management
- Delete package

#### 3.3 File Upload Component
- Drag & drop
- Progress bar
- File validation

## 4. Flexible Download

### Yêu cầu
- Download progress tracking
- Pause/resume
- Retry on failure
- Background download

### Cần implement

#### 4.1 Download Manager
File: `student-app/desktop/src/main/download_manager.js`

```javascript
class DownloadManager {
  download(url, dest, options) {
    // Download với progress
    // Support pause/resume
    // Retry on failure
  }
}
```

#### 4.2 Progress UI
- Progress bar
- Pause/resume button
- Speed indicator
- ETA

## 5. Packaging

### Yêu cầu
- Bundle toàn bộ (app + backend + models)
- Generate installer
- Auto-update support

### Hiện trạng
- ⚠️ Có build scripts cơ bản
- ❌ Chưa hoàn thiện electron-builder config

### Cần implement

#### 5.1 Electron Builder Config
File: `student-app/desktop/electron-builder.yml`

```yaml
appId: com.fpt.ai-personalized-learning
productName: AI Personalized Learning

# Auto-update
publish:
  provider: generic
  url: https://api.fpt.edu.vn/api/v1/updates/download

# Bundle backend
extraResources:
  - from: "../local-backend/dist/ai-learning-backend"
    to: "backend"
  - from: "../../storage/model-packages"
    to: "backend/model-packages"
```

#### 5.2 Build Script
- Build backend executable
- Bundle model packages
- Build Electron app
- Generate installer

## Implementation Order

1. **Packaging** (High) - Cần để test
2. **Auto-Update System** (High) - Core feature
3. **RAG Model Updates** (High) - Core feature
4. **Admin Dashboard UI** (Medium) - Quản trị
5. **Flexible Download** (Medium) - UX improvement

