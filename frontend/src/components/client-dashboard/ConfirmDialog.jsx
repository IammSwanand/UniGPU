import { useEffect } from 'react';

/**
 * ConfirmDialog — accessible confirmation overlay.
 *
 * Per docs/client-db-content.md: uses the exact copy for each action
 * (Delete Workload, Stop, Reset Workspace, Sign Out). The parent provides
 * title, message, confirm label, cancel label, and callbacks.
 */
export default function ConfirmDialog({
  title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger = false,
}) {
  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="cd-overlay" onClick={onCancel} role="alertdialog" aria-label={title}>
      <div className="cd-confirm" onClick={(e) => e.stopPropagation()}>
        <h3 className="cd-confirm__title">{title}</h3>
        <p className="cd-confirm__msg">{message}</p>
        <div className="cd-confirm__actions">
          <button className="cd-btn cd-btn--outline" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`cd-btn ${danger ? 'cd-btn--primary' : 'cd-btn--primary'}`}
            style={danger ? { background: '#ef4444' } : {}}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
