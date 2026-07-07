from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import Question, QuestionStatus
from app.schemas import GenerateQuizRequest
from app.services.ai_service import generate_questions
from app.repositories.question_repository import create_question


async def generate_quiz_questions(db: Session, request: GenerateQuizRequest):
    if request.question_count > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 questions allowed")

    if not request.notes_text.strip():
        raise HTTPException(status_code=400, detail="Notes text cannot be empty")

    try:
        ai_questions = await generate_questions(
            notes_text=request.notes_text,
            question_count=request.question_count,
            difficulty=request.difficulty.value,
            question_type=request.question_type.value,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    if not ai_questions:
        raise HTTPException(status_code=500, detail="AI returned no valid questions")

    saved = []
    for q_data in ai_questions:
        question = create_question(
            db,
            question_data={
                "quiz_id": request.quiz_id,
                "question_text": q_data.get("question_text"),
                "question_type": q_data.get("question_type", request.question_type.value),
                "option_a": q_data.get("option_a"),
                "option_b": q_data.get("option_b"),
                "option_c": q_data.get("option_c"),
                "option_d": q_data.get("option_d"),
                "correct_answer": q_data.get("correct_answer", "A"),
                "explanation": q_data.get("explanation"),
                "ai_generated": True,
                "status": QuestionStatus.GENERATED,
                "confidence_score": q_data.get("confidence_score"),
                "edited_by_trainer": False,
            },
        )
        saved.append(question)

    return saved
