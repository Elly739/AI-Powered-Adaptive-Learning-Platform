# AGENTS.md - Project Configuration Guide

## Backend (Python/FastAPI)

### Running the server
```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Lint
No dedicated linter configured for backend. Use Python's built-in checking:
```bash
cd backend
python -c "import py_compile; py_compile.compile('main.py', doraise=True)"
```

### Type checking
```bash
cd backend
python -c "import ast; ast.parse(open('main.py').read())"
```

### Tests
```bash
cd backend
python -m pytest tests/ -v
python test_api.py
```

## Frontend (React/Vite)

### Development
```bash
cd frontend
npm run dev
```

### Build (production)
```bash
npm run build
```

### Lint
```bash
cd frontend
npm run lint
```

### Type checking
No TypeScript configured for frontend. Use ESLint for static analysis.

### Preview production build
```bash
cd frontend
npm run preview
```

## Environment Variables

Backend (`.env` in `backend/`):
```
database_url=sqlite:///./adaptive_learning.db
secret_key=your-secret-key-here
algorithm=HS256
access_token_expire_minutes=10080
```

## Port References
- Backend API: http://127.0.0.1:8000
- Frontend dev: http://localhost:5173
- API docs: http://127.0.0.1:8000/docs
