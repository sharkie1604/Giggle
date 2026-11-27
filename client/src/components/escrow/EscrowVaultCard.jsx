import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  IndianRupee,
  Lock,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Send,
  RotateCcw,
  Check,
  User,
  Info,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';
import ConfirmModal from '../ui/ConfirmModal';

/**
 * EscrowVaultCard — Cartoon-Brutalist BMO Teal Payment Protection Card
 * Visualizes the 4 states of the Escrow vault: PENDING, FUNDED, DISPUTED, RELEASED.
 */
export default function EscrowVaultCard({ job, onRefresh, user }) {
  if (!job || !job.escrow) return null;

  const escrow = job.escrow;
  const isOwnerClient = user?.role === 'CLIENT' && user?.id === job.clientId;
  const isHiredFreelancer = user?.role === 'FREELANCER' && user?.id === escrow.freelancerId;
  const isAdmin = user?.role === 'ADMIN';

  // State: Funding (Razorpay checkout)
  const [fundingLoading, setFundingLoading] = useState(false);
  const [fundingError, setFundingError] = useState('');

  // State: Freelancer Submission Form
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [deliverySuccess, setDeliverySuccess] = useState('');

  // State: Dispute Modal
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeError, setDisputeError] = useState('');

  // State: Client Action Modals
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [releasingPayout, setReleasingPayout] = useState(false);

  // State: Revision Request
  const [activeRevisionSubId, setActiveRevisionSubId] = useState(null);
  const [revisionNotesInput, setRevisionNotesInput] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const [revisionInputError, setRevisionInputError] = useState('');

  // General Notification
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  // ─── 1. Client Funds Payment Protection (Razorpay UPI Checkout) ───────────
  const handleFundEscrow = async () => {
    setFundingLoading(true);
    setFundingError('');
    setActionMessage('');

    try {
      const res = await api.post(`/escrow/${escrow.id}/create-order`);
      const { order, keyId } = res.data;

      if (!window.Razorpay) {
        throw new Error(
          'Razorpay checkout script failed to load. Please refresh the page.'
        );
      }

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Giggle',
        description: `Payment Protection for: ${job.title}`,
        order_id: order.id,
        handler: async function (response) {
          setActionMessage(
            'Payment verified! Escrow status will refresh once verified.'
          );
          if (onRefresh) await onRefresh();
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#5BA4A4',
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (resp) {
        setFundingError(
          resp.error?.description || 'UPI Payment was cancelled or failed.'
        );
      });
      razorpayInstance.open();
    } catch (err) {
      const apiMsg =
        err.response?.data?.message || err.message || 'Failed to initiate payment.';
      setFundingError(apiMsg);
    } finally {
      setFundingLoading(false);
    }
  };

  // ─── 2. Freelancer Submits Code / Deliverables ────────────────────────────
  const handleSubmitDelivery = async (e) => {
    e.preventDefault();
    setDeliveryError('');
    setDeliverySuccess('');

    if (!deliveryUrl.trim().startsWith('https://')) {
      setDeliveryError('Delivery URL must use secure https:// (e.g. https://github.com/...)');
      return;
    }

    if (notes.trim().length < 10) {
      setDeliveryError('Delivery notes must be at least 10 characters.');
      return;
    }

    setSubmittingDelivery(true);
    try {
      await api.post(`/jobs/${job.id}/submissions`, {
        deliveryUrl: deliveryUrl.trim(),
        notes: notes.trim(),
      });
      setDeliverySuccess('Deliverable submitted successfully! Client has been notified.');
      setDeliveryUrl('');
      setNotes('');
      if (onRefresh) await onRefresh();
    } catch (err) {
      const apiMsg =
        err.response?.data?.message || 'Failed to submit deliverables.';
      setDeliveryError(apiMsg);
    } finally {
      setSubmittingDelivery(false);
    }
  };

  // ─── 3. Client Approves & Releases Payout ─────────────────────────────────
  const handleReleasePayout = async () => {
    setReleasingPayout(true);
    setActionError('');
    setActionMessage('');

    try {
      await api.patch(`/escrow/${escrow.id}/release`);
      setReleaseModalOpen(false);
      setActionMessage('Delivery approved and payment payout released to freelancer!');
      if (onRefresh) await onRefresh();
    } catch (err) {
      const apiMsg =
        err.response?.data?.message || 'Failed to release payout.';
      setActionError(apiMsg);
    } finally {
      setReleasingPayout(false);
    }
  };

  // ─── 4. Client Requests Revision with Specific Feedback ────────────────────
  const handleSendRevision = async (subId) => {
    if (revisionNotesInput.trim().length < 5) {
      setRevisionInputError('Please describe the changes needed (minimum 5 characters).');
      return;
    }

    setSubmittingRevision(true);
    setRevisionInputError('');
    setActionError('');
    setActionMessage('');

    try {
      await api.patch(`/submissions/${subId}/revision`, {
        revisionNotes: revisionNotesInput.trim(),
      });
      setActiveRevisionSubId(null);
      setRevisionNotesInput('');
      setActionMessage('Revision requested. Detailed instructions sent to freelancer.');
      if (onRefresh) await onRefresh();
    } catch (err) {
      const apiMsg =
        err.response?.data?.message || 'Failed to request revision.';
      setRevisionInputError(apiMsg);
    } finally {
      setSubmittingRevision(false);
    }
  };

  // ─── 5. Raise Dispute (Client or Freelancer) ──────────────────────────────
  const handleRaiseDispute = async () => {
    if (disputeReason.trim().length < 15) {
      setDisputeError('Dispute reason must be at least 15 characters.');
      return;
    }

    setSubmittingDispute(true);
    setDisputeError('');

    try {
      await api.post(`/escrow/${escrow.id}/dispute`, {
        disputeReason: disputeReason.trim(),
      });
      setDisputeModalOpen(false);
      setDisputeReason('');
      setActionMessage('Dispute submitted. Vault is frozen pending admin arbitration.');
      if (onRefresh) await onRefresh();
    } catch (err) {
      const apiMsg =
        err.response?.data?.message || 'Failed to submit dispute.';
      setDisputeError(apiMsg);
    } finally {
      setSubmittingDispute(false);
    }
  };

  const getEscrowBadgeStyle = (status) => {
    switch (status) {
      case 'FUNDED':
        return 'bg-finn text-ink';
      case 'PENDING':
        return 'bg-jake text-ink';
      case 'DISPUTED':
        return 'bg-bubblegum text-ink animate-pulse';
      case 'RELEASED':
        return 'bg-white text-ink';
      default:
        return 'bg-paper text-ink';
    }
  };

  const submissions = job.submissions || [];

  return (
    <div className="brutal-card p-6 sm:p-8 bg-bmo text-ink border-4 border-ink shadow-brutal rounded-2xl relative overflow-hidden">
      {/* Vault Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-6 border-b-3 border-ink">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white border-2 border-ink shadow-brutal-sm flex items-center justify-center font-bold text-ink">
            <Lock className="w-5 h-5 text-ink" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-black text-ink/80 block leading-tight">
              Giggle Protected Payment Vault
            </span>
            <h3 className="font-heading font-black text-2xl text-ink leading-none">
              FIXED PAYMENT VAULT
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`brutal-badge font-mono font-black text-xs px-3 py-1 uppercase shadow-brutal-sm ${getEscrowBadgeStyle(
              escrow.status
            )}`}
          >
            {escrow.status === 'FUNDED'
              ? 'VAULT FUNDED & PROTECTED'
              : escrow.status === 'PENDING'
              ? 'AWAITING CLIENT FUNDING'
              : escrow.status === 'DISPUTED'
              ? 'FROZEN IN DISPUTE'
              : 'PAYMENT RELEASED'}
          </span>
        </div>
      </div>

      {/* Vault Balance Display & Assigned Freelancer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-white/80 backdrop-blur-xs border-3 border-ink rounded-xl shadow-brutal-sm flex items-center justify-between min-w-0 overflow-hidden">
          <div className="min-w-0 flex-1 mr-2">
            <span className="text-[11px] font-black uppercase text-gray-600 block truncate">
              {escrow.status === 'RELEASED' ? 'Current Vault Balance' : 'Protected Gig Amount'}
            </span>
            <div className="flex items-center gap-1 mt-0.5 min-w-0">
              <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5] text-ink shrink-0" />
              <span className="font-mono font-black text-xl sm:text-2xl text-ink tabular-nums tracking-tight break-words">
                {escrow.status === 'RELEASED' ? '0' : Number(escrow?.amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            {escrow.status === 'RELEASED' && (
              <span className="text-[11px] font-bold text-gray-700 block mt-1 break-words">
                ₹0 Held in Vault (Full ₹{Number(escrow?.amount || 0).toLocaleString('en-IN')} Released)
              </span>
            )}
          </div>
          <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-bmo shrink-0 ml-1" />
        </div>

        <div className="p-3 bg-white/80 backdrop-blur-xs border-3 border-ink rounded-xl shadow-brutal-sm flex items-center justify-between min-w-0 overflow-hidden">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-black uppercase text-gray-600 block truncate">
              Assigned Freelancer
            </span>
            {escrow.freelancer ? (
              <Link
                to={`/users/${escrow.freelancerId}`}
                className="font-heading font-black text-base sm:text-lg text-ink hover:underline flex items-center gap-1.5 mt-0.5 min-w-0"
              >
                <User className="w-4 h-4 text-finn shrink-0" />
                <span className="truncate">{escrow.freelancer.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              </Link>
            ) : (
              <span className="font-mono font-bold text-sm text-ink mt-0.5 block truncate">
                Assigned Freelancer
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notification Banners */}
      {actionMessage && (
        <div className="mb-6 p-4 bg-white border-3 border-ink rounded-xl shadow-brutal-sm flex items-start gap-2 text-ink">
          <CheckCircle className="w-5 h-5 text-bmo flex-shrink-0 mt-0.5" />
          <p className="font-bold text-sm">{actionMessage}</p>
        </div>
      )}

      {actionError && (
        <div className="mb-6 p-4 bg-bubblegum border-3 border-ink rounded-xl shadow-brutal-sm flex items-start gap-2 text-ink">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="font-bold text-sm">{actionError}</p>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* STATE 1: PENDING (Awaiting Client Deposit via Razorpay UPI)          */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {escrow.status === 'PENDING' && (
        <div className="p-5 bg-white border-3 border-ink rounded-xl shadow-brutal-sm">
          {isOwnerClient ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-heading font-black text-xl text-ink">
                  FUND PAYMENT PROTECTION
                </h4>
                <p className="text-xs sm:text-sm font-medium text-gray-700 mt-1">
                  Lock the fixed budget in the protected vault via Razorpay UPI.
                  Funds are safely held and only released to the freelancer after you inspect and approve their completed delivery.
                </p>
              </div>

              {fundingError && (
                <div className="p-3 bg-bubblegum border-2 border-ink rounded-lg text-xs font-bold text-ink">
                  {fundingError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={handleFundEscrow}
                  disabled={fundingLoading}
                  className="brutal-btn bg-jake text-ink font-heading font-black text-sm py-3 px-6 shadow-brutal flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {fundingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      OPENING RAZORPAY UPI...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      FUND PAYMENT PROTECTION (₹{Number(escrow?.amount || 0).toLocaleString('en-IN')})
                    </>
                  )}
                </button>
              </div>

              {/* Test Mode UPI Note */}
              <div className="p-3 bg-paper border-2 border-dashed border-ink rounded-lg flex items-start gap-2 text-xs">
                <Info className="w-4 h-4 text-finn flex-shrink-0 mt-0.5" />
                <div className="text-gray-700">
                  <span className="font-bold text-ink">Test Payment Mode:</span>{' '}
                  Use UPI ID{' '}
                  <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-ink text-ink">
                    success@razorpay
                  </span>{' '}
                  (or Netbanking) in the checkout popup to simulate an instant deposit.
                </div>
              </div>
            </div>
          ) : isHiredFreelancer ? (
            <div className="flex items-start gap-3 text-ink">
              <Info className="w-5 h-5 text-finn flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-heading font-black text-base">
                  AWAITING CLIENT PAYMENT
                </h4>
                <p className="text-xs sm:text-sm font-medium text-gray-700 mt-0.5">
                  The client has hired you! Waiting for client to fund payment protection before code submission unlocks.
                  You will receive full payout security once the vault is funded.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium text-gray-700">
              Payment protection is pending funding by the gig client.
            </p>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* STATE 2: FUNDED (Payment Protected & In Progress)                   */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {escrow.status === 'FUNDED' && (
        <div className="space-y-6">
          {/* Submissions Section */}
          <div className="p-5 bg-white border-3 border-ink rounded-xl shadow-brutal-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-ink/20">
              <h4 className="font-heading font-black text-lg text-ink flex items-center gap-2">
                <Send className="w-4 h-4 text-bmo" />
                DELIVERABLES & SUBMISSIONS ({submissions.length})
              </h4>
              <span className="text-[10px] font-mono font-bold bg-finn px-2 py-0.5 rounded border border-ink text-ink">
                FUNDS PROTECTED
              </span>
            </div>

            {/* List Existing Submissions */}
            {submissions.length === 0 ? (
              <div className="py-6 text-center bg-paper border-2 border-dashed border-ink rounded-xl">
                <p className="text-xs font-bold text-gray-600">
                  {isHiredFreelancer
                    ? 'No deliverables submitted yet. Use the form below to deliver your completed work.'
                    : 'The hired freelancer is currently developing your deliverables. Deliveries will appear here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {submissions.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className="p-4 border-2 border-ink rounded-xl bg-paper shadow-brutal-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-ink/10">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-ink shrink-0">
                          Delivery #{submissions.length - idx}
                        </span>
                        <a
                          href={sub.deliveryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs font-bold text-finn hover:underline inline-flex items-center gap-1 min-w-0 break-all"
                        >
                          <span className="break-all">{sub.deliveryUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                      <span
                        className={`brutal-badge text-[10px] font-black shrink-0 ${
                          sub.status === 'APPROVED'
                            ? 'bg-bmo text-ink'
                            : sub.status === 'REVISION_REQUESTED'
                            ? 'bg-bubblegum text-ink'
                            : 'bg-jake text-ink'
                        }`}
                      >
                        {sub.status === 'SUBMITTED'
                          ? 'Submitted'
                          : sub.status === 'REVISION_REQUESTED'
                          ? 'Revision Requested'
                          : sub.status === 'APPROVED'
                          ? 'Approved'
                          : sub.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                      {sub.notes}
                    </p>

                    {/* Client Revision Feedback Notes */}
                    {sub.revisionNotes && (
                      <div className="mt-3 p-3 bg-bubblegum/25 border-2 border-ink rounded-lg shadow-brutal-sm">
                        <span className="font-heading font-black uppercase text-[10px] text-ink block mb-0.5">
                          ⚠️ Client Revision Feedback:
                        </span>
                        <p className="text-xs font-semibold text-gray-900 whitespace-pre-line leading-relaxed">
                          {sub.revisionNotes}
                        </p>
                      </div>
                    )}

                    {/* Client Actions per Submission */}
                    {isOwnerClient && sub.status === 'SUBMITTED' && (
                      <div className="mt-3 pt-2 border-t border-ink/10">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setReleaseModalOpen(true)}
                            className="brutal-btn bg-bmo text-ink text-xs py-1.5 px-3 shadow-brutal-sm font-black flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            APPROVE & RELEASE PAYOUT
                          </button>
                          <button
                            onClick={() => {
                              if (activeRevisionSubId === sub.id) {
                                setActiveRevisionSubId(null);
                                setRevisionNotesInput('');
                                setRevisionInputError('');
                              } else {
                                setActiveRevisionSubId(sub.id);
                                setRevisionNotesInput('');
                                setRevisionInputError('');
                              }
                            }}
                            className="brutal-btn bg-white text-ink text-xs py-1.5 px-3 shadow-brutal-sm font-bold flex items-center gap-1 cursor-pointer hover:bg-paper"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {activeRevisionSubId === sub.id ? 'CANCEL REVISION' : 'REQUEST REVISION'}
                          </button>
                        </div>

                        {/* Inline Revision Feedback Form */}
                        {activeRevisionSubId === sub.id && (
                          <div className="mt-3 p-3 bg-white border-2 border-ink rounded-lg shadow-brutal-sm space-y-2">
                            <label className="block font-bold text-[11px] uppercase text-ink">
                              Describe Changes / Fixes Needed * (Min 5 chars)
                            </label>
                            {revisionInputError && (
                              <p className="text-[11px] font-bold text-bubblegum">
                                {revisionInputError}
                              </p>
                            )}
                            <textarea
                              rows={2}
                              value={revisionNotesInput}
                              onChange={(e) => setRevisionNotesInput(e.target.value)}
                              placeholder="e.g. Please update the README setup instructions and fix the mobile navbar layout..."
                              className="brutal-input text-xs resize-y w-full"
                            />
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveRevisionSubId(null);
                                  setRevisionNotesInput('');
                                  setRevisionInputError('');
                                }}
                                className="brutal-btn bg-paper text-ink text-xs py-1 px-3 shadow-brutal-sm font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={submittingRevision}
                                onClick={() => handleSendRevision(sub.id)}
                                className="brutal-btn bg-bubblegum text-ink text-xs py-1 px-3 shadow-brutal-sm font-black flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {submittingRevision ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3 h-3" />
                                )}
                                SEND REVISION REQUEST
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Freelancer: Submit Code Delivery Form */}
            {isHiredFreelancer && (
              <div className="mt-6 pt-5 border-t-2 border-ink/20">
                <h5 className="font-heading font-black text-base text-ink mb-3 flex items-center gap-2">
                  <Send className="w-4 h-4 text-finn" />
                  SUBMIT CODE DELIVERY
                </h5>

                {deliveryError && (
                  <div className="mb-4 p-3 bg-bubblegum border-2 border-ink rounded-lg text-xs font-bold text-ink">
                    {deliveryError}
                  </div>
                )}
                {deliverySuccess && (
                  <div className="mb-4 p-3 bg-white border-2 border-ink rounded-lg text-xs font-bold text-ink">
                    {deliverySuccess}
                  </div>
                )}

                <form onSubmit={handleSubmitDelivery} className="space-y-3">
                  <div>
                    <label className="block font-bold text-xs uppercase mb-1 text-ink">
                      Repository / Deliverable URL (HTTPS only) *
                    </label>
                    <input
                      type="url"
                      required
                      value={deliveryUrl}
                      onChange={(e) => setDeliveryUrl(e.target.value)}
                      placeholder="https://github.com/your-username/project-repo"
                      className="brutal-input font-mono text-xs py-2"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-xs uppercase mb-1 text-ink">
                      Delivery Notes & Walkthrough *
                    </label>
                    <textarea
                      rows={3}
                      required
                      minLength={10}
                      maxLength={3000}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Provide setup instructions, test results, pull request links, or feature walkthrough..."
                      className="brutal-input text-xs resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingDelivery}
                    className="brutal-btn bg-finn text-ink text-xs py-2.5 px-5 font-black shadow-brutal-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {submittingDelivery ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        SUBMITTING...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        SUBMIT DELIVERABLE
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Raise Dispute Option (Visible to Client or Freelancer while FUNDED) */}
          {(isOwnerClient || isHiredFreelancer) && (
            <div className="p-4 bg-white/70 border-2 border-dashed border-ink rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h5 className="font-heading font-black text-sm text-ink flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-bubblegum" />
                  Experiencing Unresolvable Issues?
                </h5>
                <p className="text-xs font-medium text-gray-700">
                  If milestones are breached or communication has broken down, either party can raise a dispute for admin mediation.
                </p>
              </div>
              <button
                onClick={() => setDisputeModalOpen(true)}
                className="brutal-btn bg-bubblegum text-ink font-heading font-black text-xs py-2 px-4 shadow-brutal-sm cursor-pointer flex-shrink-0"
              >
                RAISE DISPUTE
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* STATE 3: DISPUTED (Payment Frozen Pending Admin Arbitration)        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {escrow.status === 'DISPUTED' && (
        <div className="p-6 bg-bubblegum border-3 border-ink rounded-xl shadow-brutal text-ink">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white border-2 border-ink shadow-brutal-sm flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-bubblegum" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-wider block text-ink/70">
                DISPUTE ACTIVE
              </span>
              <h4 className="font-heading font-black text-xl text-ink leading-tight">
                PAYMENT FROZEN — UNDER ADMIN REVIEW
              </h4>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border-2 border-ink text-xs font-medium text-gray-800 leading-relaxed mb-3">
            <span className="font-bold uppercase text-ink block mb-1">
              Dispute Statement:
            </span>
            {escrow.disputeReason || 'Dispute filed by gig participant.'}
          </div>

          <p className="text-xs font-semibold text-ink">
            ⚖️ Giggle's administrative arbitration desk is evaluating the contract, submissions, and communication logs. The decision will either release payout to the freelancer or refund the client.
          </p>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* STATE 4: RELEASED (Vault Terminal State)                             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {escrow.status === 'RELEASED' && (
        <div className="p-6 bg-white border-3 border-ink rounded-xl shadow-brutal text-ink">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bmo border-2 border-ink shadow-brutal-sm flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-ink" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase text-gray-600 block">
                VAULT CLOSED
              </span>
              <h4 className="font-heading font-black text-xl text-ink leading-tight">
                {job.status === 'CANCELLED'
                  ? 'CLOSED VIA DISPUTE RESOLUTION (REFUNDED)'
                  : 'PAYMENT RELEASED & COMPLETED'}
              </h4>
            </div>
          </div>

          <p className="text-xs sm:text-sm font-medium text-gray-700 mt-3">
            {job.status === 'CANCELLED'
              ? 'This gig was cancelled following dispute arbitration. Funds were refunded to the client.'
              : 'Payment was successfully released to the freelancer. Both parties can now leave verified reviews.'}
          </p>
        </div>
      )}

      {/* ─── MODAL: Approve & Release Payout ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={releaseModalOpen}
        title="Approve Work & Release Payout?"
        message={
          <div>
            <p>
              Release the protected vault balance of{' '}
              <span className="font-mono font-bold text-ink">
                ₹{Number(escrow?.amount || 0).toLocaleString('en-IN')}
              </span>{' '}
              to <span className="font-bold text-ink">{escrow.freelancer?.name || 'the freelancer'}</span>?
            </p>
            <p className="mt-2 text-xs font-semibold text-gray-600">
              This will transition the gig to <span className="font-mono font-bold text-ink">COMPLETED</span> and create an immutable payout transaction. This action cannot be reversed.
            </p>
          </div>
        }
        confirmLabel="Yes, Release Payout"
        cancelLabel="Keep Reviewing"
        variant="jake"
        loading={releasingPayout}
        onConfirm={handleReleasePayout}
        onCancel={() => !releasingPayout && setReleaseModalOpen(false)}
      />


      {/* ─── MODAL: Raise Dispute ───────────────────────────────────────────── */}
      {disputeModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !submittingDispute && setDisputeModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-paper border-4 border-ink shadow-brutal-lg rounded-2xl max-w-lg w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl border-3 border-ink bg-bubblegum/30 flex items-center justify-center shadow-brutal-sm">
                <AlertTriangle className="w-6 h-6 text-bubblegum" />
              </div>
              <h3 className="font-heading font-black text-2xl text-ink leading-tight">
                RAISE CONTRACT DISPUTE
              </h3>
            </div>

            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-4 leading-relaxed">
              Raising a dispute freezes the payment vault immediately. Giggle administrators will arbitrate based on deliverables and communication.
            </p>

            {disputeError && (
              <div className="mb-4 p-3 bg-bubblegum border-2 border-ink rounded-lg text-xs font-bold text-ink">
                {disputeError}
              </div>
            )}

            <div className="space-y-3 mb-6">
              <label className="block font-bold text-xs uppercase text-ink">
                Detailed Dispute Reason * (Min 15 characters)
              </label>
              <textarea
                rows={4}
                required
                minLength={15}
                maxLength={2000}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain the issues faced, missing requirements, broken communication, or timeline breaches..."
                className="brutal-input text-xs resize-y"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t-2 border-ink/10">
              <button
                type="button"
                onClick={() => setDisputeModalOpen(false)}
                disabled={submittingDispute}
                className="border-3 border-ink bg-white text-ink shadow-brutal rounded-xl font-heading font-bold px-5 py-2.5 hover:bg-paper/80 transition disabled:opacity-50 text-xs text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRaiseDispute}
                disabled={submittingDispute}
                className="border-3 border-ink bg-bubblegum text-ink shadow-brutal rounded-xl font-heading font-black px-6 py-2.5 transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
              >
                {submittingDispute && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                CONFIRM & FREEZE VAULT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
