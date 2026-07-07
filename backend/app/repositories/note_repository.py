from sqlalchemy.orm import Session
from app.models import LearningNote


def get_notes_by_topic(db: Session, topic_id: int):
    return db.query(LearningNote).filter(LearningNote.topic_id == topic_id).all()


def get_note_by_id(db: Session, note_id: int):
    return db.query(LearningNote).filter(LearningNote.id == note_id).first()


def create_note(db: Session, *, topic_id: int, notes_text: str, uploaded_by: int):
    note = LearningNote(topic_id=topic_id, notes_text=notes_text, uploaded_by=uploaded_by)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def delete_note(db: Session, note: LearningNote):
    db.delete(note)
    db.commit()
