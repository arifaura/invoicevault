import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const { loading, session, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  // Check if this is a password reset attempt
  const isPasswordReset = location.pathname === '/reset-password';
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.substring(1));
  const hasResetToken = params.get('token') || hash.get('access_token');

  // Allow access to reset password page if there's a reset token
  if (isPasswordReset && hasResetToken) {
    return children;
  }

  // If not authenticated and not on the login/signup/reset page
  if (!isAuthenticated && !location.pathname.includes('/login') && !location.pathname.includes('/signup')) {
    // Only store redirect URL if not already on login/signup page
    if (!['/login', '/signup'].includes(location.pathname)) {
      localStorage.setItem('redirectUrl', location.pathname);
    }
    
    // Only show toast if not already on login/signup page
    if (!['/login', '/signup'].includes(location.pathname)) {
      toast.error('Please sign in to access this page');
    }
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if session is expired
  if (session?.expires_at && new Date(session.expires_at * 1000) < new Date()) {
    // Only show toast if not already on login/signup page
    if (!['/login', '/signup'].includes(location.pathname)) {
      toast.error('Your session has expired. Please sign in again.');
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;