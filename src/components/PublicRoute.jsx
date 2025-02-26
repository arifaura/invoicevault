import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Check if this is a password reset attempt
  const isPasswordReset = location.pathname === '/reset-password';
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.substring(1));
  const hasResetToken = params.get('token') || hash.get('access_token');

  // Allow access to reset password page if there's a reset token
  if (isPasswordReset && hasResetToken) {
    return children;
  }

  // If user is authenticated and tries to access login/signup pages,
  // redirect them to dashboard
  if (isAuthenticated && !isPasswordReset) {
    // Get the redirect URL from local storage or default to dashboard
    const redirectUrl = localStorage.getItem('redirectUrl') || '/dashboard';
    // Clear the stored URL
    localStorage.removeItem('redirectUrl');
    return <Navigate to={redirectUrl} replace />;
  }

  return children;
};

export default PublicRoute;