import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiDownload, FiTrash2, FiEdit2, FiEye } from 'react-icons/fi';
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
  const { addNotification } = useNotifications();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [deleteAlert, setDeleteAlert] = useState({ show: false, invoice: null });
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});

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
        <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
        <p className="text-gray-600">Here's what's happening with your invoices today.</p>
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

      {/* No Invoices Message */}
      {recentInvoices.length === 0 && (
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