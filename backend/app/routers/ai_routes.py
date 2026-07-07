from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Question, User, UserRole, QuestionStatus, QuestionType
from app.schemas import GenerateQuizRequest, QuestionResponse
from app.auth import require_role
from app.services.ai_service import generate_questions

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/generate-quiz", response_model=List[QuestionResponse])
async def generate_quiz_questions(
    request: GenerateQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER, UserRole.ADMIN))
):
    """
    Call groq AI to generate quiz questions from notes.
    Validates the output and saves to DB with GENERATED status.
    """
    if request.question_count > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 questions allowed")

    if not request.notes_text.strip():
        raise HTTPException(status_code=400, detail="Notes text cannot be empty")

    try:
        ai_questions = await generate_questions(
            notes_text=request.notes_text,
            question_count=request.question_count,
            difficulty=request.difficulty.value,
            question_type=request.question_type.value
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    if not ai_questions:
        raise HTTPException(status_code=500, detail="AI returned no valid questions")

    # Save all generated questions to database
    saved = []
    for q_data in ai_questions:
        question = Question(
            quiz_id=request.quiz_id,
            question_text=q_data.get("question_text"),
            question_type=q_data.get("question_type", request.question_type.value),
            option_a=q_data.get("option_a"),
            option_b=q_data.get("option_b"),
            option_c=q_data.get("option_c"),
            option_d=q_data.get("option_d"),
            correct_answer=q_data.get("correct_answer", "A"),
            explanation=q_data.get("explanation"),
            ai_generated=True,
            status=QuestionStatus.GENERATED,
            confidence_score=q_data.get("confidence_score"),
            edited_by_trainer=False
        )
        db.add(question)
        saved.append(question)

    db.commit()
    for q in saved:
        db.refresh(q)

    return saved
