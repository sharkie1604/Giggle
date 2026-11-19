import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IndianRupee, Clock, User, FileText, ArrowUpRight } from 'lucide-react';

export default function JobCard({ job }) {
  const { user } = useAuth();
  const isClient = user?.role === 'CLIENT';

  const getCategoryBadgeColor = (category) => {
    switch (category) {
      case 'FRONTEND':
        return 'bg-finn text-ink';
      case 'BACKEND':
        return 'bg-jake text-ink';
      case 'FULLSTACK':
        return 'bg-bmo text-ink';
      case 'MOBILE':
        return 'bg-bubblegum text-ink';
      case 'AI_ML':
        return 'bg-paper text-ink';
      case 'DEVOPS':
        return 'bg-ink text-white';
      default:
        return 'bg-paper text-ink';
    }
  };

  const deadlineDate = new Date(job.deadline);
  const isPast = deadlineDate < new Date();

  return (
    <div className="brutal-card p-6 bg-white border-4 border-ink shadow-brutal flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg transition-all">
      <div>
        {/* Top Meta Row */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <span
            className={`brutal-badge text-xs font-black ${getCategoryBadgeColor(
              job.category
            )}`}
          >
            {job.category === 'AI_ML' ? 'AI / ML' : job.category}
          </span>
          <div className="flex items-center text-lg sm:text-xl font-black font-mono text-ink bg-jake px-2.5 py-0.5 rounded border-2 border-ink shadow-brutal-sm">
            <IndianRupee className="w-4 h-4 inline -mr-0.5" />
            {Number(job.budget).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Title */}
        <Link to={`/jobs/${job.id}`} className="group">
          <h2 className="text-xl sm:text-2xl font-black font-heading text-ink group-hover:text-finn transition-colors line-clamp-1 mb-2">
            {job.title}
          </h2>
        </Link>

        {/* Truncated Description */}
        <p className="text-xs sm:text-sm text-gray-700 font-medium line-clamp-2 mb-4 leading-relaxed">
          {job.description}
        </p>

        {/* Required Skills tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.requiredSkills &&
            job.requiredSkills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="text-[11px] font-mono font-bold bg-paper border-2 border-ink px-2 py-0.5 rounded shadow-brutal-sm text-ink"
              >
                #{skill}
              </span>
            ))}
          {job.requiredSkills && job.requiredSkills.length > 4 && (
            <span className="text-[11px] font-bold text-gray-500 self-center">
              +{job.requiredSkills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Info */}
      <div className="pt-4 border-t-2 border-ink/20 mt-2">
        <div className="flex flex-wrap items-center justify-between text-xs font-bold text-gray-700 mb-3 gap-2">
          {/* Client Attribution */}
          {job.client ? (
            <Link
              to={`/users/${job.client.id}`}
              className="flex items-center gap-1 hover:text-finn transition-colors"
              title="View Client Profile"
            >
              <User className="w-3.5 h-3.5 text-gray-500" />
              <span className="underline decoration-ink/40">
                {job.client.name}
              </span>
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-gray-500">
              <User className="w-3.5 h-3.5" /> Client
            </span>
          )}

          {/* Proposals Count */}
          <span className="flex items-center gap-1 text-ink bg-paper px-2 py-0.5 border border-ink rounded text-[11px] font-mono font-bold">
            <FileText className="w-3 h-3 text-bmo" />
            {job._count?.proposals ?? 0}{' '}
            {job._count?.proposals === 1 ? 'proposal' : 'proposals'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Deadline */}
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-600">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isPast
                ? 'Expired'
                : `Due ${deadlineDate.toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}`}
            </span>
          </div>

          {/* Primary CTA */}
          <Link
            to={`/jobs/${job.id}`}
            className="brutal-btn bg-finn text-ink text-xs py-1.5 px-3 shadow-brutal-sm flex items-center gap-1"
          >
            <span>
              {isClient
                ? 'Inspect Gig'
                : job.status === 'OPEN'
                ? 'View Gig & Apply'
                : job.status === 'IN_PROGRESS'
                ? 'View Active Gig'
                : job.status === 'COMPLETED'
                ? 'View Completed Gig'
                : job.status === 'CANCELLED'
                ? 'View Closed Gig'
                : 'View Gig'}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
