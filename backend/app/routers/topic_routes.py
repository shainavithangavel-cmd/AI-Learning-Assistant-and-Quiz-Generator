from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, UserRole
from app.schemas import CreateTopicRequest, UpdateTopicRequest, TopicResponse
from app.auth import require_role, get_current_user
from app.services.topic_service import create_topic as create_topic_service
from app.services.topic_service import delete_topic as delete_topic_service
from app.services.topic_service import get_topics as get_topics_service
from app.services.topic_service import update_topic as update_topic_service

router = APIRouter(prefix="/topics", tags=["Topics"])


@router.get("", response_model=List[TopicResponse])
def get_topics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_topics_service(db, current_user)


@router.post("", response_model=TopicResponse, status_code=201)
def create_topic(
    request: CreateTopicRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER)),
):
    return create_topic_service(db, request, current_user)


@router.put("/{topic_id}", response_model=TopicResponse)
def update_topic(
    topic_id: int,
    request: UpdateTopicRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER)),
):
    return update_topic_service(db, topic_id, request)


@router.delete("/{topic_id}", status_code=204)
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER)),
):
    delete_topic_service(db, topic_id)
    return None
