from sqlalchemy.orm import Session
from app.models import QuizAssignment, QuizAttempt


def get_assignment_by_id(db: Session, assignment_id: int):
    return db.query(QuizAssignment).filter(QuizAssignment.id == assignment_id).first()


def get_assignments_for_student(db: Session, student_id: int):
    return db.query(QuizAssignment).filter(QuizAssignment.student_id == student_id).all()


def get_assignments_for_quiz(db: Session, quiz_id: int):
    return db.query(QuizAssignment).filter(QuizAssignment.quiz_id == quiz_id).all()


def create_assignment(db: Session, *, quiz_id: int, student_id: int):
    assignment = QuizAssignment(quiz_id=quiz_id, student_id=student_id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def get_existing_assignment(db: Session, quiz_id: int, student_id: int):
    return (
        db.query(QuizAssignment)
        .filter(QuizAssignment.quiz_id == quiz_id, QuizAssignment.student_id == student_id)
        .first()
    )


def get_attempt_for_assignment(db: Session, assignment_id: int):
    return db.query(QuizAttempt).filter(QuizAttempt.assignment_id == assignment_id).first()


def get_submitted_attempt_for_assignment(db: Session, assignment_id: int):
    return (
        db.query(QuizAttempt)
        .filter(QuizAttempt.assignment_id == assignment_id, QuizAttempt.submitted_at.isnot(None))
        .first()
    )
