
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
export default function GpuPreference({ availableGPUs, selectedGPU, onSelect }) {
  return (
    <div>
      <span className="cd-field__label">GPU Preference</span>
      <span className="cd-field__hint">
        Choose a preferred GPU or allow UniGPU to automatically assign the best available provider.
      </span>
      <select
        className="cd-select"
        value={selectedGPU}
        onChange={(e) => onSelect(e.target.value)}
        aria-label="GPU preference"
      >
        <option value="">Auto Select — Any Available</option>
        {availableGPUs.map((gpu) => (
          <option key={gpu.id} value={gpu.id}>
            {gpu.name} — {(gpu.vram_mb / 1024).toFixed(0)} GB VRAM{gpu.cuda_version ? ` · CUDA ${gpu.cuda_version}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
