import React from 'react';
import { FiX } from 'react-icons/fi';
import './ImagePreviewModal.css';

const ImagePreviewModal = ({ imageUrl, onClose }) => {
  const isPDF = imageUrl?.toLowerCase().endsWith('.pdf');

  return (
    <div className="image-preview-modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          <FiX size={24} />
        </button>
        <div className="image-container">
          {isPDF ? (
            <embed
              src={imageUrl}
              type="application/pdf"
              width="100%"
              height="100%"
              className="pdf-preview"
            />
          ) : (
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="preview-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = ''; // Clear the source on error
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal; 