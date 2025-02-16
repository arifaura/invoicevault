import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiEdit2, FiShare2, FiX, FiFile, FiCopy } from 'react-icons/fi';
import { FaWhatsapp, FaTelegram } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import CreateInvoiceModal from './CreateInvoiceModal';
import InvoiceContent from '../Invoice/InvoiceContent';
import './InvoiceView.css';
import { generatePDF } from '../../utils/pdfGenerator';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'react-hot-toast';

const InvoiceView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          vendor:vendors(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setInvoice(data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice');
      navigate('/dashboard/invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shouldDownload = searchParams.get('download') === 'true';
    
    if (shouldDownload && invoice) {
      handleDownload();
      navigate(location.pathname, { replace: true });
    }
  }, [location, invoice]);

  const handleDownload = async () => {
    try {
      if (!contentRef.current) return;
      await generatePDF(contentRef.current, `invoice-${invoice.id.replace('#', '')}`);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  const handleShare = async (platform) => {
    setIsSharing(true);
    try {
      // Share implementation
      setIsSharing(false);
      setShowShareOptions(false);
    } catch (error) {
      console.error('Error sharing:', error);
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="invoice-view-container loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="invoice-view-container error">
        <h2>Invoice not found</h2>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          <FiArrowLeft /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="invoice-view-container">
      <div className="invoice-view-header">
        <div className="header-left">
          <button 
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            <FiArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="invoice-header-info">
            <h1>{invoice.title}</h1>
            <span className="invoice-subtext">{invoice.id}</span>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="share-wrapper">
            <button 
              className="action-button"
              onClick={() => setShowShareOptions(!showShareOptions)}
            >
              <FiShare2 size={18} />
              <span>Share</span>
            </button>
            {showShareOptions && (
              <div className="share-options">
                <button 
                  className="share-option whatsapp"
                  onClick={() => handleShare('whatsapp')}
                  disabled={isSharing}
                >
                  <FaWhatsapp size={18} />
                  <span>WhatsApp</span>
                </button>
                <button 
                  className="share-option telegram"
                  onClick={() => handleShare('telegram')}
                  disabled={isSharing}
                >
                  <FaTelegram size={18} />
                  <span>Telegram</span>
                </button>
              </div>
            )}
          </div>
          
          <button 
            className="action-button"
            onClick={handleDownload}
          >
            <FiDownload size={18} />
            <span>Download</span>
          </button>
          
          <button 
            className="action-button primary"
            onClick={() => setIsEditModalOpen(true)}
          >
            <FiEdit2 size={18} />
            <span>Edit</span>
          </button>
        </div>
      </div>

      <div className="invoice-view-content">
        <InvoiceContent invoice={invoice} contentRef={contentRef} />
      </div>

      {isEditModalOpen && (
        <CreateInvoiceModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialData={invoice}
          mode="edit"
        />
      )}
    </div>
  );
};

export default InvoiceView; 