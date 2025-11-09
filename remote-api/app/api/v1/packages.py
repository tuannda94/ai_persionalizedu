"""
Model Package Management API Endpoints - Remote API
Quản lý RAG model packages
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.package import ModelPackage
from app.models.user import User
from app.schemas.package import (
    PackageResponse,
    PackageCreate,
    PackageUpdate,
    PackageCheckRequest,
    PackageCheckResponse
)
from app.core.security import get_current_user, get_current_admin_user
from app.services.file_service import save_uploaded_file, get_download_url, delete_file

router = APIRouter(prefix="/packages", tags=["packages"])


@router.post("/check", response_model=PackageCheckResponse)
async def check_for_package_updates(
    request: PackageCheckRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)  # Optional
):
    """
    Kiểm tra có package updates mới không
    So sánh current_packages với packages trên server
    """
    updates = []

    for current_pkg in request.current_packages:
        subject = current_pkg.get("subject")
        current_version = current_pkg.get("version", "v1")

        if not subject:
            continue

        # Tìm package mới nhất cho subject này
        latest_package = (
            db.query(ModelPackage)
            .filter(
                ModelPackage.subject == subject,
                ModelPackage.is_active == True,
                ModelPackage.published_at.isnot(None)
            )
            .order_by(desc(ModelPackage.created_at))
            .first()
        )

        if not latest_package:
            continue

        # So sánh version (đơn giản: v1 < v2 < v3)
        # Extract number from version string
        def version_to_int(v):
            try:
                return int(v.replace('v', '').replace('V', ''))
            except:
                return 0

        current_v = version_to_int(current_version)
        latest_v = version_to_int(latest_package.version)

        if latest_v > current_v:
            updates.append(PackageResponse.from_orm(latest_package))

    return PackageCheckResponse(
        has_updates=len(updates) > 0,
        updates=updates
    )


@router.get("/list", response_model=List[PackageResponse])
async def list_packages(
    subject: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)  # Optional
):
    """
    Lấy danh sách packages (có thể filter theo subject, is_active)
    """
    query = db.query(ModelPackage)

    if subject:
        query = query.filter(ModelPackage.subject == subject)
    if is_active is not None:
        query = query.filter(ModelPackage.is_active == is_active)

    packages = query.order_by(desc(ModelPackage.created_at)).all()
    return [PackageResponse.from_orm(pkg) for pkg in packages]


@router.get("/{package_id}", response_model=PackageResponse)
async def get_package(
    package_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)  # Optional
):
    """
    Lấy thông tin một package
    """
    package = db.query(ModelPackage).filter(ModelPackage.id == package_id).first()

    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )

    return PackageResponse.from_orm(package)


# ============================================
# Admin Endpoints
# ============================================

@router.post("/admin/upload", response_model=PackageResponse, status_code=status.HTTP_201_CREATED)
async def upload_package(
    file: UploadFile = File(...),
    manifest: Optional[UploadFile] = File(None),
    subject: str = Form(...),
    version: str = Form(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Upload model package (zip/tar.gz) và manifest.json (Admin only)
    """
    # Validate subject and version
    if not subject or not version:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject and version are required"
        )

    # Check if package already exists
    existing = db.query(ModelPackage).filter(
        ModelPackage.subject == subject,
        ModelPackage.version == version
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Package {subject} {version} already exists"
        )

    # Save package file
    # For local storage: returns Path object as string
    # For MinIO: returns object_name (e.g., "packages/CS101_v1_package.zip")
    try:
        package_path_or_object, package_hash, package_size = await save_uploaded_file(
            file,
            subdirectory="packages",
            filename=f"{subject}_{version}_{file.filename}"
        )

        # Save manifest if provided
        manifest_path = None
        if manifest:
            manifest_path_or_object, _, _ = await save_uploaded_file(
                manifest,
                subdirectory="packages",
                filename=f"{subject}_{version}_manifest.json"
            )
            manifest_path = manifest_path_or_object

        # Generate download URL
        # For MinIO: package_path_or_object is already "packages/filename"
        # For local: extract filename from path
        if settings.STORAGE_TYPE == "minio":
            download_url = get_download_url(package_path_or_object, "packages", use_presigned=True)
        else:
            from pathlib import Path
            package_path = Path(package_path_or_object)
            download_url = get_download_url(package_path.name, "packages")

        # Create package record
        # file_path stores either local path or MinIO object name
        package_obj = ModelPackage(
            subject=subject,
            version=version,
            file_path=package_path_or_object,  # Path string or MinIO object name
            file_size=package_size,
            file_hash=package_hash,
            manifest_path=manifest_path,
            download_url=download_url,
            description=description,
            is_active=True,
            published_by=current_user.id,
            published_at=datetime.utcnow()  # Auto-publish on upload
        )

        db.add(package_obj)
        db.commit()
        db.refresh(package_obj)

        return PackageResponse.from_orm(package_obj)

    except Exception as e:
        # Clean up files if package creation fails (only for local storage)
        if settings.STORAGE_TYPE == "local":
            if 'package_path_or_object' in locals():
                from pathlib import Path
                package_path = Path(package_path_or_object)
                if package_path.exists():
                    package_path.unlink()
            if 'manifest_path' in locals() and manifest_path:
                from pathlib import Path
                manifest_path_obj = Path(manifest_path)
                if manifest_path_obj.exists():
                    manifest_path_obj.unlink()
        # For MinIO, deletion would be handled by MinIO service if needed
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload package: {str(e)}"
        )


@router.put("/admin/{package_id}", response_model=PackageResponse)
async def update_package(
    package_id: str,
    package_data: PackageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Cập nhật package (Admin only)
    """
    package = db.query(ModelPackage).filter(ModelPackage.id == package_id).first()

    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )

    if package_data.description is not None:
        package.description = package_data.description
    if package_data.is_active is not None:
        package.is_active = package_data.is_active
    if package_data.published_at is not None:
        package.published_at = package_data.published_at

    db.commit()
    db.refresh(package)

    return PackageResponse.from_orm(package)


@router.delete("/admin/{package_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_package(
    package_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Xóa package (Admin only)
    """
    package = db.query(ModelPackage).filter(ModelPackage.id == package_id).first()

    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )

    # Delete file from storage
    try:
        if package.file_path:
            if settings.STORAGE_TYPE == "minio":
                # For MinIO: file_path is object name (e.g., "packages/CS101_v1.zip")
                # Extract subdirectory and filename
                if "/" in package.file_path:
                    parts = package.file_path.split("/", 1)
                    subdirectory = parts[0]  # "packages" or "installers"
                    filename = parts[1] if len(parts) > 1 else package.file_path
                else:
                    subdirectory = "packages"
                    filename = package.file_path
                delete_file(filename, subdirectory)

                # Delete manifest if exists
                if package.manifest_path:
                    if "/" in package.manifest_path:
                        parts = package.manifest_path.split("/", 1)
                        subdirectory = parts[0]
                        manifest_filename = parts[1] if len(parts) > 1 else package.manifest_path
                    else:
                        subdirectory = "packages"
                        manifest_filename = package.manifest_path
                    delete_file(manifest_filename, subdirectory)
            else:
                # For local storage: file_path is actual file path
                from pathlib import Path
                file_path = Path(package.file_path)
                if file_path.exists():
                    file_path.unlink()
                if package.manifest_path:
                    manifest_path = Path(package.manifest_path)
                    if manifest_path.exists():
                        manifest_path.unlink()
    except Exception as e:
        print(f"Warning: Failed to delete package files: {e}")

    db.delete(package)
    db.commit()

    return None

