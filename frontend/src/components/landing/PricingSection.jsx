import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import EyebrowLabel from './EyebrowLabel';
import { SCROLL_TINTS } from '../../lib/lerpColor';
import { useIsMobile } from '../../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

const PricingMeter = lazy(() => import('./PricingMeter'));

const TIERS = [
  { gpu: 'RTX 3060 / 4060', rate: '₹2.40/hr' },
  { gpu: 'RTX 3080 / 4070', rate: '₹4.80/hr' },
  { gpu: 'RTX 4090 / A100', rate: '₹9.60/hr' },
];

export default function PricingSection() {
  const sectionRef = useRef(null);
  const isMobile = useIsMobile();
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 70%',
        end: 'bottom 50%',
        scrub: true,
        onUpdate: (self) => setFill(self.progress),
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="lp-section lp-pricing-v2"
      data-bg-tint={SCROLL_TINTS.lavender}
      aria-labelledby="pricing-heading"
    >
      <div className="lp-container">
        <div className="lp-section__header">
          <EyebrowLabel>Pricing</EyebrowLabel>
          <h2 id="pricing-heading" className="lp-section__heading">
            Pay only for the seconds you use.
          </h2>
        </div>

        <div className="lp-pricing-v2__layout">
          {!isMobile && (
            <Suspense fallback={<div className="lp-pricing-meter lp-pricing-meter--fallback" />}>
              <PricingMeter fill={fill} />
            </Suspense>
          )}

          <div className="lp-pricing-v2__details">
            <p className="lp-pricing-v2__lead">
              Usage-based billing with no subscriptions, reserved instances, or hidden charges.
              Providers earn credits for completed workloads.
            </p>

            <ul className="lp-pricing-v2__tiers" aria-label="Example hourly rates">
              {TIERS.map(({ gpu, rate }) => (
                <li key={gpu} className="lp-pricing-v2__tier">
                  <span className="lp-pricing-v2__tier-gpu">{gpu}</span>
                  <span className="lp-pricing-v2__tier-rate">{rate}</span>
                </li>
              ))}
            </ul>

            <Link to="/register" className="lp-btn-ghost">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
