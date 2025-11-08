"""
Chat Storage Module
Lưu trữ và quản lý conversation history sử dụng SQLite
"""
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import uuid
from pathlib import Path
from typing import List, Optional

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "chat_history.db"

Base = declarative_base()

# SQLite engine
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)
SessionLocal = sessionmaker(bind=engine)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, index=True)
    conversation_id = Column(String, index=True)
    role = Column(String)  # "user" hoặc "assistant"
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "conversation_id": self.conversation_id,
            "role": self.role,
            "message": self.message,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }


# Tạo tables - phải được gọi SAU KHI định nghĩa Message class
def init_database():
    """Khởi tạo database và tạo tables nếu chưa có"""
    Base.metadata.create_all(engine)
    print(f"✅ Database initialized at: {DB_PATH}")

# Tự động khởi tạo khi import
init_database()


def create_conversation_id() -> str:
    """Tạo conversation_id mới"""
    return f"conv_{uuid.uuid4().hex[:12]}"


def save_message(user_id: str, conversation_id: str, role: str, message: str) -> Message:
    """Lưu một message vào database"""
    db: Session = SessionLocal()
    try:
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
    finally:
        db.close()


def get_conversation(user_id: str, conversation_id: str, limit: Optional[int] = None) -> List[Message]:
    """Lấy toàn bộ conversation history"""
    db: Session = SessionLocal()
    try:
        query = db.query(Message).filter_by(
            user_id=user_id,
            conversation_id=conversation_id
        ).order_by(Message.id.asc())

        if limit:
            query = query.limit(limit)

        return query.all()
    finally:
        db.close()


def get_conversation_history(user_id: str, conversation_id: str, max_messages: int = 10) -> List[dict]:
    """Lấy conversation history dạng dict (cho API)"""
    messages = get_conversation(user_id, conversation_id, limit=max_messages)
    return [msg.to_dict() for msg in messages]


def get_user_conversations(user_id: str, limit: int = 20) -> List[dict]:
    """Lấy danh sách conversations của user"""
    db: Session = SessionLocal()
    try:
        # Lấy conversation_id unique và message cuối cùng
        from sqlalchemy import func, desc

        subquery = db.query(
            Message.conversation_id,
            func.max(Message.timestamp).label('last_message_time')
        ).filter_by(user_id=user_id).group_by(Message.conversation_id).order_by(
            desc('last_message_time')
        ).limit(limit).subquery()

        conversations = db.query(Message).join(
            subquery,
            Message.conversation_id == subquery.c.conversation_id
        ).filter(
            Message.user_id == user_id
        ).order_by(Message.timestamp.desc()).all()

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
    finally:
        db.close()


def delete_conversation(user_id: str, conversation_id: str) -> bool:
    """Xóa một conversation"""
    db: Session = SessionLocal()
    try:
        deleted = db.query(Message).filter_by(
            user_id=user_id,
            conversation_id=conversation_id
        ).delete()
        db.commit()
        return deleted > 0
    finally:
        db.close()

