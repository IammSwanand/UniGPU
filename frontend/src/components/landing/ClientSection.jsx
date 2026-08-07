import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import EyebrowLabel from './EyebrowLabel';

export default function ClientSection() {
  return (
    <section id="clients-providers" className="lp-section" aria-labelledby="client-heading">
      <div className="lp-container">
        <div className="lp-feature-container">
          <div className="lp-split">
            {/* Clients Text */}
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
              <Link to="/register?role=client" className="lp-btn-ghost" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                Rent Compute
              </Link>
            </motion.div>

            {/* Providers Text */}
            <motion.div
              className="lp-split__text"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
            >
              <EyebrowLabel>For Providers</EyebrowLabel>
              <h2 id="provider-heading" className="lp-split__heading">
                Put your idle GPU to work.
              </h2>
              <p className="lp-split__body">
                Install the UniGPU Agent once. When your GPU is available, UniGPU
                automatically assigns workloads, executes them securely inside Docker
                containers, and rewards you with credits based on execution time.
              </p>
              <Link to="/register?role=provider" className="lp-btn-ghost" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                Provide Compute
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
