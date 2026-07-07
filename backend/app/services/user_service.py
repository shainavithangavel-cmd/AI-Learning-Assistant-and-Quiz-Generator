from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models import User, UserRole
from app.schemas import CreateUserRequest, UserResponse
from app.repositories.user_repository import (
    create_user as create_user_repo,
    delete_user as delete_user_repo,
    get_all_users as get_all_users_repo,
    get_role_by_name,
    get_user_by_email,
    get_user_by_id,
)
from app.utils.security import hash_password


def get_all_users(db: Session, role: str | None = None, current_user=None):
    users = get_all_users_repo(db, role_name=role)
    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role.role_name.value,
            created_at=u.created_at,
        )
        for u in users
    ]


def create_user(db: Session, request: CreateUserRequest):
    existing = get_user_by_email(db, request.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = get_role_by_name(db, request.role)
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = create_user_repo(
        db,
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password),
        role_id=role.id,
    )
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.role_name.value,
        created_at=user.created_at,
    )


def delete_user(db: Session, user_id: int, current_user: User):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    delete_user_repo(db, user)
    return None
