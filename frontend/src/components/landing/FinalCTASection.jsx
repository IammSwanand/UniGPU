import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function FinalCTASection() {
  return (
    <section className="lp-final-cta" aria-labelledby="final-cta-heading">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <h2 id="final-cta-heading" className="lp-final-cta__heading">
          Ready to share compute?
        </h2>
        <p className="lp-final-cta__desc">
          Join the UniGPU network and start executing workloads or earning credits today.
        </p>
        <div className="lp-final-cta__actions">
          <Link to="/register?role=client" className="lp-btn-inverse">
            Rent Compute
          </Link>
          <Link to="/register?role=provider" className="lp-btn-ghost">
            Provide Compute
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
