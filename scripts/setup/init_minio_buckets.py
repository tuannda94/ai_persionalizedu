"""
Initialize MinIO Buckets
Tạo buckets cần thiết cho installers và packages
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "remote-api"))

from app.services.minio_service import get_minio_service
from app.config import settings

def init_buckets():
    """Initialize MinIO buckets"""
    print("🪣 Initializing MinIO buckets...")

    if settings.STORAGE_TYPE != "minio":
        print("⚠️  STORAGE_TYPE is not 'minio'. Skipping bucket initialization.")
        print(f"   Current STORAGE_TYPE: {settings.STORAGE_TYPE}")
        return

    minio_service = get_minio_service()

    if not minio_service.client:
        print("❌ MinIO client not initialized")
        print("   Check MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY in .env")
        return

    # Buckets will be created automatically by MinIOService.__init__
    # But we can verify they exist
    buckets = [
        (settings.MINIO_BUCKET_INSTALLERS, "App installers"),
        (settings.MINIO_BUCKET_PACKAGES, "Model packages")
    ]

    print("")
    for bucket_name, description in buckets:
        try:
            exists = minio_service.client.bucket_exists(bucket_name)
            if exists:
                print(f"✅ Bucket '{bucket_name}' exists ({description})")
            else:
                print(f"⚠️  Bucket '{bucket_name}' does not exist")
        except Exception as e:
            print(f"❌ Error checking bucket '{bucket_name}': {e}")

    print("")
    print("✅ Bucket initialization complete!")

if __name__ == "__main__":
    init_buckets()

