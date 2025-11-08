# 📚 Hệ thống Lưu & Khôi phục Hội thoại

## Tổng quan

Hệ thống lưu trữ và khôi phục hội thoại cho phép:
- ✅ Lưu toàn bộ lịch sử chat vào SQLite database
- ✅ Tự động khôi phục hội thoại khi mở lại app
- ✅ Tiếp tục hội thoại với context từ các messages trước
- ✅ Quản lý nhiều conversations cho mỗi user

## 🏗️ Kiến trúc

### Backend (FastAPI + SQLite)

**File: `backend/chat_storage.py`**
- Sử dụng SQLAlchemy để quản lý database
- Database: `backend/chat_history.db` (SQLite)
- Bảng `messages`:
  - `id`: Primary key
  - `user_id`: ID của user (mặc định: "anonymous")
  - `conversation_id`: ID của conversation (format: `conv_xxxxxxxxxxxx`)
  - `role`: "user" hoặc "assistant"
  - `message`: Nội dung message
  - `timestamp`: Thời gian tạo message

**Các functions chính:**
- `create_conversation_id()`: Tạo conversation_id mới
- `save_message()`: Lưu message vào database
- `get_conversation_history()`: Lấy lịch sử của một conversation
- `get_user_conversations()`: Lấy danh sách conversations của user
- `delete_conversation()`: Xóa một conversation

### API Endpoints

#### 1. `POST /query/stream` (Đã cập nhật)
- **Request body:**
  ```json
  {
    "question": "Câu hỏi của user",
    "user_id": "user_123",  // Optional, mặc định: "anonymous"
    "conversation_id": "conv_abc123",  // Optional, tự động tạo nếu không có
    "subject": "CS101"  // Optional
  }
  ```
- **Response:** Streaming SSE với `conversation_id` trong metadata
- **Chức năng:**
  - Load conversation history nếu có `conversation_id`
  - Thêm history vào RAG prompt (6 messages gần nhất)
  - Lưu user message và assistant response vào database

#### 2. `GET /conversations?user_id=xxx`
- Lấy danh sách conversations của user
- **Response:**
  ```json
  {
    "ok": true,
    "conversations": [
      {
        "conversation_id": "conv_abc123",
        "last_message": "Câu hỏi cuối cùng...",
        "last_timestamp": "2025-01-08T15:00:00",
        "message_count": 10
      }
    ],
    "count": 1
  }
  ```

#### 3. `GET /conversations/{conversation_id}/history?user_id=xxx`
- Lấy toàn bộ lịch sử của một conversation
- **Response:**
  ```json
  {
    "ok": true,
    "conversation_id": "conv_abc123",
    "messages": [
      {
        "id": 1,
        "role": "user",
        "message": "Câu hỏi",
        "timestamp": "2025-01-08T15:00:00"
      },
      {
        "id": 2,
        "role": "assistant",
        "message": "Câu trả lời",
        "timestamp": "2025-01-08T15:00:05"
      }
    ],
    "count": 2
  }
  ```

#### 4. `POST /conversations/new?user_id=xxx`
- Tạo conversation mới
- **Response:**
  ```json
  {
    "ok": true,
    "conversation_id": "conv_xyz789",
    "user_id": "user_123"
  }
  ```

#### 5. `DELETE /conversations/{conversation_id}?user_id=xxx`
- Xóa một conversation

### Frontend (React/Electron)

**File: `desktop/renderer/src/renderer.js`**

**State management:**
- `conversationId`: ID của conversation hiện tại
- `userId`: ID của user (lưu trong localStorage)
- `messages`: Array các messages (được load từ history)

**Flow khi app khởi động:**
1. Lấy `user_id` từ localStorage (hoặc tạo mới)
2. Lấy `conversation_id` từ localStorage
3. Nếu có `conversation_id`, gọi API `/conversations/{id}/history` để load messages
4. Nếu không có hoặc conversation rỗng, tạo conversation mới

**Flow khi gửi message:**
1. Kiểm tra có `conversation_id` chưa, nếu chưa thì tạo mới
2. Gửi request đến `/query/stream` với `user_id` và `conversation_id`
3. Backend tự động lưu user message và assistant response
4. Cập nhật `conversation_id` nếu server trả về mới

**UI Features:**
- Hiển thị `conversation_id` trong header
- Button "➕ Mới" để tạo conversation mới
- Tự động load và hiển thị lịch sử khi mở app

## 🔄 Luồng hoạt động

### 1. Tạo conversation mới
```
User click "➕ Mới"
  ↓
Frontend: POST /conversations/new
  ↓
Backend: Tạo conversation_id mới
  ↓
Frontend: Lưu vào localStorage, clear messages
```

### 2. Gửi message
```
User gửi câu hỏi
  ↓
Frontend: Kiểm tra conversation_id
  ↓
Frontend: POST /query/stream với conversation_id
  ↓
Backend: Load conversation history (6 messages gần nhất)
  ↓
Backend: Build RAG prompt với history + RAG context
  ↓
Backend: Stream từ Ollama
  ↓
Backend: Lưu user message và assistant response vào DB
  ↓
Frontend: Hiển thị streaming response
```

### 3. Khôi phục hội thoại
```
App khởi động
  ↓
Frontend: Lấy conversation_id từ localStorage
  ↓
Frontend: GET /conversations/{id}/history
  ↓
Backend: Trả về messages
  ↓
Frontend: Convert thành format messages và hiển thị
```

## 📝 RAG Prompt với History

Prompt được build như sau:
```
Bạn là một trợ lý học tập AI. Hãy trả lời câu hỏi DỰA TRÊN các đoạn văn bản sau đây. Trả lời BẰNG TIẾNG VIỆT.

Lịch sử hội thoại trước đó:
Sinh viên: [Câu hỏi 1]
Trợ lý: [Câu trả lời 1]
Sinh viên: [Câu hỏi 2]
Trợ lý: [Câu trả lời 2]
...

Các đoạn văn bản tham khảo:
---Đoạn 1 (từ lecture1.txt)---
[Nội dung đoạn 1]
...

Câu hỏi hiện tại: [Câu hỏi mới]

Hãy trả lời một cách chi tiết và dễ hiểu BẰNG TIẾNG VIỆT...
```

**Lưu ý:** Chỉ lấy 6 messages gần nhất từ history để tránh prompt quá dài.

## 🚀 Cài đặt và Sử dụng

### 1. Cài đặt dependencies
```bash
cd backend
pip install -r requirements.txt  # Đã có sqlalchemy
```

### 2. Database tự động tạo
- Database `chat_history.db` sẽ tự động được tạo khi chạy backend lần đầu
- Không cần migration, SQLAlchemy tự động tạo tables

### 3. Test API
```bash
# Tạo conversation mới
curl -X POST "http://localhost:8000/conversations/new?user_id=test_user"

# Lấy danh sách conversations
curl "http://localhost:8000/conversations?user_id=test_user"

# Lấy history
curl "http://localhost:8000/conversations/conv_abc123/history?user_id=test_user"
```

## 🔮 Mở rộng tương lai

### 1. Đồng bộ với tài khoản sinh viên
- Thay `user_id` từ localStorage bằng user_id từ authentication
- Lưu `user_id` vào database thay vì "anonymous"
- API `/conversations` sẽ filter theo user đã đăng nhập

### 2. Đồng bộ cloud
- Gửi conversations lên cloud server khi có internet
- Sync conversations giữa các thiết bị
- Backup tự động

### 3. UI nâng cao
- Sidebar hiển thị danh sách conversations
- Search trong conversations
- Export conversation ra file
- Xóa conversation từ UI

### 4. Tối ưu performance
- Pagination cho conversation history
- Cache conversations trong memory
- Lazy loading messages

## 📊 Database Schema

```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR NOT NULL,
    conversation_id VARCHAR NOT NULL,
    role VARCHAR NOT NULL,  -- "user" hoặc "assistant"
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_conv ON messages(user_id, conversation_id);
CREATE INDEX idx_conv ON messages(conversation_id);
```

## ⚠️ Lưu ý

1. **Database location:** `backend/chat_history.db` (nên thêm vào `.gitignore`)
2. **User ID:** Hiện tại dùng localStorage, nên thay bằng authentication system
3. **History limit:** Chỉ lấy 6 messages gần nhất để tránh prompt quá dài
4. **Storage:** SQLite phù hợp cho local, nhưng cần migration lên PostgreSQL/MySQL cho production

