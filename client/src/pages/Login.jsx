import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="brutal-card p-8 bg-white">
        <h2 className="text-3xl font-extrabold mb-2 font-heading text-center">WELCOME BACK</h2>
        <p className="text-center font-medium text-gray-600 mb-6">Enter your credentials to continue</p>

        {error && (
          <div className="brutal-badge bg-bubblegum text-ink w-full text-center py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="brutal-input"
              placeholder="developer@techgig.in"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Password</label>
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
            className="brutal-btn w-full bg-jake mt-4 disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'LOG IN'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm font-semibold">
          Don't have an account?{' '}
          <Link to="/register" className="text-finn underline hover:text-ink">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
