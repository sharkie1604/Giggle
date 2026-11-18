import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, ShieldCheck, Zap, Code2, PlusCircle, LayoutDashboard } from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-16">
        <div className="inline-block brutal-badge bg-jake text-ink mb-6 text-sm">
          🇮🇳 Fixed-Price Indian Tech Gigs
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 font-heading">
          NO BIDDING WARS. <br />
          <span className="bg-bubblegum px-3 py-1 border-4 border-ink shadow-brutal inline-block my-2">
            PROTECTED PAYMENTS.
          </span>
        </h1>
        <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10 text-gray-800">
          Fixed budgets, verified developers, and guaranteed payouts with Giggle protected payments.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/jobs" className="brutal-btn bg-jake text-ink flex items-center gap-2 text-lg">
            Explore Gigs <ArrowRight className="w-5 h-5" />
          </Link>

          {/* Role-Aware Secondary Hero Button */}
          {isAuthenticated && user?.role === 'CLIENT' ? (
            <Link to="/post-job" className="brutal-btn bg-finn text-ink flex items-center gap-2 text-lg">
              <PlusCircle className="w-5 h-5" /> Post a Gig
            </Link>
          ) : isAuthenticated && user?.role === 'FREELANCER' ? (
            <Link to="/dashboard" className="brutal-btn bg-finn text-ink flex items-center gap-2 text-lg">
              <LayoutDashboard className="w-5 h-5" /> My Dashboard
            </Link>
          ) : (
            <Link to="/register" className="brutal-btn bg-finn text-ink flex items-center gap-2 text-lg">
              Join as Client
            </Link>
          )}
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
        <div className="brutal-card p-6 bg-white">
          <div className="w-12 h-12 rounded-lg bg-finn border-3 border-ink shadow-brutal-sm flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-ink" />
          </div>
          <h3 className="text-2xl font-bold mb-2 font-heading">Zero Bidding</h3>
          <p className="font-medium text-gray-700">
            Clients set the budget. Freelancers apply on execution merit and timeline. No race to the bottom.
          </p>
        </div>

        <div className="brutal-card p-6 bg-white">
          <div className="w-12 h-12 rounded-lg bg-bmo border-3 border-ink shadow-brutal-sm flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-ink" />
          </div>
          <h3 className="text-2xl font-bold mb-2 font-heading">Protected Payments</h3>
          <p className="font-medium text-gray-700">
            Funds are held safely before work starts and released when you approve the final delivery.
          </p>
        </div>

        <div className="brutal-card p-6 bg-white">
          <div className="w-12 h-12 rounded-lg bg-bubblegum border-3 border-ink shadow-brutal-sm flex items-center justify-center mb-4">
            <Code2 className="w-6 h-6 text-ink" />
          </div>
          <h3 className="text-2xl font-bold mb-2 font-heading">Tech Gigs Only</h3>
          <p className="font-medium text-gray-700">
            Exclusively Frontend, Backend, Fullstack, Mobile, AI/ML, and DevOps. Built for high-quality engineering.
          </p>
        </div>
      </section>
    </div>
  );
}
