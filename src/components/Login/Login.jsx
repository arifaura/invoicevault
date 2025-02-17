import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { BiArrowBack } from 'react-icons/bi';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';
import './Login.css';
import { BsEyeFill, BsEyeSlashFill } from 'react-icons/bs';
import Logo from '../Common/Logo';

const Login = () => {
  const navigate = useNavigate();
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast.success('Welcome back!', {
        icon: '👋',
        duration: 3000
      });

      // Get redirect URL if it exists
      const redirectUrl = sessionStorage.getItem('redirectUrl');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectUrl');
        navigate(redirectUrl);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.message, {
        icon: '❌',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
    } catch (error) {
      toast.error('Failed to sign in with Google', {
        icon: '❌'
      });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success('Password reset instructions sent to your email!', {
        icon: '✉️',
        duration: 5000
      });
      setResetSent(true);
    } catch (error) {
      toast.error(error.message || 'Failed to send reset instructions', {
        icon: '❌'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsResetMode(false);
    setResetSent(false);
  };

  const isFormValid = () => {
    return formData.email.trim() !== '' && formData.password.trim() !== '';
  };

  if (isResetMode) {
    return (
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100 mx-0">
          <div className="col-12 col-md-10 col-lg-7 px-0 px-sm-2">
            <div className="card shadow-sm border-0 px-3 px-sm-4 py-3">
              <button 
                onClick={handleBackToLogin}
                className="back-button ms-1 mb-3"
              >
                <BiArrowBack size={20} /> Back to login
              </button>

              <div className="text-center mb-4">
                <div className="d-flex justify-content-center mb-3">
                  <Logo size="large" />
                </div>
                <h1 className="h4 fw-normal mb-1">Reset your password</h1>
                {!resetSent && (
                  <p className="text-muted small">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                )}
              </div>

              {resetSent ? (
                <div className="text-center">
                  <div className="alert alert-success" role="alert">
                    <p className="mb-0">Reset link sent!</p>
                    <p className="small mb-0">Please check your email for instructions.</p>
                  </div>
                  <button 
                    onClick={handleBackToLogin}
                    className="btn btn-outline-secondary mt-3"
                  >
                    Return to login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email address</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      required 
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-dark w-100 py-2">
                    Send reset link
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100 mx-0">
        <div className="col-12 col-md-10 col-lg-7 px-0 px-sm-2">
          <div className="card shadow-sm border-0 px-3 px-sm-4 py-3">
            <div className="text-center mb-3">
              <div className="d-flex justify-content-center mb-3">
                <Logo size="large" />
              </div>
              <h1 className="h4 fw-normal mb-1">Welcome back</h1>
              <p className="text-muted small mb-3">Sign in to manage your invoices</p>
            </div>
            
            <div className="mb-3">
              <button 
                type="button" 
                className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={handleGoogleLogin}
              >
                <FcGoogle size={18} />
                Continue with Google
              </button>
            </div>

            <div className="divider">
              <span className="divider-text">or</span>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required 
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="position-relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    className="form-control" 
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required 
                  />
                  <button
                    type="button"
                    className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted pe-3"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ backgroundColor: 'transparent', border: 'none' }}
                  >
                    {showPassword ? <BsEyeSlashFill size={18} /> : <BsEyeFill size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="remember" />
                  <label className="form-check-label small" htmlFor="remember">Remember me</label>
                </div>
                <button 
                  type="button" 
                  className="btn btn-link p-0 text-decoration-none small"
                  onClick={() => setIsResetMode(true)}
                >
                  Forgot password?
                </button>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-dark w-100 py-2 mb-3 d-flex align-items-center justify-content-center"
                disabled={loading || !isFormValid()}
              >
                {loading ? 'Logging in...' : 'Sign in'}
              </button>

              <div className="text-center">
                <p className="text-muted small mb-0">
                  Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 