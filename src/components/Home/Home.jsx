
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Common/Logo';
import './Home.css';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
        <div className="nav-container">
          <Logo size="medium" />
          <button className="mobile-menu-btn" onClick={toggleMenu}>
            <i className="bi bi-list"></i>
          </button>
          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link signup-btn">Sign Up Free</Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content hidden">
          <h1>Streamline Your Invoicing Process</h1>
          <p>Professional invoicing solution for businesses of all sizes</p>
          <Link to="/signup" className="cta-button">Get Started</Link>
        </div>
        <div className="hero-image hidden">
          <div className="hero-images">
            <div className="hero-image-item">
              <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80" alt="Business Analytics" />
            </div>
            <div className="hero-image-item">
              <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80" alt="Financial Planning" />
            </div>
            <div className="hero-image-item">
              <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80" alt="Invoice Management" />
            </div>
            <div className="hero-image-item">
              <img src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=500&q=80" alt="Business Growth" />
            </div>
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
