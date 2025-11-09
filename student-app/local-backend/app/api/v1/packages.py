"""
Package Update API Endpoints - Local Backend
Xử lý check và update model packages
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.package_service import (
    check_for_updates,
    update_package,
    get_current_packages
)
from app.services.rag_service import init_rag_engine
from app.config import settings

router = APIRouter(prefix="/packages", tags=["packages"])


class PackageCheckRequest(BaseModel):
    remote_api_url: Optional[str] = None


class PackageUpdateRequest(BaseModel):
    download_url: str
    subject: str
    version: str
    file_hash: Optional[str] = None


@router.get("/current")
async def get_current_packages_list():
    """
    Lấy danh sách packages hiện tại
    """
    packages = get_current_packages()
    return {
        "ok": True,
        "packages": packages,
        "count": len(packages)
    }


@router.post("/check")
async def check_package_updates(
    request: PackageCheckRequest
):
    """
    Check for package updates từ remote API
    """
    remote_api_url = request.remote_api_url or settings.REMOTE_API_URL

    if not remote_api_url:
        return {
            "ok": False,
            "error": "Remote API URL not configured",
            "updates": []
        }

    updates = check_for_updates(remote_api_url)

    return {
        "ok": True,
        "has_updates": len(updates) > 0,
        "updates": updates,
        "count": len(updates)
    }


@router.post("/update")
async def update_package_endpoint(
    request: PackageUpdateRequest,
    background_tasks: BackgroundTasks
):
    """
    Download và update một package
    Chạy trong background để không block request
    """
    try:
        # Update in background
        def update_task():
            success = update_package(
                request.download_url,
                request.subject,
                request.version,
                request.file_hash
            )
            if success:
                # Reload RAG engine after update
                print("🔄 Reloading RAG engine after package update...")
                init_rag_engine()

        background_tasks.add_task(update_task)

        return {
            "ok": True,
            "message": f"Package update started: {request.subject} {request.version}",
            "status": "downloading"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start package update: {str(e)}"
        )


@router.post("/update-all")
async def update_all_packages(
    request: PackageCheckRequest,
    background_tasks: BackgroundTasks
):
    """
    Check và update tất cả packages có update
    """
    remote_api_url = request.remote_api_url or settings.REMOTE_API_URL

    if not remote_api_url:
        raise HTTPException(
            status_code=400,
            detail="Remote API URL not configured"
        )

    # Check for updates
    updates = check_for_updates(remote_api_url)

    if not updates:
        return {
            "ok": True,
            "message": "No updates available",
            "updated_count": 0
        }

    # Update all packages in background
    def update_all_task():
        updated_count = 0
        for pkg in updates:
            success = update_package(
                pkg["download_url"],
                pkg["subject"],
                pkg["version"],
                pkg.get("file_hash")
            )
            if success:
                updated_count += 1

        if updated_count > 0:
            # Reload RAG engine after all updates
            print("🔄 Reloading RAG engine after package updates...")
            init_rag_engine()

    background_tasks.add_task(update_all_task)

    return {
        "ok": True,
        "message": f"Updating {len(updates)} package(s)...",
        "updates_count": len(updates),
        "status": "downloading"
    }

