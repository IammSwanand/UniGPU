import { IconCpu } from './icons';

/**
 * GpuNetworkStrip — single horizontal strip directly below the navbar.
 *
 * Per docs/client-db-design.md § GPU Network Strip: "Not cards. Single
 * horizontal strip." Gives the user confidence that compute is available.
 *
 * Online GPU count is real (from /gpus/available). Average Queue Time is
 * not available from the backend and is shown as "Coming soon" rather than
 * fabricated (per the doc's "never fake execution" rule).
 */
export default function GpuNetworkStrip({ availableGPUs }) {
  const count = availableGPUs.length;
  const hasCompute = count > 0;

  return (
    <section className="cd-gpu-strip" aria-label="GPU network status">
      <span className="cd-gpu-strip__metric">
        <span className={`cd-gpu-strip__dot ${hasCompute ? '' : 'cd-gpu-strip__dot--off'}`} />
        <strong>{count}</strong>&nbsp;GPUs Online
      </span>

      <span className="cd-gpu-strip__divider" />

      <span className="cd-gpu-strip__metric">
        Average Queue
        <span className="cd-coming">Coming soon</span>
      </span>

      <span className="cd-gpu-strip__divider" />

      <span className="cd-gpu-strip__metric">
        <IconCpu style={{ width: 15, height: 15, color: 'var(--lp-ash-helper)' }} />
        Running Workloads
        <span className="cd-coming">Coming soon</span>
      </span>

      {hasCompute ? (
        <span className="cd-gpu-strip__pill cd-gpu-strip__coming" style={{ marginLeft: 'auto' }}>
          Scheduler Healthy
        </span>
      ) : (
        <span className="cd-coming" style={{ marginLeft: 'auto' }}>No providers online</span>
      )}
    </section>
  );
}
