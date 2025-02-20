import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BiArrowBack } from 'react-icons/bi';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';
import Logo from '../Common/Logo';

const ForgotPassword = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?type=recovery`
      });
      
      if (error) throw error;
      
      setResetSent(true);
      toast.success('Reset link sent! Please check your email for instructions.', {
        icon: '✉️',
        duration: 5000
      });
    } catch (error) {
      toast.error(error.message || 'Failed to send reset instructions', {
        icon: '❌'
      });
    } finally {
      setLoading(false);
    }
  };

  if (resetSent) {
    return (
      <div className="card shadow-sm border-0 px-3 px-sm-4 py-3">
        <div className="text-center mb-4">
          <div className="d-flex justify-content-center mb-3">
            <Logo size="xlarge" />
          </div>
          <h1 className="h4 fw-normal mb-1">Reset your password</h1>
        </div>

        <div className="alert alert-success text-center">
          <h5>Reset link sent!</h5>
          <p>Please check your email for instructions.</p>
        </div>

        <div className="text-center mt-4">
          <button 
            className="btn btn-outline-secondary"
            onClick={onBackToLogin}
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 px-3 px-sm-4 py-3">
      <Link to="/login" className="text-decoration-none text-secondary mb-4">
        <BiArrowBack className="me-2" />
        Back to login
      </Link>

      <div className="text-center mb-4">
        <div className="d-flex justify-content-center mb-3">
          <Logo size="xlarge" />
        </div>
        <h1 className="h4 fw-normal mb-1">Reset your password</h1>
      </div>

      <form onSubmit={handleResetPassword} className="d-flex flex-column align-items-center w-100">
        <div className="mb-4 w-100">
          <label htmlFor="email" className="form-label text-center w-100">Email address</label>
          <input 
            type="email" 
            className="form-control" 
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required 
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-dark w-100 py-2"
          disabled={loading || !email.trim()}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword; 