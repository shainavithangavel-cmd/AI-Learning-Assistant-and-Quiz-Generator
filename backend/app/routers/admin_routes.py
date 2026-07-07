from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List      #for type hinting the response model
from app.database import get_db
from app.models import User, Role, UserRole #This imports database models
from app.schemas import CreateUserRequest, UserResponse 
from app.utils.security import hash_password
from app.auth import require_role, get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    role: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # allow any logged in user
):
    query = db.query(User)
    if role:
        query = query.join(Role).filter(Role.role_name == role)
    users = query.all()

    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role.role_name.value,
            created_at=u.created_at
        )
        for u in users
    ]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    request: CreateUserRequest, #If required fields are missing, FastAPI automatically gives validation error.
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = db.query(Role).filter(Role.role_name == request.role).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = User(
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password),
        role_id=role.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.role_name.value,
        created_at=user.created_at
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    db.delete(user)
    db.commit()
