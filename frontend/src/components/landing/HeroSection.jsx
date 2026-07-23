import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import StatusChip from './StatusChip';
import useTiltOnCursor from '../../hooks/useTiltOnCursor';
import { useIsMobile } from '../../hooks/useReducedMotion';
import { SCROLL_TINTS } from '../../lib/lerpColor';

gsap.registerPlugin(ScrollTrigger);

const GpuCard3D = lazy(() => import('./GpuCard3D'));
const Globe3D = lazy(() => import('./Globe3D'));

export default function HeroSection() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const visualRef = useRef(null);
  const tiltRef = useTiltOnCursor(true);
  const isMobile = useIsMobile();
  const [mounted3d, setMounted3d] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setMounted3d(true), 120);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMobile) return undefined;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => setScrollProgress(self.progress),
      });

      if (visualRef.current) {
        gsap.to(visualRef.current, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
          y: 80,
          opacity: 0.3,
          scale: 0.85,
          ease: 'none',
        });
      }

      if (contentRef.current) {
        gsap.from(contentRef.current.children, {
          y: 28,
          opacity: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power2.out',
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [isMobile]);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="lp-hero-v2"
      data-bg-tint={SCROLL_TINTS.canvas}
      aria-label="Hero"
    >
      <div className="lp-hero-v2__band">
        <div ref={contentRef} className="lp-hero-v2__content">
          <div className="lp-hero-v2__chip-row">
            <StatusChip variant="active">Peer-to-Peer GPU Compute</StatusChip>
          </div>

          <h1 className="lp-hero-v2__headline">
            Idle GPUs.{' '}
            <span className="lp-hero-v2__accent">Real compute.</span>
          </h1>

          <p className="lp-hero-v2__subhead">
            Submit Python and CUDA workloads to idle GPUs shared by students and
            developers — Docker-sandboxed, scheduled automatically, billed by the second.
          </p>

          <div className="lp-hero-v2__ctas">
            <Link to="/register?role=client" className="lp-btn-ghost">
              Get started
            </Link>
            <a href="#how-it-works" className="lp-btn-link-quiet">
              See how it works
            </a>
          </div>
        </div>

        <div ref={visualRef} className="lp-hero-v2__visual">
          {!isMobile && mounted3d && (
            <Suspense fallback={null}>
              <Globe3D scrollProgress={scrollProgress} className="lp-hero-v2__globe" />
            </Suspense>
          )}
          <div ref={tiltRef} className="lp-hero-v2__gpu-wrap">
            {!isMobile && mounted3d ? (
              <Suspense fallback={<div className="lp-hero-v2__gpu-fallback" />}>
                <GpuCard3D scrollProgress={scrollProgress} />
              </Suspense>
            ) : (
              <div className="lp-gpu-card-static" aria-hidden="true">
                <div className="lp-gpu-card-static__body">
                  <span className="lp-gpu-card-static__label">NVIDIA RTX 4060</span>
                  <span className="lp-gpu-card-static__spec">VRAM: 8188 MB · CUDA 12.4</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
