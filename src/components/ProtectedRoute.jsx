import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const { user, loading, session, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Store the attempted URL
    sessionStorage.setItem('redirectUrl', location.pathname);
    toast.error('Please sign in to access this page');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if session is expired
  if (session?.expires_at && new Date(session.expires_at * 1000) < new Date()) {
    toast.error('Your session has expired. Please sign in again.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute; 