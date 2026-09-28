from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from models import User, LearningProfile, Course, Lesson, Quiz, Question, UserProgress, StudySchedule
from routers import auth, courses, quizzes, progress as progress_router, schedule as schedule_router, dashboard
from auth import get_password_hash
from datetime import datetime, timedelta
import json
import random

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Powered Adaptive Learning Platform",
    description="A personalized learning platform that adapts content, quizzes, and study schedules to each student's learning pace, preferred style, and performance data.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(quizzes.router)
app.include_router(progress_router.router)
app.include_router(schedule_router.router)
app.include_router(dashboard.router)

def seed_database():
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return

        users = [
            User(
                email=f"student{i}@university.edu",
                name=f"Student {i}",
                password_hash=get_password_hash("password123"),
                learning_pace=random.choice(["slow", "medium", "fast"]),
                preferred_style=random.choice(["visual", "auditory", "reading_writing", "kinesthetic"]),
            )
            for i in range(1, 4)
        ]
        for u in users:
            db.add(u)
        db.commit()

        for user in users:
            profile = LearningProfile(
                user_id=user.id,
                detected_style=user.preferred_style,
                style_confidence=0.5,
                preferred_difficulty=0.5,
            )
            db.add(profile)
        db.commit()

        course = Course(
            title="Introduction to Computer Science",
            code="CS101",
            description="Fundamentals of programming, algorithms, and data structures.",
            category="Computer Science",
            instructor="Dr. Alice Chen",
        )
        db.add(course)
        db.commit()

        lessons = []
        for i in range(1, 6):
            lesson = Lesson(
                course_id=course.id,
                title=f"Lesson {i}: {'Variables and Data Types' if i==1 else f'Topic {i}'}",
                content=f"This lesson covers core concepts for topic {i}. Students will learn through interactive examples and adaptive quizzes.",
                content_type=f"lesson",
                order_index=i,
                duration_minutes=15,
            )
            db.add(lesson)
            lessons.append(lesson)
        db.commit()

        quiz = Quiz(
            course_id=course.id,
            lesson_id=lessons[0].id,
            title="Variables and Data Types Quiz",
            max_difficulty=1.0,
            time_limit_seconds=300,
        )
        db.add(quiz)
        db.commit()

        questions = [
            Question(
                quiz_id=quiz.id,
                question_text="Which of the following is NOT a valid Python variable name?",
                options=json.dumps(["1var", "_var", "var1", "var_1"]),
                correct_answer="1var",
                difficulty_level=0.1,
                topic="variables",
                explanation="Variable names cannot start with a digit.",
            ),
            Question(
                quiz_id=quiz.id,
                question_text="What is the output of: print(type(5))?",
                options=json.dumps(["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'bool'>"]),
                correct_answer="<class 'int'>",
                difficulty_level=0.2,
                topic="data_types",
                explanation="5 is an integer literal in Python.",
            ),
            Question(
                quiz_id=quiz.id,
                question_text="Which operator is used to compare two values for equality?",
                options=json.dumps(["=", "==", "!=", "==="]),
                correct_answer="==",
                difficulty_level=0.3,
                topic="operators",
                explanation="'==' checks equality, '=' is assignment.",
            ),
            Question(
                quiz_id=quiz.id,
                question_text="What does the 'len()' function return for a string?",
                options=json.dumps(["Character count", "Byte size", "First character", "Memory address"]),
                correct_answer="Character count",
                difficulty_level=0.4,
                topic="functions",
                explanation="len() returns the number of items in a container.",
            ),
            Question(
                quiz_id=quiz.id,
                question_text="In Python, which data structure is mutable and ordered?",
                options=json.dumps(["Tuple", "String", "List", "FrozenSet"]),
                correct_answer="List",
                difficulty_level=0.5,
                topic="data_structures",
                explanation="Lists are mutable and maintain insertion order.",
            ),
            Question(
                quiz_id=quiz.id,
                question_text="What is the result of: 15 % 4?",
                options=json.dumps(["3", "4", "15", "1"]),
                correct_answer="3",
                difficulty_level=0.6,
                topic="operators",
                explanation="15 % 4 gives the remainder: 15 = 3*4 + 3.",
            ),
            Question(
                quiz_id=quiz.id,
                question_text="Which of these is a valid list comprehension?",
                options=json.dumps(["[x for x in range(5)]", "[for x in range(5)]", "(x for x in range(5))", "x for x in range(5)"]),
                correct_answer="[x for x in range(5)]",
                difficulty_level=0.7,
                topic="comprehensions",
                explanation="List comprehensions use square brackets with for loops.",
            ),
            Question(
                quiz_id=quiz.id,
                question_text="What is the correct way to open a file 'data.txt' for reading?",
                options=json.dumps(["open('data.txt', 'w')", "open('data.txt', 'r')", "open('data.txt', 'a')", "open('data.txt', 'x')"]),
                correct_answer="open('data.txt', 'r')",
                difficulty_level=0.8,
                topic="file_io",
                explanation="'r' mode opens for reading.",
            ),
        ]
        for q in questions:
            db.add(q)
        db.commit()

        print(f"Seeded: {len(users)} users, 1 course, {len(lessons)} lessons, 1 quiz, {len(questions)} questions")
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    seed_database()

@app.get("/")
def root():
    return {"message": "AI-Powered Adaptive Learning Platform", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
