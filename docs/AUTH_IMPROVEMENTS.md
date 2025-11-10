# 🔐 Cải thiện Authentication và Error Handling

## Tổng quan

Đã cải thiện hệ thống authentication và error handling để:
- Tự động refresh token khi hết hạn
- Tăng thời gian token expiry
- Tự động redirect về login khi cần
- Hiển thị error messages rõ ràng hơn

## Thay đổi chính

### 1. Token Expiry Time

**Trước:**
- Access Token: 30 phút
- Refresh Token: 7 ngày

**Sau:**
- Access Token: **24 giờ** (1440 phút)
- Refresh Token: **30 ngày**

**File:** `remote-api/app/config.py`

```python
JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days
```

### 2. Auto Token Refresh

**Implementation:** `admin-dashboard/src/services/api.js`

**Cách hoạt động:**
1. Khi API trả về 401 (Unauthorized):
   - Interceptor tự động phát hiện
   - Thử refresh token bằng refresh_token
   - Nếu thành công: Retry request với token mới
   - Nếu thất bại: Clear auth và redirect về `/login`

2. Queue mechanism:
   - Nếu đang refresh, các requests khác sẽ được queue
   - Sau khi refresh thành công, tất cả requests được retry

**Code:**
```javascript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Try refresh token
      // If success: retry request
      // If fail: redirect to login
    }
  }
);
```

### 3. Error Handling

**Centralized Error Handler:** `admin-dashboard/src/utils/errorHandler.js`

**Features:**
- User-friendly error messages
- Không hiển thị alert cho 401 (tự động xử lý)
- Phân loại errors (Network, 401, 403, 404, 500, etc.)

**Usage:**
```javascript
import { handleApiError, shouldShowError } from '../utils/errorHandler';

try {
  // API call
} catch (error) {
  if (shouldShowError(error)) {
    const message = handleApiError(error, 'Default message');
    if (message) {
      alert(message);
    }
  }
}
```

### 4. Pages Updated

Tất cả pages đã được cập nhật để sử dụng errorHandler:
- ✅ `Users.jsx`
- ✅ `Versions.jsx`
- ✅ `Packages.jsx`
- ✅ `Feedback.jsx`
- ✅ `Analytics.jsx`
- ✅ `Documents.jsx`

## Flow Diagram

```
User Request → API Call
    ↓
401 Unauthorized?
    ↓ Yes
Check refresh_token exists?
    ↓ Yes
Call /api/v1/auth/refresh
    ↓
Success?
    ↓ Yes                    ↓ No
Update access_token      Clear auth data
Retry original request   Redirect to /login
    ↓
Success → Return data
```

## Testing

### Test Auto Refresh

1. Đăng nhập và lấy token
2. Đợi token hết hạn (hoặc manually expire)
3. Thực hiện API call
4. Kiểm tra:
   - Token được tự động refresh
   - Request được retry thành công
   - Không có error message cho user

### Test Redirect

1. Đăng nhập
2. Xóa refresh_token khỏi localStorage
3. Thực hiện API call (sẽ 401)
4. Kiểm tra:
   - Tự động redirect về `/login`
   - Auth data được clear

### Test Error Messages

1. Test các error cases:
   - Network error → "Không thể kết nối đến server..."
   - 403 → "Bạn không có quyền..."
   - 404 → "Không tìm thấy tài nguyên"
   - 500 → "Lỗi server. Vui lòng thử lại sau."

## Lưu ý

1. **Token mới cần đăng nhập lại:**
   - Token cũ vẫn có expiry 30 phút
   - Đăng nhập lại để nhận token mới (24 giờ)

2. **Refresh token endpoint:**
   - Endpoint: `POST /api/v1/auth/refresh`
   - Body: `{ "refresh_token": "..." }`
   - Response: `{ "access_token": "...", "token_type": "bearer" }`

3. **Multiple requests:**
   - Nếu nhiều requests cùng lúc gặp 401
   - Chỉ 1 request gọi refresh
   - Các requests khác được queue và retry sau

4. **Security:**
   - Refresh token được lưu trong localStorage
   - Có thể cải thiện bằng secure storage (keytar, electron-store)

## Troubleshooting

### Vẫn bị 401 sau khi refresh
- Kiểm tra refresh_token có hợp lệ không
- Kiểm tra user có active không
- Kiểm tra token expiry trong config

### Không tự động redirect
- Kiểm tra interceptor đã được thêm chưa
- Kiểm tra `window.location.href` có hoạt động không
- Kiểm tra console logs

### Error messages không hiển thị
- Kiểm tra `shouldShowError()` logic
- Kiểm tra `handleApiError()` return value
- Kiểm tra alert() có bị block không

