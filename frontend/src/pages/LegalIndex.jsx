import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/landing/Navbar';
import FooterSection from '../components/landing/FooterSection';
import EyebrowLabel from '../components/landing/EyebrowLabel';

const POLICIES = [
  { id: 'acceptable_use_policy', title: 'Acceptable Use Policy' },
  { id: 'client_agreement', title: 'Client Agreement' },
  { id: 'cookie_policy', title: 'Cookie Policy' },
  { id: 'copyright_and_intellectual_property', title: 'Copyright and Intellectual Property' },
  { id: 'data_processing_agreement', title: 'Data Processing Agreement' },
  { id: 'definitions', title: 'Definitions' },
  { id: 'privacy_policy', title: 'Privacy Policy' },
  { id: 'provider_agreement', title: 'Provider Agreement' },
  { id: 'refund_cancelllation_policy', title: 'Refund & Cancellation Policy' },
  { id: 'security_policy', title: 'Security Policy' },
  { id: 'service_level_agreement', title: 'Service Level Agreement' },
  { id: 'terms_of_service', title: 'Terms of Service' },
  { id: 'vulnerability_disclosure', title: 'Vulnerability Disclosure' }
];

export default function LegalIndex() {
  return (
    <div className="landing-page" style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '120px 24px 80px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ marginBottom: '32px' }}>
            <Link to="/" className="lp-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', fontSize: '15px', color: 'var(--lp-midnight-ink)' }}>
              &larr; Back to Home
            </Link>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '16px 0 32px', letterSpacing: '-1px' }}>
            Policies & Agreements
          </h1>
          <p style={{ color: 'var(--lp-slate-caption)', fontSize: '16px', lineHeight: '1.6', marginBottom: '40px' }}>
            Review our policies, terms, and agreements regarding your use of the UniGPU platform as a client or provider.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {POLICIES.map((policy) => (
              <li key={policy.id}>
                <Link
                  to={`/legal/${policy.id}`}
                  style={{
                    display: 'block',
                    padding: '20px',
                    backgroundColor: 'var(--lp-snow-canvas)',
                    border: '1px solid var(--lp-stone-divider)',
                    borderRadius: '12px',
                    color: 'var(--lp-midnight-ink)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '15px',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--lp-royal-signal)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 90, 255, 0.08)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--lp-stone-divider)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {policy.title}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </main>
      <FooterSection />
    </div>
  );
}
