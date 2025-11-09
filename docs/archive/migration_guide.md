# 🔄 Migration Guide: Chuyển đổi sang Cấu trúc Mới

## Tổng quan

Hướng dẫn chuyển đổi từ cấu trúc hiện tại sang cấu trúc mới với authentication, update system, và admin dashboard.

## Bước 1: Tạo Cấu trúc Thư mục Mới

```bash
# Tạo các thư mục mới
mkdir -p backend/app/{api/v1,core,models,schemas,services}
mkdir -p backend/migrations/versions
mkdir -p desktop/src/{main,renderer/{components,pages,services},preload}
mkdir -p admin-dashboard/src/{components,pages,services}
mkdir -p shared/types
mkdir -p scripts
```

## Bước 2: Di chuyển Code Hiện tại

### Backend

```bash
# Di chuyển app.py
mv backend/app.py backend/app/main.py

# Di chuyển chat_storage.py
mv backend/chat_storage.py backend/app/models/conversation.py

# Tạo __init__.py files
touch backend/app/__init__.py
touch backend/app/api/__init__.py
touch backend/app/api/v1/__init__.py
```

### Desktop

```bash
# Di chuyển renderer
mv desktop/renderer/src/renderer.js desktop/src/renderer/components/Chat.jsx

# Di chuyển main.js
mv desktop/main.js desktop/src/main/main.js
```

## Bước 3: Cập nhật Imports

### Backend

**app/main.py**
```python
# Thay đổi từ
from chat_storage import ...

# Thành
from app.models.conversation import ...
from app.api.v1 import chat, auth, updates
```

### Desktop

**src/main/main.js**
```javascript
// Thay đổi từ
const path = require('path');

// Thêm
const { initUpdater } = require('./updater');
```

## Bước 4: Database Migration

### Tạo Migration

```bash
cd backend
alembic init migrations
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### Migrate Existing Data

```python
# scripts/migrate_existing_data.py
# Migrate existing conversations to new schema
```

## Bước 5: Cập nhật Dependencies

### Backend requirements.txt

```txt
fastapi
uvicorn[standard]
sqlalchemy
alembic
psycopg2-binary
python-jose[cryptography]
passlib[bcrypt]
pydantic-settings
python-multipart
chromadb
requests
```

### Desktop package.json

```json
{
  "dependencies": {
    "electron-updater": "^6.0.0",
    "keytar": "^7.9.0"
  }
}
```

## Bước 6: Cấu hình Environment

### Backend .env

```env
DATABASE_URL=postgresql://user:pass@localhost/ai_learning
JWT_SECRET_KEY=your-secret-key-here
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Desktop .env

```env
API_BASE_URL=https://api.fpt.edu.vn
UPDATE_SERVER_URL=https://api.fpt.edu.vn
```

## Bước 7: Testing

1. Test authentication flow
2. Test update mechanism
3. Test existing chat functionality
4. Test admin dashboard

## Checklist

- [ ] Cấu trúc thư mục mới đã tạo
- [ ] Code đã được di chuyển
- [ ] Imports đã được cập nhật
- [ ] Database migrations đã chạy
- [ ] Dependencies đã cài đặt
- [ ] Environment variables đã cấu hình
- [ ] Tests đã pass
- [ ] Documentation đã cập nhật

