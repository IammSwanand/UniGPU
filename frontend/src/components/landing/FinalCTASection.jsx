import { Link } from 'react-router-dom';
import { SCROLL_TINTS } from '../../lib/lerpColor';

export default function FinalCTASection() {
  return (
    <section
      className="lp-final-cta"
      data-bg-tint={SCROLL_TINTS.ink}
      aria-labelledby="final-cta-heading"
    >
      <div className="lp-container">
        <h2 id="final-cta-heading" className="lp-final-cta__heading">
          Ready to run your next workload?
        </h2>
        <p className="lp-final-cta__desc">
          Join the network as a client or provider — start in minutes.
        </p>
        <div className="lp-final-cta__actions">
          <Link to="/register?role=client" className="lp-btn-inverse">
            Get started
          </Link>
          <Link to="/register?role=provider" className="lp-btn-ghost lp-btn-ghost--on-dark">
            Provide compute
          </Link>
        </div>
      </div>
    </section>
  );
}
