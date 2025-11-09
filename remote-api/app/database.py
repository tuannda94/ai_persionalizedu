"""
Database setup for Remote API Server
Chỉ dùng PostgreSQL (production database)
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

# PostgreSQL engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    pool_pre_ping=True,
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
    from app.models import user, version, telemetry, package  # noqa

    Base.metadata.create_all(bind=engine)
    print(f"✅ Remote API database initialized")
