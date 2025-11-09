"""
Feedback Pydantic Schemas - Remote API
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FeedbackCreate(BaseModel):
    """Schema để tạo feedback (từ student app)"""
    type: str = "auto"  # auto, manual, error, suggestion, bug, feature
    category: Optional[str] = None  # chat, update, performance, ui, etc.
    title: Optional[str] = None
    message: Optional[str] = None

    # Context (tự động thu thập)
    app_version: Optional[str] = None
    platform: Optional[str] = None
    conversation_id: Optional[str] = None
    error_code: Optional[str] = None
    error_details: Optional[str] = None

    # Priority (chỉ cho manual feedback)
    priority: Optional[int] = Field(default=3, ge=1, le=5)


class FeedbackUpdate(BaseModel):
    """Schema để update feedback (admin only)"""
    status: Optional[str] = None  # pending, reviewing, resolved, rejected, archived
    priority: Optional[int] = Field(None, ge=1, le=5)
    assigned_to: Optional[str] = None
    admin_notes: Optional[str] = None
    resolution: Optional[str] = None


class FeedbackResponse(BaseModel):
    """Schema response cho feedback"""
    id: str
    user_id: Optional[str]
    type: str
    category: Optional[str]
    title: Optional[str]
    message: Optional[str]
    app_version: Optional[str]
    platform: Optional[str]
    conversation_id: Optional[str]
    error_code: Optional[str]
    error_details: Optional[str]
    status: str
    priority: int
    assigned_to: Optional[str]
    admin_notes: Optional[str]
    resolution: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]
    resolved_at: Optional[str]

    class Config:
        from_attributes = True


class FeedbackListResponse(BaseModel):
    """Schema cho list feedback với pagination"""
    items: list[FeedbackResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

