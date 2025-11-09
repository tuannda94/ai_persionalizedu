"""
Telemetry Model - Remote API
Lưu trữ telemetry data từ student apps
"""
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    conversation_id = Column(String, index=True)
    question = Column(Text)
    answer_length = Column(Integer)
    used_segments = Column(Integer)
    duration_ms = Column(Integer)
    detected_subject = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="telemetry_records")

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "conversation_id": self.conversation_id,
            "question": self.question,
            "answer_length": self.answer_length,
            "used_segments": self.used_segments,
            "duration_ms": self.duration_ms,
            "detected_subject": self.detected_subject,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
