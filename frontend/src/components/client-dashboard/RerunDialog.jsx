import { useState, useEffect } from 'react';
import GpuPreference from './GpuPreference';

export default function RerunDialog({ job, availableGPUs, onConfirm, onCancel }) {
  const [selectedGPU, setSelectedGPU] = useState(''); // default to Auto Select

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="cd-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="rerun-title">
      <div className="cd-confirm" style={{ maxWidth: '800px', width: '90vw' }} onClick={(e) => e.stopPropagation()}>
        <h3 className="cd-confirm__title" id="rerun-title">Run Again: Select GPU</h3>
        <p className="cd-confirm__msg">
          Choose a specific GPU to rerun workload <span className="cd-table__mono">{job.id.slice(0, 8)}</span>, or leave as Auto Select.
        </p>
        
        <div style={{ marginTop: '20px', marginBottom: '20px', textAlign: 'left' }}>
          <GpuPreference
            availableGPUs={availableGPUs}
            selectedGPU={selectedGPU}
            onSelect={setSelectedGPU}
          />
        </div>

        <div className="cd-confirm__actions">
          <button className="cd-btn cd-btn--outline" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="cd-btn cd-btn--primary"
            onClick={() => onConfirm(selectedGPU)}
            autoFocus
          >
            Submit Workload
          </button>
        </div>
      </div>
    </div>
  );
}
