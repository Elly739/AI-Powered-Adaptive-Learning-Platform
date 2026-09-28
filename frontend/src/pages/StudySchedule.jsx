import { useState, useEffect } from 'react';
import api from '../api/client';
import { BookOpen, Play, Lightbulb, CheckCircle } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';

const StudySchedule = () => {
  const [scheduleItems, setScheduleItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [scheduleRes, recRes] = await Promise.all([
        api.get('/schedule'),
        api.get('/schedule/recommendations'),
      ]);
      setScheduleItems(scheduleRes.data);
      setRecommendations(recRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (itemId) => {
    try {
      await api.put(`/schedule/${itemId}/complete`);
      setScheduleItems(items => items.map(item =>
        item.id === itemId ? { ...item, completed: true } : item
      ));
    } catch (err) {
      console.error('Failed to mark complete:', err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const upcoming = scheduleItems.filter(item => !item.completed && new Date(item.recommended_date) >= new Date(new Date().setHours(0, 0, 0, 0)));
  const past = scheduleItems.filter(item => item.completed);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded-xl w-1/3"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-700/50 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Study Schedule</h1>
        <p className="text-slate-400">AI-generated schedule based on your pace and progress</p>
      </div>

      <div className="flex gap-6 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'schedule'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-500 hover:text-white'
          }`}
        >
          Schedule
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'recommendations'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-500 hover:text-white'
          }`}
        >
          AI Recommendations
        </button>
      </div>

      {activeTab === 'schedule' ? (
        <>
          <h2 className="text-xl font-semibold text-white mb-4">Upcoming</h2>
          {upcoming.length > 0 ? (
            <div className="space-y-3 mb-8">
              {upcoming.map((item) => {
                const Icon = item.content_type === 'lesson' ? BookOpen : item.content_type === 'quiz' ? Play : Lightbulb;
                return (
                  <div key={item.id} className="glass-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <span className="font-medium text-white capitalize">{item.content_type}</span>
                        <p className="text-sm text-slate-500">
                          {formatDate(item.recommended_date)} • {item.scheduled_time_minutes} mins
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => markComplete(item.id)}
                      className="px-3 py-1 bg-green-500/20 text-green-400 rounded-xl text-sm hover:bg-green-500/30 transition-colors"
                    >
                      Complete
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 mb-6">No upcoming study items. Add more courses to generate a schedule!</p>
          )}

          {past.length > 0 && (
            <>
              <h2 className="text-xl font-semibold text-white mb-4">Completed</h2>
              <div className="space-y-3">
                {past.slice(0, 5).map((item) => {
                  const Icon = item.content_type === 'lesson' ? BookOpen : item.content_type === 'quiz' ? Play : Lightbulb;
                  return (
                    <div key={item.id} className="glass-card p-4 opacity-70">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-600/20 to-slate-500/20 rounded-xl flex items-center justify-center">
                          <Icon className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <span className="font-medium text-white capitalize">{item.content_type}</span>
                          <p className="text-sm text-slate-500">
                            Completed {formatDate(item.recommended_date)} • {item.scheduled_time_minutes} mins
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-white mb-4">AI-Powered Recommendations</h2>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="glass-card p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-white capitalize">{rec.type} recommendation</h3>
                      {rec.topic && <p className="text-sm text-slate-500 mt-1"><strong>Topic:</strong> {rec.topic}</p>}
                      <p className="text-sm text-slate-400 mt-1">{rec.reason}</p>
                      {rec.learning_style_match && (
                        <p className="text-xs text-indigo-400 mt-1">Matched style: {rec.learning_style_match}</p>
                      )}
                      {rec.date && <p className="text-xs text-slate-500 mt-1">Scheduled: {formatDate(rec.date)}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No recommendations available yet. Complete more quizzes to get personalized recommendations.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudySchedule;
