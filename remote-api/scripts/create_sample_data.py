#!/usr/bin/env python3
"""
Script để tạo dữ liệu mẫu cho admin-dashboard
Tạo 5 bản ghi cho mỗi loại: Users, Versions, Packages, Feedback, Telemetry
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
import uuid
import hashlib

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.version import AppVersion
from app.models.package import ModelPackage
from app.models.feedback import Feedback, FeedbackType, FeedbackStatus
from app.models.telemetry import Telemetry
from app.core.security import get_password_hash

# Create tables if not exist
Base.metadata.create_all(bind=engine)

def create_sample_users(db: Session):
    """Tạo 5 users mẫu"""
    print("📝 Creating sample users...")

    users_data = [
        {
            "email": "admin@fpt.edu.vn",
            "password": "admin123",
            "full_name": "Admin User",
            "student_id": None,
            "role": "admin",
            "is_active": True
        },
        {
            "email": "student1@fpt.edu.vn",
            "password": "student123",
            "full_name": "Nguyễn Văn A",
            "student_id": "SE12345",
            "role": "student",
            "is_active": True
        },
        {
            "email": "student2@fpt.edu.vn",
            "password": "student123",
            "full_name": "Trần Thị B",
            "student_id": "SE12346",
            "role": "student",
            "is_active": True
        },
        {
            "email": "student3@fpt.edu.vn",
            "password": "student123",
            "full_name": "Lê Văn C",
            "student_id": "SE12347",
            "role": "student",
            "is_active": True
        },
        {
            "email": "student4@fpt.edu.vn",
            "password": "student123",
            "full_name": "Phạm Thị D",
            "student_id": "SE12348",
            "role": "student",
            "is_active": False  # Inactive user
        }
    ]

    created_users = []
    for user_data in users_data:
        # Check if user exists
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            print(f"  ⚠️  User {user_data['email']} already exists, skipping...")
            created_users.append(existing)
            continue

        user = User(
            email=user_data["email"],
            password_hash=get_password_hash(user_data["password"]),
            full_name=user_data["full_name"],
            student_id=user_data["student_id"],
            role=user_data["role"],
            is_active=user_data["is_active"],
            created_at=datetime.utcnow() - timedelta(days=30)
        )
        db.add(user)
        created_users.append(user)
        print(f"  ✅ Created user: {user_data['email']}")

    db.commit()
    return created_users


def create_sample_versions(db: Session, admin_user: User):
    """Tạo 5 app versions mẫu"""
    print("📝 Creating sample app versions...")

    versions_data = [
        {
            "version": "1.0.0",
            "version_code": 10000,
            "platform": "windows",
            "release_type": "stable",
            "download_url": "https://example.com/downloads/app-v1.0.0-windows.exe",
            "release_notes": "Initial release with basic features",
            "file_size": 52428800,  # 50 MB
            "file_hash": "a" * 64,  # Dummy hash
            "is_mandatory": False,
            "published_at": datetime.utcnow() - timedelta(days=60),
            "has_learning_package": False
        },
        {
            "version": "1.1.0",
            "version_code": 10100,
            "platform": "windows",
            "release_type": "stable",
            "download_url": "https://example.com/downloads/app-v1.1.0-windows.exe",
            "release_notes": "Bug fixes and performance improvements",
            "file_size": 52428800,
            "file_hash": "b" * 64,
            "is_mandatory": False,
            "published_at": datetime.utcnow() - timedelta(days=30),
            "has_learning_package": True,
            "learning_package_url": "https://example.com/downloads/learning-package-v1.1.0.zip",
            "learning_package_hash": "c" * 64,
            "learning_package_size": 104857600,  # 100 MB
            "learning_package_manifest": '{"version": "1.1.0", "description": "Initial learning package", "contents": {"embeddings": {}, "rag_index": {}, "config": {}}}'
        },
        {
            "version": "1.2.0",
            "version_code": 10200,
            "platform": "macos",
            "release_type": "stable",
            "download_url": "https://example.com/downloads/app-v1.2.0-macos.dmg",
            "release_notes": "New features: File upload, improved UI",
            "file_size": 62914560,  # 60 MB
            "file_hash": "d" * 64,
            "is_mandatory": True,
            "min_version_code": 10000,
            "published_at": datetime.utcnow() - timedelta(days=15),
            "has_learning_package": True,
            "learning_package_url": "https://example.com/downloads/learning-package-v1.2.0.zip",
            "learning_package_hash": "e" * 64,
            "learning_package_size": 157286400,  # 150 MB
            "learning_package_manifest": '{"version": "1.2.0", "description": "Updated learning package with new embeddings", "contents": {"embeddings": {"path": "embeddings/data.bin"}, "rag_index": {"path": "rag_index/chroma_db"}}}'
        },
        {
            "version": "1.2.1",
            "version_code": 10201,
            "platform": "linux",
            "release_type": "beta",
            "download_url": "https://example.com/downloads/app-v1.2.1-linux.AppImage",
            "release_notes": "Beta release for Linux platform",
            "file_size": 73400320,  # 70 MB
            "file_hash": "f" * 64,
            "is_mandatory": False,
            "published_at": datetime.utcnow() - timedelta(days=5),
            "has_learning_package": False
        },
        {
            "version": "2.0.0",
            "version_code": 20000,
            "platform": "windows",
            "release_type": "alpha",
            "download_url": "https://example.com/downloads/app-v2.0.0-windows.exe",
            "release_notes": "Alpha release - Major UI overhaul",
            "file_size": 83886080,  # 80 MB
            "file_hash": "g" * 64,
            "is_mandatory": False,
            "published_at": None,  # Not published yet
            "has_learning_package": True,
            "learning_package_url": "https://example.com/downloads/learning-package-v2.0.0.zip",
            "learning_package_hash": "h" * 64,
            "learning_package_size": 209715200,  # 200 MB
            "learning_package_manifest": '{"version": "2.0.0", "description": "Major update with new RAG index", "contents": {"embeddings": {}, "rag_index": {}, "config": {}, "scripts": {}}}'
        }
    ]

    created_versions = []
    for version_data in versions_data:
        # Check if version exists
        existing = db.query(AppVersion).filter(
            AppVersion.version == version_data["version"],
            AppVersion.platform == version_data["platform"]
        ).first()
        if existing:
            print(f"  ⚠️  Version {version_data['version']} ({version_data['platform']}) already exists, skipping...")
            created_versions.append(existing)
            continue

        version = AppVersion(
            version=version_data["version"],
            version_code=version_data["version_code"],
            platform=version_data["platform"],
            release_type=version_data["release_type"],
            download_url=version_data["download_url"],
            release_notes=version_data["release_notes"],
            file_size=version_data["file_size"],
            file_hash=version_data["file_hash"],
            is_mandatory=version_data.get("is_mandatory", False),
            min_version_code=version_data.get("min_version_code"),
            published_at=version_data.get("published_at"),
            published_by=admin_user.id if version_data.get("published_at") else None,
            has_learning_package=version_data.get("has_learning_package", False),
            learning_package_url=version_data.get("learning_package_url"),
            learning_package_hash=version_data.get("learning_package_hash"),
            learning_package_size=version_data.get("learning_package_size"),
            learning_package_manifest=version_data.get("learning_package_manifest"),
            created_at=datetime.utcnow() - timedelta(days=90)
        )
        db.add(version)
        created_versions.append(version)
        print(f"  ✅ Created version: {version_data['version']} ({version_data['platform']})")

    db.commit()
    return created_versions


def create_sample_packages(db: Session, admin_user: User):
    """Tạo 5 model packages mẫu"""
    print("📝 Creating sample model packages...")

    packages_data = [
        {
            "subject": "CS101",
            "version": "v1",
            "file_path": "/storage/packages/CS101_v1.zip",
            "file_size": 52428800,  # 50 MB
            "file_hash": "i" * 64,
            "download_url": "https://example.com/downloads/packages/CS101_v1.zip",
            "description": "Introduction to Computer Science - Basic concepts and fundamentals",
            "is_active": True,
            "published_at": datetime.utcnow() - timedelta(days=45)
        },
        {
            "subject": "CS102",
            "version": "v1",
            "file_path": "/storage/packages/CS102_v1.zip",
            "file_size": 62914560,  # 60 MB
            "file_hash": "j" * 64,
            "download_url": "https://example.com/downloads/packages/CS102_v1.zip",
            "description": "Data Structures and Algorithms - Arrays, lists, trees, sorting",
            "is_active": True,
            "published_at": datetime.utcnow() - timedelta(days=40)
        },
        {
            "subject": "PHP1",
            "version": "v1",
            "file_path": "/storage/packages/PHP1_v1.zip",
            "file_size": 41943040,  # 40 MB
            "file_hash": "k" * 64,
            "download_url": "https://example.com/downloads/packages/PHP1_v1.zip",
            "description": "Programming Fundamentals - Variables, functions, control structures",
            "is_active": True,
            "published_at": datetime.utcnow() - timedelta(days=35)
        },
        {
            "subject": "PHP2",
            "version": "v2",
            "file_path": "/storage/packages/PHP2_v2.zip",
            "file_size": 73400320,  # 70 MB
            "file_hash": "l" * 64,
            "download_url": "https://example.com/downloads/packages/PHP2_v2.zip",
            "description": "Advanced Programming - OOP, design patterns, best practices (Updated)",
            "is_active": True,
            "published_at": datetime.utcnow() - timedelta(days=20)
        },
        {
            "subject": "CS201",
            "version": "v1",
            "file_path": "/storage/packages/CS201_v1.zip",
            "file_size": 83886080,  # 80 MB
            "file_hash": "m" * 64,
            "download_url": "https://example.com/downloads/packages/CS201_v1.zip",
            "description": "Database Systems - SQL, normalization, database design",
            "is_active": False,  # Inactive package
            "published_at": datetime.utcnow() - timedelta(days=10)
        }
    ]

    created_packages = []
    for package_data in packages_data:
        # Check if package exists
        existing = db.query(ModelPackage).filter(
            ModelPackage.subject == package_data["subject"],
            ModelPackage.version == package_data["version"]
        ).first()
        if existing:
            print(f"  ⚠️  Package {package_data['subject']} {package_data['version']} already exists, skipping...")
            created_packages.append(existing)
            continue

        package = ModelPackage(
            subject=package_data["subject"],
            version=package_data["version"],
            file_path=package_data["file_path"],
            file_size=package_data["file_size"],
            file_hash=package_data["file_hash"],
            download_url=package_data["download_url"],
            description=package_data["description"],
            is_active=package_data["is_active"],
            published_at=package_data.get("published_at"),
            published_by=admin_user.id if package_data.get("published_at") else None,
            created_at=datetime.utcnow() - timedelta(days=60)
        )
        db.add(package)
        created_packages.append(package)
        print(f"  ✅ Created package: {package_data['subject']} {package_data['version']}")

    db.commit()
    return created_packages


def create_sample_feedback(db: Session, users: list[User]):
    """Tạo 5 feedback mẫu"""
    print("📝 Creating sample feedback...")

    feedback_data = [
        {
            "user_id": users[1].id if len(users) > 1 else None,  # student1
            "type": FeedbackType.BUG,
            "category": "chat",
            "title": "App crashes when sending long messages",
            "message": "Khi tôi gửi tin nhắn dài hơn 1000 ký tự, ứng dụng bị crash. Đã xảy ra 3 lần.",
            "app_version": "1.1.0",
            "platform": "windows",
            "priority": 2,  # High
            "status": FeedbackStatus.PENDING,
            "created_at": datetime.utcnow() - timedelta(days=5)
        },
        {
            "user_id": users[2].id if len(users) > 2 else None,  # student2
            "type": FeedbackType.FEATURE,
            "category": "ui",
            "title": "Request: Dark mode support",
            "message": "Có thể thêm chế độ dark mode không? Mắt tôi bị mỏi khi dùng lâu.",
            "app_version": "1.2.0",
            "platform": "macos",
            "priority": 4,  # Low
            "status": FeedbackStatus.REVIEWING,
            "assigned_to": users[0].id if len(users) > 0 else None,  # admin
            "admin_notes": "Đang xem xét, có thể implement trong version 2.0",
            "created_at": datetime.utcnow() - timedelta(days=10)
        },
        {
            "user_id": users[1].id if len(users) > 1 else None,  # student1
            "type": FeedbackType.BUG,
            "category": "update",
            "title": "Update failed on macOS",
            "message": "Khi cố gắng update từ 1.0.0 lên 1.2.0, quá trình download bị lỗi ở 50%.",
            "app_version": "1.0.0",
            "platform": "macos",
            "priority": 1,  # Critical
            "status": FeedbackStatus.RESOLVED,
            "assigned_to": users[0].id if len(users) > 0 else None,  # admin
            "resolution": "Đã fix trong version 1.2.1. Vui lòng thử lại.",
            "resolved_at": datetime.utcnow() - timedelta(days=2),
            "created_at": datetime.utcnow() - timedelta(days=15)
        },
        {
            "user_id": None,  # Anonymous
            "type": FeedbackType.AUTO,
            "category": "performance",
            "title": "Slow response time",
            "message": "Phản hồi từ AI hơi chậm, mất khoảng 10-15 giây mỗi câu hỏi.",
            "app_version": "1.1.0",
            "platform": "windows",
            "priority": 3,  # Medium
            "status": FeedbackStatus.PENDING,
            "created_at": datetime.utcnow() - timedelta(days=3)
        },
        {
            "user_id": users[3].id if len(users) > 3 else None,  # student3
            "type": FeedbackType.FEATURE,
            "category": "chat",
            "title": "Suggestion: Export conversation history",
            "message": "Có thể thêm tính năng export lịch sử chat ra file PDF hoặc text không?",
            "app_version": "1.2.0",
            "platform": "windows",
            "priority": 4,  # Low
            "status": FeedbackStatus.PENDING,
            "created_at": datetime.utcnow() - timedelta(days=1)
        }
    ]

    created_feedback = []
    for fb_data in feedback_data:
        feedback = Feedback(
            user_id=fb_data.get("user_id"),
            type=fb_data["type"],
            category=fb_data["category"],
            title=fb_data["title"],
            message=fb_data["message"],
            app_version=fb_data.get("app_version"),
            platform=fb_data.get("platform"),
            priority=fb_data.get("priority", 3),
            status=fb_data["status"],
            assigned_to=fb_data.get("assigned_to"),
            admin_notes=fb_data.get("admin_notes"),
            resolution=fb_data.get("resolution"),
            resolved_at=fb_data.get("resolved_at"),
            created_at=fb_data.get("created_at", datetime.utcnow())
        )
        db.add(feedback)
        created_feedback.append(feedback)
        print(f"  ✅ Created feedback: {fb_data['title']}")

    db.commit()
    return created_feedback


def create_sample_telemetry(db: Session, users: list[User]):
    """Tạo 5 telemetry records mẫu"""
    print("📝 Creating sample telemetry records...")

    telemetry_data = [
        {
            "user_id": users[1].id if len(users) > 1 else None,  # student1
            "conversation_id": f"conv_{uuid.uuid4().hex[:8]}",
            "question": "What is a variable in programming?",
            "answer_length": 450,
            "used_segments": 3,
            "duration_ms": 1250,
            "detected_subject": "PHP1",
            "timestamp": datetime.utcnow() - timedelta(hours=2)
        },
        {
            "user_id": users[2].id if len(users) > 2 else None,  # student2
            "conversation_id": f"conv_{uuid.uuid4().hex[:8]}",
            "question": "Explain binary search algorithm",
            "answer_length": 680,
            "used_segments": 5,
            "duration_ms": 2100,
            "detected_subject": "CS102",
            "timestamp": datetime.utcnow() - timedelta(hours=5)
        },
        {
            "user_id": users[1].id if len(users) > 1 else None,  # student1
            "conversation_id": f"conv_{uuid.uuid4().hex[:8]}",
            "question": "How to normalize a database?",
            "answer_length": 520,
            "used_segments": 4,
            "duration_ms": 1800,
            "detected_subject": "CS201",
            "timestamp": datetime.utcnow() - timedelta(days=1)
        },
        {
            "user_id": users[3].id if len(users) > 3 else None,  # student3
            "conversation_id": f"conv_{uuid.uuid4().hex[:8]}",
            "question": "What is object-oriented programming?",
            "answer_length": 380,
            "used_segments": 2,
            "duration_ms": 950,
            "detected_subject": "PHP2",
            "timestamp": datetime.utcnow() - timedelta(days=2)
        },
        {
            "user_id": None,  # Anonymous
            "conversation_id": f"conv_{uuid.uuid4().hex[:8]}",
            "question": "Introduction to computer science basics",
            "answer_length": 600,
            "used_segments": 4,
            "duration_ms": 1500,
            "detected_subject": "CS101",
            "timestamp": datetime.utcnow() - timedelta(days=3)
        }
    ]

    created_telemetry = []
    for tel_data in telemetry_data:
        telemetry = Telemetry(
            user_id=tel_data.get("user_id"),
            conversation_id=tel_data.get("conversation_id"),
            question=tel_data["question"],
            answer_length=tel_data.get("answer_length"),
            used_segments=tel_data.get("used_segments"),
            duration_ms=tel_data["duration_ms"],
            detected_subject=tel_data.get("detected_subject"),
            timestamp=tel_data.get("timestamp", datetime.utcnow())
        )
        db.add(telemetry)
        created_telemetry.append(telemetry)
        print(f"  ✅ Created telemetry: {tel_data['question'][:50]}...")

    db.commit()
    return created_telemetry


def main():
    """Main function"""
    print("🚀 Starting sample data creation...")
    print("=" * 60)

    db = SessionLocal()
    try:
        # 1. Create users (including admin)
        users = create_sample_users(db)
        admin_user = next((u for u in users if u.role == "admin"), users[0] if users else None)
        print()

        # 2. Create versions
        versions = create_sample_versions(db, admin_user)
        print()

        # 3. Create packages
        packages = create_sample_packages(db, admin_user)
        print()

        # 4. Create feedback
        feedback = create_sample_feedback(db, users)
        print()

        # 5. Create telemetry
        telemetry = create_sample_telemetry(db, users)
        print()

        print("=" * 60)
        print("✅ Sample data creation completed!")
        print(f"   - Users: {len(users)}")
        print(f"   - Versions: {len(versions)}")
        print(f"   - Packages: {len(packages)}")
        print(f"   - Feedback: {len(feedback)}")
        print(f"   - Telemetry: {len(telemetry)}")
        print()
        print("📝 Login credentials:")
        print("   Admin: admin@fpt.edu.vn / admin123")
        print("   Student: student1@fpt.edu.vn / student123")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()

