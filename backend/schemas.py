from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

class LearningStyle(str, Enum):
    VISUAL = "visual"
    AUDITORY = "auditory"
    READING_WRITING = "reading_writing"
    KINESTHETIC = "kinesthetic"

class LearningPace(str, Enum):
    SLOW = "slow"
    MEDIUM = "medium"
    FAST = "fast"

class ContentType(str, Enum):
    LESSON = "lesson"
    QUIZ = "quiz"
    VIDEO = "video"
    PRACTICE = "practice"

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None

class UserBase(BaseModel):
    email: str
    name: str
    learning_pace: LearningPace = LearningPace.MEDIUM
    preferred_style: LearningStyle = LearningStyle.VISUAL

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    learning_pace: Optional[LearningPace] = None
    preferred_style: Optional[LearningStyle] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class LearningProfileBase(BaseModel):
    avg_response_time: float = 0.0
    accuracy_rate: float = 0.0
    detected_style: LearningStyle = LearningStyle.VISUAL
    preferred_difficulty: float = 0.5

class LearningProfileResponse(LearningProfileBase):
    id: int
    user_id: int
    style_confidence: float
    last_updated: datetime

    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    title: str
    code: str
    description: Optional[str] = None
    category: Optional[str] = None
    instructor: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: int
    created_at: datetime
    lessons: List["LessonResponse"] = []
    quizzes: List["QuizResponse"] = []

    class Config:
        from_attributes = True

class CourseDetailResponse(CourseResponse):
    pass

class LessonBase(BaseModel):
    title: str
    content: str
    content_type: ContentType = ContentType.LESSON
    order_index: int = 0
    duration_minutes: int = 10

class LessonCreate(LessonBase):
    pass

class LessonResponse(LessonBase):
    id: int
    course_id: int

    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    question_text: str
    options: List[str]
    correct_answer: str
    difficulty_level: float = Field(default=0.5, ge=0.0, le=1.0)
    topic: Optional[str] = None
    explanation: Optional[str] = None

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: int
    quiz_id: int

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        if obj.options:
            try:
                options = eval(obj.options)
                if not isinstance(options, list):
                    options = [str(obj.options)]
            except:
                options = [obj.options]
        else:
            options = []
        return cls(
            id=obj.id,
            quiz_id=obj.quiz_id,
            question_text=obj.question_text,
            options=options,
            correct_answer=obj.correct_answer,
            difficulty_level=obj.difficulty_level,
            topic=obj.topic,
            explanation=obj.explanation,
        )

class QuizBase(BaseModel):
    title: str
    time_limit_seconds: int = 600

class QuizCreate(QuizBase):
    questions: List[QuestionCreate] = []

class QuizResponse(QuizBase):
    id: int
    course_id: int
    lesson_id: Optional[int]
    max_difficulty: float

    class Config:
        from_attributes = True

class AnswerSubmit(BaseModel):
    question_id: int
    selected_answer: str
    response_time: Optional[float] = None

class QuizAttemptStart(BaseModel):
    quiz_id: int

class QuizAttemptResponse(BaseModel):
    id: int
    user_id: int
    quiz_id: int
    score: Optional[float]
    max_score: Optional[float]
    time_taken: Optional[float]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

class AdaptiveQuestion(BaseModel):
    question_id: int
    question_text: str
    options: List[str]
    difficulty_level: float
    topic: Optional[str]
    explanation: Optional[str]

class AdaptiveQuizInitResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    questions: List[AdaptiveQuestion]
    current_difficulty: float

class AdaptiveQuizNextResponse(BaseModel):
    attempt_id: int
    question: Optional[AdaptiveQuestion]
    is_complete: bool
    score: Optional[float]
    max_score: float
    time_taken: Optional[float]

class ScheduleItemResponse(BaseModel):
    id: int
    user_id: int
    course_id: int
    content_type: ContentType
    content_id: Optional[int]
    recommended_date: datetime
    scheduled_time_minutes: int
    completed: bool

    class Config:
        from_attributes = True

class UserProgressResponse(BaseModel):
    id: int
    user_id: int
    course_id: int
    lesson_id: Optional[int]
    completed: bool
    progress_percent: float
    updated_at: datetime

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_courses: int
    courses_in_progress: int
    avg_quiz_score: Optional[float]
    streak_days: int
    next_study: Optional[ScheduleItemResponse]
    recent_activity: List[dict] = []

CourseResponse.model_rebuild()
