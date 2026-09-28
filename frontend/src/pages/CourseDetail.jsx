import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, FileText, Play } from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);

  useEffect(() => {
    api.get(`/courses/${id}`)
      .then(res => setCourse(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const generateSchedule = async () => {
    setGeneratingSchedule(true);
    try {
      await api.post(`/schedule/generate/${id}`);
    } catch (err) {
      console.error('Failed to generate schedule:', err);
    } finally {
      setGeneratingSchedule(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded-xl w-1/4"></div>
        <div className="h-4 bg-slate-700/50 rounded-xl w-3/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-700/50 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return <div className="text-center py-12">Course not found</div>;
  }

  return (
    <div className="animate-fade-in">
      <Link
        to="/courses"
        className="text-sm text-slate-400 hover:text-white mb-4 inline-flex items-center gap-1 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
            <FileText className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{course.title}</h1>
            <p className="text-slate-400">{course.code} • {course.instructor}</p>
          </div>
        </div>
        {course.description && <p className="text-slate-300 leading-relaxed">{course.description}</p>}
      </div>

      <div className="mb-6">
        <button
          onClick={generateSchedule}
          disabled={generatingSchedule}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
        >
          {generatingSchedule ? 'Generating...' : 'Generate AI Study Schedule'}
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Lessons</h2>
        <div className="space-y-3">
          {course.lessons && course.lessons.length > 0 ? course.lessons.map((lesson) => (
            <Link
              key={lesson.id}
              to={`/courses/${course.id}/lessons/${lesson.id}`}
              className="group glass-card p-4 flex items-center justify-between hover:border-indigo-500/50 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white group-hover:text-indigo-300 transition-colors">{lesson.title}</h3>
                  <p className="text-sm text-slate-500">
                    {lesson.duration_minutes} min • {lesson.content_type}
                  </p>
                </div>
              </div>
              <Play className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </Link>
          )) : (
            <p className="text-slate-400">No lessons available for this course.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
