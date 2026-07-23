import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import EyebrowLabel from './EyebrowLabel';
import { SCROLL_TINTS } from '../../lib/lerpColor';
import useReducedMotion from '../../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

const GPUS = [
  { name: 'RTX 4090', vram: '24576 MB', cuda: '12.4', online: true },
  { name: 'RTX 4060', vram: '8188 MB', cuda: '12.1', online: true },
  { name: 'RTX 3080', vram: '10240 MB', cuda: '11.8', online: false },
  { name: 'A100 40GB', vram: '40960 MB', cuda: '12.2', online: true },
  { name: 'RTX 3060', vram: '12288 MB', cuda: '12.0', online: true },
  { name: 'RTX 2070', vram: '8192 MB', cuda: '11.7', online: false },
  { name: 'RTX 4070 Ti', vram: '12288 MB', cuda: '12.4', online: true },
  { name: 'GTX 1660', vram: '6144 MB', cuda: '11.4', online: false },
  { name: 'RTX 4080', vram: '16384 MB', cuda: '12.3', online: true },
];

function depthFactor(i) {
  return 0.85 + ((i * 7 + 3) % 10) * 0.03;
}

export default function MarketplacePreview() {
  const sectionRef = useRef(null);
  const tilesRef = useRef([]);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return undefined;

    const ctx = gsap.context(() => {
      tilesRef.current.forEach((tile, i) => {
        if (!tile) return;
        const factor = depthFactor(i);

        gsap.to(tile, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
          y: -40 * factor,
          ease: 'none',
        });

        gsap.from(tile, {
          scrollTrigger: {
            trigger: tile,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
          opacity: 0,
          scale: 0.92,
          rotateX: 12,
          duration: 0.5,
          delay: (i % 3) * 0.08,
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="marketplace"
      className="lp-section lp-marketplace"
      data-bg-tint={SCROLL_TINTS.fog}
      aria-labelledby="marketplace-heading"
    >
      <div className="lp-container">
        <div className="lp-section__header">
          <EyebrowLabel>Live Network</EyebrowLabel>
          <h2 id="marketplace-heading" className="lp-section__heading">
            Many providers. One marketplace.
          </h2>
          <p className="lp-section__desc">
            GPUs across the network report VRAM, CUDA version, and availability in real time —
            the same fields you see in the dashboard.
          </p>
        </div>

        <div className="lp-marketplace__grid" role="list">
          {GPUS.map((gpu, i) => (
            <article
              key={gpu.name}
              ref={(el) => { tilesRef.current[i] = el; }}
              className="lp-marketplace__tile"
              role="listitem"
              style={{ '--tile-depth': depthFactor(i) }}
            >
              <div className="lp-marketplace__tile-head">
                <span className="lp-marketplace__gpu-name">{gpu.name}</span>
                <span className={`lp-marketplace__status ${gpu.online ? 'is-online' : 'is-offline'}`}>
                  <span className="lp-marketplace__dot" aria-hidden="true" />
                  {gpu.online ? 'Online' : 'Offline'}
                </span>
              </div>
              <dl className="lp-marketplace__specs">
                <div>
                  <dt>VRAM</dt>
                  <dd>{gpu.vram}</dd>
                </div>
                <div>
                  <dt>CUDA</dt>
                  <dd>{gpu.cuda}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
