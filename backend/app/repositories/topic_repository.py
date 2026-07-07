from sqlalchemy.orm import Session
from app.models import Topic


def list_topics(db: Session, created_by: int | None = None):
    query = db.query(Topic)
    if created_by is not None:
        query = query.filter(Topic.created_by == created_by)
    return query.all()


def get_topic_by_id(db: Session, topic_id: int):
    return db.query(Topic).filter(Topic.id == topic_id).first()


def create_topic(db: Session, *, title: str, description: str | None, created_by: int):
    topic = Topic(title=title, description=description, created_by=created_by)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


def update_topic(db: Session, topic: Topic):
    db.commit()
    db.refresh(topic)
    return topic


def delete_topic(db: Session, topic: Topic):
    db.delete(topic)
    db.commit()
