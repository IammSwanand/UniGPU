/**
 * Shared non-component exports for the Client Dashboard.
 * Extracted into their own file so that component files only export
 * components (satisfies the react-refresh/only-export-components rule).
 */

/**
 * Map backend JobStatus → display label + chip CSS class.
 */
export function statusInfo(status) {
  switch (status) {
    case 'completed':
      return { label: 'Completed', cls: 'cd-status--completed' };
    case 'running':
      return { label: 'Running', cls: 'cd-status--running' };
    case 'failed':
      return { label: 'Failed', cls: 'cd-status--failed' };
    case 'cancelled':
      return { label: 'Cancelled', cls: 'cd-status--cancelled' };
    case 'pending':
    case 'queued':
    default:
      return { label: 'Queued', cls: 'cd-status--queued' };
  }
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `Submitted ${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Submitted ${h}h ago`;
  return `Submitted ${Math.floor(h / 24)}d ago`;
}
