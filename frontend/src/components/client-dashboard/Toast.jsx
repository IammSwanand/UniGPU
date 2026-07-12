import { IconCheck, IconAlert, IconInfo, IconClose } from './icons';

const ICONS = {
  success: IconCheck,
  error: IconAlert,
  warning: IconAlert,
  info: IconInfo,
};

/**
 * ToastStack — renders the active toasts from useToasts().
 * Kept separate from the hook so this file only exports a component.
 */
export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="cd-toasts" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => {
        const Glyph = ICONS[t.kind] || IconInfo;
        return (
          <div key={t.id} className={`cd-toast cd-toast--${t.kind}`} role="status">
            <Glyph className="cd-toast__icon" />
            <span className="cd-toast__body">{t.message}</span>
            <button
              className="cd-toast__close"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(t.id)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
