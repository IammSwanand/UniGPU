import UploadDropzone from './UploadDropzone';
import ScriptEditor from './ScriptEditor';
import GpuPreference from './GpuPreference';
import DatasetUpload from './DatasetUpload';

/**
 * ExecutionWorkspace — the largest visual component on the dashboard.
 *
 * A white feature container (40px radius, feature shadow) split 70/30:
 *   LEFT  → Upload panel + GPU Preference + Estimates + Submit
 *   RIGHT → dark embedded script editor (sticky)
 *
 * Per docs/client-db-design.md § Execution Workspace. The submit button is
 * the single filled (midnight-ink) CTA; "Save Draft" and "Reset" are
 * outline. Save Draft is Coming soon (no drafts endpoint); Reset clears
 * the workspace.
 *
 * All upload logic lives in the orchestrator and is passed down as props,
 * so this component stays purely presentational.
 */
export default function ExecutionWorkspace({
  availableGPUs,
  // script
  script, onScript, clearScript, scriptText, onScriptText, scriptPreview, toggleScriptPreview,
  // requirements
  reqs, onReqs, clearReqs, reqText, onReqText, reqPreview, toggleReqPreview,
  // dataset
  dataset, onDataset, onClearDataset,
  // gpu
  selectedGPU, onSelectGPU,
  // submit
  submitting, onSubmit, onReset,
}) {
  const canSubmit = !!script && !submitting;

  return (
    <section className="cd-workspace" aria-label="Execution workspace">
      <div className="cd-workspace__head">
        <h2 className="cd-workspace__title">Submit Workload</h2>
        <p className="cd-workspace__desc">
          Upload a Python workload and UniGPU will securely schedule execution on an available provider GPU.
        </p>
      </div>

      <div className="cd-workspace__grid">
        {/* LEFT — upload + config + submit */}
        <div className="cd-upload-panel">
          <UploadDropzone
            label="Python Script"
            primary="Drop your Python script here"
            accept=".py"
            support=".py · 100 MB"
            file={script}
            onFile={onScript}
            onClear={clearScript}
            onPreview={toggleScriptPreview}
            previewing={scriptPreview}
            okMessage="Python script uploaded successfully."
          />

          {scriptPreview && (
            <ScriptEditor
              filename={script?.name || 'script.py'}
              value={scriptText}
              onChange={onScriptText}
              hasFile
              emptyMsg="Upload a Python script to preview or edit it."
            />
          )}

          <UploadDropzone
            label="Dependencies"
            hint="Leave empty if your workload has no external dependencies."
            primary="Drop requirements.txt here"
            accept=".txt"
            support=".txt"
            file={reqs}
            onFile={onReqs}
            onClear={clearReqs}
            onPreview={toggleReqPreview}
            previewing={reqPreview}
            okMessage="Dependencies uploaded successfully."
            small
          />

          {reqPreview && (
            <ScriptEditor
              filename={reqs?.name || 'requirements.txt'}
              value={reqText}
              onChange={onReqText}
              hasFile
              emptyMsg="Upload a requirements file to preview or edit it."
            />
          )}

          <DatasetUpload
            dataset={dataset}
            onDataset={onDataset}
            onClearDataset={onClearDataset}
          />

          <GpuPreference
            availableGPUs={availableGPUs}
            selectedGPU={selectedGPU}
            onSelect={onSelectGPU}
          />

          <div className="cd-submit-row">
            <button
              className="cd-btn cd-btn--primary"
              onClick={onSubmit}
              disabled={!canSubmit}
              title={!script ? 'Complete the required fields to continue.' : ''}
            >
              {submitting ? 'Submitting Workload...' : 'Submit Workload'}
            </button>
            <button
              className="cd-btn cd-btn--outline cd-btn--coming"
              disabled
              title="Coming soon"
            >
              Save Draft
            </button>
            <button
              className="cd-btn cd-btn--outline"
              onClick={onReset}
              disabled={!script && !reqs}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
