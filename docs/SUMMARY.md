# 📋 Tóm tắt Dự án

## Trạng thái Hiện tại

### ✅ Hoàn thành
- Cấu trúc dự án (tách biệt 4 components)
- Student App (desktop + local backend)
- Remote API (auth, telemetry, updates)
- Data Pipeline
- Scripts và documentation

### ⚠️ Đang phát triển
- Admin Dashboard UI (cơ bản, cần hoàn thiện)

## Cấu trúc

```
AI_PersonalizedU/
├── student-app/          # Phần mềm sinh viên
├── remote-api/           # API server
├── admin-dashboard/      # Web quản trị
├── data-pipeline/        # Data processing
├── storage/              # Storage
├── scripts/              # Scripts
└── docs/                 # Documentation
```

## Cách Chạy

1. **Build data**: `./scripts/build/build_data_pipeline.sh`
2. **Start app**: `./scripts/start/start_student_app.sh`
3. **Start API** (optional): `./scripts/start/start_remote_api.sh`

## Documentation

Xem [docs/README.md](README.md) để biết danh sách đầy đủ.

**Tài liệu chính**:
- [Quick Start](QUICK_START.md)
- [Cấu trúc Dự án](FINAL_STRUCTURE.md)
- [Trạng thái Dự án](PROJECT_STATUS.md)
- [Kiến trúc](architecture.md)

