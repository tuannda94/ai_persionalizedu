# 📡 API Documentation

## Overview

Hệ thống có 2 API servers:

1. **Local Backend** (`student-app/local-backend/`) - Chạy trên máy sinh viên
2. **Remote API** (`remote-api/`) - Chạy trên server của trường

## Local Backend API

**Base URL**: `http://localhost:8000/api/v1`

### Chat Endpoints

#### `POST /chat/stream`
Streaming chat response với RAG + Ollama

**Request**:
```json
{
  "question": "Giải thích về variables trong programming",
  "subject": "CS101",  // Optional
  "user_id": "user_123",  // Optional
  "conversation_id": "conv_abc123"  // Optional
}
```

**Response**: Server-Sent Events (SSE)
```
data: {"token": "Variables", "done": false, "conversation_id": "conv_abc123"}
data: {"token": " là", "done": false, "conversation_id": "conv_abc123"}
...
data: {"done": true, "used_segments": 5, "duration_ms": 1234, "detected_subject": "CS101", "conversation_id": "conv_abc123"}
```

#### `GET /chat/conversations?user_id=user_123`
Lấy danh sách conversations

**Response**:
```json
{
  "ok": true,
  "conversations": [
    {
      "conversation_id": "conv_abc123",
      "last_message": "Giải thích về variables...",
      "last_timestamp": "2024-11-09T01:00:00",
      "message_count": 10
    }
  ],
  "count": 1
}
```

#### `GET /chat/conversations/{conversation_id}/history?user_id=user_123`
Lấy lịch sử conversation

**Response**:
```json
{
  "ok": true,
  "conversation_id": "conv_abc123",
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "message": "Giải thích về variables",
      "timestamp": "2024-11-09T01:00:00"
    },
    {
      "id": "msg_2",
      "role": "assistant",
      "message": "Variables là...",
      "timestamp": "2024-11-09T01:00:01"
    }
  ],
  "count": 2
}
```

#### `DELETE /chat/conversations/{conversation_id}?user_id=user_123`
Xóa conversation

#### `GET /chat/conversations/new?user_id=user_123`
Tạo conversation mới

**Response**:
```json
{
  "ok": true,
  "conversation_id": "conv_xyz789",
  "user_id": "user_123"
}
```

#### `GET /health`
Health check

**Response**:
```json
{
  "status": "ok",
  "subjects": ["CS101", "PHP1", "PHP2"],
  "rag_ready": true,
  "ollama_url": "http://localhost:11434/api/generate",
  "ollama_model": "llama3"
}
```

## Remote API

**Base URL**: `https://api.fpt.edu.vn/api/v1` (production) hoặc `http://localhost:8000/api/v1` (dev)

### Authentication

#### `POST /auth/login`
Đăng nhập

**Request**:
```json
{
  "email": "student@fpt.edu.vn",
  "password": "password123"
}
```

**Response**:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "user-uuid",
    "email": "student@fpt.edu.vn",
    "full_name": "Nguyen Van A",
    "role": "student"
  }
}
```

#### `POST /auth/refresh`
Refresh access token

**Request**:
```json
{
  "refresh_token": "eyJ..."
}
```

#### `GET /auth/me`
Lấy thông tin user hiện tại (cần token)

**Headers**:
```
Authorization: Bearer <access_token>
```

### Telemetry

#### `POST /telemetry`
Gửi telemetry data (public endpoint)

**Request**:
```json
{
  "user_id": "user-uuid",  // Optional
  "conversation_id": "conv_abc123",
  "question": "Giải thích về variables",
  "answer_length": 500,
  "used_segments": 5,
  "duration_ms": 1234,
  "detected_subject": "CS101"
}
```

#### `GET /telemetry/stats?days=7`
Lấy thống kê (admin only)

### Updates

#### `POST /updates/check`
Kiểm tra updates

**Request**:
```json
{
  "current_version": "1.0.0",
  "current_version_code": 100,
  "platform": "windows"
}
```

**Response**:
```json
{
  "has_update": true,
  "latest_version": "1.1.0",
  "latest_version_code": 110,
  "download_url": "https://...",
  "is_mandatory": false,
  "release_notes": "Bug fixes...",
  "file_size": 50000000,
  "file_hash": "sha256:..."
}
```

#### `GET /updates/versions?platform=windows`
Lấy danh sách versions

#### `POST /updates/log`
Log update progress

## Authentication

Remote API endpoints (trừ `/telemetry` và `/updates/check`) yêu cầu JWT token:

```
Authorization: Bearer <access_token>
```
