import { useRef, useEffect, useCallback } from 'react';

const LERP = 0.08;
const MAX_TILT = 15;

export default function useTiltOnCursor(enabled = true) {
  const ref = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef(null);

  const tick = useCallback(() => {
    current.current.x += (target.current.x - current.current.x) * LERP;
    current.current.y += (target.current.y - current.current.y) * LERP;
    if (ref.current) {
      ref.current.style.transform =
        `perspective(900px) rotateX(${current.current.y}deg) rotateY(${current.current.x}deg)`;
    }
    raf.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const el = ref.current?.parentElement;
    if (!el) return undefined;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = (e.clientX - cx) / (rect.width / 2);
      const ny = (e.clientY - cy) / (rect.height / 2);
      target.current.x = Math.max(-MAX_TILT, Math.min(MAX_TILT, nx * MAX_TILT));
      target.current.y = Math.max(-MAX_TILT, Math.min(MAX_TILT, -ny * MAX_TILT));
    };

    const onLeave = () => {
      target.current.x = 0;
      target.current.y = 0;
    };

    raf.current = requestAnimationFrame(tick);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf.current);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [enabled, tick]);

  return ref;
}
