"""
Local Backend Configuration
Chỉ dùng cho local backend (chạy trên máy sinh viên)
"""
from pydantic_settings import BaseSettings
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # ============================================
    # LOCAL BACKEND CONFIGURATION
    # ============================================

    # Database (SQLite - local only)
    DATABASE_URL: str = str(BASE_DIR / "storage" / "databases" / "chat_history.db")

    # Ollama (Local)
    OLLAMA_URL: str = "http://localhost:11434/api/generate"
    OLLAMA_MODEL: str = "llama3"

    # Model Packages (Local)
    MODEL_PACKAGES_DIR: str = str(Path(BASE_DIR).parent.parent.parent.parent / "storage" / "model-packages")

    # Storage (Local)
    STORAGE_DIR: str = str(BASE_DIR / "storage")
    DATABASES_DIR: str = str(BASE_DIR / "storage" / "databases")
    LOGS_DIR: str = str(BASE_DIR / "storage" / "logs")

    # ============================================
    # REMOTE API CONFIGURATION (Optional)
    # ============================================

    # Remote API Server (cho authentication, telemetry, updates)
    REMOTE_API_URL: str = ""  # Ví dụ: "https://api.fpt.edu.vn"
    REMOTE_API_TIMEOUT: int = 30

    # Telemetry (optional, gửi đến remote API)
    TELEMETRY_ENABLED: bool = True
    TELEMETRY_BATCH_SIZE: int = 10

    # Update Check
    UPDATE_CHECK_INTERVAL: int = 3600  # seconds (1 hour)

    # ============================================
    # APPLICATION CONFIGURATION
    # ============================================

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    class Config:
        env_file = BASE_DIR / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Load settings
try:
    settings = Settings()
except Exception as e:
    print(f"⚠️  Warning: Could not load settings from .env: {e}")
    print("   Using default values.")
    settings = Settings(_env_file=None)

# Ensure storage directories exist
os.makedirs(settings.DATABASES_DIR, exist_ok=True)
os.makedirs(settings.LOGS_DIR, exist_ok=True)
