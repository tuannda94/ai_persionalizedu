# Hướng dẫn chạy Poly AI Demo (Version đơn giản)

Version này không cần backend, gọi trực tiếp Ollama từ Electron.

## Yêu cầu

- Node.js 16+
- Ollama đã được cài đặt
- Model đã được pull (mặc định: `llama3`)

## Bước 1: Cài đặt Ollama

### macOS/Linux:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows:
Download từ https://ollama.ai/download

## Bước 2: Pull Model

```bash
ollama pull llama3
```

Hoặc model khác:
```bash
ollama pull mistral
ollama pull phi3:mini
```

## Bước 3: Cài đặt và Build Desktop App

```bash
cd desktop
npm install
npm run build
```

## Bước 4: Chạy App

```bash
npm start
```

## Sử dụng

1. Mở app
2. Nhập câu hỏi vào textarea
3. Click "Hỏi AI"
4. Đợi kết quả từ Ollama

## Troubleshooting

### "Failed to start Ollama"
- Kiểm tra Ollama đã được cài: `ollama --version`
- Kiểm tra Ollama trong PATH
- Thử chạy manual: `ollama run llama3`

### Model không tìm thấy
- Pull model: `ollama pull llama3`
- Hoặc set environment variable: `OLLAMA_MODEL=mistral npm start`

### Build lỗi
- Xóa `node_modules`: `rm -rf node_modules`
- Cài lại: `npm install`
- Build lại: `npm run build`

## Notes

- App này không cần backend server
- Tất cả xử lý diễn ra local
- Model chạy trên máy của bạn
- Không cần internet (sau khi đã pull model)

