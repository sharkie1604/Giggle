import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { IndianRupee } from 'lucide-react';

const CATEGORIES = ['FRONTEND', 'BACKEND', 'FULLSTACK', 'MOBILE', 'AI_ML', 'DEVOPS'];

export default function PostJob() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'FULLSTACK',
    requiredSkills: '',
    budget: '',
    deadline: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const skillsArray = formData.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        requiredSkills: skillsArray,
        budget: parseFloat(formData.budget),
        deadline: new Date(formData.deadline).toISOString(),
      };

      const res = await api.post('/jobs', payload);
      navigate(`/jobs/${res.data.job.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post gig');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="brutal-card p-8 bg-white">
        <h1 className="text-3xl md:text-4xl font-extrabold font-heading mb-2">POST A TECH GIG</h1>
        <p className="font-medium text-gray-600 mb-6">
          Set a fixed budget in INR. Freelancers apply on merit and delivery timeline.
        </p>

        {error && (
          <div className="brutal-badge bg-bubblegum text-ink w-full text-center py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Job Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="brutal-input"
              placeholder="e.g. Build Realtime Webhook Ingestion Service in Node.js"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="brutal-input bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Fixed Escrow Budget (INR)</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500 font-bold font-mono">₹</span>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                required
                min="500"
                step="100"
                className="brutal-input pl-8 font-mono"
                placeholder="15000"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Note: Once any freelancer submits a proposal, this budget is frozen permanently.
            </p>
          </div>

          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Required Skills (Comma separated)</label>
            <input
              type="text"
              name="requiredSkills"
              value={formData.requiredSkills}
              onChange={handleChange}
              required
              className="brutal-input font-mono"
              placeholder="Node.js, Express, PostgreSQL, Redis"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Target Deadline</label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
              className="brutal-input font-mono"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Technical Scope & Requirements</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="5"
              className="brutal-input"
              placeholder="Detail technical requirements, expected deliverables, API constraints, and acceptance criteria..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="brutal-btn w-full bg-jake text-ink text-lg mt-4 disabled:opacity-50"
          >
            {loading ? 'POSTING GIG...' : 'PUBLISH FIXED-PRICE GIG'}
          </button>
        </form>
      </div>
    </div>
  );
}
