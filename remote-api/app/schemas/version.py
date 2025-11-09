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

