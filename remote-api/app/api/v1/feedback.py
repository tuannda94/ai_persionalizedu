"""
Feedback API Endpoints - Remote API
Thu thập và quản lý feedback từ student apps
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
from typing import Optional, List
from datetime import datetime, timedelta

from app.database import get_db
from app.models.feedback import Feedback, FeedbackStatus, FeedbackType
from app.models.user import User
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackUpdate,
    FeedbackResponse,
    FeedbackListResponse
)
from app.core.security import get_current_user, get_current_admin_user, get_optional_user

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    feedback_data: FeedbackCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Tạo feedback mới (tự động hoặc manual)
    Không cần authentication (public endpoint)
    """
    # Get optional user from request
    current_user = await get_optional_user(request, db)

    # Validate feedback type
    try:
        feedback_type = FeedbackType(feedback_data.type)
    except ValueError:
        feedback_type = FeedbackType.AUTO

    # Auto-detect platform nếu không có
    platform = feedback_data.platform
    if not platform:
        # Có thể detect từ user agent hoặc request headers
        platform = "unknown"

    # Tạo feedback
    feedback = Feedback(
        user_id=current_user.id if current_user else None,
        type=feedback_type,
        category=feedback_data.category,
        title=feedback_data.title or f"{feedback_type.value.title()} - {feedback_data.category or 'General'}",
        message=feedback_data.message,
        app_version=feedback_data.app_version,
        platform=platform,
        conversation_id=feedback_data.conversation_id,
        error_code=feedback_data.error_code,
        error_details=feedback_data.error_details,
        priority=feedback_data.priority or 3,
        status=FeedbackStatus.PENDING
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return FeedbackResponse.from_orm(feedback)


@router.get("", response_model=FeedbackListResponse)
async def list_feedback(
    status_filter: Optional[str] = Query(None, alias="status"),
    type_filter: Optional[str] = Query(None, alias="type"),
    category_filter: Optional[str] = Query(None, alias="category"),
    priority_min: Optional[int] = Query(None, ge=1, le=5),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Require auth
):
    """
    Lấy danh sách feedback (user chỉ xem feedback của mình, admin xem tất cả)
    """
    query = db.query(Feedback)

    # User chỉ xem feedback của mình, admin xem tất cả
    if current_user.role != "admin":
        query = query.filter(Feedback.user_id == current_user.id)

    # Filters
    if status_filter:
        try:
            status_enum = FeedbackStatus(status_filter)
            query = query.filter(Feedback.status == status_enum)
        except ValueError:
            pass

    if type_filter:
        try:
            type_enum = FeedbackType(type_filter)
            query = query.filter(Feedback.type == type_enum)
        except ValueError:
            pass

    if category_filter:
        query = query.filter(Feedback.category == category_filter)

    if priority_min:
        query = query.filter(Feedback.priority <= priority_min)

    # Count total
    total = query.count()

    # Pagination
    items = (
        query
        .order_by(desc(Feedback.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    total_pages = (total + page_size - 1) // page_size

    return FeedbackListResponse(
        items=[FeedbackResponse.from_orm(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(
    feedback_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Require auth
):
    """
    Lấy chi tiết feedback
    User chỉ xem feedback của mình, admin xem tất cả
    """
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )

    # Check permission
    if current_user.role != "admin" and feedback.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this feedback"
        )

    return FeedbackResponse.from_orm(feedback)


@router.put("/{feedback_id}", response_model=FeedbackResponse)
async def update_feedback(
    feedback_id: str,
    feedback_update: FeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)  # Admin only
):
    """
    Cập nhật feedback (Admin only)
    Dùng để xử lý feedback: assign, change status, add notes, resolution
    """
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )

    # Update status
    if feedback_update.status:
        try:
            feedback.status = FeedbackStatus(feedback_update.status)
            if feedback.status == FeedbackStatus.RESOLVED and not feedback.resolved_at:
                feedback.resolved_at = datetime.utcnow()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {feedback_update.status}"
            )

    # Update priority
    if feedback_update.priority is not None:
        feedback.priority = feedback_update.priority

    # Update assigned_to
    if feedback_update.assigned_to is not None:
        if feedback_update.assigned_to:
            # Verify user exists
            assignee = db.query(User).filter(User.id == feedback_update.assigned_to).first()
            if not assignee:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Assignee user not found"
                )
            feedback.assigned_to = assignee.id
        else:
            feedback.assigned_to = None

    # Update admin notes
    if feedback_update.admin_notes is not None:
        feedback.admin_notes = feedback_update.admin_notes

    # Update resolution
    if feedback_update.resolution is not None:
        feedback.resolution = feedback_update.resolution
        if feedback_update.resolution and not feedback.resolved_at:
            feedback.resolved_at = datetime.utcnow()

    feedback.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(feedback)

    return FeedbackResponse.from_orm(feedback)


@router.get("/stats/summary", response_model=dict)
async def get_feedback_stats(
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)  # Admin only
):
    """
    Lấy thống kê feedback (Admin only)
    """
    from sqlalchemy import func

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Total feedback
    total = db.query(func.count(Feedback.id)).filter(
        Feedback.created_at >= cutoff_date
    ).scalar()

    # By status
    status_stats = (
        db.query(
            Feedback.status,
            func.count(Feedback.id).label('count')
        )
        .filter(Feedback.created_at >= cutoff_date)
        .group_by(Feedback.status)
        .all()
    )

    # By type
    type_stats = (
        db.query(
            Feedback.type,
            func.count(Feedback.id).label('count')
        )
        .filter(Feedback.created_at >= cutoff_date)
        .group_by(Feedback.type)
        .all()
    )

    # By priority
    priority_stats = (
        db.query(
            Feedback.priority,
            func.count(Feedback.id).label('count')
        )
        .filter(Feedback.created_at >= cutoff_date)
        .group_by(Feedback.priority)
        .all()
    )

    return {
        "period_days": days,
        "total": total,
        "by_status": {
            status.value: count for status, count in status_stats
        },
        "by_type": {
            type.value: count for type, count in type_stats
        },
        "by_priority": {
            priority: count for priority, count in priority_stats
        }
    }

