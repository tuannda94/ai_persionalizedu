"""
Model Package Schemas - Remote API
Pydantic schemas cho model packages
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PackageResponse(BaseModel):
    id: str
    subject: str
    version: str
    file_size: Optional[int] = None
    file_hash: Optional[str] = None
    download_url: str
    description: Optional[str] = None
    is_active: bool
    created_at: Optional[str] = None
    published_at: Optional[str] = None

    @classmethod
    def from_orm(cls, obj):
        """Convert ORM object to response, handling UUID and datetime conversion"""
        return cls(
            id=str(obj.id),
            subject=obj.subject,
            version=obj.version,
            file_size=obj.file_size,
            file_hash=obj.file_hash,
            download_url=obj.download_url,
            description=obj.description,
            is_active=obj.is_active or False,
            created_at=obj.created_at.isoformat() if obj.created_at else None,
            published_at=obj.published_at.isoformat() if obj.published_at else None
        )

    class Config:
        from_attributes = True


class PackageCreate(BaseModel):
    subject: str
    version: str
    download_url: str
    file_size: Optional[int] = None
    file_hash: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True


class PackageUpdate(BaseModel):
    description: Optional[str] = None
    is_active: Optional[bool] = None
    published_at: Optional[datetime] = None


class PackageCheckRequest(BaseModel):
    current_packages: list[dict]  # [{"subject": "CS101", "version": "v1"}, ...]


class PackageCheckResponse(BaseModel):
    has_updates: bool
    updates: list[PackageResponse] = []  # Packages that need updating

