import React from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiLock, FiShield } from 'react-icons/fi';
import Logo from '../Common/Logo';

const AuthShowcase = () => (
  <aside className="auth-showcase">
    <Link to="/" className="auth-showcase-brand" aria-label="Invoice Vault home">
      <Logo size="medium" />
    </Link>
    <div className="auth-showcase-copy">
      <span className="auth-showcase-kicker">A clearer place for paperwork</span>
      <h2>Every document.<br /><span>Right where it belongs.</span></h2>
      <p>Bring your bills, invoices, and receipts together in one organized digital space.</p>
    </div>
    <div className="auth-art" aria-hidden="true">
      <div className="auth-art-glow" />
      <div className="auth-art-orbit" />
      <div className="auth-art-document auth-art-document-left"><FiFileText /></div>
      <div className="auth-art-document auth-art-document-right"><FiFileText /></div>
      <div className="auth-art-vault"><FiShield /><span className="auth-art-lock"><FiLock /></span></div>
    </div>
    <div className="auth-showcase-footer"><FiLock /> Your documents, beautifully organized.</div>
  </aside>
);

export default AuthShowcase;
