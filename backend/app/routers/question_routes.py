from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, UserRole
from app.schemas import QuestionResponse, UpdateQuestionRequest
from app.auth import require_role, get_current_user
from app.services.question_service import approve_question as approve_question_service
from app.services.question_service import edit_question as edit_question_service
from app.services.question_service import get_questions_by_quiz_service
from app.services.question_service import regenerate_question as regenerate_question_service
from app.services.question_service import reject_question as reject_question_service

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.get("/quiz/{quiz_id}", response_model=List[QuestionResponse])
def get_questions_by_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_questions_by_quiz_service(db, quiz_id)


@router.patch("/{question_id}/approve", response_model=QuestionResponse)
def approve_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER)),
):
    return approve_question_service(db, question_id)


@router.patch("/{question_id}/reject", response_model=QuestionResponse)
def reject_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER, UserRole.ADMIN)),
):
    return reject_question_service(db, question_id)


@router.put("/{question_id}", response_model=QuestionResponse)
def edit_question(
    question_id: int,
    request: UpdateQuestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER)),
):
    return edit_question_service(db, question_id, request)


@router.post("/{question_id}/regenerate", response_model=QuestionResponse)
async def regenerate_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER)),
):
    return await regenerate_question_service(db, question_id)
