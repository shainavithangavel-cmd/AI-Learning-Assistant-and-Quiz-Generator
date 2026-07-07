from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import QuizAttempt, QuizAssignment, AttemptAnswer, User
from app.schemas import StartAttemptRequest, SubmitAttemptRequest, AttemptAnswerResult, AttemptResultResponse
from app.repositories.attempt_repository import (
    create_attempt,
    get_approved_questions_for_quiz,
    get_answers_for_attempt,
    get_assignment_attempt,
    get_attempt_by_id,
    get_attempt_for_assignment,
    get_attempt_for_student,
    get_assignment_for_attempt,
    save_answer_records,
    update_attempt_result,
)


def start_attempt(db: Session, request: StartAttemptRequest, current_user: User):
    assignment = get_assignment_attempt(db, request.assignment_id, current_user.id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    existing = get_attempt_for_assignment(db, request.assignment_id)
    if existing:
        return {"attempt_id": existing.id, "message": "Attempt already started"}

    attempt = create_attempt(db, assignment_id=request.assignment_id, student_id=current_user.id)
    return {"attempt_id": attempt.id, "message": "Attempt started"}


def submit_attempt(db: Session, attempt_id: int, request: SubmitAttemptRequest, current_user: User):
    attempt = get_attempt_for_student(db, attempt_id, current_user.id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    if attempt.submitted_at is not None:
        raise HTTPException(status_code=400, detail="Quiz already submitted")

    assignment = get_assignment_for_attempt(db, attempt.assignment_id)
    questions = get_approved_questions_for_quiz(db, assignment.quiz_id)
    question_map = {q.id: q for q in questions}

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

        answer_records.append(
            AttemptAnswer(
                attempt_id=attempt_id,
                question_id=answer.question_id,
                selected_answer=answer.selected_answer.upper(),
                is_correct=is_correct,
            )
        )

    total = len(questions)
    score = round((correct_count / total) * 100) if total > 0 else 0

    save_answer_records(db, answer_records)
    update_attempt_result(
        db,
        attempt,
        score=score,
        correct_count=correct_count,
        wrong_count=wrong_count,
        total_questions=total,
    )

    return {
        "message": "Quiz submitted successfully",
        "score": score,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "total_questions": total,
    }


def get_result_service(db: Session, attempt_id: int, current_user: User, trainer_view: bool = False):
    attempt = get_attempt_by_id(db, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    if attempt.submitted_at is None:
        raise HTTPException(status_code=400, detail="Quiz not submitted yet")

    if trainer_view and current_user.role.role_name not in ["TRAINER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this")

    if not trainer_view and attempt.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this")

    answers = get_answers_for_attempt(db, attempt_id)
    answer_details = []
    for ans in answers:
        q = ans.question
        answer_details.append(
            AttemptAnswerResult(
                question_id=q.id,
                question_text=q.question_text,
                selected_answer=ans.selected_answer,
                correct_answer=q.correct_answer,
                is_correct=ans.is_correct,
                explanation=q.explanation,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
            )
        )

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
        answers=answer_details,
    )
