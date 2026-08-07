import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};



export default function HeroSection() {
  return (
    <section id="top" className="lp-hero" aria-label="Hero">
      <div className="lp-hero__band">
        <motion.div
          className="lp-hero__inner"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >

          {/* Headline */}
          <motion.h1 className="lp-hero__headline" variants={childVariants}>
            Turn Idle GPUs into{' '}
            <span className="lp-hero__headline-accent">Shared Compute.</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p className="lp-hero__subhead" variants={childVariants}>
            Rent powerful GPUs on demand, or turn your idle hardware into income. One open network connecting builders with the compute they need.
          </motion.p>


        </motion.div>


      </div>
    </section>
  );
}
