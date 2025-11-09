"""
Telemetry API Endpoints - Remote API
Thu thập telemetry data từ student apps
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from datetime import datetime, timedelta

from app.database import get_db
from app.models.telemetry import Telemetry
from app.models.user import User
from app.schemas.telemetry import TelemetryCreate, TelemetryResponse
from app.core.security import get_current_user, get_current_admin_user

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.post("", response_model=TelemetryResponse, status_code=201)
async def create_telemetry(
    telemetry_data: TelemetryCreate,
    db: Session = Depends(get_db)
):
    """
    Gửi telemetry data từ student app
    Không cần authentication (public endpoint)
    """
    telemetry = Telemetry(
        user_id=telemetry_data.user_id if telemetry_data.user_id else None,
        conversation_id=telemetry_data.conversation_id,
        question=telemetry_data.question,
        answer_length=telemetry_data.answer_length,
        used_segments=telemetry_data.used_segments,
        duration_ms=telemetry_data.duration_ms,
        detected_subject=telemetry_data.detected_subject
    )

    db.add(telemetry)
    db.commit()
    db.refresh(telemetry)

    return TelemetryResponse.from_orm(telemetry)


@router.get("/stats", response_model=dict)
async def get_telemetry_stats(
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)  # Admin only
):
    """
    Lấy thống kê telemetry (Admin only)
    """
    from sqlalchemy import func

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Total queries
    total_queries = db.query(func.count(Telemetry.id)).filter(
        Telemetry.timestamp >= cutoff_date
    ).scalar()

    # Average duration
    avg_duration = db.query(func.avg(Telemetry.duration_ms)).filter(
        Telemetry.timestamp >= cutoff_date
    ).scalar() or 0

    # Most used subjects
    subject_stats = (
        db.query(
            Telemetry.detected_subject,
            func.count(Telemetry.id).label('count')
        )
        .filter(Telemetry.timestamp >= cutoff_date)
        .group_by(Telemetry.detected_subject)
        .order_by(desc('count'))
        .limit(10)
        .all()
    )

    return {
        "period_days": days,
        "total_queries": total_queries,
        "average_duration_ms": int(avg_duration),
        "top_subjects": [
            {"subject": subj, "count": cnt}
            for subj, cnt in subject_stats
        ]
    }
