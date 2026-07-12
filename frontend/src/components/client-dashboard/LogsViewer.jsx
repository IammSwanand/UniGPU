import { useRef, useEffect } from 'react';
import { IconCopy, IconDownload, IconClose } from './icons';

/**
 * LogsViewer — dark modal showing execution logs for a single workload.
 *
 * Replaces the old glass-elevated modal with a restyled dark CodeWindow
 * panel (per docs/client-db-design.md § Live Logs). Toolbar has Copy /
 * Download / Close. The body auto-scrolls to the bottom and uses Roboto
 * Mono for legibility.
 *
 * Props:
 *  - logs      : string (log content)
 *  - loading   : boolean
 *  - jobId     : the job id (for the title and download filename)
 *  - onClose()
 */

export default function LogsViewer({ logs, loading, jobId, onClose }) {
  const bodyRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive.
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs]);

  // Prevent background scroll while modal is open.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(logs || '');
    } catch {
      // Fallback for non-HTTPS
      const ta = document.createElement('textarea');
      ta.value = logs || '';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([logs || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workload_${jobId.slice(0, 8)}_logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="cd-overlay" onClick={onClose} role="dialog" aria-label="Execution logs">
      <div
        className="cd-logs"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="cd-logs__topbar">
          <span className="cd-logs__title">Execution Logs — {jobId.slice(0, 8)}…</span>
          <div className="cd-logs__tools">
            <button className="cd-logs__tool" onClick={handleCopy} title="Copy logs">
              <IconCopy /> Copy
            </button>
            <button className="cd-logs__tool" onClick={handleDownload} title="Download logs">
              <IconDownload /> Download
            </button>
            <button className="cd-logs__tool" onClick={onClose} title="Close">
              <IconClose /> Close
            </button>
          </div>
        </div>
        <div className="cd-logs__body" ref={bodyRef}>
          {loading ? (
            <div className="cd-logs__empty">Fetching Logs…</div>
          ) : logs ? (
            logs.split('\n').map((line, i) => (
              <div key={i} className="cd-logs__line">{line}</div>
            ))
          ) : (
            <div className="cd-logs__empty">
              Execution logs will appear once your workload begins running.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
