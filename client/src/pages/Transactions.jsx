import React, { useState, useEffect } from 'react';
import { IndianRupee, ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await api.get('/transactions');
        setTransactions(res.data.transactions || []);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold font-heading">ESCROW TRANSACTIONS</h1>
        <p className="font-medium text-gray-700">Cryptographically verified UPI transactions ledger</p>
      </div>

      <div className="brutal-card p-6 bg-white">
        {loading ? (
          <div className="text-center py-10 font-bold font-mono">LOADING TRANSACTION LEDGER...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="w-12 h-12 mx-auto text-bmo mb-3" />
            <h3 className="text-xl font-bold font-heading mb-1">No Transactions Yet</h3>
            <p className="text-gray-500 text-sm">Escrow deposits, releases, and payouts will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-4 border-ink">
                  <th className="p-3 uppercase text-xs font-extrabold">Type</th>
                  <th className="p-3 uppercase text-xs font-extrabold">Amount</th>
                  <th className="p-3 uppercase text-xs font-extrabold">Status</th>
                  <th className="p-3 uppercase text-xs font-extrabold">Razorpay Order ID</th>
                  <th className="p-3 uppercase text-xs font-extrabold">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b-2 border-gray-200">
                    <td className="p-3 font-bold">{tx.type}</td>
                    <td className="p-3 font-mono font-bold">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <span className="brutal-badge bg-bmo text-xs">{tx.status}</span>
                    </td>
                    <td className="p-3 font-mono text-xs">{tx.razorpayOrderId}</td>
                    <td className="p-3 text-sm">{new Date(tx.createdAt).toLocaleDateString()}</td>
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
