import { useState, useEffect } from 'react';
import api from '../api/client';
import { User, Edit, Save, X, Brain, TrendingUp } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    learning_pace: '',
    preferred_style: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/dashboard/profile')
      .then(res => {
        setProfile(res.data);
        setFormData({
          name: res.data.name || '',
          email: res.data.email || '',
          learning_pace: res.data.learning_pace || '',
          preferred_style: res.data.preferred_style || '',
        });
      })
      .catch(err => console.error('Error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/me', formData);
      window.location.reload();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-700/50 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <button
          onClick={() => setEditing(!editing)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 transform hover:scale-[1.02]"
        >
          {editing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-indigo-400" />
            <h3 className="font-semibold text-white">Account</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500">Name</span>
              <p className="text-white font-medium">{profile?.name}</p>
            </div>
            <div>
              <span className="text-slate-500">Email</span>
              <p className="text-white font-medium">{profile?.email}</p>
            </div>
            <div>
              <span className="text-slate-500">Member since</span>
              <p className="text-white font-medium">September 2026</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="font-semibold text-white">Preferences</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500">Learning Pace</span>
              <p className="text-white font-medium capitalize">{profile?.learning_pace || 'Medium'}</p>
            </div>
            <div>
              <span className="text-slate-500">Preferred Style</span>
              <p className="text-white font-medium capitalize">{profile?.preferred_style}</p>
            </div>
            <div>
              <span className="text-slate-500">Quiz Engine</span>
              <p className="text-white font-medium">Adaptive Difficulty</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h3 className="font-semibold text-white">AI Insights</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500">Detected Style</span>
              <p className="text-white font-medium capitalize">{profile?.detected_style || 'Not yet detected'}</p>
            </div>
            <div>
              <span className="text-slate-500">Style Confidence</span>
              <p className="text-white font-medium">
                {profile?.style_confidence ? `${Math.round(profile.style_confidence * 100)}%` : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Preferred Difficulty</span>
              <p className="text-white font-medium">
                {profile?.preferred_difficulty ? `${Math.round(profile.preferred_difficulty * 100)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Edit Preferences</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Name</label>
              <input
                type="text" name="name" value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Learning Pace</label>
              <select name="learning_pace" value={formData.learning_pace}
                onChange={(e) => setFormData({...formData, learning_pace: e.target.value})}
                className="input-field">
                <option value="slow">Slow</option>
                <option value="medium">Medium</option>
                <option value="fast">Fast</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Preferred Style</label>
              <select name="preferred_style" value={formData.preferred_style}
                onChange={(e) => setFormData({...formData, preferred_style: e.target.value})}
                className="input-field">
                <option value="visual">Visual</option>
                <option value="auditory">Auditory</option>
                <option value="reading_writing">Reading/Writing</option>
                <option value="kinesthetic">Kinesthetic</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-slate-400 hover:text-white rounded-xl border border-white/10 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
              >
                {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
