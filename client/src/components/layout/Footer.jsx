import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t-4 border-ink bg-paper mt-16 py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <div>
          <span className="font-heading font-black text-2xl tracking-tight text-ink">
            Giggle
          </span>
          <p className="text-sm font-medium text-ink/70 mt-1">
            Fixed-budget tech gigs with guaranteed payment protection for developers and startups.
          </p>
        </div>
        <div className="font-mono text-xs font-bold text-ink/60">
          FIXED BUDGET • ZERO BIDDING • PROTECTED PAYMENTS
        </div>
      </div>
    </footer>
  );
}
