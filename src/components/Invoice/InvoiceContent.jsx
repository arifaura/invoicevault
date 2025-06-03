import React from "react";
import "./InvoiceContent.css";
import { formatCurrency } from "../../utils/formatters";
import { supabase } from "../../utils/supabaseClient";
import {
  FiCalendar,
  FiHash,
  FiTag,
  FiClock,
  FiDollarSign,
  FiCreditCard,
  FiBox,
  FiShield,
  FiFileText,
  FiAlertCircle,
} from "react-icons/fi";

const InvoiceContent = ({ invoice, contentRef }) => {
  if (!invoice) {
    return <div className="loading">Loading invoice...</div>;
  }

  // Format payment mode
  const formatPaymentMode = (mode) => {
    if (!mode) return "N/A";
    return mode.replace(/_/g, " ").toUpperCase();
  };

  // Get public URL for image
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    return supabase.storage
      .from('invoice-images')
      .getPublicUrl(imageUrl).data.publicUrl;
  };

  // Calculate days left in warranty
  const calculateDaysLeft = () => {
    if (!invoice?.purchase_date || !invoice?.warranty_period) return null;
    
    const purchaseDate = new Date(invoice.purchase_date);
    const warrantyEndDate = new Date(purchaseDate);
    warrantyEndDate.setDate(purchaseDate.getDate() + parseInt(invoice.warranty_period));
    
    const today = new Date();
    const daysLeft = Math.ceil((warrantyEndDate - today) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  // Get warranty status color
  const getWarrantyStatusColor = (daysLeft) => {
    if (daysLeft === null || daysLeft <= 30) return "red";
    if (daysLeft <= 730) return "yellow"; // 2 years = 730 days
    return "green";
  };

  const isPDF = invoice?.image_url?.toLowerCase().endsWith('.pdf');
  const daysLeft = calculateDaysLeft();
  const warrantyStatusColor = getWarrantyStatusColor(daysLeft);

  return (
    <div className="invoice-content modern" ref={contentRef}>
      <div className="modern-header">
        <div className="brand">
          <h1>InvoiceVault</h1>
          <div className="invoice-number">
            <FiHash />
            <span>{invoice?.id || "N/A"}</span>
          </div>
        </div>

        <div className="header-meta">
          <div className="meta-item">
            <FiCalendar />
            <span>
              {new Date(invoice?.purchase_date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }) || "N/A"}
            </span>
          </div>
          <div
            className={`status-badge ${
              invoice?.status?.toLowerCase() || "pending"
            }`}
          >
            {(invoice?.status || "PENDING").toUpperCase()}
          </div>
        </div>
      </div>
      <div className="invoice-header-info d-flex justify-content-between">
        <h1 className="align-self-center">{invoice.title}</h1>
        {invoice?.image_url && (
          <div className="invoice-image-container">
            {isPDF ? (
              <embed
                src={getImageUrl(invoice.image_url)}
                type="application/pdf"
                width="500"
                height="500"
                className="pdf-preview"
              />
            ) : (
              <img
                src={getImageUrl(invoice.image_url)}
                alt={invoice.title}
                className="img-fluid img-thumbnail"
                style={{ width: "500px", height: "500px", objectFit: "contain" }}
              />
            )}
          </div>
        )}
      </div>

      <div className="modern-content mt-3">
        {/* Vendor Section */}
        <div className="content-section">
          <h2>Vendor Information</h2>
          <div className="vendor-details modern">
            <div className="vendor-avatar">
              {invoice?.vendor?.short_name ||
                invoice?.vendor?.name?.substring(0, 2) ||
                "NA"}
            </div>
            <div className="vendor-info">
              <h3>{invoice?.vendor?.name || "N/A"}</h3>
              <div className="vendor-meta">
                {invoice?.vendor?.address && <p>{invoice.vendor.address}</p>}
                <p>
                  {invoice?.vendor?.city || ""}
                  {invoice?.vendor?.state && `, ${invoice.vendor.state}`}
                  {invoice?.vendor?.zip && ` ${invoice.vendor.zip}`}
                </p>
                {invoice?.vendor?.country && <p>{invoice.vendor.country}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Details Section */}
        <div className="content-section">
          <h2>Purchase Details</h2>
          <div className="details-grid">
            <div className="detail-item">
              <div className="detail-icon">
                <FiBox />
              </div>
              <div className="detail-content">
                <label>Item/Title</label>
                <span>{invoice?.title || "N/A"}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <FiTag />
              </div>
              <div className="detail-content">
                <label>Category</label>
                <span>{invoice?.category || "N/A"}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <FiDollarSign />
              </div>
              <div className="detail-content">
                <label>Amount</label>
                <span className="amount">
                  {formatCurrency(
                    invoice?.amount || 0,
                    invoice?.currency || "INR"
                  )}
                </span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <FiCreditCard />
              </div>
              <div className="detail-content">
                <label>Payment Mode</label>
                <span>{formatPaymentMode(invoice?.payment_mode)}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <FiShield />
              </div>
              <div className="detail-content">
                <label>Warranty Period</label>
                <span>{invoice?.warranty_period || "N/A"}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <FiAlertCircle />
              </div>
              <div className="detail-content">
                <label>Days Left</label>
                <span className={`warranty-status ${warrantyStatusColor}`}>
                  {daysLeft !== null ? `${daysLeft} days` : "N/A"}
                </span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <FiHash />
              </div>
              <div className="detail-content">
                <label>Invoice Number</label>
                <span>{invoice?.invoice_number || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Notes Section */}
        {invoice?.notes && (
          <div className="content-section">
            <h2>Additional Notes</h2>
            <div className="notes-content">
              <div className="detail-icon">
                <FiFileText />
              </div>
              <p>{invoice.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="modern-footer">
        <div className="footer-content">
          <p>
            This is a computer-generated document. No signature is required.
          </p>
          <p>
            Generated via InvoiceVault on{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceContent;
