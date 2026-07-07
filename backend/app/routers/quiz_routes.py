from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, UserRole
from app.schemas import CreateQuizRequest, QuizResponse
from app.auth import require_role, get_current_user
from app.services.quiz_service import create_quiz as create_quiz_service
from app.services.quiz_service import delete_quiz as delete_quiz_service
from app.services.quiz_service import get_quiz as get_quiz_service
from app.services.quiz_service import get_quizzes as get_quizzes_service
from app.services.quiz_service import publish_quiz as publish_quiz_service

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.post("", response_model=QuizResponse, status_code=201)
def create_quiz(
    request: CreateQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER)),
):
    return create_quiz_service(db, request, current_user)


@router.get("", response_model=List[QuizResponse])
def get_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_quizzes_service(db, current_user)


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_quiz_service(db, quiz_id)


@router.patch("/{quiz_id}/publish", response_model=QuizResponse)
def publish_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER)),
):
    return publish_quiz_service(db, quiz_id)


@router.delete("/{quiz_id}", status_code=204)
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER)),
):
    delete_quiz_service(db, quiz_id)
    return None