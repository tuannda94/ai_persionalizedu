# ✅ Migration Checklist

## Verification Steps

### 1. Student App
- [ ] `student-app/local-backend/app/main.py` exists
- [ ] `student-app/local-backend/app/api/v1/chat.py` exists
- [ ] `student-app/local-backend/app/services/rag_service.py` exists
- [ ] `student-app/desktop/src/main/main.js` exists

### 2. Remote API
- [ ] `remote-api/app/main.py` exists
- [ ] `remote-api/app/api/v1/auth.py` exists
- [ ] `remote-api/app/api/v1/telemetry.py` exists
- [ ] `remote-api/app/api/v1/updates.py` exists

### 3. Admin Dashboard
- [ ] `admin-dashboard/src/App.jsx` exists
- [ ] `admin-dashboard/package.json` exists

### 4. Storage
- [ ] `storage/model-packages/` exists
- [ ] Model packages are in correct location

### 5. Scripts
- [ ] `scripts/build/build_data_pipeline.sh` exists
- [ ] `scripts/start/start_student_app.sh` exists

## Cleanup (Sau khi verify)

### Có thể xóa:
- `backend/` folder (old code)
- `desktop/` folder (đã move vào student-app)
- Duplicate MD files ở root

### Giữ lại:
- `docs/` - Documentation
- `README.md` - Main README
- `.gitignore`

## Testing

1. Test Student App:
```bash
./scripts/start/start_student_app.sh
```

2. Test Remote API:
```bash
./scripts/start/start_remote_api.sh
```

3. Test Data Pipeline:
```bash
./scripts/build/build_data_pipeline.sh
```

