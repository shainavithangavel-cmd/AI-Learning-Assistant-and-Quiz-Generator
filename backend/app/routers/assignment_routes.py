from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole
from app.schemas import CreateAssignmentRequest
from app.auth import require_role, get_current_user
from app.services.assignment_service import assign_quiz as assign_quiz_service
from app.services.assignment_service import get_assignments_for_quiz_service, get_assignments_for_student_service

router = APIRouter(prefix="/quiz-assignments", tags=["Assignments"])


@router.post("", status_code=201)
def assign_quiz(
    request: CreateAssignmentRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.TRAINER)),
):
    return assign_quiz_service(db, request)


@router.get("/student/{student_id}")
def get_assignments_for_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_assignments_for_student_service(db, student_id)


@router.get("/quiz/{quiz_id}")
def get_assignments_for_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER)),
):
    return get_assignments_for_quiz_service(db, quiz_id)