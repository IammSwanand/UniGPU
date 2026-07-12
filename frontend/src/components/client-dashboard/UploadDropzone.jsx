import { useRef, useState } from 'react';
import { IconUpload, IconFile, IconTrash } from './icons';

/**
 * UploadDropzone — reusable Vercel-style file drop area.
 *
 * Used for the Python script (.py) and the optional dependencies (.txt).
 * Supports both click-to-browse and native drag-and-drop. After a file is
 * chosen the parent owns the File object; this component just reports it
 * via onFile and renders the uploaded-file card with Replace / Remove /
 * Preview actions (per docs/client-db-content.md).
 *
 * Props:
 *  - label        : field heading, e.g. "Python Script"
 *  - hint?        : helper text under the heading
 *  - accept       : accept attr, e.g. ".py" or ".txt"
 *  - support?     : supported legend, e.g. ".py · 100 MB"
 *  - file         : current File | null
 *  - onFile(File) : called with the chosen file
 *  - onClear()    : called to remove the file
 *  - onPreview?() : optional "Preview Script" toggle
 *  - previewing?  : whether preview/editor is open
 *  - primary      : dropzone primary line, e.g. "Drop your Python script here"
 *  - secondary?   : dropzone secondary line, e.g. "or browse files"
 *  - okMessage    : post-upload success line, e.g. "Python script uploaded successfully."
 *  - small?       : render the compact (dependencies) variant
 */
export default function UploadDropzone({
  label,
  hint,
  accept,
  support,
  file,
  onFile,
  onClear,
  onPreview,
  previewing,
  primary,
  okMessage,
  small = false,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const pick = (f) => {
    if (f) onFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    pick(f);
  };

  // Rendered uploaded state
  if (file) {
    return (
      <div>
        <span className="cd-field__label">{label}</span>
        <div className="cd-file">
          <span className="cd-file__icon">
            <IconFile />
          </span>
          <div className="cd-file__meta">
            <div className="cd-file__name" title={file.name}>{file.name}</div>
            <div className="cd-file__ok">✓ {okMessage}</div>
          </div>
          <div className="cd-file__actions">
            {onPreview && (
              <button className="cd-btn cd-btn--outline cd-btn--small" onClick={onPreview}>
                {previewing ? 'Save' : 'Edit'}
              </button>
            )}
            <button className="cd-btn cd-btn--outline cd-btn--small" onClick={() => inputRef.current?.click()}>
              Replace File
            </button>
            <button
              className="cd-btn cd-btn--outline cd-btn--danger"
              style={{ padding: '6px', minWidth: 'auto', borderRadius: '50%' }}
              aria-label={`Remove ${file.name}`}
              onClick={onClear}
            >
              <IconTrash style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            hidden
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>
      </div>
    );
  }

  // Empty dropzone
  return (
    <div>
      <span className="cd-field__label">{label}</span>
      {hint && <span className="cd-field__hint">{hint}</span>}
      <div
        className={`cd-upload ${small ? 'cd-upload--small' : ''} ${dragOver ? 'cd-upload--hover' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`${label} — ${primary}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div className="cd-upload__icon">
          <IconUpload />
        </div>
        <p className="cd-upload__primary">{primary}</p>
        <p className="cd-upload__secondary">
          or <span className="cd-upload__browse">browse files</span>
        </p>
        {support && <p className="cd-upload__support">{support}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}
