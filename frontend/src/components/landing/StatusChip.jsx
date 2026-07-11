/** StatusChip — Design.md § "Status Chip"
 * variant: 'active' | 'neutral'
 * Active: rgba(20,90,255,0.1) bg, #145aff text, 4px dot prefix
 * Neutral: transparent bg, 1px #e2e8f0 border, #6b7280 text
 */
export default function StatusChip({ children, variant = 'active' }) {
  return (
    <span className={`lp-chip lp-chip--${variant}`}>
      {children}
    </span>
  );
}
