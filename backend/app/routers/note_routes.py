from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, UserRole
from app.schemas import CreateNoteRequest, NoteResponse
from app.auth import require_role, get_current_user
from app.services.note_service import create_note as create_note_service
from app.services.note_service import delete_note as delete_note_service
from app.services.note_service import get_notes_by_topic as get_notes_by_topic_service

router = APIRouter(prefix="/learning-notes", tags=["Learning Notes"])


@router.post("", response_model=NoteResponse, status_code=201)
def create_note(
    request: CreateNoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER)),
):
    return create_note_service(db, request, current_user)


@router.get("/topic/{topic_id}", response_model=List[NoteResponse])
def get_notes_by_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_notes_by_topic_service(db, topic_id)


@router.delete("/{note_id}", status_code=204)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER)),
):
    delete_note_service(db, note_id)
    return None
