
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to InvoiceVault</h1>
        <p>Your Digital Invoice Management Solution</p>
        <div className="cta-buttons">
          <Link to="/login" className="btn btn-primary">Sign In</Link>
          <Link to="/signup" className="btn btn-outline">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
