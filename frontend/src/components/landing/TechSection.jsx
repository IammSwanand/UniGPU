import { motion } from 'framer-motion';
import EyebrowLabel from './EyebrowLabel';
import CodeWindow from './CodeWindow';

const techChips = [
  'FastAPI', 'Docker', 'Redis', 'Celery',
  'PostgreSQL', 'WebSockets', 'NVIDIA Runtime', 'Python',
];

function ArchWindow() {
  return (
    <CodeWindow filename="architecture.py">
      <span className="lp-tok-comment"># UniGPU — distributed execution stack</span>
      {'\n\n'}
      <span className="lp-tok-keyword">from</span>
      <span className="lp-tok-string"> fastapi </span>
      <span className="lp-tok-keyword">import</span>
      <span className="lp-tok-string"> FastAPI, WebSocket</span>
      {'\n'}
      <span className="lp-tok-keyword">from</span>
      <span className="lp-tok-string"> celery </span>
      <span className="lp-tok-keyword">import</span>
      <span className="lp-tok-string"> Celery</span>
      {'\n'}
      <span className="lp-tok-keyword">import</span>
      <span className="lp-tok-string"> docker, redis</span>
      {'\n\n'}
      <span className="lp-tok-comment"># Client submits workload → FastAPI → Celery queue</span>
      {'\n'}
      <span className="lp-tok-keyword">@app</span>
      <span className="lp-tok-output">.post(</span>
      <span className="lp-tok-string">"/jobs"</span>
      <span className="lp-tok-output">)</span>
      {'\n'}
      <span className="lp-tok-keyword">async def</span>
      <span className="lp-tok-output"> submit_job(script: UploadFile):</span>
      {'\n'}
      <span className="lp-tok-muted">    </span>
      <span className="lp-tok-output">job = await queue.enqueue(script)</span>
      {'\n'}
      <span className="lp-tok-muted">    </span>
      <span className="lp-tok-keyword">return</span>
      <span className="lp-tok-output"> {'{'}job.id, status: </span>
      <span className="lp-tok-string">"queued"</span>
      <span className="lp-tok-output">{'}'}</span>
      {'\n\n'}
      <span className="lp-tok-comment"># Agent executes inside isolated Docker container</span>
      {'\n'}
      <span className="lp-tok-output">container = docker.run(</span>
      {'\n'}
      <span className="lp-tok-muted">    </span>
      <span className="lp-tok-string">"nvidia/cuda:12.0"</span>
      <span className="lp-tok-output">, runtime=</span>
      <span className="lp-tok-string">"nvidia"</span>
      {'\n'}
      <span className="lp-tok-output">)</span>
    </CodeWindow>
  );
}

export default function TechSection() {
  return (
    <section
      id="technology"
      className="lp-section"
      style={{ background: 'var(--lp-lavender-wash)' }}
      aria-labelledby="tech-heading"
    >
      <div className="lp-container">
        <div className="lp-section__header">
          <EyebrowLabel>Under the Hood</EyebrowLabel>
          <h2 id="tech-heading" className="lp-section__heading">
            Built using modern distributed systems.
          </h2>
          <p className="lp-section__desc">
            UniGPU combines FastAPI, PostgreSQL, Redis, Celery, Docker, and WebSockets
            to orchestrate secure GPU execution across a decentralized network.
          </p>
        </div>

        {/* Architecture code window */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{ marginBottom: '40px' }}
        >
          <ArchWindow />
        </motion.div>

        {/* Tech chips */}
        <motion.div
          className="lp-tech__chips"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
          aria-label="Technologies used"
        >
          {techChips.map((chip) => (
            <span key={chip} className="lp-tech__chip">
              {chip}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
