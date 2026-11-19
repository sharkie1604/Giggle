import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  IndianRupee,
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  User,
  Briefcase,
  Sparkles,
  ArrowRight,
  Trash2,
  Check,
  ExternalLink,
  Send,
  Users,
  Star,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import EscrowVaultCard from '../components/escrow/EscrowVaultCard';
import MessageThread from '../components/jobs/MessageThread';

export default function JobDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Client proposals drawer state
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [cancellingJob, setCancellingJob] = useState(false);

  // Freelancer proposal form state
  const [proposalNote, setProposalNote] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalError, setProposalError] = useState('');
  const [submittedProposal, setSubmittedProposal] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  // Confirmation Modals State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [acceptModalData, setAcceptModalData] = useState({
    isOpen: false,
    proposalId: null,
    freelancerName: '',
  });

  // Success message toast/banner
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Two-way review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const isOwnerClient =
    isAuthenticated && user?.role === 'CLIENT' && user?.id === job?.client?.id;
  const isNonOwnerClient =
    isAuthenticated && user?.role === 'CLIENT' && user?.id !== job?.client?.id;
  const isFreelancer = isAuthenticated && user?.role === 'FREELANCER';
  const isHiredFreelancer =
    isAuthenticated &&
    user?.role === 'FREELANCER' &&
    job?.escrow?.freelancerId === user?.id;
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  const isParticipant =
    isAuthenticated &&
    (user?.id === job?.clientId || user?.id === job?.escrow?.freelancerId);
  const userHasReviewed =
    job?.reviews?.some((r) => r.reviewerId === user?.id);
  const isGuest = !isAuthenticated;

  // 1. Fetch main job details
  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data.job);
      return res.data.job;
    } catch (err) {
      setError(
        err.response?.status === 404
          ? 'Gig not found.'
          : 'Failed to load gig details.'
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch proposals if viewing client is owner
  const fetchProposals = async () => {
    if (!id) return;
    setLoadingProposals(true);
    try {
      const res = await api.get(`/jobs/${id}/proposals`);
      setProposals(res.data.proposals || []);
    } catch (err) {
      console.error('Failed to load proposals:', err);
    } finally {
      setLoadingProposals(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      setError('');
      const fetchedJob = await fetchJob();
      if (
        isMounted &&
        fetchedJob &&
        user?.role === 'CLIENT' &&
        user?.id === fetchedJob.client?.id
      ) {
        await fetchProposals();
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [id, user?.id, user?.role]);

  // Handler: Freelancer submits technical proposal
  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    setProposalError('');
    setFeedbackSuccess('');

    if (proposalNote.trim().length < 20) {
      setProposalError('Proposal note must be at least 20 characters long.');
      return;
    }

    const days = parseInt(estimatedDays, 10);
    if (!days || days < 1) {
      setProposalError('Estimated delivery must be at least 1 day.');
      return;
    }

    setSubmittingProposal(true);

    try {
      const res = await api.post(`/jobs/${id}/proposals`, {
        proposalNote: proposalNote.trim(),
        estimatedDays: days,
      });

      setSubmittedProposal(res.data.proposal);
      setFeedbackSuccess('Your proposal has been submitted to the client!');
      setProposalNote('');
      setEstimatedDays('');
    } catch (err) {
      if (err.response?.status === 409) {
        setProposalError('You have already applied to this gig.');
      } else {
        const data = err.response?.data;
        let apiMsg = 'Failed to submit proposal. Please check your fields.';
        if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          apiMsg = data.errors.map((e) => e.message || e).join('. ');
        } else if (data?.message) {
          apiMsg = data.message;
        }
        setProposalError(apiMsg);
      }
    } finally {
      setSubmittingProposal(false);
    }
  };

  // Handler: Freelancer withdraws pending proposal
  const handleWithdrawProposal = async () => {
    if (!submittedProposal?.id) return;
    setWithdrawing(true);
    setProposalError('');

    try {
      await api.delete(`/proposals/${submittedProposal.id}`);
      setSubmittedProposal(null);
      setWithdrawModalOpen(false);
      setFeedbackSuccess(
        'Proposal withdrawn successfully. You can apply again while the gig remains open.'
      );
    } catch (err) {
      const data = err.response?.data;
      let apiMsg = 'Failed to withdraw proposal.';
      if (data?.message) apiMsg = data.message;
      setProposalError(apiMsg);
    } finally {
      setWithdrawing(false);
    }
  };

  // Handler: Client owner accepts proposal (atomic transaction)
  const handleAcceptProposal = async () => {
    const proposalId = acceptModalData.proposalId;
    if (!proposalId) return;

    setAcceptingId(proposalId);
    setFeedbackSuccess('');
    setError('');

    try {
      await api.patch(`/proposals/${proposalId}/accept`);
      setAcceptModalData({ isOpen: false, proposalId: null, freelancerName: '' });
      setFeedbackSuccess(
        'Freelancer hired! Next step: fund payment protection to kick off work.'
      );
      await fetchJob();
      await fetchProposals();
    } catch (err) {
      const data = err.response?.data;
      let apiMsg = 'Failed to accept proposal.';
      if (data?.message) apiMsg = data.message;
      setError(apiMsg);
    } finally {
      setAcceptingId(null);
    }
  };

  // Handler: Client owner cancels gig
  const handleCancelJob = async () => {
    setCancellingJob(true);
    setFeedbackSuccess('');
    setError('');

    try {
      await api.delete(`/jobs/${id}`);
      setCancelModalOpen(false);
      setFeedbackSuccess('Gig has been cancelled.');
      await fetchJob();
    } catch (err) {
      const data = err.response?.data;
      let apiMsg = 'Failed to cancel gig.';
      if (data?.message) apiMsg = data.message;
      setError(apiMsg);
    } finally {
      setCancellingJob(false);
    }
  };

  // Handler: Participant leaves two-way review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      await api.post(`/jobs/${id}/reviews`, {
        rating: Number(reviewRating),
        comment: reviewComment.trim() || undefined,
      });
      setReviewSuccess('Thank you! Your verified review has been published.');
      setReviewComment('');
      await fetchJob();
    } catch (err) {
      const data = err.response?.data;
      let apiMsg = 'Failed to submit review.';
      if (data?.message) apiMsg = data.message;
      setReviewError(apiMsg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getJobStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-jake text-ink';
      case 'IN_PROGRESS':
        return 'bg-finn text-ink';
      case 'COMPLETED':
        return 'bg-bmo text-ink';
      case 'CANCELLED':
        return 'bg-bubblegum text-ink';
      default:
        return 'bg-paper text-ink';
    }
  };

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-block p-6 brutal-card bg-paper border-4 border-ink shadow-brutal">
          <div className="w-10 h-10 border-4 border-ink border-t-finn rounded-full animate-spin mx-auto mb-3"></div>
          <p className="font-heading font-black text-lg text-ink">
            LOADING GIG DETAILS...
          </p>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center">
        <div className="brutal-card p-8 bg-white border-4 border-ink shadow-brutal">
          <div className="w-12 h-12 bg-bubblegum border-3 border-ink rounded-xl flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-ink" />
          </div>
          <h2 className="text-2xl font-black font-heading text-ink mb-2">
            GIG NOT FOUND
          </h2>
          <p className="text-sm font-semibold text-gray-700 mb-6">{error}</p>
          <Link to="/jobs" className="brutal-btn bg-jake text-xs py-2 px-4">
            BROWSE TECH GIGS
          </Link>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner / Feedback Alert */}
      {feedbackSuccess && (
        <div className="p-4 bg-jake border-3 border-ink rounded-xl shadow-brutal-sm flex items-center justify-between text-ink animate-fade-in">
          <div className="flex items-center gap-2 font-black text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
          <button
            onClick={() => setFeedbackSuccess('')}
            className="text-xs font-black underline cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* ─── GIG OVERVIEW CARD (Visible to Everyone) ───────────────────────── */}
      <div className="brutal-card p-6 sm:p-8 bg-white border-4 border-ink shadow-brutal">
        {/* Header Badges & Budget */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b-4 border-ink">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className={`brutal-badge text-xs font-black ${getCategoryBadgeColor(
                  job.category
                )}`}
              >
                {job.category}
              </span>
              <span
                className={`brutal-badge text-xs font-black ${getJobStatusBadge(
                  job.status
                )}`}
              >
                {job.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-heading text-ink">
              {job.title}
            </h1>
          </div>

          <div className="sm:text-right flex-shrink-0">
            <span className="text-[10px] uppercase font-black tracking-wider text-gray-500 block">
              Fixed Budget
            </span>
            <span className="text-2xl sm:text-4xl font-black font-mono flex items-center sm:justify-end text-ink bg-jake px-3 py-1 rounded border-2 border-ink shadow-brutal-sm">
              <IndianRupee className="w-5 h-5 sm:w-7 sm:h-7 -mr-1" />
              {Number(job.budget).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Client & Meta Info */}
        <div className="py-4 border-b-2 border-ink/20 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-gray-700">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Client Attribution Link */}
            {job.client && (
              <Link
                to={`/users/${job.client.id}`}
                className="inline-flex items-center gap-1.5 font-bold text-ink hover:text-finn transition-colors underline decoration-ink/40"
                title="View Client Profile"
              >
                <User className="w-4 h-4 text-finn" />
                <span>Posted by {job.client.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
              </Link>
            )}

            {/* Delivery Deadline */}
            <div className="flex items-center gap-1.5 text-gray-600 font-mono">
              <Clock className="w-4 h-4 text-bmo" />
              <span>
                Due{' '}
                {new Date(job.deadline).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Owner-Only: Soft Cancel Gig Action */}
          {isOwnerClient && job.status === 'OPEN' && (
            <button
              onClick={() => setCancelModalOpen(true)}
              disabled={cancellingJob}
              className="px-3 py-1.5 border-2 border-ink rounded bg-bubblegum/20 hover:bg-bubblegum text-xs font-bold text-ink transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {cancellingJob ? 'Cancelling...' : 'Cancel Gig'}
            </button>
          )}
        </div>

        {/* Job Description */}
        <div className="py-6 border-b-2 border-ink/20">
          <h3 className="font-heading font-black text-xs uppercase tracking-wider text-gray-500 mb-2">
            Gig Description & Deliverables
          </h3>
          <p className="text-ink text-sm sm:text-base font-medium whitespace-pre-line leading-relaxed">
            {job.description}
          </p>
        </div>

        {/* Required Skills */}
        <div className="pt-6">
          <h4 className="font-heading font-black text-xs uppercase tracking-wider text-gray-500 mb-2">
            Required Technical Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {job.requiredSkills && job.requiredSkills.length > 0 ? (
              job.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="brutal-badge bg-paper text-ink font-mono text-xs font-bold"
                >
                  #{skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">
                None specified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── PAYMENT PROTECTION VAULT (Visible when escrow exists for owner, freelancer, or admin) ─── */}
      {job.escrow && (isOwnerClient || isHiredFreelancer || isAdmin) && (
        <EscrowVaultCard job={job} onRefresh={fetchJob} user={user} />
      )}

      {/* ─── IN-GIG WORKROOM CHAT (Visible when escrow exists for owner, hired freelancer, or admin) ─── */}
      {job.escrow && (isOwnerClient || isHiredFreelancer || isAdmin) && (
        <MessageThread jobId={job.id} currentUserId={user?.id} />
      )}

      {/* ─── ROLE-AWARE INTERACTIVE SECTION ─────────────────────────────────── */}

      {/* CASE A: LOGGED-OUT VISITOR */}
      {isGuest && (
        <div className="brutal-card p-6 sm:p-8 bg-jake/20 border-4 border-ink shadow-brutal text-center">
          <h3 className="text-2xl font-black font-heading text-ink mb-2">
            Want to apply for this fixed-budget gig?
          </h3>
          <p className="text-sm font-medium text-gray-700 max-w-md mx-auto mb-6">
            Create a free Giggle freelancer account to submit your technical
            approach and estimated delivery timeline.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/register"
              className="brutal-btn bg-jake text-xs py-2.5 px-6 shadow-brutal-sm font-black"
            >
              SIGN UP AS FREELANCER
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 border-2 border-ink rounded font-bold text-xs bg-white hover:bg-gray-100 transition-colors"
            >
              LOG IN
            </Link>
          </div>
        </div>
      )}

      {/* CASE B: FREELANCER VIEW */}
      {isFreelancer && (
        <div className="space-y-6">
          {/* Confirmed Submitted Proposal View with Withdrawal */}
          {submittedProposal ? (
            <div className="brutal-card p-6 sm:p-8 bg-paper border-4 border-ink shadow-brutal animate-fade-in">
              <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b-2 border-ink">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-finn" />
                  <h3 className="text-lg font-black font-heading text-ink">
                    YOUR PROPOSAL IS SUBMITTED
                  </h3>
                </div>
                <span className="brutal-badge bg-jake text-ink text-xs font-black">
                  {submittedProposal.status}
                </span>
              </div>

              <p className="text-sm font-medium text-gray-700 mb-4">
                The client has received your application and technical approach.
                You will be notified when they review proposals.
              </p>

              <div className="bg-white p-4 rounded-lg border-2 border-ink mb-4 space-y-2">
                <div className="text-xs font-bold text-gray-600">
                  ⏱️{' '}
                  <span className="text-ink font-mono font-black">
                    Estimated Delivery: {submittedProposal.estimatedDays}{' '}
                    {submittedProposal.estimatedDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <div className="text-xs font-bold text-gray-500 uppercase">
                  Technical Approach:
                </div>
                <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                  {submittedProposal.proposalNote}
                </p>
              </div>

              {submittedProposal.status === 'PENDING' && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-ink/20">
                  <p className="text-xs font-semibold text-gray-500">
                    Changed your mind or want to revise? You can withdraw while
                    pending.
                  </p>
                  <button
                    onClick={() => setWithdrawModalOpen(true)}
                    disabled={withdrawing}
                    className="brutal-btn bg-bubblegum text-xs py-2 px-4 shadow-brutal-sm font-black flex items-center gap-1 cursor-pointer flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {withdrawing ? 'WITHDRAWING...' : 'WITHDRAW PROPOSAL'}
                  </button>
                </div>
              )}
            </div>
          ) : job.status === 'OPEN' ? (
            /* Proposal Submission Form (Fixed Budget, No Bidding) */
            <div className="brutal-card p-6 sm:p-8 bg-paper border-4 border-ink shadow-brutal">
              <div className="flex items-center justify-between pb-4 mb-6 border-b-3 border-ink">
                <div>
                  <span className="brutal-badge bg-jake text-ink text-[10px] mb-1 inline-block">
                    NO BIDDING • FIXED BUDGET
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-heading text-ink flex items-center gap-2">
                    <Send className="w-5 h-5 text-finn" />
                    APPLY FOR THIS GIG
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    Contract Value
                  </span>
                  <span className="font-mono font-black text-sm text-ink bg-white px-2 py-0.5 rounded border border-ink">
                    ₹{Number(job.budget).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {proposalError && (
                <div className="mb-6 p-3 bg-bubblegum border-3 border-ink rounded-lg shadow-brutal-sm flex items-start gap-2 text-ink">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm font-bold">{proposalError}</div>
                </div>
              )}

              <form onSubmit={handleSubmitProposal} className="space-y-4">
                {/* Estimated Delivery Days */}
                <div>
                  <label className="block font-bold mb-1 uppercase text-xs text-ink flex items-center justify-between">
                    <span>Estimated Delivery Timeline *</span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      Days to complete
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    step="1"
                    required
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(e.target.value)}
                    className="brutal-input font-mono"
                    placeholder="e.g. 7"
                  />
                </div>

                {/* Proposal Technical Note */}
                <div>
                  <label className="block font-bold mb-1 uppercase text-xs text-ink flex items-center justify-between">
                    <span>Technical Approach & Relevant Experience *</span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      Min 20 characters
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    minLength={20}
                    maxLength={3000}
                    value={proposalNote}
                    onChange={(e) => setProposalNote(e.target.value)}
                    className="brutal-input resize-y text-sm"
                    placeholder="Explain your technical strategy, stack choices, previous relevant projects, and milestones..."
                  />
                </div>

                {/* Fixed-Price Invariant Reminder */}
                <div className="p-3 bg-white rounded-lg border-2 border-ink text-xs font-semibold text-gray-700">
                  💡 <span className="font-bold text-ink">Zero Bidding Guarantee:</span>{' '}
                  You are applying for the full fixed budget of{' '}
                  <span className="font-bold font-mono">
                    ₹{Number(job.budget).toLocaleString('en-IN')}
                  </span>
                  . Selection is based purely on technical approach and delivery
                  timeline.
                </div>

                <button
                  type="submit"
                  disabled={submittingProposal}
                  className="brutal-btn w-full bg-finn text-ink text-sm py-3 mt-4 disabled:opacity-50 shadow-brutal-sm cursor-pointer font-heading font-black"
                >
                  {submittingProposal
                    ? 'SUBMITTING APPLICATION...'
                    : 'SUBMIT PROPOSAL'}
                </button>
              </form>
            </div>
          ) : (
            /* Gig Not Open Notice */
            <div className="brutal-card p-6 bg-paper border-4 border-ink shadow-brutal text-center">
              <h3 className="text-xl font-black font-heading text-ink mb-1">
                GIG {job.status}
              </h3>
              <p className="text-sm font-medium text-gray-700">
                This gig is no longer accepting new proposals.
              </p>
            </div>
          )}
        </div>
      )}

      {/* CASE C: GIG OWNER CLIENT VIEW (Applicant Drawer & Proposal Management) */}
      {isOwnerClient && (
        <div className="space-y-6">
          {/* Active Hire Notice for In-Progress Gigs */}
          {job.status === 'IN_PROGRESS' && (
            <div className="p-4 bg-finn/20 border-3 border-ink rounded-xl shadow-brutal-sm flex items-start gap-3 text-ink">
              <CheckCircle2 className="w-6 h-6 text-finn flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-heading font-black text-base">
                  FREELANCER HIRED!
                </h4>
                <p className="text-xs font-medium text-gray-800 mt-0.5">
                  The gig has locked and work is set to begin. Next step: fund
                  protected payment so the freelancer can commence development.
                </p>
              </div>
            </div>
          )}

          {/* Proposals Drawer */}
          <div className="brutal-card p-6 sm:p-8 bg-white border-4 border-ink shadow-brutal">
            <div className="flex items-center justify-between pb-4 mb-6 border-b-3 border-ink">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-finn" />
                <h2 className="text-xl font-black font-heading text-ink">
                  INCOMING PROPOSALS ({proposals.length})
                </h2>
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase">
                CLIENT CONSOLE
              </span>
            </div>

            {loadingProposals ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-3 border-ink border-t-finn rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs font-bold font-mono text-gray-600">
                  LOADING APPLICANTS...
                </p>
              </div>
            ) : proposals.length === 0 ? (
              <div className="p-8 text-center bg-paper border-2 border-dashed border-ink rounded-xl">
                <p className="text-sm font-bold text-gray-600">
                  No freelancers have submitted proposals for this gig yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-5 border-3 border-ink rounded-xl bg-paper shadow-brutal-sm transition-all"
                  >
                    {/* Top Row: Freelancer info, Timeline & Status */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 mb-3 border-b-2 border-ink/20">
                      <div>
                        {/* Clickable Profile Link */}
                        <Link
                          to={`/users/${prop.freelancer.id}`}
                          className="text-base font-black font-heading text-ink hover:text-finn transition-colors flex items-center gap-1.5"
                          title="Inspect Freelancer Profile"
                        >
                          <User className="w-4 h-4 text-finn" />
                          <span>{prop.freelancer.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                        </Link>
                        <span className="text-xs font-bold text-gray-600 block mt-0.5">
                          ⏱️ Delivers in {prop.estimatedDays}{' '}
                          {prop.estimatedDays === 1 ? 'day' : 'days'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`brutal-badge text-xs font-black ${
                            prop.status === 'ACCEPTED'
                              ? 'bg-finn text-ink'
                              : prop.status === 'REJECTED'
                              ? 'bg-bubblegum/40 text-ink line-through'
                              : 'bg-white text-ink'
                          }`}
                        >
                          {prop.status}
                        </span>

                        {/* Accept & Hire Button (Visible when job is OPEN and proposal is PENDING) */}
                        {job.status === 'OPEN' && prop.status === 'PENDING' && (
                          <button
                            onClick={() =>
                              setAcceptModalData({
                                isOpen: true,
                                proposalId: prop.id,
                                freelancerName: prop.freelancer.name,
                              })
                            }
                            disabled={acceptingId === prop.id}
                            className="brutal-btn bg-jake text-ink text-xs py-1.5 px-3 shadow-brutal-sm font-black flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {acceptingId === prop.id
                              ? 'ACCEPTING...'
                              : 'ACCEPT & HIRE'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Proposal Technical Note */}
                    <div className="mb-3">
                      <div className="text-[11px] font-black uppercase text-gray-500 mb-1">
                        Technical Approach
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-ink whitespace-pre-line leading-relaxed bg-white p-3 rounded border border-ink/40">
                        {prop.proposalNote}
                      </p>
                    </div>

                    {/* Freelancer Technical Skills */}
                    {prop.freelancer.skills &&
                      prop.freelancer.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[11px] font-bold text-gray-500 uppercase mr-1">
                            Skills:
                          </span>
                          {prop.freelancer.skills.map((skill) => (
                            <span
                              key={skill}
                              className="text-[11px] font-mono font-bold bg-white border border-ink px-2 py-0.5 rounded text-ink shadow-brutal-sm"
                            >
                              #{skill}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CASE D: NON-OWNER CLIENT VIEW */}
      {isNonOwnerClient && (
        <div className="brutal-card p-6 bg-white border-4 border-ink shadow-brutal">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black font-heading text-ink">
                GIG OVERVIEW
              </h3>
              <p className="text-xs font-bold text-gray-600 mt-0.5">
                This gig is posted by another client.
              </p>
            </div>
            <div className="brutal-badge bg-paper text-ink font-mono font-bold text-xs">
              {job._count?.proposals ?? 0}{' '}
              {job._count?.proposals === 1 ? 'proposal' : 'proposals'} received
            </div>
          </div>
        </div>
      )}

      {/* ─── TWO-WAY VERIFIED REVIEWS SECTION (Visible on completed gigs or when reviews exist) ─── */}
      {(job.status === 'COMPLETED' || (job.reviews && job.reviews.length > 0)) && (
        <div className="brutal-card p-6 sm:p-8 bg-paper border-4 border-ink shadow-brutal space-y-6">
          <div className="flex items-center justify-between pb-4 border-b-3 border-ink">
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-jake fill-jake" />
              <h3 className="font-heading font-black text-2xl text-ink">
                VERIFIED GIG REVIEWS ({job.reviews?.length || 0})
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold bg-white px-2 py-1 rounded border border-ink shadow-brutal-sm">
              TWO-WAY RATINGS
            </span>
          </div>

          {/* Review Submission Form for Participants */}
          {job.status === 'COMPLETED' && isParticipant && (
            <div className="p-5 bg-white border-3 border-ink rounded-xl shadow-brutal-sm">
              {userHasReviewed ? (
                <div className="flex items-center gap-3 text-ink">
                  <CheckCircle className="w-5 h-5 text-bmo flex-shrink-0" />
                  <p className="text-xs sm:text-sm font-bold">
                    You have submitted your verified review for this completed gig. Thank you!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <h4 className="font-heading font-black text-lg text-ink">
                      LEAVE A VERIFIED REVIEW
                    </h4>
                    <p className="text-xs font-medium text-gray-700 mt-0.5">
                      Share your experience working with{' '}
                      <span className="font-bold text-ink">
                        {isOwnerClient
                          ? job.escrow?.freelancer?.name || 'the freelancer'
                          : job.client?.name || 'the client'}
                      </span>
                      .
                    </p>
                  </div>

                  {reviewError && (
                    <div className="p-3 bg-bubblegum border-2 border-ink rounded-lg text-xs font-bold text-ink">
                      {reviewError}
                    </div>
                  )}

                  {reviewSuccess && (
                    <div className="p-3 bg-white border-2 border-ink rounded-lg text-xs font-bold text-ink">
                      {reviewSuccess}
                    </div>
                  )}

                  {/* Rating Selector */}
                  <div>
                    <label className="block font-bold text-xs uppercase text-ink mb-1">
                      Rating (1 to 5 Stars) *
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`p-2 rounded-lg border-2 border-ink shadow-brutal-sm transition-transform cursor-pointer ${
                            star <= reviewRating
                              ? 'bg-jake text-ink scale-105'
                              : 'bg-white text-gray-400'
                          }`}
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= reviewRating
                                ? 'fill-ink text-ink'
                                : 'text-gray-400'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="font-mono font-black text-sm text-ink ml-2">
                        {reviewRating} of 5 Stars
                      </span>
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block font-bold text-xs uppercase text-ink mb-1">
                      Feedback / Review Comments (Optional)
                    </label>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Describe the collaboration quality, communication speed, code standards..."
                      className="brutal-input text-xs resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="brutal-btn bg-jake text-ink font-heading font-black text-xs py-2.5 px-6 shadow-brutal-sm cursor-pointer disabled:opacity-50"
                  >
                    {submittingReview ? 'POSTING REVIEW...' : 'SUBMIT VERIFIED REVIEW'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* List Existing Reviews */}
          {job.reviews && job.reviews.length > 0 ? (
            <div className="space-y-3">
              {job.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 bg-white border-2 border-ink rounded-xl shadow-brutal-sm"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-ink/10">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-ink">
                        {rev.reviewer?.name || `User #${rev.reviewerId}`}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-paper px-1.5 py-0.2 rounded border border-ink text-gray-700">
                        {rev.reviewer?.role || 'PARTICIPANT'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating
                              ? 'fill-jake text-ink'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="font-mono font-bold text-xs text-ink ml-1">
                        {rev.rating}/5
                      </span>
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-gray-800 font-medium leading-relaxed">
                      "{rev.comment}"
                    </p>
                  )}
                  <span className="text-[10px] text-gray-400 block mt-2">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-medium text-gray-500 italic text-center py-4">
              No reviews published yet for this completed gig.
            </p>
          )}
        </div>
      )}

      {/* Confirmation Modal: Freelancer Withdraw Proposal */}
      <ConfirmModal
        isOpen={withdrawModalOpen}
        title="Withdraw Proposal?"
        message="Are you sure you want to withdraw your proposal? You can submit a new proposal as long as this gig remains open."
        confirmLabel="Withdraw Proposal"
        cancelLabel="Keep Proposal"
        variant="bubblegum"
        loading={withdrawing}
        onConfirm={handleWithdrawProposal}
        onCancel={() => !withdrawing && setWithdrawModalOpen(false)}
      />

      {/* Confirmation Modal: Client Cancel Gig */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        title="Cancel This Gig?"
        message="Are you sure you want to cancel this gig? It will be marked as CANCELLED and will no longer accept applications. This action cannot be undone."
        confirmLabel="Yes, Cancel Gig"
        cancelLabel="Keep Gig Open"
        variant="bubblegum"
        loading={cancellingJob}
        onConfirm={handleCancelJob}
        onCancel={() => !cancellingJob && setCancelModalOpen(false)}
      />

      {/* Confirmation Modal: Client Accept & Hire */}
      <ConfirmModal
        isOpen={acceptModalData.isOpen}
        title="Accept & Hire Freelancer"
        message={
          <div>
            <p>
              Hire <span className="font-bold text-ink">{acceptModalData.freelancerName}</span> for this gig?
            </p>
            <p className="mt-2 text-xs font-semibold text-gray-600">
              This will lock the gig to <span className="font-mono font-bold text-ink">IN_PROGRESS</span>, create your payment protection vault for ₹{job ? Number(job.budget).toLocaleString('en-IN') : '...'}, and respectfully decline competing proposals.
            </p>
          </div>
        }
        confirmLabel="Accept & Lock Gig"
        cancelLabel="Review Later"
        variant="jake"
        loading={acceptingId !== null}
        onConfirm={handleAcceptProposal}
        onCancel={() =>
          !acceptingId &&
          setAcceptModalData({ isOpen: false, proposalId: null, freelancerName: '' })
        }
      />
    </div>
  );
}
