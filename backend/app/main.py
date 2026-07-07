from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import (
    auth_routes, admin_routes, topic_routes,
    note_routes, quiz_routes, ai_routes,
    question_routes, assignment_routes, attempt_routes
)

# Create all tables
Base.metadata.create_all(bind=engine) #Create all tables defined using Base inside the database connected through engine.

app = FastAPI(
    title="AI Quiz Generator API",
    description="Learning portal with AI-generated quizzes",
    version="1.0.0"
)

# Allow React dev server to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth_routes.router)
app.include_router(admin_routes.router)
app.include_router(topic_routes.router)
app.include_router(note_routes.router)
app.include_router(quiz_routes.router)
app.include_router(ai_routes.router)
app.include_router(question_routes.router)
app.include_router(assignment_routes.router)
app.include_router(attempt_routes.router)


@app.get("/") #root api
def root():
    return {"message": "AI Quiz Generator API is running"}


@app.get("/health") #health api (used to check backend health)
def health():
    return {"status": "ok"}
