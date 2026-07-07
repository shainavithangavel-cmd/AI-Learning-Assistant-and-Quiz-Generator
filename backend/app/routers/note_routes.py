from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import LearningNote, User, UserRole
from app.schemas import CreateNoteRequest, NoteResponse
from app.auth import require_role, get_current_user

router = APIRouter(prefix="/learning-notes", tags=["Learning Notes"])


@router.post("", response_model=NoteResponse, status_code=201)
def create_note(
    request: CreateNoteRequest, #request comes from frontend as json body and converted to CreateNoteRequest object by fastapi
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER))
):
    note = LearningNote(
        topic_id=request.topic_id,   #created a new note object and assigned the values from the req object and current user object to the note object.
        notes_text=request.notes_text,
        uploaded_by=current_user.id
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/topic/{topic_id}", response_model=List[NoteResponse]) #gets all those notes which are uploaded for a particular topic id. frontend will send the topic id in the url and backend will get it as topic_id parameter.
def get_notes_by_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notes = db.query(LearningNote).filter(LearningNote.topic_id == topic_id).all()
    return notes


@router.delete("/{note_id}", status_code=204) #based on the note id frontend sending in the url,backend will receive it as note_id parameter and delete that note from the db.
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER))
):
    note = db.query(LearningNote).filter(LearningNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
