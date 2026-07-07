from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import Topic, User, UserRole
from app.schemas import CreateTopicRequest, UpdateTopicRequest
from app.repositories.topic_repository import (
    create_topic as create_topic_repo,
    delete_topic as delete_topic_repo,
    get_topic_by_id,
    list_topics,
    update_topic as update_topic_repo,
)


def get_topics(db: Session, current_user: User):
    if current_user.role.role_name == UserRole.ADMIN:
        return list_topics(db)
    return list_topics(db, created_by=current_user.id)


def create_topic(db: Session, request: CreateTopicRequest, current_user: User):
    return create_topic_repo(db, title=request.title, description=request.description, created_by=current_user.id)


def update_topic(db: Session, topic_id: int, request: UpdateTopicRequest):
    topic = get_topic_by_id(db, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if request.title is not None:
        topic.title = request.title
    if request.description is not None:
        topic.description = request.description

    return update_topic_repo(db, topic)


def delete_topic(db: Session, topic_id: int):
    topic = get_topic_by_id(db, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    delete_topic_repo(db, topic)
    return None
