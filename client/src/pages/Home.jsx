import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Code2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-16">
        <div className="inline-block brutal-badge bg-jake text-ink mb-6 text-sm">
          🇮🇳 India's #1 Fixed-Price Tech Gig Escrow
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 font-heading">
          NO BIDDING WARS. <br />
          <span className="bg-bubblegum px-3 py-1 border-4 border-ink shadow-brutal inline-block my-2">
            PURE TECH ESCROW.
          </span>
        </h1>
        <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10 text-gray-800">
          Fixed budgets, verified developers, and guaranteed payouts secured by our interactive BMO Escrow Vault.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/jobs" className="brutal-btn bg-jake text-ink flex items-center gap-2 text-lg">
            Explore Gigs <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/post-job" className="brutal-btn bg-finn text-ink flex items-center gap-2 text-lg">
            Post a Tech Gig
          </Link>
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
          <h3 className="text-2xl font-bold mb-2 font-heading">BMO Escrow Vault</h3>
          <p className="font-medium text-gray-700">
            Funds are locked in escrow via Razorpay UPI test mode before development starts. Zero payment risk.
          </p>
        </div>

        <div className="brutal-card p-6 bg-white">
          <div className="w-12 h-12 rounded-lg bg-bubblegum border-3 border-ink shadow-brutal-sm flex items-center justify-center mb-4">
            <Code2 className="w-6 h-6 text-ink" />
          </div>
          <h3 className="text-2xl font-bold mb-2 font-heading">Tech Gigs Only</h3>
          <p className="font-medium text-gray-700">
            Exclusively Frontend, Backend, Fullstack, Mobile, AI/ML, and DevOps. Built by devs, for devs.
          </p>
        </div>
      </section>
    </div>
  );
}
