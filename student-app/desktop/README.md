# Poly AI Demo - Desktop App

Desktop application đơn giản sử dụng Electron + React, gọi trực tiếp Ollama để trả lời câu hỏi.

## Cài đặt

```bash
cd desktop
npm install
```

## Build Renderer

```bash
npm run build
```

Script này sẽ build React app từ `renderer/src/renderer.js` và output vào `renderer/dist/renderer.bundle.js`

## Chạy App

```bash
npm start
```

## Yêu cầu

- Ollama đã được cài đặt và trong PATH
- Model đã được pull (mặc định: `llama3`)
  ```bash
  ollama pull llama3
  ```

## Cấu trúc

```
desktop/
├─ main.js              # Electron main process
├─ preload.js           # Preload script (expose electronAPI)
├─ index.html           # HTML entry point
├─ package.json         # Dependencies và scripts
└─ renderer/
   ├─ src/
   │  └─ renderer.js    # React component
   ├─ dist/             # Build output (generated)
   │  └─ renderer.bundle.js
   ├─ webpack.config.js # Webpack configuration
   └─ .babelrc          # Babel configuration
```

## Cách hoạt động

1. User nhập câu hỏi trong textarea
2. Click "Hỏi AI"
3. Renderer gọi `window.electronAPI.askAI(query)`
4. Main process spawn `ollama run llama3` và gửi query
5. Kết quả được trả về và hiển thị

## Environment Variables

Có thể set model khác:
```bash
OLLAMA_MODEL=mistral npm start
```

## Troubleshooting

### Ollama không tìm thấy:
- Đảm bảo Ollama đã được cài đặt: `ollama --version`
- Kiểm tra Ollama trong PATH: `which ollama` (macOS/Linux)

### Model không tồn tại:
- Pull model: `ollama pull llama3`
- Hoặc set OLLAMA_MODEL environment variable

### Build lỗi:
- Xóa `node_modules` và `npm install` lại
- Kiểm tra webpack config path
