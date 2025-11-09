"""
Database Migration Script
Run this script to create model_packages table
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine, Base
from app.models.package import ModelPackage
from app.models.user import User
from app.models.version import AppVersion, UpdateLog
from app.models.telemetry import Telemetry

def run_migration():
    """Create all tables including model_packages"""
    print("🔄 Running database migration...")

    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Migration completed successfully!")
        print("   Created tables:")
        print("   - users")
        print("   - app_versions")
        print("   - update_logs")
        print("   - model_packages")
        print("   - telemetry")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    run_migration()

