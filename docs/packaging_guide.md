# 📦 Hướng dẫn Đóng gói Desktop App

## Tổng quan

Desktop app được build thành installer chứa:
1. **Electron app** (React frontend)
2. **Python backend executable** (PyInstaller)
3. **Model packages** (RAG data)
4. **Tất cả dependencies**

## Cấu trúc Package

```
Desktop App Installer
├── Electron App
│   ├── main process
│   ├── renderer (React)
│   └── preload scripts
├── Backend Executable
│   └── ai-learning-backend (PyInstaller)
├── Model Packages
│   ├── CS101_v1/
│   ├── PHP1_v1/
│   └── ...
└── Resources
    └── Icons
```

## Build Process

### 1. Build Data Pipeline

```bash
./scripts/build/build_data_pipeline.sh
```

Output: `storage/model-packages/`

### 2. Build Local Backend Executable

```bash
cd student-app/local-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt pyinstaller
pyinstaller build_backend.spec
```

Output: `student-app/local-backend/dist/ai-learning-backend`

### 3. Build Electron App

```bash
cd student-app/desktop
npm install
cd renderer && npm run build
cd ..
npm run dist
```

Output: `student-app/desktop/dist/`

## Build Script

Sử dụng script tự động:

```bash
./scripts/build/build_student_app.sh
```

Script này sẽ:
1. Build data pipeline
2. Build backend executable
3. Build renderer
4. Build Electron app với electron-builder

## Electron Builder Configuration

File: `student-app/desktop/electron-builder.yml`

```yaml
appId: com.fpt.ai-personalized-learning
productName: AI Personalized Learning

extraResources:
  - from: "../local-backend/dist/ai-learning-backend"
    to: "backend"
  - from: "../../storage/model-packages"
    to: "backend/model-packages"
```

## Output

Sau khi build, installer sẽ ở:
- **macOS**: `student-app/desktop/dist/*.dmg`
- **Windows**: `student-app/desktop/dist/*.exe`
- **Linux**: `student-app/desktop/dist/*.AppImage`

## Installation

Sinh viên cài đặt:
1. Download installer
2. Chạy installer
3. App tự động start local backend khi mở
4. Model packages được bundle sẵn

## Notes

- Ollama cần được cài riêng trên máy sinh viên
- Model packages được bundle vào installer (có thể lớn)
- Backend executable độc lập, không cần Python runtime
