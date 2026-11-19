import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Briefcase, PlusCircle, LayoutDashboard, Receipt, AlertTriangle, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'CLIENT':
        return 'bg-finn text-ink';
      case 'FREELANCER':
        return 'bg-jake text-ink';
      case 'ADMIN':
        return 'bg-bubblegum text-ink';
      default:
        return 'bg-paper text-ink';
    }
  };

  return (
    <header className="border-b-4 border-ink bg-paper sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-bmo border-3 border-ink shadow-brutal-sm flex items-center justify-center font-heading font-black text-xl text-ink group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] transition-transform">
            ⚡
          </div>
          <span className="font-heading font-black text-2xl tracking-tight text-ink">
            Giggle
          </span>
        </Link>

        {/* Center / Primary Navigation Links */}
        <nav className="hidden md:flex items-center gap-4">
          <Link
            to="/jobs"
            className="flex items-center gap-1 font-bold uppercase text-xs hover:text-finn transition-colors tracking-wide px-2 py-1"
          >
            <Briefcase className="w-4 h-4" />
            Browse Gigs
          </Link>

          {user?.role === 'CLIENT' && (
            <Link
              to="/post-job"
              className="flex items-center gap-1 font-bold uppercase text-xs text-ink hover:text-finn transition-colors tracking-wide px-2 py-1"
            >
              <PlusCircle className="w-4 h-4" />
              Post a Gig
            </Link>
          )}

          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-1 font-bold uppercase text-xs hover:text-finn transition-colors tracking-wide px-2 py-1"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              <Link
                to="/transactions"
                className="flex items-center gap-1 font-bold uppercase text-xs hover:text-finn transition-colors tracking-wide px-2 py-1"
              >
                <Receipt className="w-4 h-4" />
                Payments
              </Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/disputes"
              className="flex items-center gap-1 font-bold uppercase text-xs text-bubblegum hover:underline tracking-wide px-2 py-1"
            >
              <AlertTriangle className="w-4 h-4" />
              Disputes
            </Link>
          )}
        </nav>

        {/* Right Auth Controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* User Link & Role Badge */}
              <Link
                to={`/users/${user.id}`}
                className="flex items-center gap-2 p-1.5 rounded-lg border-2 border-ink bg-white shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
                title="View My Profile"
              >
                <div className="w-7 h-7 rounded bg-finn border border-ink flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-xs leading-none text-ink">
                    {user.name}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase mt-0.5 px-1.5 py-0.2 rounded border border-ink inline-block ${getRoleBadgeClass(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>
              </Link>

              {/* My Profile shortcut */}
              <Link
                to={`/users/${user.id}`}
                className="hidden sm:inline-flex items-center gap-1 font-bold text-xs uppercase px-2.5 py-2 border-2 border-ink rounded bg-paper hover:bg-white transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                My Profile
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 border-2 border-ink rounded bg-white hover:bg-bubblegum shadow-brutal-sm transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4 text-ink" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="font-bold uppercase text-xs px-3 py-2 border-2 border-ink rounded hover:bg-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="brutal-btn bg-jake text-xs py-2 px-4 shadow-brutal-sm"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
