"""
Chat Service - Local Backend
Xử lý conversation history (local SQLite)
"""
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.models.conversation import Message


def create_conversation_id() -> str:
    """Tạo conversation_id mới"""
    return f"conv_{uuid.uuid4().hex[:12]}"


def save_message(
    db: Session,
    user_id: Optional[str],
    conversation_id: str,
    role: str,
    message: str
) -> Message:
    """Lưu một message vào database"""
    msg = Message(
        user_id=user_id,
        conversation_id=conversation_id,
        role=role,
        message=message
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_conversation_history(
    db: Session,
    user_id: str,
    conversation_id: str,
    max_messages: int = 10
) -> List[dict]:
    """Lấy conversation history"""
    messages = (
        db.query(Message)
        .filter_by(
            user_id=user_id,
            conversation_id=conversation_id
        )
        .order_by(Message.timestamp.asc())
        .limit(max_messages)
        .all()
    )
    return [msg.to_dict() for msg in messages]


def get_user_conversations(db: Session, user_id: str, limit: int = 20) -> List[dict]:
    """Lấy danh sách conversations của user"""
    from sqlalchemy import func, desc

    # Lấy conversation_id unique và message cuối cùng
    subquery = (
        db.query(
            Message.conversation_id,
            func.max(Message.timestamp).label('last_message_time')
        )
        .filter_by(user_id=user_id)
        .group_by(Message.conversation_id)
        .order_by(desc('last_message_time'))
        .limit(limit)
        .subquery()
    )

    conversations = (
        db.query(Message)
        .join(subquery, Message.conversation_id == subquery.c.conversation_id)
        .filter(Message.user_id == user_id)
        .order_by(Message.timestamp.desc())
        .all()
    )

    # Group by conversation_id và lấy last message
    conv_dict = {}
    for msg in conversations:
        if msg.conversation_id not in conv_dict:
            conv_dict[msg.conversation_id] = {
                "conversation_id": msg.conversation_id,
                "last_message": msg.message[:100] if msg.message else "",
                "last_timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                "message_count": 0
            }
        conv_dict[msg.conversation_id]["message_count"] += 1

    return list(conv_dict.values())


def delete_conversation(db: Session, user_id: str, conversation_id: str) -> bool:
    """Xóa một conversation"""
    deleted = (
        db.query(Message)
        .filter_by(user_id=user_id, conversation_id=conversation_id)
        .delete()
    )
    db.commit()
    return deleted > 0
