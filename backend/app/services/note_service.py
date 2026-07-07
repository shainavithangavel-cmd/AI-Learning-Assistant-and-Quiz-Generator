from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.schemas import CreateNoteRequest
from app.repositories.note_repository import (
    create_note as create_note_repo,
    delete_note as delete_note_repo,
    get_note_by_id,
    get_notes_by_topic as get_notes_by_topic_repo,
)


def get_notes_by_topic(db: Session, topic_id: int):
    return get_notes_by_topic_repo(db, topic_id)


def create_note(db: Session, request: CreateNoteRequest, current_user):
    return create_note_repo(db, topic_id=request.topic_id, notes_text=request.notes_text, uploaded_by=current_user.id)


def delete_note(db: Session, note_id: int):
    note = get_note_by_id(db, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    delete_note_repo(db, note)
    return None
