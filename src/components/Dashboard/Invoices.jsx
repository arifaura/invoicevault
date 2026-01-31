import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiPlus, 
  FiDownload, 
  FiTrash2, 
  FiEdit2, 
  FiEye, 
  FiFilter, 
  FiX,
  FiGrid,
  FiList,
  FiMoon,
  FiSun,
  FiMonitor
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import CreateInvoiceModal from './CreateInvoiceModal';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';
import * as XLSX from 'xlsx';
import './Invoices.css';

// Theme Provider Hook
const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'system';
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState('light');

  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    const getResolvedTheme = () => {
      if (theme === 'system') {
        return systemTheme.matches ? 'dark' : 'light';
      }
      return theme;
    };

    const resolved = getResolvedTheme();
    setResolvedTheme(resolved);
    
    root.setAttribute('data-theme', resolved);
    
    if (theme === 'system') {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        setResolvedTheme(systemTheme.matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', systemTheme.matches ? 'dark' : 'light');
      }
    };
    
    systemTheme.addEventListener('change', handler);
    return () => systemTheme.removeEventListener('change', handler);
  }, [theme]);

  return { theme, setTheme, resolvedTheme };
};

// Theme Toggle Component
const ThemeToggle = ({ theme, setTheme }) => {
  const [open, setOpen] = useState(false);

  const options = [
    { value: 'light', icon: FiSun, label: 'Light' },
    { value: 'dark', icon: FiMoon, label: 'Dark' },
    { value: 'system', icon: FiMonitor, label: 'System' }
  ];

  return (
    <div className="theme-toggle-wrapper">
      <button className="icon-btn theme-btn" onClick={() => setOpen(!open)}>
        {theme === 'dark' ? <FiMoon size={20} /> : 
         theme === 'light' ? <FiSun size={20} /> : 
         <FiMonitor size={20} />}
      </button>
      
      <AnimatePresence>
        {open && (
          <>
            <div className="theme-backdrop" onClick={() => setOpen(false)} />
            <motion.div 
              className="theme-dropdown"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  className={`theme-option ${theme === opt.value ? 'active' : ''}`}
                  onClick={() => {
                    setTheme(opt.value);
                    setOpen(false);
                  }}
                >
                  <opt.icon size={16} />
                  <span>{opt.label}</span>
                  {theme === opt.value && <div className="active-dot" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ title, value, trend, icon: Icon, color }) => (
  <motion.div 
    className="stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <div className={`stat-icon ${color}`}>
      <Icon size={20} />
    </div>
    <div className="stat-info">
      <h3>{value}</h3>
      <p>{title}</p>
      {trend && <span className={`trend ${trend.type}`}>{trend.value}</span>}
    </div>
  </motion.div>
);

const FilterChip = ({ label, onRemove }) => (
  <motion.span 
    className="filter-chip"
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.8, opacity: 0 }}
    layout
  >
    {label}
    <button onClick={onRemove} className="chip-remove">
      <FiX size={14} />
    </button>
  </motion.span>
);

const TableRowSkeleton = () => (
  <tr className="skeleton-row-modern">
    <td><div className="skeleton-box" style={{ width: '20px', height: '20px' }} /></td>
    <td><div className="skeleton-box" style={{ width: '60px', height: '16px' }} /></td>
    <td>
      <div className="skeleton-content">
        <div className="skeleton-box" style={{ width: '180px', height: '20px' }} />
        <div className="skeleton-box" style={{ width: '120px', height: '14px', marginTop: '6px' }} />
      </div>
    </td>
    <td><div className="skeleton-box" style={{ width: '100px', height: '16px' }} /></td>
    <td><div className="skeleton-box" style={{ width: '80px', height: '16px' }} /></td>
    <td><div className="skeleton-box" style={{ width: '100px', height: '24px', borderRadius: '12px' }} /></td>
    <td>
      <div className="skeleton-actions">
        <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
        <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
        <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
      </div>
    </td>
  </tr>
);

const Invoices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    paymentMode: '',
    dateRange: { start: '', end: '' }
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleteAlert, setDeleteAlert] = useState({ show: false, invoice: null });
  const [bulkDeleteAlert, setBulkDeleteAlert] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
    if (!user) return;

    const subscription = supabase
      .channel('public:invoices')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invoices',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchInvoices())
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [user]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`*, vendor:vendors(*)`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const paid = invoices.filter(inv => inv.status === 'paid').length;
    const pending = invoices.filter(inv => inv.status === 'pending').length;
    const overdue = invoices.filter(inv => inv.status === 'overdue').length;
    return { total, paid, pending, overdue };
  }, [invoices]);

  const getCleanId = (id) => {
    if (!id) return '';
    return typeof id === 'string' ? id.replace('#', '') : id.toString();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedInvoices(filteredInvoices.map(inv => inv.id).filter(Boolean));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelect = (invoiceId) => {
    if (!invoiceId) return;
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleViewInvoice = (invoiceId) => {
    if (!invoiceId) return;
    navigate(`/dashboard/invoice/${getCleanId(invoiceId)}`);
  };

  const handleEditInvoice = (invoice) => {
    if (!invoice?.id) return;
    setSelectedInvoice(invoice);
    setIsCreateModalOpen(true);
  };

  const handleDeleteInvoice = (invoice) => {
    if (!invoice?.id) return;
    setDeleteAlert({ show: true, invoice });
  };

  const confirmDelete = async () => {
    const invoice = deleteAlert.invoice;
    if (!invoice?.id) return;
    
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', invoice.id);
      if (error) throw error;
      setInvoices(prev => prev.filter(inv => inv.id !== invoice.id));
      toast.success('Invoice deleted successfully');
    } catch (error) {
      toast.error('Failed to delete invoice');
    } finally {
      setDeleteAlert({ show: false, invoice: null });
    }
  };

  const handleBulkDelete = () => setBulkDeleteAlert(true);
  
  const confirmBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', selectedInvoices);
      
      if (error) throw error;
      setInvoices(prev => prev.filter(inv => !selectedInvoices.includes(inv.id)));
      setSelectedInvoices([]);
      toast.success(`Deleted ${selectedInvoices.length} invoices`);
    } catch (error) {
      toast.error('Failed to delete invoices');
    } finally {
      setBulkDeleteAlert(false);
    }
  };

  const handleExport = () => {
    const data = invoices.filter(inv => selectedInvoices.includes(inv.id));
    if (data.length === 0) return;

    const excelData = data.map(inv => ({
      'Invoice ID': inv.id,
      'Title': inv.title,
      'Vendor': inv.vendor?.name,
      'Amount': inv.amount,
      'Date': inv.purchase_date,
      'Status': inv.status,
      'Category': inv.category
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.writeFile(wb, `invoices_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success('Export downloaded');
    setSelectedInvoices([]);
  };

  const resetFilters = () => {
    setFilters({ status: '', category: '', paymentMode: '', dateRange: { start: '', end: '' } });
    setSearchQuery('');
  };

  const removeFilter = (key) => {
    if (key === 'dateRange') {
      setFilters(prev => ({ ...prev, dateRange: { start: '', end: '' } }));
    } else {
      setFilters(prev => ({ ...prev, [key]: '' }));
    }
  };

  const calculateWarrantyDaysLeft = (purchaseDate, warrantyPeriod) => {
    if (!warrantyPeriod || warrantyPeriod === 'N/A') return null;
    let days = 0;
    const years = warrantyPeriod.match(/(\d+)\s*year/);
    const months = warrantyPeriod.match(/(\d+)\s*month/);
    
    if (years) days += parseInt(years[1]) * 365;
    if (months) days += parseInt(months[1]) * 30;
    if (days === 0) return null;

    const purchase = new Date(purchaseDate).getTime();
    const remaining = Math.ceil((purchase + (days * 86400000) - Date.now()) / 86400000);
    return remaining;
  };

  const getWarrantyColor = (days) => {
    if (days === null) return 'neutral';
    if (days <= 0) return 'expired';
    if (days <= 30) return 'critical';
    if (days <= 90) return 'warning';
    return 'good';
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = 
        inv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.id?.toString().includes(searchQuery);
      
      const matchesStatus = !filters.status || inv.status === filters.status;
      const matchesCategory = !filters.category || inv.category === filters.category;
      const matchesPayment = !filters.paymentMode || inv.payment_mode === filters.paymentMode;
      
      let matchesDate = true;
      if (filters.dateRange.start && filters.dateRange.end) {
        const d = new Date(inv.purchase_date);
        matchesDate = d >= new Date(filters.dateRange.start) && d <= new Date(filters.dateRange.end);
      }
      
      return matchesSearch && matchesStatus && matchesCategory && matchesPayment && matchesDate;
    });
  }, [invoices, searchQuery, filters]);

  const hasActiveFilters = filters.status || filters.category || filters.paymentMode || filters.dateRange.start;

  return (
    <div className="invoices-modern">
      <div className="page-header-modern">
        <div className="header-title-section">
          <h1>Invoices</h1>
          <p className="subtitle">Manage and track your financial documents</p>
        </div>
        
        <div className="header-actions-modern">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-modern"
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                <FiX size={16} />
              </button>
            )}
          </div>
          
          <button 
            className={`icon-btn ${filterOpen ? 'active' : ''}`}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <FiFilter size={20} />
            {hasActiveFilters && <span className="badge-dot" />}
          </button>
          
          <ThemeToggle theme={theme} setTheme={setTheme} />
          
          <div className="view-toggle">
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <FiList size={18} />
            </button>
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <FiGrid size={18} />
            </button>
          </div>
          
          <button 
            className="btn-primary-modern"
            onClick={() => {
              setSelectedInvoice(null);
              setIsCreateModalOpen(true);
            }}
          >
            <FiPlus size={18} />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard 
          title="Total Amount" 
          value={`$${stats.total.toLocaleString()}`} 
          trend={{ type: 'up', value: '+12%' }}
          icon={FiSearch}
          color="blue"
        />
        <StatCard 
          title="Paid Invoices" 
          value={stats.paid} 
          icon={FiSearch}
          color="green"
        />
        <StatCard 
          title="Pending" 
          value={stats.pending} 
          icon={FiSearch}
          color="orange"
        />
        <StatCard 
          title="Overdue" 
          value={stats.overdue} 
          icon={FiSearch}
          color="red"
        />
      </div>

      <AnimatePresence>
        {filterOpen && (
          <motion.div 
            className="filter-panel-modern"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="filter-grid">
              <div className="filter-field">
                <label>Status</label>
                <select 
                  value={filters.status} 
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              
              <div className="filter-field">
                <label>Category</label>
                <select 
                  value={filters.category} 
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">All Categories</option>
                  <option value="electronics">Electronics</option>
                  <option value="software">Software</option>
                  <option value="services">Services</option>
                </select>
              </div>
              
              <div className="filter-field">
                <label>Payment Mode</label>
                <select 
                  value={filters.paymentMode} 
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentMode: e.target.value }))}
                >
                  <option value="">All Methods</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              
              <div className="filter-field date-range">
                <label>Date Range</label>
                <div className="date-inputs">
                  <input 
                    type="date" 
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                  />
                  <span>to</span>
                  <input 
                    type="date" 
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>
            
            <div className="filter-footer">
              <button className="btn-text" onClick={resetFilters}>Reset all</button>
              <button className="btn-primary-sm" onClick={() => setFilterOpen(false)}>
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div 
            className="active-filters"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
          >
            {filters.status && (
              <FilterChip 
                label={`Status: ${filters.status}`} 
                onRemove={() => removeFilter('status')} 
              />
            )}
            {filters.category && (
              <FilterChip 
                label={`Category: ${filters.category}`} 
                onRemove={() => removeFilter('category')} 
              />
            )}
            {filters.paymentMode && (
              <FilterChip 
                label={`Payment: ${filters.paymentMode}`} 
                onRemove={() => removeFilter('paymentMode')} 
              />
            )}
            {(filters.dateRange.start || filters.dateRange.end) && (
              <FilterChip 
                label={`Date: ${filters.dateRange.start || '...'} to ${filters.dateRange.end || '...'}`} 
                onRemove={() => removeFilter('dateRange')} 
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedInvoices.length > 0 && (
          <motion.div 
            className="bulk-actions-modern"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
          >
            <div className="bulk-info">
              <span className="bulk-count">{selectedInvoices.length}</span>
              <span>selected</span>
            </div>
            <div className="bulk-buttons">
              <button className="btn-ghost" onClick={handleExport}>
                <FiDownload size={16} />
                Export
              </button>
              <button className="btn-ghost danger" onClick={handleBulkDelete}>
                <FiTrash2 size={16} />
                Delete
              </button>
              <button 
                className="btn-close-bulk" 
                onClick={() => setSelectedInvoices([])}
              >
                <FiX size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`content-container ${viewMode}`}>
        {viewMode === 'list' ? (
          <div className="table-wrapper-modern">
            <table className="invoices-table-modern">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <label className="custom-checkbox">
                      <input 
                        type="checkbox" 
                        checked={filteredInvoices.length > 0 && selectedInvoices.length === filteredInvoices.length}
                        onChange={handleSelectAll}
                      />
                      <span className="checkmark"></span>
                    </label>
                  </th>
                  <th>Invoice</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Warranty</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state-modern">
                      <div className="empty-illustration">
                        <FiSearch size={48} />
                      </div>
                      <h3>No invoices found</h3>
                      <p>Try adjusting your filters or create a new invoice</p>
                      <button 
                        className="btn-primary-modern"
                        onClick={() => setIsCreateModalOpen(true)}
                      >
                        Create Invoice
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const daysLeft = calculateWarrantyDaysLeft(invoice.purchase_date, invoice.warranty_period);
                    const warrantyStatus = getWarrantyColor(daysLeft);
                    
                    return (
                      <motion.tr 
                        key={invoice.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={selectedInvoices.includes(invoice.id) ? 'selected' : ''}
                        onClick={() => handleSelect(invoice.id)}
                      >
                        <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                          <label className="custom-checkbox">
                            <input 
                              type="checkbox" 
                              checked={selectedInvoices.includes(invoice.id)}
                              onChange={() => handleSelect(invoice.id)}
                            />
                            <span className="checkmark"></span>
                          </label>
                        </td>
                        <td className="invoice-info-cell">
                          <div className="invoice-title-row">
                            <span className="invoice-id">#{getCleanId(invoice.id).slice(0, 6)}</span>
                            <h4>{invoice.title}</h4>
                          </div>
                          <span className="invoice-meta">
                            {new Date(invoice.purchase_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                        </td>
                        <td>
                          <div className="vendor-cell">
                            <div className="vendor-avatar">
                              {invoice.vendor?.name?.[0] || '?'}
                            </div>
                            <span>{invoice.vendor?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="amount-cell">
                          <span className="currency">{invoice.currency || '$'}</span>
                          <span className="amount">{parseFloat(invoice.amount).toLocaleString()}</span>
                        </td>
                        <td>
                          <span className={`status-badge-modern ${invoice.status}`}>
                            <span className="status-dot"></span>
                            {invoice.status}
                          </span>
                        </td>
                        <td>
                          {daysLeft !== null ? (
                            <div className={`warranty-indicator ${warrantyStatus}`}>
                              <div className="warranty-bar">
                                <div 
                                  className="warranty-fill" 
                                  style={{ width: `${Math.max(0, Math.min(100, (daysLeft / 365) * 100))}%` }}
                                />
                              </div>
                              <span className="warranty-text">
                                {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="actions-col">
                          <div className="row-actions">
                            <button 
                              className="action-icon-btn"
                              onClick={(e) => { e.stopPropagation(); handleViewInvoice(invoice.id); }}
                              title="View"
                            >
                              <FiEye size={16} />
                            </button>
                            <button 
                              className="action-icon-btn"
                              onClick={(e) => { e.stopPropagation(); handleEditInvoice(invoice); }}
                              title="Edit"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button 
                              className="action-icon-btn danger"
                              onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice); }}
                              title="Delete"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid-view">
            {filteredInvoices.map((invoice) => {
              const daysLeft = calculateWarrantyDaysLeft(invoice.purchase_date, invoice.warranty_period);
              return (
                <motion.div 
                  key={invoice.id}
                  className={`invoice-card ${selectedInvoices.includes(invoice.id) ? 'selected' : ''}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  onClick={() => handleSelect(invoice.id)}
                >
                  <div className="card-header">
                    <label className="custom-checkbox" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => handleSelect(invoice.id)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <span className={`status-badge-modern ${invoice.status}`}>
                      {invoice.status}
                    </span>
                  </div>
                  
                  <div className="card-content">
                    <h3>{invoice.title}</h3>
                    <div className="card-amount">
                      {invoice.currency || '$'}{parseFloat(invoice.amount).toLocaleString()}
                    </div>
                    <div className="card-meta">
                      <span>#{getCleanId(invoice.id).slice(0, 6)}</span>
                      <span>•</span>
                      <span>{new Date(invoice.purchase_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="card-footer">
                    <div className="vendor-mini">
                      <div className="vendor-avatar-sm">{invoice.vendor?.name?.[0] || '?'}</div>
                      <span>{invoice.vendor?.name || 'Unknown'}</span>
                    </div>
                    {daysLeft !== null && (
                      <span className={`warranty-pill ${getWarrantyColor(daysLeft)}`}>
                        {daysLeft > 0 ? `${daysLeft}d` : 'Exp'}
                      </span>
                    )}
                  </div>
                  
                  <div className="card-actions">
                    <button onClick={(e) => { e.stopPropagation(); handleViewInvoice(invoice.id); }}>
                      <FiEye />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleEditInvoice(invoice); }}>
                      <FiEdit2 />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialData={selectedInvoice}
        onSuccess={fetchInvoices}
      />

      {deleteAlert.show && (
        <div className="modal-overlay" onClick={() => setDeleteAlert({ show: false, invoice: null })}>
          <motion.div 
            className="alert-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="alert-icon danger">
              <FiTrash2 size={24} />
            </div>
            <h3>Delete Invoice?</h3>
            <p>Are you sure you want to delete <strong>"{deleteAlert.invoice?.title}"</strong>?</p>
            <div className="alert-actions">
              <button className="btn-secondary" onClick={() => setDeleteAlert({ show: false, invoice: null })}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {bulkDeleteAlert && (
        <div className="modal-overlay" onClick={() => setBulkDeleteAlert(false)}>
          <motion.div 
            className="alert-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="alert-icon danger">
              <FiTrash2 size={24} />
            </div>
            <h3>Delete {selectedInvoices.length} Invoices?</h3>
            <p>This action cannot be undone.</p>
            <div className="alert-actions">
              <button className="btn-secondary" onClick={() => setBulkDeleteAlert(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmBulkDelete}>
                Delete All
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Invoices;