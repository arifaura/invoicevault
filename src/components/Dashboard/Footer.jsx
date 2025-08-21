import React from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter, FaFacebook, FaLinkedin, FaGithub, FaHeart } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="dashboard-footer">
      <div className="footer-content">
        {/* Mobile Footer - compact version */}
        <div className="mobile-footer">
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
          
          <div className="footer-bottom-mobile">
            <p className="copyright-mobile">
              © {currentYear} Invoice Vault. Made with <FaHeart className="heart-icon" /> for businesses.
            </p>
          </div>
        </div>

        {/* Desktop Footer */}
        <div className="desktop-footer">
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