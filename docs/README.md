# 📚 Documentation Index

Tài liệu đầy đủ cho hệ thống AI Personalized Learning System.

## 🚀 Bắt Đầu Nhanh

- **[Quick Start Guide](QUICK_START.md)** ⭐ - Hướng dẫn nhanh để bắt đầu chạy dự án
- **[Project Structure](PROJECT_STRUCTURE.md)** - Cấu trúc dự án chi tiết, từng file và chức năng

## 📖 Tài Liệu Chính

### Kiến Trúc và Thiết Kế

- **[System Architecture](architecture.md)** - Kiến trúc hệ thống, data flow, components
- **[Storage Architecture](STORAGE_ARCHITECTURE.md)** - Kiến trúc storage (local/MinIO), file hosting
- **[FINAL_STRUCTURE.md](FINAL_STRUCTURE.md)** - Cấu trúc dự án tổng quan

### Hướng Dẫn Sử Dụng

- **[Version Management Guide](VERSION_MANAGEMENT_GUIDE.md)** - Quản lý phiên bản app và learning packages
- **[Learning Package Structure](LEARNING_PACKAGE_STRUCTURE.md)** - Cấu trúc và format của learning package
- **[MinIO Setup](MINIO_SETUP.md)** - Hướng dẫn setup MinIO storage (optional)

### Development

- **[API Documentation](api.md)** - API endpoints reference
- **[Testing Guide](TESTING_GUIDE.md)** - Hướng dẫn testing
- **[Troubleshooting](troubleshooting.md)** - Xử lý các lỗi thường gặp

## 📦 Component Documentation

### Student App

- **[Desktop App README](../student-app/desktop/README.md)** - Electron desktop app
- **[Local Backend README](../student-app/local-backend/README.md)** - FastAPI local backend

### Remote API

- **[Remote API README](../remote-api/README.md)** - API server documentation

### Admin Dashboard

- **[Admin Dashboard README](../admin-dashboard/README.md)** - Web admin interface

## 🔧 Scripts và Tools

### Start Scripts

- `scripts/start/start_all.sh` - Start tất cả services
- `scripts/start/start_remote_api.sh` - Start Remote API
- `scripts/start/start_student_app.sh` - Start Student App

### Build Scripts

- `scripts/build/build_all.sh` - Build tất cả components
- `scripts/build/build_data_pipeline.sh` - Build learning packages
- `scripts/build/build_student_app.sh` - Build Student App executable

### Test Scripts

- `scripts/test/test_all.sh` - Test tất cả features
- `scripts/test/test_api_endpoints.sh` - Test API endpoints

## 📝 Tài Liệu Tham Khảo

### Implementation

- **[Implementation Plan](implementation_plan.md)** - Kế hoạch triển khai
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Tóm tắt implementation
- **[Implementation Progress](IMPLEMENTATION_PROGRESS.md)** - Tiến độ implementation

### Status và Reviews

- **[Project Status](PROJECT_STATUS.md)** - Trạng thái dự án hiện tại
- **[Final Implementation Status](FINAL_IMPLEMENTATION_STATUS.md)** - Trạng thái implementation cuối cùng
- **[Expert Review](EXPERT_REVIEW.md)** - Review từ expert

### Guides

- **[Packaging Guide](packaging_guide.md)** - Hướng dẫn đóng gói ứng dụng
- **[Version Update Guide](VERSION_UPDATE_GUIDE.md)** - Hướng dẫn cập nhật phiên bản

## 🔍 Tài Liệu Nghiên Cứu

- **[Casibase UI Research](CASIBASE_UI_RESEARCH.md)** - Nghiên cứu UI từ Casibase
- **[Ant Design Integration](ANT_DESIGN_INTEGRATION.md)** - Tích hợp Ant Design
- **[Message Loss Analysis](MESSAGE_LOSS_ANALYSIS.md)** - Phân tích mất message
- **[Auth Improvements](AUTH_IMPROVEMENTS.md)** - Cải thiện authentication

## 📁 Archive

Các tài liệu cũ được lưu trong `docs/archive/` để tham khảo lịch sử.

## 🆘 Hỗ Trợ

Nếu cần hỗ trợ:
1. Xem [Troubleshooting](troubleshooting.md)
2. Kiểm tra [Project Status](PROJECT_STATUS.md)
3. Xem component-specific READMEs
4. Tạo issue trên GitHub

---

**Last Updated**: 2024-11-12
