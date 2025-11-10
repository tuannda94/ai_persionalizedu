# 🚀 Hướng dẫn Start Services

## Cách 1: Start từng service riêng (Khuyên dùng)

### Terminal 1: Remote API + Admin Dashboard
```bash
bash ./scripts/start/start_all.sh
```

Services sẽ chạy:
- 🌐 Remote API: http://localhost:8001
- 📊 Admin Dashboard: http://localhost:3000

### Terminal 2: Student App (Electron)
```bash
bash ./scripts/start/start_student_app.sh
```

Electron app sẽ mở tự động.

---

## Cách 2: Sử dụng start_dev.sh (Interactive)

```bash
bash ./scripts/start/start_dev.sh
```

Chọn option:
- **1**: Start Remote API + Admin Dashboard
- **2**: Start Student App
- **3**: Start tất cả (cần nhiều terminal)

---

## Cách 3: Start thủ công từng service

### Start Remote API:
```bash
cd remote-api
source .venv/bin/activate
uvicorn app.main:app --reload --port 8001
```

### Start Admin Dashboard:
```bash
cd admin-dashboard
npm install  # Lần đầu tiên
npm start
```

### Start Student App:
```bash
bash ./scripts/start/start_student_app.sh
```

---

## Tips

1. **Sử dụng tmux/screen** để quản lý nhiều terminal:
   ```bash
   # Install tmux (nếu chưa có)
   brew install tmux  # macOS
   
   # Start tmux session
   tmux new -s dev
   
   # Split window (Ctrl+B, then %)
   # Run services in different panes
   ```

2. **Sử dụng VS Code Terminal**:
   - Mở nhiều terminal tabs trong VS Code
   - Mỗi tab chạy một service

3. **Check logs**:
   - Remote API: `/tmp/remote-api.log`
   - Admin Dashboard: `/tmp/admin-dashboard.log`
   - Student App: `/tmp/local-backend.log`

---

## Troubleshooting

### Port đã được sử dụng:
```bash
# Kill process on port 8001 (Remote API)
lsof -ti :8001 | xargs kill -9

# Kill process on port 3000 (Admin Dashboard)
lsof -ti :3000 | xargs kill -9

# Kill process on port 8000 (Student App Backend)
lsof -ti :8000 | xargs kill -9
```

### Services không start:
1. Kiểm tra dependencies đã cài đặt chưa
2. Kiểm tra ports có bị chiếm không
3. Xem logs để biết lỗi cụ thể
