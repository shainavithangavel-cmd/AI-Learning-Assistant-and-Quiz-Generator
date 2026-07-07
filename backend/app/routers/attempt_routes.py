from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import StartAttemptRequest, SubmitAttemptRequest, AttemptResultResponse
from app.auth import get_current_user
from app.services.attempt_service import get_result_service, start_attempt as start_attempt_service, submit_attempt as submit_attempt_service

router = APIRouter(prefix="/quiz-attempts", tags=["Attempts"])


@router.post("/start", status_code=201)
def start_attempt(
    request: StartAttemptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return start_attempt_service(db, request, current_user)


@router.post("/{attempt_id}/submit")
def submit_attempt(
    attempt_id: int,
    request: SubmitAttemptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return submit_attempt_service(db, attempt_id, request, current_user)


@router.get("/{attempt_id}/result", response_model=AttemptResultResponse)
def get_result(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_result_service(db, attempt_id, current_user, trainer_view=False)


@router.get("/{attempt_id}/result/trainer-view", response_model=AttemptResultResponse)
def get_result_for_trainer(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_result_service(db, attempt_id, current_user, trainer_view=True)