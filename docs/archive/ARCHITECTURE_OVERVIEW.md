# 🏗️ Kiến trúc Hệ thống - Tổng quan

## Nguyên tắc Kiến trúc

### 1. **Local-First Architecture**
- Toàn bộ xử lý chính (chat, RAG, model) chạy **LOCAL** trên máy sinh viên
- Không phụ thuộc vào server cho core functionality
- Hoạt động offline (sau khi đăng nhập lần đầu)

### 2. **Hybrid Architecture**
- **Local Backend**: Xử lý chat, RAG, Ollama (trên máy sinh viên)
- **Remote API**: Authentication, telemetry, updates (trên server)

## Kiến trúc Chi tiết

```
┌─────────────────────────────────────────────────────────────┐
│                    MÁY SINH VIÊN (Local)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │  Desktop App │──────│ Local Backend│                   │
│  │  (Electron)  │      │  (FastAPI)   │                   │
│  └──────────────┘      └──────┬───────┘                   │
│                               │                            │
│                    ┌──────────┴──────────┐                 │
│                    │                     │                 │
│            ┌───────▼──────┐    ┌────────▼────────┐         │
│            │   RAG Engine │    │  Ollama Model  │         │
│            │  (ChromaDB)  │    │   (Local)      │         │
│            └──────────────┘    └────────────────┘         │
│                    │                                        │
│            ┌───────▼────────┐                             │
│            │ Model Packages │                             │
│            │  (Local Files) │                             │
│            └────────────────┘                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS (chỉ khi cần)
                            │
┌───────────────────────────▼───────────────────────────────┐
│                    SERVER (Remote)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────┐     │
│  │         Remote API Server                        │     │
│  │  - Authentication (JWT)                          │     │
│  │  - Telemetry (thu thập dữ liệu)                  │     │
│  │  - Update Check (kiểm tra phiên bản)             │     │
│  │  - Version Management                            │     │
│  └──────────────────────────────────────────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────┐     │
│  │         Admin Dashboard                         │     │
│  │  - Quản lý users                                │     │
│  │  - Quản lý versions                             │     │
│  │  - Analytics                                    │     │
│  └──────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Luồng Hoạt động

### 1. Đăng nhập (Authentication)
```
Desktop App → Remote API (authentication)
           ← JWT Token
           → Lưu token local
```

### 2. Chat Flow (100% Local)
```
User Input
    ↓
Desktop App (Electron)
    ↓
Local Backend (FastAPI)
    ↓
RAG Engine (ChromaDB) → Tìm context
    ↓
Ollama (Local Model) → Generate response
    ↓
Local Backend → Lưu conversation (SQLite)
    ↓
Desktop App → Hiển thị response
```

### 3. Telemetry (Background, Optional)
```
Local Backend → Gửi telemetry data → Remote API
              (chỉ khi có internet)
```

### 4. Update Check (Periodic)
```
Desktop App → Remote API (check updates)
           ← Update info (nếu có)
           → Download & install (local)
```

## Components

### Local Components (Máy Sinh viên)

#### 1. Desktop App (`desktop/`)
- **Mục đích**: UI cho sinh viên
- **Chức năng**:
  - Hiển thị chat interface
  - Gửi requests đến local backend
  - Quản lý authentication token
  - Check updates (gọi remote API)

#### 2. Local Backend (`backend/`)
- **Mục đích**: Xử lý tất cả logic chính
- **Chức năng**:
  - Nhận requests từ desktop app
  - Gọi RAG engine để tìm context
  - Gọi Ollama để generate response
  - Lưu conversation history (SQLite)
  - Gửi telemetry đến remote API (background)

#### 3. RAG Engine (`backend/app/services/rag_service.py`)
- **Mục đích**: Tìm context từ model packages
- **Chức năng**:
  - Load model packages từ `storage/model_packages/`
  - Query ChromaDB để tìm relevant segments
  - Build prompt với context

#### 4. Ollama Integration
- **Mục đích**: Generate AI responses
- **Chức năng**:
  - Chạy model local (llama3, mistral, etc.)
  - Nhận prompt từ backend
  - Stream response về backend

#### 5. Model Packages (`storage/model_packages/`)
- **Mục đích**: RAG data (embeddings + text)
- **Chức năng**:
  - Chứa embeddings của các môn học
  - Được build từ data-pipeline
  - Load vào ChromaDB khi backend start

### Remote Components (Server)

#### 1. Remote API (`backend/` - có thể deploy lên server)
- **Mục đích**: Authentication, telemetry, updates
- **Endpoints**:
  - `POST /api/v1/auth/login` - Đăng nhập
  - `POST /api/v1/auth/refresh` - Refresh token
  - `POST /api/v1/telemetry` - Gửi telemetry
  - `GET /api/v1/updates/check` - Kiểm tra updates
  - `GET /api/v1/updates/versions` - Lấy danh sách versions

#### 2. Admin Dashboard (`admin-dashboard/`)
- **Mục đích**: Quản lý hệ thống
- **Chức năng**:
  - Quản lý users
  - Quản lý app versions
  - Xem analytics/telemetry
  - Upload new versions

## Data Flow

### Chat Request (Local)
```
1. User nhập câu hỏi trong Desktop App
2. Desktop App gửi POST đến Local Backend: http://localhost:8000/api/v1/chat/stream
3. Local Backend:
   a. Load conversation history từ SQLite
   b. Gọi RAG Engine để tìm context
   c. Build prompt với context + history
   d. Gọi Ollama API (local): http://localhost:11434/api/generate
   e. Stream response về Desktop App
   f. Lưu conversation vào SQLite
4. Desktop App hiển thị response
```

### Authentication (Remote)
```
1. User nhập email/password trong Desktop App
2. Desktop App gửi POST đến Remote API: https://api.fpt.edu.vn/api/v1/auth/login
3. Remote API verify credentials, trả về JWT token
4. Desktop App lưu token local (localStorage/secure storage)
5. Token được dùng cho các requests sau (telemetry, updates)
```

### Telemetry (Background, Optional)
```
1. Local Backend thu thập data:
   - Question, answer, duration, used_segments
   - User ID (từ token)
   - Timestamp
2. Gửi POST đến Remote API: https://api.fpt.edu.vn/api/v1/telemetry
3. Remote API lưu vào database
4. Admin Dashboard có thể xem analytics
```

### Update Check (Periodic)
```
1. Desktop App (hoặc Local Backend) gửi GET đến Remote API:
   https://api.fpt.edu.vn/api/v1/updates/check?version=1.0.0&platform=macos
2. Remote API check version, trả về:
   - has_update: true/false
   - latest_version: "1.1.0"
   - download_url: "..."
   - is_mandatory: true/false
3. Desktop App download và install update (local)
```

## Storage

### Local Storage (Máy Sinh viên)
- **Conversation History**: `backend/storage/databases/chat_history.db` (SQLite)
- **User Data**: `backend/storage/databases/app.db` (SQLite)
- **Model Packages**: `storage/model_packages/` (JSONL files)
- **Logs**: `backend/storage/logs/`

### Remote Storage (Server)
- **Users**: PostgreSQL database
- **Telemetry**: PostgreSQL database
- **App Versions**: PostgreSQL database + File storage
- **Analytics**: Aggregated data

## Security

### Local
- JWT token lưu local (encrypted storage)
- SQLite databases (local only)
- No sensitive data exposed

### Remote
- JWT authentication
- HTTPS only
- Rate limiting
- Input validation

## Offline Support

### Hoạt động Offline
- ✅ Chat hoàn toàn offline (sau khi đăng nhập lần đầu)
- ✅ RAG engine hoạt động offline
- ✅ Ollama hoạt động offline
- ✅ Conversation history lưu local

### Cần Internet
- ⚠️ Đăng nhập lần đầu
- ⚠️ Refresh token (sau khi expire)
- ⚠️ Gửi telemetry (optional, có thể queue)
- ⚠️ Check updates (optional)

## Benefits

1. ✅ **Privacy**: Data không gửi lên server (trừ telemetry optional)
2. ✅ **Performance**: Không phụ thuộc network latency
3. ✅ **Offline**: Hoạt động hoàn toàn offline
4. ✅ **Scalable**: Server chỉ xử lý auth/telemetry (lightweight)
5. ✅ **Cost-effective**: Server không cần xử lý heavy AI workloads

