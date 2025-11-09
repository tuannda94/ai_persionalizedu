# 🗑️ Files/Folders Cần Xóa

## Sau khi verify, có thể xóa:

### 1. `backend/` folder
- **Lý do**: Code đã được tách thành:
  - `student-app/local-backend/` (chat, RAG, Ollama)
  - `remote-api/` (auth, telemetry, updates)
- **Verify**: Không còn references trong code
- **Action**: `rm -rf backend/`

### 2. `desktop/` folder  
- **Lý do**: Đã move vào `student-app/desktop/`
- **Verify**: `student-app/desktop/` hoạt động
- **Action**: `rm -rf desktop/`

### 3. `shared/` folder
- **Lý do**: Rỗng, không được sử dụng
- **Verify**: Không có files
- **Action**: `rm -rf shared/`

### 4. `node_modules/` ở root
- **Lý do**: Nên ở trong từng component
- **Verify**: Không có package.json ở root hoặc không dùng
- **Action**: `rm -rf node_modules/`

### 5. `package.json`, `package-lock.json` ở root
- **Lý do**: Không cần nếu không có app ở root
- **Verify**: Không có dependencies ở root
- **Action**: `rm package.json package-lock.json`

## Sau khi xóa, cấu trúc sẽ là:

```
AI_PersonalizedU/
├── student-app/
├── remote-api/
├── admin-dashboard/
├── data-pipeline/
├── storage/
├── scripts/
├── docs/
├── .gitignore
└── README.md
```

