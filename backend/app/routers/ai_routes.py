from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, UserRole
from app.schemas import GenerateQuizRequest, QuestionResponse
from app.auth import require_role
from app.services.ai_generation_service import generate_quiz_questions as generate_quiz_questions_service

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/generate-quiz", response_model=List[QuestionResponse])
async def generate_quiz_questions(
    request: GenerateQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER, UserRole.ADMIN)),
):
    return await generate_quiz_questions_service(db, request)
