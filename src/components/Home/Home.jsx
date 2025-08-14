
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Common/Logo';
import './Home.css';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Freelance Designer",
      content: "InvoiceVault transformed my invoicing process. I save 5+ hours weekly and get paid faster.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&q=80"
    },
    {
      name: "Michael Chen",
      role: "Small Business Owner",
      content: "Professional invoices, seamless payments, and excellent support. Exactly what I needed.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80"
    },
    {
      name: "Emily Rodriguez",
      role: "Consultant",
      content: "The analytics help me understand my business better. Highly recommended for any consultant.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80"
    }
  ];

  const features = [
    { icon: "⚡", title: "Lightning Fast", description: "Create professional invoices in under 30 seconds" },
    { icon: "🔒", title: "Bank-Level Security", description: "Your data is protected with enterprise-grade encryption" },
    { icon: "📊", title: "Smart Analytics", description: "Track payments, revenue, and business insights" },
    { icon: "💳", title: "Instant Payments", description: "Accept payments directly through your invoices" }
  ];

  const stats = [
    { number: "50K+", label: "Active Users" },
    { number: "2M+", label: "Invoices Created" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ];

  return (
    <div className="home-container">
      {/* Navigation */}
      <nav className={`home-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Logo size="medium" />
          <button className="mobile-menu-btn" onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/signup" className="nav-link signup-btn">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge hidden">
            <span>✨ Trusted by 50,000+ businesses</span>
          </div>
          <h1 className="hidden">
            Simple invoicing for
            <span className="gradient-text"> modern businesses</span>
          </h1>
          <p className="hero-subtitle hidden">
            Create, send, and track professional invoices. Get paid faster with our intuitive platform designed for today's entrepreneurs.
          </p>
          <div className="hero-email hidden">
            <input type="email" placeholder="Your business email" aria-label="Business email" />
            <Link to="/signup" className="btn-primary">Get Started</Link>
          </div>
          <div className="hero-actions hidden">
            <Link to="/signup" className="btn-primary">Start Free Trial</Link>
            <Link to="#demo" className="btn-secondary">
              <span>▶</span>
              Watch Demo
            </Link>
          </div>
          <div className="hero-stats hidden">
            {stats.map((stat, index) => (
              <div key={index} className="stat">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-visual hidden">
          <div className="hero-image">
            <div className="floating-card card-1">
              <div className="card-icon">📄</div>
              <div className="card-content">
                <div className="card-title">Invoice #001</div>
                <div className="card-amount">$2,500</div>
              </div>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">✅</div>
              <div className="card-content">
                <div className="card-title">Payment Received</div>
                <div className="card-amount">$1,200</div>
              </div>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <div className="card-title">Revenue This Month</div>
                <div className="card-amount">$12,450</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand strip removed per request */}

		{/* Section 1: Features (SMART INVOICING) */}
		<section className="features-v2 slab">
			<div className="container">
				<div className="features-head">
					<div className="head-left hidden">
						<div className="label">SMART INVOICING</div>
						<h2>Simplify your billing, boost your cash flow.</h2>
					</div>
					<p className="head-right hidden">An all-in-one invoicing solution to create, send, and track payments — faster than ever.</p>
				</div>
				<div className="feature-items">
					<div className="feature-item hidden">
						<div className="fi-icon" aria-hidden>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
								<line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth="2"/>
								<line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="2"/>
								<line x1="7" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth="2"/>
							</svg>
						</div>
						<h3>Unlimited Invoices</h3>
						<p>Generate professional invoices in seconds with your branding and preferred currency.</p>
        </div>
					<div className="feature-item hidden">
						<div className="fi-icon" aria-hidden>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
								<path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
            </div>
						<h3>Automated Reminders</h3>
						<p>Send polite payment reminders automatically to ensure you get paid on time.</p>
            </div>
					<div className="feature-item hidden">
						<div className="fi-icon" aria-hidden>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 1l7 4v5c0 5-3 9-7 11-4-2-7-6-7-11V5l7-4z" stroke="currentColor" strokeWidth="2" fill="none"/>
								<path d="M10 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
            </div>
						<h3>Secure Payments</h3>
						<p>Accept online payments securely with bank-grade encryption and instant confirmation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Workflow Section */}
      <section className="workflow dark">
        <div className="container">
          <div className="workflow-grid">
            {[{t:'Create',d:'Generate a branded invoice in seconds.'},{t:'Send',d:'Share via email or link with one click.'},{t:'Get Paid',d:'Accept payments instantly and track status.'}].map((s, i) => (
              <div key={i} className="step-card hidden">
                <div className="step-header">
                  <div className="step-index">{i+1}</div>
                  <div className="step-title">{s.t}</div>
                </div>
                <div className="step-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

		{/* Section 2: Why Us */}
		<section className="why-v2">
			<div className="container">
				<div className="section-header compact hidden">
					<div className="label">WHY US</div>
					<h2>Why businesses choose InvoicePro</h2>
				</div>
				<div className="why-v2-grid">
					<div className="why-card stat hidden">
						<div className="metric">10k+</div>
						<p>Businesses already sending invoices with InvoicePro.</p>
					</div>
					<div className="why-card hidden">
						<div className="fi-icon" aria-hidden>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M7 10h10M13 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								<circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
							</svg>
						</div>
						<h3>Get paid faster</h3>
						<p>Instant payment options for your clients, available anytime.</p>
					</div>
					<div className="why-card hidden">
						<h3>No missed payments</h3>
						<p>Track every invoice with real-time status updates and alerts.</p>
					</div>
					<div className="why-card chart hidden">
						<div className="chart-header">
							<span className="amount">$45,320 Paid</span>
							<span className="sub">Last 30 days</span>
						</div>
						<svg className="sparkline" viewBox="0 0 120 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
							<defs>
								<linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4"/>
									<stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
								</linearGradient>
							</defs>
							<path d="M0 30 L15 28 L30 26 L45 20 L60 24 L75 16 L90 18 L105 10 L120 12" fill="none" stroke="var(--accent)" strokeWidth="2"/>
							<polygon points="0,40 0,30 15,28 30,26 45,20 60,24 75,16 90,18 105,10 120,12 120,40" fill="url(#grad)"/>
						</svg>
					</div>
				</div>
          </div>
		</section>

      {/* Minimal CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-inner cta-content hidden">
            <h2>Ready to get started?</h2>
            <p>Join thousands of businesses using InvoiceVault to get paid faster</p>
            <div className="cta-actions">
              <Link to="/signup" className="btn-primary large">Start Free Trial</Link>
              <div className="cta-benefits">
                <span>✓ No credit card required</span>
                <span>✓ 14-day free trial</span>
                <span>✓ Cancel anytime</span>
          </div>
          </div>
          </div>
        </div>
      </section>

      {/* Pricing & Stats */}
      <section className="pricing-stats">
        <div className="container">
          <div className="mission">
            <div className="label">OUR MISSION</div>
            <h2>We’ve helped innovative companies</h2>
            <p>Hundreds of all sizes and across all industries have made a big improvements with us.</p>
          </div>
          <div className="stats-row">
            <div className="stat-block">
              <div className="num">24%</div>
              <div className="label">Revenue business</div>
            </div>
            <div className="stat-block">
              <div className="num">180K</div>
              <div className="label">In annual revenue</div>
            </div>
            <div className="stat-block">
              <div className="num">10+</div>
              <div className="label">Months of runway</div>
            </div>
          </div>

          <div className="plans-title">CHOOSE PLAN:</div>
          <div className="plans">
            <div className="plan plus" role="button" tabIndex={0}>
              <div>
                <div className="title">Plus</div>
                <div className="price">£2.99/month</div>
              </div>
              <svg className="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="plan premium" role="button" tabIndex={0}>
              <div>
                <div className="title">Premium</div>
                <div className="price">£6.99/month</div>
              </div>
              <svg className="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6l6 6-6 6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="home-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <Logo size="medium" />
              <p>Simple invoicing for modern businesses</p>
            </div>
            <div className="footer-links">
              <div className="footer-section">
                <h4>Product</h4>
                <Link to="#features">Features</Link>
                <Link to="#pricing">Pricing</Link>
                <Link to="#integrations">Integrations</Link>
              </div>
              <div className="footer-section">
                <h4>Company</h4>
                <Link to="#about">About</Link>
                <Link to="#blog">Blog</Link>
                <Link to="#contact">Contact</Link>
              </div>
              <div className="footer-section">
                <h4>Support</h4>
                <Link to="#help">Help Center</Link>
                <Link to="#docs">Documentation</Link>
                <Link to="#status">Status</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 InvoiceVault. All rights reserved.</p>
            <div className="footer-legal">
              <Link to="#privacy">Privacy</Link>
              <Link to="#terms">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
