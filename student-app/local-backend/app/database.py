"""
Database setup for Local Backend
Chỉ dùng SQLite (local storage)
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pathlib import Path
import os

from app.config import settings

# SQLite database path
DB_PATH = Path(settings.DATABASE_URL.replace("sqlite:///", ""))
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# SQLite engine
engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_database():
    """Khởi tạo database và tạo tables"""
    # Import all models để đảm bảo chúng được đăng ký với Base
    from app.models import conversation  # noqa

    Base.metadata.create_all(bind=engine)
    print(f"✅ Local database initialized: {DB_PATH}")
