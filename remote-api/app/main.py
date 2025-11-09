"""
Remote API Server - Main Application
FastAPI app chạy trên SERVER
Chỉ xử lý: Authentication, Telemetry, Updates
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_database, get_db
from app.api.v1 import auth, telemetry, updates, files, packages, feedback
from app.models.user import User
from app.core.security import get_password_hash

app = FastAPI(title="Remote API Server - FPT Polytechnic")

# CORS Middleware
origins = settings.ALLOWED_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(telemetry.router, prefix="/api/v1")
app.include_router(updates.router, prefix="/api/v1")
app.include_router(files.router, prefix="/api/v1")
app.include_router(packages.router, prefix="/api/v1")
app.include_router(feedback.router, prefix="/api/v1")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Khởi tạo database và seed admin user"""
    # Initialize database
    init_database()

    # Initialize MinIO buckets if using MinIO
    if settings.STORAGE_TYPE == "minio":
        from app.services.minio_service import get_minio_service
        minio_service = get_minio_service()
        if minio_service.client:
            print("✅ MinIO storage initialized")
        else:
            print("⚠️  MinIO client not available, falling back to local storage")

    # Seed admin user if not exists
    db = next(get_db())
    try:
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=settings.ADMIN_EMAIL,
                password_hash=get_password_hash(settings.ADMIN_PASSWORD),
                full_name="System Administrator",
                role="admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            print(f"✅ Created admin user: {settings.ADMIN_EMAIL}")
        else:
            print(f"✅ Admin user already exists: {settings.ADMIN_EMAIL}")
    except Exception as e:
        print(f"⚠️  Error seeding admin user: {e}")
    finally:
        db.close()

    print("🚀 Remote API Server started successfully!")


@app.get("/")
async def root():
    return {
        "message": "Remote API Server - FPT Polytechnic",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/v1/auth",
            "telemetry": "/api/v1/telemetry",
            "updates": "/api/v1/updates"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "remote-api"
    }
