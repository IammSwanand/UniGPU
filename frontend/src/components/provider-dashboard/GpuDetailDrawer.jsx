import { useState, useEffect } from 'react';
import { IconCheck } from '../client-dashboard/icons';

const TABS = [
  { key: 'overview', label: 'Overview', live: true },
  { key: 'hardware', label: 'Hardware', live: true },
  { key: 'software', label: 'Software', live: true },
  { key: 'heartbeat', label: 'Heartbeat', live: true },
  { key: 'current', label: 'Current Workload', live: true },
];

export default function GpuDetailDrawer({ gpu, metrics, activeJob, onClose }) {
  if (!gpu) return null;
  return <DrawerPanel gpu={gpu} metrics={metrics || {}} activeJob={activeJob} onClose={onClose} />;
}

function DrawerPanel({ gpu, metrics, activeJob, onClose }) {
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="cd-modal" role="dialog" aria-label="GPU details">
      <div className="cd-modal__scrim" onClick={onClose} />
      <div className="cd-modal__panel">
        
        <div className="cd-modal__sidebar">
          <div className="cd-modal__head">
            <h3 className="cd-modal__title">{gpu.name}</h3>
          </div>
          
          <div className="cd-modal__tabs" role="tablist">
            {TABS.map((t) => (
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

        <div className="cd-modal__content">
          <div className="cd-modal__body">
            
            {tab === 'overview' && (
              <div className="cd-detail-grid">
                <div className="cd-detail-row">
                  <span className="cd-detail-row__label">GPU Name</span>
                  <span className="cd-detail-row__value">{gpu.name}</span>
                </div>
                <div className="cd-detail-row">
                  <span className="cd-detail-row__label">Status</span>
                  <span className={`cd-status ${gpu.status === 'online' ? 'cd-status--success' : gpu.status === 'busy' ? 'cd-status--warning' : 'cd-status--error'}`}>
                    {gpu.status}
                  </span>
                </div>
                <div className="cd-detail-row">
                  <span className="cd-detail-row__label">UUID</span>
                  <span className="cd-detail-row__value cd-detail-row__value--mono">{gpu.id}</span>
                </div>
              </div>
            )}

            {tab === 'hardware' && (
              <div className="cd-detail-grid">
                <div className="cd-detail-row">
                  <span className="cd-detail-row__label">VRAM</span>
                  <span className="cd-detail-row__value">{gpu.vram_mb} MB</span>
                </div>
                <div className="cd-detail-row">
                  <span className="cd-detail-row__label">Temperature</span>
                  <span className="cd-detail-row__value">{metrics.gpu_temp_c ? metrics.gpu_temp_c + '°C' : '—'}</span>
                </div>
                <div className="cd-detail-row">
                  <span className="cd-detail-row__label">Utilization</span>
                  <span className="cd-detail-row__value">{metrics.gpu_util_pct ? metrics.gpu_util_pct + '%' : '—'}</span>
                </div>
              </div>
            )}

            {tab === 'software' && (
              <div className="cd-detail-grid">
                <div className="cd-detail-row">
                  <span className="cd-detail-row__label">CUDA Version</span>
                  <span className="cd-detail-row__value">{gpu.cuda_version || 'N/A'}</span>
                </div>
                <div className="cd-detail-row">
                  <span className="cd-detail-row__label">Docker Runtime</span>
                  <span className="cd-detail-row__value">{metrics.docker_running ? 'Healthy' : (metrics.docker_running === false ? 'Offline' : '—')}</span>
                </div>
              </div>
            )}

            {tab === 'heartbeat' && (
              <div className="cd-detail-grid">
                <div className="cd-detail-row">
                  <span className="cd-detail-row__label">Status</span>
                  <span className="cd-detail-row__value">{metrics.gpu_util_pct !== undefined ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            )}

            {tab === 'current' && (
              <div className="cd-detail-grid">
                {activeJob ? (
                  <>
                    <div className="cd-detail-row">
                      <span className="cd-detail-row__label">Job ID</span>
                      <span className="cd-detail-row__value cd-detail-row__value--mono">{activeJob.id}</span>
                    </div>
                    <div className="cd-detail-row">
                      <span className="cd-detail-row__label">Script</span>
                      <span className="cd-detail-row__value cd-detail-row__value--mono">
                        {activeJob.script_path?.split('/').pop() || 'Unknown'}
                      </span>
                    </div>
                    <div className="cd-detail-row">
                      <span className="cd-detail-row__label">Status</span>
                      <span className="cd-detail-row__value">{activeJob.status}</span>
                    </div>
                  </>
                ) : (
                  <div className="cd-empty" style={{ margin: '20px 0', border: 'none', background: 'transparent' }}>
                    <p className="cd-empty__title">No Active Workload</p>
                    <p className="cd-empty__desc">This GPU is currently idle.</p>
                  </div>
                )}
              </div>
            )}

            {!TABS.find(t => t.key === tab)?.live && (
              <div className="cd-locked-panel">
                <IconCheck style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.2 }} />
                <p>
                  <strong>{tab.charAt(0).toUpperCase() + tab.slice(1)}</strong> details are not yet available.
                </p>
                <span className="cd-coming" style={{ marginTop: 8 }}>Coming soon</span>
              </div>
            )}
            
          </div>
          <div className="cd-modal__footer">
            <button className="cd-btn cd-btn--outline" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
