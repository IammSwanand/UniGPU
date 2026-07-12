import { useRef } from 'react';
import { IconFile } from './icons';

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

  return (
    <div className="cd-editor">
      <div className="cd-editor__window">
        <div className="cd-editor__topbar">
          <div className="cd-editor__dots" aria-hidden="true">
            <span className="cd-editor__dot" />
            <span className="cd-editor__dot" />
            <span className="cd-editor__dot" />
          </div>
          <span className="cd-editor__filename">{filename || 'untitled'}</span>
          <div className="cd-editor__tools">
            <button
              className="cd-editor__tool"
              onClick={onToggleReadOnly}
              disabled={!hasFile}
              title={readOnly ? 'Switch to edit mode' : 'Switch to read-only'}
            >
              {readOnly ? 'Read Only' : 'Editing'}
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
