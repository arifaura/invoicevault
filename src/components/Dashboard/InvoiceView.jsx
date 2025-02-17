import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { FiArrowLeft, FiDownload, FiEdit2, FiShare2, FiTrash2 } from "react-icons/fi";
import { FaWhatsapp, FaTelegram } from "react-icons/fa";
import CreateInvoiceModal from "./CreateInvoiceModal";
import InvoiceContent from "../Invoice/InvoiceContent";
import "./InvoiceView.css";
import { generatePDF } from "../../utils/pdfGenerator";
import { supabase } from "../../utils/supabaseClient";
import { toast } from "react-hot-toast";
import CustomAlert from '../Common/CustomAlert';
import Skeleton from '../Common/Skeleton';

const InvoiceViewSkeleton = () => (
  <div className="invoice-view-container">
    <div className="invoice-view-header">
      <div className="header-left">
        <Skeleton width="100px" height="36px" />
      </div>
      <div className="header-actions">
        <Skeleton width="160px" height="36px" />
      </div>
    </div>

    <div className="invoice-view-content skeleton-content">
      <div className="invoice-header-skeleton">
        <Skeleton width="200px" height="32px" className="mb-2" />
        <Skeleton width="300px" height="24px" />
      </div>
      
      <div className="invoice-details-skeleton">
        <div className="details-row">
          <Skeleton width="150px" height="24px" />
          <Skeleton width="150px" height="24px" />
        </div>
        <div className="details-row">
          <Skeleton width="180px" height="24px" />
          <Skeleton width="120px" height="24px" />
        </div>
      </div>

      <div className="invoice-items-skeleton">
        <Skeleton width="100%" height="40px" className="mb-2" />
        <Skeleton width="100%" height="60px" />
        <Skeleton width="100%" height="60px" />
        <Skeleton width="100%" height="60px" />
      </div>

      <div className="invoice-summary-skeleton">
        <Skeleton width="200px" height="32px" className="mb-2" />
        <Skeleton width="150px" height="24px" />
      </div>
    </div>
  </div>
);

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
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          *,
          vendor:vendors(*)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setInvoice(data);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast.error("Failed to load invoice");
      navigate("/dashboard/invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shouldDownload = searchParams.get("download") === "true";

    if (shouldDownload && invoice) {
      handleDownload();
      navigate(location.pathname, { replace: true });
    }
  }, [location, invoice]);

  const handleDownload = async () => {
    try {
      if (!contentRef.current) return;
      await generatePDF(
        contentRef.current,
        `invoice-${invoice.id.replace("#", "")}`
      );
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  const handleShare = async (platform) => {
    setIsSharing(true);
    try {
      const invoiceUrl = window.location.href;
      const message = `Check out this invoice: ${invoice.title}\n${invoiceUrl}`;

      if (platform === "whatsapp") {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          "_blank"
        );
      } else if (platform === "telegram") {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(
            invoiceUrl
          )}&text=${encodeURIComponent(invoice.title)}`,
          "_blank"
        );
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share invoice");
    } finally {
      setIsSharing(false);
      setShowShareOptions(false);
    }
  };

  if (loading) {
    return <InvoiceViewSkeleton />;
  }

  if (!invoice) {
    return (
      <div className="invoice-view-container error">
        <h2>Invoice not found</h2>
        <button onClick={() => navigate("/dashboard")} className="back-button">
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
            onClick={() => navigate("/dashboard")}
          >
            <FiArrowLeft size={20} />
            <span>Back</span>
          </button>
        </div>

        <div className="header-actions">
          <div className="share-wrapper">
            <button
              className="action-button"
              onClick={() => setShowShareOptions(!showShareOptions)}
            >
              <FiShare2 size={18} />
            </button>
            {showShareOptions && (
              <div className="share-options">
                <button
                  className="share-option whatsapp"
                  onClick={() => handleShare("whatsapp")}
                  disabled={isSharing}
                >
                  <FaWhatsapp size={20} />
                  <span>WhatsApp</span>
                </button>
                <button
                  className="share-option telegram"
                  onClick={() => handleShare("telegram")}
                  disabled={isSharing}
                >
                  <FaTelegram size={20} />
                  <span>Telegram</span>
                </button>
              </div>
            )}
          </div>

          <button className="action-button" onClick={handleDownload}>
            <FiDownload size={18} />
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
