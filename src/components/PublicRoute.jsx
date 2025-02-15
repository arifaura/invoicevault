import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // If user is authenticated and tries to access login/signup pages,
  // redirect them to dashboard
  if (isAuthenticated) {
    // Get the redirect URL from session storage or default to dashboard
    const redirectUrl = sessionStorage.getItem('redirectUrl') || '/dashboard';
    // Clear the stored URL
    sessionStorage.removeItem('redirectUrl');
    return <Navigate to={redirectUrl} replace />;
  }

  return children;
};

export default PublicRoute; 