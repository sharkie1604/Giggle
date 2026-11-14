import React from 'react';
import { ShieldCheck, IndianRupee } from 'lucide-react';

export default function EscrowVaultCard({ escrow }) {
  if (!escrow) return null;

  return (
    <div className="brutal-card p-6 bg-bmo text-ink">
      <div className="flex items-center justify-between mb-4">
        <span className="brutal-badge bg-white text-ink text-xs font-mono">BMO ESCROW VAULT #{escrow.id}</span>
        <span className="brutal-badge bg-jake text-ink text-xs">{escrow.status}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <IndianRupee className="w-8 h-8 font-black" />
        <span className="text-4xl font-extrabold font-mono">{Number(escrow.amount).toLocaleString('en-IN')}</span>
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-900 mt-2">
        Guaranteed payout upon verified milestone approval
      </p>
    </div>
  );
}
