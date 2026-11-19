import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  ExternalLink,
  Receipt,
  FileText,
} from 'lucide-react';
import api from '../services/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/transactions/history');
        setTransactions(res.data.transactions || []);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError('Failed to load transaction ledger.');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Compute Summary Statistics
  const totalDeposited = transactions
    .filter((tx) => tx.type === 'DEPOSIT' && tx.status === 'SUCCESS')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalPaidOut = transactions
    .filter((tx) => tx.type === 'PAYOUT' && tx.status === 'SUCCESS')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalRefunded = transactions
    .filter((tx) => tx.type === 'REFUND' && tx.status === 'SUCCESS')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const getTypeBadgeStyle = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return 'bg-jake text-ink';
      case 'PAYOUT':
        return 'bg-finn text-ink';
      case 'REFUND':
        return 'bg-bubblegum text-ink';
      default:
        return 'bg-paper text-ink';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-bmo text-ink';
      case 'INITIATED':
        return 'bg-paper text-ink border border-ink';
      case 'FAILED':
        return 'bg-bubblegum text-ink';
      default:
        return 'bg-white text-ink';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="brutal-badge bg-bmo text-ink font-mono font-black text-xs uppercase shadow-brutal-sm">
            VERIFIED LEDGER
          </span>
          <span className="text-xs font-bold text-gray-500 uppercase">
            AUDIT TRAIL
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-ink">
          PAYMENT HISTORY & LEDGER
        </h1>
        <p className="text-sm font-medium text-gray-700 mt-1">
          Chronological cryptographic audit record of all UPI deposits, escrow locks, milestone payouts, and arbitration refunds.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Deposited */}
        <div className="brutal-card p-5 bg-jake/25 border-4 border-ink shadow-brutal">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-heading font-black uppercase text-gray-700">
              Total Protected Deposits
            </span>
            <ArrowDownLeft className="w-5 h-5 text-ink" />
          </div>
          <div className="flex items-center gap-1">
            <IndianRupee className="w-6 h-6 stroke-[2.5] text-ink" />
            <span className="font-mono font-black text-2xl sm:text-3xl text-ink">
              {totalDeposited.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase">
            Secured in Vaults
          </p>
        </div>

        {/* Total Payouts */}
        <div className="brutal-card p-5 bg-finn/25 border-4 border-ink shadow-brutal">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-heading font-black uppercase text-gray-700">
              Total Released Payouts
            </span>
            <ArrowUpRight className="w-5 h-5 text-finn" />
          </div>
          <div className="flex items-center gap-1">
            <IndianRupee className="w-6 h-6 stroke-[2.5] text-ink" />
            <span className="font-mono font-black text-2xl sm:text-3xl text-ink">
              {totalPaidOut.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase">
            Transferred to Freelancers
          </p>
        </div>

        {/* Total Refunded */}
        <div className="brutal-card p-5 bg-bubblegum/25 border-4 border-ink shadow-brutal">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-heading font-black uppercase text-gray-700">
              Arbitration Refunds
            </span>
            <RotateCcw className="w-5 h-5 text-bubblegum" />
          </div>
          <div className="flex items-center gap-1">
            <IndianRupee className="w-6 h-6 stroke-[2.5] text-ink" />
            <span className="font-mono font-black text-2xl sm:text-3xl text-ink">
              {totalRefunded.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase">
            Returned via Disputes
          </p>
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="brutal-card p-6 sm:p-8 bg-white border-4 border-ink shadow-brutal">
        <div className="flex items-center justify-between pb-4 mb-6 border-b-3 border-ink">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-bmo" />
            <h2 className="text-xl font-heading font-black text-ink">
              CHRONOLOGICAL TRANSACTIONS ({transactions.length})
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-gray-500">
            AUTO-SYNCED
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-ink border-t-bmo rounded-full animate-spin mx-auto mb-2"></div>
            <p className="font-mono font-bold text-xs text-gray-600">
              RETRIEVING FINANCIAL LEDGER...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-bubblegum border-3 border-ink rounded-xl text-ink font-bold text-sm">
            {error}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center bg-paper border-2 border-dashed border-ink rounded-xl">
            <ShieldCheck className="w-12 h-12 text-bmo mx-auto mb-3" />
            <h3 className="font-heading font-black text-xl text-ink">
              NO TRANSACTIONS LOGGED YET
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto mt-1">
              Your UPI deposits, payment protection locks, and payout releases will be recorded here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b-3 border-ink bg-paper">
                  <th className="p-3 uppercase text-xs font-black font-heading text-ink">
                    Date
                  </th>
                  <th className="p-3 uppercase text-xs font-black font-heading text-ink">
                    Gig Reference
                  </th>
                  <th className="p-3 uppercase text-xs font-black font-heading text-ink">
                    Type
                  </th>
                  <th className="p-3 uppercase text-xs font-black font-heading text-ink">
                    Amount
                  </th>
                  <th className="p-3 uppercase text-xs font-black font-heading text-ink">
                    Status
                  </th>
                  <th className="p-3 uppercase text-xs font-black font-heading text-ink">
                    Razorpay Order / Ref ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b-2 border-ink/10 hover:bg-paper/50 transition-colors"
                  >
                    {/* Date */}
                    <td className="p-3 text-xs font-mono font-bold text-gray-700 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Gig Title */}
                    <td className="p-3 text-xs max-w-xs truncate">
                      {tx.escrow?.job ? (
                        <Link
                          to={`/jobs/${tx.escrow.job.id}`}
                          className="font-bold text-ink hover:text-finn hover:underline flex items-center gap-1"
                          title={tx.escrow.job.title}
                        >
                          <FileText className="w-3.5 h-3.5 text-finn flex-shrink-0" />
                          <span className="truncate">{tx.escrow.job.title}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        </Link>
                      ) : (
                        <span className="font-mono text-gray-500">
                          Vault #{tx.escrowId}
                        </span>
                      )}
                    </td>

                    {/* Type Badge */}
                    <td className="p-3">
                      <span
                        className={`brutal-badge text-[10px] font-black uppercase px-2.5 py-0.5 shadow-brutal-sm ${getTypeBadgeStyle(
                          tx.type
                        )}`}
                      >
                        {tx.type}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="p-3 font-mono font-black text-sm text-ink whitespace-nowrap">
                      ₹{Number(tx.amount).toLocaleString('en-IN')}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3">
                      <span
                        className={`brutal-badge text-[10px] font-mono font-bold uppercase px-2 py-0.5 ${getStatusBadgeStyle(
                          tx.status
                        )}`}
                      >
                        {tx.status}
                      </span>
                    </td>

                    {/* Razorpay Order ID */}
                    <td className="p-3 font-mono text-[11px] text-gray-600 max-w-[200px] truncate" title={tx.razorpayOrderId}>
                      {tx.razorpayOrderId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
