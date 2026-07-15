import { useState, useRef } from 'react';
import { IconUpload, IconFile, IconTrash } from './icons';
import { useGDriveAuth } from './useGDriveAuth';

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
 *  - gdriveState     : { authCode, fileId, fileName, redirectUri } | null
 *  - onGDriveState   : setter for gdrive state (from useGDriveAuth)
 */
export default function DatasetUpload({
  dataset, onDataset, onClearDataset,
  gdriveState, onGDriveState,
}) {
  const [tab, setTab] = useState('upload'); // 'upload' | 'gdrive'
  const [sizeError, setSizeError] = useState('');
  const inputRef = useRef(null);

  // Google Drive hook (manages OAuth popup + Picker)
  const gdrive = useGDriveAuth();

  // Sync gdrive state up to parent
  if (gdrive.gdriveState !== gdriveState && gdrive.gdriveState !== null) {
    onGDriveState(gdrive.gdriveState);
  }

  const handleTabChange = (t) => {
    setTab(t);
    setSizeError('');
    // Switching tabs clears the other mode
    if (t === 'upload') {
      gdrive.disconnect();
      onGDriveState(null);
    } else {
      onClearDataset();
    }
  };

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

  const handleGDriveConnect = async () => {
    onGDriveState(null);
    await gdrive.connect();
    if (gdrive.gdriveState) onGDriveState(gdrive.gdriveState);
  };

  const handleGDriveDisconnect = () => {
    gdrive.disconnect();
    onGDriveState(null);
  };

  return (
    <div className="cd-dataset">
      <span className="cd-field__label">Dataset <span className="cd-field__optional">(optional)</span></span>
      <span className="cd-field__hint">
        Provide a dataset your script can read from <code>/workspace/input/dataset.csv</code>.
      </span>

      {/* Tab toggle */}
      <div className="cd-dataset__tabs">
        <button
          className={`cd-dataset__tab ${tab === 'upload' ? 'cd-dataset__tab--active' : ''}`}
          onClick={() => handleTabChange('upload')}
          type="button"
        >
          <IconUpload style={{ width: 14, height: 14 }} />
          Direct Upload
        </button>
        <button
          className={`cd-dataset__tab ${tab === 'gdrive' ? 'cd-dataset__tab--active' : ''}`}
          onClick={() => handleTabChange('gdrive')}
          type="button"
        >
          <svg style={{ width: 14, height: 14, flexShrink: 0 }} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.35c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z" fill="#ea4335"/>
            <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.45-4.45 1.2z" fill="#00832d"/>
            <path d="M59.8 52.85H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.6c1.55 0 3.1-.45 4.45-1.2z" fill="#2684fc"/>
            <path d="M73.4 26.45l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 27.85h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
          Google Drive
        </button>
      </div>

      {/* Direct Upload Tab */}
      {tab === 'upload' && (
        <div>
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
              <input ref={inputRef} type="file" accept=".csv" hidden
                onChange={(e) => handleFile(e.target.files?.[0])} />
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
            onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>
      )}

      {/* Google Drive Tab */}
      {tab === 'gdrive' && (
        <div className="cd-gdrive">
          {gdriveState ? (
            /* Connected — show selected file */
            <div className="cd-file">
              <span className="cd-file__icon">
                <svg style={{ width: 20, height: 20 }} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                  <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.35c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                  <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z" fill="#ea4335"/>
                  <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.45-4.45 1.2z" fill="#00832d"/>
                  <path d="M59.8 52.85H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.6c1.55 0 3.1-.45 4.45-1.2z" fill="#2684fc"/>
                  <path d="M73.4 26.45l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 27.85h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                </svg>
              </span>
              <div className="cd-file__meta">
                <div className="cd-file__name" title={gdriveState.fileName}>{gdriveState.fileName}</div>
                <div className="cd-file__ok">✓ Selected from Google Drive</div>
              </div>
              <div className="cd-file__actions">
                <button className="cd-btn cd-btn--outline cd-btn--small" onClick={handleGDriveConnect}>
                  Change
                </button>
                <button
                  className="cd-btn cd-btn--outline cd-btn--danger"
                  style={{ padding: '6px', minWidth: 'auto', borderRadius: '50%' }}
                  onClick={handleGDriveDisconnect}
                  aria-label="Remove Google Drive dataset"
                >
                  <IconTrash style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>
          ) : (
            /* Not connected */
            <div className="cd-gdrive__connect">
              <p className="cd-gdrive__desc">
                Select a CSV file from your Google Drive. The backend fetches it securely —
                the provider never sees your Google credentials.
              </p>
              {gdrive.error && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '10px' }}>
                  {gdrive.error}
                </p>
              )}
              <button
                className="cd-btn cd-btn--outline"
                onClick={handleGDriveConnect}
                disabled={gdrive.loading}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {gdrive.loading ? (
                  <>Connecting…</>
                ) : (
                  <>
                    <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                      <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.35c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z" fill="#ea4335"/>
                      <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.45-4.45 1.2z" fill="#00832d"/>
                      <path d="M59.8 52.85H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.6c1.55 0 3.1-.45 4.45-1.2z" fill="#2684fc"/>
                      <path d="M73.4 26.45l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 27.85h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                    </svg>
                    Connect Google Drive
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
