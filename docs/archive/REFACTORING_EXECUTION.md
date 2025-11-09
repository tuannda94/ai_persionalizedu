# 🔄 Refactoring Execution Plan

## Phân tích Hiện trạng

### Vấn đề:
1. Code lẫn lộn giữa local backend và remote API
2. Cấu trúc không rõ ràng
3. Dependencies không tách biệt
4. Storage không được tổ chức tốt

### Giải pháp:
Tách thành 4 components độc lập hoàn toàn.

## Cấu trúc Mới (Chuyên nghiệp)

```
AI_PersonalizedU/
│
├── student-app/                    # 🎓 PHẦN MỀM SINH VIÊN
│   ├── desktop/                    # Desktop application
│   │   └── [Electron + React]
│   │
│   └── local-backend/              # Local backend (chạy trên máy SV)
│       ├── app/
│       │   ├── main.py            # FastAPI - CHỈ chat endpoints
│       │   ├── config.py          # Local config
│       │   ├── database.py        # SQLite
│       │   │
│       │   ├── api/v1/
│       │   │   └── chat.py        # Chat endpoints ONLY
│       │   │
│       │   ├── services/
│       │   │   ├── rag_service.py
│       │   │   ├── chat_service.py
│       │   │   └── ollama_service.py
│       │   │
│       │   └── models/
│       │       └── conversation.py # Local conversation model
│       │
│       ├── storage/
│       │   ├── databases/         # SQLite files
│       │   └── logs/
│       │
│       └── requirements.txt
│
├── remote-api/                     # 🌐 API SERVER CỦA TRƯỜNG
│   ├── app/
│   │   ├── main.py                # FastAPI - CHỈ auth/telemetry/updates
│   │   ├── config.py              # Server config
│   │   ├── database.py            # PostgreSQL
│   │   │
│   │   ├── api/v1/
│   │   │   ├── auth.py            # Authentication
│   │   │   ├── telemetry.py       # Telemetry
│   │   │   └── updates.py         # Version management
│   │   │
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── telemetry_service.py
│   │   │   └── update_service.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── version.py
│   │   │   └── telemetry.py
│   │   │
│   │   └── schemas/
│   │
│   ├── migrations/
│   └── requirements.txt
│
├── admin-dashboard/                # 👨‍💼 WEB QUẢN TRỊ
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── README.md
│
├── storage/                        # 💾 LƯU TRỮ
│   ├── model-packages/            # RAG data
│   ├── databases/                 # Shared DBs (nếu cần)
│   └── logs/                      # Shared logs
│
├── data-pipeline/                  # 📊 DATA PIPELINE
│   └── [build model packages]
│
└── scripts/                        # 🔧 SCRIPTS
    ├── build/
    ├── start/
    └── deploy/
```

## Execution Steps

### Step 1: Tạo cấu trúc thư mục
### Step 2: Tách Student App
### Step 3: Tách Remote API
### Step 4: Setup Admin Dashboard
### Step 5: Reorganize Storage
### Step 6: Update Scripts
### Step 7: Cleanup

