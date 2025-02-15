import React from 'react';
import './InvoiceContent.css';
import { formatCurrency } from '../../utils/formatters';

const InvoiceContent = ({ invoice, contentRef }) => {
  return (
    <div className="invoice-content" ref={contentRef}>
      <div className="invoice-header">
        <div className="brand-section">
          <h1>InvoiceVault</h1>
          <div className="invoice-meta">
            <div className="invoice-id">#{invoice.id}</div>
            <div className="invoice-date">{invoice.purchaseDate}</div>
          </div>
        </div>
        <div className="status-badge">
          <span className={`status status-${invoice.status}`}>
            {invoice.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="invoice-grid">
        <div className="grid-section vendor-info">
          <h3>Vendor Details</h3>
          <div className="vendor-card">
            <div className="vendor-avatar">{invoice.vendor.shortName}</div>
            <div className="vendor-details">
              <h4>{invoice.vendor.name}</h4>
              <address>
                {invoice.vendor.address && <span>{invoice.vendor.address}</span>}
                <span>
                  {invoice.vendor.city}
                  {invoice.vendor.state && `, ${invoice.vendor.state}`}
                  {invoice.vendor.zip && ` ${invoice.vendor.zip}`}
                </span>
                {invoice.vendor.country && <span>{invoice.vendor.country}</span>}
              </address>
            </div>
          </div>
        </div>

        <div className="grid-section amount-info">
          <h3>Amount</h3>
          <div className="amount-display">
            {formatCurrency(invoice.amount, invoice.currency)}
          </div>
          <div className="payment-mode">
            via {invoice.paymentMode.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        <div className="grid-section purchase-info">
          <h3>Purchase Details</h3>
          <div className="details-list">
            <div className="detail-item">
              <span>Item</span>
              <strong>{invoice.title}</strong>
            </div>
            <div className="detail-item">
              <span>Category</span>
              <strong>{invoice.category}</strong>
            </div>
            {invoice.warrantyPeriod && (
              <div className="detail-item">
                <span>Warranty</span>
                <strong>{invoice.warrantyPeriod}</strong>
              </div>
            )}
            <div className="detail-item">
              <span>Invoice Number</span>
              <strong>{invoice.invoiceNumber}</strong>
            </div>
          </div>
        </div>

        {invoice.comments && (
          <div className="grid-section comments-section">
            <h3>Additional Notes</h3>
            <p>{invoice.comments}</p>
          </div>
        )}
      </div>

      <div className="invoice-footer">
        <div className="footer-content">
          <p>This is a computer-generated document. No signature is required.</p>
          <p>Generated via InvoiceVault on {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceContent; 