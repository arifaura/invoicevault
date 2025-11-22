import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiDownload, FiTrash2, FiEdit2, FiEye, FiFilter, FiX } from 'react-icons/fi';
import { RiFileListLine } from 'react-icons/ri';
import CreateInvoiceModal from './CreateInvoiceModal';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import './Invoices.css';
import CustomAlert from '../Common/CustomAlert';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';
import Skeleton from '../Common/Skeleton';
import * as XLSX from 'xlsx';

const InvoiceSkeleton = () => (
  <div className="invoice-item skeleton-wrapper">
    <div className="invoice-item-checkbox">
      <Skeleton width="20px" height="20px" />
    </div>
    <div className="invoice-item-content">
      <div className="invoice-main-info">
        <Skeleton width="150px" height="24px" className="mb-2" />
        <Skeleton width="200px" height="20px" />
      </div>
      <div className="invoice-details">
        <Skeleton width="100px" height="20px" />
        <Skeleton width="120px" height="20px" />
        <Skeleton width="80px" height="20px" />
      </div>
    </div>
    <div className="invoice-actions">
      <Skeleton width="120px" height="32px" />
    </div>
  </div>
);

const TableRowSkeleton = () => (
  <tr className="skeleton-row">
    <td>
      <Skeleton width="20px" height="20px" />
    </td>
    <td>
      <Skeleton width="40px" height="24px" />
    </td>
    <td>
      <Skeleton width="200px" height="24px" />
    </td>
    <td>
      <Skeleton width="150px" height="24px" />
    </td>
    <td>
      <Skeleton width="100px" height="24px" />
    </td>
    <td>
      <Skeleton width="120px" height="24px" />
    </td>
    <td>
      <Skeleton width="120px" height="24px" />
    </td>
    <td>
      <Skeleton width="100px" height="32px" className="status-skeleton" />
    </td>
    <td>
      <Skeleton width="120px" height="24px" />
    </td>
    <td>
      <Skeleton width="120px" height="24px" />
    </td>
    <td>
      <Skeleton width="80px" height="24px" />
    </td>
    <td>
      <div className="table-actions">
        <Skeleton width="32px" height="32px" />
        <Skeleton width="32px" height="32px" />
        <Skeleton width="32px" height="32px" />
        <Skeleton width="32px" height="32px" />
      </div>
    </td>
  </tr>
);

const Invoices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();

    if (!user) return;

    // Real-time subscription for invoices
    const subscription = supabase
      .channel('public:invoices')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time invoice update:', payload);
          fetchInvoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const fetchInvoices = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (error) throw error;

      setInvoices(prev => prev.filter(inv => inv.id !== invoice.id));

      toast.success('Invoice deleted successfully!', { id: 'deleteInvoice' });
      addNotification({
        type: 'success',
        message: `Invoice ${invoice.id} deleted successfully`,
        icon: <FiTrash2 size={16} />
      });

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
    addNotification({
      type: 'success',
      message: `${selectedInvoices.length} invoices downloaded successfully`,
      icon: <FiDownload size={16} />
    });
  };

  const handleDownloadInvoice = async (invoice) => {
    if (!invoice?.id) return;
    try {
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
    if (selectedData.length === 0) return;

    const excelData = selectedData.map(invoice => ({
      'Invoice No': invoice.id,
      'Title': invoice.title,
      'Vendor': invoice.vendor?.name,
      'Amount': invoice.amount,
      'Date': invoice.purchase_date,
      'Payment Mode': invoice.payment_mode,
      'Category': invoice.category,
      'Status': invoice.status,
      'Warranty': invoice.warranty_period || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

    XLSX.writeFile(workbook, `invoices_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

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

  const calculateWarrantyDaysLeft = (purchaseDate, warrantyPeriod) => {
    if (!warrantyPeriod || warrantyPeriod === 'N/A') return null;

    let warrantyDays = 0;
    const years = warrantyPeriod.match(/(\d+)\s*year/);
    const months = warrantyPeriod.match(/(\d+)\s*month/);

    if (years) {
      warrantyDays += parseInt(years[1]) * 365;
    }
    if (months) {
      warrantyDays += parseInt(months[1]) * 30;
    }

    if (warrantyDays === 0) return null;

    const purchaseDateTime = new Date(purchaseDate).getTime();
    const currentTime = new Date().getTime();
    const daysLeft = Math.ceil((purchaseDateTime + (warrantyDays * 24 * 60 * 60 * 1000) - currentTime) / (1000 * 60 * 60 * 24));

    return daysLeft;
  };

  const getWarrantyStatusClass = (daysLeft) => {
    if (daysLeft === null || daysLeft <= 30) return 'red';
    if (daysLeft <= 730) return 'yellow';
    return 'green';
  };

  const confirmBulkDelete = async () => {
    try {
      toast.loading('Deleting invoices...', {
        id: 'bulkDeleteProgress'
      });

      const cleanIds = selectedInvoices
        .filter(id => id)
        .map(id => getCleanId(id));

      if (cleanIds.length === 0) {
        throw new Error('No valid invoices selected');
      }

      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', cleanIds);

      if (error) throw error;

      setInvoices(prevInvoices =>
        prevInvoices.filter(inv => !selectedInvoices.includes(inv?.id))
      );
      setSelectedInvoices([]);

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

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch =
        invoice.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.id?.toString().includes(searchQuery);

      const matchesStatus = !filters.status || invoice.status === filters.status;
      const matchesCategory = !filters.category || invoice.category === filters.category;
      const matchesPaymentMode = !filters.paymentMode || invoice.payment_mode === filters.paymentMode;

      let matchesDateRange = true;
      if (filters.dateRange.start && filters.dateRange.end) {
        const invoiceDate = new Date(invoice.purchase_date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        matchesDateRange = invoiceDate >= startDate && invoiceDate <= endDate;
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesPaymentMode && matchesDateRange;
    });
  }, [invoices, searchQuery, filters]);

  return (
    <div className="invoices-container">
      <div className="invoices-header">
        <div className="header-left">
          <h1>Invoices</h1>
          <p>Manage and track all your invoices</p>
        </div>
        <div className="header-actions">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className={`filter-btn ${filterOpen ? 'active' : ''}`}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <FiFilter />
            Filter
          </button>
          <button
            className="create-btn"
            onClick={() => {
              setSelectedInvoice(null);
              setIsCreateModalOpen(true);
            }}
          >
            <FiPlus />
            Create Invoice
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
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
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="software">Software</option>
              <option value="services">Services</option>
              <option value="office">Office</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Payment Mode</label>
            <select
              value={filters.paymentMode}
              onChange={(e) => handleFilterChange('paymentMode', e.target.value)}
            >
              <option value="">All Modes</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div className="filter-group date-range">
            <label>Date Range</label>
            <div className="date-inputs">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
              />
            </div>
          </div>
          <button className="reset-filters" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      )}

      <BulkActions />

      <div className="invoices-table-container">
        <table className="invoices-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={filteredInvoices.length > 0 && selectedInvoices.length === filteredInvoices.length}
                />
              </th>
              <th>ID</th>
              <th>Item/Title</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Payment Mode</th>
              <th>Status</th>
              <th>Category</th>
              <th>Warranty</th>
              <th>Days Left</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, index) => (
                <TableRowSkeleton key={index} />
              ))
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="12" className="no-data">
                  <div className="no-data-content">
                    <RiFileListLine size={48} />
                    <p>No invoices found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => {
                const daysLeft = calculateWarrantyDaysLeft(invoice.purchase_date, invoice.warranty_period);
                const warrantyClass = getWarrantyStatusClass(daysLeft);

                return (
                  <tr key={invoice.id} className={selectedInvoices.includes(invoice.id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => handleSelect(invoice.id)}
                      />
                    </td>
                    <td className="invoice-id">#{getCleanId(invoice.id).substring(0, 6)}</td>
                    <td className="invoice-title">{invoice.title}</td>
                    <td>{invoice.vendor?.name || 'Unknown'}</td>
                    <td className="amount">
                      {invoice.currency} {invoice.amount}
                    </td>
                    <td>{new Date(invoice.purchase_date).toLocaleDateString()}</td>
                    <td className="capitalize">{invoice.payment_mode?.replace('_', ' ')}</td>
                    <td>
                      <span className={`status-badge ${invoice.status}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="capitalize">{invoice.category}</td>
                    <td>{invoice.warranty_period || 'N/A'}</td>
                    <td>
                      {daysLeft !== null ? (
                        <span className={`warranty-days ${warrantyClass}`}>
                          {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-btn view"
                          title="View Details"
                          onClick={() => handleViewInvoice(invoice.id)}
                        >
                          <FiEye />
                        </button>
                        <button
                          className="action-btn edit"
                          title="Edit"
                          onClick={() => handleEditInvoice(invoice)}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="action-btn download"
                          title="Download"
                          onClick={() => handleDownloadInvoice(invoice)}
                        >
                          <FiDownload />
                        </button>
                        <button
                          className="action-btn delete"
                          title="Delete"
                          onClick={() => handleDeleteInvoice(invoice)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialData={selectedInvoice}
      />

      <CustomAlert
        isOpen={deleteAlert.show}
        onClose={() => setDeleteAlert({ show: false, invoice: null })}
        onConfirm={confirmDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${deleteAlert.invoice?.title}"? This action cannot be undone.`}
        type="danger"
      />

      <CustomAlert
        isOpen={bulkDeleteAlert}
        onClose={() => setBulkDeleteAlert(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Invoices"
        message={`Are you sure you want to delete ${selectedInvoices.length} selected invoices? This action cannot be undone.`}
        type="danger"
      />
    </div>
  );
};

export default Invoices;