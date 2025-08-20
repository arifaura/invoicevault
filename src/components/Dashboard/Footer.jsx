import React from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter, FaFacebook, FaLinkedin, FaGithub, FaHeart } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="dashboard-footer">
      <div className="footer-content">
        {/* Mobile Footer - Shows only on mobile */}
        <div className="mobile-footer md:hidden">
          <div className="mobile-footer-section">
            <div className="footer-brand">
              <h3 className="footer-title">Invoice Vault</h3>
              <p className="footer-subtitle">Streamline your invoicing process</p>
            </div>
            <div className="footer-social-mobile">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link-mobile">
                <FaTwitter />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link-mobile">
                <FaFacebook />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link-mobile">
                <FaLinkedin />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link-mobile">
                <FaGithub />
              </a>
            </div>
          </div>
          
          <div className="footer-links-mobile">
            <div className="footer-links-column">
              <h4 className="footer-links-title">Product</h4>
              <Link to="/features" className="footer-link-mobile">Features</Link>
              <Link to="/pricing" className="footer-link-mobile">Pricing</Link>
              <Link to="/integrations" className="footer-link-mobile">Integrations</Link>
            </div>
            <div className="footer-links-column">
              <h4 className="footer-links-title">Support</h4>
              <Link to="/help" className="footer-link-mobile">Help Center</Link>
              <Link to="/contact" className="footer-link-mobile">Contact Us</Link>
              <Link to="/status" className="footer-link-mobile">Status</Link>
            </div>
            <div className="footer-links-column">
              <h4 className="footer-links-title">Company</h4>
              <Link to="/about" className="footer-link-mobile">About</Link>
              <Link to="/privacy" className="footer-link-mobile">Privacy</Link>
              <Link to="/terms" className="footer-link-mobile">Terms</Link>
            </div>
          </div>
          
          <div className="footer-bottom-mobile">
            <p className="copyright-mobile">
              © {currentYear} Invoice Vault. Made with <FaHeart className="heart-icon" /> for businesses.
            </p>
          </div>
        </div>

        {/* Desktop Footer - Hidden on mobile */}
        <div className="desktop-footer hidden md:flex">
          <div className="footer-left">
            <p className="copyright">
              © {currentYear} Invoice Vault. All rights reserved.
            </p>
          </div>
          <div className="footer-center">
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <Link to="/terms" className="footer-link">Terms of Service</Link>
            <Link to="/contact" className="footer-link">Contact Us</Link>
          </div>
          <div className="footer-right">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <FaTwitter />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <FaFacebook />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <FaLinkedin />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <FaGithub />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 