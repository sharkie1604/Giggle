import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t-4 border-ink bg-white mt-16 py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <div>
          <span className="font-heading font-black text-xl">
            TECH<span className="text-finn">GIG</span>.ESCROW
          </span>
          <p className="text-sm font-medium text-gray-600 mt-1">
            Fixed-Price Escrow Platform for Indian Software Engineers & Tech Startups.
          </p>
        </div>
        <div className="font-mono text-xs font-bold text-gray-500">
          CARTOON-BRUTALISM • ZERO BIDDING • PURE ESCROW
        </div>
      </div>
    </footer>
  );
}
