"""
User Pydantic Schemas - Remote API
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    student_id: Optional[str] = None
    role: Optional[str] = "student"  # student, admin


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    student_id: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6)


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    student_id: Optional[str]
    role: str
    is_active: bool
    last_login: Optional[str]
    created_at: Optional[str]

    @classmethod
    def from_orm(cls, obj):
        """Convert ORM object to response, handling UUID and datetime"""
        data = {
            "id": str(obj.id),
            "email": obj.email,
            "full_name": obj.full_name,
            "student_id": obj.student_id,
            "role": obj.role,
            "is_active": obj.is_active,
            "last_login": obj.last_login.isoformat() if obj.last_login else None,
            "created_at": obj.created_at.isoformat() if obj.created_at else None
        }
        return cls(**data)

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenRefresh(BaseModel):
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
