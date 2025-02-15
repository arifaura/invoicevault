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

  // Mock data - replace with actual data later
  const [invoices, setInvoices] = useState([
    {
      id: '#INV-2024001',
      title: 'iPhone 15 Pro',
      vendor: {
        name: 'Apple Store',
        shortName: 'AS'
      },
      amount: '₹139,900.00',
      purchaseDate: '2024-01-01',
      paymentMode: 'google_pay',
      status: 'paid',
      category: 'electronics',
      warrantyPeriod: '1 year'
    },
    {
      id: '#INV-2024002',
      title: 'Monthly Groceries',
      vendor: {
        name: 'DMart',
        shortName: 'DM'
      },
      amount: '₹5,400.00',
      purchaseDate: '2024-01-05',
      paymentMode: 'phone_pe',
      status: 'pending',
      category: 'groceries',
      warrantyPeriod: null
    },
    {
      id: '#INV-2024003',
      title: 'Samsung TV',
      vendor: {
        name: 'Croma',
        shortName: 'CR'
      },
      amount: '₹45,999.00',
      purchaseDate: '2024-11-01',
      paymentMode: 'credit_card',
      status: 'paid',
      category: 'electronics',
      warrantyPeriod: '6 months'
    }
  ]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelect = (invoiceId) => {
    setSelectedInvoices(prev => {
      if (prev.includes(invoiceId)) {
        return prev.filter(id => id !== invoiceId);
      } else {
        return [...prev, invoiceId];
      }
    });
  };

  const handleViewInvoice = (invoiceId) => {
    navigate(`/dashboard/invoice/${invoiceId.replace('#', '')}`);
  };

  const handleEditInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsCreateModalOpen(true);
  };

  const handleDeleteInvoice = (invoice) => {
    setDeleteAlert({ show: true, invoice });
  };

  const confirmDelete = () => {
    const invoice = deleteAlert.invoice;
    setInvoices(prev => prev.filter(inv => inv.id !== invoice.id));
    setSelectedInvoices(prev => prev.filter(id => id !== invoice.id));
    
    addNotification({
      type: 'success',
      message: `Invoice ${invoice.id} deleted successfully`,
      icon: <FiTrash2 size={16} />
    });
    
    setDeleteAlert({ show: false, invoice: null });
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
    try {
      // Navigate to invoice view with download parameter
      navigate(`/dashboard/invoice/${invoice.id.replace('#', '')}?download=true`);
      
      toast.success(`Invoice ${invoice.id} download started`, {
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

    const purchaseDateTime = new Date(purchaseDate).getTime();
    const currentTime = new Date().getTime();
    
    // Convert warranty period to milliseconds
    let warrantyDuration;
    if (warrantyPeriod.includes('year')) {
      const years = parseInt(warrantyPeriod);
      warrantyDuration = years * 365 * 24 * 60 * 60 * 1000;
    } else if (warrantyPeriod.includes('month')) {
      const months = parseInt(warrantyPeriod);
      warrantyDuration = months * 30 * 24 * 60 * 60 * 1000;
    } else {
      return null;
    }

    const warrantyEndTime = purchaseDateTime + warrantyDuration;
    const daysLeft = Math.ceil((warrantyEndTime - currentTime) / (1000 * 60 * 60 * 24));

    return daysLeft;
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

      // Get clean IDs (remove '#' prefix)
      const cleanIds = selectedInvoices.map(id => id.replace('#', ''));

      // Delete from Supabase
      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', cleanIds);

      if (error) throw error;

      // Update local state
      setInvoices(prevInvoices => 
        prevInvoices.filter(inv => !selectedInvoices.includes(inv.id))
      );
      setSelectedInvoices([]); // Clear selection

      toast.success(`Successfully deleted ${selectedInvoices.length} invoices! 🗑️`, {
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
                  <th className="checkbox-cell">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                    />
                  </th>
                  <th>Invoice No.</th>
                  <th>Item/Title</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Purchase Date</th>
                  <th>Payment Mode</th>
                  <th>Category</th>
                  <th>Warranty</th>
                  <th>Warranty Status</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="checkbox-cell">
                      <input 
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => handleSelect(invoice.id)}
                      />
                    </td>
                    <td>{invoice.id}</td>
                    <td>{invoice.title}</td>
                    <td>
                      <div className="vendor-info">
                        <div className="vendor-avatar">{invoice.vendor.shortName}</div>
                        <div className="vendor-name">{invoice.vendor.name}</div>
                      </div>
                    </td>
                    <td>{invoice.amount}</td>
                    <td>{new Date(invoice.purchaseDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`payment-mode ${invoice.paymentMode}`}>
                        {invoice.paymentMode.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    </td>
                    <td>
                      <span className="category-badge">
                        {invoice.category.charAt(0).toUpperCase() + invoice.category.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className="warranty-text">
                        {invoice.warrantyPeriod || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {invoice.warrantyPeriod && invoice.warrantyPeriod !== 'N/A' ? (
                        <span className={`warranty-status-badge ${
                          calculateWarrantyDaysLeft(invoice.purchaseDate, invoice.warrantyPeriod) <= 0 
                            ? 'expired'
                            : calculateWarrantyDaysLeft(invoice.purchaseDate, invoice.warrantyPeriod) <= 30 
                            ? 'expiring-soon'
                            : 'active'
                        }`}>
                          {calculateWarrantyDaysLeft(invoice.purchaseDate, invoice.warrantyPeriod) <= 0
                            ? 'Expired'
                            : `${calculateWarrantyDaysLeft(invoice.purchaseDate, invoice.warrantyPeriod)} days left`}
                        </span>
                      ) : (
                        <span className="warranty-status-badge na">N/A</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${invoice.status}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="action-icon-btn" 
                          title="View Invoice"
                          onClick={() => handleViewInvoice(invoice.id)}
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
                ))}
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
        }}
        mode={selectedInvoice ? 'edit' : 'create'}
        initialData={selectedInvoice}
      />

      <CustomAlert
        show={deleteAlert.show}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${deleteAlert.invoice?.id}?`}
        onConfirm={() => {
          confirmDelete();
          // Remove the default confirm
          return false;
        }}
        onCancel={() => setDeleteAlert({ show: false, invoice: null })}
      />
      
      <CustomAlert
        show={bulkDeleteAlert}
        title="Delete Multiple Invoices"
        message={`Are you sure you want to delete ${selectedInvoices.length} invoices? This action cannot be undone.`}
        onConfirm={() => {
          confirmBulkDelete();
          // Remove the default confirm
          return false;
        }}
        onCancel={() => setBulkDeleteAlert(false)}
      />
    </div>
  );
};

export default Invoices; 