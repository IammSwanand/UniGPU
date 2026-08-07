import { motion } from 'framer-motion';
import EyebrowLabel from './EyebrowLabel';

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



export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="lp-section"
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


      </div>
    </section>
  );
}
