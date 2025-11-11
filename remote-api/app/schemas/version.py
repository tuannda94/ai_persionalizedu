"""
Version Pydantic Schemas - Remote API
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VersionCheckRequest(BaseModel):
    current_version: str
    current_version_code: int
    platform: str  # windows, macos, linux


class VersionCheckResponse(BaseModel):
    has_update: bool
    latest_version: Optional[str] = None
    latest_version_code: Optional[int] = None
    download_url: Optional[str] = None
    is_mandatory: Optional[bool] = False
    release_notes: Optional[str] = None
    file_size: Optional[int] = None
    file_hash: Optional[str] = None
    # Learning package info (if available)
    has_learning_package: Optional[bool] = False
    learning_package_url: Optional[str] = None
    learning_package_hash: Optional[str] = None
    learning_package_size: Optional[int] = None
    learning_package_manifest: Optional[str] = None


class VersionCreate(BaseModel):
    version: str
    version_code: int
    platform: str
    release_type: str = "stable"
    download_url: str
    release_notes: Optional[str] = None
    file_size: Optional[int] = None
    file_hash: Optional[str] = None
    is_mandatory: bool = False
    min_version_code: Optional[int] = None


class VersionUpdate(BaseModel):
    release_notes: Optional[str] = None
    is_mandatory: Optional[bool] = None
    published_at: Optional[datetime] = None


class VersionResponse(BaseModel):
    id: str
    version: str
    version_code: int
    platform: str
    release_type: str
    download_url: str
    release_notes: Optional[str]
    file_size: Optional[int]
    file_hash: Optional[str]
    is_mandatory: bool
    min_version_code: Optional[int]
    created_at: Optional[str]
    published_at: Optional[str]
    # Learning package fields
    has_learning_package: Optional[bool] = False
    learning_package_url: Optional[str] = None
    learning_package_hash: Optional[str] = None
    learning_package_size: Optional[int] = None
    learning_package_manifest: Optional[str] = None

    @classmethod
    def from_orm(cls, obj):
        """Convert ORM object to response, handling UUID and datetime conversion"""
        return cls(
            id=str(obj.id),
            version=obj.version,
            version_code=obj.version_code,
            platform=obj.platform,
            release_type=obj.release_type,
            download_url=obj.download_url,
            release_notes=obj.release_notes,
            file_size=obj.file_size,
            file_hash=obj.file_hash,
            is_mandatory=obj.is_mandatory or False,
            min_version_code=obj.min_version_code,
            created_at=obj.created_at.isoformat() if obj.created_at else None,
            published_at=obj.published_at.isoformat() if obj.published_at else None,
            has_learning_package=obj.has_learning_package or False,
            learning_package_url=obj.learning_package_url,
            learning_package_hash=obj.learning_package_hash,
            learning_package_size=obj.learning_package_size,
            learning_package_manifest=obj.learning_package_manifest
        )

    class Config:
        from_attributes = True


class UpdateLogCreate(BaseModel):
    from_version: str
    to_version: str
    platform: str
    status: str
    error_message: Optional[str] = None


class UpdateLogResponse(BaseModel):
    id: str
    user_id: Optional[str]
    from_version: Optional[str]
    to_version: Optional[str]
    platform: Optional[str]
    status: Optional[str]
    error_message: Optional[str]
    started_at: Optional[str]
    completed_at: Optional[str]

    class Config:
        from_attributes = True

