"""
Telemetry Pydantic Schemas - Remote API
"""
from pydantic import BaseModel
from typing import Optional


class TelemetryCreate(BaseModel):
    user_id: Optional[str] = None
    conversation_id: Optional[str] = None
    question: Optional[str] = None
    answer_length: Optional[int] = None
    used_segments: Optional[int] = None
    duration_ms: Optional[int] = None
    detected_subject: Optional[str] = None


class TelemetryResponse(BaseModel):
    id: str
    user_id: Optional[str]
    conversation_id: Optional[str]
    question: Optional[str]
    answer_length: Optional[int]
    used_segments: Optional[int]
    duration_ms: Optional[int]
    detected_subject: Optional[str]
    timestamp: Optional[str]

    class Config:
        from_attributes = True

