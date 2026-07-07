from sqlalchemy.orm import Session
from app.models import Question, QuestionStatus, Quiz, LearningNote


def get_questions_by_quiz(db: Session, quiz_id: int):
    return db.query(Question).filter(Question.quiz_id == quiz_id).all()


def get_question_by_id(db: Session, question_id: int):
    return db.query(Question).filter(Question.id == question_id).first()


def update_question_status(db: Session, question: Question, status: QuestionStatus):
    question.status = status
    db.commit()
    db.refresh(question)
    return question


def update_question_content(db: Session, question: Question, request):
    if request.question_text is not None:
        question.question_text = request.question_text
    if request.option_a is not None:
        question.option_a = request.option_a
    if request.option_b is not None:
        question.option_b = request.option_b
    if request.option_c is not None:
        question.option_c = request.option_c
    if request.option_d is not None:
        question.option_d = request.option_d
    if request.correct_answer is not None:
        question.correct_answer = request.correct_answer.upper()
    if request.explanation is not None:
        question.explanation = request.explanation

    question.edited_by_trainer = True
    db.commit()
    db.refresh(question)
    return question


def get_quiz_for_question_regeneration(db: Session, quiz_id: int):
    return db.query(Quiz).filter(Quiz.id == quiz_id).first()


def get_notes_for_topic(db: Session, topic_id: int):
    return db.query(LearningNote).filter(LearningNote.topic_id == topic_id).all()


def create_question(db: Session, *, question_data: dict):
    question = Question(**question_data)
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


def reject_question_for_regeneration(db: Session, question: Question):
    question.status = QuestionStatus.REJECTED
    db.commit()
    db.refresh(question)
    return question
