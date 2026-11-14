import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, IndianRupee, Clock, Tag } from 'lucide-react';
import api from '../services/api';

const CATEGORIES = ['ALL', 'FRONTEND', 'BACKEND', 'FULLSTACK', 'MOBILE', 'AI_ML', 'DEVOPS'];

export default function JobFeed() {
  const [jobs, setJobs] = useState([]);
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const query = category !== 'ALL' ? `?category=${category}` : '';
        const res = await api.get(`/jobs${query}`);
        setJobs(res.data.jobs || []);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [category]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold font-heading">LIVE TECH GIGS</h1>
          <p className="font-medium text-gray-700">Fixed-price deliverables with verified escrow</p>
        </div>
        <Link to="/post-job" className="brutal-btn bg-jake text-ink">
          + Post a Tech Gig
        </Link>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`brutal-badge cursor-pointer px-4 py-2 text-sm transition-all ${
              category === cat ? 'bg-finn text-ink shadow-brutal' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Jobs Listing */}
      {loading ? (
        <div className="text-center py-12 font-bold font-mono">LOADING VAULTS...</div>
      ) : jobs.length === 0 ? (
        <div className="brutal-card p-12 text-center bg-white">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-2xl font-bold font-heading mb-2">No Gigs Found</h3>
          <p className="text-gray-600 mb-6 font-medium">Be the first to post a fixed-price tech gig in this category!</p>
          <Link to="/post-job" className="brutal-btn bg-jake">
            Create First Gig
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="brutal-card p-6 bg-white block transition-transform"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="brutal-badge bg-bmo text-ink text-xs">{job.category}</span>
                <span className="flex items-center text-lg font-bold font-mono text-ink">
                  <IndianRupee className="w-4 h-4" /> {Number(job.budget).toLocaleString('en-IN')}
                </span>
              </div>
              <h2 className="text-2xl font-bold font-heading mb-2">{job.title}</h2>
              <p className="text-gray-700 line-clamp-2 text-sm font-medium mb-4">{job.description}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {job.requiredSkills?.map((skill) => (
                  <span key={skill} className="text-xs bg-gray-100 border border-ink px-2 py-0.5 rounded font-mono">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-600 pt-2 border-t border-gray-200">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Due in {new Date(job.deadline).toLocaleDateString()}
                </span>
                <span className="text-finn underline">View Details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
