import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100 mx-0">
          <div className="col-12 col-md-6 text-center">
            <div className="error-content">
              <div className="error-code-wrapper mb-4">
                <h1 className="error-code">404</h1>
              </div>
              <h2 className="error-title mb-3">Oops! Page not found</h2>
              <p className="error-message mb-4">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <button 
                onClick={() => navigate('/')} 
                className="btn btn-primary btn-lg"
              >
                Go Back Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 