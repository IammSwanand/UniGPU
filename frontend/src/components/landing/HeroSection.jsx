import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const childVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const metrics = [
  { value: '10×', label: 'Cheaper than cloud' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<30s', label: 'Cold start' },
];

export default function HeroSection() {
  return (
    <section id="top" className="lp-hero" aria-label="Hero">
      {/* Ambient background orbs */}
      <div className="lp-hero__orb lp-hero__orb--1" aria-hidden="true" />
      <div className="lp-hero__orb lp-hero__orb--2" aria-hidden="true" />
      <div className="lp-hero__orb lp-hero__orb--3" aria-hidden="true" />

      <div className="lp-hero__band">
        <motion.div
          className="lp-hero__inner"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Headline */}
          <motion.h1 className="lp-hero__headline" variants={childVariants}>
            Turn Idle GPUs into
            <br />
            <span className="lp-hero__headline-accent">Shared Compute.</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p className="lp-hero__subhead" variants={childVariants}>
            Democritizing Compute for all!!
          </motion.p>

          {/* CTAs */}
          <motion.div className="lp-hero__ctas" variants={childVariants}>
            <Link to="/register?role=client" className="lp-btn-primary">
              Rent Compute
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link to="/register?role=provider" className="lp-btn-ghost">
              Provide a GPU
            </Link>
          </motion.div>

          {/* Trust metrics */}
          <motion.div className="lp-hero__metrics" variants={childVariants}>
            {metrics.map((m, i) => (
              <div key={i} className="lp-hero__metric">
                <span className="lp-hero__metric-value">{m.value}</span>
                <span className="lp-hero__metric-label">{m.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div className="lp-hero__scroll" variants={childVariants}>
            <div className="lp-hero__scroll-mouse">
              <div className="lp-hero__scroll-wheel" />
            </div>
            <span className="lp-hero__scroll-text">Scroll</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
