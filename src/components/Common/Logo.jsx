import React from 'react';
import './Logo.css';

const Logo = ({ size = 'medium' }) => {
  const sizeClass = {
    small: 'logo-small',
    medium: 'logo-medium',
    large: 'logo-large'
  }[size];

  return (
    <div className={`logo-container ${sizeClass}`}>
      <div className="logo-icon">IV</div>
      <h1 className="logo-text">InvoiceVault</h1>
    </div>
  );
};

export default Logo; 