import { motion } from 'framer-motion';
import EyebrowLabel from './EyebrowLabel';

const features = [
  {
    id: 'secure-containers',
    title: 'Secure Containers',
    body: 'Every workload executes inside an isolated Docker container using the NVIDIA Runtime.',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="14" height="9" rx="2" />
        <path d="M6 6V4a3 3 0 0 1 6 0v2" />
        <circle cx="9" cy="10.5" r="1.5" fill="currentColor" strokeWidth={0} style={{ color: 'var(--lp-royal-signal)' }} />
      </svg>
    ),
  },
  {
    id: 'automatic-scheduling',
    title: 'Automatic Scheduling',
    body: 'Jobs are automatically matched with available GPUs across the network.',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="7" />
        <path d="M9 5v4l3 2" />
      </svg>
    ),
  },
  {
    id: 'live-logs',
    title: 'Live Execution Logs',
    body: 'Monitor execution in real time with streamed logs from the provider machine.',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4h12M3 8h8M3 12h10" />
      </svg>
    ),
  },
  {
    id: 'wallet-billing',
    title: 'Wallet-based Billing',
    body: 'Pay only for compute consumed while providers earn credits for every completed workload.',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="14" height="10" rx="2" />
        <path d="M2 8h14" />
        <circle cx="13" cy="12" r="1" fill="currentColor" strokeWidth={0} style={{ color: 'var(--lp-royal-signal)' }} />
      </svg>
    ),
  },
  {
    id: 'distributed-network',
    title: 'Distributed GPU Network',
    body: 'Transform idle GPUs into shared infrastructure accessible to the community.',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="2" />
        <circle cx="3" cy="5" r="1.5" />
        <circle cx="15" cy="5" r="1.5" />
        <circle cx="3" cy="13" r="1.5" />
        <circle cx="15" cy="13" r="1.5" />
        <path d="M4.5 5.5L7 7.5M11 7.5l2.5-2M4.5 12.5L7 10.5M11 10.5l2.5 2" />
      </svg>
    ),
  },
  {
    id: 'realtime-comms',
    title: 'Real-time Communication',
    body: 'Persistent WebSocket connections keep providers online and workloads synchronized.',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9c0-3.87 3.13-7 7-7s7 3.13 7 7" />
        <path d="M5 9c0-2.21 1.79-4 4-4s4 1.79 4 4" />
        <circle cx="9" cy="9" r="1.5" />
      </svg>
    ),
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="lp-section" aria-labelledby="features-heading">
      <div className="lp-container">
        <div className="lp-section__header">
          <EyebrowLabel>Why UniGPU</EyebrowLabel>
          <h2 id="features-heading" className="lp-section__heading">
            Built for distributed GPU execution.
          </h2>
        </div>

        <div className="lp-features__grid">
          {features.map(({ id, title, body, icon }, i) => (
            <motion.article
              key={id}
              className="lp-feature-mini"
              aria-labelledby={`feature-${id}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.07 }}
            >
              <div className="lp-feature-mini__icon" aria-hidden="true">
                {icon}
              </div>
              <h3 id={`feature-${id}`} className="lp-feature-mini__title">
                {title}
              </h3>
              <p className="lp-feature-mini__body">{body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
