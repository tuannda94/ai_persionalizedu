# 🏗️ Tóm tắt Kiến trúc Hệ thống

## Nguyên tắc Cốt lõi

### ✅ Local-First Architecture
- **Toàn bộ xử lý chính chạy LOCAL trên máy sinh viên**
- Chat, RAG, AI generation → 100% local
- Không phụ thuộc server cho core functionality
- Hoạt động offline (sau khi đăng nhập lần đầu)

### ✅ Hybrid Architecture
- **Local Backend**: Xử lý chat, RAG, Ollama
- **Remote API**: Chỉ authentication, telemetry, updates

## Components

### 1. Desktop App (`desktop/`)
**Chạy trên**: Máy sinh viên
**Chức năng**:
- UI cho sinh viên
- Gửi requests đến Local Backend
- Quản lý authentication token
- Check updates (gọi Remote API)

### 2. Local Backend (`backend/`)
**Chạy trên**: Máy sinh viên (localhost:8000)
**Chức năng**:
- ✅ Nhận chat requests từ Desktop App
- ✅ Gọi RAG Engine để tìm context
- ✅ Gọi Ollama (local) để generate response
- ✅ Lưu conversation history (SQLite)
- ✅ Gửi telemetry đến Remote API (background, optional)

**KHÔNG**:
- ❌ Không xử lý authentication (gọi Remote API)
- ❌ Không lưu user data (chỉ conversation local)

### 3. RAG Engine (`backend/app/services/rag_service.py`)
**Chạy trên**: Máy sinh viên
**Chức năng**:
- Load model packages từ `storage/model_packages/`
- Query ChromaDB để tìm relevant segments
- Build prompt với context

### 4. Ollama
**Chạy trên**: Máy sinh viên (localhost:11434)
**Chức năng**:
- Generate AI responses
- Stream responses về Local Backend

### 5. Remote API Server
**Chạy trên**: Server (api.fpt.edu.vn)
**Chức năng**:
- ✅ Authentication (JWT tokens)
- ✅ User management
- ✅ Telemetry collection
- ✅ Version management
- ✅ Update distribution

**KHÔNG**:
- ❌ Không xử lý chat
- ❌ Không có RAG engine
- ❌ Không có Ollama

## Data Flow

### Chat Flow (100% Local)
```
User Input
  ↓
Desktop App
  ↓
Local Backend (localhost:8000)
  ↓
RAG Engine (ChromaDB) → Tìm context
  ↓
Ollama (localhost:11434) → Generate
  ↓
Local Backend → Lưu SQLite
  ↓
Desktop App → Hiển thị
```

### Authentication Flow (Remote)
```
Desktop App
  ↓
Remote API (api.fpt.edu.vn)
  ↓
Verify credentials
  ↓
Trả về JWT token
  ↓
Desktop App lưu token local
```

### Telemetry Flow (Background, Optional)
```
Local Backend (thu thập data)
  ↓
Gửi đến Remote API (background)
  ↓
Remote API lưu database
  ↓
Admin Dashboard xem analytics
```

## Storage

### Local (Máy sinh viên)
- `backend/storage/databases/chat_history.db` - Conversations
- `backend/storage/databases/app.db` - User data (local)
- `storage/model_packages/` - RAG data
- `backend/storage/logs/` - Logs

### Remote (Server)
- PostgreSQL: Users, Telemetry, Versions
- File Storage: Installers, Assets

## Benefits

1. ✅ **Privacy**: Data không gửi lên server (trừ telemetry optional)
2. ✅ **Performance**: Không phụ thuộc network
3. ✅ **Offline**: Hoạt động hoàn toàn offline
4. ✅ **Scalable**: Server lightweight (chỉ auth/telemetry)
5. ✅ **Cost-effective**: Server không xử lý AI workloads

## Configuration

### Local Backend Config
```env
# Local
OLLAMA_URL=http://localhost:11434/api/generate
MODEL_PACKAGES_DIR=../storage/model_packages

# Remote API
REMOTE_API_URL=https://api.fpt.edu.vn
TELEMETRY_ENABLED=true
```

### Remote API Config
```env
# Server
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=...
ALLOWED_ORIGINS=https://app.fpt.edu.vn
```

## Deployment

### Desktop App
- Build thành installer
- Bundle Local Backend executable
- Bundle Model Packages
- User cài đặt → Tất cả chạy local

### Remote API
- Deploy lên server (có thể dùng cùng codebase `backend/`)
- Chỉ enable auth/telemetry/updates endpoints
- PostgreSQL database
- Admin Dashboard riêng

