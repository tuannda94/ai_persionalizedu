# 👨‍💼 Admin Dashboard

## Mục đích

Web interface cho quản trị viên để:
- ✅ Quản lý users
- ✅ Quản lý app versions
- ✅ Xem analytics/telemetry
- ✅ Upload new versions

## Tech Stack

- React 18
- Vite
- React Router
- Axios

## Cấu trúc

```
admin-dashboard/
├── src/
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── Versions.jsx
│   │   └── Analytics.jsx
│   ├── services/
│   │   └── api.js        # API client
│   ├── App.jsx
│   └── main.jsx
│
├── public/
├── package.json
└── vite.config.js
```

## Cài đặt

```bash
cd admin-dashboard
npm install
```

## Chạy

```bash
# Development
npm run dev

# Build
npm run build
```

## Cấu hình

Tạo file `.env`:

```env
VITE_API_URL=https://api.fpt.edu.vn
```

## Features

### Dashboard
- Overview statistics
- Recent activity
- System health

### Users
- List users
- Create/Edit/Delete users
- User roles management

### Versions
- List app versions
- Create new version
- Upload installers
- Set mandatory updates

### Analytics
- Query statistics
- Usage patterns
- Subject popularity
- Performance metrics
