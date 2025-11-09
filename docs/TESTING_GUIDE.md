# 🧪 Testing Guide

## Tổng Quan

Hướng dẫn test toàn bộ các tính năng đã implement.

## Prerequisites

### 1. Services Running

**Local Backend:**
```bash
./scripts/start/start_student_app.sh
```

**Remote API (optional, cho một số tests):**
```bash
cd remote-api
# Setup .env với DATABASE_URL và JWT_SECRET_KEY
./scripts/start/start_remote_api.sh
```

### 2. Dependencies

- `curl` - HTTP client
- `bash` - Shell script interpreter
- `jq` (optional) - JSON parser

## Chạy Tests

### Test Tất Cả

```bash
./scripts/test/test_all.sh
```

### Test Từng Tính Năng

#### 1. Feedback Mechanism
```bash
./scripts/test/test_feedback.sh
```

**Tests:**
- ✅ Create manual feedback
- ✅ List feedbacks
- ✅ Get feedback statistics
- ✅ Auto-feedback from local backend
- ✅ Update feedback status (admin)

#### 2. Update Button
```bash
./scripts/test/test_update_button.sh
```

**Tests:**
- ✅ Check for updates
- ✅ List available versions
- ✅ Download URL accessibility
- ✅ Update log endpoint

#### 3. Offline Mode
```bash
./scripts/test/test_offline_mode.sh
```

**Tests:**
- ✅ Online status detection
- ✅ Local backend (works offline)
- ✅ Chat endpoint (local)
- ✅ Remote API (fails when offline)
- ✅ Internet-dependent features disabled
- ✅ Cache updates

#### 4. Analytics Dashboard
```bash
./scripts/test/test_analytics.sh
```

**Tests:**
- ✅ Telemetry statistics
- ✅ Feedback statistics
- ✅ Different time periods
- ✅ Top subjects

#### 5. Error Handling
```bash
./scripts/test/test_error_handling.sh
```

**Tests:**
- ✅ Invalid chat request
- ✅ Missing RAG data
- ✅ Ollama connection error
- ✅ Error feedback auto-sending
- ✅ Health check
- ✅ 404 handling

#### 6. Performance Optimization
```bash
./scripts/test/test_performance.sh
```

**Tests:**
- ✅ Cache directory structure
- ✅ First query (cache miss)
- ✅ Second query (cache hit)
- ✅ Cache file creation
- ✅ Cache statistics

## Manual Testing

### Desktop App Testing

1. **Start Desktop App:**
```bash
cd student-app/desktop
npm start
```

2. **Test Update Button:**
   - Click "Kiểm tra cập nhật" button
   - Verify update check works
   - If update available, test download
   - Test install flow

3. **Test Offline Mode:**
   - Disconnect internet
   - Verify offline banner appears
   - Test chat (should work offline)
   - Test update button (should show offline)
   - Reconnect internet
   - Verify reconnection notification

4. **Test Feedback:**
   - Trigger an error (stop Ollama)
   - Verify auto-feedback is sent
   - Check Admin Dashboard for feedback

### Admin Dashboard Testing

1. **Start Admin Dashboard:**
```bash
cd admin-dashboard
npm install
npm run dev
```

2. **Test Feedback Management:**
   - Navigate to Feedback page
   - View feedback list
   - Open feedback detail
   - Update feedback status
   - Add admin notes
   - Test filters

3. **Test Analytics:**
   - Navigate to Analytics page
   - Check statistics display
   - Test time period selection
   - Verify data accuracy

## Environment Variables

Có thể set các biến môi trường để customize tests:

```bash
export REMOTE_API_URL="http://localhost:8000"
export LOCAL_BACKEND_URL="http://localhost:8000"
export AUTH_TOKEN="your-token-here"
export ADMIN_TOKEN="your-admin-token-here"
```

## Expected Results

### All Tests Pass
```
✅ Passed: 6
⚠️  Warnings: 0
❌ Failed: 0
🎉 All critical tests passed!
```

### Some Warnings
Warnings thường xuất hiện khi:
- Services chưa chạy
- Cần authentication
- Chưa có data để test

### Failures
Failures cần được fix:
- API endpoints không hoạt động
- Services không accessible
- Logic errors

## Troubleshooting

### Local Backend Not Running
```bash
# Start local backend
./scripts/start/start_student_app.sh

# Check health
curl http://localhost:8000/health
```

### Remote API Not Running
```bash
# Start remote API
cd remote-api
./scripts/start/start_remote_api.sh

# Check health
curl http://localhost:8000/health
```

### Ollama Not Running
```bash
# Start Ollama (if installed)
ollama serve

# Or use Docker
docker run -d -p 11434:11434 ollama/ollama
```

### Database Issues
```bash
# Run migrations
cd remote-api
python migrations/run_migration.py
```

## Continuous Testing

Để chạy tests tự động:

```bash
# Watch mode (chạy tests khi có thay đổi)
watch -n 5 ./scripts/test/test_all.sh

# CI/CD integration
# Add to .github/workflows/test.yml or similar
```

## Test Coverage

- ✅ API endpoints
- ✅ Error handling
- ✅ Offline mode
- ✅ Caching
- ✅ Update mechanism
- ✅ Feedback flow

## Next Steps

1. Add unit tests cho Python code
2. Add integration tests cho Electron app
3. Add E2E tests với Playwright/Cypress
4. Add performance benchmarks
5. Add load tests

