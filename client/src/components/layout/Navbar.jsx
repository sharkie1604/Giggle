import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Briefcase, PlusCircle, LayoutDashboard, Receipt, AlertTriangle, User, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User Link & Role Badge */}
              <Link
                to={`/users/${user.id}`}
                className="hidden sm:flex items-center gap-2 p-1.5 rounded-lg border-2 border-ink bg-white shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
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
                className="hidden md:inline-flex items-center gap-1 font-bold text-xs uppercase px-2.5 py-2 border-2 border-ink rounded bg-paper hover:bg-white transition-colors"
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
            <div className="hidden sm:flex items-center gap-3">
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

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg border-2 border-ink bg-white shadow-brutal-sm cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-ink" />
            ) : (
              <Menu className="w-5 h-5 text-ink" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-4 border-ink bg-paper px-4 py-4 space-y-3 shadow-brutal">
          {isAuthenticated && user && (
            <div className="flex items-center justify-between pb-3 border-b-2 border-ink/20">
              <Link
                to={`/users/${user.id}`}
                className="flex items-center gap-2 p-1.5 rounded-lg border-2 border-ink bg-white shadow-brutal-sm"
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
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 border-2 border-ink rounded bg-white hover:bg-bubblegum shadow-brutal-sm cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-ink" />
                Logout
              </button>
            </div>
          )}

          <nav className="flex flex-col space-y-2">
            <Link
              to="/jobs"
              className="flex items-center gap-2 font-bold uppercase text-xs p-2.5 rounded border-2 border-ink bg-white shadow-brutal-sm hover:bg-jake transition-colors"
            >
              <Briefcase className="w-4 h-4 text-ink" />
              Browse Gigs
            </Link>

            {user?.role === 'CLIENT' && (
              <Link
                to="/post-job"
                className="flex items-center gap-2 font-bold uppercase text-xs p-2.5 rounded border-2 border-ink bg-finn shadow-brutal-sm hover:opacity-90 transition-opacity text-ink"
              >
                <PlusCircle className="w-4 h-4 text-ink" />
                Post a Gig
              </Link>
            )}

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 font-bold uppercase text-xs p-2.5 rounded border-2 border-ink bg-white shadow-brutal-sm hover:bg-jake transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-ink" />
                  Dashboard
                </Link>

                <Link
                  to="/transactions"
                  className="flex items-center gap-2 font-bold uppercase text-xs p-2.5 rounded border-2 border-ink bg-white shadow-brutal-sm hover:bg-jake transition-colors"
                >
                  <Receipt className="w-4 h-4 text-ink" />
                  Payments
                </Link>

                <Link
                  to={`/users/${user.id}`}
                  className="flex items-center gap-2 font-bold uppercase text-xs p-2.5 rounded border-2 border-ink bg-white shadow-brutal-sm hover:bg-jake transition-colors"
                >
                  <User className="w-4 h-4 text-ink" />
                  My Profile
                </Link>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/disputes"
                className="flex items-center gap-2 font-bold uppercase text-xs p-2.5 rounded border-2 border-ink bg-bubblegum shadow-brutal-sm hover:opacity-90 text-ink"
              >
                <AlertTriangle className="w-4 h-4 text-ink" />
                Disputes Arbitration
              </Link>
            )}

            {!isAuthenticated && (
              <div className="flex flex-col gap-2 pt-2 border-t-2 border-ink/20">
                <Link
                  to="/login"
                  className="w-full text-center font-bold uppercase text-xs py-2.5 border-2 border-ink rounded bg-white hover:bg-paper transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="w-full text-center brutal-btn bg-jake text-xs py-2.5 shadow-brutal-sm font-heading font-black text-ink"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
