from fastapi import APIRouter, Depends, HTTPException #this file manages the questions after they have been generated.
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Question, User, UserRole, QuestionStatus
from app.schemas import QuestionResponse, UpdateQuestionRequest, GenerateQuizRequest
from app.auth import require_role, get_current_user

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.get("/quiz/{quiz_id}", response_model=List[QuestionResponse]) #gets all questions belonging to that quiz id.response_model=List[QuestionResponse]- returns list of many questions that follows the questionresponse schema.
def get_questions_by_quiz(     
    quiz_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    questions = db.query(Question).filter(Question.quiz_id == quiz_id).all()
    return questions


@router.patch("/{question_id}/approve", response_model=QuestionResponse)
def approve_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER))
):
    question = db.query(Question).filter(Question.id == question_id).first()   #finds the question by id.
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    question.status = QuestionStatus.APPROVED # changes the status of the question to approved.
    db.commit()
    db.refresh(question)
    return question


@router.patch("/{question_id}/reject", response_model=QuestionResponse)
def reject_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER, UserRole.ADMIN))
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    question.status = QuestionStatus.REJECTED
    db.commit()
    db.refresh(question)
    return question


@router.put("/{question_id}", response_model=QuestionResponse)
def edit_question(
    question_id: int,
    request: UpdateQuestionRequest, # request comes from frontend as json body and converted to updatequestionrequest object by fastapi.
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER))
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if request.question_text is not None: #edit only those not null fields in the request object and update them in question object and save in db.
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
        question.correct_answer = request.correct_answer.upper() #converts answer to uppercase before saving in db.
    if request.explanation is not None:
        question.explanation = request.explanation

    question.edited_by_trainer = True #checks if it is edited by trainer.
    db.commit()
    db.refresh(question)
    return question


@router.post("/{question_id}/regenerate", response_model=QuestionResponse)
async def regenerate_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TRAINER))
):
    """
    Regenerate a specific question.
    Old question gets REJECTED, new question created with GENERATED status.
    """
    old_q = db.query(Question).filter(Question.id == question_id).first()
    if not old_q:
        raise HTTPException(status_code=404, detail="Question not found")

    # Get quiz and topic info for regeneration
    from app.models import Quiz, LearningNote
    quiz = db.query(Quiz).filter(Quiz.id == old_q.quiz_id).first()

    # Get notes for the topic
    notes = db.query(LearningNote).filter(LearningNote.topic_id == quiz.topic_id).all()
    notes_text = "\n\n".join([n.notes_text for n in notes]) if notes else "General knowledge question"

    from app.services.ai_service import generate_questions
    try:
        ai_questions = await generate_questions(
            notes_text=notes_text,
            question_count=1,
            difficulty=quiz.difficulty.value,
            question_type=old_q.question_type.value
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI regeneration failed: {str(e)}")

    if not ai_questions:
        raise HTTPException(status_code=500, detail="AI returned no valid question")

    # Mark old question as rejected
    old_q.status = QuestionStatus.REJECTED
    db.commit()

    # Create new question linked to old one
    q_data = ai_questions[0]
    new_q = Question(
        quiz_id=old_q.quiz_id,
        question_text=q_data.get("question_text"),
        question_type=q_data.get("question_type", old_q.question_type.value),
        option_a=q_data.get("option_a"),
        option_b=q_data.get("option_b"),
        option_c=q_data.get("option_c"),
        option_d=q_data.get("option_d"),
        correct_answer=q_data.get("correct_answer", "A"),
        explanation=q_data.get("explanation"),
        ai_generated=True,
        status=QuestionStatus.GENERATED,
        confidence_score=q_data.get("confidence_score"),
        regenerated_from=question_id,
        edited_by_trainer=False
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    return new_q
