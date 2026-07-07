from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import QuestionStatus, UserRole
from app.schemas import UpdateQuestionRequest
from app.repositories.question_repository import (
    create_question,
    get_notes_for_topic,
    get_question_by_id,
    get_questions_by_quiz,
    get_quiz_for_question_regeneration,
    reject_question_for_regeneration,
    update_question_content,
    update_question_status,
)
from app.services.ai_service import generate_questions


def get_questions_by_quiz_service(db: Session, quiz_id: int):
    return get_questions_by_quiz(db, quiz_id)


def approve_question(db: Session, question_id: int):
    question = get_question_by_id(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return update_question_status(db, question, QuestionStatus.APPROVED)


def reject_question(db: Session, question_id: int):
    question = get_question_by_id(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return update_question_status(db, question, QuestionStatus.REJECTED)


def edit_question(db: Session, question_id: int, request: UpdateQuestionRequest):
    question = get_question_by_id(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return update_question_content(db, question, request)


async def regenerate_question(db: Session, question_id: int):
    old_q = get_question_by_id(db, question_id)
    if not old_q:
        raise HTTPException(status_code=404, detail="Question not found")

    quiz = get_quiz_for_question_regeneration(db, old_q.quiz_id)
    notes = get_notes_for_topic(db, quiz.topic_id)
    notes_text = "\n\n".join([n.notes_text for n in notes]) if notes else "General knowledge question"

    try:
        ai_questions = await generate_questions(
            notes_text=notes_text,
            question_count=1,
            difficulty=quiz.difficulty.value,
            question_type=old_q.question_type.value,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI regeneration failed: {str(e)}")

    if not ai_questions:
        raise HTTPException(status_code=500, detail="AI returned no valid question")

    reject_question_for_regeneration(db, old_q)

    q_data = ai_questions[0]
    new_q = create_question(
        db,
        question_data={
            "quiz_id": old_q.quiz_id,
            "question_text": q_data.get("question_text"),
            "question_type": q_data.get("question_type", old_q.question_type.value),
            "option_a": q_data.get("option_a"),
            "option_b": q_data.get("option_b"),
            "option_c": q_data.get("option_c"),
            "option_d": q_data.get("option_d"),
            "correct_answer": q_data.get("correct_answer", "A"),
            "explanation": q_data.get("explanation"),
            "ai_generated": True,
            "status": QuestionStatus.GENERATED,
            "confidence_score": q_data.get("confidence_score"),
            "regenerated_from": question_id,
            "edited_by_trainer": False,
        },
    )
    return new_q
