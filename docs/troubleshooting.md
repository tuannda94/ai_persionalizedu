# 🔧 Troubleshooting Guide

## Lỗi thường gặp

### 1. Backend không start

**Triệu chứng**: Desktop app không kết nối được

**Kiểm tra**:
```bash
# Kiểm tra backend có chạy không
curl http://localhost:8000/health

# Kiểm tra port 8000
lsof -i :8000
```

**Giải pháp**:
- Chạy lại: `./scripts/start/start_student_app.sh`
- Hoặc start backend riêng:
```bash
cd student-app/local-backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 2. Model packages không tìm thấy

**Triệu chứng**: RAG engine không load được subjects

**Kiểm tra**:
```bash
ls storage/model-packages/
```

**Giải pháp**:
```bash
./scripts/build/build_data_pipeline.sh
```

### 3. Ollama không chạy

**Triệu chứng**: Chat không có response

**Kiểm tra**:
```bash
curl http://localhost:11434/api/generate
```

**Giải pháp**:
```bash
ollama serve
ollama pull llama3
```

### 4. Port conflict

**Triệu chứng**: Backend không start, port đã được dùng

**Giải pháp**:
- Thay đổi port trong `student-app/local-backend/app/config.py`
- Hoặc kill process đang dùng port:
```bash
lsof -ti:8000 | xargs kill
```

### 5. Dependencies chưa cài

**Triệu chứng**: Import errors

**Giải pháp**:
```bash
# Local backend
cd student-app/local-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Desktop
cd student-app/desktop
npm install
cd renderer && npm install
```

### 6. Database errors

**Triệu chứng**: SQLite errors

**Giải pháp**:
- Xóa database cũ:
```bash
rm student-app/local-backend/storage/databases/chat_history.db
```
- Backend sẽ tự tạo lại khi start

### 7. Remote API không kết nối

**Triệu chứng**: Authentication/telemetry fails

**Kiểm tra**:
- Remote API có chạy không
- `.env` file có đúng không
- DATABASE_URL và JWT_SECRET_KEY có set không

**Giải pháp**:
```bash
cd remote-api
# Tạo .env
cat > .env << EOF
DATABASE_URL=postgresql://user:pass@localhost/dbname
JWT_SECRET_KEY=your-secret-key
EOF

./scripts/start/start_remote_api.sh
```

## Debug Tips

### Check logs
```bash
# Local backend logs
tail -f student-app/local-backend/storage/logs/*.log

# Desktop app logs
# Mở DevTools trong Electron (View > Toggle Developer Tools)
```

### Test endpoints
```bash
# Health check
curl http://localhost:8000/health

# Test chat (non-streaming)
curl -X POST http://localhost:8000/api/v1/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"question": "test"}'
```

### Check RAG engine
```bash
# Vào Python shell
cd student-app/local-backend
source .venv/bin/activate
python
>>> from app.services.rag_service import get_loaded_subjects
>>> print(get_loaded_subjects())
```
