"""
Package Update Service - Local Backend
Xử lý download và update model packages từ remote API
"""
import os
import json
import zipfile
import tarfile
import hashlib
import shutil
from pathlib import Path
from typing import Optional, List, Dict
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.config import settings


# Model packages directory
MODEL_PACKAGES_DIR = Path(settings.MODEL_PACKAGES_DIR)


def get_current_packages() -> List[Dict[str, str]]:
    """
    Lấy danh sách packages hiện tại từ local storage
    Returns: [{"subject": "CS101", "version": "v1"}, ...]
    """
    packages = []

    if not MODEL_PACKAGES_DIR.exists():
        return packages

    # Scan for package directories (format: {subject}_v{version})
    for pkg_dir in MODEL_PACKAGES_DIR.iterdir():
        if not pkg_dir.is_dir():
            continue

        name = pkg_dir.name
        # Parse: CS101_v1 -> subject=CS101, version=v1
        if '_v' in name:
            parts = name.rsplit('_v', 1)
            if len(parts) == 2:
                subject = parts[0]
                version = f"v{parts[1]}"
                packages.append({
                    "subject": subject,
                    "version": version
                })

    return packages


def check_for_updates(remote_api_url: str) -> List[Dict]:
    """
    Check for package updates từ remote API

    Returns:
        List of packages that need updating
    """
    if not remote_api_url:
        return []

    try:
        current_packages = get_current_packages()

        response = requests.post(
            f"{remote_api_url}/api/v1/packages/check",
            json={"current_packages": current_packages},
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            return data.get("updates", [])
        else:
            print(f"⚠️  Failed to check for package updates: {response.status_code}")
            return []

    except Exception as e:
        print(f"⚠️  Error checking for package updates: {e}")
        return []


def download_package(
    download_url: str,
    subject: str,
    version: str,
    progress_callback: Optional[Callable] = None
) -> Path:
    """
    Download package từ remote API

    Args:
        download_url: URL to download package
        subject: Subject code (e.g., CS101)
        version: Version (e.g., v1)
        progress_callback: Optional callback(percent, downloaded, total)

    Returns:
        Path to downloaded file
    """
    # Create temp directory
    temp_dir = MODEL_PACKAGES_DIR / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)

    # Download file
    filename = f"{subject}_{version}.zip"
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
        raise Exception(f"Failed to download package: {str(e)}")


def extract_package(package_path: Path, subject: str, version: str) -> Path:
    """
    Extract package to model-packages directory

    Args:
        package_path: Path to downloaded package file
        subject: Subject code
        version: Version

    Returns:
        Path to extracted package directory
    """
    target_dir = MODEL_PACKAGES_DIR / f"{subject}_{version}"

    # Remove old version if exists
    if target_dir.exists():
        shutil.rmtree(target_dir)

    target_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Extract based on file extension
        if package_path.suffix == '.zip':
            with zipfile.ZipFile(package_path, 'r') as zip_ref:
                zip_ref.extractall(target_dir)
        elif package_path.suffix in ['.tar', '.gz', '.tar.gz']:
            with tarfile.open(package_path, 'r:*') as tar_ref:
                tar_ref.extractall(target_dir)
        else:
            raise ValueError(f"Unsupported package format: {package_path.suffix}")

        # Clean up temp file
        package_path.unlink()

        return target_dir

    except Exception as e:
        # Clean up on error
        if target_dir.exists():
            shutil.rmtree(target_dir)
        raise Exception(f"Failed to extract package: {str(e)}")


def verify_package_hash(package_path: Path, expected_hash: str) -> bool:
    """
    Verify package file hash

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


def update_package(
    download_url: str,
    subject: str,
    version: str,
    file_hash: Optional[str] = None,
    progress_callback: Optional[Callable] = None
) -> bool:
    """
    Download và update một package

    Returns:
        True if successful
    """
    try:
        print(f"📦 Downloading package: {subject} {version}")

        # Download
        package_path = download_package(
            download_url,
            subject,
            version,
            progress_callback
        )

        # Verify hash
        if file_hash:
            if not verify_package_hash(package_path, file_hash):
                package_path.unlink()
                raise Exception("Package hash verification failed")

        # Extract
        print(f"📂 Extracting package: {subject} {version}")
        extract_package(package_path, subject, version)

        print(f"✅ Package updated: {subject} {version}")
        return True

    except Exception as e:
        print(f"❌ Failed to update package {subject} {version}: {e}")
        return False

