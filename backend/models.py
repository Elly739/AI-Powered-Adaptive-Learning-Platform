from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum

class LearningStyle(str, enum.Enum):
    VISUAL = "visual"
    AUDITORY = "auditory"
    READING_WRITING = "reading_writing"
    KINESTHETIC = "kinesthetic"

class LearningPace(str, enum.Enum):
    SLOW = "slow"
    MEDIUM = "medium"
    FAST = "fast"

class ContentType(str, enum.Enum):
    LESSON = "lesson"
    QUIZ = "quiz"
    VIDEO = "video"
    PRACTICE = "practice"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    learning_pace = Column(String, default=LearningPace.MEDIUM.value)
    preferred_style = Column(String, default=LearningStyle.VISUAL.value)
    created_at = Column(DateTime, default=datetime.utcnow)

    progress_records = relationship("UserProgress", back_populates="user")
    quiz_attempts = relationship("QuizAttempt", back_populates="user")
    schedule_items = relationship("StudySchedule", back_populates="user")
    learning_profile = relationship("LearningProfile", back_populates="user", uselist=False)

class LearningProfile(Base):
    __tablename__ = "learning_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    avg_response_time = Column(Float, default=0.0)
    accuracy_rate = Column(Float, default=0.0)
    style_confidence = Column(Float, default=0.0)
    detected_style = Column(String, default=LearningStyle.VISUAL.value)
    preferred_difficulty = Column(Float, default=0.5)
    last_updated = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="learning_profile")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    code = Column(String, unique=True, index=True)
    description = Column(Text)
    category = Column(String)
    instructor = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="course", cascade="all, delete-orphan")
    progress_records = relationship("UserProgress", back_populates="course")
    schedule_items = relationship("StudySchedule", back_populates="course")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String, nullable=False)
    content = Column(Text)
    content_type = Column(String, default=ContentType.LESSON.value)
    order_index = Column(Integer, default=0)
    duration_minutes = Column(Integer, default=10)

    course = relationship("Course", back_populates="lessons")
    quizzes = relationship("Quiz", back_populates="lesson", cascade="all, delete-orphan")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    title = Column(String, nullable=False)
    max_difficulty = Column(Float, default=1.0)
    time_limit_seconds = Column(Integer, default=600)

    course = relationship("Course", back_populates="quizzes")
    lesson = relationship("Lesson", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    question_text = Column(Text, nullable=False)
    options = Column(Text)
    correct_answer = Column(String, nullable=False)
    difficulty_level = Column(Float, default=0.5)
    topic = Column(String)
    explanation = Column(Text)

    quiz = relationship("Quiz", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    score = Column(Float)
    max_score = Column(Float)
    time_taken = Column(Float)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="quiz_attempts")
    quiz = relationship("Quiz", back_populates="attempts")
    answers = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    selected_answer = Column(String)
    is_correct = Column(Boolean)
    response_time = Column(Float)

    question = relationship("Question", back_populates="answers")
    attempt = relationship("QuizAttempt", back_populates="answers")

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    completed = Column(Boolean, default=False)
    progress_percent = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress_records")
    course = relationship("Course", back_populates="progress_records")

class StudySchedule(Base):
    __tablename__ = "study_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    content_type = Column(String, default=ContentType.LESSON.value)
    content_id = Column(Integer)
    recommended_date = Column(DateTime)
    scheduled_time_minutes = Column(Integer, default=30)
    completed = Column(Boolean, default=False)

    user = relationship("User", back_populates="schedule_items")
    course = relationship("Course", back_populates="schedule_items")
