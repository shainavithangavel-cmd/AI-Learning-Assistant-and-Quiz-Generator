from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import User, UserRole
from app.schemas import CreateQuizRequest
from app.repositories.quiz_repository import (
    create_quiz as create_quiz_repo,
    delete_quiz as delete_quiz_repo,
    get_approved_question_count,
    get_quiz_by_id,
    list_quizzes,
    publish_quiz as publish_quiz_repo,
)


def create_quiz(db: Session, request: CreateQuizRequest, current_user: User):
    quiz = create_quiz_repo(
        db,
        quiz_data={
            "topic_id": request.topic_id,
            "quiz_name": request.quiz_name,
            "difficulty": request.difficulty,
            "question_count": request.question_count,
            "time_limit_minutes": request.time_limit_minutes,
            "created_by": current_user.id,
        },
    )
    return quiz


def get_quizzes(db: Session, current_user: User):
    if current_user.role.role_name == UserRole.ADMIN:
        return list_quizzes(db)
    return list_quizzes(db, created_by=current_user.id)


def get_quiz(db: Session, quiz_id: int):
    quiz = get_quiz_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


def publish_quiz(db: Session, quiz_id: int):
    quiz = get_quiz_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    approved = get_approved_question_count(db, quiz_id)
    if approved == 0:
        raise HTTPException(status_code=400, detail="Approve at least one question before publishing")

    return publish_quiz_repo(db, quiz)


def delete_quiz(db: Session, quiz_id: int):
    quiz = get_quiz_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    delete_quiz_repo(db, quiz)
    return None
