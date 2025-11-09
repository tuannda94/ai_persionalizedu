"""
File Download API Endpoints - Remote API
Xử lý download files (installers, model packages)
Hỗ trợ cả local storage và MinIO
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import get_current_user
from app.services.file_service import get_file_path, get_file_data
from app.config import settings

router = APIRouter(prefix="/files", tags=["files"])


def get_media_type(filename: str) -> str:
    """Determine media type from filename"""
    if filename.endswith('.exe') or filename.endswith('.msi'):
        return 'application/x-msdownload'
    elif filename.endswith('.dmg'):
        return 'application/x-apple-diskimage'
    elif filename.endswith('.deb'):
        return 'application/vnd.debian.binary-package'
    elif filename.endswith('.AppImage'):
        return 'application/x-executable'
    elif filename.endswith('.zip') or filename.endswith('.tar.gz'):
        return 'application/zip'
    else:
        return 'application/octet-stream'


@router.get("/download/{subdirectory}/{filename}")
async def download_file(
    subdirectory: str,
    filename: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Optional auth
):
    """
    Download file (installer or package)
    Hỗ trợ cả local storage và MinIO

    Args:
        subdirectory: "installers" or "packages"
        filename: Name of the file (or object name for MinIO)
    """
    # Validate subdirectory
    if subdirectory not in ["installers", "packages"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subdirectory. Must be: installers or packages"
        )

    try:
        if settings.STORAGE_TYPE == "minio":
            # Download from MinIO
            file_data = get_file_data(filename, subdirectory)
            media_type = get_media_type(filename)

            return Response(
                content=file_data,
                media_type=media_type,
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"'
                }
            )
        else:
            # Download from local storage
            file_path = get_file_path(filename, subdirectory)
            media_type = get_media_type(filename)

            return FileResponse(
                path=str(file_path),
                filename=filename,
                media_type=media_type
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download file: {str(e)}"
        )

