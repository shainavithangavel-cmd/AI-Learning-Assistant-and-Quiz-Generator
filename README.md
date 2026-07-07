# 🤖 AI Quiz Generator — Full Stack Project

A learning portal where trainers create topics, add notes, and AI generates quiz questions.
Students take quizzes and get instant results with explanations.

**Stack:** React + Vite + MUI + Zustand | FastAPI + SQLAlchemy + PostgreSQL | Claude AI

---

## 📁 Project Structure

```
ai-quiz-app/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── database.py          # DB connection
│   │   ├── models.py            # SQLAlchemy models + enums
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # JWT dependency
│   │   ├── routers/             # All API route files
│   │   ├── services/            # AI service
│   │   └── utils/               # Security helpers
│   ├── seed_db.py               # Seed roles + default users
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── api/axios.js         # Axios with JWT interceptor
    │   ├── stores/              # Zustand stores (6 stores)
    │   ├── components/          # Sidebar, StatusBadge, DashboardCard, etc.
    │   ├── pages/               # All 11 pages
    │   ├── routes/AppRoutes.jsx
    │   └── App.jsx
    └── package.json
```

---

## ⚙️ Backend Setup

### 1. Prerequisites
- Python 3.10+
- PostgreSQL running locally
- Anthropic API key (get from https://console.anthropic.com)

### 2. Create database
```bash
psql -U postgres
CREATE DATABASE ai_quiz_db;
\q
```

### 3. Setup environment
```bash
cd backend
cp .env .env.local   # already has example values
```

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_quiz_db
JWT_SECRET=pick_a_long_random_secret_string
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=480
AI_API_KEY=sk-ant-your-anthropic-key-here
AI_MODEL=claude-sonnet-4-6
```

### 4. Install dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 5. Start the server (tables are auto-created)
```bash
uvicorn app.main:app --reload --port 8000
```

### 6. Seed the database
Open a new terminal (with venv activated):
```bash
cd backend
python seed_db.py
```

Output:
```
✅ Roles seeded
✅ Created user: admin@quizapp.com / admin123
✅ Created user: trainer@quizapp.com / trainer123
✅ Created user: student@quizapp.com / student123
🎉 Seeding complete!
```

### 7. Verify API is running
Open: http://localhost:8000/docs

---

## 🖥️ Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Start dev server
```bash
npm run dev
```

Opens at: http://localhost:5173

---

## 🔑 Default Login Credentials

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@quizapp.com        | admin123    |
| Trainer | trainer@quizapp.com      | trainer123  |
| Student | student@quizapp.com      | student123  |

> Click the credential boxes on the login screen to auto-fill.

---

## 🎬 Demo Flow (Step by Step)

### Step 1 — Login as Admin
- Go to http://localhost:5173
- Click "Admin" credentials box → Sign In
- See Admin Dashboard with user counts
- Navigate to **Users** → Create a new Trainer and Student account

### Step 2 — Login as Trainer
- Logout → Login with trainer credentials
- See Trainer Dashboard

### Step 3 — Create Topic & Add Notes
- Click **Topics & Notes** in sidebar
- Click **New Topic** → Enter title like "React Hooks" → Create
- Click the topic row to expand it
- Click **Add Note** → Paste learning content → Save
  ```
  Example notes:
  React Hooks are functions that let you use state in functional components.
  useState takes an initial value and returns [state, setState].
  useEffect runs after render and handles side effects like API calls.
  useContext lets components subscribe to React context.
  Custom hooks are functions starting with "use" that can call other hooks.
  ```

### Step 4 — Create Quiz with AI
- Click **Create Quiz** in sidebar
- Step 1: Pick topic, name the quiz, set difficulty (Medium), count (5), type (MCQ) → Next
- Step 2: Select the notes you added → Next
- Step 3: Click **Generate Questions with AI**
- Wait ~5-10 seconds for Claude to generate questions
- You'll be redirected to the Question Review page

### Step 5 — Review Questions
- See all AI-generated questions with status **GENERATED**
- For each question you can:
  - ✅ **Approve** — marks question as approved
  - ❌ **Reject** — marks as rejected, won't appear in quiz
  - ✏️ **Edit** — modify question text, options, answer, explanation
  - 🔄 **Regenerate** — AI creates a new question (old one gets rejected)
- Once you have approved questions → Click **Publish Quiz**

### Step 6 — Assign Quiz to Student
- After publishing, click **Assign** button
- Select student(s) from the list
- Click Assign → See confirmation

### Step 7 — Login as Student
- Logout → Login with student credentials
- See Student Dashboard with assigned quizzes
- Click **Start Quiz**

### Step 8 — Attempt Quiz
- Read each question carefully
- Click the option button to select answer (turns purple)
- Go through all questions
- Click **Submit Quiz**

### Step 9 — View Result
- See score as a percentage (e.g., 80%)
- See correct count, wrong count, total
- Review each question:
  - 🟢 Green = your answer was correct
  - 🔴 Red = wrong (shows what you selected vs what was correct)
  - 💡 Yellow lightbulb = AI explanation of the correct answer

---

## 🔌 API Endpoints Reference

### Auth
```
POST /auth/login              { email, password }
```

### Admin
```
GET  /admin/users             ?role=TRAINER|STUDENT
POST /admin/users             { name, email, password, role }
DELETE /admin/users/{id}
```

### Topics
```
GET    /topics
POST   /topics                { title, description }
PUT    /topics/{id}
DELETE /topics/{id}
```

### Notes
```
POST /learning-notes          { topic_id, notes_text }
GET  /learning-notes/topic/{topic_id}
DELETE /learning-notes/{id}
```

### Quizzes
```
GET   /quizzes
POST  /quizzes                { topic_id, quiz_name, difficulty, question_count }
GET   /quizzes/{id}
PATCH /quizzes/{id}/publish
```

### AI
```
POST /ai/generate-quiz        { quiz_id, topic_id, notes_text, question_count, difficulty, question_type }
```

### Questions
```
GET   /questions/quiz/{quiz_id}
PATCH /questions/{id}/approve
PATCH /questions/{id}/reject
PUT   /questions/{id}
POST  /questions/{id}/regenerate
```

### Assignments
```
POST /quiz-assignments           { quiz_id, student_ids: [] }
GET  /quiz-assignments/student/{student_id}
GET  /quiz-assignments/quiz/{quiz_id}
```

### Attempts
```
POST /quiz-attempts/start        { assignment_id }
POST /quiz-attempts/{id}/submit  { answers: [{ question_id, selected_answer }] }
GET  /quiz-attempts/{id}/result
```

---

## 🗄️ Database Tables

| Table             | Purpose                                  |
|-------------------|------------------------------------------|
| roles             | ADMIN, TRAINER, STUDENT enum values      |
| users             | All users with role FK                   |
| topics            | Trainer-created learning topics          |
| learning_notes    | Notes pasted per topic                   |
| quizzes           | Quiz metadata; published_at tracks state |
| questions         | AI-generated questions with status       |
| quiz_assignments  | Which student gets which quiz            |
| quiz_attempts     | Attempt record with score                |
| attempt_answers   | Per-question answer with is_correct      |

---

## 🔧 Troubleshooting

**Backend won't start:**
- Check PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env is correct
- Check venv is activated

**AI generation fails:**
- Check AI_API_KEY in .env is valid
- Check internet connection
- Look at backend terminal for error details

**Frontend can't connect to backend:**
- Make sure backend is running on port 8000
- Check no CORS errors in browser console
- Verify Axios baseURL in `src/api/axios.js`

**Token/Login issues:**
- Clear localStorage in browser DevTools → Application → Storage
- Try logging in again

---

## 📦 Enums Used

```python
UserRole:      ADMIN | TRAINER | STUDENT
Difficulty:    EASY | MEDIUM | HARD
QuestionType:  MCQ | TRUE_FALSE | SHORT_ANSWER
QuestionStatus: GENERATED | APPROVED | REJECTED
```

Quiz publish state: `published_at IS NULL` = draft, `published_at IS NOT NULL` = published

---

## 🤝 Built By

This is an intern/training project MVP. Code is intentionally kept simple and readable.
