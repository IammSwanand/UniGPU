import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import EyebrowLabel from './EyebrowLabel';
import { SCROLL_TINTS } from '../../lib/lerpColor';
import useReducedMotion from '../../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    id: 'submit',
    title: 'Submit',
    body: 'Upload a Python script with an optional requirements.txt. Your workload is packaged and queued.',
    shape: '16px',
  },
  {
    id: 'schedule',
    title: 'Schedule',
    body: 'The scheduler matches your job to an available provider GPU based on VRAM, CUDA version, and load.',
    shape: '40px',
  },
  {
    id: 'run',
    title: 'Run',
    body: 'The UniGPU agent pulls your package, starts a Docker container, and streams live logs until completion.',
    shape: '9999px',
  },
];

export default function HowItWorksSection() {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const lineSvgRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;

        if (reducedMotion) {
          gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' },
            opacity: 0,
            y: 24,
            duration: 0.5,
            delay: i * 0.1,
          });
          return;
        }

        gsap.fromTo(
          card,
          { opacity: 0, z: -40, rotateY: -8, borderRadius: '8px' },
          {
            scrollTrigger: {
              trigger: sectionRef.current,
              start: `top+=${i * 80} center`,
              end: `top+=${i * 80 + 200} center`,
              scrub: 1,
            },
            opacity: 1,
            z: 0,
            rotateY: 0,
            borderRadius: STEPS[i].shape,
            ease: 'none',
          },
        );

        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top center',
          end: 'bottom center',
          scrub: 1,
          onUpdate: (self) => {
            const t = self.progress;
            const shapes = ['8px', '16px', '40px', '9999px'];
            const idx = Math.min(Math.floor(t * shapes.length * 1.2), shapes.length - 1);
            card.style.borderRadius = shapes[idx];
            card.style.transform = `perspective(800px) rotateY(${(1 - t) * -6 + i * 2}deg) translateZ(${Math.sin(t * Math.PI + i) * 12}px)`;
          },
        });
      });

      if (lineSvgRef.current) {
        const path = lineSvgRef.current.querySelector('.lp-flow-line__path');
        if (path) {
          const len = path.getTotalLength();
          path.style.strokeDasharray = len;
          path.style.strokeDashoffset = len;

          gsap.to(path, {
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              end: 'bottom 40%',
              scrub: 1,
            },
            strokeDashoffset: 0,
            ease: 'none',
          });
        }
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="lp-section lp-how-v2"
      data-bg-tint={SCROLL_TINTS.lavender}
      aria-labelledby="how-heading"
    >
      <div className="lp-container">
        <div className="lp-section__header">
          <EyebrowLabel>How It Works</EyebrowLabel>
          <h2 id="how-heading" className="lp-section__heading">
            From script upload to live execution in three steps.
          </h2>
        </div>

        <div className="lp-how-v2__stage">
          <svg ref={lineSvgRef} className="lp-flow-line" viewBox="0 0 900 120" preserveAspectRatio="none" aria-hidden="true">
            <path
              className="lp-flow-line__path"
              d="M 40 60 Q 200 20, 450 60 T 860 60"
              fill="none"
              stroke="var(--lp-royal-signal)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          <div className="lp-how-v2__cards" role="list">
            {STEPS.map((step, i) => (
              <article
                key={step.id}
                ref={(el) => { cardsRef.current[i] = el; }}
                className="lp-how-v2__card"
                role="listitem"
                style={{ borderRadius: step.shape }}
              >
                <span className="lp-how-v2__step-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="lp-how-v2__card-title">{step.title}</h3>
                <p className="lp-how-v2__card-body">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
