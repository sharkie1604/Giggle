import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDisputes = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/disputes');
        setDisputes(res.data.disputes || []);
      } catch (err) {
        console.error('Failed to fetch disputes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <span className="brutal-badge bg-bubblegum text-ink mb-2">ADMIN ARBITRATION</span>
        <h1 className="text-4xl font-extrabold font-heading">ESCROW DISPUTE VAULTS</h1>
        <p className="font-medium text-gray-700">Arbitrate and mediate contested deliverables and escrow payouts</p>
      </div>

      <div className="brutal-card p-6 bg-white">
        {loading ? (
          <div className="text-center py-10 font-bold font-mono">LOADING DISPUTES...</div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="w-12 h-12 mx-auto text-bmo mb-3" />
            <h3 className="text-xl font-bold font-heading mb-1">Zero Contested Disputes</h3>
            <p className="text-gray-500 text-sm">All escrow vaults are running smoothly.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((d) => (
              <div key={d.id} className="border-3 border-ink p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">Vault #{d.id}</span>
                  <span className="brutal-badge bg-bubblegum text-xs">DISPUTED</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{d.disputeReason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
