from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import Quiz, User, UserRole, Question, AttemptAnswer, QuizAssignment, QuizAttempt
from app.schemas import CreateQuizRequest, QuizResponse
from app.auth import require_role, get_current_user

router = APIRouter(prefix="/quizzes", tags=["Quizzes"]) #every API in this file will start with prefix /quizzes


# status code 201 means created or for successful response for a post request.it will returns as ison response with newly created quiz object.
@router.post("", response_model=QuizResponse, status_code=201) 
def create_quiz(
    request: CreateQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER))
):
    
    quiz = Quiz(
        topic_id=request.topic_id,
        quiz_name=request.quiz_name,
        difficulty=request.difficulty,
        question_count=request.question_count,
        time_limit_minutes=request.time_limit_minutes,  
        created_by=current_user.id
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz

# it will send a list of quizzes to the frontend as json response. frontend will get it as a list of quiz objects.
@router.get("", response_model=List[QuizResponse]) 
def get_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.role_name == UserRole.ADMIN:
        quizzes = db.query(Quiz).all()
    else:
        quizzes = db.query(Quiz).filter(Quiz.created_by == current_user.id).all()
    return quizzes


@router.get("/{quiz_id}", response_model=QuizResponse) #get a single quiz by its id .frontend will send it in the url and backend will receive it as quiz_id parameter.
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        #status code 404  means not found.if quiz is not found the backend will return the error response to the frontend with this status code.
        raise HTTPException(status_code=404, detail="Quiz not found") 
    return quiz


@router.patch("/{quiz_id}/publish", response_model=QuizResponse)
def publish_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER))
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    from app.models import QuestionStatus #checks how many questions are approved for this quiz before publishing.
    approved = db.query(Question).filter(
        Question.quiz_id == quiz_id,
        Question.status == QuestionStatus.APPROVED
    ).count()

    if approved == 0:
        raise HTTPException(status_code=400, detail="Approve at least one question before publishing") # status code 400 means bad request.if no requests are approved then backend will send this error response.

    quiz.published_at = datetime.utcnow() #setting the published at time.
    db.commit() 
    db.refresh(quiz)
    return quiz


@router.delete("/{quiz_id}", status_code=204)
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER))
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    

    questions = db.query(Question).filter(Question.quiz_id == quiz_id).all()
    question_ids = [q.id for q in questions] #get all the questions ids under this quiz to delete the answers and attempts related to those questions and answers.

    assignments = db.query(QuizAssignment).filter(QuizAssignment.quiz_id == quiz_id).all()
    assignment_ids = [a.id for a in assignments] #gets all the assignment ids for this quiz to delete the attempts related to these attempts.

    if question_ids:
        db.query(AttemptAnswer).filter(AttemptAnswer.question_id.in_(question_ids)).delete(synchronize_session=False) # delete the answers submitted to the questions.

    if assignment_ids:
        db.query(QuizAttempt).filter(QuizAttempt.assignment_id.in_(assignment_ids)).delete(synchronize_session=False) #delete the attempts made for this quiz assignment.

    db.query(QuizAssignment).filter(QuizAssignment.quiz_id == quiz_id).delete(synchronize_session=False) #removes  all the assignments for tis quiz.
    db.query(Question).filter(Question.quiz_id == quiz_id).delete(synchronize_session=False) #remove all the questions for this quiz.

    db.delete(quiz)
    db.commit()