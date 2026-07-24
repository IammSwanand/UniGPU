import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EyebrowLabel from './EyebrowLabel';

const faqs = [
  {
    id: 'what-is',
    q: 'What is UniGPU?',
    a: 'UniGPU is a peer-to-peer GPU marketplace where students and developers can execute compute-intensive workloads using idle GPUs contributed by other users.',
  },
  {
    id: 'how-executed',
    q: 'How are workloads executed?',
    a: 'Every submitted workload runs inside an isolated Docker container with NVIDIA or AMD GPU runtime.',
  },
  {
    id: 'code-access',
    q: 'Can providers access my code?',
    a: 'Workloads are managed through the UniGPU Agent and executed inside isolated containers without requiring direct interaction from providers.',
  },
  {
    id: 'workloads',
    q: 'What workloads are supported?',
    a: 'Any Python-based workload that can execute inside Docker, including machine learning, AI inference, data processing, and scientific computing.',
  },
  {
    id: 'credits',
    q: 'How do providers earn credits?',
    a: 'Providers receive credits based on the execution time of completed workloads.',
  },
  {
    id: 'disconnect',
    q: 'What happens if a provider disconnects?',
    a: 'Heartbeat monitoring detects unavailable providers and pending workloads can be reassigned.',
  },
  {
    id: 'hardware',
    q: 'What hardware is required?',
    a: 'An NVIDIA or AMD GPU supporting CUDA/ROCm together with Docker and relevant GPU toolkits.',
  },
  {
    id: 'students-only',
    q: 'Is UniGPU only for students?',
    a: 'No. While UniGPU is designed with students in mind, anyone can participate as either a client or provider.',
  },
];

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lp-faq__item">
      <button
        className="lp-faq__trigger"
        aria-expanded={open}
        aria-controls={`faq-answer-${faq.id}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="lp-faq__question">{faq.q}</span>
        <svg
          className={`lp-faq__icon${open ? ' lp-faq__icon--open' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 4v12M4 10h12" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`faq-answer-${faq.id}`}
            className="lp-faq__answer"
            role="region"
            aria-label={faq.q}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="lp-faq__answer-inner">{faq.a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  return (
    <section id="faq" className="lp-section" aria-labelledby="faq-heading">
      <div className="lp-container">
        <div className="lp-section__header">
          <EyebrowLabel>FAQ</EyebrowLabel>
          <h2 id="faq-heading" className="lp-section__heading">
            Common questions.
          </h2>
        </div>

        <div className="lp-faq__list" role="list">
          {faqs.map((faq) => (
            <FAQItem key={faq.id} faq={faq} />
          ))}
        </div>
      </div>
    </section>
  );
}
