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
    created_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

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

