# 🧹 Cleanup Notes

## Folders có thể xóa (sau khi verify)

### 1. `backend/` folder
- **Lý do**: Code đã được tách thành:
  - `student-app/local-backend/` (chat, RAG, Ollama)
  - `remote-api/` (auth, telemetry, updates)
- **Action**: Có thể xóa sau khi verify không còn dependencies

### 2. `desktop/` folder
- **Lý do**: Đã move vào `student-app/desktop/`
- **Action**: Có thể xóa nếu đã verify `student-app/desktop/` hoạt động

### 3. `shared/` folder
- **Lý do**: Hiện tại rỗng, không được sử dụng
- **Action**: Có thể xóa

## Verification trước khi xóa

1. Test Student App:
```bash
./scripts/start/start_student_app.sh
```

2. Test Remote API:
```bash
./scripts/start/start_remote_api.sh
```

3. Verify imports không còn reference đến old folders

## Sau khi xóa

Cấu trúc sẽ chỉ còn:
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

