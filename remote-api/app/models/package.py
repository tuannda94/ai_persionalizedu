"""
Model Package Model - Remote API
Quản lý các RAG model packages trên server
"""
from sqlalchemy import Column, String, Integer, Boolean, Text, BigInteger, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class ModelPackage(Base):
    __tablename__ = "model_packages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject = Column(String(50), nullable=False)  # CS101, PHP1, PHP2, etc.
    version = Column(String(20), nullable=False)  # v1, v2, v3, etc.
    file_path = Column(Text, nullable=False)  # Path to package file (zip/tar.gz)
    file_size = Column(BigInteger)  # bytes
    file_hash = Column(String(64))  # SHA-256
    manifest_path = Column(Text)  # Path to manifest.json
    download_url = Column(Text, nullable=False)
    description = Column(Text)  # Package description
    is_active = Column(Boolean, default=True)  # Can be disabled
    created_at = Column(DateTime, default=datetime.utcnow)
    published_at = Column(DateTime)
    published_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Relationships
    publisher = relationship("User", back_populates="published_packages")

    def to_dict(self):
        return {
            "id": str(self.id),
            "subject": self.subject,
            "version": self.version,
            "file_size": self.file_size,
            "file_hash": self.file_hash,
            "download_url": self.download_url,
            "description": self.description,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "published_at": self.published_at.isoformat() if self.published_at else None,
        }

