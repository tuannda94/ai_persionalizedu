"""
Learning Package Service - Local Backend
Xử lý download và install learning packages từ app versions
"""
import os
import json
import zipfile
import hashlib
import shutil
from pathlib import Path
from typing import Optional, Dict, Callable
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.config import settings


# Learning packages directory
LEARNING_PACKAGES_DIR = Path(settings.STORAGE_DIR) / "learning-packages"


def get_current_learning_package_version() -> Optional[Dict]:
    """
    Lấy thông tin learning package hiện tại đã được cài đặt
    Returns: {"version": "1.2.3", "version_code": 10203, "hash": "...", "manifest": {...}}
    """
    version_file = LEARNING_PACKAGES_DIR / "current_version.json"

    if not version_file.exists():
        return None

    try:
        with open(version_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️  Error reading current learning package version: {e}")
        return None


def save_current_learning_package_version(version: str, version_code: int, package_hash: str, manifest: Optional[str] = None):
    """
    Lưu thông tin learning package hiện tại
    """
    LEARNING_PACKAGES_DIR.mkdir(parents=True, exist_ok=True)

    version_info = {
        "version": version,
        "version_code": version_code,
        "hash": package_hash,
        "installed_at": str(Path().cwd()),  # Simple timestamp placeholder
        "manifest": json.loads(manifest) if manifest else None
    }

    version_file = LEARNING_PACKAGES_DIR / "current_version.json"
    with open(version_file, 'w', encoding='utf-8') as f:
        json.dump(version_info, f, indent=2, ensure_ascii=False)


def download_learning_package(
    download_url: str,
    version: str,
    progress_callback: Optional[Callable] = None
) -> Path:
    """
    Download learning package từ remote API

    Args:
        download_url: URL to download package
        version: Version string (e.g., "1.2.3")
        progress_callback: Optional callback(percent, downloaded, total)

    Returns:
        Path to downloaded file
    """
    # Create temp directory
    temp_dir = LEARNING_PACKAGES_DIR / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)

    # Download file
    filename = f"learning-package-{version}.zip"
    file_path = temp_dir / filename

    try:
        # Setup session with retry strategy
        session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        # Download with progress
        response = session.get(download_url, stream=True, timeout=300)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0

        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)

                    if progress_callback and total_size > 0:
                        percent = (downloaded / total_size) * 100
                        progress_callback(percent, downloaded, total_size)

        return file_path

    except Exception as e:
        # Clean up on error
        if file_path.exists():
            file_path.unlink()
        raise Exception(f"Failed to download learning package: {str(e)}")


def verify_package_hash(package_path: Path, expected_hash: str) -> bool:
    """
    Verify learning package file hash

    Args:
        package_path: Path to package file
        expected_hash: Expected SHA-256 hash

    Returns:
        True if hash matches
    """
    if not expected_hash:
        return True  # Skip verification if no hash provided

    sha256_hash = hashlib.sha256()
    with open(package_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)

    actual_hash = sha256_hash.hexdigest()
    return actual_hash.lower() == expected_hash.lower()


def extract_learning_package(package_path: Path, version: str) -> Path:
    """
    Extract learning package to learning-packages directory

    Args:
        package_path: Path to downloaded package file
        version: Version string

    Returns:
        Path to extracted package directory
    """
    target_dir = LEARNING_PACKAGES_DIR / version

    # Backup old version if exists
    old_dir = LEARNING_PACKAGES_DIR / "previous"
    if target_dir.exists():
        if old_dir.exists():
            shutil.rmtree(old_dir)
        shutil.move(str(target_dir), str(old_dir))

    target_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Extract zip file
        if package_path.suffix == '.zip':
            with zipfile.ZipFile(package_path, 'r') as zip_ref:
                zip_ref.extractall(target_dir)
        else:
            raise ValueError(f"Unsupported package format: {package_path.suffix}")

        # Clean up temp file
        package_path.unlink()

        return target_dir

    except Exception as e:
        # Clean up on error
        if target_dir.exists():
            shutil.rmtree(target_dir)
        # Restore old version if extraction failed
        if old_dir.exists():
            shutil.move(str(old_dir), str(target_dir))
        raise Exception(f"Failed to extract learning package: {str(e)}")


def get_learning_package_paths(version: Optional[str] = None) -> Dict[str, Path]:
    """
    Lấy các đường dẫn đến các thành phần của learning package

    Args:
        version: Version string (nếu None, dùng version hiện tại)

    Returns:
        Dict với keys: embeddings, rag_index, config, scripts
    """
    if version is None:
        current = get_current_learning_package_version()
        if not current:
            return {}
        version = current.get("version")

    if not version:
        return {}

    package_dir = LEARNING_PACKAGES_DIR / version

    if not package_dir.exists():
        return {}

    return {
        "embeddings": package_dir / "embeddings",
        "rag_index": package_dir / "rag_index",
        "config": package_dir / "config",
        "scripts": package_dir / "scripts",
        "root": package_dir
    }


def install_learning_package(
    download_url: str,
    version: str,
    version_code: int,
    package_hash: Optional[str] = None,
    manifest: Optional[str] = None,
    progress_callback: Optional[Callable] = None
) -> bool:
    """
    Download và install một learning package

    Returns:
        True if successful
    """
    try:
        print(f"📦 Downloading learning package: {version}")

        # Download
        package_path = download_learning_package(
            download_url,
            version,
            progress_callback
        )

        # Verify hash
        if package_hash:
            if not verify_package_hash(package_path, package_hash):
                package_path.unlink()
                raise Exception("Learning package hash verification failed")

        # Extract
        print(f"📂 Extracting learning package: {version}")
        extract_learning_package(package_path, version)

        # Save version info
        save_current_learning_package_version(version, version_code, package_hash or "", manifest)

        print(f"✅ Learning package installed: {version}")
        return True

    except Exception as e:
        print(f"❌ Failed to install learning package {version}: {e}")
        return False

