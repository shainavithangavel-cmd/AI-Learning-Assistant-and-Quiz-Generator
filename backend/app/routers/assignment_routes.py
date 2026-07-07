from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import QuizAssignment, Quiz, User, UserRole
from app.schemas import CreateAssignmentRequest, AssignmentResponse
from app.auth import require_role, get_current_user

router = APIRouter(prefix="/quiz-assignments", tags=["Assignments"])


@router.post("", status_code=201)
def assign_quiz(
    request: CreateAssignmentRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.TRAINER))
):
    # Check quiz exists and is published
    quiz = db.query(Quiz).filter(Quiz.id == request.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.published_at is None:
        raise HTTPException(status_code=400, detail="Quiz must be published before assigning")

    created = []
    for student_id in request.student_ids:
        # Check student exists
        student = db.query(User).filter(User.id == student_id).first()
        if not student:
            continue

        # Avoid duplicate assignments
        existing = db.query(QuizAssignment).filter(
            QuizAssignment.quiz_id == request.quiz_id,
            QuizAssignment.student_id == student_id
        ).first()
        if existing:
            continue

        assignment = QuizAssignment(
            quiz_id=request.quiz_id,
            student_id=student_id
        )
        db.add(assignment)
        created.append(student_id)

    db.commit()
    return {"message": f"Quiz assigned to {len(created)} student(s)", "assigned_to": created}


@router.get("/student/{student_id}")
def get_assignments_for_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assignments = db.query(QuizAssignment).filter(
        QuizAssignment.student_id == student_id
    ).all()

    result = []
    for a in assignments:
        quiz = a.quiz
        # Check if student has already attempted
        from app.models import QuizAttempt
        attempt = db.query(QuizAttempt).filter(
            QuizAttempt.assignment_id == a.id
        ).first()

        result.append({
            "assignment_id": a.id,
            "quiz_id": quiz.id,
            "quiz_name": quiz.quiz_name,
            "difficulty": quiz.difficulty.value,
            "topic_id": quiz.topic_id,
            "assigned_at": a.assigned_at,
            "attempted": attempt is not None,
            "submitted": attempt.submitted_at is not None if attempt else False,
            "attempt_id": attempt.id if attempt else None
        })

    return result


@router.get("/quiz/{quiz_id}")
def get_assignments_for_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER))
):
    assignments = db.query(QuizAssignment).filter(
        QuizAssignment.quiz_id == quiz_id
    ).all()

    result = []
    for a in assignments:
        from app.models import QuizAttempt
        attempt = db.query(QuizAttempt).filter(
            QuizAttempt.assignment_id == a.id,
            QuizAttempt.submitted_at.isnot(None)
        ).first()

        result.append({
            "assignment_id": a.id,
            "student_id": a.student_id,
            "student_name": a.student.name,
            "student_email": a.student.email,
            "assigned_at": a.assigned_at,
            "submitted": attempt is not None,
            "score": attempt.score if attempt else None,
            "total_questions": attempt.total_questions if attempt else None,
            "attempt_id": attempt.id if attempt else None   # NEW - needed to view details
        })

    return result