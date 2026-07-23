import { useState } from 'react';

export default function MyGPUs({ gpus, metrics, onToggleStatus, onRegisterClick, onSelectGpu }) {
  const statusBadge = (s) => (
    <span className={`cd-status ${s === 'online' ? 'cd-status--success' : s === 'busy' ? 'cd-status--warning' : 'cd-status--error'}`}>
      {s === 'online' ? 'Available' : s === 'busy' ? 'Busy' : 'Offline'}
    </span>
  );

  return (
    <section id="my-gpus" style={{ marginTop: '32px' }}>
      <div className="cd-section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="cd-section-head__title">Registered GPUs</h2>
          <p className="cd-section-head__desc">Every GPU currently available for UniGPU workloads.</p>
        </div>
      </div>

      {gpus.length === 0 ? (
        <div className="cd-empty" style={{ marginTop: '16px' }}>
          <p className="cd-empty__title">No GPUs Registered</p>
          <p className="cd-empty__desc">Install and start the UniGPU Agent to register your first GPU.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          {gpus.map((gpu) => {
            const m = metrics[gpu.id] || {};
            return (
              <div key={gpu.id} className="cd-detail-grid" style={{ padding: '24px', borderRadius: '12px', background: 'var(--lp-snow-canvas)', border: '1px solid var(--lp-stone-divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '18px', color: 'var(--lp-midnight-ink)', marginBottom: '8px' }}>
                    {gpu.name}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--lp-ash-helper)', marginBottom: '12px' }}>
                    <span>VRAM: {gpu.vram_mb} MB</span>
                    <span>CUDA: {gpu.cuda_version || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {statusBadge(gpu.status)}
                    {m.docker_running === false && (
                      <span className="cd-status cd-status--error">Docker Offline</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className="cd-btn cd-btn--outline" onClick={() => onSelectGpu(gpu)}>
                    View Details
                  </button>
                  <button 
                    className={`cd-btn ${(gpu.status === 'online' || gpu.status === 'busy') ? 'cd-btn--danger' : 'cd-btn--primary'}`}
                    onClick={() => onToggleStatus(gpu)}
                  >
                    {(gpu.status === 'online' || gpu.status === 'busy') ? 'Go Offline' : 'Go Online'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
