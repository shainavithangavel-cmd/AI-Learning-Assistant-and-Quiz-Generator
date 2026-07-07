from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import (
    QuizAttempt, QuizAssignment, AttemptAnswer,
    Question, QuestionStatus, User, UserRole
)
from app.schemas import StartAttemptRequest, SubmitAttemptRequest, AttemptResultResponse, AttemptAnswerResult
from app.auth import get_current_user

router = APIRouter(prefix="/quiz-attempts", tags=["Attempts"])


@router.post("/start", status_code=201)
def start_attempt(
    request: StartAttemptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assignment = db.query(QuizAssignment).filter(
        QuizAssignment.id == request.assignment_id,
        QuizAssignment.student_id == current_user.id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if already attempted
    existing = db.query(QuizAttempt).filter(
        QuizAttempt.assignment_id == request.assignment_id
    ).first()
    if existing:
        return {"attempt_id": existing.id, "message": "Attempt already started"}

    attempt = QuizAttempt(
        assignment_id=request.assignment_id,
        student_id=current_user.id,
        started_at=datetime.utcnow()
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {"attempt_id": attempt.id, "message": "Attempt started"}


@router.post("/{attempt_id}/submit")
def submit_attempt(
    attempt_id: int,
    request: SubmitAttemptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.student_id == current_user.id
    ).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    if attempt.submitted_at is not None:
        raise HTTPException(status_code=400, detail="Quiz already submitted")

    # Get the quiz_id through assignment
    assignment = db.query(QuizAssignment).filter(
        QuizAssignment.id == attempt.assignment_id
    ).first()

    # Fetch only APPROVED questions for this quiz
    questions = db.query(Question).filter(
        Question.quiz_id == assignment.quiz_id,
        Question.status == QuestionStatus.APPROVED
    ).all()

    # Build a lookup of question_id -> question
    question_map = {q.id: q for q in questions}

    # Score calculation (backend only, no AI)
    correct_count = 0
    wrong_count = 0
    answer_records = []

    for answer in request.answers:
        q = question_map.get(answer.question_id)
        if not q:
            continue

        is_correct = q.correct_answer.upper() == answer.selected_answer.upper()
        if is_correct:
            correct_count += 1
        else:
            wrong_count += 1

        answer_records.append(AttemptAnswer(
            attempt_id=attempt_id,
            question_id=answer.question_id,
            selected_answer=answer.selected_answer.upper(),
            is_correct=is_correct
        ))

    total = len(questions)
    score = round((correct_count / total) * 100) if total > 0 else 0

    # Save all answers
    for record in answer_records:
        db.add(record)

    # Update attempt with score
    attempt.score = score
    attempt.correct_count = correct_count
    attempt.wrong_count = wrong_count
    attempt.total_questions = total
    attempt.submitted_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Quiz submitted successfully",
        "score": score,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "total_questions": total
    }


@router.get("/{attempt_id}/result", response_model=AttemptResultResponse)
def get_result(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    if attempt.submitted_at is None:
        raise HTTPException(status_code=400, detail="Quiz not submitted yet")

    # Get answers with question details
    answers = db.query(AttemptAnswer).filter(
        AttemptAnswer.attempt_id == attempt_id
    ).all()

    answer_details = []
    for ans in answers:
        q = ans.question
        answer_details.append(AttemptAnswerResult(
            question_id=q.id,
            question_text=q.question_text,
            selected_answer=ans.selected_answer,
            correct_answer=q.correct_answer,
            is_correct=ans.is_correct,
            explanation=q.explanation,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d
        ))

    quiz_name = attempt.assignment.quiz.quiz_name

    return AttemptResultResponse(
        attempt_id=attempt.id,
        quiz_name=quiz_name,
        score=attempt.score,
        correct_count=attempt.correct_count,
        wrong_count=attempt.wrong_count,
        total_questions=attempt.total_questions,
        started_at=attempt.started_at,
        submitted_at=attempt.submitted_at,
        answers=answer_details
    )
@router.get("/{attempt_id}/result/trainer-view", response_model=AttemptResultResponse)
def get_result_for_trainer(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Same as get_result, but allows trainers/admins to view
    any student's attempt (not just their own).
    """
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    if attempt.submitted_at is None:
        raise HTTPException(status_code=400, detail="Quiz not submitted yet")

    # only trainer/admin can use this endpoint, students should use the normal one
    if current_user.role.role_name not in [UserRole.TRAINER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to view this")

    answers = db.query(AttemptAnswer).filter(
        AttemptAnswer.attempt_id == attempt_id
    ).all()

    answer_details = []
    for ans in answers:
        q = ans.question
        answer_details.append(AttemptAnswerResult(
            question_id=q.id,
            question_text=q.question_text,
            selected_answer=ans.selected_answer,
            correct_answer=q.correct_answer,
            is_correct=ans.is_correct,
            explanation=q.explanation,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d
        ))

    quiz_name = attempt.assignment.quiz.quiz_name

    return AttemptResultResponse(
        attempt_id=attempt.id,
        quiz_name=quiz_name,
        score=attempt.score,
        correct_count=attempt.correct_count,
        wrong_count=attempt.wrong_count,
        total_questions=attempt.total_questions,
        started_at=attempt.started_at,
        submitted_at=attempt.submitted_at,
        answers=answer_details
    )