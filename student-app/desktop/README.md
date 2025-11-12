# 🎓 Student App - Desktop

Desktop application cho sinh viên sử dụng Electron + React, tích hợp với Local Backend để hỏi đáp với AI.

## 📋 Tổng Quan

Desktop app là giao diện người dùng chính cho sinh viên, cung cấp:
- ✅ Chat interface với AI (streaming responses)
- ✅ Conversation management
- ✅ File upload (hình ảnh, PDF, DOCX)
- ✅ Markdown rendering
- ✅ Auto-update notifications
- ✅ Learning package update UI
- ✅ Feedback system

## 🏗️ Kiến Trúc

```
Desktop App (Electron)
    ↓ IPC Communication
Preload Script (Bridge)
    ↓ HTTP Requests
Local Backend (localhost:8000)
    ↓
RAG Engine + Ollama (Local)
```

## 📁 Cấu Trúc

```
desktop/
├── src/
│   ├── main/                    # Electron Main Process
│   │   ├── main.js              # Main entry point, window management
│   │   ├── backend_launcher.js   # Start/stop local backend
│   │   └── updater.js           # Auto-update mechanism
│   │
│   ├── preload/                 # Preload Scripts
│   │   └── preload.js           # IPC bridge, expose APIs
│   │
│   └── renderer/                 # React Renderer Process
│       └── components/          # Legacy components (deprecated)
│
├── renderer/                     # React Application
│   ├── src/
│   │   ├── renderer.js           # Main React component
│   │   ├── components/           # React components
│   │   │   ├── LoginModal.jsx
│   │   │   ├── FeedbackModal.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   ├── LearningPackageUpdateModal.jsx
│   │   │   └── MarkdownRenderer.jsx
│   │   ├── components.js        # Inline components
│   │   └── polyfills/            # Browser polyfills
│   ├── webpack.config.js         # Webpack configuration
│   └── dist/                     # Build output
│
├── resources/                    # Resources
│   └── icons/                    # App icons
│
├── index.html                    # HTML entry point
├── package.json                  # Dependencies và scripts
└── electron-builder.yml          # Electron builder config
```

## 🚀 Cài Đặt

```bash
cd student-app/desktop
npm install
```

## 🔨 Build

### Build Renderer (React)

```bash
npm run build
```

Build React app từ `renderer/src/renderer.js` → `renderer/dist/renderer.bundle.js`

### Build Executable

```bash
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

## ▶️ Chạy App

### Development

```bash
npm start
```

App sẽ:
1. Tự động start Local Backend (nếu chưa chạy)
2. Mở Electron window
3. Load React UI

### Production

Sau khi build executable, chạy file `.app` (macOS), `.exe` (Windows), hoặc `.AppImage` (Linux).

## ⚙️ Cấu Hình

### Environment Variables

```bash
# Backend URL (default: http://localhost:8000)
BACKEND_URL=http://localhost:8000

# Remote API URL (default: http://localhost:8001)
REMOTE_API_URL=http://localhost:8001

# Local Backend URL (for learning package updates)
LOCAL_BACKEND_URL=http://localhost:8000
```

### Preload Script

Preload script (`src/preload/preload.js`) expose các APIs:
- `getBackendUrl()` - Get local backend URL
- `getRemoteApiUrl()` - Get remote API URL
- `checkForUpdates()` - Check for app updates
- `installLearningPackage()` - Install learning package
- `onUpdateStatus()` - Listen for update events
- `onLearningPackageUpdate()` - Listen for learning package updates

## 🔑 Tính Năng

### Chat Interface

- Streaming responses từ AI
- Markdown rendering với syntax highlighting
- Conversation history
- File upload (hình ảnh, PDF, DOCX)

### Auto Update

- Tự động check updates (mỗi giờ)
- Download và install updates
- Learning package updates
- Mandatory update notifications

### Authentication

- Login với Remote API
- JWT token management
- Auto-logout khi token expired

### Feedback

- Gửi feedback về bugs, suggestions
- Tích hợp với Remote API

## 🔧 Development

### Hot Reload

```bash
# Terminal 1: Start Electron
npm start

# Terminal 2: Watch và rebuild renderer
npm run watch
```

### Debug

- DevTools tự động mở trong development mode
- Console logs từ main process và renderer process
- Network tab để debug API calls

## 📦 Dependencies

### Main Dependencies

- `electron` - Desktop framework
- `react` - UI framework
- `antd` - UI components
- `react-markdown` - Markdown rendering
- `electron-updater` - Auto-update
- `webpack` - Bundler

### Build Tools

- `babel-loader` - JavaScript transpiler
- `css-loader`, `style-loader` - CSS processing
- `less-loader` - Less CSS processing

## 🐛 Troubleshooting

### App không mở window

- Kiểm tra console logs trong terminal
- Kiểm tra Local Backend đang chạy: `lsof -i :8000`
- Xem DevTools console (Cmd+Option+I trên macOS)

### Backend không start

- Kiểm tra Python và dependencies đã cài đặt
- Kiểm tra port 8000 đã được dùng chưa
- Xem logs trong `student-app/local-backend/storage/logs/`

### Build lỗi

- Xóa `node_modules` và `npm install` lại
- Xóa `renderer/dist/` và build lại
- Kiểm tra webpack config path

### Update không hoạt động

- Kiểm tra Remote API đang chạy
- Kiểm tra network connection
- Xem logs trong DevTools console

## 📚 Tài Liệu Liên Quan

- [Local Backend README](../local-backend/README.md)
- [Version Management Guide](../../docs/VERSION_MANAGEMENT_GUIDE.md)
- [Learning Package Structure](../../docs/LEARNING_PACKAGE_STRUCTURE.md)

