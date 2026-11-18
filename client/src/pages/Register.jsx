import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, UserCheck, AlertCircle } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'FREELANCER',
    skillsInput: '',
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
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      // Parse comma-separated skills into clean trimmed array
      const skills = formData.skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        ...(skills.length > 0 && { skills }),
      };

      const res = await register(payload);
      const registeredUser = res.user;

      if (registeredUser?.id) {
        navigate(`/users/${registeredUser.id}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const apiMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors?.[0]?.message) ||
        'Registration failed. Please check your inputs.';
      setError(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-12 px-4">
      <div className="brutal-card p-8 bg-white border-4 border-ink shadow-brutal">
        {/* Header Badge & Title */}
        <div className="flex justify-center mb-2">
          <span className="brutal-badge bg-jake text-ink text-xs font-black flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            NO BIDDING • FIXED PRICE ESCROW
          </span>
        </div>
        <h2 className="text-3xl font-extrabold mb-1 font-heading text-center text-ink">
          JOIN THE ESCROW
        </h2>
        <p className="text-center font-medium text-gray-700 text-sm mb-6">
          Create your Indian developer or client profile
        </p>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-3 bg-bubblegum border-3 border-ink rounded-lg shadow-brutal-sm flex items-start gap-2 text-ink">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-bold">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Toggle Cards */}
          <div>
            <label className="block font-bold mb-1 uppercase text-xs text-ink">
              I Want To...
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'FREELANCER' })}
                className={`p-3 border-3 border-ink rounded-lg text-center cursor-pointer transition-all ${
                  formData.role === 'FREELANCER'
                    ? 'bg-jake shadow-brutal translate-x-[-2px] translate-y-[-2px]'
                    : 'bg-paper hover:bg-gray-100 shadow-brutal-sm opacity-80'
                }`}
              >
                <div className="font-heading font-black text-sm text-ink">
                  💻 WORK AS DEV
                </div>
                <div className="text-[11px] font-semibold text-gray-700 mt-0.5">
                  Freelancer Profile
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'CLIENT' })}
                className={`p-3 border-3 border-ink rounded-lg text-center cursor-pointer transition-all ${
                  formData.role === 'CLIENT'
                    ? 'bg-finn shadow-brutal translate-x-[-2px] translate-y-[-2px]'
                    : 'bg-paper hover:bg-gray-100 shadow-brutal-sm opacity-80'
                }`}
              >
                <div className="font-heading font-black text-sm text-ink">
                  🚀 HIRE TALENT
                </div>
                <div className="text-[11px] font-semibold text-gray-700 mt-0.5">
                  Client / Employer
                </div>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block font-bold mb-1 uppercase text-xs text-ink">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={100}
              className="brutal-input"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block font-bold mb-1 uppercase text-xs text-ink">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="brutal-input"
              placeholder="rahul@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block font-bold mb-1 uppercase text-xs text-ink">
              Password * (Min 8 Characters)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              maxLength={72}
              className="brutal-input"
              placeholder="••••••••"
            />
          </div>

          {/* Skills (Optional / Comma-separated) */}
          <div>
            <label className="block font-bold mb-1 uppercase text-xs text-ink flex items-center justify-between">
              <span>Technical Skills (Optional)</span>
              <span className="text-[10px] text-gray-500 font-normal">
                Comma-separated
              </span>
            </label>
            <input
              type="text"
              name="skillsInput"
              value={formData.skillsInput}
              onChange={handleChange}
              className="brutal-input"
              placeholder="React, Node.js, TypeScript, PostgreSQL"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="brutal-btn w-full bg-finn text-ink font-heading font-black tracking-wide text-sm py-3 mt-4 disabled:opacity-50"
          >
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT & ENTER ESCROW'}
          </button>
        </form>

        {/* Footer Note */}
        <p className="text-center mt-6 text-sm font-semibold text-gray-700">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-ink font-bold underline hover:text-finn transition-colors"
          >
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
