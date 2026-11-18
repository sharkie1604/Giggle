import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email: email.trim(), password });
      navigate('/dashboard');
    } catch (err) {
      const apiMsg =
        err.response?.data?.message ||
        'Invalid email or password. Please check your credentials.';
      setError(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="brutal-card p-8 bg-white border-4 border-ink shadow-brutal">
        {/* Header Icon & Title */}
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-xl bg-jake border-3 border-ink shadow-brutal-sm flex items-center justify-center text-ink">
            <Lock className="w-6 h-6" />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold mb-1 font-heading text-center text-ink">
          WELCOME BACK
        </h2>
        <p className="text-center font-medium text-gray-700 text-sm mb-6">
          Access your tech gig escrow dashboard
        </p>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-3 bg-bubblegum border-3 border-ink rounded-lg shadow-brutal-sm flex items-start gap-2 text-ink">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-bold">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold mb-1 uppercase text-xs text-ink">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="brutal-input"
              placeholder="e.g. developer@techgig.in"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 uppercase text-xs text-ink">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="brutal-input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="brutal-btn w-full bg-jake text-ink font-heading font-black tracking-wide text-sm py-3 mt-4 disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'LOG IN TO ESCROW'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm font-semibold text-gray-700">
          Don't have an account yet?{' '}
          <Link
            to="/register"
            className="text-ink font-bold underline hover:text-finn transition-colors"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
