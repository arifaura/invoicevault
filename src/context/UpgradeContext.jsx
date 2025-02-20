import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import UpgradeModal from '../components/Common/UpgradeModal';

const UpgradeContext = createContext({
  isUpgradeModalOpen: false,
  openUpgradeModal: () => {},
  closeUpgradeModal: () => {}
});

export const UpgradeProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    console.log('UpgradeProvider mounted');
  }, []);

  useEffect(() => {
    console.log('Modal state changed:', isModalOpen);
  }, [isModalOpen]);

  const openModal = useCallback(() => {
    console.log('Opening modal...');
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    console.log('Closing modal...');
    setIsModalOpen(false);
  }, []);

  const contextValue = {
    isUpgradeModalOpen: isModalOpen,
    openUpgradeModal: openModal,
    closeUpgradeModal: closeModal
  };

  return (
    <UpgradeContext.Provider value={contextValue}>
      {children}
      <UpgradeModal 
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </UpgradeContext.Provider>
  );
};

export const useUpgrade = () => {
  const context = useContext(UpgradeContext);
  
  if (!context) {
    console.error('useUpgrade must be used within an UpgradeProvider');
    throw new Error('useUpgrade must be used within an UpgradeProvider');
  }
  
  return context;
}; 