# 🧹 Kế hoạch Cleanup - Tinh gọn Codebase

## Files cần xóa

### 1. Old Backend Files (đã tách thành student-app/local-backend và remote-api)
- `backend/app.py` - Old demo backend
- `backend/chat_storage.py` - Đã thay bằng services
- `backend/start_backend_new.sh` - Không cần
- `backend/test_auth.py` - Test file
- `backend/PHASE1_COMPLETE.md` - Documentation cũ
- `backend/README_PHASE1.md` - Documentation cũ

### 2. Duplicate Documentation
- `REFACTORING_*.md` - Nhiều file refactoring
- `COMPLETE_*.md`
- `SUMMARY.md`
- `MIGRATION_*.md`
- `QUICK_START.md`
- `CODE_ORGANIZATION.md`
- `FINAL_STRUCTURE.md`

### 3. Root Level Files
- `telemetry.log` - Move to storage/logs/
- `query.log` - Move to storage/logs/
- `*.db` files - Move to appropriate storage/
- Old scripts ở root

### 4. Old Structure
- `backend/` folder (sau khi đã move code)
- `desktop/` folder (đã move vào student-app/desktop)

## Cấu trúc Cuối cùng (Tinh gọn)

```
AI_PersonalizedU/
│
├── student-app/              # 🎓 PHẦN MỀM SINH VIÊN
│   ├── desktop/              # Desktop app
│   └── local-backend/        # Local backend
│
├── remote-api/                # 🌐 API SERVER
│   └── app/
│
├── admin-dashboard/           # 👨‍💼 WEB QUẢN TRỊ
│   └── src/
│
├── data-pipeline/             # 📊 DATA PIPELINE
│   └── sample_texts/
│
├── storage/                   # 💾 LƯU TRỮ
│   ├── model-packages/       # RAG data
│   ├── databases/            # Shared DBs
│   └── logs/                 # Logs
│
├── scripts/                   # 🔧 SCRIPTS
│   ├── build/
│   ├── start/
│   └── deploy/
│
├── docs/                    # 📚 DOCS
│   └── *.md
│
├── .gitignore
└── README.md
```

## Execution

1. Move files vào đúng vị trí
2. Xóa old backend/desktop folders
3. Xóa duplicate documentation
4. Cleanup root level files
5. Verify structure

