import React, { useState, useRef, useEffect } from 'react';
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

const Overview = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentInvoices, setRecentInvoices] = useState([
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
      purchaseDate: '2023-11-01',
      paymentMode: 'credit_card',
      status: 'paid',
      category: 'electronics',
      warrantyPeriod: '6 months'
    }
  ]);

  const stats = [
    {
      title: 'Total Invoices',
      value: '3',
      icon: <RiFileListLine size={24} />,
      color: 'blue'
    },
    {
      title: 'Pending',
      value: '1',
      icon: <RiMoneyDollarCircleLine size={24} />,
      color: 'yellow'
    },
    {
      title: 'Paid',
      value: '2',
      icon: <HiOutlineDocumentReport size={24} />,
      color: 'green'
    },
    {
      title: 'Emi',
      value: '0',
      icon: <RiUserLine size={24} />,
      color: 'red'
    }
  ];

  const [deleteAlert, setDeleteAlert] = useState({ show: false, invoice: null });
  const invoiceRef = useRef(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            vendor:vendors(*)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        // Add the '#' prefix to the IDs for display
        const formattedInvoices = data.map(invoice => ({
          ...invoice,
          id: `#${invoice.id}`
        }));

        setRecentInvoices(formattedInvoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast.error('Failed to load invoices', {
          icon: '❌',
          duration: 4000
        });
      }
    };

    fetchInvoices();
  }, []);

  const handleViewInvoice = (invoiceId) => {
    navigate(`/dashboard/invoice/${invoiceId.replace('#', '')}`);
  };

  const handleEditInvoice = async (invoice) => {
    try {
      // Fetch complete invoice details from Supabase
      const { data: fullInvoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          vendor:vendors(*)
        `)
        .eq('id', invoice.id)
        .single();

      if (error) throw error;

      // Set the complete invoice data for editing
      setSelectedInvoice(fullInvoice);
      setIsCreateModalOpen(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      addNotification({
        type: 'error',
        message: 'Failed to load invoice details',
        icon: <FiEdit2 size={16} />
      });
    }
  };

  const handleDeleteInvoice = async (invoice) => {
    try {
      // Remove the '#' from the invoice ID
      const cleanId = invoice.id.replace('#', '');
      
      // First check if the invoice exists
      const { data: existingInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select()
        .eq('id', cleanId)
        .single();

      if (fetchError) {
        // If invoice doesn't exist in database, just remove it from local state
        if (fetchError.code === 'PGRST116') {
          setDeleteAlert({ show: true, invoice });
          return;
        }
        throw fetchError;
      }

      if (existingInvoice) {
        setDeleteAlert({ show: true, invoice });
        toast.loading('Preparing to delete invoice...', {
          id: 'deleteLoading'
        });
      } else {
        throw new Error('Invoice not found');
      }
    } catch (error) {
      console.error('Error preparing to delete invoice:', error);
      toast.error('Failed to prepare invoice deletion. Please try again.', {
        icon: '❌',
        duration: 4000
      });
    }
  };

  const confirmDelete = async () => {
    try {
      const invoice = deleteAlert.invoice;
      const cleanId = invoice.id.replace('#', '');
      
      toast.loading('Deleting invoice...', {
        id: 'deleteProgress'
      });
      
      // Delete from Supabase
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', cleanId);

      if (error) throw error;

      // Update local state
      const updatedInvoices = recentInvoices.filter(inv => inv.id !== invoice.id);
      setRecentInvoices(updatedInvoices);
      
      toast.success(`Invoice ${invoice.id} deleted successfully! 🗑️`, {
        duration: 4000,
        icon: '✅'
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice. Please try again.', {
        duration: 4000,
        icon: '❌'
      });
    } finally {
      setDeleteAlert({ show: false, invoice: null });
      // Dismiss loading toasts
      toast.dismiss('deleteLoading');
      toast.dismiss('deleteProgress');
    }
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      navigate(`/dashboard/invoice/${invoice.id.replace('#', '')}?download=true`);
    } catch (error) {
      console.error('Error navigating to invoice:', error);
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
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-title">{stat.title}</p>
            </div>
          </div>
        ))}
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

      {/* Recent Invoices */}
      <div className="recent-invoices">
        <h2 className="section-title mb-3">Recent Invoices</h2>
        <div className="invoice-table-container">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="invoice-title">
                    <div className="vendor-avatar">{invoice.vendor.shortName}</div>
                    <div className="invoice-details">
                      <span className="invoice-id">{invoice.id}</span>
                      <span className="invoice-name">{invoice.title}</span>
                    </div>
                  </td>
                  <td>{invoice.vendor.name}</td>
                  <td>{invoice.amount}</td>
                  <td>
                    <span className={`status-badge ${invoice.status}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>{new Date(invoice.purchaseDate).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="action-icon-btn view"
                        onClick={() => handleViewInvoice(invoice.id)}
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        className="action-icon-btn edit"
                        onClick={() => handleEditInvoice(invoice)}
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        className="action-icon-btn download"
                        onClick={() => handleDownloadInvoice(invoice)}
                      >
                        <FiDownload size={16} />
                      </button>
                      <button
                        className="action-icon-btn delete"
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

      {/* Create/Edit Invoice Modal */}
      {isCreateModalOpen && (
        <CreateInvoiceModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
        />
      )}

      {/* Delete Confirmation Alert */}
      <CustomAlert
        show={deleteAlert.show}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${deleteAlert.invoice?.id}?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlert({ show: false, invoice: null })}
      />
    </div>
  );
};

export default Overview; 