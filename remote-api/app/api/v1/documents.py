"""
Documents Management API - Remote API
Quản lý tài liệu trên MinIO (upload, list, delete, download)
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from app.database import get_db
from app.models.user import User
from app.core.security import get_current_admin_user
from app.services.file_service import save_uploaded_file, get_download_url, delete_file, get_file_data
from app.services.minio_service import get_minio_service
from app.config import settings

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = None,
    description: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Upload tài liệu lên MinIO (Admin only)
    """
    if settings.STORAGE_TYPE != "minio":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document management requires MinIO storage"
        )

    try:
        # Generate unique filename
        file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{uuid.uuid4()}.{file_ext}" if file_ext else str(uuid.uuid4())

        # Save to MinIO
        file_path, file_hash, file_size = await save_uploaded_file(
            file,
            subdirectory="documents",
            filename=unique_filename
        )

        # Get download URL
        download_url = get_download_url(file_path.name if hasattr(file_path, 'name') else str(file_path), "documents")

        # Store metadata in database (you might want to create a Document model)
        # For now, return file info
        return {
            "id": str(uuid.uuid4()),
            "filename": file.filename,
            "stored_filename": unique_filename,
            "title": title or file.filename,
            "description": description,
            "category": category,
            "file_size": file_size,
            "file_hash": file_hash,
            "download_url": download_url,
            "uploaded_by": current_user.id,
            "uploaded_at": datetime.utcnow().isoformat(),
            "mime_type": file.content_type
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("/list")
async def list_documents(
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Lấy danh sách tài liệu (Admin only)
    Note: This is a simplified version. In production, you should store metadata in database.
    """
    if settings.STORAGE_TYPE != "minio":
        return {"documents": [], "total": 0}

    try:
        minio_service = get_minio_service()
        bucket_name = settings.MINIO_BUCKET_DOCUMENTS if hasattr(settings, 'MINIO_BUCKET_DOCUMENTS') else "documents"

        # List objects in MinIO
        objects = minio_service.list_objects(bucket_name)

        documents = []
        for obj in objects:
            documents.append({
                "filename": obj.object_name,
                "size": obj.size,
                "last_modified": obj.last_modified.isoformat() if obj.last_modified else None,
                "download_url": get_download_url(obj.object_name, "documents")
            })

        return {
            "documents": documents[skip:skip+limit],
            "total": len(documents)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}"
        )


@router.delete("/{filename}")
async def delete_document(
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Xóa tài liệu (Admin only)
    """
    if settings.STORAGE_TYPE != "minio":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document management requires MinIO storage"
        )

    try:
        success = delete_file(filename, "documents")
        if success:
            return {"message": "Document deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )


@router.get("/download/{filename}")
async def download_document(
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Download tài liệu (Admin only)
    """
    if settings.STORAGE_TYPE != "minio":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document management requires MinIO storage"
        )

    try:
        file_data = get_file_data(filename, "documents")
        from fastapi.responses import Response

        return Response(
            content=file_data,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download document: {str(e)}"
        )

