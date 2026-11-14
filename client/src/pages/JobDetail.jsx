import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { IndianRupee, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data.job);
      } catch (err) {
        console.error('Failed to load job details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 font-bold font-mono">LOADING VAULT #{id}...</div>;
  }

  if (!job) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center brutal-card p-8 bg-white">
        <h2 className="text-3xl font-bold font-heading mb-4">Gig Not Found</h2>
        <Link to="/jobs" className="brutal-btn bg-jake">
          Back to Gigs Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="brutal-card p-8 bg-white mb-8">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <span className="brutal-badge bg-bmo text-ink mr-2">{job.category}</span>
            <span className="brutal-badge bg-jake text-ink">{job.status}</span>
            <h1 className="text-3xl md:text-5xl font-extrabold font-heading mt-3">{job.title}</h1>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-extrabold text-gray-500 block">Fixed Escrow Budget</span>
            <span className="text-3xl md:text-4xl font-extrabold font-mono flex items-center justify-end text-ink">
              <IndianRupee className="w-6 h-6 md:w-8 md:h-8" />
              {Number(job.budget).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="border-t-4 border-b-4 border-ink py-6 my-6">
          <h3 className="font-extrabold text-xl mb-3 font-heading">Job Description</h3>
          <p className="text-gray-800 whitespace-pre-line leading-relaxed font-medium">{job.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-bold text-xs uppercase text-gray-500 mb-2">Required Tech Skills</h4>
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills?.map((skill) => (
                <span key={skill} className="brutal-badge bg-paper text-ink">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase text-gray-500 mb-2">Delivery Deadline</h4>
            <p className="font-bold font-mono flex items-center gap-2">
              <Clock className="w-5 h-5 text-finn" /> {new Date(job.deadline).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Callout */}
        {user?.role === 'FREELANCER' && job.status === 'OPEN' && (
          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <button className="brutal-btn bg-jake text-ink w-full text-lg">
              Submit Proposal for ₹{Number(job.budget).toLocaleString('en-IN')}
            </button>
            <p className="text-xs text-center text-gray-500 mt-2 font-medium">
              Fixed price: No bidding. You compete purely on execution approach and delivery timeline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
