/**
 * authMotion — shared Framer Motion variants for auth pages.
 *
 * Mirrors the landing hero's restrained motion language exactly:
 * a staggered container with opacity + y-fade children on `easeOut`.
 * No springs or bounces — per docs/Design.md § Motion & Animation.
 */

export const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

export const childVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

/** Aside / form panel slides in slightly slower for visual weight. */
export const asideVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
