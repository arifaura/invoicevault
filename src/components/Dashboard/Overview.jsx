import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiPlus,
  FiDownload,
  FiTrash2,
  FiEdit2,
  FiEye,
  FiTrendingUp,
  FiPieChart,
  FiShield
} from 'react-icons/fi';
import { RiFileListLine, RiUserLine, RiMoneyDollarCircleLine } from 'react-icons/ri';
import { HiOutlineDocumentReport } from 'react-icons/hi';
import CreateInvoiceModal from './CreateInvoiceModal';
import { useNotifications } from '../../context/NotificationContext';
import './Overview.css';
import { generatePDF } from '../../utils/pdfGenerator';
import CustomAlert from '../Common/CustomAlert';
import InvoiceContent from '../Invoice/InvoiceContent';
import ReactDOM from 'react-dom/client';
import { supabase } from '../../utils/supabaseClient';
import toast from 'react-hot-toast';
import ImagePreviewModal from '../Common/ImagePreviewModal';
import Skeleton from '../Common/Skeleton';
import PDFThumbnail from '../Common/PDFThumbnail';
import AnimatedCounter from '../Common/AnimatedCounter';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';

const StatCardSkeleton = () => (
  <div className="stat-card skeleton-card">
    <div className="stat-icon">
      <Skeleton width="24px" height="24px" />
    </div>
    <div className="stat-info">
      <Skeleton width="60px" height="24px" className="mb-2" />
      <Skeleton width="100px" height="16px" />
    </div>
  </div>
);

const InvoiceCardSkeleton = () => (
  <div className="invoice-card skeleton-card">
    <div className="invoice-card-header">
      <Skeleton width="150px" height="24px" />
      <Skeleton width="100px" height="24px" />
    </div>
    <div className="invoice-card-content">
      <Skeleton width="200px" height="20px" className="mb-2" />
      <Skeleton width="150px" height="16px" />
    </div>
    <div className="invoice-card-footer">
      <Skeleton width="120px" height="32px" />
    </div>
  </div>
);

const TableRowSkeleton = () => (
  <tr className="skeleton-row">
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
      <div className="image-wrapper">
        <Skeleton width="48px" height="48px" />
      </div>
    </td>
    <td>
      <Skeleton width="100px" height="24px" />
    </td>
    <td>
      <Skeleton width="120px" height="32px" className="status-skeleton" />
    </td>
    <td>
      <Skeleton width="120px" height="24px" />
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

const Overview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { addNotification } = useNotifications();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [deleteAlert, setDeleteAlert] = useState({ show: false, invoice: null });
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});
  const [spendCurrency, setSpendCurrency] = useState('');
  const fallbackAvatar = useMemo(() => {
    const avatars = [
      { face: '🦊', color: 'coral' },
      { face: '🐼', color: 'mint' },
      { face: '🐨', color: 'blue' },
      { face: '🐯', color: 'gold' },
      { face: '🐸', color: 'lime' },
      { face: '🐙', color: 'pink' },
    ];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }, []);
  const userName = useMemo(() => {
    const profileName = profile?.full_name ||
      `${profile?.firstName || profile?.first_name || ''} ${profile?.lastName || profile?.last_name || ''}`.trim();
    const metadataName = user?.user_metadata?.full_name || user?.user_metadata?.name;
    return profileName || metadataName || user?.email?.split('@')[0] || 'there';
  }, [profile, user]);
  const avatarUrl = profile?.avatar_url || profile?.avatar ||
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const dashboardInsights = useMemo(() => {
    const currencies = [...new Set(
      recentInvoices
        .map(invoice => invoice.currency || 'INR')
        .filter(currency => typeof currency === 'string' && currency.trim())
        .map(currency => currency.trim().toUpperCase())
    )].sort();
    const currency = currencies.includes(spendCurrency)
      ? spendCurrency
      : currencies[0] || 'INR';
    const today = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
      return {
        key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
        label: monthDate.toLocaleDateString(undefined, { month: 'short' }),
        total: 0
      };
    });
    const monthTotals = new Map(months.map(month => [month.key, month]));
    const categoryTotals = new Map();
    const reminders = [];
    const statusCounts = new Map([
      ['Paid', 0],
      ['Pending', 0],
      ['EMI', 0],
      ['Other', 0]
    ]);

    recentInvoices.forEach(invoice => {
      const invoiceCurrency = String(invoice.currency || 'INR').trim().toUpperCase();
      const amount = Number(invoice.amount);
      const category = String(invoice.category || '').trim() || 'Uncategorized';
      const normalizedStatus = String(invoice.status || 'paid').trim().toLowerCase();
      const statusLabel = normalizedStatus === 'paid'
        ? 'Paid'
        : normalizedStatus === 'pending'
          ? 'Pending'
          : normalizedStatus === 'emi'
            ? 'EMI'
            : 'Other';
      statusCounts.set(statusLabel, statusCounts.get(statusLabel) + 1);

      if (invoiceCurrency === currency && Number.isFinite(amount)) {
        const purchaseDate = /^(\d{4})-(\d{2})/.exec(invoice.purchase_date || '');
        const monthKey = purchaseDate
          ? `${purchaseDate[1]}-${purchaseDate[2]}`
          : (() => {
              const parsedDate = new Date(invoice.purchase_date);
              return Number.isNaN(parsedDate.getTime())
                ? ''
                : `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`;
            })();
        const month = monthTotals.get(monthKey);
        if (month) month.total += amount;
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
      }

      const warrantyPeriod = String(invoice.warranty_period || '');
      const years = Number(warrantyPeriod.match(/(\d+)\s*year/i)?.[1] || 0);
      const warrantyMonths = Number(warrantyPeriod.match(/(\d+)\s*month/i)?.[1] || 0);
      if (!invoice.purchase_date || (!years && !warrantyMonths)) return;

      const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(invoice.purchase_date);
      const purchase = dateOnly
        ? new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])))
        : new Date(invoice.purchase_date);
      if (Number.isNaN(purchase.getTime())) return;

      const expiration = new Date(purchase.getTime());
      const purchaseDay = expiration.getUTCDate();
      expiration.setUTCDate(1);
      expiration.setUTCFullYear(expiration.getUTCFullYear() + years);
      expiration.setUTCMonth(expiration.getUTCMonth() + warrantyMonths);
      const lastDayOfMonth = new Date(Date.UTC(
        expiration.getUTCFullYear(),
        expiration.getUTCMonth() + 1,
        0
      )).getUTCDate();
      expiration.setUTCDate(Math.min(purchaseDay, lastDayOfMonth));

      const now = new Date();
      const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const daysRemaining = Math.ceil((expiration.getTime() - todayUtc) / 86400000);
      if (daysRemaining >= -30 && daysRemaining <= 60) {
        reminders.push({ ...invoice, daysRemaining, expiration });
      }
    });

    const categories = [...categoryTotals.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    const maxCategoryTotal = Math.max(...categories.map(category => category.total), 0);
    const statusBreakdown = [...statusCounts.entries()]
      .map(([name, count]) => ({
        name,
        count,
        percentage: recentInvoices.length ? (count / recentInvoices.length) * 100 : 0,
        color: {
          Paid: '#159c7a',
          Pending: '#e89a22',
          EMI: '#5478f5',
          Other: '#94a3b8'
        }[name]
      }))
      .filter(status => status.count > 0);
    let statusChartPosition = 0;
    const statusChartBackground = statusBreakdown.length
      ? `conic-gradient(${statusBreakdown.map((status) => {
          const start = statusChartPosition;
          statusChartPosition += status.percentage;
          return `${status.color} ${start}% ${statusChartPosition}%`;
        }).join(', ')})`
      : 'var(--bg-secondary)';

    return {
      currency,
      currencies,
      months,
      statusBreakdown,
      statusChartBackground,
      categories: categories.map(category => ({
        ...category,
        percentage: maxCategoryTotal > 0 ? (category.total / maxCategoryTotal) * 100 : 0
      })),
      maxMonthlyTotal: Math.max(...months.map(month => month.total), 0),
      reminders: reminders.sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 5)
    };
  }, [recentInvoices, spendCurrency]);

  const formatInsightAmount = (amount, currency) =>
    `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  // Calculate stats from invoices data
  const stats = useMemo(() => {
    // console.log('Calculating stats from invoices:', recentInvoices);
    const totalInvoices = recentInvoices.length;
    
    // Helper function to normalize status
    const normalizeStatus = (status) => {
      if (!status) return 'paid';
      return status.toLowerCase().trim();
    };

    const pendingInvoices = recentInvoices.filter(invoice => 
      normalizeStatus(invoice.status) === 'pending'
    ).length;

    const paidInvoices = recentInvoices.filter(invoice => 
      normalizeStatus(invoice.status) === 'paid'
    ).length;

    const emiInvoices = recentInvoices.filter(invoice => 
      normalizeStatus(invoice.status) === 'emi'
    ).length;

    return [
      {
        title: 'Total Invoices',
        value: totalInvoices,
        icon: <RiFileListLine size={24} />,
        color: 'blue'
      },
      {
        title: 'Pending',
        value: pendingInvoices,
        icon: <RiMoneyDollarCircleLine size={24} />,
        color: 'yellow'
      },
      {
        title: 'Paid',
        value: paidInvoices,
        icon: <HiOutlineDocumentReport size={24} />,
        color: 'green'
      },
      {
        title: 'Emi',
        value: emiInvoices,
        icon: <RiUserLine size={24} />,
        color: 'red'
      }
    ];
  }, [recentInvoices]);

  const invoiceRef = useRef(null);

  useEffect(() => {
    fetchInvoices();

    // Add event listener for invoice refresh
    const handleRefresh = () => {
      fetchInvoices();
    };
    window.addEventListener('refresh-invoices', handleRefresh);

    // Cleanup
    return () => {
      window.removeEventListener('refresh-invoices', handleRefresh);
    };
  }, []);

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
      setRecentInvoices(data);
    } catch (error) {
      // console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoiceId) => {
    navigate(`/dashboard/invoice/${invoiceId.replace('#', '')}`);
  };

  const handleEditInvoice = async (invoice) => {
    try {
      // Fetch complete invoice details including vendor
      const { data: fullInvoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          vendor:vendors(*)
        `)
        .eq('id', invoice.id)
        .single();

      if (error) throw error;

      // Get the public URL for the image
      const imageUrl = fullInvoice.image_url ? 
        supabase.storage
          .from('invoice-images')
          .getPublicUrl(fullInvoice.image_url).data.publicUrl : null;

      // Prepare the data for the form
      const formData = {
        title: fullInvoice.title || '',
        vendor_name: fullInvoice.vendor?.name || '',
        amount: fullInvoice.amount || '',
        currency: fullInvoice.currency || 'INR',
        purchase_date: fullInvoice.purchase_date || '',
        payment_mode: fullInvoice.payment_mode || '',
        status: fullInvoice.status || '',
        category: fullInvoice.category || '',
        warranty_period: fullInvoice.warranty_period || '',
        notes: fullInvoice.notes || '',
        image_url: imageUrl
      };

      // Set the selected invoice with the form data
      setSelectedInvoice({ 
        ...fullInvoice, 
        formData,
        image_url: imageUrl // Add the public URL to the invoice object
      });
      setIsCreateModalOpen(true);
    } catch (error) {
      // console.error('Error fetching invoice details:', error);
      toast.error('Failed to load invoice details', {
        duration: 4000
      });
    }
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
    
    try {
      toast.loading('Deleting invoice...', { id: 'deleteInvoice' });
      
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (error) throw error;

      // Update local state
      setRecentInvoices(prev => prev.filter(inv => inv.id !== invoice.id));
      
      toast.success('Invoice deleted successfully!', { id: 'deleteInvoice' });
      
      // Refresh the invoices list
      await fetchInvoices();
    } catch (error) {
      // console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice', { id: 'deleteInvoice' });
    } finally {
      setDeleteAlert({ show: false, invoice: null });
    }
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      navigate(`/dashboard/invoice/${invoice.id.replace('#', '')}?download=true`);
    } catch (error) {
      // console.error('Error navigating to invoice:', error);
      addNotification({
        type: 'error',
        message: `Failed to download invoice ${invoice.id}`,
        icon: <FiDownload size={16} />
      });
    }
  };

  return (
    <div className="overview-container p-4">
      {/* Welcome Section */}
      <div className="welcome-section mb-4">
        <div className="welcome-copy">
          <span className="welcome-eyebrow">YOUR FINANCIAL OVERVIEW</span>
          <h1 className="text-2xl font-bold mb-2">Welcome back, {userName}!</h1>
          <p>Here's what's happening with your invoices today.</p>
        </div>
        <div className="welcome-user">
          <div className="welcome-avatar-frame">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${userName}'s avatar`} className="welcome-avatar-image" />
            ) : (
              <span className={`welcome-avatar-fallback ${fallbackAvatar.color}`} aria-hidden="true">
                {fallbackAvatar.face}
              </span>
            )}
          </div>
          <div className="overview-live-pill">
            <span className="live-indicator" />
            Overview
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid mb-6">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          stats.map((stat, index) => (
            <div key={index} className={`stat-card ${stat.color}`}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-info">
                <h3 className="stat-value">
                  <AnimatedCounter end={stat.value} duration={2000} />
                </h3>
                <p className="stat-title">{stat.title}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && (
        <section className="dashboard-insights" aria-label="Spending and warranty insights">
          <div className="insight-card">
            <div className="insight-header">
              <div className="insight-title">
                <span className="insight-icon spending"><FiTrendingUp /></span>
                <div>
                  <h2>Spending trend</h2>
                  <p>Monthly totals for the last 6 months</p>
                </div>
              </div>
              {dashboardInsights.currencies.length > 0 && (
                <label className="insight-currency">
                  <span className="sr-only">Spending currency</span>
                  <select
                    value={dashboardInsights.currency}
                    onChange={(event) => setSpendCurrency(event.target.value)}
                    aria-label="Spending currency"
                  >
                    {dashboardInsights.currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {dashboardInsights.months.some(month => month.total > 0) ? (
              <>
                <div className="insight-chart-summary">
                  <span>6-month total</span>
                  <strong>
                    {formatInsightAmount(
                      dashboardInsights.months.reduce((total, month) => total + month.total, 0),
                      dashboardInsights.currency
                    )}
                  </strong>
                </div>
                <div className="spending-chart">
                  {dashboardInsights.months.map(month => {
                    const height = dashboardInsights.maxMonthlyTotal > 0
                      ? Math.max((month.total / dashboardInsights.maxMonthlyTotal) * 100, month.total > 0 ? 5 : 0)
                      : 0;
                    return (
                      <div className="spending-month" key={month.key}>
                        <span className="spending-month-value">
                          {month.total > 0 ? month.total.toLocaleString(undefined, { maximumFractionDigits: 0 }) : ''}
                        </span>
                        <div className="spending-bar-track">
                          <div
                            className="spending-bar"
                            style={{ height: `${height}%` }}
                            title={`${month.label}: ${formatInsightAmount(month.total, dashboardInsights.currency)}`}
                          />
                        </div>
                        <span className="spending-month-label">{month.label}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="insight-empty">No spending recorded in the last 6 months.</p>
            )}
          </div>

          <div className="insight-card">
            <div className="insight-header">
              <div className="insight-title">
                <span className="insight-icon categories"><FiPieChart /></span>
                <div>
                  <h2>Spending by category</h2>
                  <p>Top categories in {dashboardInsights.currency}</p>
                </div>
              </div>
            </div>
            {dashboardInsights.categories.length > 0 ? (
              <div className="category-breakdown">
                {dashboardInsights.categories.map(category => (
                  <div className="category-row" key={category.name}>
                    <div className="category-label">
                      <span>{category.name}</span>
                      <strong>{formatInsightAmount(category.total, dashboardInsights.currency)}</strong>
                    </div>
                    <div className="category-bar-track">
                      <div
                        className="category-bar"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="insight-empty">Add invoices to see your spending categories.</p>
            )}
          </div>

          <div className="insight-card">
            <div className="insight-header">
              <div className="insight-title">
                <span className="insight-icon invoice-status"><FiPieChart /></span>
                <div>
                  <h2>Invoice status</h2>
                  <p>Your invoices by payment status</p>
                </div>
              </div>
            </div>
            {dashboardInsights.statusBreakdown.length > 0 ? (
              <div className="status-chart-content">
                <div
                  className="status-chart-donut"
                  style={{ background: dashboardInsights.statusChartBackground }}
                  role="img"
                  aria-label={dashboardInsights.statusBreakdown
                    .map(status => `${status.name}: ${status.count}`)
                    .join(', ')}
                >
                  <div className="status-chart-center">
                    <strong>{recentInvoices.length}</strong>
                    <span>Invoices</span>
                  </div>
                </div>
                <ul className="status-chart-legend">
                  {dashboardInsights.statusBreakdown.map((status) => (
                    <li key={status.name}>
                      <span
                        className="status-legend-dot"
                        style={{ backgroundColor: status.color }}
                      />
                      <span>{status.name}</span>
                      <strong>{status.count}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="insight-empty">Add invoices to see your payment status breakdown.</p>
            )}
          </div>

          <div className="insight-card">
            <div className="insight-header">
              <div className="insight-title">
                <span className="insight-icon warranties"><FiShield /></span>
                <div>
                  <h2>Warranty reminders</h2>
                  <p>Expired recently or expiring in the next 60 days</p>
                </div>
              </div>
            </div>
            {dashboardInsights.reminders.length > 0 ? (
              <ul className="warranty-reminder-list">
                {dashboardInsights.reminders.map(invoice => (
                  <li key={invoice.id}>
                    <button
                      type="button"
                      className="warranty-reminder"
                      onClick={() => handleViewInvoice(invoice.id)}
                    >
                      <span className="warranty-reminder-copy">
                        <strong>{invoice.title || 'Untitled invoice'}</strong>
                        <span>{invoice.vendor?.name || invoice.vendor_name || 'Unknown vendor'}</span>
                      </span>
                      <span className={`warranty-reminder-status${invoice.daysRemaining < 0 ? ' expired' : ''}`}>
                        {invoice.daysRemaining < 0
                          ? 'Expired'
                          : invoice.daysRemaining === 0
                            ? 'Expires today'
                            : `In ${invoice.daysRemaining} day${invoice.daysRemaining === 1 ? '' : 's'}`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="insight-empty">No warranties expiring soon.</p>
            )}
          </div>
        </section>
      )}

      {/* Actions Bar */}
      <div className="actions-bar mb-4">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button
          className="create-invoice-btn"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <FiPlus size={20} />
          <span className='text-white'>New Invoice</span>
        </button>
      </div>

      {/* Recent Invoices Section */}
      {loading ? (
        <div className="recent-invoices-section">
          <div className="section-header">
            <h2>Recent Invoices</h2>
            <button className="view-all-btn" disabled>
              View All
            </button>
          </div>
          <div className="table-container">
            <table className="recent-invoices-table">
              <thead>
                <tr>
                  <th>S.NO</th>
                  <th>TITLE</th>
                  <th>VENDOR</th>
                  <th>IMAGE</th>
                  <th>AMOUNT</th>
                  <th>WARRANTY</th>
                  <th>DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </tbody>
            </table>
          </div>
        </div>
      ) : recentInvoices.length === 0 ? (
        <div className="no-invoices-container">
          <div className="empty-state">
            <RiFileListLine size={64} className="empty-icon" />
            <h3>No Invoices Yet</h3>
            <p>Start by creating your first invoice to track your expenses.</p>
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
        <div className="recent-invoices-section">
          <div className="section-header">
            <h2>Recent Invoices</h2>
            <button
              onClick={() => navigate('/dashboard/invoices')}
              className="view-all-btn"
            >
              View All
            </button>
          </div>
          <div className="table-container">
            <table className="recent-invoices-table">
              <thead>
                <tr>
                  <th>S.NO</th>
                  <th>TITLE</th>
                  <th>VENDOR</th>
                  <th>IMAGE</th>
                  <th>AMOUNT</th>
                  <th>WARRANTY</th>
                  <th>DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice, index) => (
                  <tr key={invoice?.id}>
                    <td className="serial-number">{index + 1}</td>
                    <td className="invoice-title">
                      <div className="text-truncate">{invoice?.title || 'N/A'}</div>
                    </td>
                    <td className="vendor-name">
                      <div className="text-truncate">{invoice?.vendor?.name || 'N/A'}</div>
                    </td>
                    <td className="invoice-image">
                      {invoice?.image_url ? (
                        <div 
                          className="image-wrapper"
                          onClick={() => {
                            const fileUrl = supabase.storage
                              .from('invoice-images')
                              .getPublicUrl(invoice.image_url).data.publicUrl;
                            setPreviewImage(fileUrl);
                          }}
                          role="button"
                          tabIndex={0}
                          title="Click to view full size"
                        >
                          {imageErrors[invoice.id] ? (
                            <div className="no-image">
                              <RiFileListLine size={20} />
                            </div>
                          ) : invoice.image_url.toLowerCase().endsWith('.pdf') ? (
                            <PDFThumbnail 
                              url={supabase.storage
                                .from('invoice-images')
                                .getPublicUrl(invoice.image_url).data.publicUrl}
                              width={48}
                              height={48}
                            />
                          ) : (
                            <img 
                              src={supabase.storage
                                .from('invoice-images')
                                .getPublicUrl(invoice.image_url).data.publicUrl}
                              alt={invoice.title} 
                              className="invoice-thumbnail"
                              loading="lazy"
                              onError={(e) => {
                                // console.error('Image load error:', invoice.image_url);
                                setImageErrors(prev => ({
                                  ...prev,
                                  [invoice.id]: true
                                }));
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="no-image">
                          <RiFileListLine size={20} />
                        </div>
                      )}
                    </td>
                    <td className="amount">₹{invoice?.amount || '0'}</td>
                    <td className="warranty">
                      {invoice?.warranty_period ? (
                        <span className="warranty-badge">
                          {invoice.warranty_period}
                        </span>
                      ) : (
                        <span className="warranty-badge na">N/A</span>
                      )}
                    </td>
                    <td>{invoice?.purchase_date ? new Date(invoice.purchase_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A'}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="action-icon-btn view" 
                          title="View Invoice"
                          onClick={() => handleViewInvoice(invoice?.id)}
                        >
                          <FiEye size={16} />
                        </button>
                        <button 
                          className="action-icon-btn edit" 
                          title="Edit Invoice"
                          onClick={() => handleEditInvoice(invoice)}
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button 
                          className="action-icon-btn download" 
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
        isOpen={deleteAlert.show}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${deleteAlert.invoice?.title}"?`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteAlert({ show: false, invoice: null })}
      />

      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};

export default Overview; 