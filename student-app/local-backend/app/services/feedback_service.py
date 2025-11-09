"""
Feedback Service - Local Backend
Tự động thu thập và gửi feedback đến Remote API
"""
import requests
import json
from typing import Dict, Optional
from datetime import datetime
from app.config import settings


class FeedbackService:
    """Service để gửi feedback đến remote API (tự động và manual)"""

    def __init__(self):
        self.enabled = getattr(settings, 'FEEDBACK_ENABLED', True)
        self.remote_api_url = getattr(settings, 'REMOTE_API_URL', '')
        self.timeout = getattr(settings, 'REMOTE_API_TIMEOUT', 5)
        self.app_version = getattr(settings, 'APP_VERSION', '1.0.0')
        self.platform = self._detect_platform()

    def _detect_platform(self) -> str:
        """Detect platform"""
        import platform
        system = platform.system().lower()
        if system == 'windows':
            return 'windows'
        elif system == 'darwin':
            return 'macos'
        elif system == 'linux':
            return 'linux'
        return 'unknown'

    def send_auto_feedback(
        self,
        category: str,
        title: str,
        message: Optional[str] = None,
        error_code: Optional[str] = None,
        error_details: Optional[str] = None,
        conversation_id: Optional[str] = None,
        priority: int = 3
    ) -> bool:
        """
        Gửi feedback tự động (từ system events)

        Args:
            category: "chat", "update", "performance", "ui", "error", etc.
            title: Tiêu đề ngắn gọn
            message: Nội dung chi tiết (optional)
            error_code: Mã lỗi nếu có (optional)
            error_details: Chi tiết lỗi (optional)
            conversation_id: ID conversation nếu liên quan (optional)
            priority: 1=critical, 2=high, 3=medium, 4=low, 5=info

        Returns:
            True nếu thành công, False nếu không
        """
        if not self.enabled or not self.remote_api_url:
            return False

        try:
            payload = {
                "type": "auto",
                "category": category,
                "title": title,
                "message": message,
                "app_version": self.app_version,
                "platform": self.platform,
                "conversation_id": conversation_id,
                "error_code": error_code,
                "error_details": error_details,
                "priority": priority
            }

            response = requests.post(
                f"{self.remote_api_url}/api/v1/feedback",
                json=payload,
                timeout=self.timeout
            )

            return response.status_code == 201
        except Exception as e:
            print(f"⚠️  Feedback send failed: {e}")
            return False

    def send_manual_feedback(
        self,
        type: str,  # "suggestion", "bug", "feature"
        category: str,
        title: str,
        message: str,
        priority: int = 3
    ) -> bool:
        """
        Gửi feedback manual (từ user)

        Args:
            type: "suggestion", "bug", "feature"
            category: "chat", "update", "performance", "ui", etc.
            title: Tiêu đề
            message: Nội dung
            priority: 1=critical, 2=high, 3=medium, 4=low, 5=info

        Returns:
            True nếu thành công, False nếu không
        """
        if not self.enabled or not self.remote_api_url:
            return False

        try:
            payload = {
                "type": type,
                "category": category,
                "title": title,
                "message": message,
                "app_version": self.app_version,
                "platform": self.platform,
                "priority": priority
            }

            response = requests.post(
                f"{self.remote_api_url}/api/v1/feedback",
                json=payload,
                timeout=self.timeout
            )

            return response.status_code == 201
        except Exception as e:
            print(f"⚠️  Feedback send failed: {e}")
            return False

    def send_error_feedback(
        self,
        error_code: str,
        error_message: str,
        error_details: Optional[str] = None,
        category: str = "error",
        conversation_id: Optional[str] = None
    ) -> bool:
        """
        Gửi feedback cho lỗi hệ thống

        Args:
            error_code: Mã lỗi
            error_message: Thông báo lỗi
            error_details: Chi tiết lỗi (stack trace, etc.)
            category: Category của lỗi
            conversation_id: ID conversation nếu liên quan

        Returns:
            True nếu thành công, False nếu không
        """
        return self.send_auto_feedback(
            category=category,
            title=f"Error: {error_code}",
            message=error_message,
            error_code=error_code,
            error_details=error_details,
            conversation_id=conversation_id,
            priority=1  # Errors are critical
        )


# Global instance
_feedback_service = None

def get_feedback_service() -> FeedbackService:
    """Get global feedback service instance"""
    global _feedback_service
    if _feedback_service is None:
        _feedback_service = FeedbackService()
    return _feedback_service

