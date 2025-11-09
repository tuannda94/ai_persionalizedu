# 🏗️ Kiến trúc Hệ thống

## Tổng quan

Hệ thống gồm **4 components độc lập**:

1. **Student App** - Phần mềm sinh viên (desktop + local backend)
2. **Remote API** - API server của trường
3. **Admin Dashboard** - Web quản trị
4. **Storage** - Lưu trữ dữ liệu

## Local-First Architecture

### Nguyên tắc
- **Toàn bộ xử lý chính chạy LOCAL trên máy sinh viên**
- Chat, RAG, AI generation → 100% local
- Remote API chỉ dùng cho: Authentication, Telemetry, Updates

## Data Flow

### Chat Flow (100% Local)

```
Student Desktop App
    ↓
Local Backend (localhost:8000)
    ↓
┌─────────────┬──────────────┬─────────────┐
│             │              │             │
RAG Engine  Ollama      SQLite      Model Packages
(ChromaDB)  (Local)     (History)   (storage/)
```

### Authentication Flow

```
Student Desktop App
    ↓ HTTPS
Remote API Server
    ↓
PostgreSQL Database
    ↓
JWT Tokens → Desktop App
```

### Telemetry Flow

```
Student Desktop App
    ↓ (background, optional)
Remote API Server
    ↓
PostgreSQL Database
```

## Components Chi tiết

### 1. Student App

#### Desktop (`student-app/desktop/`)
- **Tech**: Electron + React
- **Chức năng**:
  - UI cho chat
  - Quản lý conversations
  - Authentication UI
  - Markdown rendering

#### Local Backend (`student-app/local-backend/`)
- **Tech**: FastAPI + SQLite + ChromaDB
- **Chức năng**:
  - Chat endpoints (`/api/v1/chat/stream`)
  - RAG engine (tìm context từ model packages)
  - Ollama integration (generate responses)
  - Conversation history (SQLite)
  - Telemetry (gửi đến remote API - optional)

### 2. Remote API

- **Tech**: FastAPI + PostgreSQL
- **Chức năng**:
  - Authentication (`/api/v1/auth/*`)
  - Telemetry collection (`/api/v1/telemetry`)
  - Version management (`/api/v1/updates/*`)
- **KHÔNG**:
  - ❌ Không xử lý chat
  - ❌ Không có RAG engine
  - ❌ Không có Ollama

### 3. Admin Dashboard

- **Tech**: React + Vite
- **Chức năng**:
  - Quản lý users
  - Quản lý versions
  - Analytics/telemetry
  - Upload installers

### 4. Data Pipeline

- **Tech**: Python + sentence-transformers
- **Chức năng**:
  - Đọc sample texts
  - Chunk text
  - Tạo embeddings
  - Output model packages → `storage/model-packages/`

## Storage

### Model Packages (`storage/model-packages/`)
- RAG data (JSONL files với embeddings)
- Format: `{subject}_v1/segments.jsonl`, `manifest.json`

### Databases
- **Local**: `student-app/local-backend/storage/databases/` (SQLite)
- **Remote**: PostgreSQL (trên server)

### Logs
- **Local**: `student-app/local-backend/storage/logs/`
- **Shared**: `storage/logs/`

## Security

### Local Backend
- Không cần authentication (chạy local)
- Data lưu local (SQLite)

### Remote API
- JWT authentication
- HTTPS (production)
- Password hashing (bcrypt)

## Deployment

### Student App
- Build thành installer (electron-builder)
- Bundle: Desktop app + Local backend executable + Model packages
- Deploy: Cài đặt trên máy sinh viên

### Remote API
- Deploy lên server (Docker/VM)
- Database: PostgreSQL

### Admin Dashboard
- Build static files
- Deploy lên server/CDN

## Scalability

- **Student App**: Lightweight, chạy trên máy sinh viên
- **Remote API**: Stateless, có thể scale horizontal
- **Database**: PostgreSQL có thể shard nếu cần
