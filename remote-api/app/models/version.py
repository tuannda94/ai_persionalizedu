"""
App Version Model - Remote API
Quản lý các phiên bản của desktop app trên server
"""
from sqlalchemy import Column, String, Integer, Boolean, Text, BigInteger, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class AppVersion(Base):
    __tablename__ = "app_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version = Column(String(50), unique=True, nullable=False)  # e.g., "1.2.3"
    version_code = Column(Integer, unique=True, nullable=False)  # e.g., 123
    platform = Column(String(20), nullable=False)  # windows, macos, linux
    release_type = Column(String(20), default="stable")  # stable, beta, alpha
    download_url = Column(Text, nullable=False)
    release_notes = Column(Text)
    file_size = Column(BigInteger)  # bytes
    file_hash = Column(String(64))  # SHA-256
    is_mandatory = Column(Boolean, default=False)
    min_version_code = Column(Integer)  # Minimum version required
    created_at = Column(DateTime, default=datetime.utcnow)
    published_at = Column(DateTime)
    published_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Learning Package fields (optional - chỉ khi có package mới)
    learning_package_url = Column(Text)  # URL to learning package zip file
    learning_package_hash = Column(String(64))  # SHA-256 hash of learning package
    learning_package_size = Column(BigInteger)  # Size in bytes
    learning_package_manifest = Column(Text)  # JSON manifest describing package contents
    has_learning_package = Column(Boolean, default=False)  # Flag to indicate if this version includes a learning package

    # Relationships
    publisher = relationship("User", back_populates="published_versions")

    def to_dict(self):
        return {
            "id": str(self.id),
            "version": self.version,
            "version_code": self.version_code,
            "platform": self.platform,
            "release_type": self.release_type,
            "download_url": self.download_url,
            "release_notes": self.release_notes,
            "file_size": self.file_size,
            "file_hash": self.file_hash,
            "is_mandatory": self.is_mandatory,
            "min_version_code": self.min_version_code,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            # Learning package fields
            "has_learning_package": self.has_learning_package or False,
            "learning_package_url": self.learning_package_url,
            "learning_package_hash": self.learning_package_hash,
            "learning_package_size": self.learning_package_size,
            "learning_package_manifest": self.learning_package_manifest
        }


class UpdateLog(Base):
    __tablename__ = "update_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    from_version = Column(String(50))
    to_version = Column(String(50))
    platform = Column(String(20))
    status = Column(String(20))  # pending, downloading, installing, completed, failed
    error_message = Column(Text)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="update_logs")

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "from_version": self.from_version,
            "to_version": self.to_version,
            "platform": self.platform,
            "status": self.status,
            "error_message": self.error_message,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
