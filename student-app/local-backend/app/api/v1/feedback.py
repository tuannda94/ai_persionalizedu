"""
Feedback API Endpoints - Local Backend
Cho phép desktop app gửi feedback và check status
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import requests

from app.database import get_db
from app.services.feedback_service import get_feedback_service
from app.config import settings

router = APIRouter(prefix="/feedback", tags=["feedback"])


class FeedbackRequest(BaseModel):
    type: str
    category: str
    title: str
    message: str
    priority: int = 3


@router.post("/send")
async def send_feedback(
    feedback_req: FeedbackRequest,
    db: Session = Depends(get_db)
):
    """
    Gửi feedback manual từ desktop app
    """
    if not settings.FEEDBACK_ENABLED or not settings.REMOTE_API_URL:
        raise HTTPException(
            status_code=503,
            detail="Feedback service is not enabled"
        )

    try:
        feedback_service = get_feedback_service()
        success = feedback_service.send_manual_feedback(
            type=feedback_req.type,
            category=feedback_req.category,
            title=feedback_req.title,
            message=feedback_req.message,
            priority=feedback_req.priority
        )

        if success:
            return {"ok": True, "message": "Feedback sent successfully"}
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to send feedback to remote API. Please check logs for details."
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in send_feedback endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal error while sending feedback: {str(e)}"
        )


@router.get("/status")
async def get_feedback_status(
    feedback_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Lấy trạng thái feedback (nếu có feedback_id)
    Hoặc lấy danh sách feedback của user (nếu đã login)
    """
    if not settings.FEEDBACK_ENABLED or not settings.REMOTE_API_URL:
        return {"ok": False, "message": "Feedback service is not enabled"}

    try:
        # TODO: Get user_id from auth token if available
        user_id = None

        if feedback_id:
            # Get specific feedback
            response = requests.get(
                f"{settings.REMOTE_API_URL}/api/v1/feedback/{feedback_id}",
                timeout=settings.REMOTE_API_TIMEOUT
            )
            if response.status_code == 200:
                return {"ok": True, "feedback": response.json()}
        else:
            # Get list of feedbacks
            params = {}
            if user_id:
                params["user_id"] = user_id

            response = requests.get(
                f"{settings.REMOTE_API_URL}/api/v1/feedback",
                params=params,
                timeout=settings.REMOTE_API_TIMEOUT
            )
            if response.status_code == 200:
                return {"ok": True, "feedbacks": response.json()}

        return {"ok": False, "message": "Failed to get feedback status"}
    except Exception as e:
        return {"ok": False, "message": f"Error: {str(e)}"}

