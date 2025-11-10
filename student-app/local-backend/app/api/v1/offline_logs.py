"""
Offline Logs API - Local Backend
Quản lý offline logs và sync với remote API
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.offline_logger import get_offline_logger

router = APIRouter(prefix="/offline-logs", tags=["offline-logs"])


class LogRequest(BaseModel):
    log_type: str
    data: Dict[str, Any]


@router.post("")
async def create_log(log_req: LogRequest):
    """
    Tạo một log entry (sẽ được sync lên server khi có mạng)
    """
    logger = get_offline_logger()
    success = logger.log(log_req.log_type, log_req.data)

    if success:
        return {"message": "Log created successfully", "synced": False}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create log"
        )


@router.get("/count")
async def get_pending_logs_count():
    """
    Lấy số lượng logs chưa được sync
    """
    logger = get_offline_logger()
    count = logger.get_pending_logs_count()
    return {"count": count}


@router.post("/sync")
async def sync_logs():
    """
    Thủ công sync logs lên server (nếu có mạng)
    """
    logger = get_offline_logger()
    synced_count = logger.sync_logs()
    return {
        "message": f"Synced {synced_count} logs",
        "synced_count": synced_count
    }

