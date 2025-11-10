"""
Remote API Server Configuration
Chỉ dùng cho server (PostgreSQL, production)
"""
from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # ============================================
    # DATABASE CONFIGURATION (PostgreSQL)
    # ============================================

    DATABASE_URL: str  # Required: postgresql://user:pass@host/dbname
    DATABASE_POOL_SIZE: int = 10

    # ============================================
    # JWT CONFIGURATION
    # ============================================

    JWT_SECRET_KEY: str  # Required for production
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours (increased from 30 minutes)
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days (increased from 7 days)

    # ============================================
    # CORS CONFIGURATION
    # ============================================

    ALLOWED_ORIGINS: str = "https://app.fpt.edu.vn,https://admin.fpt.edu.vn"

    # ============================================
    # FILE STORAGE (cho installers và packages)
    # ============================================

    STORAGE_TYPE: str = "local"  # local, minio, s3
    STORAGE_PATH: str = str(BASE_DIR / "storage")
    STORAGE_ROOT: str = str(BASE_DIR / "storage")  # Alias for STORAGE_PATH
    BASE_URL: str = "https://api.fpt.edu.vn"  # Base URL for download links

    # MinIO Configuration (S3-compatible)
    MINIO_ENDPOINT: str = "localhost:9000"  # MinIO server endpoint
    MINIO_ACCESS_KEY: str = "minioadmin"  # Default MinIO access key
    MINIO_SECRET_KEY: str = "minioadmin"  # Default MinIO secret key
    MINIO_SECURE: bool = False  # Use HTTPS (True) or HTTP (False)
    MINIO_BUCKET_INSTALLERS: str = "installers"  # Bucket for app installers
    MINIO_BUCKET_PACKAGES: str = "packages"  # Bucket for model packages
    MINIO_BUCKET_DOCUMENTS: str = "documents"  # Bucket for documents

    # AWS S3 Configuration (alternative to MinIO)
    S3_BUCKET: Optional[str] = None
    S3_REGION: Optional[str] = None
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None

    # ============================================
    # ADMIN CONFIGURATION
    # ============================================

    ADMIN_EMAIL: str = "admin@fpt.edu.vn"
    ADMIN_PASSWORD: str = "changeme"  # Must change in production

    class Config:
        env_file = BASE_DIR / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Load settings
try:
    settings = Settings()
except Exception as e:
    print(f"❌ Error loading settings: {e}")
    print("   Required: DATABASE_URL, JWT_SECRET_KEY")
    raise
