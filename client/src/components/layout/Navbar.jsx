import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Zap, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b-4 border-ink bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-jake border-3 border-ink shadow-brutal-sm flex items-center justify-center font-heading font-black text-xl">
            ⚡
          </div>
          <span className="font-heading font-black text-2xl tracking-tight">
            TECH<span className="text-finn">GIG</span>.ESCROW
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          <Link to="/jobs" className="font-bold uppercase text-sm hover:text-finn transition-colors">
            Gigs Feed
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="brutal-btn bg-paper text-xs py-2 px-3">
                Dashboard
              </Link>
              <Link to="/profile" className="flex items-center gap-1 font-bold text-sm">
                <User className="w-4 h-4" /> {user.name.split(' ')[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 border-2 border-ink rounded hover:bg-bubblegum transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="font-bold uppercase text-sm hover:underline">
                Log In
              </Link>
              <Link to="/register" className="brutal-btn bg-jake text-xs py-2 px-3">
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
