import { useState, useEffect } from 'react';
import api from '../api/client';
import { TrendingUp, Award, Clock, Brain, BarChart3 } from 'lucide-react';

const Progress = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses')
      .then(coursesRes => {
        const courseIds = coursesRes.data.map(c => c.id);
        return Promise.all(
          courseIds.map(cid => api.get(`/quizzes?course_id=${cid}`))
        );
      })
      .then(quizzesResults => {
        const allQuizIds = quizzesResults.flatMap(r => r.data).map(q => q.id);
        return Promise.all(
          allQuizIds.map(qid => api.get(`/quizzes/${qid}/attempts`))
        );
      })
      .then(attemptsResults => {
        const allAttempts = attemptsResults.flatMap(r => r.data || []);
        setAttempts(allAttempts);
      })
      .catch(err => console.error('Error:', err))
      .finally(() => setLoading(false));
  }, []);

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
    : 0;
  const avgTime = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.time_taken || 0), 0) / attempts.length)
    : 0;
  const accuracy = attempts.length > 0
    ? Math.round((attempts.filter(a => a.score && a.max_score && a.score / a.max_score > 0.7).length / attempts.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-700/50 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Progress</h1>
        <p className="text-slate-400">Track your learning journey and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">{attempts.length}</p>
              <p className="text-sm text-slate-500">Quiz Attempts</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            <div>
              <p className="text-2xl font-bold text-white">{avgScore}</p>
              <p className="text-sm text-slate-500">Avg Score</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-orange-400" />
            <div>
              <p className="text-2xl font-bold text-white">{avgTime}s</p>
              <p className="text-sm text-slate-500">Avg Time</p>
            </div>
          </div>
        </div>
       <div className="glass-card p-4">
         <div className="flex items-center gap-3">
           <Brain className="w-6 h-6 text-purple-400" />
           <div>
             <p className="text-2xl font-bold text-white">{accuracy}%</p>
             <p className="text-sm text-slate-500">Accuracy</p>
           </div>
         </div>
       </div>
     </div>

     {/* Charts Section */}
     {attempts.length > 0 && (
       <div className="mb-8">
         <h2 className="text-xl font-semibold text-white mb-6">Progress Trends</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Score Trend Chart */}
           <div className="glass-card p-6">
             <h3 className="font-semibold text-white mb-4">Score Trend</h3>
             <div className="h-48">
               <svg className="w-full h-full">
                 {/* Score Trend Line Chart */}
                 {attempts.length > 1 && (
                   <>
                     {/* X-axis labels (dates) */}
                     {attempts.map((attempt, index) => (
                       <text
                         key={attempt.id}
                         x={50 + index * 80}
                         y={450}
                         textAnchor="middle"
                         fontSize="10"
                         fill="text-slate-400"
                       >
                         {new Date(attempt.completed_at).toLocaleDateString()}
                       </text>
                     ))}
                     
                     {/* Y-axis labels */}
                     {[20, 40, 60, 80, 100].map((score) => (
                       <text
                         key={score}
                         x={20}
                         y={400 - (score * 3.5)}
                         textAnchor="end"
                         fontSize="10"
                         fill="text-slate-400"
                       >
                         {score}%
                       </text>
                     ))}
                     
                     {/* Trend line */}
                     <polyline
                       points={attempts
                         .map((attempt, index) => {
                           const scorePct = attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0;
                           return `${50 + index * 80},${400 - (scorePct * 3.5)}`;
                         })
                         .join(' ')}
                       fill="none"
                       stroke="text-indigo-400"
                       strokeWidth="2"
                     />
                     
                     {/* Points */}
                     {attempts.map((attempt, index) => {
                       const scorePct = attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0;
                       return (
                         <circle
                           key={attempt.id}
                           cx={50 + index * 80}
                           cy={400 - (scorePct * 3.5)}
                           r="4"
                           fill="text-indigo-400"
                         />
                       );
                     })}
                   </>
                 )}
               </svg>
             </div>
           </div>
           
           {/* Accuracy Trend Chart */}
           <div className="glass-card p-6">
             <h3 className="font-semibold text-white mb-4">Accuracy Trend</h3>
             <div className="h-48">
               <svg className="w-full h-full">
                 {/* Accuracy Trend Bar Chart */}
                 {attempts.length > 0 && (
                   <>
                     {/* X-axis labels (attempt numbers) */}
                     {attempts.map((attempt, index) => (
                       <text
                         key={attempt.id}
                         x={30 + index * 60}
                         y={450}
                         textAnchor="middle"
                         fontSize="10"
                         fill="text-slate-400"
                       >
                         Attempt {index + 1}
                       </text>
                     ))}
                     
                     {/* Y-axis labels */}
                     {[0, 25, 50, 75, 100].map((score) => (
                       <text
                         key={score}
                         x={15}
                         y={400 - (score * 3.5)}
                         textAnchor="end"
                         fontSize="10"
                         fill="text-slate-400"
                       >
                         {score}%
                       </text>
                     ))}
                     
                     {/* Accuracy bars */}
                     {attempts.map((attempt, index) => {
                       const scorePct = attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0;
                       const barHeight = scorePct * 3.5;
                       return (
                         <rect
                           key={attempt.id}
                           x={25 + index * 60}
                           y={400 - barHeight}
                           width="25"
                           height={barHeight}
                           fill="text-indigo-400"
                         />
                       );
                     })}
                   </>
                 )}
               </svg>
             </div>
           </div>
         </div>
       </div>
     )}

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Recent Quiz Attempts</h2>
        {attempts.length > 0 ? (
          <div className="space-y-3">
            {attempts.map((attempt) => {
              const scorePct = attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0;
              const scoreColor = scorePct > 70 ? 'text-green-400' : scorePct > 50 ? 'text-orange-400' : 'text-red-400';
              return (
                <div key={attempt.id} className="glass-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Quiz #{attempt.quiz_id}</p>
                        <p className="text-sm text-slate-500">
                          {attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString() : 'In progress'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">
                        {attempt.score} / {attempt.max_score}
                      </p>
                      <p className={`text-sm ${scoreColor} font-medium`}>{scorePct}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No quiz attempts yet. Start a quiz to see your progress!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;
