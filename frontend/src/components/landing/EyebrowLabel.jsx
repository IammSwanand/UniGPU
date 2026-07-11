/** EyebrowLabel — Design.md § "Eyebrow Label"
 * Inter 12px 500 uppercase +0.6px tracking, #145aff
 */
export default function EyebrowLabel({ children }) {
  return (
    <span className="lp-eyebrow" aria-label={`Section: ${children}`}>
      {children}
    </span>
  );
}
