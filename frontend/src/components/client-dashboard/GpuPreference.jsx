
/**
 * GpuPreference — GPU select + (disabled) Advanced Configuration.
 *
 * The select is fully functional: "Auto Select" (empty value → backend
 * auto-matches) plus every GPU returned by /gpus/available. Selecting a
 * GPU submits to that provider specifically.
 *
 * Advanced Configuration (CUDA version / memory / timeout / container
 * limit / environment variables) is NOT supported by the backend submit
 * endpoint (which only accepts script + requirements + gpu_id). It renders
 * collapsed-by-default with all fields disabled and a "Coming soon" tag,
 * honoring docs/client-db-design.md § GPU Configuration (future-ready)
 * without sending the backend values it would ignore.
 *
 * Props:
 *  - availableGPUs  : GPUOut[] from /gpus/available
 *  - selectedGPU    : current gpu_id | ''
 *  - onSelect(id)   : change handler
 */
import { useNavigate } from 'react-router-dom';

export default function GpuPreference({ availableGPUs, selectedGPU, onSelect }) {
  const navigate = useNavigate();
  const isAuto = selectedGPU === '';

  const handleToggleAuto = () => {
    if (!isAuto) {
      onSelect('');
    } else {
      if (availableGPUs.length > 0) {
        onSelect(availableGPUs[0].id);
      }
    }
  };

  const handleSelectGPU = (id) => {
    onSelect(id);
  };

  const displayedGPUs = availableGPUs.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="cd-field__label" style={{ display: 'block', marginBottom: '0px' }}>GPU Preference</span>
          <span className="cd-field__hint">
            Choose a preferred GPU or allow UniGPU to automatically assign the best available provider.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div className="cd-field__label" style={{ marginBottom: '0px' }}>Auto Select GPU</div>
            <div className="cd-field__hint">Automatically picks the best available GPU.</div>
          </div>
          <button
            type="button"
            onClick={handleToggleAuto}
            aria-pressed={isAuto}
            style={{
              width: '40px',
              height: '24px',
              borderRadius: '12px',
              backgroundColor: isAuto ? 'var(--lp-royal-signal)' : 'var(--lp-stone-divider)',
              border: 'none',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              padding: 0
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '2px',
                left: isAuto ? '18px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'var(--lp-surface-card)',
                transition: 'left 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
          </button>
        </div>
      </div>

      <div className="cd-table">
        <div className="cd-table__scroll">
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}></th>
                <th>GPU Model</th>
                <th>VRAM</th>
                <th>CUDA</th>
                <th>Price / hr</th>
              </tr>
            </thead>
            <tbody>
              {displayedGPUs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--lp-ash-helper)' }}>
                    No GPUs currently available.
                  </td>
                </tr>
              ) : (
                displayedGPUs.map((gpu) => (
                  <tr
                    key={gpu.id}
                    onClick={() => handleSelectGPU(gpu.id)}
                    style={{ 
                      cursor: 'pointer',
                      ...(selectedGPU === gpu.id ? { backgroundColor: 'rgba(20, 90, 255, 0.05)' } : {})
                    }}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="radio"
                        checked={selectedGPU === gpu.id}
                        onChange={() => handleSelectGPU(gpu.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--lp-midnight-ink)' }}>{gpu.name}</div>
                    </td>
                    <td className="cd-table__mono">{(gpu.vram_mb / 1024).toFixed(0)} GB</td>
                    <td className="cd-table__mono">{gpu.cuda_version || 'N/A'}</td>
                    <td className="cd-table__mono" style={{ color: 'var(--lp-ash-helper)' }}>N/A</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--lp-stone-divider)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--lp-surface-card)',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--lp-ash-helper)' }}>
            Showing {displayedGPUs.length} of {availableGPUs.length} GPUs
          </span>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--lp-royal-signal)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0
            }}
            onClick={() => navigate('/dashboard/client/gpus?mode=select')}
          >
            Explore More GPUs →
          </button>
        </div>
      </div>
    </div>
  );
}
