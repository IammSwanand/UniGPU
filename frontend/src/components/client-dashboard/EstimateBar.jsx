/**
 * EstimateBar — Estimated Runtime / Cost / Queue Time.
 *
 * The backend does not currently provide runtime, cost, or queue-time
 * estimates (it charges a flat ₹0.002/s only AFTER a job completes, and
 * exposes no pre-execution prediction). Rather than fabricate numbers —
 * which would violate the design doc's explicit "never fake execution"
 * rule — these three cells render as "Coming soon".
 *
 * docs/client-db-design.md lists these as part of the Submit Area; this
 * component is the honest placeholder until the backend exposes real
 * estimates.
 */
export default function EstimateBar() {
  return (
    <div className="cd-estimate" aria-label="Execution estimates">
      <div className="cd-estimate__cell">
        <div className="cd-estimate__label">Estimated Runtime</div>
        <div className="cd-estimate__value">—</div>
        <span className="cd-coming" style={{ marginTop: 4 }}>Coming soon</span>
      </div>
      <div className="cd-estimate__cell">
        <div className="cd-estimate__label">Estimated Cost</div>
        <div className="cd-estimate__value">—</div>
        <span className="cd-coming" style={{ marginTop: 4 }}>Coming soon</span>
      </div>
      <div className="cd-estimate__cell">
        <div className="cd-estimate__label">Estimated Queue Time</div>
        <div className="cd-estimate__value">—</div>
        <span className="cd-coming" style={{ marginTop: 4 }}>Coming soon</span>
      </div>
    </div>
  );
}
