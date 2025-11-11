"""
Learning Package Update API Endpoints - Local Backend
Xử lý check và update learning packages từ app versions
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.learning_package_service import (
    get_current_learning_package_version,
    install_learning_package,
    get_learning_package_paths
)
from app.services.rag_service import init_rag_engine
from app.config import settings

router = APIRouter(prefix="/learning-package", tags=["learning-package"])


class LearningPackageCheckRequest(BaseModel):
    remote_api_url: Optional[str] = None
    current_version_code: Optional[int] = None


class LearningPackageInstallRequest(BaseModel):
    download_url: str
    version: str
    version_code: int
    package_hash: Optional[str] = None
    manifest: Optional[str] = None


@router.get("/current")
async def get_current_learning_package():
    """
    Lấy thông tin learning package hiện tại đã được cài đặt
    """
    current = get_current_learning_package_version()
    if not current:
        return {
            "ok": True,
            "installed": False,
            "version": None
        }

    paths = get_learning_package_paths(current.get("version"))

    return {
        "ok": True,
        "installed": True,
        "version": current.get("version"),
        "version_code": current.get("version_code"),
        "hash": current.get("hash"),
        "manifest": current.get("manifest"),
        "paths": {
            k: str(v) if v and v.exists() else None
            for k, v in paths.items()
        }
    }


@router.post("/check")
async def check_learning_package_update(
    request: LearningPackageCheckRequest
):
    """
    Check for learning package update từ remote API
    Gọi endpoint /api/v1/updates/check và kiểm tra has_learning_package
    """
    remote_api_url = request.remote_api_url or settings.REMOTE_API_URL

    if not remote_api_url:
        return {
            "ok": False,
            "error": "Remote API URL not configured",
            "has_update": False
        }

    try:
        import requests
        from app.config import settings as app_settings

        # Get current version code
        current_version_code = request.current_version_code
        if not current_version_code:
            current = get_current_learning_package_version()
            current_version_code = current.get("version_code") if current else 0

        # Determine platform
        import platform
        platform_name = "windows" if platform.system() == "Windows" else \
                       "macos" if platform.system() == "Darwin" else "linux"

        # Check for app updates (which may include learning package)
        response = requests.post(
            f"{remote_api_url}/api/v1/updates/check",
            json={
                "platform": platform_name,
                "current_version": "1.0.0",  # Placeholder, not used for learning package check
                "current_version_code": current_version_code
            },
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()

            # Check if latest version has learning package
            has_learning_package = data.get("has_learning_package", False)
            learning_package_url = data.get("learning_package_url")
            learning_package_hash = data.get("learning_package_hash")
            learning_package_size = data.get("learning_package_size")
            learning_package_manifest = data.get("learning_package_manifest")
            latest_version = data.get("latest_version")
            latest_version_code = data.get("latest_version_code")

            # Check if we need to update
            needs_update = False
            if has_learning_package and learning_package_url:
                current = get_current_learning_package_version()
                if not current or current.get("version_code", 0) < latest_version_code:
                    needs_update = True

            return {
                "ok": True,
                "has_update": needs_update,
                "has_learning_package": has_learning_package,
                "learning_package_url": learning_package_url,
                "learning_package_hash": learning_package_hash,
                "learning_package_size": learning_package_size,
                "learning_package_manifest": learning_package_manifest,
                "latest_version": latest_version,
                "latest_version_code": latest_version_code
            }
        else:
            return {
                "ok": False,
                "error": f"Failed to check updates: {response.status_code}",
                "has_update": False
            }

    except Exception as e:
        print(f"⚠️  Error checking for learning package update: {e}")
        import traceback
        traceback.print_exc()
        return {
            "ok": False,
            "error": str(e),
            "has_update": False
        }


@router.post("/install")
async def install_learning_package_endpoint(
    request: LearningPackageInstallRequest,
    background_tasks: BackgroundTasks
):
    """
    Download và install learning package
    Chạy trong background để không block request
    """
    try:
        # Install in background
        def install_task():
            success = install_learning_package(
                request.download_url,
                request.version,
                request.version_code,
                request.package_hash,
                request.manifest
            )
            if success:
                # Reload RAG engine after install
                print("🔄 Reloading RAG engine after learning package install...")
                init_rag_engine()

        background_tasks.add_task(install_task)

        return {
            "ok": True,
            "message": f"Learning package install started: {request.version}",
            "status": "downloading"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start learning package install: {str(e)}"
        )

