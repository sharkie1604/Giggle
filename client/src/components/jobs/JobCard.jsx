import React from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, Clock } from 'lucide-react';

export default function JobCard({ job }) {
  return (
    <Link to={`/jobs/${job.id}`} className="brutal-card p-6 bg-white block">
      <div className="flex justify-between items-start mb-3">
        <span className="brutal-badge bg-bmo text-ink text-xs">{job.category}</span>
        <span className="flex items-center text-lg font-bold font-mono">
          <IndianRupee className="w-4 h-4" /> {Number(job.budget).toLocaleString('en-IN')}
        </span>
      </div>
      <h3 className="text-xl font-bold font-heading mb-2">{job.title}</h3>
      <p className="text-sm text-gray-700 line-clamp-2 mb-4 font-medium">{job.description}</p>
      <div className="flex justify-between items-center text-xs font-bold text-gray-500">
        <span>Due {new Date(job.deadline).toLocaleDateString()}</span>
        <span className="text-finn underline">View Gig →</span>
      </div>
    </Link>
  );
}
