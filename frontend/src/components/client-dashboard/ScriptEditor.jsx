import { useState, useRef, useEffect } from 'react';
import { IconFile, IconMaximize, IconMinimize } from './icons';

/**
 * ScriptEditor — dark CodeWindow-style panel for previewing/editing an
 * uploaded script (or requirements file).
 *
 * Inherited directly from the Landing Page's dark code aesthetic
 * (docs/client-db-design.md § Embedded Editor): Roboto Mono body,
 * traffic-light dots, filename + Read-Only toggle. Not a full IDE.
 *
 * The panel stays dark even though the dashboard chrome is light — this
 * matches how the LP alternates light sections with dark code windows.
 *
 * Props:
 *  - filename : string (shown in the topbar)
 *  - value    : current text
 *  - onChange : text change handler (when editable)
 *  - emptyMsg : placeholder shown when value is empty
 *  - readOnly : disable editing (preview-only)
 *  - onToggleReadOnly() : flips editable/read-only
 *  - hasFile  : whether a file is loaded (controls empty state vs textarea)
 */
export default function ScriptEditor({
  filename,
  value,
  onChange,
  emptyMsg = 'Upload a Python script to preview or edit it.',
  readOnly = false,
  onToggleReadOnly,
  hasFile = false,
}) {
  const ref = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Prevent background scrolling when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  return (
    <div className={`cd-editor ${isFullscreen ? 'cd-editor--fullscreen' : ''}`}>
      <div className="cd-editor__window">
        <div className="cd-editor__topbar" style={{ position: 'relative' }}>
          <div className="cd-editor__dots" aria-hidden="true">
            <span className="cd-editor__dot" />
            <span className="cd-editor__dot" />
            <span className="cd-editor__dot" />
          </div>
          <span className="cd-editor__filename">{filename || 'untitled'}</span>
          {!readOnly && (
            <span style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#ffffff',
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '4px 10px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              Editing Mode
            </span>
          )}
          <div className="cd-editor__tools">
            <button
              className="cd-editor__tool"
              onClick={() => setIsFullscreen(!isFullscreen)}
              disabled={!hasFile}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isFullscreen ? <IconMinimize style={{ width: '14px', height: '14px' }} /> : <IconMaximize style={{ width: '14px', height: '14px' }} />}
            </button>
          </div>
        </div>
        <div className="cd-editor__body">
          {hasFile ? (
            <textarea
              ref={ref}
              className="cd-editor__textarea"
              value={value}
              readOnly={readOnly}
              spellCheck={false}
              wrap="off"
              onChange={(e) => onChange?.(e.target.value)}
              aria-label={`${filename} editor`}
            />
          ) : (
            <div className="cd-editor__empty">
              <IconFile />
              <p>{emptyMsg}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
