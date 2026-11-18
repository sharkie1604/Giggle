import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  ShieldCheck,
  FileText,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Trash2,
  Check,
  Users,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modals state
  const [withdrawModal, setWithdrawModal] = useState({
    isOpen: false,
    proposalId: null,
    jobTitle: '',
  });
  const [acceptModal, setAcceptModal] = useState({
    isOpen: false,
    proposalId: null,
    freelancerName: '',
    gigTitle: '',
    budget: 0,
  });
  const [modalLoading, setModalLoading] = useState(false);

  // Expanded gig applicant drawers on Client Dashboard (by default open for active jobs)
  const [expandedGigs, setExpandedGigs] = useState({});

  const toggleGigExpansion = (gigId) => {
    setExpandedGigs((prev) => ({
      ...prev,
      [gigId]: !prev[gigId],
    }));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/users/me/dashboard');
      setData(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load dashboard data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Freelancer Withdraw Proposal
  const handleConfirmWithdraw = async () => {
    if (!withdrawModal.proposalId) return;
    setModalLoading(true);
    setActionSuccess('');
    setError('');

    try {
      await api.delete(`/proposals/${withdrawModal.proposalId}`);
      setActionSuccess('Proposal withdrawn successfully.');
      setWithdrawModal({ isOpen: false, proposalId: null, jobTitle: '' });
      await fetchDashboardData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to withdraw proposal.';
      setError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  // Client Accept & Hire
  const handleConfirmAccept = async () => {
    if (!acceptModal.proposalId) return;
    setModalLoading(true);
    setActionSuccess('');
    setError('');

    try {
      await api.patch(`/proposals/${acceptModal.proposalId}/accept`);
      setActionSuccess(
        `Freelancer hired for "${acceptModal.gigTitle}"! Next step: fund payment protection.`
      );
      setAcceptModal({
        isOpen: false,
        proposalId: null,
        freelancerName: '',
        gigTitle: '',
        budget: 0,
      });
      await fetchDashboardData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to accept proposal.';
      setError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="inline-block p-6 bg-paper border-4 border-ink shadow-brutal rounded-2xl">
          <div className="animate-spin w-10 h-10 border-4 border-ink border-t-jake rounded-full mx-auto mb-4" />
          <h2 className="font-heading font-black text-xl text-ink">
            Loading your Giggle workspace...
          </h2>
          <p className="text-xs font-bold text-ink/60 mt-1">
            Fetching live gigs, proposals, and protected balances.
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="p-8 bg-bubblegum/20 border-4 border-ink shadow-brutal rounded-2xl text-center">
          <AlertCircle className="w-12 h-12 text-ink mx-auto mb-3" />
          <h2 className="font-heading font-black text-2xl text-ink mb-2">
            Workspace Error
          </h2>
          <p className="font-medium text-ink/80 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="brutal-btn bg-jake text-ink px-6 py-2.5 font-black text-sm"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const role = user?.role || data?.role;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b-4 border-ink">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`brutal-badge ${
                role === 'CLIENT' ? 'bg-finn' : 'bg-jake'
              } text-ink text-xs font-black tracking-wide`}
            >
              {role === 'CLIENT' ? 'CLIENT WORKSPACE' : 'FREELANCER WORKSPACE'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-ink">
            Welcome, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm font-medium text-ink/70 mt-1">
            {role === 'CLIENT'
              ? 'Manage your posted gigs, review incoming proposals, and track hires.'
              : 'Track submitted proposals, inspect delivery status, and monitor protected funds.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/transactions"
            className="brutal-btn bg-white text-ink text-xs sm:text-sm font-black flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-bmo" />
            <span>Payment History</span>
          </Link>
          {role === 'CLIENT' ? (
            <Link
              to="/post-job"
              className="brutal-btn bg-finn text-ink text-xs sm:text-sm font-black flex items-center gap-1.5"
            >
              <span>+ Post a Gig</span>
            </Link>
          ) : (
            <Link
              to="/jobs"
              className="brutal-btn bg-jake text-ink text-xs sm:text-sm font-black flex items-center gap-1.5"
            >
              <Briefcase className="w-4 h-4" />
              <span>Browse Gigs</span>
            </Link>
          )}
        </div>
      </div>

      {/* Global Success / Feedback Banner */}
      {actionSuccess && (
        <div className="mb-6 p-4 bg-bmo/20 border-3 border-ink rounded-xl shadow-brutal-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-ink text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 text-bmo flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess('')}
            className="text-xs font-bold text-ink underline hover:text-ink/70 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-bubblegum/20 border-3 border-ink rounded-xl shadow-brutal-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-ink text-sm font-bold">
            <AlertCircle className="w-5 h-5 text-ink flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-xs font-bold text-ink underline hover:text-ink/70 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          ROLE A: FREELANCER DASHBOARD
      ──────────────────────────────────────────────────────────────────────── */}
      {role === 'FREELANCER' && (
        <div className="space-y-8">
          {/* Freelancer Live Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Stat 1: Active Gigs */}
            <div className="brutal-card p-6 bg-paper border-4 border-ink shadow-brutal">
              <div className="flex items-center justify-between mb-3">
                <span className="font-heading font-black text-xs uppercase tracking-wider text-ink/70">
                  Active Gigs
                </span>
                <div className="w-9 h-9 rounded-lg border-2 border-ink bg-finn/30 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-ink" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-ink">
                {data?.stats?.activeGigsCount ?? 0}
              </p>
              <p className="text-xs font-medium text-ink/60 mt-1">
                Gigs in progress with accepted proposals
              </p>
            </div>

            {/* Stat 2: Protected Funds */}
            <div className="brutal-card p-6 bg-paper border-4 border-ink shadow-brutal">
              <div className="flex items-center justify-between mb-3">
                <span className="font-heading font-black text-xs uppercase tracking-wider text-ink/70">
                  Protected Funds
                </span>
                <div className="w-9 h-9 rounded-lg border-2 border-ink bg-bmo/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-bmo" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-ink">
                ₹{Number(data?.stats?.protectedAmount ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-medium text-ink/60 mt-1">
                Secured by clients in protected payment vaults
              </p>
            </div>

            {/* Stat 3: Proposals Sent */}
            <div className="brutal-card p-6 bg-paper border-4 border-ink shadow-brutal">
              <div className="flex items-center justify-between mb-3">
                <span className="font-heading font-black text-xs uppercase tracking-wider text-ink/70">
                  Proposals Sent
                </span>
                <div className="w-9 h-9 rounded-lg border-2 border-ink bg-jake/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-ink" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-ink">
                {data?.stats?.totalProposalsCount ?? 0}
              </p>
              <p className="text-xs font-medium text-ink/60 mt-1">
                {data?.stats?.acceptedProposalsCount ?? 0} accepted by clients
              </p>
            </div>
          </div>

          {/* Freelancer Proposals & Work Tracker */}
          <div className="brutal-card p-6 sm:p-8 bg-paper border-4 border-ink shadow-brutal">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b-3 border-ink">
              <div>
                <h2 className="font-heading font-black text-2xl text-ink">
                  My Sent Proposals & Work Status
                </h2>
                <p className="text-xs font-medium text-ink/70 mt-0.5">
                  Live status of your submitted technical proposals and client hires.
                </p>
              </div>
              <span className="brutal-badge bg-white text-ink font-mono text-xs font-black">
                {data?.proposals?.length ?? 0} TOTAL
              </span>
            </div>

            {(!data?.proposals || data.proposals.length === 0) ? (
              <div className="text-center py-12 px-4 border-3 border-dashed border-ink/40 rounded-xl bg-white/60">
                <FileText className="w-12 h-12 text-ink/40 mx-auto mb-3" />
                <h3 className="font-heading font-black text-lg text-ink">
                  No proposals submitted yet
                </h3>
                <p className="text-xs sm:text-sm font-medium text-ink/70 max-w-md mx-auto mt-1 mb-6">
                  Browse open tech gigs on the feed and submit fixed-budget proposals to get hired.
                </p>
                <Link
                  to="/jobs"
                  className="brutal-btn bg-jake text-ink px-6 py-2.5 text-sm font-black inline-flex items-center gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Browse Open Tech Gigs</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {data.proposals.map((prop) => {
                  const job = prop.job;
                  const isAccepted = prop.status === 'ACCEPTED';
                  const isPending = prop.status === 'PENDING';
                  const isRejected = prop.status === 'REJECTED';
                  const escrowStatus = job?.escrow?.status;

                  return (
                    <div
                      key={prop.id}
                      className="border-3 border-ink rounded-xl p-5 bg-white shadow-brutal-sm transition hover:shadow-brutal"
                    >
                      {/* Proposal Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b-2 border-ink/10">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="brutal-badge bg-finn/20 text-ink text-[10px] font-black">
                              {job?.category || 'TECH GIG'}
                            </span>
                            <span
                              className={`brutal-badge text-[10px] font-black ${
                                isAccepted
                                  ? 'bg-bmo text-ink'
                                  : isPending
                                  ? 'bg-jake text-ink'
                                  : 'bg-bubblegum text-ink'
                              }`}
                            >
                              PROPOSAL: {prop.status}
                            </span>
                          </div>
                          <Link
                            to={`/jobs/${job?.id}`}
                            className="font-heading font-black text-lg sm:text-xl text-ink hover:text-finn transition flex items-center gap-1.5 group"
                          >
                            <span>{job?.title}</span>
                            <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                          </Link>
                          <p className="text-xs font-semibold text-ink/70 mt-0.5">
                            Client:{' '}
                            <Link
                              to={`/users/${job?.client?.id}`}
                              className="font-bold underline text-ink hover:text-finn"
                            >
                              {job?.client?.name}
                            </Link>{' '}
                            • Applied on{' '}
                            {new Date(prop.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        {/* Budget & Timeline Pill */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-[10px] font-black uppercase text-ink/60">
                              Fixed Budget
                            </div>
                            <div className="font-mono font-black text-lg text-ink">
                              ₹{Number(job?.budget || 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div className="border-l-2 border-ink/20 pl-3 text-right">
                            <div className="text-[10px] font-black uppercase text-ink/60">
                              Estimated
                            </div>
                            <div className="font-mono font-bold text-sm text-ink">
                              {prop.estimatedDays} {prop.estimatedDays === 1 ? 'day' : 'days'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Proposal Technical Approach Snippet */}
                      <div className="py-3 text-xs sm:text-sm font-medium text-ink/80 leading-relaxed">
                        <span className="font-bold text-ink uppercase text-[10px] block text-ink/60 mb-0.5">
                          My Technical Approach:
                        </span>
                        <p className="bg-paper/60 p-3 rounded-lg border border-ink/20 whitespace-pre-line">
                          {prop.proposalNote}
                        </p>
                      </div>

                      {/* ACCEPTED STATUS BANNERS (CRITICAL GIGGLE WORKFLOW) */}
                      {isAccepted && (
                        <div className="mt-3">
                          {escrowStatus === 'PENDING' ? (
                            <div className="p-4 bg-jake/30 border-2 border-ink rounded-xl shadow-brutal-xs">
                              <div className="flex items-start gap-2.5">
                                <AlertCircle className="w-5 h-5 text-ink mt-0.5 flex-shrink-0" />
                                <div>
                                  <h4 className="font-heading font-black text-sm text-ink">
                                    Waiting for Client Payment — Do Not Start Work Yet
                                  </h4>
                                  <p className="text-xs font-medium text-ink/80 mt-0.5 leading-relaxed">
                                    Great job! The client accepted your proposal. However, payment protection has not yet been funded. To ensure your time and code are 100% guaranteed, do not submit work until the client deposits funds into protected payment.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : escrowStatus === 'FUNDED' ? (
                            <div className="p-4 bg-bmo/25 border-2 border-ink rounded-xl shadow-brutal-xs">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-2.5">
                                  <ShieldCheck className="w-5 h-5 text-bmo mt-0.5 flex-shrink-0" />
                                  <div>
                                    <h4 className="font-heading font-black text-sm text-ink">
                                      Payment Protected (₹{Number(job?.budget || 0).toLocaleString('en-IN')}) — Safe to Start Work & Submit Delivery!
                                    </h4>
                                    <p className="text-xs font-medium text-ink/80 mt-0.5">
                                      The client has fully funded this gig into Giggle's protected payment vault. Your payout is guaranteed upon completing deliverables.
                                    </p>
                                  </div>
                                </div>
                                <Link
                                  to={`/jobs/${job?.id}`}
                                  className="brutal-btn bg-bmo text-ink text-xs font-black py-2 px-4 shadow-brutal-xs flex-shrink-0 flex items-center justify-center gap-1"
                                >
                                  <span>View Gig Workspace</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-paper border border-ink rounded-lg text-xs font-semibold text-ink flex items-center justify-between">
                              <span>Work completed & payment released.</span>
                              <Link
                                to={`/jobs/${job?.id}`}
                                className="font-bold underline text-ink hover:text-finn"
                              >
                                View Details →
                              </Link>
                            </div>
                          )}
                        </div>
                      )}

                      {/* PENDING STATUS ACTIONS: Withdraw Button */}
                      {isPending && (
                        <div className="mt-3 pt-3 border-t border-ink/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs font-medium text-ink/60">
                            The client has not made a hiring decision yet.
                          </span>
                          <button
                            onClick={() =>
                              setWithdrawModal({
                                isOpen: true,
                                proposalId: prop.id,
                                jobTitle: job?.title || 'this gig',
                              })
                            }
                            className="brutal-btn bg-bubblegum/20 hover:bg-bubblegum text-ink text-xs font-bold py-1.5 px-3 shadow-brutal-xs flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Withdraw Proposal</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          ROLE B: CLIENT DASHBOARD
      ──────────────────────────────────────────────────────────────────────── */}
      {role === 'CLIENT' && (
        <div className="space-y-8">
          {/* Client Live Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Stat 1: Open Gigs */}
            <div className="brutal-card p-6 bg-paper border-4 border-ink shadow-brutal">
              <div className="flex items-center justify-between mb-3">
                <span className="font-heading font-black text-xs uppercase tracking-wider text-ink/70">
                  Open Gigs
                </span>
                <div className="w-9 h-9 rounded-lg border-2 border-ink bg-jake/30 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-ink" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-ink">
                {data?.stats?.openGigsCount ?? 0}
              </p>
              <p className="text-xs font-medium text-ink/60 mt-1">
                Active listings currently accepting proposals
              </p>
            </div>

            {/* Stat 2: Active Hires */}
            <div className="brutal-card p-6 bg-paper border-4 border-ink shadow-brutal">
              <div className="flex items-center justify-between mb-3">
                <span className="font-heading font-black text-xs uppercase tracking-wider text-ink/70">
                  Active Hires
                </span>
                <div className="w-9 h-9 rounded-lg border-2 border-ink bg-finn/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-ink" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-ink">
                {data?.stats?.activeGigsCount ?? 0}
              </p>
              <p className="text-xs font-medium text-ink/60 mt-1">
                Gigs locked to IN_PROGRESS with hired engineers
              </p>
            </div>

            {/* Stat 3: Total Proposals Received */}
            <div className="brutal-card p-6 bg-paper border-4 border-ink shadow-brutal">
              <div className="flex items-center justify-between mb-3">
                <span className="font-heading font-black text-xs uppercase tracking-wider text-ink/70">
                  Proposals Received
                </span>
                <div className="w-9 h-9 rounded-lg border-2 border-ink bg-bmo/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-bmo" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-ink">
                {data?.stats?.totalProposalsReceived ?? 0}
              </p>
              <p className="text-xs font-medium text-ink/60 mt-1">
                Applications received across all posted gigs
              </p>
            </div>
          </div>

          {/* Client Posted Gigs & Incoming Proposals Workspace */}
          <div className="brutal-card p-6 sm:p-8 bg-paper border-4 border-ink shadow-brutal">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b-3 border-ink">
              <div>
                <h2 className="font-heading font-black text-2xl text-ink">
                  My Posted Gigs & Incoming Proposals
                </h2>
                <p className="text-xs font-medium text-ink/70 mt-0.5">
                  Review applicant technical approaches and hire developers directly from this desk.
                </p>
              </div>
              <Link
                to="/post-job"
                className="brutal-btn bg-finn text-ink text-xs font-black py-2 px-4 shadow-brutal-sm self-start sm:self-auto flex items-center gap-1.5"
              >
                <span>+ Post New Gig</span>
              </Link>
            </div>

            {(!data?.jobs || data.jobs.length === 0) ? (
              <div className="text-center py-12 px-4 border-3 border-dashed border-ink/40 rounded-xl bg-white/60">
                <Briefcase className="w-12 h-12 text-ink/40 mx-auto mb-3" />
                <h3 className="font-heading font-black text-lg text-ink">
                  You haven't posted any gigs yet
                </h3>
                <p className="text-xs sm:text-sm font-medium text-ink/70 max-w-md mx-auto mt-1 mb-6">
                  Post a fixed-price technical gig and start receiving competitive engineering proposals with zero bidding wars.
                </p>
                <Link
                  to="/post-job"
                  className="brutal-btn bg-finn text-ink px-6 py-2.5 text-sm font-black inline-flex items-center gap-2"
                >
                  <span>Post Your First Tech Gig</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {data.jobs.map((job) => {
                  const proposals = job.proposals || [];
                  const pendingProposals = proposals.filter((p) => p.status === 'PENDING');
                  const isExpanded = expandedGigs[job.id] !== false; // expanded by default
                  const isHiredWithoutFunding =
                    job.status === 'IN_PROGRESS' && job.escrow?.status === 'PENDING';
                  const isFunded =
                    job.status === 'IN_PROGRESS' && job.escrow?.status === 'FUNDED';

                  return (
                    <div
                      key={job.id}
                      className="border-3 border-ink rounded-xl p-5 sm:p-6 bg-white shadow-brutal-sm"
                    >
                      {/* Gig Card Header */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b-2 border-ink/10">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="brutal-badge bg-finn/20 text-ink text-[10px] font-black">
                              {job.category}
                            </span>
                            <span
                              className={`brutal-badge text-[10px] font-black ${
                                job.status === 'OPEN'
                                  ? 'bg-jake text-ink'
                                  : job.status === 'IN_PROGRESS'
                                  ? 'bg-finn text-ink'
                                  : job.status === 'COMPLETED'
                                  ? 'bg-bmo text-ink'
                                  : 'bg-bubblegum text-ink'
                              }`}
                            >
                              GIG: {job.status}
                            </span>
                            <span className="brutal-badge bg-paper text-ink text-[10px] font-bold">
                              {proposals.length} {proposals.length === 1 ? 'PROPOSAL' : 'PROPOSALS'}
                            </span>
                          </div>

                          <Link
                            to={`/jobs/${job.id}`}
                            className="font-heading font-black text-xl sm:text-2xl text-ink hover:text-finn transition flex items-center gap-2 group"
                          >
                            <span>{job.title}</span>
                            <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                          </Link>
                          <p className="text-xs font-semibold text-ink/70 mt-1">
                            Deadline:{' '}
                            {new Date(job.deadline).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        {/* Budget Display */}
                        <div className="text-left md:text-right flex-shrink-0">
                          <span className="text-[10px] font-black uppercase text-ink/60 block">
                            Fixed Budget
                          </span>
                          <span className="font-mono font-black text-xl sm:text-2xl text-ink">
                            ₹{Number(job.budget).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* IN-PROGRESS ACTION BANNER FOR CLIENTS */}
                      {isHiredWithoutFunding && (
                        <div className="my-4 p-4 bg-jake/30 border-2 border-ink rounded-xl shadow-brutal-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle className="w-5 h-5 text-ink mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-heading font-black text-sm text-ink">
                                Hired: {job.escrow?.freelancer?.name || 'Developer'} — Next Step: Fund Payment Protection
                              </h4>
                              <p className="text-xs font-medium text-ink/80 mt-0.5">
                                Your freelancer cannot start writing or submitting deliverables until payment protection is funded.
                              </p>
                            </div>
                          </div>
                          <Link
                            to={`/jobs/${job.id}`}
                            className="brutal-btn bg-jake text-ink text-xs font-black py-2 px-4 shadow-brutal-xs flex-shrink-0 self-start sm:self-auto flex items-center gap-1"
                          >
                            <span>Fund Payment Protection →</span>
                          </Link>
                        </div>
                      )}

                      {isFunded && (
                        <div className="my-4 p-4 bg-bmo/25 border-2 border-ink rounded-xl shadow-brutal-xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-5 h-5 text-bmo flex-shrink-0" />
                            <div>
                              <h4 className="font-heading font-black text-sm text-ink">
                                Payment Protected (₹{Number(job.budget).toLocaleString('en-IN')}) — Work in Progress
                              </h4>
                              <p className="text-xs font-medium text-ink/80 mt-0.5">
                                {job.escrow?.freelancer?.name || 'Developer'} is currently working on your gig.
                              </p>
                            </div>
                          </div>
                          <Link
                            to={`/jobs/${job.id}`}
                            className="text-xs font-black underline text-ink hover:text-finn flex-shrink-0"
                          >
                            View Workspace →
                          </Link>
                        </div>
                      )}

                      {/* Incoming Proposals Section Toggle */}
                      {job.status === 'OPEN' && (
                        <div className="mt-4 pt-4 border-t border-ink/15">
                          <button
                            onClick={() => toggleGigExpansion(job.id)}
                            className="flex items-center justify-between w-full text-left cursor-pointer group"
                          >
                            <span className="font-heading font-black text-sm text-ink flex items-center gap-2">
                              <span>Applicants ({proposals.length})</span>
                              {pendingProposals.length > 0 && (
                                <span className="bg-jake text-ink text-[10px] font-black px-2 py-0.5 rounded-full border border-ink">
                                  {pendingProposals.length} pending review
                                </span>
                              )}
                            </span>
                            <span className="text-xs font-bold text-ink/60 flex items-center gap-1 group-hover:text-ink">
                              <span>{isExpanded ? 'Hide Proposals' : 'Review Proposals'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </span>
                          </button>

                          {/* Proposals Drawer */}
                          {isExpanded && (
                            <div className="mt-4 space-y-4">
                              {proposals.length === 0 ? (
                                <p className="text-xs font-medium text-ink/60 italic py-2">
                                  No proposals received yet. Your gig is visible to developers in the feed!
                                </p>
                              ) : (
                                proposals.map((prop) => (
                                  <div
                                    key={prop.id}
                                    className="p-4 bg-paper rounded-xl border-2 border-ink space-y-3"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div>
                                        <Link
                                          to={`/users/${prop.freelancer.id}`}
                                          className="font-heading font-black text-base text-ink hover:text-finn flex items-center gap-1.5"
                                        >
                                          <span>{prop.freelancer.name}</span>
                                          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                        </Link>
                                        <span className="text-xs font-bold text-ink/60">
                                          ⏱️ Delivery in {prop.estimatedDays}{' '}
                                          {prop.estimatedDays === 1 ? 'day' : 'days'}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`brutal-badge text-[10px] font-black ${
                                            prop.status === 'ACCEPTED'
                                              ? 'bg-bmo text-ink'
                                              : prop.status === 'REJECTED'
                                              ? 'bg-bubblegum text-ink'
                                              : 'bg-white text-ink'
                                          }`}
                                        >
                                          {prop.status}
                                        </span>

                                        {prop.status === 'PENDING' && (
                                          <button
                                            onClick={() =>
                                              setAcceptModal({
                                                isOpen: true,
                                                proposalId: prop.id,
                                                freelancerName: prop.freelancer.name,
                                                gigTitle: job.title,
                                                budget: Number(job.budget),
                                              })
                                            }
                                            className="brutal-btn bg-jake text-ink text-xs font-black py-1.5 px-3 shadow-brutal-xs flex items-center gap-1 cursor-pointer"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Accept & Hire</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Proposal Note */}
                                    <div className="bg-white p-3 rounded border border-ink/30 text-xs font-medium text-ink whitespace-pre-line leading-relaxed">
                                      {prop.proposalNote}
                                    </div>

                                    {/* Freelancer Skills */}
                                    {prop.freelancer.skills && prop.freelancer.skills.length > 0 && (
                                      <div className="flex flex-wrap gap-1 items-center">
                                        <span className="text-[10px] font-bold text-ink/50 uppercase mr-1">
                                          Skills:
                                        </span>
                                        {prop.freelancer.skills.map((skill) => (
                                          <span
                                            key={skill}
                                            className="text-[10px] font-mono font-bold bg-white border border-ink px-1.5 py-0.5 rounded text-ink"
                                          >
                                            #{skill}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal: Freelancer Withdraw Proposal */}
      <ConfirmModal
        isOpen={withdrawModal.isOpen}
        title="Withdraw Proposal?"
        message={`Are you sure you want to withdraw your proposal for "${withdrawModal.jobTitle}"? You can apply again while the gig remains open.`}
        confirmLabel="Withdraw Proposal"
        cancelLabel="Keep Proposal"
        variant="bubblegum"
        loading={modalLoading}
        onConfirm={handleConfirmWithdraw}
        onCancel={() => !modalLoading && setWithdrawModal({ isOpen: false, proposalId: null, jobTitle: '' })}
      />

      {/* Confirmation Modal: Client Accept & Hire */}
      <ConfirmModal
        isOpen={acceptModal.isOpen}
        title="Accept Proposal & Hire"
        message={
          <div>
            <p>
              Hire <span className="font-bold text-ink">{acceptModal.freelancerName}</span> for{' '}
              <span className="font-bold text-ink">"{acceptModal.gigTitle}"</span>?
            </p>
            <p className="mt-2 text-xs font-semibold text-gray-600">
              This will lock the gig to <span className="font-mono font-bold text-ink">IN_PROGRESS</span>, create your payment protection vault for ₹{acceptModal.budget ? Number(acceptModal.budget).toLocaleString('en-IN') : '...'}, and respectfully decline competing proposals.
            </p>
          </div>
        }
        confirmLabel="Accept & Lock Gig"
        cancelLabel="Review Later"
        variant="jake"
        loading={modalLoading}
        onConfirm={handleConfirmAccept}
        onCancel={() =>
          !modalLoading &&
          setAcceptModal({
            isOpen: false,
            proposalId: null,
            freelancerName: '',
            gigTitle: '',
            budget: 0,
          })
        }
      />
    </div>
  );
}
