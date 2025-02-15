import React, { useState } from 'react';
import { FiUser, FiLock, FiBell, FiDollarSign, FiGrid, FiSave } from 'react-icons/fi';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+91 98765 43210',
      avatar: null
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    notifications: {
      invoiceCreated: true,
      invoicePaid: true,
      invoiceOverdue: true,
      warrantyExpiring: true,
      dailyDigest: false
    },
    preferences: {
      currency: 'INR',
      dateFormat: 'DD/MM/YYYY',
      timeZone: 'Asia/Kolkata',
      language: 'en'
    },
    invoiceDefaults: {
      defaultPaymentTerms: 'net_30',
      defaultCategory: 'general',
      defaultWarrantyPeriod: '1_year',
      autoGenerateInvoiceNumber: true,
      invoiceNumberPrefix: 'INV'
    }
  });

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('profile', 'avatar', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = (section) => {
    // Here you would typically make an API call to save the settings
    console.log(`Saving ${section} settings:`, settings[section]);
    // Show success message
    alert(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = settings.security;
    
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }

    // Here you would typically make an API call to change the password
    console.log('Changing password:', { currentPassword, newPassword });
    alert('Password changed successfully!');

    // Clear password fields
    handleInputChange('security', 'currentPassword', '');
    handleInputChange('security', 'newPassword', '');
    handleInputChange('security', 'confirmPassword', '');
  };

  return (
    <div className="settings-container">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="text-secondary">Manage your account and preferences</p>
      </div>
      
      <div className="settings-content">
        <div className="settings-sidebar">
          <button 
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser size={20} />
            Profile
          </button>
          <button 
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FiLock size={20} />
            Security
          </button>
          <button 
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FiBell size={20} />
            Notifications
          </button>
          <button 
            className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <FiGrid size={20} />
            Preferences
          </button>
          <button 
            className={`settings-tab ${activeTab === 'invoiceDefaults' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoiceDefaults')}
          >
            <FiDollarSign size={20} />
            Invoice Defaults
          </button>
        </div>

        <div className="settings-panel">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Profile Settings</h2>
              <div className="avatar-section">
                <div className="avatar-preview">
                  {settings.profile.avatar ? (
                    <img src={settings.profile.avatar} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {settings.profile.firstName.charAt(0)}
                      {settings.profile.lastName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="avatar-upload">
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    hidden
                  />
                  <label htmlFor="avatar" className="btn btn-secondary">
                    Change Photo
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={settings.profile.firstName}
                    onChange={(e) => handleInputChange('profile', 'firstName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={settings.profile.lastName}
                    onChange={(e) => handleInputChange('profile', 'lastName', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={settings.profile.phone}
                    onChange={(e) => handleInputChange('profile', 'phone', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Security Settings</h2>
              
              {/* Password Change Form */}
              <div className="password-change-section">
                <h3>Change Password</h3>
                <form onSubmit={handlePasswordChange}>
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={settings.security.currentPassword}
                      onChange={(e) => handleInputChange('security', 'currentPassword', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={settings.security.newPassword}
                      onChange={(e) => handleInputChange('security', 'newPassword', e.target.value)}
                      required
                    />
                    <div className="password-requirements mt-2">
                      <p className="text-muted small mb-1">Password must have:</p>
                      <ul className="list-unstyled small">
                        <li className={`${settings.security.newPassword.length >= 8 ? 'valid' : 'invalid'}`}>
                          <i className={`bi bi-${settings.security.newPassword.length >= 8 ? 'check' : 'x'}-circle-fill me-2`}></i>
                          At least 8 characters
                        </li>
                        <li className={`${/\d/.test(settings.security.newPassword) ? 'valid' : 'invalid'}`}>
                          <i className={`bi bi-${/\d/.test(settings.security.newPassword) ? 'check' : 'x'}-circle-fill me-2`}></i>
                          Include numbers
                        </li>
                        <li className={`${/[!@#$%^&*]/.test(settings.security.newPassword) ? 'valid' : 'invalid'}`}>
                          <i className={`bi bi-${/[!@#$%^&*]/.test(settings.security.newPassword) ? 'check' : 'x'}-circle-fill me-2`}></i>
                          Include special characters
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={settings.security.confirmPassword}
                      onChange={(e) => handleInputChange('security', 'confirmPassword', e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Change Password
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              {Object.entries(settings.notifications).map(([key, value]) => (
                <div className="setting-item" key={key}>
                  <div className="setting-info">
                    <h3>{key.split(/(?=[A-Z])/).join(' ')}</h3>
                    <p>Receive notifications when {key.split(/(?=[A-Z])/).join(' ').toLowerCase()}</p>
                  </div>
                  <div className="setting-action">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleInputChange('notifications', key, e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="settings-section">
              <h2>General Preferences</h2>
              <div className="form-group">
                <label>Default Currency</label>
                <select
                  value={settings.preferences.currency}
                  onChange={(e) => handleInputChange('preferences', 'currency', e.target.value)}
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date Format</label>
                <select
                  value={settings.preferences.dateFormat}
                  onChange={(e) => handleInputChange('preferences', 'dateFormat', e.target.value)}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="form-group">
                <label>Time Zone</label>
                <select
                  value={settings.preferences.timeZone}
                  onChange={(e) => handleInputChange('preferences', 'timeZone', e.target.value)}
                >
                  <option value="Asia/Kolkata">India (GMT+5:30)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="Europe/London">London</option>
                </select>
              </div>

              <div className="form-group">
                <label>Language</label>
                <select
                  value={settings.preferences.language}
                  onChange={(e) => handleInputChange('preferences', 'language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'invoiceDefaults' && (
            <div className="settings-section">
              <h2>Invoice Default Settings</h2>
              <div className="form-group">
                <label>Default Payment Terms</label>
                <select
                  value={settings.invoiceDefaults.defaultPaymentTerms}
                  onChange={(e) => handleInputChange('invoiceDefaults', 'defaultPaymentTerms', e.target.value)}
                >
                  <option value="immediate">Immediate</option>
                  <option value="net_15">Net 15</option>
                  <option value="net_30">Net 30</option>
                  <option value="net_45">Net 45</option>
                </select>
              </div>

              <div className="form-group">
                <label>Default Category</label>
                <select
                  value={settings.invoiceDefaults.defaultCategory}
                  onChange={(e) => handleInputChange('invoiceDefaults', 'defaultCategory', e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="electronics">Electronics</option>
                  <option value="utilities">Utilities</option>
                  <option value="groceries">Groceries</option>
                </select>
              </div>

              <div className="form-group">
                <label>Default Warranty Period</label>
                <select
                  value={settings.invoiceDefaults.defaultWarrantyPeriod}
                  onChange={(e) => handleInputChange('invoiceDefaults', 'defaultWarrantyPeriod', e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="6_months">6 Months</option>
                  <option value="1_year">1 Year</option>
                  <option value="2_years">2 Years</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Auto-generate Invoice Numbers</h3>
                  <p>Automatically generate sequential invoice numbers</p>
                </div>
                <div className="setting-action">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.invoiceDefaults.autoGenerateInvoiceNumber}
                      onChange={(e) => handleInputChange('invoiceDefaults', 'autoGenerateInvoiceNumber', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {settings.invoiceDefaults.autoGenerateInvoiceNumber && (
                <div className="form-group">
                  <label>Invoice Number Prefix</label>
                  <input
                    type="text"
                    value={settings.invoiceDefaults.invoiceNumberPrefix}
                    onChange={(e) => handleInputChange('invoiceDefaults', 'invoiceNumberPrefix', e.target.value)}
                    placeholder="e.g., INV"
                  />
                </div>
              )}
            </div>
          )}

          <div className="settings-footer">
            <button 
              className="btn btn-primary"
              onClick={() => handleSaveSettings(activeTab)}
            >
              <FiSave size={16} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 