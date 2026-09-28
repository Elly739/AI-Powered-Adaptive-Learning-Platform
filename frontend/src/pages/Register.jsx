import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Sparkles } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: 'New Student',
    email: 'newstudent@university.edu',
    password: 'password123',
    learning_pace: 'medium',
    preferred_style: 'visual',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
              Create Your Account
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Start your personalized learning journey</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-md">
            Join thousands of students who are already learning smarter, not harder, with AI-powered adaptive content.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-4 text-center">
              <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Adaptive Quizzes</p>
            </div>
            <div className="glass-card p-4 text-center">
              <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Smart Scheduling</p>
            </div>
            <div className="glass-card p-4 text-center">
              <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Progress Tracking</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 max-w-md mx-auto w-full">
          <h3 className="text-xl font-bold text-white mb-6 text-center">Create Account</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Full Name</label>
              <input
                type="text" name="name" value={formData.name} onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Email</label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password" name="password" value={formData.password} onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Learning Pace</label>
                <select name="learning_pace" value={formData.learning_pace} onChange={handleChange}
                  className="input-field">
                  <option value="slow">Slow</option>
                  <option value="medium">Medium</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Style</label>
                <select name="preferred_style" value={formData.preferred_style} onChange={handleChange}
                  className="input-field">
                  <option value="visual">Visual</option>
                  <option value="auditory">Auditory</option>
                  <option value="reading_writing">Reading/Writing</option>
                  <option value="kinesthetic">Kinesthetic</option>
                </select>
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm animate-fade-in">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign Up'}
            </button>
          </form>
          <p className="text-center mt-6 text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
