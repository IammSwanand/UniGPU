import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import StatusChip from './StatusChip';
import CodeWindow from './CodeWindow';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

function HeroTerminal() {
  return (
    <CodeWindow filename="terminal" animate={true}>
      <span className="lp-tok-prompt">$ </span>
      <span className="lp-tok-keyword">unigpu</span>
      <span className="lp-tok-string"> submit train.py</span>
      {'\n\n'}
      <span className="lp-tok-success">✓ </span>
      <span className="lp-tok-output">Upload complete</span>
      {'\n'}
      <span className="lp-tok-success">✓ </span>
      <span className="lp-tok-output">Matching available GPU...</span>
      {'\n'}
      <span className="lp-tok-success">✓ </span>
      <span className="lp-tok-output">NVIDIA / AMD GPU selected</span>
      {'\n'}
      <span className="lp-tok-success">✓ </span>
      <span className="lp-tok-output">Container started</span>
      {'\n\n'}
      <span className="lp-tok-comment">Streaming logs...</span>
      {'\n\n'}
      <span className="lp-tok-muted">Epoch 1/20     </span>
      <span className="lp-tok-output">Loss: </span>
      <span className="lp-tok-keyword">0.038</span>
      {'  '}
      <span className="lp-tok-output">Accuracy: </span>
      <span className="lp-tok-keyword">97.4%</span>
      {'\n\n'}
      <span className="lp-tok-success">✓ </span>
      <span className="lp-tok-string">Training Complete</span>
      {'  '}
      <span className="lp-tok-muted">Execution Time: </span>
      <span className="lp-tok-output">11m 42s</span>
    </CodeWindow>
  );
}

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
          {/* Eyebrow chip */}
          <motion.div className="lp-hero__chip-row" variants={childVariants}>
            <StatusChip variant="active">Peer-to-Peer GPU Compute</StatusChip>
          </motion.div>

          {/* Headline */}
          <motion.h1 className="lp-hero__headline" variants={childVariants}>
            Turn Idle GPUs into{' '}
            <span className="lp-hero__headline-accent">Shared Compute.</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p className="lp-hero__subhead" variants={childVariants}>
            Submit Python workloads and execute them on idle GPUs contributed by students.
            Secure Docker containers, live execution logs, automatic scheduling, and
            usage-based billing — all from one platform.
          </motion.p>

          {/* CTAs */}
          <motion.div className="lp-hero__ctas" variants={childVariants}>
            <Link to="/register?role=client" className="lp-btn-ghost">
              Rent Compute
            </Link>
            <Link to="/register?role=provider" className="lp-btn-ghost">
              Provide Compute
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero terminal */}
        <div className="lp-hero__terminal">
          <HeroTerminal />
        </div>
      </div>
    </section>
  );
}
