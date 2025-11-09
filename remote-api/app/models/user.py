"""
User Model - Remote API
Quản lý người dùng trên server
"""
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    student_id = Column(String(50), unique=True, index=True)
    role = Column(String(20), default="student")  # student, admin
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    update_logs = relationship("UpdateLog", back_populates="user")
    published_versions = relationship("AppVersion", back_populates="publisher")
    published_packages = relationship("ModelPackage", back_populates="publisher")
    telemetry_records = relationship("Telemetry", back_populates="user")

    def to_dict(self, include_sensitive=False):
        data = {
            "id": str(self.id),
            "email": self.email,
            "full_name": self.full_name,
            "student_id": self.student_id,
            "role": self.role,
            "is_active": self.is_active,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_sensitive:
            data["updated_at"] = self.updated_at.isoformat() if self.updated_at else None
        return data
