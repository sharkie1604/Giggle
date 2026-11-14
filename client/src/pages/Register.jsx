import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'FREELANCER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="brutal-card p-8 bg-white">
        <h2 className="text-3xl font-extrabold mb-2 font-heading text-center">JOIN THE ESCROW</h2>
        <p className="text-center font-medium text-gray-600 mb-6">Create your developer or client profile</p>

        {error && (
          <div className="brutal-badge bg-bubblegum text-ink w-full text-center py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="brutal-input"
              placeholder="Finn the Human"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="brutal-input"
              placeholder="finn@landofooo.dev"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="brutal-input"
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 uppercase text-xs">I want to...</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <label
                className={`brutal-card p-3 text-center cursor-pointer font-bold ${
                  formData.role === 'FREELANCER' ? 'bg-finn text-ink' : 'bg-gray-100'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="FREELANCER"
                  checked={formData.role === 'FREELANCER'}
                  onChange={handleChange}
                  className="sr-only"
                />
                Work as Dev
              </label>
              <label
                className={`brutal-card p-3 text-center cursor-pointer font-bold ${
                  formData.role === 'CLIENT' ? 'bg-jake text-ink' : 'bg-gray-100'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="CLIENT"
                  checked={formData.role === 'CLIENT'}
                  onChange={handleChange}
                  className="sr-only"
                />
                Hire Talent
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="brutal-btn w-full bg-finn mt-4 disabled:opacity-50"
          >
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm font-semibold">
          Already registered?{' '}
          <Link to="/login" className="text-finn underline hover:text-ink">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
