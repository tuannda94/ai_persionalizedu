# 🔨 Hướng dẫn Build Desktop App

## Tổng quan

Desktop app được build thành installer chứa:
- Electron app (React frontend)
- Python backend (executable)
- Model packages (RAG data)
- Tất cả dependencies

## Prerequisites

### Development Machine
- Node.js 18+
- Python 3.10+
- npm/yarn

### Build Tools
- electron-builder
- PyInstaller (tự động cài khi build)

## Build Process

### Option 1: Build Tất cả (Recommended)

```bash
# Từ project root
./scripts/build_all.sh
```

Script này sẽ:
1. Build data pipeline (model packages)
2. Build backend executable
3. Build renderer (React)
4. Build Electron app với electron-builder

### Option 2: Build Từng Bước

#### 1. Build Data Pipeline
```bash
./build_data_pipeline.sh
```

#### 2. Build Backend
```bash
cd backend
./scripts/build_backend.sh
# Hoặc
source .venv/bin/activate
pip install pyinstaller
pyinstaller build_backend.spec
```

#### 3. Build Renderer
```bash
cd desktop/renderer
npm run build
```

#### 4. Build Electron App
```bash
cd desktop
npm install electron-builder
npm run dist
```

## Output

Sau khi build, installers sẽ ở:
- **Windows**: `desktop/dist/AI Personalized Learning Setup x.x.x.exe`
- **macOS**: `desktop/dist/AI Personalized Learning-x.x.x.dmg`
- **Linux**: `desktop/dist/AI Personalized Learning-x.x.x.AppImage`

## File Structure trong Package

```
AI Personalized Learning.app (hoặc .exe)
├── Electron App
│   ├── main.js
│   ├── renderer.bundle.js
│   └── ...
├── resources/
│   └── backend/
│       ├── ai-learning-backend (executable)
│       └── model_packages/
│           ├── CS101_v1/
│           ├── PHP1_v1/
│           └── ...
```

## Development vs Production

### Development
- Backend chạy Python trực tiếp
- Hot reload enabled
- Debug console visible

### Production
- Backend chạy executable
- Tất cả bundled
- No external dependencies

## Testing Build

### 1. Test Locally
```bash
# Build
npm run dist

# Test installer (macOS)
open desktop/dist/*.dmg

# Test installer (Windows)
# Run .exe installer

# Test installer (Linux)
chmod +x desktop/dist/*.AppImage
./desktop/dist/*.AppImage
```

### 2. Verify Backend
- App tự động start backend
- Check console logs
- Test API: `http://localhost:8000/health`

## Troubleshooting

### Backend không start
- Check executable path trong `backend_launcher.js`
- Verify executable có quyền execute
- Check console logs

### Model packages không tìm thấy
- Verify `extraResources` trong `package.json`
- Check path trong backend code

### File size quá lớn
- Exclude unused packages trong PyInstaller spec
- Use compression
- Consider splitting packages

## Code Signing (Production)

### macOS
```bash
# Cần Apple Developer account
export APPLE_ID=your@email.com
export APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Build với signing
npm run dist:mac
```

### Windows
```bash
# Cần code signing certificate
# Configure trong electron-builder.yml
```

## Distribution

### Auto-update
- Sử dụng electron-updater
- Host installers trên server
- Configure update server URL

### Manual Distribution
- Upload installers lên website
- Hoặc distribute qua USB/CD

## File Size Estimates

- **Electron app**: ~50MB
- **Backend executable**: ~100-150MB
- **Model packages**: ~10-50MB (tùy data)
- **Total**: ~160-250MB

## Optimization Tips

1. **Exclude unused packages** trong PyInstaller
2. **Compress** với UPX (nếu có)
3. **Split packages** (core + optional data)
4. **Lazy load** model packages khi cần

