import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaApple } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';
import './Login.css';
import { BsEyeFill, BsEyeSlashFill, BsEnvelope, BsLock } from 'react-icons/bs';
import Logo from '../Common/Logo';
import ForgotPassword from '../Auth/ForgotPassword';
import ResetPassword from '../Auth/ResetPassword';

const Login = ({ isResetMode: initialResetMode = false, resetCode = false }) => {
  const navigate = useNavigate();
  const [isResetMode, setIsResetMode] = useState(initialResetMode);
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

      toast.success('Welcome back!', { icon: '👋', duration: 3000 });

      const redirectUrl = sessionStorage.getItem('redirectUrl');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectUrl');
        navigate(redirectUrl);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.message, { icon: '❌', duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` }
      });
      if (error) throw error;
    } catch (error) {
      toast.error('Failed to sign in with Google', { icon: '❌' });
    }
  };

  const isFormValid = () => formData.email.trim() !== '' && formData.password.trim() !== '';

  if (resetCode) {
    return (
      <div className="auth-container">
        <div className="auth-card">
            <ResetPassword />
        </div>
      </div>
    );
  }

  if (isResetMode) {
    return (
      <div className="auth-container">
        <div className="auth-card">
            <ForgotPassword onBackToLogin={() => setIsResetMode(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-icon">
          <div className="icon-container">
            <Logo size="small" />
              </div>
            </div>
        <h1 className="auth-title">Sign in with email</h1>
        <p className="auth-description">Make a new doc to bring your words, data, and teams together. For free</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <div className="input-wrapper">
              <BsEnvelope className="input-icon" />
              <input type="email" className="auth-input" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            </div>
          <div className="input-group">
            <div className="input-wrapper">
              <BsLock className="input-icon" />
              <input type={showPassword ? 'text' : 'password'} className="auth-input" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <BsEyeSlashFill /> : <BsEyeFill />}</button>
                </div>
              </div>
              
          <div className="forgot-password">
            <button type="button" className="forgot-link" onClick={() => setIsResetMode(true)}>Forgot password?</button>
              </div>
              
          <button type="submit" className="auth-button" disabled={loading || !isFormValid()}>{loading ? 'Signing in...' : 'Get Started'}</button>
        </form>

        <div className="divider"><span className="divider-text">Or sign in with</span></div>

        <div className="social-buttons">
          <button type="button" className="social-button" onClick={handleGoogleLogin}><FcGoogle className="social-icon" /></button>
          <button type="button" className="social-button"><FaFacebook className="social-icon" /></button>
          <button type="button" className="social-button"><FaApple className="social-icon" /></button>
              </div>

        <div className="auth-footer"><p>Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link></p></div>
      </div>
    </div>
  );
};

export default Login; 