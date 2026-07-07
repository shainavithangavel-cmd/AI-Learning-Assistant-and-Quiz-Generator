from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Quiz, Question, QuestionStatus, QuizAssignment, QuizAttempt, AttemptAnswer


def get_quiz_by_id(db: Session, quiz_id: int):
    return db.query(Quiz).filter(Quiz.id == quiz_id).first()


def list_quizzes(db: Session, created_by: int | None = None):
    query = db.query(Quiz)
    if created_by is not None:
        query = query.filter(Quiz.created_by == created_by)
    return query.all()


def create_quiz(db: Session, *, quiz_data: dict):
    quiz = Quiz(**quiz_data)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


def publish_quiz(db: Session, quiz: Quiz):
    quiz.published_at = datetime.utcnow()
    db.commit()
    db.refresh(quiz)
    return quiz


def get_approved_question_count(db: Session, quiz_id: int):
    return (
        db.query(Question)
        .filter(Question.quiz_id == quiz_id, Question.status == QuestionStatus.APPROVED)
        .count()
    )


def delete_quiz(db: Session, quiz: Quiz):
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
    question_ids = [q.id for q in questions]

    assignments = db.query(QuizAssignment).filter(QuizAssignment.quiz_id == quiz.id).all()
    assignment_ids = [a.id for a in assignments]

    if question_ids:
        db.query(AttemptAnswer).filter(AttemptAnswer.question_id.in_(question_ids)).delete(synchronize_session=False)

    if assignment_ids:
        db.query(QuizAttempt).filter(QuizAttempt.assignment_id.in_(assignment_ids)).delete(synchronize_session=False)

    db.query(QuizAssignment).filter(QuizAssignment.quiz_id == quiz.id).delete(synchronize_session=False)
    db.query(Question).filter(Question.quiz_id == quiz.id).delete(synchronize_session=False)

    db.delete(quiz)
    db.commit()
