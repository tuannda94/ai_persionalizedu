"""
File Service - Remote API
Xử lý upload, storage và download của files (installers, model packages)
Hỗ trợ cả local storage và MinIO (S3-compatible)
"""
import os
import hashlib
import shutil
from pathlib import Path
from typing import Optional, Tuple, BinaryIO
from fastapi import UploadFile, HTTPException, status
import io

from app.config import settings
from app.services.minio_service import get_minio_service


# Storage directories (for local storage)
STORAGE_ROOT = Path(settings.STORAGE_ROOT) if hasattr(settings, 'STORAGE_ROOT') else Path("storage")
INSTALLERS_DIR = STORAGE_ROOT / "installers"
PACKAGES_DIR = STORAGE_ROOT / "packages"

# Create directories if not exist (for local storage)
if settings.STORAGE_TYPE == "local":
    INSTALLERS_DIR.mkdir(parents=True, exist_ok=True)
    PACKAGES_DIR.mkdir(parents=True, exist_ok=True)


def calculate_file_hash(file_data: bytes) -> str:
    """Calculate SHA-256 hash of file data"""
    sha256_hash = hashlib.sha256()
    sha256_hash.update(file_data)
    return sha256_hash.hexdigest()


async def save_uploaded_file(
    upload_file: UploadFile,
    subdirectory: str,
    filename: Optional[str] = None
) -> Tuple[str, str, int]:
    """
    Save uploaded file to storage (local or MinIO)

    Args:
        upload_file: FastAPI UploadFile
        subdirectory: "installers" or "packages"
        filename: Optional custom filename

    Returns:
        (file_path_or_object_name, file_hash, file_size)
        - For local: returns file_path as string
        - For MinIO: returns object_name (path in bucket)
    """
    # Read file content
    content = await upload_file.read()
    file_size = len(content)

    # Calculate hash
    file_hash = calculate_file_hash(content)

    # Determine filename
    if not filename:
        filename = upload_file.filename

    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )

    # Sanitize filename
    filename = filename.replace("..", "").replace("/", "_").replace("\\", "_")

    # Save based on storage type
    if settings.STORAGE_TYPE == "minio":
        # Use MinIO
        minio_service = get_minio_service()

        if not minio_service.client:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="MinIO client not available"
            )

        # Determine bucket
        if subdirectory == "installers":
            bucket = settings.MINIO_BUCKET_INSTALLERS
        elif subdirectory == "packages":
            bucket = settings.MINIO_BUCKET_PACKAGES
        else:
            raise ValueError(f"Invalid subdirectory: {subdirectory}")

        # Upload to MinIO
        object_name = f"{subdirectory}/{filename}"
        file_io = io.BytesIO(content)

        try:
            minio_service.upload_file(
                file_io,
                bucket,
                object_name,
                content_type=upload_file.content_type or "application/octet-stream",
                metadata={"original_filename": upload_file.filename, "hash": file_hash}
            )
            return object_name, file_hash, file_size
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload to MinIO: {str(e)}"
            )

    else:
        # Use local storage
        if subdirectory == "installers":
            storage_dir = INSTALLERS_DIR
        elif subdirectory == "packages":
            storage_dir = PACKAGES_DIR
        else:
            raise ValueError(f"Invalid subdirectory: {subdirectory}")

        file_path = storage_dir / filename

        try:
            with open(file_path, "wb") as f:
                f.write(content)

            return str(file_path), file_hash, file_size

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file: {str(e)}"
            )


def get_download_url(filename: str, subdirectory: str, use_presigned: bool = True) -> str:
    """
    Generate download URL for a file

    Args:
        filename: Name of the file (or object name for MinIO)
        subdirectory: "installers" or "packages"
        use_presigned: Use presigned URL for MinIO (default True)

    Returns:
        Download URL
    """
    if settings.STORAGE_TYPE == "minio":
        minio_service = get_minio_service()

        if not minio_service.client:
            # Fallback to API endpoint
            return f"{settings.BASE_URL}/api/v1/files/download/{subdirectory}/{filename}"

        # Determine bucket
        if subdirectory == "installers":
            bucket = settings.MINIO_BUCKET_INSTALLERS
        elif subdirectory == "packages":
            bucket = settings.MINIO_BUCKET_PACKAGES
        else:
            raise ValueError(f"Invalid subdirectory: {subdirectory}")

        # Use object name directly if it's already a path
        object_name = filename if "/" in filename else f"{subdirectory}/{filename}"

        if use_presigned:
            try:
                # Generate presigned URL (valid for 1 hour)
                return minio_service.get_file_url(bucket, object_name, expires_seconds=3600)
            except Exception as e:
                print(f"⚠️  Failed to generate presigned URL: {e}")
                # Fallback to API endpoint
                return f"{settings.BASE_URL}/api/v1/files/download/{subdirectory}/{filename}"
        else:
            # Use API endpoint (will proxy to MinIO)
            return f"{settings.BASE_URL}/api/v1/files/download/{subdirectory}/{filename}"

    else:
        # Local storage - use API endpoint
        return f"{settings.BASE_URL}/api/v1/files/download/{subdirectory}/{filename}"


def get_file_path(filename: str, subdirectory: str) -> Path:
    """
    Get file path for download (local storage only)

    Args:
        filename: Name of the file
        subdirectory: "installers" or "packages"

    Returns:
        Path to the file
    """
    if settings.STORAGE_TYPE == "minio":
        raise ValueError("get_file_path() is for local storage only. Use get_file_data() for MinIO.")

    if subdirectory == "installers":
        storage_dir = INSTALLERS_DIR
    elif subdirectory == "packages":
        storage_dir = PACKAGES_DIR
    else:
        raise ValueError(f"Invalid subdirectory: {subdirectory}")

    file_path = storage_dir / filename

    # Security: prevent directory traversal
    if not file_path.resolve().is_relative_to(storage_dir.resolve()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid file path"
        )

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return file_path


def get_file_data(filename: str, subdirectory: str) -> bytes:
    """
    Get file data (works for both local and MinIO)

    Args:
        filename: Name of the file (or object name for MinIO)
        subdirectory: "installers" or "packages"

    Returns:
        File content as bytes
    """
    if settings.STORAGE_TYPE == "minio":
        minio_service = get_minio_service()

        if not minio_service.client:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="MinIO client not available"
            )

        # Determine bucket
        if subdirectory == "installers":
            bucket = settings.MINIO_BUCKET_INSTALLERS
        elif subdirectory == "packages":
            bucket = settings.MINIO_BUCKET_PACKAGES
        else:
            raise ValueError(f"Invalid subdirectory: {subdirectory}")

        # Use object name directly if it's already a path
        object_name = filename if "/" in filename else f"{subdirectory}/{filename}"

        try:
            return minio_service.download_file(bucket, object_name)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found in MinIO: {str(e)}"
            )

    else:
        # Local storage
        file_path = get_file_path(filename, subdirectory)
        with open(file_path, "rb") as f:
            return f.read()


def delete_file(filename: str, subdirectory: str) -> bool:
    """
    Delete a file from storage

    Returns:
        True if deleted, False if not found
    """
    if settings.STORAGE_TYPE == "minio":
        minio_service = get_minio_service()

        if not minio_service.client:
            return False

        # Determine bucket
        if subdirectory == "installers":
            bucket = settings.MINIO_BUCKET_INSTALLERS
        elif subdirectory == "packages":
            bucket = settings.MINIO_BUCKET_PACKAGES
        else:
            raise ValueError(f"Invalid subdirectory: {subdirectory}")

        # Use object name directly if it's already a path
        object_name = filename if "/" in filename else f"{subdirectory}/{filename}"

        return minio_service.delete_file(bucket, object_name)

    else:
        # Local storage
        try:
            file_path = get_file_path(filename, subdirectory)
            file_path.unlink()
            return True
        except HTTPException as e:
            if e.status_code == 404:
                return False
            raise
