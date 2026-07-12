import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import EyebrowLabel from './EyebrowLabel';

/** Realistic job-submission UI mockup — no placeholder images */
function JobMockup() {
  return (
    <div className="lp-mockup-job" aria-label="Job submission mockup">
      <div className="lp-mockup-job__header">
        <span className="lp-mockup-job__title">New Workload</span>
        <span className="lp-mockup-job__status">Running</span>
      </div>

      {/* File row */}
      <div className="lp-mockup-job__file">
        <div className="lp-mockup-job__file-icon" aria-hidden="true">
          <svg viewBox="0 0 14 14" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L8 1z" />
            <path d="M8 1v4h4" />
          </svg>
        </div>
        <span className="lp-mockup-job__file-name">train.py</span>
        <span className="lp-mockup-job__file-size">2.4 KB</span>
      </div>

      {/* Details */}
      <div className="lp-mockup-job__row">
        <span className="lp-mockup-job__row-label">GPU</span>
        <span className="lp-mockup-job__row-value">NVIDIA RTX 4060</span>
      </div>
      <div className="lp-mockup-job__row">
        <span className="lp-mockup-job__row-label">Runtime</span>
        <span className="lp-mockup-job__row-value">Docker + NVIDIA</span>
      </div>
      <div className="lp-mockup-job__row">
        <span className="lp-mockup-job__row-label">Status</span>
        <span
          className="lp-mockup-job__row-value"
          style={{ color: 'var(--lp-royal-signal)' }}
        >
          Epoch 14 / 20
        </span>
      </div>

      {/* Progress */}
      <div className="lp-mockup-job__progress">
        <div className="lp-mockup-job__progress-label">
          <span>Training progress</span>
          <span>68%</span>
        </div>
        <div className="lp-mockup-job__progress-bar" role="progressbar" aria-valuenow={68} aria-valuemin={0} aria-valuemax={100}>
          <div className="lp-mockup-job__progress-fill" />
        </div>
      </div>
    </div>
  );
}

export default function ClientSection() {
  return (
    <section id="clients" className="lp-section" aria-labelledby="client-heading">
      <div className="lp-container">
        <div className="lp-feature-container">
          <div className="lp-split">
            {/* Text */}
            <motion.div
              className="lp-split__text"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <EyebrowLabel>For Clients</EyebrowLabel>
              <h2 id="client-heading" className="lp-split__heading">
                Compute without owning expensive hardware.
              </h2>
              <p className="lp-split__body">
                Run machine learning training, inference, simulations, or data processing
                without investing in high-end GPUs. Perfect for students, researchers,
                developers, and hackathon teams.
              </p>
              <Link to="/register?role=client" className="lp-btn-ghost">
                Rent Compute
              </Link>
            </motion.div>

            {/* Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
            >
              <JobMockup />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
