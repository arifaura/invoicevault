import React from 'react';
import './Logo.css';

const Logo = ({ size = 'medium' }) => {
  return (
    <div className={`logo-container ${size}`}>
      <div className="logo-icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="url(#gradient)"/>
          <path d="M8 12H24M8 16H20M8 20H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="24" cy="20" r="3" fill="white"/>
        </svg>
      </div>
      <div className="logo-text">
        <span className="logo-primary">Invoice</span>
        <span className="logo-secondary">Vault</span>
      </div>
    </div>
  );
};

export default Logo; 