import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiDownload, FiTrash2, FiEdit2, FiEye, FiFilter, FiX, FiAlertTriangle } from 'react-icons/fi';
import CreateInvoiceModal from './CreateInvoiceModal';
import { useNotifications } from '../../context/NotificationContext';
import './Invoices.css';
import CustomAlert from '../Common/CustomAlert';
import { generatePDF } from '../../utils/pdfGenerator';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';
import { RiFileListLine } from 'react-icons/ri';

const Invoices = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    paymentMode: '',
    dateRange: {
      start: '',
      end: ''
    }
  });
  const { addNotification } = useNotifications();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleteAlert, setDeleteAlert] = useState({ show: false, invoice: null });
  const [bulkDeleteAlert, setBulkDeleteAlert] = useState(false);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          vendor:vendors(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    }
  };

  const getCleanId = (id) => {
    if (!id) return '';
    return typeof id === 'string' ? id.replace('#', '') : id.toString();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const validInvoiceIds = filteredInvoices
        .filter(invoice => invoice?.id)
        .map(invoice => invoice.id);
      setSelectedInvoices(validInvoiceIds);
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelect = (invoiceId) => {
    if (!invoiceId) return;
    
    setSelectedInvoices(prev => {
      if (prev.includes(invoiceId)) {
        return prev.filter(id => id !== invoiceId);
      } else {
        return [...prev, invoiceId];
      }
    });
  };

  const handleViewInvoice = (invoiceId) => {
    if (!invoiceId) return;
    const cleanId = getCleanId(invoiceId);
    navigate(`/dashboard/invoice/${cleanId}`);
  };

  const handleEditInvoice = (invoice) => {
    if (!invoice?.id) return;
    setSelectedInvoice(invoice);
    setIsCreateModalOpen(true);
  };

  const handleDeleteInvoice = (invoice) => {
    if (!invoice?.id) {
      toast.error('Invalid invoice');
      return;
    }
    setDeleteAlert({ show: true, invoice });
  };

  const confirmDelete = async () => {
    const invoice = deleteAlert.invoice;
    if (!invoice?.id) {
      toast.error('Invalid invoice');
      return;
    }
    
    try {
      toast.loading('Deleting invoice...', { id: 'deleteInvoice' });
      
      // Delete the invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (error) throw error;

      // Update local state
      setInvoices(prev => prev.filter(inv => inv.id !== invoice.id));
      
      toast.success('Invoice deleted successfully!', { id: 'deleteInvoice' });
      
      // Close the alert
      setDeleteAlert({ show: false, invoice: null });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice: ' + error.message, { id: 'deleteInvoice' });
    }
  };

  const handleBulkDelete = () => {
    setBulkDeleteAlert(true);
  };

  const handleBulkDownload = () => {
    // Here you would typically generate and download multiple invoice PDFs
    addNotification({
      type: 'success',
      message: `${selectedInvoices.length} invoices downloaded successfully`,
      icon: <FiDownload size={16} />
    });
  };

  const handleDownloadInvoice = async (invoice) => {
    if (!invoice?.id) return;
    try {
      // Navigate to invoice view with download parameter
      const cleanId = getCleanId(invoice.id);
      navigate(`/dashboard/invoice/${cleanId}?download=true`);
      
      toast.success(`Invoice ${invoice.invoice_number} download started`, {
        duration: 4000,
        icon: '📥'
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice. Please try again.', {
        duration: 4000,
        icon: '❌'
      });
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateRangeChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      category: '',
      paymentMode: '',
      dateRange: {
        start: '',
        end: ''
      }
    });
    setSearchQuery('');
  };

  const handleExport = () => {
    const selectedData = invoices.filter(invoice => selectedInvoices.includes(invoice.id));
    const csvData = selectedData.map(invoice => ({
      'Invoice No': invoice.id,
      'Title': invoice.title,
      'Vendor': invoice.vendor.name,
      'Amount': invoice.amount,
      'Date': invoice.purchaseDate,
      'Payment Mode': invoice.paymentMode,
      'Category': invoice.category,
      'Status': invoice.status,
      'Warranty': invoice.warrantyPeriod || 'N/A'
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter invoices based on search and filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        invoice.id.toLowerCase().includes(searchLower) ||
        invoice.title.toLowerCase().includes(searchLower) ||
        invoice.vendor.name.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Status filter
      if (filters.status && invoice.status !== filters.status) return false;

      // Category filter
      if (filters.category && invoice.category !== filters.category) return false;

      // Payment mode filter
      if (filters.paymentMode && invoice.paymentMode !== filters.paymentMode) return false;

      // Date range filter
      if (filters.dateRange.start && filters.dateRange.end) {
        const invoiceDate = new Date(invoice.purchaseDate);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (invoiceDate < startDate || invoiceDate > endDate) return false;
      }

      return true;
    });
  }, [invoices, searchQuery, filters]);

  const calculateWarrantyDaysLeft = (purchaseDate, warrantyPeriod) => {
    if (!warrantyPeriod || warrantyPeriod === 'N/A') return null;

    // Convert warranty period to days
    let warrantyDays = 0;
    
    // Handle combined year and month format
    const years = warrantyPeriod.match(/(\d+)\s*year/);
    const months = warrantyPeriod.match(/(\d+)\s*month/);
    
    if (years) {
      warrantyDays += parseInt(years[1]) * 365;
    }
    if (months) {
      warrantyDays += parseInt(months[1]) * 30;
    }
    
    // If no valid period found, return null
    if (warrantyDays === 0) return null;

    const purchaseDateTime = new Date(purchaseDate).getTime();
    const currentTime = new Date().getTime();
    const daysLeft = Math.ceil((purchaseDateTime + (warrantyDays * 24 * 60 * 60 * 1000) - currentTime) / (1000 * 60 * 60 * 24));
    
    return daysLeft;
  };

  const getWarrantyStatusClass = (daysLeft) => {
    if (daysLeft === null) return 'na';
    if (daysLeft <= 0) return 'expired';
    if (daysLeft <= 30) return 'critical';
    if (daysLeft <= 90) return 'warning';
    return 'good';
  };

  // Warranty expiration check
  useEffect(() => {
    invoices.forEach(invoice => {
      const daysLeft = calculateWarrantyDaysLeft(invoice.purchaseDate, invoice.warrantyPeriod);
      if (daysLeft !== null && daysLeft <= 30 && daysLeft > 0) {
        addNotification({
          type: 'warning',
          message: `Warranty for ${invoice.title} expires in ${daysLeft} days`,
          icon: <FiAlertTriangle size={16} />
        });
      }
    });
  }, [invoices]);

  const BulkActions = () => {
    const selectedCount = selectedInvoices.length;
    
    if (selectedCount === 0) return null;
    
    return (
      <div className="bulk-actions">
        <button 
          className="bulk-action-btn"
          onClick={handleBulkDownload}
        >
          <FiDownload size={16} />
          Download Selected
        </button>
        <button 
          className="bulk-action-btn delete"
          onClick={handleBulkDelete}
        >
          <FiTrash2 size={16} />
          Delete Selected
        </button>
        <span className="selected-count">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
      </div>
    );
  };

  const confirmBulkDelete = async () => {
    try {
      toast.loading('Deleting invoices...', {
        id: 'bulkDeleteProgress'
      });

      // Get clean IDs (remove '#' prefix and filter out invalid IDs)
      const cleanIds = selectedInvoices
        .filter(id => id) // Remove falsy values
        .map(id => getCleanId(id));

      if (cleanIds.length === 0) {
        throw new Error('No valid invoices selected');
      }

      // Delete from Supabase
      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', cleanIds);

      if (error) throw error;

      // Update local state
      setInvoices(prevInvoices => 
        prevInvoices.filter(inv => !selectedInvoices.includes(inv?.id))
      );
      setSelectedInvoices([]); // Clear selection

      toast.success(`Successfully deleted ${cleanIds.length} invoices! 🗑️`, {
        duration: 4000,
        icon: '✅'
      });
    } catch (error) {
      console.error('Error deleting invoices:', error);
      toast.error('Failed to delete invoices. Please try again.', {
        duration: 4000,
        icon: '❌'
      });
    } finally {
      setBulkDeleteAlert(false);
      toast.dismiss('bulkDeleteProgress');
    }
  };

  return (
    <div className="invoices-container p-4">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Invoices</h1>
            <p className="text-secondary">Manage and track all your invoices</p>
          </div>
          <button 
            className="create-invoice-btn"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <FiPlus size={20} />
            Create Invoice
          </button>
        </div>

        <div className="invoice-actions">
          <div className="search-wrapper">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="action-buttons">
            <button 
              className={`action-btn ${filterOpen ? 'active' : ''}`}
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <FiFilter size={16} />
              Filter
            </button>
            <button 
              className="action-btn" 
              disabled={selectedInvoices.length === 0}
              onClick={handleExport}
            >
              <FiDownload size={16} />
              Export
            </button>
            <button 
              className="action-btn danger" 
              disabled={selectedInvoices.length === 0}
              onClick={handleBulkDelete}
            >
              <FiTrash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        {filterOpen && (
          <div className="filter-panel">
            <div className="filter-header">
              <h3>Filters</h3>
              <button className="close-filter" onClick={() => setFilterOpen(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="filter-content">
              <div className="filter-group">
                <label>Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Category</label>
                <select 
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All</option>
                  <option value="electronics">Electronics</option>
                  <option value="groceries">Groceries</option>
                  <option value="clothing">Clothing</option>
                  <option value="utilities">Utilities</option>
                  <option value="entertainment">Entertainment</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Payment Mode</label>
                <select 
                  value={filters.paymentMode}
                  onChange={(e) => handleFilterChange('paymentMode', e.target.value)}
                >
                  <option value="">All</option>
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="google_pay">Google Pay</option>
                  <option value="phone_pe">PhonePe</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Date Range</label>
                <div className="date-range">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    max={filters.dateRange.end || undefined}
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    min={filters.dateRange.start || undefined}
                    placeholder="End Date"
                  />
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button className="reset-btn" onClick={resetFilters}>
                Reset Filters
              </button>
              <button className="apply-btn" onClick={() => setFilterOpen(false)}>
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* No Invoices Message */}
      {invoices.length === 0 ? (
        <div className="no-invoices-container">
          <div className="empty-state">
            <RiFileListLine size={64} className="empty-icon" />
            <h3>No Invoices Found</h3>
            <p>
              {searchQuery || Object.values(filters).some(Boolean) 
                ? "No invoices match your search criteria. Try adjusting your filters."
                : "Start by creating your first invoice to track your expenses."}
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
            >
              <FiPlus size={16} className="mr-2" />
              Create Your First Invoice
            </button>
          </div>
        </div>
      ) : (
        <div className="invoices-table-container">
          <div className="table-wrapper">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedInvoices.length > 0 && selectedInvoices.length === filteredInvoices.length}
                      className="checkbox"
                    />
                  </th>
                  <th>S.No</th>
                  <th>Title</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Payment Mode</th>
                  <th>Status</th>
                  <th>Purchase Date</th>
                  <th>Warranty Period</th>
                  <th>Days Left</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice, index) => {
                  const daysLeft = calculateWarrantyDaysLeft(invoice?.purchase_date, invoice?.warranty_period);
                  const warrantyStatusClass = getWarrantyStatusClass(daysLeft);
                  
                  return (
                    <tr key={invoice?.id || index}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice?.id)}
                          onChange={() => handleSelect(invoice?.id)}
                          className="checkbox"
                        />
                      </td>
                      <td className="serial-number">{index + 1}</td>
                      <td className="invoice-title">
                        <div className="text-truncate">{invoice?.title || 'N/A'}</div>
                      </td>
                      <td>{invoice?.vendor?.name || 'N/A'}</td>
                      <td className="amount">₹{invoice?.amount || '0'}</td>
                      <td>{invoice?.category || 'N/A'}</td>
                      <td>{invoice?.payment_mode ? invoice.payment_mode.replace(/_/g, ' ').toUpperCase() : 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${invoice?.status || ''}`}>
                          {invoice?.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'N/A'}
                        </span>
                      </td>
                      <td>{invoice?.purchase_date ? new Date(invoice.purchase_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}</td>
                      <td>{invoice?.warranty_period || 'N/A'}</td>
                      <td>
                        <span className={`warranty-days ${warrantyStatusClass}`}>
                          {daysLeft !== null 
                            ? daysLeft <= 0 
                              ? 'Expired'
                              : `${daysLeft} days` 
                            : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button 
                            className="action-icon-btn" 
                            title="View Invoice"
                            onClick={() => handleViewInvoice(invoice?.id)}
                          >
                            <FiEye size={16} />
                          </button>
                          <button 
                            className="action-icon-btn" 
                            title="Edit Invoice"
                            onClick={() => handleEditInvoice(invoice)}
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button 
                            className="action-icon-btn" 
                            title="Download Invoice"
                            onClick={() => handleDownloadInvoice(invoice)}
                          >
                            <FiDownload size={16} />
                          </button>
                          <button 
                            className="action-icon-btn delete" 
                            title="Delete Invoice"
                            onClick={() => handleDeleteInvoice(invoice)}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="table-footer">
        <div className="per-page-select">
          <select defaultValue="10">
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
        <div className="pagination">
          <button className="pagination-btn" disabled>Previous</button>
          <button className="pagination-btn">Next</button>
        </div>
      </div>

      <BulkActions />

      <CreateInvoiceModal 
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedInvoice(null);
          // Refresh the invoices list after closing the modal
          fetchInvoices();
        }}
        mode={selectedInvoice ? 'edit' : 'create'}
        initialData={selectedInvoice}
      />

      <CustomAlert
        isOpen={deleteAlert.show}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${deleteAlert.invoice?.title}"?`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteAlert({ show: false, invoice: null })}
      />
      
      <CustomAlert
        isOpen={bulkDeleteAlert}
        title="Delete Multiple Invoices"
        message={`Are you sure you want to delete ${selectedInvoices.length} invoices? This action cannot be undone.`}
        onConfirm={() => {
          confirmBulkDelete();
          // Remove the default confirm
          return false;
        }}
        onClose={() => setBulkDeleteAlert(false)}
      />
    </div>
  );
};

export default Invoices; 