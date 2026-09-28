import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, FileText, Play, CheckCircle, Clock } from 'lucide-react';

const LessonView = () => {
  const { courseId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/courses/${courseId}/lessons/${lessonId}`)
      .then(res => setLesson(res.data))
      .catch(() => navigate(`/courses/${courseId}`))
      .finally(() => {
        api.get('/quizzes', { params: { course_id: parseInt(courseId) } })
          .then(qRes => {
            const lessonQuiz = qRes.data.filter(q => q.lesson_id == lessonId);
            setQuizzes(lessonQuiz);
          })
          .catch(() => setQuizzes([]))
          .finally(() => setLoading(false));
      });
  }, [courseId, lessonId, navigate]);

  const markComplete = async () => {
    setMarking(true);
    try {
      await api.post(`/progress/${lessonId}/complete`);
    } catch (err) {
      console.error('Failed to mark complete:', err);
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-slate-700/50 rounded-xl w-1/4"></div>
        <div className="h-8 bg-slate-700/50 rounded-xl w-3/4"></div>
        <div className="space-y-3">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-700/50 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="animate-fade-in">
      <Link
        to={`/courses/${courseId}`}
        className="text-sm text-slate-400 hover:text-white mb-4 inline-flex items-center gap-1 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Course
      </Link>

      <div className="glass-card p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-bold text-white">{lesson.title}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Clock className="w-4 h-4" />
          <span>Duration: {lesson.duration_minutes} minutes</span>
        </div>
        <div className="prose prose-invert max-w-none">
          {lesson.content.split('\n').map((line, i) => (
            <p key={i} className="text-slate-300 mb-4 leading-relaxed">{line}</p>
          ))}
        </div>
      </div>

      {quizzes.length > 0 && quizzes.map((quiz) => (
        <div key={quiz.id} className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{quiz.title}</h3>
              <p className="text-sm text-slate-500 mt-1">
                Time limit: {quiz.time_limit_seconds ? `${Math.floor(quiz.time_limit_seconds / 60)} min` : 'None'}
              </p>
            </div>
            <Link
              to={`/courses/${courseId}/quizzes/${quiz.id}`}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 transform hover:scale-[1.02]"
            >
              <Play className="w-4 h-4" /> Start Quiz
            </Link>
          </div>
        </div>
      ))}

      <button
        onClick={markComplete}
        disabled={marking}
        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 mx-auto disabled:opacity-50"
      >
        {marking ? 'Marking...' : <><CheckCircle className="w-5 h-5" /> Mark Lesson as Complete</>}
      </button>
    </div>
  );
};

export default LessonView;
