# Troubleshooting Guide

## Lỗi 404 khi POST /query

### Nguyên nhân có thể:

1. **Backend chưa chạy**
   - Kiểm tra: `curl http://localhost:8000/health`
   - Nếu không có response, backend chưa chạy
   - Giải pháp: Chạy `./start_backend.sh` hoặc `cd backend && uvicorn app:app --reload`

2. **URL không đúng**
   - Mở DevTools trong Electron (View > Toggle Developer Tools)
   - Xem Console để kiểm tra URL được gọi
   - Kiểm tra `backendUrl` trong state

3. **CORS blocking**
   - Backend đã có CORS middleware nhưng có thể cần kiểm tra
   - Xem Network tab trong DevTools để xem request có bị block không

4. **Route không tồn tại**
   - Kiểm tra backend console có log khi nhận request không
   - Xem FastAPI docs: `http://localhost:8000/docs`

### Cách debug:

1. **Mở Electron DevTools:**
   - Trong app, nhấn `Cmd+Option+I` (macOS) hoặc `Ctrl+Shift+I` (Windows/Linux)
   - Hoặc trong code: `mainWindow.webContents.openDevTools()`

2. **Kiểm tra Console:**
   - Xem log "Backend URL: ..."
   - Xem log "Sending query to: ..."
   - Xem log "Response status: ..."

3. **Kiểm tra Network tab:**
   - Xem request có được gửi không
   - Xem response status code
   - Xem response body nếu có lỗi

4. **Kiểm tra Backend logs:**
   - Xem console output của backend
   - Kiểm tra có log "🔍 Querying RAG..." không
   - Kiểm tra có lỗi gì không

### Test thủ công:

```bash
# Test backend health
curl http://localhost:8000/health

# Test query endpoint
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"subject": "CS101", "question": "test"}'
```

### Các lỗi thường gặp:

#### "Subject 'CS101' not loaded"
- Nguyên nhân: Vector store chưa được build
- Giải pháp: Chạy `cd data_pipeline && python embed_and_build_package.py`

#### "Ollama error: Connection refused"
- Nguyên nhân: Ollama chưa chạy hoặc URL sai
- Giải pháp:
  - Kiểm tra Ollama: `ollama list`
  - Kiểm tra OLLAMA_URL trong env

#### "Failed to get backend URL from electronAPI"
- Nguyên nhân: Preload script chưa load
- Giải pháp: Kiểm tra `preload.js` có được load trong `main.js` không

