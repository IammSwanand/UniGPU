import { useState, useEffect } from 'react';
import { IconClose, IconCheck } from './icons';
import { statusInfo } from './utils';
import ArtifactsPanel from './ArtifactsPanel';

/**
 * WorkloadDrawer — right-side drawer opened by clicking a row in the
 * Recent Workloads table.
 *
 * Per docs/client-db-design.md § Workload Details: "Clicking row opens
 * side drawer" with tabs Overview, Timeline, Environment, GPU, Logs,
 * Artifacts, Billing.
 *
 * Only Overview (real JobOut fields) and Logs (fetched from /logs) have
 * real backend data. All other tabs are locked and shown as "Coming soon",
 * following the "never fake execution" principle.
 *
 * Props:
 *  - job        : JobOut | null (null = closed)
 *  - logs       : string (from the parent's log-fetch state)
 *  - logsLoading: boolean
 *  - onFetchLogs(jobId): trigger log fetch
 *  - onClose()
 */

const TABS = [
  { key: 'overview', label: 'Overview', live: true },
  { key: 'timeline', label: 'Timeline', live: false },
  { key: 'environment', label: 'Environment', live: false },
  { key: 'gpu', label: 'GPU', live: true },
  { key: 'logs', label: 'Logs', live: true },
  { key: 'artifacts', label: 'Artifacts', live: true },
  { key: 'billing', label: 'Billing', live: false },
];

export default function WorkloadDrawer({ job, onClose, availableGPUs = [], isProvider = false }) {
  if (!job) return null;
  // Mount a fresh panel per job (keyed by id) so internal tab state resets
  // automatically — no setState-in-effect needed.
  return (
    <WorkloadDrawerInner 
      key={job.id} 
      job={job} 
      onClose={onClose} 
      availableGPUs={availableGPUs} 
      isProvider={isProvider}
    />
  );
}

function WorkloadDrawerInner({ job, onClose, availableGPUs, isProvider }) {
  const [tab, setTab] = useState('overview');

  const visibleTabs = TABS.filter(t => {
    if (isProvider && t.key === 'artifacts') return false;
    return true;
  });

  // Lock body scroll while drawer is open.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const si = statusInfo(job.status);
  const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

  return (
    <div className="cd-modal" role="dialog" aria-label="Workload details">
      <div className="cd-modal__scrim" onClick={onClose} />
      <div className="cd-modal__panel">
        
        {/* Left Sidebar */}
        <div className="cd-modal__sidebar">
          <div className="cd-modal__head">
            <h3 className="cd-modal__title">
              {job.script_path?.split('/').pop() || job.id.slice(0, 8)}
            </h3>
          </div>
          
          <div className="cd-modal__tabs" role="tablist">
            {visibleTabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                className={`cd-modal__tab ${tab === t.key ? 'cd-modal__tab--active' : ''} ${!t.live ? 'cd-modal__tab--locked' : ''}`}
                disabled={!t.live}
                title={!t.live ? 'Coming soon' : undefined}
                onClick={() => t.live && setTab(t.key)}
              >
                {t.label}
                {!t.live && <span className="cd-coming" style={{ marginLeft: 'auto' }}>Soon</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="cd-modal__content">
          <div className="cd-modal__body">
          {/* ── Overview (real data) ── */}
          {tab === 'overview' && (
            <div className="cd-detail-grid">
              <div className="cd-detail-row">
                <span className="cd-detail-row__label">Script</span>
                <span className="cd-detail-row__value">{job.script_path?.split('/').pop() || '—'}</span>
              </div>
              <div className="cd-detail-row">
                <span className="cd-detail-row__label">Status</span>
                <span className={`cd-status ${si.cls}`}>{si.label}</span>
              </div>
              <div className="cd-detail-row">
                <span className="cd-detail-row__label">Submitted</span>
                <span className="cd-detail-row__value">{fmt(job.created_at)}</span>
              </div>
              <div className="cd-detail-row">
                <span className="cd-detail-row__label">Started</span>
                <span className="cd-detail-row__value">{fmt(job.started_at)}</span>
              </div>
              <div className="cd-detail-row">
                <span className="cd-detail-row__label">Completed</span>
                <span className="cd-detail-row__value">{fmt(job.completed_at)}</span>
              </div>
              <div className="cd-detail-row">
                <span className="cd-detail-row__label">Job ID</span>
                <span className="cd-detail-row__value cd-detail-row__value--mono">{job.id}</span>
              </div>
            </div>
          )}

          {/* ── GPU ── */}
          {tab === 'gpu' && (
            <div className="cd-detail-grid">
              {(() => {
                if (!job.gpu_id) {
                  return (
                    <div className="cd-detail-row" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--lp-ash-helper)' }}>
                      No specific GPU was selected (Auto-scheduled).
                    </div>
                  );
                }
                const gpu = availableGPUs.find((g) => g.id === job.gpu_id);
                if (!gpu) {
                  return (
                    <div className="cd-detail-row" style={{ gridColumn: '1 / -1' }}>
                      <span className="cd-detail-row__label">GPU ID</span>
                      <span className="cd-detail-row__value cd-detail-row__value--mono">{job.gpu_id}</span>
                      <div style={{ marginTop: '10px', color: 'var(--lp-ash-helper)', fontSize: '13px' }}>
                        Additional details unavailable (GPU may be offline).
                      </div>
                    </div>
                  );
                }
                return (
                  <>
                    <div className="cd-detail-row">
                      <span className="cd-detail-row__label">Model</span>
                      <span className="cd-detail-row__value">{gpu.name}</span>
                    </div>
                    <div className="cd-detail-row">
                      <span className="cd-detail-row__label">VRAM</span>
                      <span className="cd-detail-row__value cd-detail-row__value--mono">{(gpu.vram_mb / 1024).toFixed(0)} GB</span>
                    </div>
                    <div className="cd-detail-row">
                      <span className="cd-detail-row__label">CUDA Version</span>
                      <span className="cd-detail-row__value cd-detail-row__value--mono">{gpu.cuda_version || 'N/A'}</span>
                    </div>
                    <div className="cd-detail-row">
                      <span className="cd-detail-row__label">GPU ID</span>
                      <span className="cd-detail-row__value cd-detail-row__value--mono">{gpu.id}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* ── Logs (inline from JobOut) ── */}
          {tab === 'logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {job.logs ? (
                <pre
                  style={{
                    background: 'var(--lp-ink)',
                    color: '#e2e8f0',
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    overflowY: 'auto',
                    maxHeight: 340,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {job.logs}
                </pre>
              ) : (
                <div className="cd-locked-panel">
                  <p style={{ color: 'var(--lp-ash-helper)' }}>
                    {job.status === 'completed' || job.status === 'failed'
                      ? 'No logs were captured for this job.'
                      : 'Logs will appear once execution begins.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Artifacts ── */}
          {tab === 'artifacts' && <ArtifactsPanel job={job} />}

          {/* ── All other tabs: Coming soon ── */}
          {tab !== 'overview' && tab !== 'gpu' && tab !== 'logs' && tab !== 'artifacts' && (
            <div className="cd-locked-panel">
              <IconCheck style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.2 }} />
              <p>
                <strong>{tab.charAt(0).toUpperCase() + tab.slice(1)}</strong> details are not yet available.
              </p>
              <span className="cd-coming" style={{ marginTop: 8 }}>Coming soon</span>
            </div>
          )}
          </div>
          {/* Footer actions */}
          <div className="cd-modal__footer">
            <button className="cd-btn cd-btn--outline" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
