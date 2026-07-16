import { useState, useRef } from 'react';
import { IconUpload, IconFile, IconTrash } from './icons';

const MAX_SIZE_BYTES = 2 * 1024 ** 3; // 2 GB

/**
 * DatasetUpload — optional dataset provisioning for a workload.
 *
 * Two mutually exclusive tabs:
 *  A) Direct Upload  — user picks a local .csv file (max 2 GB)
 *  B) Google Drive   — user authenticates via OAuth popup and picks a CSV
 *                      from their Drive. The backend handles all token exchange;
 *                      the provider never learns the dataset origin.
 *
 * Props:
 *  - dataset         : File | null
 *  - onDataset(File) : set the direct-upload file
 *  - onClearDataset(): clear the direct-upload file
 */
export default function DatasetUpload({
  dataset, onDataset, onClearDataset,
}) {
  const [sizeError, setSizeError] = useState('');
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setSizeError('Only .csv files are accepted for dataset uploads.');
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setSizeError(`File is ${(f.size / 1024 ** 3).toFixed(2)} GB — maximum is 2 GB.`);
      return;
    }
    setSizeError('');
    onDataset(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };



  return (
    <div className="cd-dataset">
      <span className="cd-field__label">Dataset <span className="cd-field__optional">(optional)</span></span>
      <span className="cd-field__hint">
        Provide a dataset your script can read from <code>/workspace/input/dataset.csv</code>.
      </span>


          {dataset ? (
            <div className="cd-file">
              <span className="cd-file__icon"><IconFile /></span>
              <div className="cd-file__meta">
                <div className="cd-file__name" title={dataset.name}>{dataset.name}</div>
                <div className="cd-file__ok">✓ Dataset uploaded successfully. ({(dataset.size / 1024).toFixed(1)} KB)</div>
              </div>
              <div className="cd-file__actions">
                <button
                  className="cd-btn cd-btn--outline cd-btn--small"
                  onClick={() => inputRef.current?.click()}
                >Replace</button>
                <button
                  className="cd-btn cd-btn--outline cd-btn--danger"
                  style={{ padding: '6px', minWidth: 'auto', borderRadius: '50%' }}
                  onClick={onClearDataset}
                  aria-label="Remove dataset"
                >
                  <IconTrash style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`cd-upload cd-upload--small`}
              role="button"
              tabIndex={0}
              aria-label="Upload dataset CSV"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); }}}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="cd-upload__icon"><IconUpload /></div>
              <p className="cd-upload__primary">Drop your CSV dataset here</p>
              <p className="cd-upload__secondary">or <span className="cd-upload__browse">browse files</span></p>
              <p className="cd-upload__support">.csv · max 2 GB</p>
            </div>
          )}
          {sizeError && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{sizeError}</p>
          )}
          <input ref={inputRef} type="file" accept=".csv" hidden
            onClick={(e) => { e.target.value = null; }}
            onChange={(e) => handleFile(e.target.files?.[0])} />

    </div>
  );
}
