import { motion } from 'framer-motion';
import EyebrowLabel from './EyebrowLabel';
import CodeWindow from './CodeWindow';

const steps = [
  {
    number: '01',
    title: 'Upload',
    body: 'Upload your Python script together with an optional requirements.txt.',
  },
  {
    number: '02',
    title: 'Match',
    body: 'The scheduler automatically selects an available GPU from the network.',
  },
  {
    number: '03',
    title: 'Execute',
    body: 'The UniGPU Agent downloads your workload and executes it securely inside Docker.',
  },
  {
    number: '04',
    title: 'Monitor & Finish',
    body: 'Watch live logs, receive outputs, and pay only for the compute you used.',
  },
];

function ExecutionWindow() {
  return (
    <CodeWindow filename="agent.log">
      <span className="lp-tok-comment"># UniGPU Agent — execution pipeline</span>
      {'\n\n'}
      <span className="lp-tok-keyword">INFO</span>
      <span className="lp-tok-muted">  [scheduler]  </span>
      <span className="lp-tok-output">Job queued — waiting for available provider</span>
      {'\n'}
      <span className="lp-tok-keyword">INFO</span>
      <span className="lp-tok-muted">  [scheduler]  </span>
      <span className="lp-tok-output">Provider matched — ws://provider-a42.local</span>
      {'\n\n'}
      <span className="lp-tok-keyword">INFO</span>
      <span className="lp-tok-muted">  [agent]      </span>
      <span className="lp-tok-output">Pulling workload package...</span>
      {'\n'}
      <span className="lp-tok-keyword">INFO</span>
      <span className="lp-tok-muted">  [agent]      </span>
      <span className="lp-tok-output">Installing requirements.txt</span>
      {'\n'}
      <span className="lp-tok-keyword">INFO</span>
      <span className="lp-tok-muted">  [agent]      </span>
      <span className="lp-tok-output">Starting Docker container</span>
      {'\n\n'}
      <span className="lp-tok-success">✓</span>
      <span className="lp-tok-muted">  [runtime]    </span>
      <span className="lp-tok-string">Container live — NVIDIA RTX 4060 attached</span>
      {'\n\n'}
      <span className="lp-tok-output">Epoch  1  loss=0.042  acc=96.8%</span>
      {'\n'}
      <span className="lp-tok-output">Epoch  5  loss=0.029  acc=98.1%</span>
      {'\n'}
      <span className="lp-tok-output">Epoch 20  loss=0.012  acc=99.3%</span>
      {'\n\n'}
      <span className="lp-tok-success">✓</span>
      <span className="lp-tok-muted">  [billing]    </span>
      <span className="lp-tok-string">Session closed — 11m 42s billed</span>
    </CodeWindow>
  );
}

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="lp-section"
      style={{ background: 'var(--lp-lavender-wash)' }}
      aria-labelledby="how-heading"
    >
      <div className="lp-container">
        <div className="lp-section__header">
          <EyebrowLabel>How It Works</EyebrowLabel>
          <h2 id="how-heading" className="lp-section__heading">
            From upload to execution in four simple steps.
          </h2>
        </div>

        {/* Steps */}
        <div className="lp-steps" role="list">
          {steps.map(({ number, title, body }, i) => (
            <motion.div
              key={number}
              className="lp-step"
              role="listitem"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.38, ease: 'easeOut', delay: i * 0.09 }}
            >
              <div className="lp-step__number" aria-hidden="true">
                {number}
              </div>
              <h3 className="lp-step__title">{title}</h3>
              <p className="lp-step__body">{body}</p>
            </motion.div>
          ))}
        </div>

        {/* Code window proof */}
        <ExecutionWindow />
      </div>
    </section>
  );
}
