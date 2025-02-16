import React, { useState, useEffect } from 'react';
import { FiUser, FiLock, FiBell, FiDollarSign, FiGrid, FiSave, FiX, FiLoader, FiCamera } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'react-hot-toast';
import { useProfile } from '../../context/ProfileContext';
import './Settings.css';


const Settings = () => {
  const { user } = useAuth();
  const { profile, setProfile } = useProfile();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Add security state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch profile data on component mount
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                first_name: '',
                last_name: '',
                email: user.email,
                phone: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);

          if (insertError) throw insertError;
          
          // Fetch the profile again
          await fetchProfile();
          return;
        }
        throw error;
      }

      if (data) {
        setProfile({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          avatar: data.avatar_url
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB');
      }

      // Validate file type
      if (!file.type.match(/^image\/(jpeg|png|gif)$/)) {
        throw new Error('File must be an image (JPG, PNG, or GIF)');
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (profile.avatar) {
        const oldFileName = profile.avatar.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('avatars')
            .remove([oldFileName]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      handleInputChange('avatar', publicUrl);
      
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: profile.firstName,
          last_name: profile.lastName,
          email: profile.email,
          phone: profile.phone,
          avatar_url: profile.avatar,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Add password change handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (securityForm.newPassword !== securityForm.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      const { error } = await supabase.auth.updateUser({
        password: securityForm.newPassword
      });

      if (error) throw error;

      // Clear form
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast.success('Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Add security form change handler
  const handleSecurityInputChange = (field, value) => {
    setSecurityForm(prev => ({
      ...prev,
      [field]: value
    }));
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
          {/* Remove other tab buttons for now */}
        </div>

        <div className="settings-panel">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Profile Settings</h2>
              
              {/* Avatar Section */}
              <div className="avatar-section">
                <div className="avatar-wrapper">
                  {profile.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt="Profile" 
                      className="avatar-preview"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {profile.firstName?.charAt(0) || ''}
                      {profile.lastName?.charAt(0) || ''}
                    </div>
                  )}
                </div>
                
                <div className="avatar-upload">
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    hidden
                  />
                  <label htmlFor="avatar" className="btn-change-photo">
                    {loading ? (
                      <>
                        <FiLoader className="animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FiCamera size={16} />
                        Change Photo
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Profile Form */}
              <div className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="form-control disabled"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="settings-footer">
                  <button 
                    type="button"
                    className="btn btn-primary save-btn"
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Security Settings</h2>
              
              <div className="password-change-section">
                <h3>Change Password</h3>
                <form onSubmit={handlePasswordChange}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={securityForm.currentPassword}
                      onChange={(e) => handleSecurityInputChange('currentPassword', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={securityForm.newPassword}
                      onChange={(e) => handleSecurityInputChange('newPassword', e.target.value)}
                      required
                    />
                    <div className="password-requirements">
                      <p>Password must have:</p>
                      <ul>
                        <li className={securityForm.newPassword.length >= 8 ? 'valid' : 'invalid'}>
                          At least 8 characters
                        </li>
                        <li className={/\d/.test(securityForm.newPassword) ? 'valid' : 'invalid'}>
                          Include numbers
                        </li>
                        <li className={/[!@#$%^&*]/.test(securityForm.newPassword) ? 'valid' : 'invalid'}>
                          Include special characters
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={(e) => handleSecurityInputChange('confirmPassword', e.target.value)}
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 