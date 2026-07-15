import { useState, useEffect } from 'react';
import api from '../../api/client';

/**
 * ArtifactsPanel — rendered inside WorkloadDrawer when tab = 'artifacts'.
 *
 * States:
 *  1. Job not completed yet → "Artifacts are available once the job completes."
 *  2. Job completed + artifacts_path null → "No output artifacts were produced."
 *     (Script didn't write anything to /workspace/output/)
 *  3. Loading artifact list → skeleton cards
 *  4. Files available → file card grid + Download All button
 *
 * Props:
 *  - job: JobOut
 */

const FILE_ICONS = {
  // Images
  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
  // ML model weights
  pkl: '⚙️', pt: '⚙️', pth: '⚙️', h5: '⚙️', onnx: '⚙️', joblib: '⚙️',
  // Data
  csv: '📊', json: '📊', parquet: '📊', xlsx: '📊',
  // Text / logs
  txt: '📄', log: '📄', md: '📄',
  // Archives
  zip: '📦', tar: '📦', gz: '📦',
};

function fileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return FILE_ICONS[ext] || '📄';
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ArtifactsPanel({ job }) {
  const [files, setFiles] = useState(null);   // null = not yet fetched
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isCompleted = job.status === 'completed';
  const hasArtifacts = isCompleted && !!job.artifacts_path;

  useEffect(() => {
    if (!hasArtifacts) return;
    setLoading(true);
    api.getArtifactsList(job.id)
      .then(setFiles)
      .catch((e) => setError(e?.detail || 'Failed to load artifact list.'))
      .finally(() => setLoading(false));
  }, [job.id, hasArtifacts]);

  const downloadFile = (filename) => {
    const url = api.getArtifactFileUrl(job.id, filename);
    // Use a hidden anchor to trigger native browser download with auth header.
    // Since the endpoint requires auth, we append the token as a query param
    // for this one-off download link (acceptable for short-lived download intent).
    const token = localStorage.getItem('token');
    const finalUrl = `${url}${token ? `?token=${token}` : ''}`;
    const a = document.createElement('a');
    a.href = finalUrl;
    a.download = filename;
    a.click();
  };

  const downloadAll = () => {
    const token = localStorage.getItem('token');
    const url = api.getArtifactsZipUrl(job.id);
    const finalUrl = `${url}${token ? `?token=${token}` : ''}`;
    const a = document.createElement('a');
    a.href = finalUrl;
    a.download = `artifacts-${job.id.slice(0, 8)}.zip`;
    a.click();
  };

  // ── State 1: Not completed ──
  if (!isCompleted) {
    return (
      <div className="cd-locked-panel">
        <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
        <p>
          <strong>Artifacts</strong> are available once the job completes.
        </p>
        <span className={`cd-status cd-status--${job.status}`} style={{ marginTop: 8 }}>
          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </span>
      </div>
    );
  }

  // ── State 2: Completed but no artifacts ──
  if (!hasArtifacts) {
    return (
      <div className="cd-locked-panel">
        <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
        <p style={{ color: 'var(--lp-ash-helper)' }}>
          No output artifacts were produced by this job.
        </p>
        <p style={{ fontSize: 12, color: 'var(--lp-ash-helper)', marginTop: 8 }}>
          To generate artifacts, write files to <code>/workspace/output/</code> in your script.
        </p>
      </div>
    );
  }

  // ── State 3: Loading ──
  if (loading) {
    return (
      <div className="cd-artifacts">
        {[1, 2, 3].map((i) => (
          <div key={i} className="cd-artifact-card cd-artifact-card--skeleton">
            <div className="cd-artifact-card__icon" style={{ background: 'var(--lp-ash-border)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 12, background: 'var(--lp-ash-border)', borderRadius: 4, marginBottom: 6, width: '60%' }} />
              <div style={{ height: 10, background: 'var(--lp-ash-border)', borderRadius: 4, width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── State 4: Error ──
  if (error) {
    return (
      <div className="cd-locked-panel">
        <p style={{ color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

  // ── State 5: Files available ──
  const fileList = files || [];

  return (
    <div className="cd-artifacts">
      {/* Header with Download All */}
      <div className="cd-artifacts__header">
        <div>
          <span className="cd-artifacts__count">{fileList.length} file{fileList.length !== 1 ? 's' : ''}</span>
          <span style={{ color: 'var(--lp-ash-helper)', fontSize: 12, marginLeft: 8 }}>
            from <code>/workspace/output/</code>
          </span>
        </div>
        {fileList.length > 0 && (
          <button
            className="cd-btn cd-btn--outline cd-btn--small"
            onClick={downloadAll}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>⬇</span> Download All
          </button>
        )}
      </div>

      {fileList.length === 0 ? (
        <div className="cd-locked-panel" style={{ padding: '20px' }}>
          <p style={{ color: 'var(--lp-ash-helper)', fontSize: 13 }}>
            The output directory was empty.
          </p>
        </div>
      ) : (
        <div className="cd-artifact-grid">
          {fileList.map((f) => (
            <div key={f.name} className="cd-artifact-card">
              <div className="cd-artifact-card__icon">
                {fileIcon(f.name)}
              </div>
              <div className="cd-artifact-card__meta">
                <div className="cd-artifact-card__name" title={f.name}>{f.name}</div>
                <div className="cd-artifact-card__size">{formatBytes(f.size_bytes)}</div>
              </div>
              <button
                className="cd-btn cd-btn--secondary"
                style={{ padding: '4px 10px', fontSize: '12px', flexShrink: 0 }}
                onClick={() => downloadFile(f.name)}
              >
                ⬇ Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
