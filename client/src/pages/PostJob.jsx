import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  IndianRupee,
  ShieldAlert,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

const CATEGORIES = [
  'FRONTEND',
  'BACKEND',
  'FULLSTACK',
  'MOBILE',
  'AI_ML',
  'DEVOPS',
];

export default function PostJob() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

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

  // 1. Role Guard: Redirect to login if unauthenticated
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Role Guard: Cartoon-Brutalist 403 Clients Only Notice for non-clients (e.g. Freelancer)
  if (!authLoading && user && user.role !== 'CLIENT') {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="brutal-card p-8 bg-paper border-4 border-ink shadow-brutal text-center">
          <div className="w-16 h-16 bg-bubblegum border-3 border-ink rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brutal-sm">
            <ShieldAlert className="w-8 h-8 text-ink" />
          </div>
          <span className="brutal-badge bg-bubblegum text-ink text-xs mb-2">
            403 • CLIENT ACCESS ONLY
          </span>
          <h2 className="text-2xl font-black font-heading text-ink mt-2 mb-2">
            FREELANCER PROFILE DETECTED
          </h2>
          <p className="text-sm font-medium text-gray-700 mb-6 leading-relaxed">
            Only registered <span className="font-bold text-ink">Client</span> accounts can post fixed-budget gigs and hire talent. Freelancers apply to open gigs.
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/jobs" className="brutal-btn bg-jake text-xs py-2.5">
              EXPLORE OPEN GIGS
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-2 border-2 border-ink rounded font-bold text-xs bg-white hover:bg-gray-100"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation checks
    if (formData.title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (formData.description.trim().length < 20) {
      setError('Description must be at least 20 characters long.');
      return;
    }

    const numericBudget = parseFloat(formData.budget);
    if (!numericBudget || numericBudget <= 0) {
      setError('Budget must be a positive number greater than 0.');
      return;
    }

    if (!formData.deadline) {
      setError('Target deadline is required.');
      return;
    }
    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate <= new Date()) {
      setError('Target deadline must be in the future.');
      return;
    }

    const skillsArray = formData.requiredSkills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (skillsArray.length === 0) {
      setError('At least 1 required skill must be specified.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        requiredSkills: skillsArray,
        budget: numericBudget,
        deadline: deadlineDate.toISOString(),
      };

      const res = await api.post('/jobs', payload);
      navigate(`/jobs/${res.data.job.id}`);
    } catch (err) {
      const data = err.response?.data;
      let apiMsg = 'Failed to post gig. Please check your fields.';
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        apiMsg = data.errors.map((e) => e.message || e).join('. ');
      } else if (data?.message) {
        apiMsg = data.message;
      }
      setError(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="brutal-card p-6 sm:p-8 bg-white border-4 border-ink shadow-brutal">
        {/* Header */}
        <div className="inline-flex items-center gap-1.5 brutal-badge bg-jake text-ink text-xs mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          FIXED BUDGET GIG
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-heading text-ink mb-1">
          POST A TECH GIG
        </h1>
        <p className="font-medium text-gray-700 text-sm mb-6">
          Set a fixed budget in INR. Freelancers apply with their technical approach and timeline—no price bidding wars.
        </p>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-3 bg-bubblegum border-3 border-ink rounded-lg shadow-brutal-sm flex items-start gap-2 text-ink">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-bold">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block font-bold mb-1 uppercase text-xs text-ink">
              Job Title * (Min 5 chars)
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              minLength={5}
              maxLength={150}
              className="brutal-input"
              placeholder="e.g. Build Realtime Webhook Ingestion Service in Node.js"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-bold mb-1 uppercase text-xs text-ink">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="brutal-input bg-white cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Budget */}
          <div>
            <label className="block font-bold mb-1 uppercase text-xs text-ink flex items-center justify-between">
              <span>Fixed Budget (INR) *</span>
              <span className="text-[10px] text-gray-500 font-semibold">
                No bidding allowed
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-gray-700 font-bold font-mono">
                ₹
              </span>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                required
                min="1"
                max="10000000"
                step="1"
                className="brutal-input pl-8 font-mono text-base"
                placeholder="15000"
              />
            </div>
            <p className="text-[11px] font-semibold text-gray-500 mt-1">
              Note: To keep things fair for applicants, your budget cannot be changed once proposals are submitted.
            </p>
          </div>

          {/* Required Skills */}
          <div>
            <label className="block font-bold mb-1 uppercase text-xs text-ink flex items-center justify-between">
              <span>Required Skills *</span>
              <span className="text-[10px] text-gray-500 font-normal">
                Comma-separated
              </span>
            </label>
            <input
              type="text"
              name="requiredSkills"
              value={formData.requiredSkills}
              onChange={handleChange}
              required
              className="brutal-input font-mono text-xs"
              placeholder="Node.js, Express, PostgreSQL, Redis"
            />
          </div>

          {/* Target Deadline */}
          <div>
            <label className="block font-bold mb-1 uppercase text-xs text-ink">
              Target Delivery Deadline * (Future date)
            </label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
              className="brutal-input font-mono"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold mb-1 uppercase text-xs text-ink">
              Gig Description & Deliverables * (Min 20 chars)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              minLength={20}
              maxLength={5000}
              rows="5"
              className="brutal-input resize-y text-sm"
              placeholder="Describe the project requirements, deliverables, and timeline..."
            ></textarea>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="brutal-btn w-full bg-jake text-ink text-base py-3 mt-4 disabled:opacity-50 shadow-brutal-sm cursor-pointer"
          >
            {loading ? 'POSTING GIG...' : 'POST GIG'}
          </button>
        </form>
      </div>
    </div>
  );
}
