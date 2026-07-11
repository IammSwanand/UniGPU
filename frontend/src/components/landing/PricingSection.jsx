import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import EyebrowLabel from './EyebrowLabel';

const bullets = [
  'Pay only for execution time.',
  'Providers earn credits based on completed workloads.',
  'No subscriptions.',
  'No reserved instances.',
  'No hidden charges.',
];

export default function PricingSection() {
  return (
    <section id="pricing" className="lp-section" aria-labelledby="pricing-heading">
      <div className="lp-container">
        <div className="lp-section__header">
          <EyebrowLabel>Pricing</EyebrowLabel>
          <h2 id="pricing-heading" className="lp-section__heading">
            Simple usage-based billing.
          </h2>
        </div>

        <motion.div
          className="lp-pricing__card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {/* Big label */}
          <p
            style={{
              fontFamily: 'var(--lp-font-inter)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--lp-ash-helper)',
              marginBottom: '4px',
            }}
          >
            Execution time
          </p>
          <p
            style={{
              fontFamily: 'var(--lp-font-inter)',
              fontSize: '40px',
              fontWeight: 600,
              color: 'var(--lp-midnight-ink)',
              letterSpacing: '-1.48px',
              lineHeight: 1.05,
              margin: '0 0 4px',
            }}
          >
            Usage-based
          </p>
          <p
            style={{
              fontFamily: 'var(--lp-font-inter)',
              fontSize: '13px',
              color: 'var(--lp-ash-helper)',
              marginBottom: 0,
            }}
          >
            Billed per second of compute consumed
          </p>

          {/* Bullets */}
          <ul className="lp-pricing__bullets" aria-label="Pricing details">
            {bullets.map((b) => (
              <li key={b} className="lp-pricing__bullet">{b}</li>
            ))}
          </ul>

          {/* CTA */}
          <Link to="/register" className="lp-btn-ghost" style={{ alignSelf: 'center' }}>
            Get Started
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
