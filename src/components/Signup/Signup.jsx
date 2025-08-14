import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaApple } from 'react-icons/fa';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'react-hot-toast';
import './Signup.css';
import { BsEyeFill, BsEyeSlashFill, BsEnvelope, BsLock, BsPerson } from 'react-icons/bs';
import Logo from '../Common/Logo';

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const isFormValid = () => {
    const passwordValid = formData.password.length >= 8 && /\d/.test(formData.password) && /[!@#$%^&*]/.test(formData.password);
    const allFieldsFilled = formData.fullName.trim() !== '' && formData.email.trim() !== '' && formData.password.trim() !== '';
    const termsChecked = document.getElementById('terms')?.checked;
    return passwordValid && allFieldsFilled && termsChecked;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (formData.password.length < 8 || !(/\d/.test(formData.password)) || !(/[!@#$%^&*]/.test(formData.password))) {
      toast.error('Please meet all password requirements');
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.fullName } }
      });
      if (error) throw error;
      toast.success('Registration successful! Please check your email for verification.', { duration: 5000, icon: '✉️' });
      navigate('/login');
    } catch (error) {
      toast.error(error.message, { duration: 4000, icon: '❌' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard`, queryParams: { access_type: 'offline', prompt: 'consent' } }
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error.message || 'Failed to sign in with Google. Please try again.', { icon: '❌' });
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-icon">
          <div className="icon-container">
            <Logo size="small" />
          </div>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-description">Make a new doc to bring your words, data, and teams together. For free</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <div className="input-wrapper">
              <BsPerson className="input-icon" />
              <input type="text" className="auth-input" id="fullName" placeholder="Full name" value={formData.fullName} onChange={handleInputChange} required />
            </div>
          </div>
          <div className="input-group">
            <div className="input-wrapper">
              <BsEnvelope className="input-icon" />
              <input type="email" className="auth-input" id="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
            </div>
          </div>
          <div className="input-group">
            <div className="input-wrapper">
              <BsLock className="input-icon" />
              <input type={showPassword ? 'text' : 'password'} className="auth-input" id="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <BsEyeSlashFill /> : <BsEyeFill />}</button>
            </div>
            <div className="password-requirements">
              <p className="requirements-title">Password must have:</p>
              <ul className="requirements-list">
                <li className={`requirement ${formData.password.length >= 8 ? 'valid' : 'invalid'}`}><span className="requirement-icon">{formData.password.length >= 8 ? '✓' : '✗'}</span>At least 8 characters</li>
                <li className={`requirement ${/\d/.test(formData.password) ? 'valid' : 'invalid'}`}><span className="requirement-icon">{/\d/.test(formData.password) ? '✓' : '✗'}</span>Include numbers</li>
                <li className={`requirement ${/[!@#$%^&*]/.test(formData.password) ? 'valid' : 'invalid'}`}><span className="requirement-icon">{/[!@#$%^&*]/.test(formData.password) ? '✓' : '✗'}</span>Include special characters</li>
              </ul>
            </div>
          </div>

          <div className="terms-checkbox">
            <label className="checkbox-wrapper">
              <input type="checkbox" id="terms" required />
              <span className="checkmark"></span>
              <span className="checkbox-text">I agree to the <Link to="/terms" className="auth-link">Terms of Service</Link> and <Link to="/privacy" className="auth-link">Privacy Policy</Link></span>
            </label>
          </div>

          <button type="submit" className="auth-button" disabled={loading || !isFormValid()}>{loading ? 'Creating Account...' : 'Create Account'}</button>
        </form>

        <div className="divider"><span className="divider-text">Or sign up with</span></div>
        <div className="social-buttons">
          <button type="button" className="social-button" onClick={handleGoogleSignup}><FcGoogle className="social-icon" /></button>
          <button type="button" className="social-button"><FaFacebook className="social-icon" /></button>
          <button type="button" className="social-button"><FaApple className="social-icon" /></button>
        </div>
        <div className="auth-footer"><p>Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p></div>
      </div>
    </div>
  );
};

export default Signup; 