from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import Quiz, User, UserRole, QuizAssignment, QuizAttempt
from app.schemas import CreateAssignmentRequest
from app.repositories.assignment_repository import (
    create_assignment,
    get_assignment_by_id,
    get_assignments_for_quiz,
    get_assignments_for_student,
    get_existing_assignment,
    get_submitted_attempt_for_assignment,
    get_attempt_for_assignment,
)
from app.repositories.user_repository import get_user_by_id
from app.repositories.quiz_repository import get_quiz_by_id


def assign_quiz(db: Session, request: CreateAssignmentRequest):
    quiz = get_quiz_by_id(db, request.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.published_at is None:
        raise HTTPException(status_code=400, detail="Quiz must be published before assigning")

    created = []
    for student_id in request.student_ids:
        student = get_user_by_id(db, student_id)
        if not student:
            continue

        existing = get_existing_assignment(db, request.quiz_id, student_id)
        if existing:
            continue

        create_assignment(db, quiz_id=request.quiz_id, student_id=student_id)
        created.append(student_id)

    return {"message": f"Quiz assigned to {len(created)} student(s)", "assigned_to": created}


def get_assignments_for_student_service(db: Session, student_id: int):
    assignments = get_assignments_for_student(db, student_id)
    result = []
    for a in assignments:
        quiz = a.quiz
        attempt = get_attempt_for_assignment(db, a.id)
        result.append(
            {
                "assignment_id": a.id,
                "quiz_id": quiz.id,
                "quiz_name": quiz.quiz_name,
                "difficulty": quiz.difficulty.value,
                "topic_id": quiz.topic_id,
                "assigned_at": a.assigned_at,
                "attempted": attempt is not None,
                "submitted": attempt.submitted_at is not None if attempt else False,
                "attempt_id": attempt.id if attempt else None,
            }
        )
    return result


def get_assignments_for_quiz_service(db: Session, quiz_id: int):
    assignments = get_assignments_for_quiz(db, quiz_id)
    result = []
    for a in assignments:
        attempt = get_submitted_attempt_for_assignment(db, a.id)
        result.append(
            {
                "assignment_id": a.id,
                "student_id": a.student_id,
                "student_name": a.student.name,
                "student_email": a.student.email,
                "assigned_at": a.assigned_at,
                "submitted": attempt is not None,
                "score": attempt.score if attempt else None,
                "total_questions": attempt.total_questions if attempt else None,
                "attempt_id": attempt.id if attempt else None,
            }
        )
    return result
