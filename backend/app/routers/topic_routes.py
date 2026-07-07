from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session #db session type
from typing import List #return list of topics
from app.database import get_db #give db connection
from app.models import Topic, User, UserRole
from app.schemas import CreateTopicRequest, UpdateTopicRequest, TopicResponse #datas needed to create topic,update topic,and response model for the topic
from app.auth import require_role, get_current_user #for authentication and role checking

router = APIRouter(prefix="/topics", tags=["Topics"]) # all apis will start with prefix /topics


@router.get("", response_model=List[TopicResponse])
def get_topics( 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # getting current logged in user .any logged in user can access this api.
):
    # Trainers see only their topics, admins see all
    if current_user.role.role_name == UserRole.ADMIN:
        topics = db.query(Topic).all()
    else:
        topics = db.query(Topic).filter(Topic.created_by == current_user.id).all()
    return topics


@router.post("", response_model=TopicResponse, status_code=201)
def create_topic(
    request: CreateTopicRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER))
):
    # frontend send this as api request body,backend wil receive this i. res object and save it in db.
    topic = Topic(
        title=request.title,
        description=request.description,   
        created_by=current_user.id
    )
    db.add(topic) #insert new topics 
    db.commit() # save the topics in db
    db.refresh(topic) #reload the generated values
    return topic #send the json response of topic created


@router.put("/{topic_id}", response_model=TopicResponse)
def update_topic(
    topic_id: int,
    request: UpdateTopicRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER))
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if request.title is not None:
        topic.title = request.title
    if request.description is not None:
        topic.description = request.description

    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/{topic_id}", status_code=204)
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER))
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    db.delete(topic)
    db.commit()
