import { motion } from 'framer-motion';

/**
 * CodeWindow — Design.md § "Code Window Card"
 * Dark panel: #14141e bg, 16px radius, 1px rgba(20,90,255,0.18) border.
 * No shadow. Top bar: neutral gray dots + optional filename.
 * Children are pre-formatted code lines using .lp-tok-* classes.
 */
export default function CodeWindow({ filename, children, className = '', animate = true }) {
  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate
    ? {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-60px' },
        transition: { duration: 0.45, ease: 'easeOut' },
      }
    : {};

  return (
    <Wrapper className={`lp-code-window ${className}`} {...wrapperProps}>
      <div className="lp-code-window__topbar" aria-hidden="true">
        <div className="lp-code-window__dots">
          <span className="lp-code-window__dot" />
          <span className="lp-code-window__dot" />
          <span className="lp-code-window__dot" />
        </div>
        {filename && (
          <span className="lp-code-window__filename">{filename}</span>
        )}
      </div>
      <div className="lp-code-window__body">
        <pre style={{ margin: 0 }}>
          {children}
        </pre>
      </div>
    </Wrapper>
  );
}
