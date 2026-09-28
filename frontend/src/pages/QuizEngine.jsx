import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, Send, SkipForward, Timer, Target, Brain } from 'lucide-react';

const QuizEngine = () => {
  const { quizId, courseId } = useParams();
  const [attemptId, setAttemptId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [currentDifficulty, setCurrentDifficulty] = useState(0.5);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(null);
  const [maxScore, setMaxScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    startQuiz();
  }, [quizId]);

  const startQuiz = async () => {
    try {
      const quizRes = await api.get(`/quizzes/${quizId}`);
      setQuizTitle(quizRes.data.title);

      const initRes = await api.post(`/quizzes/${quizId}/attempts/start`);
      const { attempt_id, questions, current_difficulty } = initRes.data;

      setAttemptId(attempt_id);
      setCurrentDifficulty(current_difficulty);

      if (questions && questions.length > 0) {
        setCurrentQuestion(questions[0]);
        setSelectedOption(null);
      }
    } catch (err) {
      console.error('Failed to start quiz:', err);
      navigate(`/courses/${courseId}`);
    }
  };

  const submitAnswer = async () => {
    if (!selectedOption) return;

    setLoading(true);
    setSelectedOption(null);

    try {
      const res = await api.post(
        `/quizzes/${quizId}/attempts/${attemptId}/answer`,
        { question_id: currentQuestion.question_id, selected_answer: selectedOption }
      );

      const { question, is_complete, score: newScore, max_score, time_taken } = res.data;

      if (is_complete) {
        setIsComplete(true);
        setScore(newScore);
        setMaxScore(max_score);
        setTimeElapsed(time_taken || 0);
        setCurrentDifficulty(0.5);
      } else {
        setCurrentQuestion(question);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setLoading(false);
    }
  };

  const restartQuiz = () => {
    setIsComplete(false);
    setScore(null);
    setMaxScore(0);
    setSelectedOption(null);
    setCurrentQuestion(null);
    setAttemptId(null);
    startQuiz();
  };

  if (!attemptId && !currentQuestion && !isComplete) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-center py-12">
          <Brain className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading adaptive quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Link
        to={`/courses/${courseId}`}
        className="text-sm text-slate-400 hover:text-white mb-4 inline-flex items-center gap-1 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Course
      </Link>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-white">{quizTitle}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Timer className="w-4 h-4" />
            <span>Elapsed: {Math.floor(timeElapsed)}s</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Target className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-500">Current difficulty:</span>
          <div className="relative w-24 h-3 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${currentDifficulty * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-white">{Math.round(currentDifficulty * 100)}%</span>
        </div>
      </div>

      {isComplete ? (
        <div className="glass-card p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
          <p className="text-3xl text-indigo-400 font-bold mb-6">
            Score: {score} / {maxScore} ({maxScore > 0 ? Math.round((score / maxScore) * 100) : 0}%)
          </p>
          <button
            onClick={restartQuiz}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02]"
          >
            Retake Quiz
          </button>
        </div>
      ) : currentQuestion ? (
        <div className="glass-card p-6">
          <h2 className="text-lg font-medium text-white mb-6">{currentQuestion.question_text}</h2>

          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOption(option)}
                disabled={loading}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selectedOption === option
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-white/10 text-slate-300 hover:border-indigo-500/50 hover:bg-white/5'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {currentQuestion.explanation && (
            <details className="mb-4">
              <summary className="text-sm text-slate-500 cursor-pointer hover:text-white">
                Show explanation
              </summary>
              <p className="text-sm text-slate-400 mt-2">{currentQuestion.explanation}</p>
            </details>
          )}

          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all flex items-center gap-1"
            >
              <SkipForward className="w-4 h-4" /> Skip Quiz
            </button>
            <button
              onClick={submitAnswer}
              disabled={loading || !selectedOption}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400">No more questions available.</p>
        </div>
      )}
    </div>
  );
};

export default QuizEngine;
