from sqlalchemy.orm import Session
from app.models import User, Role, UserRole


def get_all_users(db: Session, role_name: str | None = None):
    query = db.query(User)
    if role_name:
        query = query.join(Role).filter(Role.role_name == role_name)
    return query.all()


def get_user_by_email(db: Session, email):
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def get_role_by_name(db: Session, role_name):
    return db.query(Role).filter(Role.role_name == role_name).first()


def create_user(db: Session, *, name: str, email: str, password_hash: str, role_id: int):
    user = User(
        name=name,
        email=email,
        password_hash=password_hash,
        role_id=role_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user):
    db.delete(user)
    db.commit()
