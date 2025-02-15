import React, { useState, useEffect } from 'react';
import { FiX, FiUpload, FiCamera, FiEdit2, FiPlus } from 'react-icons/fi';
import './CreateInvoiceModal.css';
import { supabase } from '../../utils/supabaseClient';
import { useNotifications } from '../../context/NotificationContext';
import toast from 'react-hot-toast';

const CreateInvoiceModal = ({ isOpen, onClose, invoice = null }) => {
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState({
    title: '',
    vendor: {
      name: '',
      shortName: ''
    },
    amount: '',
    purchaseDate: '',
    paymentMode: '',
    status: '',
    category: '',
    warrantyPeriod: '',
    notes: '',
    attachments: [],
    // Add any additional fields you want to track
  });

  const [files, setFiles] = useState({
    mainImage: invoice?.mainImage || null
  });

  useEffect(() => {
    if (invoice) {
      // Pre-fill form with existing invoice data
      setFormData({
        title: invoice.title || '',
        vendor: invoice.vendor || { name: '', shortName: '' },
        amount: invoice.amount || '',
        purchaseDate: invoice.purchaseDate || '',
        paymentMode: invoice.paymentMode || '',
        status: invoice.status || '',
        category: invoice.category || '',
        warrantyPeriod: invoice.warrantyPeriod || '',
        notes: invoice.notes || '',
        attachments: invoice.attachments || [],
        // Pre-fill any additional fields
      });
    }
  }, [invoice]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFiles(prev => ({ ...prev, mainImage: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (invoice) {
        // Update existing invoice
        const { error } = await supabase
          .from('invoices')
          .update(formData)
          .eq('id', invoice.id);

        if (error) throw error;

        toast.success('Invoice updated successfully! 📝', {
          duration: 4000,
          icon: '✅'
        });
      } else {
        // Create new invoice
        const { error } = await supabase
          .from('invoices')
          .insert([formData]);

        if (error) throw error;

        toast.success('New invoice created! 🎉', {
          duration: 4000,
          icon: '✅'
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error(`Failed to ${invoice ? 'update' : 'create'} invoice. Please try again.`, {
        duration: 4000,
        icon: '❌'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{invoice ? 'Edit Invoice' : 'Create Invoice'}</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="invoice-form">
          {/* Invoice Image Upload */}
          <div className="form-section">
            <h3>Invoice Image</h3>
            <div className="upload-section">
              <div className="main-upload-area">
                {files.mainImage ? (
                  <div className="preview-image">
                    <img 
                      src={files.mainImage instanceof File ? URL.createObjectURL(files.mainImage) : files.mainImage} 
                      alt="Preview" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setFiles(prev => ({ ...prev, mainImage: null }))}
                      className="remove-image"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      id="mainImage"
                      className="file-input"
                    />
                    <label htmlFor="mainImage" className="upload-label">
                      <FiUpload size={24} />
                      <span>Drop or click to upload</span>
                      <span className="upload-hint">Supports: JPG, PNG, PDF</span>
                    </label>
                    {/* Mobile camera capture */}
                    <button type="button" className="camera-capture">
                      <FiCamera size={20} />
                      Capture Photo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Purchase Details */}
          <div className="form-section">
            <h3>Purchase Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Item/Title Name*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="purchaseDate">Date of Purchase*</label>
                <input
                  type="date"
                  id="purchaseDate"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="vendorName">Vendor/Store Name*</label>
              <input
                type="text"
                id="vendorName"
                name="vendorName"
                value={formData.vendor.name}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* Payment Information */}
          <div className="form-section">
            <h3>Payment Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="paymentMode">Payment Mode*</label>
                <select
                  id="paymentMode"
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select payment mode</option>
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="google_pay">Google Pay</option>
                  <option value="phone_pe">PhonePe</option>
                  <option value="online">Online Payment</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="status">Status*</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="emi">EMI</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount">Amount*</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="form-section">
            <h3>Additional Details</h3>
            <div className="form-group">
              <label htmlFor="invoiceNumber">Invoice Number</label>
              <input
                type="text"
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Warranty Information */}
          <div className="form-section">
            <h3>Warranty Information</h3>
            <div className="form-group">
              <label htmlFor="warrantyPeriod">Warranty Period</label>
              <input
                type="text"
                id="warrantyPeriod"
                name="warrantyPeriod"
                value={formData.warrantyPeriod}
                onChange={handleInputChange}
                placeholder="e.g., 1 year, 6 months"
              />
            </div>
          </div>

          {/* Categorization & Notes */}
          <div className="form-section">
            <h3>Categorization & Notes</h3>
            <div className="form-group">
              <label htmlFor="category">Category*</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select category</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="groceries">Groceries</option>
                <option value="utilities">Utilities</option>
                <option value="entertainment">Entertainment</option>
                <option value="other">Other</option>
              </select>
            </div>
            {formData.category === 'other' && (
              <div className="form-group">
                <label htmlFor="otherCategory">Specify Category*</label>
                <input
                  type="text"
                  id="otherCategory"
                  name="otherCategory"
                  value={formData.otherCategory}
                  onChange={handleInputChange}
                  placeholder="Enter custom category"
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="comments">Additional Comments</label>
              <textarea
                id="comments"
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows="3"
                placeholder="Add any additional notes or remarks..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-button">
              {invoice ? 'Save Changes' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoiceModal; 