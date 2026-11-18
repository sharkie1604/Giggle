import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/jobs/JobCard';
import api from '../services/api';
import {
  Briefcase,
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = [
  'ALL',
  'FRONTEND',
  'BACKEND',
  'FULLSTACK',
  'MOBILE',
  'AI_ML',
  'DEVOPS',
];

export default function JobFeed() {
  const { user } = useAuth();
  const isClient = user?.role === 'CLIENT';

  const [jobs, setJobs] = useState([]);
  const [category, setCategory] = useState('ALL');
  const [skillSearch, setSkillSearch] = useState('');
  const [activeSkill, setActiveSkill] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 6,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch jobs whenever category, activeSkill, or page changes
  useEffect(() => {
    let isMounted = true;

    const fetchJobs = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (category !== 'ALL') {
          params.append('category', category);
        }
        if (activeSkill.trim()) {
          params.append('skill', activeSkill.trim());
        }
        params.append('page', page.toString());
        params.append('pageSize', pageSize.toString());

        const res = await api.get(`/jobs?${params.toString()}`);
        if (isMounted) {
          setJobs(res.data.jobs || []);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch open tech gigs. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      isMounted = false;
    };
  }, [category, activeSkill, page, pageSize]);

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setPage(1); // Reset page on category switch
  };

  const handleSkillSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSkill(skillSearch);
    setPage(1); // Reset page on new search
  };

  const handleClearSkill = () => {
    setSkillSearch('');
    setActiveSkill('');
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b-4 border-ink">
        <div>
          <div className="inline-flex items-center gap-1.5 brutal-badge bg-jake text-ink text-xs mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            FIXED-BUDGET TECH GIGS
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-heading text-ink">
            OPEN TECH GIGS
          </h1>
          <p className="text-sm sm:text-base font-medium text-gray-700 mt-1">
            Browse verified tech gigs with guaranteed, protected payments.
          </p>
        </div>

        {/* STRICT ROLE-AWARE: Show Post Gig button ONLY for verified CLIENT */}
        {isClient && (
          <Link
            to="/post-job"
            className="brutal-btn bg-jake text-ink text-sm py-2.5 px-5 shadow-brutal flex items-center gap-2 self-stretch md:self-auto justify-center"
          >
            <PlusCircle className="w-4 h-4" />
            + POST A GIG
          </Link>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase text-gray-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`brutal-badge text-xs px-3 py-1.5 cursor-pointer transition-all ${
                category === cat
                  ? 'bg-finn text-ink shadow-brutal translate-x-[-1px] translate-y-[-1px]'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-brutal-sm'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Skill Search Bar */}
        <form
          onSubmit={handleSkillSearchSubmit}
          className="flex gap-2 max-w-md"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Filter by skill (e.g. React, Docker, Python)..."
              className="brutal-input pl-9 text-xs"
            />
          </div>
          <button
            type="submit"
            className="brutal-btn bg-paper text-ink text-xs px-4 py-2"
          >
            Filter
          </button>
          {activeSkill && (
            <button
              type="button"
              onClick={handleClearSkill}
              className="px-3 py-2 border-2 border-ink rounded bg-bubblegum text-xs font-bold hover:bg-white transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        {/* Active Filters Tag Display */}
        {(category !== 'ALL' || activeSkill) && (
          <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
            <span>Active filters:</span>
            {category !== 'ALL' && (
              <span className="brutal-badge bg-paper text-ink text-[11px]">
                Category: {category}
              </span>
            )}
            {activeSkill && (
              <span className="brutal-badge bg-paper text-ink text-[11px]">
                Skill: #{activeSkill}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Gigs Listing */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block p-6 brutal-card bg-paper">
            <div className="w-10 h-10 border-4 border-ink border-t-finn rounded-full animate-spin mx-auto mb-3"></div>
            <p className="font-heading font-black text-lg text-ink">
              LOADING GIGS...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="brutal-card p-8 bg-bubblegum text-center border-4 border-ink shadow-brutal">
          <p className="font-bold text-ink">{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="brutal-card p-12 text-center bg-white border-4 border-ink shadow-brutal max-w-xl mx-auto">
          <div className="w-16 h-16 bg-paper border-3 border-ink rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brutal-sm">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>

          {/* STRICT ROLE-AWARE EMPTY STATE */}
          {isClient ? (
            <>
              <h3 className="text-2xl font-black font-heading text-ink mb-2">
                No Gigs in this Category Yet
              </h3>
              <p className="text-sm font-medium text-gray-600 mb-6">
                Be the first client to post a fixed-budget gig in this category!
              </p>
              <Link
                to="/post-job"
                className="brutal-btn bg-jake text-xs py-2.5 px-6 shadow-brutal-sm inline-block"
              >
                + POST FIRST GIG
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-black font-heading text-ink mb-2">
                No Open Gigs Found
              </h3>
              <p className="text-sm font-medium text-gray-600">
                No open tech gigs in this category right now—check back soon!
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Gig Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t-4 border-ink">
              <span className="text-xs font-bold text-gray-600 font-mono">
                Showing {jobs.length} of {pagination.total} total{' '}
                {pagination.total === 1 ? 'gig' : 'gigs'} (Page{' '}
                {pagination.page} of {pagination.totalPages})
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="brutal-btn bg-white text-xs py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-brutal-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <span className="px-3 py-2 border-2 border-ink rounded font-mono font-black text-xs bg-paper">
                  {page} / {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(prev + 1, pagination.totalPages)
                    )
                  }
                  className="brutal-btn bg-white text-xs py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-brutal-sm"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
