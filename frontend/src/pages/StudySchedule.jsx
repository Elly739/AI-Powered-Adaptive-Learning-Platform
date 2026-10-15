import { useState, useEffect } from 'react';
import api from '../api/client';
import { BookOpen, Play, Lightbulb, CheckCircle, Calendar, List, ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { format, isToday, isTomorrow, startOfMonth, endOfMonth, eachDayOfInterval, addMonths } from 'date-fns';

const StudySchedule = () => {
  const [scheduleItems, setScheduleItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');
  const [viewType, setViewType] = useState('list'); // 'list' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

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

  // Calendar view helpers
  const getScheduleForDate = (date) => {
    return scheduleItems.filter(
      item => !item.completed && 
      startOfMonth(new Date(item.recommended_date)).getTime() === startOfMonth(date).getTime() &&
      format(new Date(item.recommended_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const daysInMonth = (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  };

  const previousMonth = () => {
    setCurrentMonth(prev => addMonths(prev, -1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white mb-0">Upcoming</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={previousMonth}
                className="p-2 bg-slate-700/50 rounded-hover hover:bg-slate-700/70 transition-colors"
                disabled={viewType !== 'calendar'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-white">{format(currentMonth, 'MMMM yyyy')}</span>
              <button
                onClick={nextMonth}
                className="p-2 bg-slate-700/50 rounded-hover hover:bg-slate-700/70 transition-colors"
                disabled={viewType !== 'calendar'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 ml-4">
                <Calendar className="w-4 h-4" />
                <button
                  onClick={() => setViewType(viewType === 'calendar' ? 'list' : 'calendar')}
                  className={`text-sm font-medium text-slate-400 hover:text-white transition-colors ${
                    viewType === 'calendar' ? 'text-indigo-400' : ''
                  }`}
                >
                  {viewType === 'calendar' ? 'List View' : 'Calendar View'}
                </button>
              </div>
            </div>
          </div>

          {viewType === 'calendar' ? (
            <div className="grid grid-cols-7 gap-2 mb-6">
              {/* Weekday headers */}
              {[...Array(7)].map((_, i) => (
                <div key={i} className="text-center font-medium text-slate-400">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
                </div>
              ))}
              {/* Calendar days */}
              {daysInMonth(currentMonth).map((day) => {
                const isCurrentMonth = startOfMonth(day).getTime() === startOfMonth(currentMonth).getTime();
                const today = isToday(day);
                const scheduleForDay = getScheduleForDate(day);
                const hasSchedule = scheduleForDay.length > 0;
                
                return (
                  <div 
                    key={day} 
                    className={`min-h-20 rounded-xl p-3 cursor-pointer transition-all ${
                      !isCurrentMonth ? 'opacity-50' : ''
                      } ${today ? 'border-2 border-indigo-400' : ''} ${hasSchedule ? 'bg-indigo-500/20' : 'bg-slate-700/20'} hover:bg-slate-700/30`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-white">{format(day, 'd')}</div>
                      {hasSchedule && (
                        <div className="flex items-center gap-1 text-xs">
                          <Circle className="w-2 h-2 text-indigo-400" />
                          <span>{scheduleForDay.length}</span>
                        </div>
                      )}
                    </div>
                    
                    {hasSchedule && (
                      <div className="space-y-1 text-xs">
                        {scheduleForDay.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex items-center gap-1">
                            {item.content_type === 'lesson' ? (
                              <BookOpen className="w-3 h-3 text-indigo-400" />
                            ) : item.content_type === 'quiz' ? (
                              <Play className="w-3 h-3 text-indigo-400" />
                            ) : (
                              <Lightbulb className="w-3 h-3 text-indigo-400" />
                            )}
                            <span className="text-indigo-300">{item.content_type}</span>
                          </div>
                        ))}
                        {scheduleForDay.length > 3 && (
                          <div className="text-indigo-400">+{scheduleForDay.length - 3} more</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Original list view
            upcoming.length > 0 ? (
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
            )
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
