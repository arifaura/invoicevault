import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  FiActivity,
  FiArrowDownRight,
  FiArrowRight,
  FiCheck,
  FiClock,
  FiFileText,
  FiFolder,
  FiGrid,
  FiLock,
  FiMenu,
  FiSearch,
  FiShield,
  FiX,
} from 'react-icons/fi';
import Logo from '../Common/Logo';
import './Home.css';

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const documents = [
  { id: 'INV-2048', vendor: 'Northstar Studio', date: 'Oct 18, 2026', category: 'Invoice', amount: '$2,480.00', status: 'Paid', pull: [34, 28] },
  { id: 'BILL-0892', vendor: 'Morrow Utilities', date: 'Oct 12, 2026', category: 'Bill', amount: '$186.42', status: 'Pending', pull: [-36, 24] },
  { id: 'REC-7314', vendor: 'Fieldwork Market', date: 'Oct 08, 2026', category: 'Receipt', amount: '$64.90', status: 'Paid', pull: [-28, -34] },
];

const previewDocuments = [
  { id: 'INV-2048', vendor: 'Northstar Studio', date: 'Oct 18, 2026', category: 'Invoice', amount: '$2,480.00', status: 'Paid', icon: FiFileText },
  { id: 'BILL-0892', vendor: 'Morrow Utilities', date: 'Oct 12, 2026', category: 'Bill', amount: '$186.42', status: 'Pending', icon: FiFileText },
  { id: 'REC-7314', vendor: 'Fieldwork Market', date: 'Oct 08, 2026', category: 'Receipt', amount: '$64.90', status: 'Paid', icon: FiFileText },
  { id: 'INV-2039', vendor: 'Juniper Creative', date: 'Oct 04, 2026', category: 'Invoice', amount: '$1,250.00', status: 'Paid', icon: FiFileText },
];

function FadeIn({ children, className = '', delay = 0 }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={reveal}
      initial={reduceMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: reduceMotion ? 0 : 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function FloatingDocument({ document, progress, reduceMotion }) {
  const x = useTransform(progress, [0, 1], [0, document.pull[0]]);
  const y = useTransform(progress, [0, 1], [0, document.pull[1]]);

  return (
    <motion.article className={`scene-document scene-document-${document.category.toLowerCase()}`} style={{ x: reduceMotion ? 0 : x, y: reduceMotion ? 0 : y }}>
      <div className="scene-doc-topline">
        <span className="scene-doc-mark"><FiFileText /></span>
        <span className={`scene-doc-status ${document.status.toLowerCase()}`}>{document.status}</span>
      </div>
      <span className="scene-doc-kicker">{document.category} · {document.id}</span>
      <strong className="scene-doc-vendor">{document.vendor}</strong>
      <span className="scene-doc-date">{document.date}</span>
      <div className="scene-doc-rule" />
      <div className="scene-doc-total"><span>Total</span><strong>{document.amount}</strong></div>
    </motion.article>
  );
}

function VaultScene() {
  const sceneRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ['start end', 'end start'],
  });
  const vaultY = useTransform(scrollYProgress, [0, 1], [20, -24]);
  const vaultRotate = useTransform(scrollYProgress, [0, 1], [-2, 2]);

  const handlePointerMove = (event) => {
    if (reduceMotion || event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 22,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 18,
    });
  };

  return (
    <div
      className="vault-scene"
      ref={sceneRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setPointer({ x: 0, y: 0 })}
      style={{ '--pointer-x': `${pointer.x}px`, '--pointer-y': `${pointer.y}px` }}
      aria-label="Illustration of a secure digital vault surrounded by invoices, bills, and receipts"
      role="img"
    >
      <div className="scene-glow scene-glow-blue" />
      <div className="scene-glow scene-glow-violet" />
      <div className="scene-grid" />
      <div className="scene-orbit scene-orbit-back" />
      <div className="scene-orbit scene-orbit-front" />
      <motion.div
        className="vault-object"
        style={{
          y: reduceMotion ? 0 : vaultY,
          rotateZ: reduceMotion ? 0 : vaultRotate,
        }}
      >
        <div className="vault-shadow" />
        <div className="vault-body">
          <div className="vault-side" />
          <div className="vault-top" />
          <div className="vault-front">
            <div className="vault-rim">
              <div className="vault-door">
                <div className="vault-door-lines" />
                <div className="vault-emblem">
                  <FiShield aria-hidden="true" />
                  <span><FiLock aria-hidden="true" /></span>
                </div>
                <span className="vault-label">INVOICE VAULT</span>
                <div className="vault-handle"><span /><span /><span /><span /></div>
              </div>
            </div>
            <div className="vault-led" />
          </div>
        </div>
      </motion.div>
      {documents.map((document, index) => (
        <motion.div
          key={document.id}
          className={`scene-document-wrap scene-document-wrap-${index + 1}`}
          animate={reduceMotion ? undefined : { y: [0, index % 2 ? -10 : 10, 0], rotate: [0, index % 2 ? 1.5 : -1.5, 0] }}
          transition={reduceMotion ? undefined : { duration: 5 + index, repeat: Infinity, ease: 'easeInOut', delay: index * 0.4 }}
        >
          <FloatingDocument document={document} progress={scrollYProgress} reduceMotion={reduceMotion} />
        </motion.div>
      ))}
      <div className="scene-caption"><span className="scene-caption-dot" /> Everything, in its place</div>
      <div className="scene-secure-chip"><FiShield /> Your documents, beautifully organized.</div>
    </div>
  );
}

function DashboardPreview() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const categories = ['All', 'Invoices', 'Bills', 'Receipts'];
  const matchingDocuments = useMemo(() => previewDocuments.filter((document) => {
    const matchesCategory = category === 'All' || document.category.toLowerCase() === category.slice(0, -1).toLowerCase();
    const matchesQuery = `${document.id} ${document.vendor} ${document.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  }), [category, query]);

  return (
    <div className="dashboard-window">
      <div className="dashboard-sidebar">
        <div className="dashboard-brand"><span className="dashboard-brand-mark"><FiShield /></span><strong>vault</strong></div>
        <span className="dashboard-menu-label">WORKSPACE</span>
        <div className="dashboard-menu-item active"><FiGrid /> Overview</div>
        <div className="dashboard-menu-item"><FiFileText /> Documents</div>
        <div className="dashboard-menu-item"><FiActivity /> Activity</div>
        <div className="dashboard-user"><span className="dashboard-avatar">JD</span><span>Jamie Davis<small>Personal space</small></span></div>
      </div>
      <div className="dashboard-main">
        <div className="dashboard-topbar"><div><span className="dashboard-eyebrow">YOUR WORKSPACE</span><h3>Good morning, Jamie</h3></div><div className="dashboard-profile">JD</div></div>
        <div className="dashboard-sample-label"><span /> Illustrative preview · sample data</div>
        <div className="dashboard-stats">
          <div className="dashboard-stat"><span>Total documents</span><strong>1,284</strong><small><FiActivity /> Across all folders</small></div>
          <div className="dashboard-stat"><span>Added this month</span><strong>24</strong><small className="stat-positive"><FiArrowDownRight /> New documents</small></div>
          <div className="dashboard-stat"><span>Needs attention</span><strong>08</strong><small className="stat-pending"><FiClock /> Pending items</small></div>
        </div>
        <div className="dashboard-content-grid">
          <div className="dashboard-documents-panel">
            <div className="dashboard-panel-heading"><div><h4>Recent documents</h4><span>Your latest saved records</span></div><button type="button" className="dashboard-view-all">View all <FiArrowRight /></button></div>
            <label className="dashboard-search"><FiSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents" aria-label="Search sample documents" /></label>
            <div className="dashboard-filters" role="group" aria-label="Filter sample documents by category">
              {categories.map((item) => <button key={item} type="button" className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
            <div className="dashboard-table">
              {matchingDocuments.map((document) => {
                const Icon = document.icon;
                return (
                  <div className="dashboard-row" key={document.id}>
                    <span className="dashboard-file-icon"><Icon /></span>
                    <span className="dashboard-row-name"><strong>{document.vendor}</strong><small>{document.id} · {document.date}</small></span>
                    <span className={`dashboard-status ${document.status.toLowerCase()}`}>{document.status}</span>
                    <strong className="dashboard-row-amount">{document.amount}</strong>
                  </div>
                );
              })}
              {matchingDocuments.length === 0 && <div className="dashboard-empty">No sample documents match your search.</div>}
            </div>
          </div>
          <div className="dashboard-side-panels">
            <div className="dashboard-chart-panel">
              <div className="dashboard-panel-heading"><div><h4>Monthly spend</h4><span>Illustrative overview</span></div><span className="chart-period">6 months</span></div>
              <div className="chart-total">$4,820<span> across records</span></div>
              <div className="monthly-chart" aria-label="Sample monthly expense chart">
                {[42, 64, 48, 82, 57, 72].map((height, index) => <div className="chart-column" key={index}><span style={{ height: `${height}%` }} /><small>{['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'][index]}</small></div>)}
              </div>
            </div>
            <div className="dashboard-activity-panel">
              <div className="dashboard-panel-heading"><div><h4>Recent activity</h4></div><span className="activity-live">Latest</span></div>
              <div className="activity-item"><span className="activity-icon blue"><FiFileText /></span><span><strong>Invoice saved</strong><small>Northstar Studio · 2h ago</small></span></div>
              <div className="activity-item"><span className="activity-icon green"><FiCheck /></span><span><strong>Receipt organized</strong><small>Fieldwork Market · Yesterday</small></span></div>
              <div className="activity-item"><span className="activity-icon violet"><FiFolder /></span><span><strong>Folder created</strong><small>Travel expenses · Oct 16</small></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-brand" aria-label="Invoice Vault home" onClick={closeMenu}><Logo size="medium" /></Link>
          <button
            type="button"
            className="landing-menu-toggle"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
          <nav className={`landing-links${isMenuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
            <a href="#features" onClick={closeMenu}>Features</a>
            <a href="#how-it-works" onClick={closeMenu}>How It Works</a>
            <a href="#security" onClick={closeMenu}>Security</a>
            <Link to="/login" onClick={closeMenu}>Sign In</Link>
            <Link to="/signup" className="nav-cta" onClick={closeMenu}>Get Started <FiArrowRight /></Link>
          </nav>
        </div>
      </header>

      <section className="landing-hero">
        <div className="hero-ambient hero-ambient-one" />
        <div className="hero-ambient hero-ambient-two" />
        <div className="landing-hero-inner">
          <div className="hero-copy">
            <FadeIn className="hero-copy-inner">
              <div className="hero-eyebrow"><span className="eyebrow-sparkle">✳</span> A clearer way to keep your records</div>
              <h1>Every Invoice.<br /><span>One Secure Vault.</span></h1>
              <p className="hero-description">All your bills, invoices, and receipts in one organized digital space. Store less paper, find documents faster, and stay in control.</p>
              <div className="hero-buttons">
                <Link to="/signup" className="button-primary">Get Started <FiArrowRight /></Link>
                <a href="#features" className="button-secondary">Explore Features <span className="button-play">↓</span></a>
              </div>
              <div className="hero-trust"><span className="trust-check"><FiCheck /></span> Your documents, beautifully organized.</div>
            </FadeIn>
          </div>
          <VaultScene />
        </div>
        <a className="hero-scroll-cue" href="#features"><span /> Scroll to explore</a>
      </section>

      <section className="feature-section" id="features">
        <div className="section-container">
          <FadeIn className="section-intro">
            <span className="section-kicker">A little more order</span>
            <h2>Everything important,<br /><span>right where you need it.</span></h2>
            <p>Less time hunting through folders. More confidence that every record is in its place.</p>
          </FadeIn>
          <div className="feature-grid">
            {[
              { icon: FiShield, title: 'Secure Storage', text: 'Keep important invoices, bills, and receipts together in one account.' },
              { icon: FiFolder, title: 'Smart Organization', text: 'Sort and group your documents so your records feel manageable.' },
              { icon: FiSearch, title: 'Quick Search', text: 'Find the document you need without digging through paper piles.' },
              { icon: FiGrid, title: 'Centralized Records', text: 'Bring everyday financial paperwork into one easy-to-find space.' },
            ].map(({ icon: Icon, title, text }, index) => (
              <FadeIn className="feature-card" delay={index * 0.08} key={title}>
                <div className="feature-icon"><Icon /></div>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="feature-card-index">0{index + 1}</span>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="workflow-section" id="how-it-works">
        <div className="section-container workflow-layout">
          <FadeIn className="workflow-copy">
            <span className="section-kicker">A simpler routine</span>
            <h2>From scattered to <span>sorted.</span></h2>
            <p>A few small steps turn a pile of paperwork into a record you can actually use.</p>
            <Link to="/signup" className="text-link">Make room for less paper <FiArrowRight /></Link>
          </FadeIn>
          <div className="workflow-steps">
            {[
              { number: '01', title: 'Upload documents', text: 'Add invoices, bills, and receipts to your digital space.' },
              { number: '02', title: 'Organize invoices', text: 'Keep records grouped and easy to browse.' },
              { number: '03', title: 'Find them anytime', text: 'Search your collection whenever you need a detail.' },
            ].map((step, index) => (
              <FadeIn className="workflow-step" delay={index * 0.1} key={step.number}>
                <span className="workflow-number">{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.text}</p></div>
                {index < 2 && <span className="workflow-connector" />}
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="preview-section" id="preview">
        <div className="section-container">
          <FadeIn className="section-intro preview-intro">
            <span className="section-kicker">A peek inside</span>
            <h2>One view. <span>More peace of mind.</span></h2>
            <p>A sample of how your documents can feel when everything has a place.</p>
          </FadeIn>
          <FadeIn className="dashboard-frame"><DashboardPreview /></FadeIn>
          <p className="preview-disclaimer">Illustrative product preview. All document names, dates, and figures shown are sample data.</p>
        </div>
      </section>

      <section className="security-section" id="security">
        <div className="section-container security-layout">
          <FadeIn className="security-copy">
            <span className="section-kicker">Your records, in your corner</span>
            <h2>Important things deserve <span>a thoughtful home.</span></h2>
            <p>Invoice Vault brings your financial paperwork into one account, so the documents you care about are easier to keep track of and find when you need them.</p>
            <div className="security-points">
              <div><span><FiCheck /></span><p>One place for your everyday records</p></div>
              <div><span><FiCheck /></span><p>Private account access</p></div>
              <div><span><FiCheck /></span><p>Clear, easy-to-find organization</p></div>
            </div>
          </FadeIn>
          <FadeIn className="security-visual">
            <div className="security-aura" />
            <div className="security-ring security-ring-outer" />
            <div className="security-ring security-ring-inner" />
            <div className="security-shield">
              <FiShield />
              <span><FiLock /></span>
            </div>
            <div className="security-orbit-dot dot-one" />
            <div className="security-orbit-dot dot-two" />
            <div className="security-caption"><FiLock /> Your space. Your records.</div>
          </FadeIn>
        </div>
      </section>

      <section className="final-cta-section">
        <div className="final-cta-glow" />
        <FadeIn className="final-cta-content">
          <span className="section-kicker">Make space for what matters</span>
          <h2>Give Your Documents<br /><span>a Better Home.</span></h2>
          <p>Start bringing your bills, invoices, and receipts together.</p>
          <Link to="/signup" className="button-primary">Get Started <FiArrowRight /></Link>
          <span className="cta-signin">Already have an account? <Link to="/login">Sign in</Link></span>
        </FadeIn>
      </section>

      <footer className="landing-footer">
        <div className="section-container">
          <div className="footer-main">
            <div className="footer-brand-block">
              <Link to="/" className="landing-brand" aria-label="Invoice Vault home"><Logo size="medium" /></Link>
              <p>A calmer place for your bills, invoices, and receipts.</p>
            </div>
            <div className="footer-nav-group">
              <h3>Explore</h3>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#preview">Product Preview</a>
              <a href="#security">Security</a>
            </div>
            <div className="footer-nav-group">
              <h3>Your account</h3>
              <Link to="/login">Sign In</Link>
              <Link to="/signup">Get Started</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Invoice Vault</span>
            <span>Made for a little more order.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Home;
