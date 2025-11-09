"""
Error Handling - Local Backend
Consistent error handling và user-friendly messages
"""
from fastapi import HTTPException, status
from typing import Optional


class AppError(Exception):
    """Base application error"""
    def __init__(self, message: str, code: str = "UNKNOWN_ERROR", status_code: int = 500):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(self.message)


class ChatError(AppError):
    """Chat-related errors"""
    def __init__(self, message: str, code: str = "CHAT_ERROR"):
        super().__init__(message, code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class RAGError(AppError):
    """RAG-related errors"""
    def __init__(self, message: str, code: str = "RAG_ERROR"):
        super().__init__(message, code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class OllamaError(AppError):
    """Ollama-related errors"""
    def __init__(self, message: str, code: str = "OLLAMA_ERROR"):
        super().__init__(message, code, status.HTTP_503_SERVICE_UNAVAILABLE)


def handle_error(error: Exception) -> HTTPException:
    """
    Convert application errors to HTTP exceptions with user-friendly messages
    """
    if isinstance(error, AppError):
        return HTTPException(
            status_code=error.status_code,
            detail={
                "error": error.code,
                "message": error.message,
                "user_message": get_user_friendly_message(error.code, error.message)
            }
        )

    # Unknown error
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={
            "error": "INTERNAL_ERROR",
            "message": str(error),
            "user_message": "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau."
        }
    )


def get_user_friendly_message(error_code: str, technical_message: str) -> str:
    """
    Convert technical error messages to user-friendly Vietnamese messages
    """
    messages = {
        "CHAT_ERROR": "Không thể xử lý câu hỏi. Vui lòng thử lại.",
        "RAG_ERROR": "Không tìm thấy thông tin liên quan. Vui lòng thử câu hỏi khác.",
        "OLLAMA_ERROR": "Không thể kết nối đến AI model. Vui lòng kiểm tra Ollama đang chạy.",
        "INTERNAL_ERROR": "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
        "NETWORK_ERROR": "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
        "TIMEOUT_ERROR": "Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại."
    }

    return messages.get(error_code, "Đã xảy ra lỗi. Vui lòng thử lại.")

