import { useEffect, useRef } from 'react';
import { lerpColor } from '../../lib/lerpColor';
import useReducedMotion from '../../hooks/useReducedMotion';

export default function ScrollBackground() {
  const bgRef = useRef(null);
  const dirty = useRef(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return undefined;

    const onScroll = () => {
      dirty.current = true;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    if (reducedMotion) {
      bg.style.transition = 'background-color 400ms ease';

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const tint = entry.target.getAttribute('data-bg-tint');
              if (tint) bg.style.backgroundColor = tint;
            }
          });
        },
        { threshold: 0.4 },
      );

      document.querySelectorAll('[data-bg-tint]').forEach((el) => observer.observe(el));

      const first = document.querySelector('[data-bg-tint]');
      if (first) bg.style.backgroundColor = first.getAttribute('data-bg-tint');

      return () => {
        window.removeEventListener('scroll', onScroll);
        observer.disconnect();
      };
    }

    let rafId;
    const tick = () => {
      if (dirty.current) {
        dirty.current = false;
        const sections = [...document.querySelectorAll('[data-bg-tint]')];
        if (sections.length === 0) {
          rafId = requestAnimationFrame(tick);
          return;
        }

        const center = window.innerHeight / 2;
        let idx = 0;

        for (let i = 0; i < sections.length; i++) {
          const rect = sections[i].getBoundingClientRect();
          const mid = rect.top + rect.height / 2;
          if (mid <= center) idx = i;
        }

        const current = sections[idx];
        const next = sections[Math.min(idx + 1, sections.length - 1)];
        const colorA = current.getAttribute('data-bg-tint');
        const colorB = next.getAttribute('data-bg-tint');

        const rectA = current.getBoundingClientRect();
        const rectB = next.getBoundingClientRect();
        const midA = rectA.top + rectA.height / 2;
        const midB = rectB.top + rectB.height / 2;
        const span = midB - midA || 1;
        const t = Math.max(0, Math.min(1, (center - midA) / span));

        bg.style.backgroundColor = lerpColor(colorA, colorB, t);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  return <div ref={bgRef} className="lp-scroll-bg" aria-hidden="true" />;
}
