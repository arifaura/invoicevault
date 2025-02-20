import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsEyeFill, BsEyeSlashFill } from 'react-icons/bs';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';
import Logo from '../Common/Logo';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Add useEffect to log URL parameters when component mounts
  useEffect(() => {
    console.log('Reset Password Component Mounted');
    console.log('URL Hash:', window.location.hash);
    console.log('URL Search Params:', window.location.search);
    
    // Check if we're in recovery mode
    const fragment = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    
    console.log('Recovery Mode:', fragment === '#recovery');
    console.log('Access Token Present:', !!accessToken);
    console.log('Refresh Token Present:', !!refreshToken);
  }, []);

  const handlePasswordChange = (e, isConfirm = false) => {
    const value = e.target.value;
    if (isConfirm) {
      setConfirmPassword(value);
      if (value !== newPassword) {
        setPasswordError('Passwords do not match');
      } else {
        setPasswordError('');
      }
    } else {
      setNewPassword(value);
      if (confirmPassword && value !== confirmPassword) {
        setPasswordError('Passwords do not match');
      } else {
        setPasswordError('');
      }
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Get the recovery token from the URL
      const fragment = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken && !refreshToken && fragment !== '#recovery') {
        throw new Error('Invalid or missing recovery token');
      }

      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully! Please log in with your new password.');
      navigate('/login');
    } catch (error) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 px-3 px-sm-4 py-3">
      <div className="text-center mb-4">
        <div className="d-flex justify-content-center mb-3">
          <Logo size="xlarge" />
        </div>
        <h1 className="h4 fw-normal mb-1">Reset your password</h1>
      </div>

      <form onSubmit={handlePasswordUpdate} className="text-start">
        <div className="mb-4">
          <label className="form-label h5 mb-3">New Password</label>
          <div className="position-relative">
            <input
              type={showNewPassword ? "text" : "password"}
              className={`form-control form-control-lg ${passwordError ? 'is-invalid' : ''}`}
              id="newPassword"
              value={newPassword}
              onChange={(e) => handlePasswordChange(e, false)}
              required
              placeholder="Enter your new password"
              minLength="6"
            />
            <button
              type="button"
              className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted pe-3"
              onClick={() => setShowNewPassword(!showNewPassword)}
              style={{ backgroundColor: 'transparent', border: 'none' }}
            >
              {showNewPassword ? <BsEyeSlashFill size={18} /> : <BsEyeFill size={18} />}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label h5 mb-3">Confirm Password</label>
          <div className="position-relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className={`form-control form-control-lg ${passwordError ? 'is-invalid' : ''}`}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => handlePasswordChange(e, true)}
              required
              placeholder="Confirm your new password"
              minLength="6"
            />
            <button
              type="button"
              className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted pe-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ backgroundColor: 'transparent', border: 'none' }}
            >
              {showConfirmPassword ? <BsEyeSlashFill size={18} /> : <BsEyeFill size={18} />}
            </button>
          </div>
          {passwordError && <div className="invalid-feedback d-block">{passwordError}</div>}
        </div>

        <button 
          type="submit" 
          className="btn btn-dark w-100 py-3" 
          disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Updating...
            </>
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword; 