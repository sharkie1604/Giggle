import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variantClass = {
    primary: 'bg-jake text-ink',
    secondary: 'bg-finn text-ink',
    danger: 'bg-bubblegum text-ink',
    teal: 'bg-bmo text-ink',
    white: 'bg-white text-ink',
  }[variant] || 'bg-jake text-ink';

  return (
    <button className={`brutal-btn ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};
