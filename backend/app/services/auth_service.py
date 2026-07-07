from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.user_repository import get_user_by_email
from app.schemas import LoginRequest, TokenResponse
from app.utils.security import verify_password, create_token


def login(db: Session, request: LoginRequest):
    user = get_user_by_email(db, request.email)

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_token(user.id, user.role.role_name.value)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        role=user.role.role_name.value,
    )
