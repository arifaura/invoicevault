
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    });

    const hiddenElements = document.querySelectorAll('.hidden');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="home-container">
      <nav className="home-nav">
        <div className="logo">InvoiceVault</div>
        <div className="nav-links">
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/signup" className="nav-link signup-btn">Sign Up Free</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content hidden">
          <h1>Streamline Your Invoicing Process</h1>
          <p>Professional invoicing solution for businesses of all sizes</p>
          <Link to="/signup" className="cta-button">Get Started</Link>
        </div>
        <div className="hero-image hidden">
          <div className="floating-invoice">
            <div className="invoice-header"></div>
            <div className="invoice-line"></div>
            <div className="invoice-line"></div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2 className="hidden">Why Choose InvoiceVault?</h2>
        <div className="feature-grid">
          <div className="feature-card hidden">
            <i className="bi bi-lightning-charge"></i>
            <h3>Quick Creation</h3>
            <p>Create professional invoices in seconds</p>
          </div>
          <div className="feature-card hidden">
            <i className="bi bi-graph-up"></i>
            <h3>Track Analytics</h3>
            <p>Monitor your business growth</p>
          </div>
          <div className="feature-card hidden">
            <i className="bi bi-cloud-check"></i>
            <h3>Cloud Storage</h3>
            <p>Access your invoices anywhere</p>
          </div>
          <div className="feature-card hidden">
            <i className="bi bi-shield-check"></i>
            <h3>Secure</h3>
            <p>Your data is always protected</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
