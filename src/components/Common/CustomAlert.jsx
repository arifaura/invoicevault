import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import './CustomAlert.css';

const CustomAlert = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="alert-content">
        <div className="alert-header">
          <FiAlertTriangle size={24} className="alert-icon" />
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>
        <div className="alert-body">
          <p>{message}</p>
        </div>
        <div className="alert-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert; 