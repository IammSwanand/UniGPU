import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useInView, animate } from 'framer-motion';

const AnimatedNumber = ({ value, appendPlus, trigger }) => {
  const count = useMotionValue(0);
  
  const display = useTransform(count, (latest) => {
    const formatted = Math.floor(latest).toLocaleString();
    return appendPlus ? `${formatted}+` : formatted;
  });

  useEffect(() => {
    if (trigger && value !== null && value !== undefined) {
      const controls = animate(count, value, {
        type: "spring",
        mass: 1,
        stiffness: 60,
        damping: 15,
      });
      return () => controls.stop();
    }
  }, [trigger, value, count]);

  if (value === null || value === undefined) return <span>Coming Soon</span>;
  return <motion.span>{display}</motion.span>;
};
import EyebrowLabel from './EyebrowLabel';
import StatusChip from './StatusChip';
import api from '../../api/client';

const audiences = [
  'Students', 'AI Engineers', 'ML Engineers', 'Researchers',
  'University Clubs', 'Hackathon Teams', 'Open Source Contributors',
];

export default function CommunitySection() {
  const [stats, setStats] = useState(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-10%" });

  useEffect(() => {
    api.getPlatformStats()
      .then(data => setStats(data))
      .catch(err => console.error("Failed to fetch platform stats:", err));
  }, []);

  const displayStats = [
    { label: 'Registered GPUs', value: stats ? stats.registered_gpus : null, appendPlus: false },
    { label: 'Jobs Completed', value: stats ? stats.jobs_completed : null, appendPlus: true },
    { label: 'Compute Hours', value: stats ? stats.compute_hours : null, appendPlus: true },
    { label: 'Credits Earned', value: stats ? stats.credits_earned : null, appendPlus: true },
  ];

  return (
    <section id="community" className="lp-section" aria-labelledby="community-heading" ref={sectionRef}>
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
                {displayStats.map(({ label, value, appendPlus }) => (
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
                        fontFamily: 'var(--font-sans)',
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: '#333333',
                        margin: 0,
                        lineHeight: 1,
                      }}
                    >
                      <AnimatedNumber value={value} appendPlus={appendPlus} trigger={isInView} />
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
