# 👨‍💼 Admin Dashboard

## 📋 Tổng Quan

Web interface cho quản trị viên để quản lý toàn bộ hệ thống.

## 🎯 Mục Đích

- ✅ **User Management**: CRUD users, quản lý roles
- ✅ **Version Management**: Upload versions, learning packages, publish/unpublish
- ✅ **Package Management**: Upload và quản lý model packages
- ✅ **Analytics**: Xem thống kê telemetry, usage patterns
- ✅ **Feedback Management**: Xem và xử lý feedback từ students
- ✅ **Document Management**: Upload và quản lý tài liệu

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool và dev server
- **React Router** - Routing
- **Ant Design** - UI component library
- **Axios** - HTTP client

## 📁 Cấu Trúc

```
admin-dashboard/
├── src/
│   ├── pages/                    # Page Components
│   │   ├── Dashboard.jsx         # Overview dashboard
│   │   ├── Users.jsx             # User management
│   │   ├── Versions.jsx          # Version management (với learning package)
│   │   ├── Packages.jsx          # Package management
│   │   ├── Feedback.jsx          # Feedback management
│   │   ├── Analytics.jsx         # Analytics/telemetry stats
│   │   ├── Documents.jsx         # Document management
│   │   └── Login.jsx             # Login page
│   │
│   ├── components/               # Reusable Components
│   │   ├── ProtectedRoute.jsx    # Route protection (require admin)
│   │   └── AuthStatus.jsx        # Auth status indicator
│   │
│   ├── services/                 # API Client
│   │   ├── api.js                # Axios client với interceptors
│   │   └── errorHandler.js       # Error handling utilities
│   │
│   ├── utils/                    # Utilities
│   │   └── errorHandler.js       # Error handling
│   │
│   ├── App.antd.jsx              # Main App component (Ant Design)
│   ├── App.jsx                   # Alternative App component
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
│
├── public/                       # Static files
├── index.html                    # HTML entry point
├── package.json                  # Dependencies
├── vite.config.js                # Vite configuration
└── README.md
```

## 🚀 Cài Đặt

```bash
cd admin-dashboard
npm install
```

## ⚙️ Cấu Hình

Tạo file `.env`:

```env
VITE_API_URL=http://localhost:8001
```

Hoặc cho production:

```env
VITE_API_URL=https://api.fpt.edu.vn
```

## ▶️ Chạy

### Development

```bash
npm run dev
```

App sẽ chạy tại `http://localhost:3001` (hoặc port khác nếu 3001 đã được dùng).

### Build

```bash
npm run build
```

Output: `dist/` directory

### Preview Production Build

```bash
npm run preview
```

## 🔑 Tính Năng

### Dashboard

- Overview statistics (users, versions, feedback)
- Recent activity
- System health status

### Users

- List users với filtering (role, status)
- Create new user
- Edit user (full name, role, status)
- Delete user
- User roles: `admin`, `student`

### Versions

- List app versions với filtering (platform, type)
- Upload new version:
  - Installer file (.exe, .dmg, .AppImage)
  - Version metadata (version, version_code, platform, release_type)
  - Learning package (optional): ZIP file + JSON manifest
- Publish/Unpublish versions
- View version details (modal)
- Download installer và learning package

### Packages

- List model packages
- Upload new package (ZIP file + manifest)
- Activate/Deactivate packages
- View package details

### Feedback

- List feedback với filtering (status, type, category)
- View feedback details
- Assign feedback to admin
- Update feedback status (pending, reviewing, resolved)
- Add admin notes và resolution

### Analytics

- Telemetry statistics (queries, response times, subjects)
- Usage patterns
- Subject popularity
- Performance metrics

### Documents

- List documents
- Upload documents
- Download documents
- Delete documents

## 🔐 Authentication

### Login

1. Navigate to `/login`
2. Enter email và password
3. JWT tokens được lưu trong `localStorage`
4. Redirect to dashboard

### Protected Routes

Tất cả routes (trừ `/login`) yêu cầu authentication và role `admin`.

### Token Refresh

Axios interceptor tự động refresh token khi expired.

## 🎨 UI Components

Sử dụng **Ant Design** components:
- `Table` - Data tables
- `Form` - Forms với validation
- `Modal` - Dialogs
- `Upload` - File upload
- `Tag` - Status tags
- `Button`, `Input`, `Select`, etc.

## 📡 API Integration

API client (`src/services/api.js`):
- Axios instance với base URL
- Request interceptor: Add JWT token
- Response interceptor: Handle 401, auto refresh token
- Error handling

## 🐛 Troubleshooting

### CORS Error

- Kiểm tra `ALLOWED_ORIGINS` trong Remote API config
- Đảm bảo `VITE_API_URL` đúng
- Restart Remote API server sau khi thay đổi CORS config

### 401 Unauthorized

- Token expired → Auto refresh
- Refresh failed → Redirect to login
- Kiểm tra token trong `localStorage`

### API Errors

- Xem console logs
- Kiểm tra Network tab trong DevTools
- Xem error messages từ API

## 📚 Tài Liệu Liên Quan

- [Remote API README](../remote-api/README.md)
- [Version Management Guide](../docs/VERSION_MANAGEMENT_GUIDE.md)
- [Learning Package Structure](../docs/LEARNING_PACKAGE_STRUCTURE.md)

