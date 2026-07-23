# UniGPU marketing site — redesign brief

## 1. What we're aligning to

Your client/provider dashboards (see screenshots) already have a real visual identity — we're extending it to the marketing site, not replacing it:

- White-dominant surfaces, generous whitespace, no dark mode
- Black as the only "loud" color — logo mark, primary buttons, avatar, balance pill outline
- Pastel tint chips for state, not saturated color: pale lavender upload zone, pale pink "Offline" badge, small solid dots for status (green/red)
- Rounded-xl cards (16–20px radius), hairline borders, no shadows or gradients
- Plain, confident sans-serif type, bold black headings, gray-500 supporting text

The marketing site should feel like the *front door* to that product — same material, same restraint — just with one new trick: the page background tints shift seamlessly as you scroll, using the same pastel family already sitting in your dashboard (lavender, mint, blush, pale amber), instead of hard section breaks.

## 2. Color tokens — dark theme (inverted)

Same system as the dashboard, just flipped: black becomes the dominant surface, white becomes the "loud" color, tints get pulled down to deep, muted versions so they still read as backgrounds and not noise.

| Token | Hex | Use |
|---|---|---|
| `--bg-base` | `#0A0A0B` | Default page/card background |
| `--bg-raised` | `#131316` | Alternate section base / raised cards |
| `--ink-100` | `#FAFAFA` | Headings, primary button fill, logo |
| `--ink-400` | `#A1A1AA` | Supporting/body text |
| `--ink-600` | `#6B6B70` | Placeholder, meta text |
| `--border` | `#242427` | Hairline borders |
| `--tint-lavender` | `#1B1730` | Scroll-bg stop 1 · compute/scheduling sections |
| `--tint-mint` | `#0F2019` | Scroll-bg stop 2 · "online/active" sections |
| `--tint-blush` | `#26141C` | Scroll-bg stop 3 · pricing/billing sections |
| `--tint-amber` | `#241C10` | Scroll-bg stop 4 · CTA/footer section |
| `--accent-red` | `#F87171` | Offline/error dot only |
| `--accent-green` | `#4ADE80` | Online/active dot only |

Rules:
- Tints are backgrounds only, never text. Text on any tint stays `--ink-100` / `--ink-400`.
- Primary buttons invert too: solid `--ink-100` fill with `--bg-base` (black) text — mirrors the dashboard's black "Go Online" button exactly, just flipped.
- The logo mark ships as black-on-transparent today — render it white on the dark site (recolor the SVG fill, or `filter: invert(1)` if only a raster asset exists).
- Status badges (Offline/pink, backend•green, agent/docker•red) keep the same dot colors, just sit on `--bg-raised` chips instead of pale pastel chips — same hierarchy, dark surface.

## 3. Typography — distinctive, not generic

Dropping Inter/Space Grotesk/Poppins — too default. Using the Fontshare set instead (free, well-hinted, still easy to self-host):

| Role | Typeface | Notes |
|---|---|---|
| Display / H1–H2 | **Clash Display** (500/600) | Geometric with sharp cuts on the G, Q, R — distinctive at large sizes, reads technical without being a cliché "cyber" font |
| Body / UI | **Satoshi** (400/500) | Clean, humanist, pairs quietly under Clash Display |
| Numerics / specs / code / prices | **JetBrains Mono** or **Geist Mono** (400) | For GPU specs, ₹ prices, VRAM/CUDA numbers, log output — matches the mono treatment your dashboard already implies with things like "VRAM: 8188 MB" |

Type scale: H1 56–72px/500, H2 36px/500, H3 22px/500, body 16px/400 line-height 1.6, mono 14px.

## 4. The scroll-background mechanic ("seamless" tint shift)

Goal: as the user scrolls, the page background continuously interpolates between the tint stops above — no hard cuts, no flash.

Approach:
1. Each `<section>` gets `data-bg="#EDEBFB"` (its target tint).
2. A single fixed/absolute background layer sits behind all content (`position: fixed; inset: 0; z-index: -1`).
3. On scroll (rAF-throttled), find the two sections straddling the viewport center, compute progress (0–1) between them, and `lerp` their two hex colors in RGB space.
4. Set the background layer's `background-color` to the interpolated color every frame — this is what makes it feel continuous rather than snapping at breakpoints.
5. Respect `prefers-reduced-motion`: skip interpolation, just crossfade with a 400ms transition instead.

This is a ~40-line vanilla JS utility (no library needed for just the color interpolation) — GSAP ScrollTrigger is only needed for the 3D/parallax elements layered on top.

## 5. 3D elements (dark-theme appropriate)

Now that we're black-dominant, 3D can afford more contrast and a bit of glow without tipping into "gamer RGB" — thin light edges on dark geometry, like hardware photographed on a black backdrop:

- **Hero**: a 3D GPU card in dark material with a thin `--ink-100` edge-light (matches the "NVIDIA GeForce RTX 4060" card component from your dashboard) that tilts toward the cursor and settles into place on scroll.
- **"How it works"**: three flat cards (Submit → Schedule → Run) that lift on the Z-axis and connect with a thin animated `--ink-100` line as they scroll into view — echoes the Submit Workload flow.
- **Marketplace/providers section**: a loose grid of small GPU-card tiles with independent parallax depth (some drift slower than others) — visually says "many providers, one marketplace."
- **Pricing/billing**: a simple 3D meter/dial filling as you scroll, in `--ink-100` against the current tint background.

Keep true 3D restrained to the hero and the pricing meter, same as before — everywhere else, cheap CSS 3D transforms carry the depth.

Keep geometry simple (CSS 3D transforms + a couple of real Three.js moments at most) — this is a fintech-adjacent dev tool, not a game site. Precision over spectacle.

## 6. Section-by-section plan

| # | Section | Background stop | 3D/motion |
|---|---|---|---|
| 1 | Hero | `--bg-base` → `--tint-lavender` | Tilting GPU card, headline reveal |
| 2 | How it works | `--tint-lavender` | 3 lifting cards + connecting line |
| 3 | Live marketplace preview | `--tint-mint` | Parallax GPU tile grid |
| 4 | Security/Docker sandbox | `--bg-raised` | Exploded-view container graphic |
| 5 | Pricing/billing | `--tint-blush` | Filling 3D meter |
| 6 | CTA + footer | `--tint-amber` | Static, calm landing |

All backgrounds are dark stops now — the "flow" reads as a slow color temperature shift across a black canvas (cool violet → cool green → warm rose → warm amber) rather than a light one, but the mechanic in section 4 is unchanged.

---

## 7. Implementation prompt (hand this to Claude Code / your dev)

```
Build a marketing landing page for UniGPU, a peer-to-peer GPU marketplace
(students/devs run Python/CUDA ML workloads on idle GPUs shared by the
community; Docker-sandboxed execution, scheduling, real-time logs,
usage-based billing).

Stack: React + Tailwind CSS + GSAP (with ScrollTrigger) + Three.js (only
for the hero GPU model and the pricing meter — everything else uses CSS
3D transforms).

DESIGN TOKENS — dark theme (inverted from the light dashboard: black
becomes the dominant surface, white becomes the loud/primary color)
Colors:
  --bg-base: #0A0A0B
  --bg-raised: #131316
  --ink-100: #FAFAFA
  --ink-400: #A1A1AA
  --ink-600: #6B6B70
  --border: #242427
  --tint-lavender: #1B1730
  --tint-mint: #0F2019
  --tint-blush: #26141C
  --tint-amber: #241C10
  --accent-red: #F87171
  --accent-green: #4ADE80

Fonts (load via Fontshare CDN):
  Display/headings: Clash Display, weight 500/600
  Body/UI: Satoshi, weight 400/500
  Numerics/specs/code: JetBrains Mono, weight 400

Type scale: H1 56-72px/500 (mobile 36px), H2 36px/500, H3 22px/500,
body 16px/400 line-height 1.6, mono 14px.

Component style: rounded-2xl cards (16-20px radius), 1px solid
--border, no shadows, no gradients, deep desaturated tint chips for
status (mirroring the dashboard's lavender upload box, pink "Offline"
badge, small green/red status dots, just pulled dark) — never
saturated color blocks or neon glow. Primary buttons are solid
--ink-100 fill with --bg-base text (inverted "Go Online" button from
the dashboard). Recolor the logo mark white for this theme.

CORE MECHANIC — seamless scroll-driven background
Implement a fixed full-viewport background layer (z-index behind all
content). As the user scrolls, continuously interpolate its
background-color in RGB space between the tint of the section currently
centered in the viewport and the next one, using a scroll-position-driven
lerp (requestAnimationFrame, not CSS transition, so it tracks scroll
1:1). Each <section> declares its own target tint color via a data
attribute. No hard cuts between sections — the color should visibly
"flow." Respect prefers-reduced-motion by falling back to a 400ms
crossfade instead of scroll-linked interpolation.

SECTIONS (in order)
1. Hero — background flows from white to --tint-lavender.
   Headline + subhead about running ML workloads on idle community GPUs.
   A 3D GPU card (Three.js or high-quality CSS 3D card) that subtly
   tilts toward the cursor and eases into a resting rotation as the
   user scrolls past. Primary CTA button (solid --ink-900, white text,
   rounded-full) + secondary ghost button.

2. How it works — background --tint-lavender.
   Three steps: Submit workload -> Scheduled to a provider GPU -> Run
   with live logs. Each step is a card that lifts on translateZ and
   fades in on scroll (GSAP ScrollTrigger, staggered), connected by a
   thin animated line that draws in as you scroll.

3. Live marketplace preview — background --tint-mint.
   A loosely arranged grid of small GPU tiles (name, VRAM, CUDA
   version, status dot) with independent parallax scroll speeds per
   tile (some drift slightly faster/slower) to suggest depth and
   "many independent providers."

4. Security / Docker sandbox — background --bg-offwhite.
   Explain container isolation. An exploded-view or layered 3D graphic
   of a sandboxed container (simple CSS 3D layered planes is fine).

5. Pricing / usage-based billing — background --tint-blush.
   A 3D meter or dial (Three.js, simple torus/arc geometry, --ink-900
   material) that fills proportionally as the section scrolls into
   view, next to example pricing in mono type.

6. Final CTA + footer — background --tint-amber.
   Calm, static — no motion here, this is the resting point.

REQUIREMENTS
- Fully responsive down to 375px width. On mobile, disable Three.js
  scenes and cursor-tilt interactions; keep the scroll-background flow
  and simple fade/lift transitions only, for performance.
- Visible keyboard focus states on all interactive elements.
- Lighthouse performance budget: hero 3D scene must not block first
  paint — lazy-mount it after initial render.
- Dark theme only, no light mode toggle needed — this site is
  black-dominant by design, inverted from (but token-consistent with)
  the existing white dashboard at unigpu.in/dashboard.
- Match copy voice to the dashboard: plain, direct, sentence case,
  e.g. "Ready to run your next workload?" not marketing-speak.
```
