"""
Feedback Model - Remote API
Thu thập feedback tự động và manual từ student apps
"""
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class FeedbackStatus(enum.Enum):
    """Trạng thái xử lý feedback"""
    PENDING = "pending"  # Chờ xử lý
    REVIEWING = "reviewing"  # Đang xem xét
    RESOLVED = "resolved"  # Đã xử lý
    REJECTED = "rejected"  # Từ chối
    ARCHIVED = "archived"  # Lưu trữ


class FeedbackType(enum.Enum):
    """Loại feedback"""
    AUTO = "auto"  # Tự động (từ system)
    MANUAL = "manual"  # Manual (từ user)
    ERROR = "error"  # Lỗi hệ thống
    SUGGESTION = "suggestion"  # Góp ý
    BUG = "bug"  # Bug report
    FEATURE = "feature"  # Feature request


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    # Feedback content
    type = Column(SQLEnum(FeedbackType), default=FeedbackType.AUTO, nullable=False)
    category = Column(String(50))  # "chat", "update", "performance", "ui", etc.
    title = Column(String(255))  # Tiêu đề ngắn gọn
    message = Column(Text)  # Nội dung chi tiết

    # Context data (tự động thu thập)
    app_version = Column(String(50))  # Version của app
    platform = Column(String(20))  # windows, macos, linux
    conversation_id = Column(String)  # Nếu liên quan đến conversation
    error_code = Column(String(50))  # Nếu là lỗi
    error_details = Column(Text)  # Chi tiết lỗi (stack trace, etc.)

    # Metadata
    status = Column(SQLEnum(FeedbackStatus), default=FeedbackStatus.PENDING, nullable=False, index=True)
    priority = Column(Integer, default=3)  # 1=critical, 2=high, 3=medium, 4=low, 5=info

    # Admin processing
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    admin_notes = Column(Text)  # Ghi chú từ admin
    resolution = Column(Text)  # Giải pháp/response

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime)  # Khi được resolve

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="feedback_submitted")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="feedback_assigned")

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "type": self.type.value if self.type else None,
            "category": self.category,
            "title": self.title,
            "message": self.message,
            "app_version": self.app_version,
            "platform": self.platform,
            "conversation_id": self.conversation_id,
            "error_code": self.error_code,
            "error_details": self.error_details,
            "status": self.status.value if self.status else None,
            "priority": self.priority,
            "assigned_to": str(self.assigned_to) if self.assigned_to else None,
            "admin_notes": self.admin_notes,
            "resolution": self.resolution,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }

