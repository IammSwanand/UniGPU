import { motion } from 'framer-motion';
import EyebrowLabel from './EyebrowLabel';
import StatusChip from './StatusChip';

const audiences = [
  'Students', 'AI Engineers', 'ML Engineers', 'Researchers',
  'University Clubs', 'Hackathon Teams', 'Open Source Contributors',
];

export default function CommunitySection() {
  return (
    <section id="community" className="lp-section" aria-labelledby="community-heading">
      <div className="lp-container">
        <div className="lp-feature-container">
          <div className="lp-split">
            {/* Left: text */}
            <motion.div
              className="lp-split__text"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <EyebrowLabel>Built for Developers</EyebrowLabel>
              <h2 id="community-heading" className="lp-split__heading">
                Designed for students.<br />
                Built for compute.
              </h2>
              <p className="lp-split__body">
                Whether you're training machine learning models, participating in hackathons,
                conducting research, or experimenting with AI, UniGPU provides affordable
                access to GPU resources through a distributed marketplace.
              </p>
              <div className="lp-community__tags" aria-label="Target audiences" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '24px' }}>
                {audiences.map((a) => (
                  <StatusChip key={a} variant="neutral">{a}</StatusChip>
                ))}
              </div>
            </motion.div>

            {/* Right: metric cards mockup */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
                aria-label="Platform statistics preview"
              >
                {[
                  { label: 'Active GPUs', value: 'Coming Soon', unit: '' },
                  { label: 'Jobs Completed', value: 'Coming Soon', unit: '' },
                  { label: 'Compute Hours', value: 'Coming Soon', unit: '' },
                  { label: 'Credits Earned', value: 'Coming Soon', unit: '' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="lp-product-card"
                    style={{ padding: '20px 18px' }}
                  >
                    <p
                      style={{
                        fontFamily: 'var(--lp-font-inter)',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        color: 'var(--lp-ash-helper)',
                        margin: '0 0 8px',
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--lp-font-inter)',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--lp-royal-signal)',
                        margin: 0,
                      }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
