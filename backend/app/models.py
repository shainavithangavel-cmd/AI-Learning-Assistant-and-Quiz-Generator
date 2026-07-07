import enum
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, Numeric, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    TRAINER = "TRAINER"
    STUDENT = "STUDENT"


class Difficulty(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class QuestionType(str, enum.Enum):
    MCQ = "MCQ"
    TRUE_FALSE = "TRUE_FALSE"
    SHORT_ANSWER = "SHORT_ANSWER"


class QuestionStatus(str, enum.Enum):
    GENERATED = "GENERATED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


# ─── Models ───────────────────────────────────────────────────────────────────

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(SAEnum(UserRole), unique=True, nullable=False)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    role = relationship("Role", back_populates="users")
    topics = relationship("Topic", back_populates="creator")
    notes = relationship("LearningNote", back_populates="uploader")
    quizzes = relationship("Quiz", back_populates="creator")
    assignments = relationship("QuizAssignment", back_populates="student")
    attempts = relationship("QuizAttempt", back_populates="student")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", back_populates="topics")
    notes = relationship("LearningNote", back_populates="topic")
    quizzes = relationship("Quiz", back_populates="topic")


class LearningNote(Base):
    __tablename__ = "learning_notes"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    notes_text = Column(Text, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    topic = relationship("Topic", back_populates="notes")
    uploader = relationship("User", back_populates="notes")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    quiz_name = Column(String(255), nullable=False)
    difficulty = Column(SAEnum(Difficulty), nullable=False)
    question_count = Column(Integer, nullable=False, default=5)
    time_limit_minutes = Column(Integer, nullable=True)  # NULL means no time limit
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)  # NULL = not published
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    topic = relationship("Topic", back_populates="quizzes")
    creator = relationship("User", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz")
    assignments = relationship("QuizAssignment", back_populates="quiz")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(SAEnum(QuestionType), nullable=False, default=QuestionType.MCQ)
    option_a = Column(String(500))
    option_b = Column(String(500))
    option_c = Column(String(500))
    option_d = Column(String(500))
    correct_answer = Column(String(10), nullable=False)  # A, B, C, D or True/False
    explanation = Column(Text)
    ai_generated = Column(Boolean, default=True)
    status = Column(SAEnum(QuestionStatus), default=QuestionStatus.GENERATED)
    confidence_score = Column(Numeric(3, 2))
    edited_by_trainer = Column(Boolean, default=False)
    regenerated_from = Column(Integer, ForeignKey("questions.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    quiz = relationship("Quiz", back_populates="questions")
    attempt_answers = relationship("AttemptAnswer", back_populates="question")
    regenerated_versions = relationship("Question", foreign_keys=[regenerated_from])


class QuizAssignment(Base):
    __tablename__ = "quiz_assignments"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    quiz = relationship("Quiz", back_populates="assignments")
    student = relationship("User", back_populates="assignments")
    attempts = relationship("QuizAttempt", back_populates="assignment")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("quiz_assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer)
    correct_count = Column(Integer)
    wrong_count = Column(Integer)
    total_questions = Column(Integer)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    assignment = relationship("QuizAssignment", back_populates="attempts")
    student = relationship("User", back_populates="attempts")
    answers = relationship("AttemptAnswer", back_populates="attempt")


class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_answer = Column(String(10))
    is_correct = Column(Boolean)

    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("Question", back_populates="attempt_answers")
