import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ShieldCheck, Briefcase, FileText, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="brutal-badge bg-jake text-ink mb-2">{user?.role} DASHBOARD</span>
          <h1 className="text-4xl font-extrabold font-heading">Welcome, {user?.name}!</h1>
        </div>
        <div className="flex gap-3">
          <Link to="/transactions" className="brutal-btn bg-white text-ink text-sm">
            Transactions
          </Link>
          {user?.role === 'CLIENT' ? (
            <Link to="/post-job" className="brutal-btn bg-finn text-ink text-sm">
              + Post New Gig
            </Link>
          ) : (
            <Link to="/jobs" className="brutal-btn bg-finn text-ink text-sm">
              Browse Gigs
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="brutal-card p-6 bg-white">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-6 h-6 text-finn" />
            <span className="font-bold text-gray-500 uppercase text-xs">Active Projects</span>
          </div>
          <p className="text-4xl font-extrabold font-mono">0</p>
        </div>

        <div className="brutal-card p-6 bg-white">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-bmo" />
            <span className="font-bold text-gray-500 uppercase text-xs">In Escrow Vaults</span>
          </div>
          <p className="text-4xl font-extrabold font-mono">₹0</p>
        </div>

        <div className="brutal-card p-6 bg-white">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-jake" />
            <span className="font-bold text-gray-500 uppercase text-xs">Proposals</span>
          </div>
          <p className="text-4xl font-extrabold font-mono">0</p>
        </div>
      </div>
    </div>
  );
}
