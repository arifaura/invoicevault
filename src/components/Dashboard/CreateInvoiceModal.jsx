import React, { useState, useEffect } from 'react';
import { FiX, FiUpload, FiCamera } from 'react-icons/fi';
import './CreateInvoiceModal.css';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const CreateInvoiceModal = ({ isOpen, onClose, initialData }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    invoice_number: '',
    vendor_name: '',
    amount: '',
    currency: 'INR',
    purchase_date: '',
    payment_mode: '',
    status: '',
    category: '',
    warranty_period: '',
    notes: '',
    attachments: []
  });

  const [files, setFiles] = useState({
    mainImage: initialData?.mainImage || null
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        vendor_name: initialData.vendor?.name || '',
        amount: initialData.amount || '',
        currency: initialData.currency || 'INR',
        purchase_date: initialData.purchase_date || '',
        payment_mode: initialData.payment_mode || '',
        status: initialData.status || '',
        category: initialData.category || '',
        warranty_period: initialData.warranty_period || '',
        notes: initialData.notes || ''
      });

      if (initialData.image_url) {
        setFiles({
          mainImage: initialData.image_url
        });
      }
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Update UI immediately with preview
    setFiles(prev => ({ ...prev, mainImage: file }));
  };

  const uploadImageToStorage = async (file) => {
    if (!file) return null;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPG, PNG or PDF file.');
      return null;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('File is too large. Maximum size is 5MB.');
      return null;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('invoice-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoice-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Upload image first if exists
      let imageUrl = null;
      if (files.mainImage && files.mainImage instanceof File) {
        imageUrl = await uploadImageToStorage(files.mainImage);
      }

      // If in edit mode, update existing vendor
      let vendorId;
      if (initialData) {
        // Update existing vendor if name changed
        if (formData.vendor_name !== initialData.vendor?.name) {
          const { data: vendor, error: vendorError } = await supabase
            .from('vendors')
            .update({ name: formData.vendor_name })
            .eq('id', initialData.vendor.id)
            .select()
            .single();

          if (vendorError) throw vendorError;
          vendorId = vendor.id;
        } else {
          vendorId = initialData.vendor.id;
        }
      } else {
        // Create new vendor
        const { data: vendor, error: vendorError } = await supabase
          .from('vendors')
          .insert([{
            name: formData.vendor_name,
            short_name: formData.vendor_name.substring(0, 2).toUpperCase(),
            created_by: user.id
          }])
          .select()
          .single();

        if (vendorError) throw vendorError;
        vendorId = vendor.id;
      }

      // Prepare invoice data
      const invoiceData = {
        title: formData.title,
        vendor_id: vendorId,
        amount: formData.amount,
        currency: formData.currency,
        purchase_date: formData.purchase_date,
        payment_mode: formData.payment_mode,
        status: formData.status,
        category: formData.category,
        warranty_period: formData.warranty_period,
        notes: formData.notes,
        updated_at: new Date().toISOString()
      };

      // Only add image_url if we have one
      if (imageUrl || (initialData && initialData.image_url)) {
        invoiceData.image_url = imageUrl || initialData.image_url;
      }

      if (initialData) {
        // Update existing invoice
        const { error } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success('Invoice updated successfully! 🎉', {
          duration: 4000,
          icon: '✅'
        });
      } else {
        // Create new invoice
        const { error } = await supabase
          .from('invoices')
          .insert([{
            ...invoiceData,
            created_by: user.id,
            created_at: new Date().toISOString(),
            invoice_number: `INV-${Date.now()}`
          }]);

        if (error) throw error;
        toast.success('Invoice created successfully! 🎉', {
          duration: 4000,
          icon: '✅'
        });

        // Reset form data after successful creation
        setFormData({
          title: '',
          invoice_number: '',
          vendor_name: '',
          amount: '',
          currency: 'INR',
          purchase_date: '',
          payment_mode: '',
          status: '',
          category: '',
          warranty_period: '',
          notes: '',
          attachments: []
        });
        setFiles({ mainImage: null });
      }

      onClose();
      // Trigger a refresh of the invoices list
      window.dispatchEvent(new Event('refresh-invoices'));
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error(error.message || 'Failed to save invoice', {
        duration: 4000,
        icon: '❌'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{initialData ? 'Edit Invoice' : 'Create Invoice'}</h2>
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
                  name="purchase_date"
                  value={formData.purchase_date}
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
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleInputChange}
                placeholder="Enter vendor name"
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
                  name="payment_mode"
                  value={formData.payment_mode}
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
                name="invoice_number"
                value={formData.invoice_number}
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
                name="warranty_period"
                value={formData.warranty_period}
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
                name="notes"
                value={formData.notes}
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
              {initialData ? 'Save Changes' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoiceModal; 