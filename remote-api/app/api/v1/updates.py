"""
Update Management API Endpoints - Remote API
Quản lý versions và update checks
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.version import AppVersion, UpdateLog
from app.models.user import User
from app.schemas.version import (
    VersionCheckRequest,
    VersionCheckResponse,
    VersionCreate,
    VersionUpdate,
    VersionResponse,
    UpdateLogCreate,
    UpdateLogResponse
)
from app.core.security import get_current_user, get_current_admin_user

router = APIRouter(prefix="/updates", tags=["updates"])


@router.post("/check", response_model=VersionCheckResponse)
async def check_for_updates(
    request: VersionCheckRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)  # Optional
):
    """
    Kiểm tra có bản cập nhật mới không
    Có thể gọi không cần authentication
    """
    # Tìm version mới nhất cho platform này
    latest_version = (
        db.query(AppVersion)
        .filter(
            AppVersion.platform == request.platform,
            AppVersion.published_at.isnot(None)
        )
        .order_by(desc(AppVersion.version_code))
        .first()
    )

    if not latest_version:
        return VersionCheckResponse(has_update=False)

    # So sánh version code
    if latest_version.version_code <= request.current_version_code:
        return VersionCheckResponse(has_update=False)

    # Kiểm tra mandatory update
    is_mandatory = latest_version.is_mandatory
    if latest_version.min_version_code:
        is_mandatory = is_mandatory or (request.current_version_code < latest_version.min_version_code)

    return VersionCheckResponse(
        has_update=True,
        latest_version=latest_version.version,
        latest_version_code=latest_version.version_code,
        download_url=latest_version.download_url,
        is_mandatory=is_mandatory,
        release_notes=latest_version.release_notes,
        file_size=latest_version.file_size,
        file_hash=latest_version.file_hash
    )


@router.get("/versions", response_model=List[VersionResponse])
async def list_versions(
    platform: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)  # Optional
):
    """
    Lấy danh sách các versions (có thể filter theo platform)
    """
    query = db.query(AppVersion)

    if platform:
        query = query.filter(AppVersion.platform == platform)

    versions = query.order_by(desc(AppVersion.version_code)).all()
    return [VersionResponse.from_orm(v) for v in versions]


@router.post("/log", response_model=UpdateLogResponse)
async def log_update(
    log_data: UpdateLogCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)  # Optional
):
    """
    Ghi log quá trình update
    """
    update_log = UpdateLog(
        user_id=current_user.id if current_user else None,
        from_version=log_data.from_version,
        to_version=log_data.to_version,
        platform=log_data.platform,
        status=log_data.status,
        error_message=log_data.error_message
    )

    db.add(update_log)
    db.commit()
    db.refresh(update_log)

    return UpdateLogResponse.from_orm(update_log)


# ============================================
# Admin Endpoints
# ============================================

@router.post("/admin/versions", response_model=VersionResponse, status_code=status.HTTP_201_CREATED)
async def create_version(
    version_data: VersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Tạo version mới (Admin only)
    """
    # Kiểm tra version code đã tồn tại chưa
    existing = db.query(AppVersion).filter(
        AppVersion.version_code == version_data.version_code
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Version code already exists"
        )

    version = AppVersion(
        version=version_data.version,
        version_code=version_data.version_code,
        platform=version_data.platform,
        release_type=version_data.release_type,
        download_url=version_data.download_url,
        release_notes=version_data.release_notes,
        file_size=version_data.file_size,
        file_hash=version_data.file_hash,
        is_mandatory=version_data.is_mandatory,
        min_version_code=version_data.min_version_code,
        published_by=current_user.id
    )

    db.add(version)
    db.commit()
    db.refresh(version)

    return VersionResponse.from_orm(version)


@router.post("/admin/versions/upload", response_model=VersionResponse, status_code=status.HTTP_201_CREATED)
async def upload_version(
    file: UploadFile = File(...),
    version: str = Form(...),
    version_code: int = Form(...),
    platform: str = Form(...),
    release_type: str = Form("stable"),
    release_notes: Optional[str] = Form(None),
    is_mandatory: bool = Form(False),
    min_version_code: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Upload installer file và tạo version mới (Admin only)
    """
    # Validate platform
    if platform not in ["windows", "macos", "linux"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid platform. Must be: windows, macos, or linux"
        )

    # Validate release_type
    if release_type not in ["stable", "beta", "alpha"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid release_type. Must be: stable, beta, or alpha"
        )

    # Check if version code already exists
    existing = db.query(AppVersion).filter(
        AppVersion.version_code == version_code
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Version code already exists"
        )

    # Save uploaded file
    # For local storage: returns Path object as string
    # For MinIO: returns object_name (e.g., "installers/windows-1.0.0-installer.exe")
    try:
        file_path_or_object, file_hash, file_size = await save_uploaded_file(
            file,
            subdirectory="installers",
            filename=f"{platform}-{version}-{file.filename}"
        )

        # Generate download URL
        # For MinIO: file_path_or_object is already "installers/filename"
        # For local: extract filename from path
        if settings.STORAGE_TYPE == "minio":
            # Object name format: "installers/filename"
            download_url = get_download_url(file_path_or_object, "installers", use_presigned=True)
        else:
            # Local storage: file_path_or_object is a Path string
            from pathlib import Path
            file_path = Path(file_path_or_object)
            download_url = get_download_url(file_path.name, "installers")

        # Create version record
        version_obj = AppVersion(
            version=version,
            version_code=version_code,
            platform=platform,
            release_type=release_type,
            download_url=download_url,
            release_notes=release_notes,
            file_size=file_size,
            file_hash=file_hash,
            is_mandatory=is_mandatory,
            min_version_code=min_version_code,
            published_by=current_user.id,
            published_at=datetime.utcnow()  # Auto-publish on upload
        )

        db.add(version_obj)
        db.commit()
        db.refresh(version_obj)

        return VersionResponse.from_orm(version_obj)

    except Exception as e:
        # Clean up file if version creation fails (only for local storage)
        if settings.STORAGE_TYPE == "local":
            if 'file_path_or_object' in locals():
                from pathlib import Path
                file_path = Path(file_path_or_object)
                if file_path.exists():
                    file_path.unlink()
        # For MinIO, deletion would be handled by MinIO service if needed
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload version: {str(e)}"
        )


@router.put("/admin/versions/{version_id}", response_model=VersionResponse)
async def update_version(
    version_id: str,
    version_data: VersionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Cập nhật version (Admin only)
    """
    version = db.query(AppVersion).filter(AppVersion.id == version_id).first()

    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found"
        )

    if version_data.release_notes is not None:
        version.release_notes = version_data.release_notes
    if version_data.is_mandatory is not None:
        version.is_mandatory = version_data.is_mandatory
    if version_data.published_at is not None:
        version.published_at = version_data.published_at

    db.commit()
    db.refresh(version)

    return VersionResponse.from_orm(version)


@router.get("/admin/logs", response_model=List[UpdateLogResponse])
async def get_update_logs(
    user_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Lấy danh sách update logs (Admin only)
    """
    query = db.query(UpdateLog)

    if user_id:
        query = query.filter(UpdateLog.user_id == user_id)
    if status_filter:
        query = query.filter(UpdateLog.status == status_filter)

    logs = query.order_by(desc(UpdateLog.started_at)).limit(limit).all()
    return [UpdateLogResponse.from_orm(log) for log in logs]
