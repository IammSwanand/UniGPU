import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import EyebrowLabel from './EyebrowLabel';
import { SCROLL_TINTS } from '../../lib/lerpColor';
import useReducedMotion from '../../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

const LAYERS = [
  { label: 'Your workload', z: 60, color: '#145aff' },
  { label: 'Docker sandbox', z: 40, color: '#374151' },
  { label: 'GPU driver', z: 20, color: '#6b7280' },
  { label: 'Hardware', z: 0, color: '#14141e' },
];

export default function SecuritySandbox() {
  const sectionRef = useRef(null);
  const stackRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!stackRef.current) return;

      if (reducedMotion) {
        gsap.from(stackRef.current.children, {
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
          opacity: 0,
          y: 20,
          stagger: 0.1,
          duration: 0.5,
        });
        return;
      }

      gsap.fromTo(
        stackRef.current.children,
        { z: 0, rotateX: 0, opacity: 0.6 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            end: 'center center',
            scrub: 1,
          },
          z: (i) => LAYERS[i].z,
          rotateX: -8,
          opacity: 1,
          stagger: 0.05,
          ease: 'none',
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="security"
      className="lp-section lp-security"
      data-bg-tint={SCROLL_TINTS.canvas}
      aria-labelledby="security-heading"
    >
      <div className="lp-container lp-security__inner">
        <div className="lp-security__copy">
          <EyebrowLabel>Security</EyebrowLabel>
          <h2 id="security-heading" className="lp-section__heading">
            Every workload runs inside Docker.
          </h2>
          <p className="lp-section__desc">
            Workloads never touch the host filesystem directly. The UniGPU agent pulls your
            package, builds an isolated container, mounts only what the job needs, and tears
            everything down when execution finishes.
          </p>
          <p className="lp-section__desc">
            Providers keep control — they choose when to go online, which GPUs to expose, and
            can revoke access at any time. Clients get reproducible environments without managing
            infrastructure.
          </p>
        </div>

        <div className="lp-security__visual">
          <div ref={stackRef} className="lp-security__stack">
            {LAYERS.map((layer) => (
              <div
                key={layer.label}
                className="lp-security__layer"
                style={{ '--layer-accent': layer.color }}
              >
                <span className="lp-security__layer-label">{layer.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
