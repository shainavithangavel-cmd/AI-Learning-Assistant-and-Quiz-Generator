from datetime import datetime
from sqlalchemy.orm import Session
from app.models import QuizAttempt, QuizAssignment, Question, QuestionStatus, AttemptAnswer


def get_assignment_for_attempt(db: Session, assignment_id: int):
    return db.query(QuizAssignment).filter(QuizAssignment.id == assignment_id).first()


def get_attempt_by_id(db: Session, attempt_id: int):
    return db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()


def get_attempt_for_assignment(db: Session, assignment_id: int):
    return db.query(QuizAttempt).filter(QuizAttempt.assignment_id == assignment_id).first()


def get_attempt_for_student(db: Session, attempt_id: int, student_id: int):
    return (
        db.query(QuizAttempt)
        .filter(QuizAttempt.id == attempt_id, QuizAttempt.student_id == student_id)
        .first()
    )


def get_assignment_attempt(db: Session, assignment_id: int, student_id: int):
    return (
        db.query(QuizAssignment)
        .filter(QuizAssignment.id == assignment_id, QuizAssignment.student_id == student_id)
        .first()
    )


def get_approved_questions_for_quiz(db: Session, quiz_id: int):
    return (
        db.query(Question)
        .filter(Question.quiz_id == quiz_id, Question.status == QuestionStatus.APPROVED)
        .all()
    )


def create_attempt(db: Session, *, assignment_id: int, student_id: int):
    attempt = QuizAttempt(assignment_id=assignment_id, student_id=student_id, started_at=datetime.utcnow())
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def save_answer_records(db: Session, answer_records):
    for record in answer_records:
        db.add(record)


def update_attempt_result(db: Session, attempt: QuizAttempt, *, score: int, correct_count: int, wrong_count: int, total_questions: int):
    attempt.score = score
    attempt.correct_count = correct_count
    attempt.wrong_count = wrong_count
    attempt.total_questions = total_questions
    attempt.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(attempt)
    return attempt


def get_answers_for_attempt(db: Session, attempt_id: int):
    return db.query(AttemptAnswer).filter(AttemptAnswer.attempt_id == attempt_id).all()
