# AI-Powered Adaptive Learning Platform

A web platform that personalizes course content, practice quizzes, and study schedules using AI, based on each student's learning pace, preferred style, and performance data.

## Features

- **Adaptive Quiz Engine** - Difficulty adjusts in real-time based on correctness and response time
- **Learning Style Detection** - Identifies visual, auditory, reading/writing, or kinesthetic preferences
- **Spaced Repetition Scheduling** - SM-2 algorithm generates personalized study plans
- **Progress Tracking** - Dashboard with learning statistics and performance analytics
- **JWT Authentication** - Secure login with token-based session management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, SQLAlchemy, SQLite, bcrypt, JWT |
| Frontend | React 18, Vite, Tailwind CSS, React Router, Lucide Icons |
| Testing | pytest |

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### 1. Clone and Setup

```bash
git clone https://github.com/Elly739/AI-Powered-Adaptive-Learning-Platform.git
cd AI-Powered-Adaptive-Learning-Platform
```

### 2. Start Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The application is available at `http://localhost:5173`.

### 4. Environment Setup

Create `backend/.env`:

```env
database_url=sqlite:///./adaptive_learning.db
secret_key=your-secret-key-here
algorithm=HS256
access_token_expire_minutes=10080
```

## Default Credentials

The database is seeded with test users on startup:

| Email | Password |
|-------|----------|
| `student1@university.edu` | `password123` |
| `student2@university.edu` | `password123` |
| `student3@university.edu` | `password123` |

## Project Structure

```
.
backend/
  main.py              FastAPI app, database initialization, seed data
  database.py          SQLAlchemy setup and session management
  models.py            Database models
  schemas.py           Pydantic request/response models
  auth.py             JWT authentication and password hashing
  adaptive_engine.py   AI engine: difficulty, style detection, scheduling
  routers/
    auth.py            Register, login, user profile
    courses.py         Course and lesson CRUD
    quizzes.py         Adaptive quiz engine
    progress.py        Lesson completion tracking
    schedule.py        Study schedule generation
    dashboard.py       Statistics and learning profile
  tests/
    test_adaptive_engine.py  Unit tests for AI engine

frontend/
  src/
    App.jsx            Route configuration and layout
    main.jsx           React entry point
    components/        Reusable UI components (ErrorBoundary, Layout)
    contexts/          Auth context with JWT management
    pages/             Page components (Login, Dashboard, Quiz, etc.)
    api/               Axios client configuration
  tailwind.config.js   Tailwind CSS configuration
  vite.config.js       Vite build configuration
```

## Adaptive Engine

The `adaptive_engine.py` implements three core AI capabilities:

### Difficulty Adjustment

Uses a sliding window of recent answers (default: 5). Correctly answered questions increase difficulty; incorrect ones decrease it. Response time is factored in -- fast and correct yields a larger boost, slow and incorrect causes a sharp decrease. Difficulty is clamped between 0.1 and 0.9.

**Input:** list of (correct: bool, response_time: float) tuples
**Output:** next difficulty target (float 0.1-0.9)

### Learning Style Detection

Analyzes interaction patterns to classify learners into four types:

| Style | Pattern |
|-------|---------|
| Reading/Writing | Fast response times with high accuracy |
| Auditory | Slow but consistent performance with high accuracy |
| Kinesthetic | Inconsistent timing patterns |
| Visual | Default fallback for even-paced learners |

### Spaced Repetition Scheduling

Built on the SM-2 algorithm with personalized modifications:

- **Pace multipliers**: slow (1.5x interval), medium (1.0x), fast (0.7x)
- **Difficulty factor**: incorrect answers reduce future intervals more aggressively
- **Content type weighting**: lessons and quizzes scheduled with different optimal intervals

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register a new user |
| POST | `/auth/login` | No | Login (OAuth2 form) |
| GET | `/auth/me` | Yes | Get current user profile |
| PUT | `/auth/me` | Yes | Update user profile |
| GET | `/courses` | Yes | List all courses |
| GET | `/courses/{id}` | Yes | Get course with lessons and quizzes |
| POST | `/courses` | Yes | Create a new course |
| GET | `/courses/{id}/lessons` | Yes | List course lessons |
| POST | `/courses/{id}/quizzes` | Yes | Create a quiz with questions |
| POST | `/quizzes/{id}/attempts/start` | Yes | Start an adaptive quiz attempt |
| POST | `/quizzes/attempts/{id}/answer` | Yes | Submit an answer, receive next question |
| GET | `/quizzes/attempts/{id}` | Yes | Get quiz attempt results |
| GET | `/progress` | Yes | Get learning progress |
| POST | `/progress/lesson/{id}/complete` | Yes | Mark a lesson as completed |
| GET | `/dashboard/stats` | Yes | Get dashboard statistics |
| GET | `/dashboard/profile` | Yes | Get learning profile details |
| GET | `/schedule` | Yes | List study schedule items |
| POST | `/schedule/generate/{course_id}` | Yes | Generate AI-powered study schedule |
| PUT | `/schedule/{item_id}/complete` | Yes | Mark a schedule item as complete |
| GET | `/schedule/recommendations` | Yes | Get AI-powered study recommendations |

## Development

### Backend

```bash
cd backend

# Run dev server with auto-reload
python -m uvicorn main:app --reload

# Run tests
python -m pytest tests/ -v
python test_api.py

# Syntax check
python -c "import py_compile; py_compile.compile('main.py', doraise=True)"
```

### Frontend

```bash
cd frontend

# Development server
npm run dev

# Production build
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

### Production Deployment

The frontend can be served with any static file server:

```bash
cd frontend
npm run build
python -m http.server 3000  # Serves from frontend/dist/
```

## License

MIT
