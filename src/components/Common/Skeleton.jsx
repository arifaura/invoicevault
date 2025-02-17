import React from 'react';
import './Skeleton.css';

const Skeleton = ({ variant = 'text', width, height, className = '' }) => {
  const classes = `skeleton skeleton-${variant} ${className}`;
  return (
    <div 
      className={classes}
      style={{ 
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '100%')
      }}
    />
  );
};

export default Skeleton; 