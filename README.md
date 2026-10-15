# AI-Powered Adaptive Learning Platform

![CI/CD Pipeline](https://github.com/Elly739/AI-Powered-Adaptive-Learning-Platform/actions/workflows/main.yml/badge.svg)

A web platform that personalizes course content, practice quizzes, and study schedules using AI, based on each student's learning pace, preferred style, and performance data.

## Features

- **Adaptive Quiz Engine** – Difficulty adjusts in real-time based on correctness and response time
- **Learning Style Detection** – Identifies visual, auditory, reading/writing, or kinesthetic preferences
- **Spaced Repetition Scheduling** – SM-2 algorithm generates personalized study plans
- **Progress Tracking** – Dashboard with learning statistics and performance analytics
- **JWT Authentication** – Secure login with token-based session management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, SQLAlchemy, SQLite, bcrypt, JWT |
| Frontend | React 18, Vite, Tailwind CSS, React Router, Lucide Icons |
| Testing | pytest, Vitest, React Testing Library, Playwright |

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
API docs: http://127.0.0.1:8000/docs

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:5173

### 4. Environment
Create `backend/.env`:
```
database_url=sqlite:///./adaptive_learning.db
secret_key=your-secret-key-here
algorithm=HS256
access_token_expire_minutes=10080
```

### Default Credentials (seeded on startup)
| Email | Password |
|-------|----------|
| student1@university.edu | password123 |
| student2@university.edu | password123 |
| student3@university.edu | password123 |

## How the AI Works

The adaptive engine (`backend/adaptive_engine.py`) implements three core algorithms:

### 1. Difficulty Adjustment
- Sliding window of last 5 answers
- Accuracy = correct / total
- Response time factored: fast correct → ↑ difficulty, slow/wrong → ↓ difficulty
- Difficulty clamped between 0.1–0.9

### 2. Learning Style Detection
Requires ≥5 answers:
- **Fast & Accurate** (avg response <6s, accuracy >70%) → Reading/Writing
- **Slow but Accurate** (avg response >10s, accuracy >70%, consistent timing) → Auditory
- **Inconsistent Timing** (high response time std dev) → Kinesthetic
- **Default** → Visual
Returns style + confidence score (0.3–0.95)

### 3. Spaced Repetition Scheduling (SM-2 variant)
- For each incomplete lesson: base interval based on accuracy, multiplied by pace (slow:1.5×, medium:1.0×, fast:0.7×)
- Schedules lesson → quiz 1 day later
- For previously completed but weak lessons: practice items with 7-day interval adjusted by preferred difficulty

## Project Structure (key files)
```
.
├── backend/
│   ├── main.py               # FastAPI app, DB init, seed data
│   ├── adaptive_engine.py    # Core AI: difficulty, style, scheduling
│   ├── models.py             # DB models (User, Course, Lesson, Quiz, etc.)
│   ├── routers/              # API routers (auth, courses, quizzes, etc.)
│   └── tests/                # 30 unit tests for adaptive engine
└── frontend/
    ├── src/
    │   ├── pages/            # Login, Register, Dashboard, CourseList, etc.
    │   └── api/client.js     # Axios instance with auth interceptor
    ├── vitest.config.js      # Unit test config
    └── playwright.config.js  # E2E test config
```

## API Endpoints (selected)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register |
| POST | `/auth/login` | No | Login |
| GET | `/courses` | Yes | List courses |
| POST | `/quizzes/{id}/attempts/start` | Yes | Start adaptive quiz |
| POST | `/quizzes/attempts/{id}/answer` | Yes | Submit answer (includes response_time) |
| GET | `/progress` | Yes | Learning progress |
| GET | `/dashboard/stats` | Yes | Dashboard statistics |
| POST | `/schedule/generate/{course_id}` | Yes | Generate study schedule |
| GET | `/schedule/recommendations` | Yes | AI recommendations |

## Development

### Backend
```bash
cd backend
python -m uvicorn main:app --reload   # dev server
python -m pytest tests/ -v            # run tests
```

### Frontend
```bash
cd frontend
npm run dev                           # dev server
npm run test                          # unit tests (Vitest)
npm run test:e2e                      # E2E tests (Playwright)
npm run build                         # production build
```

## Testing
- **Backend**: 30+ unit tests covering adaptive algorithms (see `backend/tests/test_adaptive_engine.py`)
- **Frontend**: Unit tests with Vitest + React Testing Library (under `frontend/src/__tests__/`)
- **E2E**: Playwright tests (under `frontend/tests/`)

## CI/CD
GitHub Actions workflow (`.github/workflows/main.yml`) runs on push/PR to `main`/`develop`:
- Installs dependencies
- Runs backend tests (pytest)
- Installs Playwright browsers
- Runs frontend unit tests (Vitest) with coverage
- Runs frontend E2E tests (Playwright)
- Builds frontend for production
- Lints frontend with ESLint
- Uploads build artifact

## License
MIT