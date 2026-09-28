import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { BookOpen, TrendingUp, Award, Clock, Calendar } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, coursesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/courses'),
      ]);
      setStats(statsRes.data);
      setCourses(coursesRes.data.slice(0, 6));
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-700/50 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-700/50 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Courses Enrolled',
      value: stats?.total_courses || 0,
      icon: BookOpen,
      gradient: 'from-indigo-500/20 to-purple-500/20',
      iconColor: 'text-indigo-400',
    },
    {
      label: 'In Progress',
      value: stats?.courses_in_progress || 0,
      icon: TrendingUp,
      gradient: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
    },
    {
      label: 'Avg Quiz Score',
      value: `${stats?.avg_quiz_score || 0}%`,
      icon: Award,
      gradient: 'from-green-500/20 to-emerald-500/20',
      iconColor: 'text-green-400',
    },
    {
      label: 'Study Streak',
      value: `${stats?.streak_days || 0} days`,
      icon: Clock,
      gradient: 'from-orange-500/20 to-amber-500/20',
      iconColor: 'text-orange-400',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">
          Welcome back, {stats?.detected_style ? 'Learner' : 'Learner'}!
        </h1>
        <p className="text-slate-400">Your AI-powered adaptive learning dashboard</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`glass-card p-5 bg-gradient-to-br ${card.gradient}`}>
              <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
                <span className="text-sm text-slate-400 font-medium">{card.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{card.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold text-white">Learning Profile</h2>
          <div className="glass-card p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-sm text-slate-400 mb-1 block">Detected Learning Style</span>
                <p className="text-lg font-semibold text-white capitalize">
                  {stats?.detected_style || 'Loading...'}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Confidence</span>
                    <span>{Math.round((stats?.style_confidence || 0) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${(stats?.style_confidence || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <span className="text-sm text-slate-400 mb-1 block">Learning Pace</span>
                <p className="text-lg font-semibold text-white capitalize">
                  {stats?.learning_pace || 'Medium'}
                </p>
                <div className="mt-3">
                  <span className="text-sm text-slate-400 block mb-1">Preferred Difficulty</span>
                  <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                      style={{
                        width: `${(stats?.preferred_difficulty || 0.5) * 100}%`,
                        maxWidth: '100%'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Upcoming Study</h2>
          {stats?.next_study ? (
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <span className="font-medium text-white capitalize">{stats.next_study.content_type}</span>
              </div>
              <p className="text-sm text-slate-400">
                {new Date(stats.next_study.recommended_date).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric'
                })}
              </p>
              <button className="w-full mt-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02]">
                Start Now
              </button>
            </div>
          ) : (
            <div className="glass-card p-6 text-center">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No upcoming study items</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">My Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="group glass-card p-6 hover:border-indigo-500/50 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-400 group-hover:text-purple-400 transition-colors" />
                </div>
                <span className="text-xs text-slate-500 bg-slate-700/30 px-2 py-1 rounded-full">
                  {course.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                {course.title}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{course.code}</p>
              {course.description && (
                <p className="text-sm text-slate-400 mt-2 line-clamp-2">{course.description}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
