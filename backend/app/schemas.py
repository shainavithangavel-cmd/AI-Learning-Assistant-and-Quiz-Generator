from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, Difficulty, QuestionType, QuestionStatus


# ─── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    name: str
    role: str


# ─── Users ────────────────────────────────────────────────────────────────────

class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True #it allows Pydantic to convert SQLAlchemy model objects into  response schemas.


# ─── Topics ───────────────────────────────────────────────────────────────────

class CreateTopicRequest(BaseModel):
    title: str
    description: Optional[str] = None


class UpdateTopicRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class TopicResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    created_by: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True 


# ─── Learning Notes ───────────────────────────────────────────────────────────

class CreateNoteRequest(BaseModel):
    topic_id: int
    notes_text: str


class NoteResponse(BaseModel):
    id: int
    topic_id: int
    notes_text: str
    uploaded_by: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─── Quizzes ──────────────────────────────────────────────────────────────────

class CreateQuizRequest(BaseModel):
    topic_id: int
    quiz_name: str
    difficulty: Difficulty
    question_count: int = 5
    time_limit_minutes: Optional[int] = None 


class QuizResponse(BaseModel):
    id: int
    topic_id: int
    quiz_name: str
    difficulty: str
    question_count: int
    time_limit_minutes: Optional[int]
    created_by: int
    published_at: Optional[datetime]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─── AI Generate ──────────────────────────────────────────────────────────────

class GenerateQuizRequest(BaseModel):
    quiz_id: int
    topic_id: int
    notes_text: str
    question_count: int = 5
    difficulty: Difficulty = Difficulty.MEDIUM
    question_type: QuestionType = QuestionType.MCQ


# ─── Questions ────────────────────────────────────────────────────────────────

class UpdateQuestionRequest(BaseModel):
    question_text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None


class QuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    question_type: str
    option_a: Optional[str]
    option_b: Optional[str]
    option_c: Optional[str]
    option_d: Optional[str]
    correct_answer: str
    explanation: Optional[str]
    ai_generated: bool
    status: str
    confidence_score: Optional[float]
    edited_by_trainer: bool
    regenerated_from: Optional[int]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─── Assignments ──────────────────────────────────────────────────────────────

class CreateAssignmentRequest(BaseModel):
    quiz_id: int
    student_ids: List[int]


class AssignmentResponse(BaseModel):
    id: int
    quiz_id: int
    student_id: int
    assigned_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─── Attempts ─────────────────────────────────────────────────────────────────

class StartAttemptRequest(BaseModel):
    assignment_id: int


class AnswerSubmit(BaseModel):
    question_id: int
    selected_answer: str


class SubmitAttemptRequest(BaseModel):
    answers: List[AnswerSubmit]


class AttemptAnswerResult(BaseModel):
    question_id: int
    question_text: str
    selected_answer: Optional[str]
    correct_answer: str
    is_correct: bool
    explanation: Optional[str]
    option_a: Optional[str]
    option_b: Optional[str]
    option_c: Optional[str]
    option_d: Optional[str]


class AttemptResultResponse(BaseModel):
    attempt_id: int
    quiz_name: str
    score: int
    correct_count: int
    wrong_count: int
    total_questions: int
    started_at: Optional[datetime]
    submitted_at: Optional[datetime]
    answers: List[AttemptAnswerResult]
