import React from 'react';
import './Logo.css';

const Logo = ({ size = 'medium' }) => {
  const sizeClass = {
    small: 'logo-small',
    medium: 'logo-medium',
    large: 'logo-large',
    xlarge: 'logo-xlarge'
  }[size];

  return (
    <div className={`logo-container ${sizeClass}`}>
      <img 
        src="/logo.jpg" 
        alt="InvoiceVault Logo" 
        className="logo-image"
      />
    </div>
  );
};

export default Logo; 