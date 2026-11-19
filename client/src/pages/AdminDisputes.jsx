import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  IndianRupee,
  ExternalLink,
  User,
  CheckCircle,
  FileText,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function AdminDisputes() {
  const { user, isAuthenticated } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Arbitration modal state
  const [confirmModalData, setConfirmModalData] = useState({
    isOpen: false,
    escrowId: null,
    resolution: null,
    title: '',
    message: '',
    variant: 'jake',
  });
  const [arbitrating, setArbitrating] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/disputes');
      setDisputes(res.data.disputes || []);
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
      setError(
        err.response?.status === 403
          ? 'Access forbidden: Administrator privileges required.'
          : 'Failed to load disputed escrows.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchDisputes();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const handleResolve = async () => {
    const { escrowId, resolution } = confirmModalData;
    if (!escrowId || !resolution) return;

    setArbitrating(true);
    setError('');
    setSuccessMessage('');

    try {
      await api.patch(`/admin/escrow/${escrowId}/resolve`, { resolution });
      setConfirmModalData({
        isOpen: false,
        escrowId: null,
        resolution: null,
        title: '',
        message: '',
        variant: 'jake',
      });
      setSuccessMessage(
        `Dispute on Vault #${escrowId} resolved successfully: ${
          resolution === 'RELEASE_TO_FREELANCER'
            ? 'Payout Released to Freelancer'
            : 'Funds Refunded to Client'
        }`
      );
      await fetchDisputes();
    } catch (err) {
      const apiMsg =
        err.response?.data?.message || 'Failed to resolve dispute.';
      setError(apiMsg);
    } finally {
      setArbitrating(false);
    }
  };

  // 403 Guard for Non-Admin Users
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="brutal-card p-8 bg-bubblegum border-4 border-ink shadow-brutal text-ink">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
          <h2 className="font-heading font-black text-2xl mb-2">
            RESTRICTED ACCESS
          </h2>
          <p className="text-sm font-medium text-gray-800 mb-6">
            The Dispute Arbitration Console is strictly restricted to Giggle platform administrators.
          </p>
          <Link
            to="/"
            className="brutal-btn bg-white text-ink text-xs py-2 px-4 shadow-brutal-sm font-bold inline-block"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="brutal-badge bg-bubblegum text-ink font-mono font-black text-xs uppercase shadow-brutal-sm">
            ADMINISTRATIVE CONSOLE
          </span>
          <span className="text-xs font-bold text-gray-500 uppercase">
            ARBITRATION DESK
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-ink">
          DISPUTE ARBITRATION CONSOLE
        </h1>
        <p className="text-sm font-medium text-gray-700 mt-1">
          Review contested escrow vaults, inspect code submissions, and execute binding binary arbitration rulings.
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-white border-3 border-ink rounded-xl shadow-brutal-sm flex items-start gap-2 text-ink">
          <CheckCircle className="w-5 h-5 text-bmo flex-shrink-0 mt-0.5" />
          <p className="font-bold text-sm">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-bubblegum border-3 border-ink rounded-xl shadow-brutal-sm flex items-start gap-2 text-ink">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      {/* Disputes Feed */}
      <div className="brutal-card p-6 sm:p-8 bg-white border-4 border-ink shadow-brutal">
        <div className="flex items-center justify-between pb-4 mb-6 border-b-3 border-ink">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-bubblegum" />
            <h2 className="text-xl font-heading font-black text-ink">
              ACTIVE DISPUTES ({disputes.length})
            </h2>
          </div>
          <button
            onClick={fetchDisputes}
            className="text-xs font-bold uppercase underline hover:text-finn cursor-pointer"
          >
            Refresh Desk
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-ink border-t-bubblegum rounded-full animate-spin mx-auto mb-2"></div>
            <p className="font-mono font-bold text-xs text-gray-600">
              LOADING DISPUTED VAULTS...
            </p>
          </div>
        ) : disputes.length === 0 ? (
          <div className="py-16 text-center bg-paper border-2 border-dashed border-ink rounded-xl">
            <ShieldCheck className="w-12 h-12 text-bmo mx-auto mb-3" />
            <h3 className="font-heading font-black text-xl text-ink">
              ZERO ACTIVE DISPUTES
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto mt-1">
              All payment protection vaults are operating normally. No contested contracts currently require arbitration.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {disputes.map((d) => (
              <div
                key={d.id}
                className="p-6 border-3 border-ink rounded-2xl bg-paper shadow-brutal space-y-4"
              >
                {/* Top Info Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-ink/20">
                  <div className="flex items-center gap-2">
                    <span className="brutal-badge bg-white text-ink font-mono font-black text-xs">
                      VAULT #{d.id}
                    </span>
                    <span className="brutal-badge bg-bubblegum text-ink font-mono font-black text-xs animate-pulse">
                      FROZEN IN DISPUTE
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <IndianRupee className="w-5 h-5 stroke-[2.5] text-ink" />
                    <span className="font-mono font-black text-2xl text-ink">
                      {Number(d.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Gig Title & Link */}
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-500 block">
                    Contested Gig
                  </span>
                  <Link
                    to={`/jobs/${d.job?.id}`}
                    className="font-heading font-black text-xl text-ink hover:text-finn hover:underline flex items-center gap-1.5 mt-0.5"
                  >
                    <FileText className="w-5 h-5 text-finn flex-shrink-0" />
                    <span>{d.job?.title}</span>
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </Link>
                </div>

                {/* Participants Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Client Info */}
                  <div className="p-4 bg-white border-2 border-ink rounded-xl">
                    <span className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      Gig Client
                    </span>
                    <div className="font-bold text-sm text-ink flex items-center gap-1.5">
                      <User className="w-4 h-4 text-finn" />
                      {d.job?.client?.name}
                    </div>
                    <div className="text-xs font-mono text-gray-600 mt-0.5">
                      {d.job?.client?.email}
                    </div>
                  </div>

                  {/* Freelancer Info */}
                  <div className="p-4 bg-white border-2 border-ink rounded-xl">
                    <span className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      Hired Freelancer
                    </span>
                    <div className="font-bold text-sm text-ink flex items-center gap-1.5">
                      <User className="w-4 h-4 text-jake" />
                      {d.freelancer?.name}
                    </div>
                    <div className="text-xs font-mono text-gray-600 mt-0.5">
                      {d.freelancer?.email}
                    </div>
                    {d.freelancer?.upiId && (
                      <div className="text-[11px] font-mono font-bold text-ink mt-1">
                        UPI: <span className="bg-paper px-1.5 py-0.5 rounded border border-ink/40">{d.freelancer.upiId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dispute Reason */}
                <div className="p-4 bg-bubblegum/20 border-2 border-bubblegum rounded-xl">
                  <span className="text-[11px] font-black uppercase text-ink block mb-1">
                    Filed Dispute Reason:
                  </span>
                  <p className="text-xs sm:text-sm font-medium text-ink leading-relaxed">
                    {d.disputeReason}
                  </p>
                </div>

                {/* Deliverables / Submissions Log */}
                {d.job?.submissions && d.job.submissions.length > 0 && (
                  <div className="p-4 bg-white border-2 border-ink rounded-xl space-y-2">
                    <span className="text-[11px] font-black uppercase text-gray-600 block">
                      Submitted Deliverables ({d.job.submissions.length}):
                    </span>
                    <div className="space-y-2">
                      {d.job.submissions.map((sub, idx) => (
                        <div
                          key={sub.id}
                          className="p-3 bg-paper border border-ink/30 rounded-lg text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <a
                              href={sub.deliveryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono font-bold text-finn hover:underline flex items-center gap-1"
                            >
                              {sub.deliveryUrl}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <span className="brutal-badge text-[10px]">
                              {sub.status}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-line">
                            {sub.notes}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transaction Ledger Log */}
                {d.transactions && d.transactions.length > 0 && (
                  <div className="p-3 bg-white border border-ink/40 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-[10px] uppercase text-gray-500 block">
                      Transaction Ledger History:
                    </span>
                    {d.transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between text-[11px] font-mono py-0.5">
                        <span className="font-bold">{tx.type} ({tx.status})</span>
                        <span>₹{Number(tx.amount).toLocaleString('en-IN')}</span>
                        <span className="text-gray-500">{tx.razorpayOrderId}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Arbitration Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 border-t-2 border-ink/20">
                  {/* Option A: Release to Freelancer */}
                  <button
                    onClick={() =>
                      setConfirmModalData({
                        isOpen: true,
                        escrowId: d.id,
                        resolution: 'RELEASE_TO_FREELANCER',
                        title: 'Release Payout to Freelancer?',
                        message: `Rule in favor of the freelancer (${d.freelancer?.name})? This will transition the escrow vault to RELEASED, mark deliverables APPROVED, complete the gig, and log an official PAYOUT transaction for ₹${Number(d.amount).toLocaleString('en-IN')}.`,
                        variant: 'jake',
                      })
                    }
                    className="brutal-btn bg-finn text-ink font-heading font-black text-xs py-2.5 px-4 shadow-brutal-sm cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    RELEASE PAYOUT TO FREELANCER
                  </button>

                  {/* Option B: Refund to Client */}
                  <button
                    onClick={() =>
                      setConfirmModalData({
                        isOpen: true,
                        escrowId: d.id,
                        resolution: 'REFUND_TO_CLIENT',
                        title: 'Refund Client & Cancel Gig?',
                        message: `Rule in favor of the client (${d.job?.client?.name})? This will transition the escrow vault to RELEASED, cancel the gig, and record an official REFUND transaction for ₹${Number(d.amount).toLocaleString('en-IN')}.`,
                        variant: 'bubblegum',
                      })
                    }
                    className="brutal-btn bg-bubblegum text-ink font-heading font-black text-xs py-2.5 px-4 shadow-brutal-sm cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    REFUND CLIENT & CANCEL GIG
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Admin Arbitration */}
      <ConfirmModal
        isOpen={confirmModalData.isOpen}
        title={confirmModalData.title}
        message={confirmModalData.message}
        confirmLabel="Confirm Arbitration Ruling"
        cancelLabel="Review Contract Further"
        variant={confirmModalData.variant}
        loading={arbitrating}
        onConfirm={handleResolve}
        onCancel={() =>
          !arbitrating &&
          setConfirmModalData({
            isOpen: false,
            escrowId: null,
            resolution: null,
            title: '',
            message: '',
            variant: 'jake',
          })
        }
      />
    </div>
  );
}
