"""
MinIO Service - Remote API
Quản lý object storage với MinIO (S3-compatible)
"""
from minio import Minio
from minio.error import S3Error
from minio.commonconfig import Tags
from typing import Optional, BinaryIO
import hashlib
from pathlib import Path

from app.config import settings


class MinIOService:
    """Service để quản lý MinIO storage"""

    def __init__(self):
        """Initialize MinIO client"""
        self.client = None
        self.bucket_installers = settings.MINIO_BUCKET_INSTALLERS
        self.bucket_packages = settings.MINIO_BUCKET_PACKAGES

        if settings.STORAGE_TYPE == "minio":
            try:
                self.client = Minio(
                    settings.MINIO_ENDPOINT,
                    access_key=settings.MINIO_ACCESS_KEY,
                    secret_key=settings.MINIO_SECRET_KEY,
                    secure=settings.MINIO_SECURE
                )
                self._ensure_buckets()
            except Exception as e:
                print(f"⚠️  Failed to initialize MinIO: {e}")
                print("   Falling back to local storage")
                self.client = None

    def _ensure_buckets(self):
        """Đảm bảo buckets tồn tại"""
        if not self.client:
            return

        buckets = [self.bucket_installers, self.bucket_packages]
        for bucket in buckets:
            try:
                if not self.client.bucket_exists(bucket):
                    self.client.make_bucket(bucket)
                    print(f"✅ Created MinIO bucket: {bucket}")
            except S3Error as e:
                print(f"⚠️  Error creating bucket {bucket}: {e}")

    def upload_file(
        self,
        file_data: BinaryIO,
        bucket: str,
        object_name: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[dict] = None
    ) -> str:
        """
        Upload file to MinIO

        Args:
            file_data: File-like object
            bucket: Bucket name
            object_name: Object name (path in bucket)
            content_type: Content type
            metadata: Optional metadata dict

        Returns:
            Object name (for download URL)
        """
        if not self.client:
            raise ValueError("MinIO client not initialized")

        try:
            # Reset file pointer
            file_data.seek(0)

            # Get file size
            file_data.seek(0, 2)  # Seek to end
            file_size = file_data.tell()
            file_data.seek(0)  # Reset to start

            # Upload
            self.client.put_object(
                bucket,
                object_name,
                file_data,
                file_size,
                content_type=content_type,
                metadata=metadata or {}
            )

            return object_name

        except S3Error as e:
            raise Exception(f"Failed to upload to MinIO: {e}")

    def download_file(self, bucket: str, object_name: str) -> bytes:
        """
        Download file from MinIO

        Returns:
            File content as bytes
        """
        if not self.client:
            raise ValueError("MinIO client not initialized")

        try:
            response = self.client.get_object(bucket, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data

        except S3Error as e:
            raise Exception(f"Failed to download from MinIO: {e}")

    def delete_file(self, bucket: str, object_name: str) -> bool:
        """
        Delete file from MinIO

        Returns:
            True if deleted
        """
        if not self.client:
            raise ValueError("MinIO client not initialized")

        try:
            self.client.remove_object(bucket, object_name)
            return True
        except S3Error as e:
            print(f"⚠️  Failed to delete from MinIO: {e}")
            return False

    def get_file_url(self, bucket: str, object_name: str, expires_seconds: int = 3600) -> str:
        """
        Generate presigned URL for file download

        Args:
            bucket: Bucket name
            object_name: Object name
            expires_seconds: URL expiration time (default 1 hour)

        Returns:
            Presigned URL
        """
        if not self.client:
            raise ValueError("MinIO client not initialized")

        try:
            from datetime import timedelta
            url = self.client.presigned_get_object(
                bucket,
                object_name,
                expires=timedelta(seconds=expires_seconds)
            )
            return url
        except S3Error as e:
            raise Exception(f"Failed to generate presigned URL: {e}")

    def file_exists(self, bucket: str, object_name: str) -> bool:
        """Check if file exists in MinIO"""
        if not self.client:
            return False

        try:
            self.client.stat_object(bucket, object_name)
            return True
        except S3Error:
            return False

    def list_files(self, bucket: str, prefix: str = "") -> list:
        """List files in bucket with prefix"""
        if not self.client:
            return []

        try:
            objects = self.client.list_objects(bucket, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except S3Error as e:
            print(f"⚠️  Failed to list files: {e}")
            return []


# Global MinIO service instance
_minio_service: Optional[MinIOService] = None


def get_minio_service() -> MinIOService:
    """Get MinIO service instance (singleton)"""
    global _minio_service
    if _minio_service is None:
        _minio_service = MinIOService()
    return _minio_service

