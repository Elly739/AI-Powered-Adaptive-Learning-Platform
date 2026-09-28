import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { BookOpen, Search } from 'lucide-react';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get('/courses')
      .then(res => setCourses(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">All Courses</h1>
        <p className="text-slate-400">Explore and enroll in available courses</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
            placeholder="Search courses by title or code..."
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 glass-card animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length > 0 ? filtered.map((course) => (
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
              <h3 className="text-xl font-semibold text-white group-hover:text-indigo-300 transition-colors">
                {course.title}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{course.code}</p>
              {course.instructor && (
                <p className="text-sm text-slate-400 mt-2">By {course.instructor}</p>
              )}
              {course.description && (
                <p className="text-sm text-slate-400 mt-3 line-clamp-3">{course.description}</p>
              )}
            </Link>
          )) : (
            <div className="col-span-full text-center py-12">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No courses found matching your search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseList;
