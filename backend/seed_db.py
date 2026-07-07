"""
Run this script once to seed the database with roles and default users.
Usage: python seed_db.py
"""
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import Role, User, UserRole
from app.utils.security import hash_password

def seed():
    # Create tables if not exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Insert roles
        for role_name in [UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]:
            existing = db.query(Role).filter(Role.role_name == role_name).first()
            if not existing:
                db.add(Role(role_name=role_name))

        db.commit()
        print("✅ Roles seeded")

        # Get role records
        admin_role = db.query(Role).filter(Role.role_name == UserRole.ADMIN).first()
        trainer_role = db.query(Role).filter(Role.role_name == UserRole.TRAINER).first()
        student_role = db.query(Role).filter(Role.role_name == UserRole.STUDENT).first()

        # Default users
        default_users = [
            {
                "name": "Admin User",
                "email": "admin@quizapp.com",
                "password": "admin123",
                "role_id": admin_role.id
            },
            {
                "name": "Sample Trainer",
                "email": "trainer@quizapp.com",
                "password": "trainer123",
                "role_id": trainer_role.id
            },
            {
                "name": "Sample Student",
                "email": "student@quizapp.com",
                "password": "student123",
                "role_id": student_role.id
            }
        ]

        for u_data in default_users:
            existing = db.query(User).filter(User.email == u_data["email"]).first()
            if not existing:
                user = User(
                    name=u_data["name"],
                    email=u_data["email"],
                    password_hash=hash_password(u_data["password"]),
                    role_id=u_data["role_id"]
                )
                db.add(user)
                print(f"✅ Created user: {u_data['email']} / {u_data['password']}")
            else:
                print(f"⚠️  User already exists: {u_data['email']}")

        db.commit()
        print("\n🎉 Seeding complete!")
        print("\nLogin credentials:")
        print("  Admin:   admin@quizapp.com   / admin123")
        print("  Trainer: trainer@quizapp.com / trainer123")
        print("  Student: student@quizapp.com / student123")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
