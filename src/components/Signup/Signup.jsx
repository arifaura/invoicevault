import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'react-hot-toast';
import './Signup.css';
import { BsEyeFill, BsEyeSlashFill } from 'react-icons/bs';

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const isFormValid = () => {
    const passwordValid = 
      formData.password.length >= 8 && 
      /\d/.test(formData.password) && 
      /[!@#$%^&*]/.test(formData.password);
    
    const allFieldsFilled = 
      formData.fullName.trim() !== '' && 
      formData.email.trim() !== '' && 
      formData.password.trim() !== '';

    // Get the terms checkbox element and check its state
    const termsChecked = document.getElementById('terms')?.checked;

    return passwordValid && allFieldsFilled && termsChecked;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate password requirements
    if (formData.password.length < 8 || 
        !(/\d/.test(formData.password)) || 
        !(/[!@#$%^&*]/.test(formData.password))) {
      toast.error('Please meet all password requirements');
      setLoading(false);
      return;
    }

    try {
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (error) throw error;

      toast.success('Registration successful! Please check your email for verification.', {
        duration: 5000,
        icon: '✉️'
      });
      navigate('/login');
    } catch (error) {
      toast.error(error.message, {
        duration: 4000,
        icon: '❌'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Google auth error:', error);
        throw error;
      }
    } catch (error) {
      toast.error(error.message || 'Failed to sign in with Google. Please try again.', {
        icon: '❌'
      });
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100 mx-0">
        <div className="col-12 col-md-10 col-lg-7 px-0 px-sm-2">
          <div className="card shadow-sm border-0 px-3 px-sm-4 py-3">
            <div className="text-center mb-3">
              <h2 className="logo-text mb-2">LOGO</h2>
              <h1 className="h4 fw-normal mb-1">Create your account</h1>
            </div>
            
            <div className="mb-3">
              <button 
                type="button" 
                className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={handleGoogleSignup}
              >
                <FcGoogle size={18} />
                Continue with Google
              </button>
            </div>

            <div className="divider">
              <span className="divider-text">or</span>
            </div>
            
            <form onSubmit={handleSubmit} className="signup-form">
              <div className="mb-3">
                <label htmlFor="fullName" className="form-label">Full name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="fullName" 
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required 
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  id="email" 
                  value={formData.email}
                  onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                <div className="password-requirements mt-2">
                  <p className="text-muted small mb-1">Password must have:</p>
                  <ul className="list-unstyled small">
                    <li className={`${formData.password.length >= 8 ? 'valid' : 'invalid'} mb-1`}>
                      <i className={`bi bi-${formData.password.length >= 8 ? 'check' : 'x'}-circle-fill me-2`}></i>
                      At least 8 characters
                    </li>
                    <li className={`${/\d/.test(formData.password) ? 'valid' : 'invalid'} mb-1`}>
                      <i className={`bi bi-${/\d/.test(formData.password) ? 'check' : 'x'}-circle-fill me-2`}></i>
                      Include numbers
                    </li>
                    <li className={`${/[!@#$%^&*]/.test(formData.password) ? 'valid' : 'invalid'}`}>
                      <i className={`bi bi-${/[!@#$%^&*]/.test(formData.password) ? 'check' : 'x'}-circle-fill me-2`}></i>
                      Include special characters
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="form-check mb-3">
                <input type="checkbox" className="form-check-input" id="terms" required />
                <label className="form-check-label small" htmlFor="terms">
                  I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
                </label>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-dark w-100 py-2 mb-3 d-flex align-items-center justify-content-center"
                disabled={loading || !isFormValid()}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="text-center">
                <p className="text-muted small mb-0">
                  Already have an account? <Link to="/login">Sign in</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup; 