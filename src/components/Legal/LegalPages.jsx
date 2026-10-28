import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import Logo from '../Common/Logo';
import './LegalPages.css';

const LegalPage = ({ eyebrow, title, intro, updated, children }) => (
  <main className="legal-page">
    <header className="legal-header">
      <Link to="/" className="legal-brand" aria-label="InvoiceVault home">
        <Logo size="medium" />
      </Link>
      <Link to="/" className="legal-home-link">
        <FiArrowLeft aria-hidden="true" />
        Back to home
      </Link>
    </header>

    <section className="legal-hero">
      <span className="legal-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{intro}</p>
      {updated && <span className="legal-updated">Last updated: {updated}</span>}
    </section>

    <article className="legal-content">{children}</article>

    <footer className="legal-footer">
      <span>© {new Date().getFullYear()} InvoiceVault</span>
      <nav aria-label="Legal pages">
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/contact">Contact</Link>
      </nav>
    </footer>
  </main>
);

export const PrivacyPolicy = () => (
  <LegalPage
    eyebrow="YOUR PRIVACY MATTERS"
    title="Privacy Policy"
    intro="A clear overview of the information InvoiceVault uses to provide your document-management experience."
    updated="October 28, 2026"
  >
    <section>
      <h2>Information you provide</h2>
      <p>
        When you create an account, we use information such as your name and email address to
        identify your account. You may also choose to add profile details, invoice information,
        purchase records, notes, and document images.
      </p>
    </section>
    <section>
      <h2>How your information is used</h2>
      <p>
        InvoiceVault uses account and document information to provide sign-in, organize your
        records, show your dashboard, and respond to support requests. We do not display your
        private invoice records to other users.
      </p>
    </section>
    <section>
      <h2>Storage and service providers</h2>
      <p>
        The service uses Supabase for authentication and data storage. Information is processed
        to operate the features you request. Access to records should be controlled by the
        application’s database policies and your account permissions.
      </p>
    </section>
    <section>
      <h2>Sharing and disclosure</h2>
      <p>
        We do not sell your personal information. Information may be processed by service
        providers needed to run InvoiceVault, or disclosed when required by law or to protect
        the service and its users.
      </p>
    </section>
    <section>
      <h2>Retention and your choices</h2>
      <p>
        Your records are retained while needed to provide the service and maintain your account.
        You can manage information in your account settings. To ask about access, correction, or
        deletion, contact us using the details on our Contact page.
      </p>
    </section>
    <section>
      <h2>Security</h2>
      <p>
        We use the security controls available in our application and infrastructure to protect
        account information. No online service can guarantee absolute security; please keep your
        sign-in credentials private and contact us if you suspect unauthorized access.
      </p>
    </section>
    <section>
      <h2>Children’s privacy</h2>
      <p>
        InvoiceVault is not intended for children under 13, and we do not knowingly collect
        personal information from children under 13.
      </p>
    </section>
    <section>
      <h2>Changes to this policy</h2>
      <p>
        We may update this policy as the service changes. The revised date above indicates when
        the latest version was published.
      </p>
    </section>
  </LegalPage>
);

export const TermsOfService = () => (
  <LegalPage
    eyebrow="USING INVOICEVAULT"
    title="Terms of Service"
    intro="These terms explain the basic expectations for using InvoiceVault."
    updated="October 28, 2026"
  >
    <section>
      <h2>Using the service</h2>
      <p>
        You may use InvoiceVault to organize your own invoices, receipts, and purchase records.
        You are responsible for providing accurate account information and keeping your
        credentials secure.
      </p>
    </section>
    <section>
      <h2>Your content and responsibilities</h2>
      <p>
        You retain responsibility for the content you upload and must have the rights and
        permissions needed to store it. Do not upload unlawful content, attempt to access
        another person’s account, interfere with the service, or use InvoiceVault to violate
        another person’s rights.
      </p>
    </section>
    <section>
      <h2>Your account</h2>
      <p>
        You are responsible for activity performed through your account. Contact us promptly if
        you believe your account has been accessed without permission. We may restrict access
        when needed to protect users, investigate misuse, or comply with legal obligations.
      </p>
    </section>
    <section>
      <h2>Availability and changes</h2>
      <p>
        We work to keep InvoiceVault available, but features may change and interruptions may
        occur for maintenance or circumstances beyond our control. We may update or discontinue
        features as the service evolves.
      </p>
    </section>
    <section>
      <h2>No professional or financial advice</h2>
      <p>
        InvoiceVault is an organizational tool. It does not provide legal, tax, accounting, or
        financial advice. You are responsible for verifying your records and meeting any
        record-keeping obligations that apply to you.
      </p>
    </section>
    <section>
      <h2>Disclaimer</h2>
      <p>
        To the extent allowed by applicable law, the service is provided “as is” and “as
        available.” We do not guarantee that it will always be uninterrupted, error-free, or
        suitable for every purpose.
      </p>
    </section>
    <section>
      <h2>Updates and contact</h2>
      <p>
        We may revise these terms when the service or applicable requirements change. Continued
        use after updated terms are published means you accept the revised terms. For questions,
        visit our Contact page.
      </p>
    </section>
  </LegalPage>
);

export const ContactUs = () => (
  <LegalPage
    eyebrow="WE’RE HERE TO HELP"
    title="Contact Us"
    intro="Questions, feedback, or need help with your account? Reach out directly."
  >
    <section className="contact-owner-card">
      <div className="contact-owner-avatar" aria-hidden="true">MA</div>
      <div>
        <span className="legal-eyebrow">INVOICEVAULT CONTACT</span>
        <h2>Mirza Arif Ali Baig</h2>
        <p>For product support, account questions, or general feedback.</p>
      </div>
    </section>

    <section className="contact-details" aria-label="Contact details">
      <a href="mailto:imailarif1@gmail.com" className="contact-detail-card">
        <span className="contact-detail-icon"><FiMail aria-hidden="true" /></span>
        <span>
          <strong>Email</strong>
          <span>imailarif1@gmail.com</span>
        </span>
      </a>
      <a href="tel:+919505809122" className="contact-detail-card">
        <span className="contact-detail-icon"><FiPhone aria-hidden="true" /></span>
        <span>
          <strong>Phone</strong>
          <span>+91 95058 09122</span>
        </span>
      </a>
    </section>

    <section className="contact-response-note">
      <span className="contact-detail-icon"><FiMapPin aria-hidden="true" /></span>
      <div>
        <h2>Get in touch</h2>
        <p>
          Email is a good way to share details about an issue. Please avoid sending passwords,
          verification codes, or payment card information.
        </p>
      </div>
    </section>
  </LegalPage>
);
