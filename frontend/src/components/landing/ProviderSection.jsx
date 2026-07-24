import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import EyebrowLabel from './EyebrowLabel';
import CodeWindow from './CodeWindow';

function AgentInstallWindow() {
  return (
    <CodeWindow filename="install.sh">
      <span className="lp-tok-comment"># Install the UniGPU Agent on your machine</span>
      {'\n\n'}
      <span className="lp-tok-prompt">$ </span>
      <span className="lp-tok-keyword">pip</span>
      <span className="lp-tok-string"> install unigpu-agent</span>
      {'\n\n'}
      <span className="lp-tok-prompt">$ </span>
      <span className="lp-tok-keyword">unigpu-agent</span>
      <span className="lp-tok-string"> register</span>
      {'\n'}
      <span className="lp-tok-muted">  Provider token: </span>
      <span className="lp-tok-output">prov_••••••••••••••••</span>
      {'\n\n'}
      <span className="lp-tok-prompt">$ </span>
      <span className="lp-tok-keyword">unigpu-agent</span>
      <span className="lp-tok-string"> start</span>
      {'\n\n'}
      <span className="lp-tok-success">✓ </span>
      <span className="lp-tok-output">Connected to UniGPU network</span>
      {'\n'}
      <span className="lp-tok-success">✓ </span>
      <span className="lp-tok-output">GPU detected — NVIDIA RTX 3080 / AMD RX 7900</span>
      {'\n'}
      <span className="lp-tok-success">✓ </span>
      <span className="lp-tok-output">Heartbeat active — listening for jobs...</span>
      {'\n\n'}
      <span className="lp-tok-comment"># Your GPU is now earning credits automatically</span>
    </CodeWindow>
  );
}

export default function ProviderSection() {
  return (
    <section id="providers" className="lp-section" aria-labelledby="provider-heading">
      <div className="lp-container">
        <div className="lp-feature-container">
          <div className="lp-split lp-split--reverse">
            {/* Code Window */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <AgentInstallWindow />
            </motion.div>

            {/* Text */}
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
              <Link to="/register?role=provider" className="lp-btn-ghost">
                Provide Compute
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
