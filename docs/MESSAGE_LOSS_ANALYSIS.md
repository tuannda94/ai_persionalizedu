# 🔍 Phân tích vấn đề mất nội dung tin nhắn

## Vấn đề
Phần mềm trên local của sinh viên thỉnh thoảng mất nội dung tin nhắn hỏi.

## Nguyên nhân phát hiện

### 1. **Assistant message không được save nếu stream bị interrupt**

**Vị trí:** `student-app/local-backend/app/api/v1/chat.py:110-112`

**Vấn đề:**
- Assistant message chỉ được save khi `chunk.get('done', False)` = True
- Nếu stream bị interrupt (network error, client disconnect, timeout) trước khi `done=True`, message sẽ không được lưu vào database
- User message đã được save ở line 98, nhưng assistant message bị mất

**Code hiện tại:**
```python
if chunk.get('done', False):
    # Lưu assistant response
    save_message(db, user_id, conversation_id, "assistant", full_answer)
```

### 2. **Race condition khi switch conversation**

**Vị trí:** `student-app/desktop/renderer/src/renderer.js:121-161`

**Vấn đề:**
- Nếu user switch conversation trong khi đang stream, messages có thể bị mất
- Cache (`conversationMessagesRef`) có thể không được update đúng cách
- Stream reference có thể bị cleanup trước khi message được save

### 3. **Exception không save partial message**

**Vị trí:** `student-app/local-backend/app/api/v1/chat.py:163-191`

**Vấn đề:**
- Khi có exception, chỉ yield error message
- Không save partial answer vào database (nếu đã có một phần response)
- User message đã được save nhưng assistant message hoàn toàn mất

### 4. **Frontend cache có thể bị overwrite**

**Vị trí:** `student-app/desktop/renderer/src/renderer.js:366-380`

**Vấn đề:**
- `updateConversationMessages` có thể overwrite messages nếu conversation_id thay đổi
- Race condition giữa stream update và conversation switch

## Giải pháp đề xuất

### 1. **Save assistant message ngay cả khi stream bị interrupt**

```python
def stream():
    full_answer = ""
    try:
        # Lưu user message trước
        save_message(db, user_id, conversation_id, "user", req.question)

        # Stream từ Ollama
        for chunk in stream_response(prompt):
            if 'error' in chunk:
                # Save partial answer nếu có
                if full_answer:
                    save_message(db, user_id, conversation_id, "assistant", full_answer)
                yield f"data: {json.dumps({'error': chunk['error']})}\n\n"
                break

            if 'token' in chunk:
                full_answer += chunk['token']
                yield f"data: {json.dumps({'token': chunk['token'], 'done': False, 'conversation_id': conversation_id})}\n\n"

            if chunk.get('done', False):
                # Lưu assistant response
                save_message(db, user_id, conversation_id, "assistant", full_answer)
                # ... rest of code
                break
    except Exception as e:
        # Save partial answer nếu có
        if full_answer:
            try:
                save_message(db, user_id, conversation_id, "assistant", full_answer)
            except:
                pass  # Ignore save errors in exception handler

        # ... error handling
```

### 2. **Periodic save trong quá trình stream**

```python
# Save partial answer mỗi N tokens hoặc mỗi N seconds
last_save_time = time.time()
SAVE_INTERVAL = 5  # seconds

for chunk in stream_response(prompt):
    if 'token' in chunk:
        full_answer += chunk['token']

        # Periodic save
        if time.time() - last_save_time > SAVE_INTERVAL:
            try:
                # Update existing message hoặc tạo mới
                update_or_save_message(db, user_id, conversation_id, "assistant", full_answer)
                last_save_time = time.time()
            except:
                pass  # Ignore save errors
```

### 3. **Frontend: Persist messages to localStorage**

```javascript
// Save messages to localStorage as backup
useEffect(() => {
  if (messages.length > 0 && conversationId) {
    localStorage.setItem(`messages_${conversationId}`, JSON.stringify(messages));
  }
}, [messages, conversationId]);
```

### 4. **Backend: Retry save on failure**

```python
def save_message_with_retry(db, user_id, conversation_id, role, message, max_retries=3):
    for attempt in range(max_retries):
        try:
            return save_message(db, user_id, conversation_id, role, message)
        except Exception as e:
            if attempt == max_retries - 1:
                # Log to file as last resort
                log_message_to_file(user_id, conversation_id, role, message)
                raise
            time.sleep(0.1 * (attempt + 1))  # Exponential backoff
```

### 5. **Database transaction improvements**

```python
# Use transaction with rollback protection
from contextlib import contextmanager

@contextmanager
def message_transaction(db):
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        raise
```

## Ưu tiên triển khai

1. **Priority 1 (Critical):**
   - Save partial answer trong exception handler
   - Save message ngay cả khi stream bị interrupt

2. **Priority 2 (Important):**
   - Periodic save trong quá trình stream
   - Frontend localStorage backup

3. **Priority 3 (Nice to have):**
   - Retry save on failure
   - Database transaction improvements

