# Design — Style Reference
> cool dawn over product canvas, with a terminal window left open

**Theme:** light (with a dark, code-native component set)

Design fuses Relate's restrained SaaS minimalism with Modal's developer-facing component language. The base is a cool-white canvas, near-black ink, and exactly one saturated accent (Royal Signal blue) doing all the brand talking — no second hue, no decorative color. Onto that calm surface, Modal contributes its terminal vocabulary: code-window cards, uppercase eyebrow labels, status chips, and a fixed blurred nav — all rebuilt in the same blue-on-white palette instead of Modal's green-on-black one. The result reads like a clean SaaS marketing site that occasionally opens a real, syntax-highlighted terminal to prove the product is technical — never a green-glow hacker aesthetic, never a cluttered dashboard. Density stays compact, corners stay soft (pill buttons, 8–16px cards), and shadows stay close to invisible. One accent, one type family, one philosophy: say more with less.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Snow Canvas | `#fcfcfc` | `--color-snow-canvas` | Page background, primary surface — the dominant neutral |
| Lavender Wash | `#f0f4fe` | `--color-lavender-wash` | Soft accent band behind hero/feature sections |
| Midnight Ink | `#020520` | `--color-midnight-ink` | Headings, hero text — near-black with a cool cast |
| Graphite Body | `#14141e` | `--color-graphite-body` | Body copy, secondary headings **and** the dark fill for code-window cards |
| Slate Caption | `#374151` | `--color-slate-caption` | Muted body text, nav labels |
| Ash Helper | `#6b7280` | `--color-ash-helper` | Helper text, metadata, code comments |
| Stone Divider | `#e2e8f0` | `--color-stone-divider` | Hairline borders, section dividers, card edges |
| Fog Surface | `#f1f5f9` | `--color-fog-surface` | Input backgrounds, disabled states |
| Royal Signal | `#145aff` | `--color-royal-signal` | The single brand accent — links, CTA outlines, eyebrow highlights, code keywords, active tags |
| Azure Focus | `#0099ff` | `--color-azure-focus` | Focus ring glow on inputs |
| Terminal White | `#f7f9ff` | `--color-terminal-white` | Text/string color inside dark code windows — a cool off-white, never pure `#fff` |

No greens, reds, or oranges — Modal's traffic-light dots and Relate's four-color status dots are both dropped in favor of a single accent, in keeping with the minimalist rule of "one hue, everywhere."

## Tokens — Typography

### Inter — the only typeface for headings, UI, and body copy. 600 for headlines, 500 for nav/subheadings, 400 for body. Display sizes carry aggressive negative tracking (-0.027 to -0.037em) for a tight, confident block. · `--font-inter`
- **Weights:** 400, 500, 600
- **Sizes:** 12, 14, 16, 18, 20, 22, 40, 56, 80
- **Letter spacing:** -0.037em (80px) → +0.006em (12px uppercase eyebrows)

### Roboto Mono — reserved entirely for code-window content, technical labels, and numerical callouts. Negative tracking keeps it geometric rather than typewriter-ish. · `--font-roboto-mono`
- **Substitute:** JetBrains Mono, Geist Mono
- **Weights:** 500, 700
- **Sizes:** 12, 14, 22
- **Letter spacing:** -0.045em, -0.030em

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 12px | 1.2 | +0.6px (uppercase eyebrows) | `--text-caption` |
| body-sm | 14px | 1.43 | — | `--text-body-sm` |
| body | 16px | 1.63 | — | `--text-body` |
| subheading | 20px | 1.4 | -0.16px | `--text-subheading` |
| heading-sm | 22px | 1.4 | -0.2px | `--text-heading-sm` |
| heading | 40px | 1.05 | -1.48px | `--text-heading` |
| heading-lg | 56px | 1.05 | -1.51px | `--text-heading-lg` |
| display | 80px | 1.05 | -1.52px | `--text-display` |

## Tokens — Spacing & Shapes

**Base unit:** 4px · **Density:** compact

### Spacing Scale
`4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 52, 72, 96` — the last two steps (72, 96) are borrowed up from Modal's scale for the rare full-bleed hero moment; everything else stays in Relate's tighter compact range.

### Border Radius

| Element | Value | Note |
|---------|-------|------|
| buttons | 9999px | pill — no exceptions |
| cards | 8px | inner/product cards |
| feature containers | 40px | outer hero/feature blocks |
| inputs | 12px | |
| code windows | 16px | matches pipeline-card radius, ties the dark component to the light system |
| tags / chips | 9999px | pill |

Hard 0° corners never appear — the softest overlap between both source systems.

### Shadows

| Name | Value | Token |
|------|-------|-------|
| sm | `rgba(0,0,0,0.1) 0px 0px 4px -2px` | `--shadow-sm` |
| feature | `rgba(0,0,0,0.08) 0px 0.36px 1.8px -1.4px, rgba(0,0,0,0.07) 0px 1.37px 6.87px -2.8px, rgba(0,0,0,0.016) 0px 6px 30px -4.25px` | `--shadow-feature` |
| glow | `rgba(20,90,255,0.1) 0px 0px 100px -28px` | `--shadow-glow` |

Code-window cards get **no shadow** (Modal's rule) — depth there comes from the hairline border alone, contrasting with the soft-shadow floating cards elsewhere on the page.

### Layout

- **Page max-width:** 1200px
- **Section gap:** 80px
- **Card padding:** 12–16px (product cards) / 52px 72px (feature containers)
- **Element gap:** 8–12px

## Components

### Ghost Outline Button
**Role:** Default action everywhere — primary and secondary alike

`#fcfcfc` background, `#145aff` text and 1px border, pill radius, 14px 32px padding, Inter 500. This is the *only* button treatment for CTAs; no heavy filled blocks. Directly inherited from Relate.

### Inverse Fill Button
**Role:** Rare, single highest-emphasis moment per page (e.g. final hero CTA)

`#020520` background, `#f7f9ff` text, pill radius, same padding as the ghost button. A restrained substitute for Modal's filled button — dark ink instead of a second color, so the one-accent rule holds.

### Navigation Bar
**Role:** Top-level site nav

`#fcfcfc` background, 1px bottom border `#e2e8f0`, fixed with light backdrop blur (borrowed from Modal's blurred carbon nav, translated to a near-white glass effect). Logo mark: 32px rounded-square `#145aff` fill with a white glyph, beside wordmark in Inter 600. Center links Inter 500 14–15px `#14141e`, hover shifts to `#145aff`. Right side: "Log in" text link + one Ghost Outline pill CTA.

### Hero Section
**Role:** Above-the-fold statement

Centered single-column stack over a soft `Lavender Wash` gradient band with a large bottom border-radius (40px). Headline 56–80px Inter 600, `#020520`, with exactly one word or short phrase recolored `#145aff` — Modal's "lime phrase as status LED" idea, translated to the single blue accent. Subhead 18–20px Inter 400, `#374151`, max-width ~560px. One Ghost Outline CTA below (occasionally paired with a second, quieter text link — never two filled buttons).

### Code Window Card
**Role:** Display SDK snippets, terminal output, technical proof — Modal's signature component, rebuilt in-palette

16px radius panel, `#14141e` (Graphite Body) background, 1px border in `rgba(20,90,255,0.18)`. Top bar: three small dots in muted grayscale (no traffic-light red/yellow/green — that would introduce extra hues), optional right-aligned filename in `#6b7280` Roboto Mono 12px. Content: Roboto Mono 14px, line-height 1.5 — keywords in `#145aff`, strings/output in `#f7f9ff`, comments in `#6b7280`. No shadow; the panel sits directly on the light canvas as a deliberate dark "window" into the product.

### Eyebrow Label
**Role:** Category tag above section headings

Inter 12px weight 500, uppercase, +0.6px tracking, color `#145aff` (swapped from Modal's muted moss green to the single brand blue, since this system has no secondary accent to spend). Sits 8–12px above its heading.

### Status Chip
**Role:** Feature flags, pipeline/deal states, "live"-style indicators — merges Relate's colored dots with Modal's pill chip

Pill radius, `rgba(20,90,255,0.1)` background with `#145aff` text for the active/positive state; transparent with `1px #e2e8f0` border and `#6b7280` text for neutral/inactive. Optional 4px leading dot in the same blue. Only one chip style is ever "on" per surface — no multi-color status systems.

### Feature Section Card
**Role:** Large containers for product feature blocks — can host a screenshot *or* a Code Window Card

`#fcfcfc` background, 40px radius, 52px 72px padding, the three-layer soft shadow stack. Heading 40px Inter 600 `#020520`. This is the bridge component: the same light, floating container from Relate can drop in either a product UI screenshot (Relate's native content) or a dark Code Window Card (Modal's native content), letting the page alternate proof types without changing its rhythm.

### Outlined Ghost Link
**Role:** Inline "Learn more" / navigation affordance

Transparent background, 1px `#e2e8f0` border at reduced opacity, pill radius, 8px padding, text `#374151`, Inter 14px 500. Modal's link-chip pattern, recolored to the neutral gray scale so it stays quiet next to the blue CTAs.

### Section Divider
**Role:** Separator between content bands

1px hairline in `#e2e8f0`, full content-width, used sparingly at major band transitions — purely functional, no decorative weight.

### Customer Logo Strip
**Role:** Social proof

Two rows of monochrome logos, `#14141e` at ~60–70% opacity, evenly spaced 40–60px gaps, no borders or backgrounds. Both source systems agree here almost exactly — kept as-is.

### Input Field
**Role:** Forms, search

`#ffffff` background, 1px `#e2e8f0` border, 12px radius, 15px padding. Focus state: `#0099ff` glow ring — the one place a second blue value is allowed, since it's a functional focus indicator, not a decorative accent.

## Do's and Don'ts

### Do
- Treat `#145aff` as the **only** saturated color in the system — it now carries the jobs both Relate's blue and Modal's lime used to carry (links, CTAs, eyebrows, code keywords, chips).
- Use pill radius (9999px) on every button and chip; reserve 8px for inner cards, 16px for code windows, 40px for outer feature containers.
- Let the Code Window Card be the *only* dark surface on the page — it should read as a deliberate window, not a section of the page going dark.
- Keep shadows to the two defined stacks (single-layer `sm` for product cards, three-layer `feature` for containers); code windows get none.
- Set body copy at 14–16px Inter 400 on `#fcfcfc` — never drop below 14px.
- Use Roboto Mono exclusively for code/technical content — never for headings or nav.

### Don't
- Don't reintroduce Modal's green, or Relate's red/orange/green status quartet — this merged system has exactly one accent hue.
- Don't fill CTA buttons with solid color blocks; the Ghost Outline pill is the default, the Inverse Fill dark button is the rare exception.
- Don't add 3D isometric illustrations or glow/bloom effects — that visual weight belongs to Modal alone and would fight the minimalist canvas.
- Don't use traffic-light (red/yellow/green) dots on code window top bars — use neutral gray dots instead.
- Don't exceed Inter weights 400/500/600 or introduce a second typeface for UI text — Roboto Mono is code-only.
- Don't apply the three-layer feature shadow to small components — it's reserved for large outer containers only.

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Canvas | `#fcfcfc` | Page background |
| 1 | Wash | `#f0f4fe` | Hero/feature band tint |
| 2 | Card | `#ffffff` | Product UI cards, inputs |
| 3 | Ink (dark) | `#020520` | Inverse fill button, footer band |
| 4 | Code Panel (dark) | `#14141e` | Code Window Card — the system's one deliberate dark surface |

## Elevation

- **Product/deal cards:** `rgba(0,0,0,0.1) 0px 0px 4px -2px`
- **Feature containers:** `rgba(0,0,0,0.08) 0px 0.36px 1.8px -1.4px, rgba(0,0,0,0.07) 0px 1.37px 6.87px -2.8px, rgba(0,0,0,0.016) 0px 6px 30px -4.25px`
- **Code Window Card:** none — hairline border only

## Imagery

Two proof modes coexist: Relate's product-UI-screenshot approach for marketing/sales-facing sections, and Modal's terminal-window mockups for developer-facing sections. No photography, no illustration, no 3D renders — visual interest comes entirely from real (or realistic) interface content: either a floating white product card or a dark syntax-highlighted code panel. Customer logos stay monochrome and quiet. This restraint is the point — the page should never compete with its own product for attention.

## Layout

Full-width sections capped at 1200px, centered. Hero: single-column, centered, badge → headline (one accent word) → subhead → one CTA, sitting over a soft wash gradient band. Below the fold, sections alternate between a centered heading + light product-screenshot feature card, and a heading + dark Code Window Card — giving the page a light/dark/light/dark rhythm without ever making a full section background dark. Eyebrow labels precede every section heading. Section gaps stay generous at 80px despite the otherwise compact internal density. Navigation is a single fixed, blurred top bar — no sidebar, no mega-menu. Footer is a dark `#020520` band, closing the page on the one intentional full-dark surface.

## Agent Prompt Guide

Quick Color Reference:
- text: `#020520` (headings), `#14141e` (body), `#374151` (secondary), `#6b7280` (muted)
- background: `#fcfcfc` (canvas), `#f0f4fe` (wash), `#ffffff` (cards), `#14141e` (code panel)
- border: `#e2e8f0` (hairline), `#145aff` (active/outline)
- accent: `#145aff` (the only saturated hue in the system)

### Example Component Prompts

1. **Hero:** `#fcfcfc` canvas over a `Lavender Wash` gradient band (40px bottom radius). Headline 56–80px Inter 600, `#020520`, one phrase in `#145aff`, letter-spacing ~-1.5px. Subhead 18px Inter 400 `#374151`, max-width 560px, centered. One Ghost Outline pill CTA (`#fcfcfc` bg, `#145aff` text/border, 14px 32px padding).

2. **Code Window Card:** 16px radius, `#14141e` background, 1px `rgba(20,90,255,0.18)` border, no shadow. Top bar with three neutral-gray dots and a right-aligned filename in Roboto Mono 12px `#6b7280`. Body: Roboto Mono 14px, keywords `#145aff`, output text `#f7f9ff`, comments `#6b7280`.

3. **Feature Section Card:** `#fcfcfc` bg, 40px radius, 52px 72px padding, three-layer soft shadow. Eyebrow label above heading: 12px Inter 500 uppercase `#145aff`. Heading 40px Inter 600 `#020520`. Below: either a white product-UI mockup card (8–16px radius, `sm` shadow) or a Code Window Card as defined above.

4. **Nav Bar:** Fixed, `#fcfcfc` bg with light blur, 1px bottom border `#e2e8f0`, 64px height. Logo: 32px `#145aff` rounded square + wordmark Inter 600 18px `#14141e`. Center links Inter 500 15px `#14141e` with 16px gaps. Right: text link "Log in" + one Ghost Outline pill CTA.

5. **Status Chip Row:** Pill chips, `rgba(20,90,255,0.1)` bg / `#145aff` text for active, `1px #e2e8f0` border / `#6b7280` text for neutral, 4px leading dot on active chips only, 4px 12px padding, Inter 500 12px.

## Motion & Animation Philosophy

Motion stays restrained and functional, following Relate's stillness-as-confidence approach: `ease` timing, no spring or bounce curves. Interactive feedback is limited to color shifts (gray → `#145aff`), opacity changes on hover, and small shadow-elevation increases on card hover. The one Modal-derived motion carried over is a slow (60–80s) ambient rotation reserved *only* for an optional decorative element inside a Code Window Card (e.g. a subtle cursor blink) — never applied to page chrome or buttons.

## Similar Brands

- **Linear** — near-identical compact density, near-black headline ink, single saturated accent, product-UI-as-hero
- **Vercel** — dark code-window components sitting inside an otherwise light, generous marketing page
- **Stripe** — one brand blue, achromatic everything else, large-radius feature containers
- **Railway** — flat surfaces and hairline borders standing in for shadows on the code/dev-facing components

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-snow-canvas: #fcfcfc;
  --color-lavender-wash: #f0f4fe;
  --color-midnight-ink: #020520;
  --color-graphite-body: #14141e;
  --color-slate-caption: #374151;
  --color-ash-helper: #6b7280;
  --color-stone-divider: #e2e8f0;
  --color-fog-surface: #f1f5f9;
  --color-royal-signal: #145aff;
  --color-azure-focus: #0099ff;
  --color-terminal-white: #f7f9ff;

  /* Typography — Font Families */
  --font-inter: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-roboto-mono: 'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Typography — Scale */
  --text-caption: 12px;   --leading-caption: 1.2;
  --text-body-sm: 14px;   --leading-body-sm: 1.43;
  --text-body: 16px;      --leading-body: 1.63;
  --text-subheading: 20px; --leading-subheading: 1.4;  --tracking-subheading: -0.16px;
  --text-heading-sm: 22px; --leading-heading-sm: 1.4;  --tracking-heading-sm: -0.2px;
  --text-heading: 40px;   --leading-heading: 1.05;     --tracking-heading: -1.48px;
  --text-heading-lg: 56px; --leading-heading-lg: 1.05; --tracking-heading-lg: -1.51px;
  --text-display: 80px;   --leading-display: 1.05;     --tracking-display: -1.52px;

  /* Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* Spacing */
  --spacing-4: 4px;  --spacing-8: 8px;  --spacing-12: 12px; --spacing-16: 16px;
  --spacing-20: 20px; --spacing-24: 24px; --spacing-28: 28px; --spacing-32: 32px;
  --spacing-36: 36px; --spacing-40: 40px; --spacing-52: 52px; --spacing-72: 72px;
  --spacing-96: 96px;

  /* Layout */
  --page-max-width: 1200px;
  --section-gap: 80px;
  --card-padding: 12px;
  --element-gap: 8px;

  /* Border Radius */
  --radius-buttons: 9999px;
  --radius-cards: 8px;
  --radius-inputs: 12px;
  --radius-code-window: 16px;
  --radius-feature-container: 40px;
  --radius-tags: 9999px;

  /* Shadows */
  --shadow-sm: rgba(0, 0, 0, 0.1) 0px 0px 4px -2px;
  --shadow-feature: rgba(0, 0, 0, 0.08) 0px 0.36px 1.8px -1.4px, rgba(0, 0, 0, 0.07) 0px 1.37px 6.87px -2.8px, rgba(0, 0, 0, 0.016) 0px 6px 30px -4.25px;
  --shadow-glow: rgba(20, 90, 255, 0.1) 0px 0px 100px -28px;

  /* Surfaces */
  --surface-canvas: #fcfcfc;
  --surface-wash: #f0f4fe;
  --surface-card: #ffffff;
  --surface-ink: #020520;
  --surface-code-panel: #14141e;
}
```

### Tailwind v4

```css
@theme {
  /* Colors */
  --color-snow-canvas: #fcfcfc;
  --color-lavender-wash: #f0f4fe;
  --color-midnight-ink: #020520;
  --color-graphite-body: #14141e;
  --color-slate-caption: #374151;
  --color-ash-helper: #6b7280;
  --color-stone-divider: #e2e8f0;
  --color-fog-surface: #f1f5f9;
  --color-royal-signal: #145aff;
  --color-azure-focus: #0099ff;
  --color-terminal-white: #f7f9ff;

  /* Typography */
  --font-inter: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-roboto-mono: 'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Typography — Scale */
  --text-caption: 12px;
  --text-body-sm: 14px;
  --text-body: 16px;
  --text-subheading: 20px;
  --text-heading-sm: 22px;
  --text-heading: 40px;
  --text-heading-lg: 56px;
  --text-display: 80px;

  /* Spacing */
  --spacing-4: 4px; --spacing-8: 8px; --spacing-12: 12px; --spacing-16: 16px;
  --spacing-20: 20px; --spacing-24: 24px; --spacing-28: 28px; --spacing-32: 32px;
  --spacing-36: 36px; --spacing-40: 40px; --spacing-52: 52px; --spacing-72: 72px;
  --spacing-96: 96px;

  /* Border Radius */
  --radius-buttons: 9999px;
  --radius-cards: 8px;
  --radius-inputs: 12px;
  --radius-code-window: 16px;
  --radius-feature-container: 40px;

  /* Shadows */
  --shadow-sm: rgba(0, 0, 0, 0.1) 0px 0px 4px -2px;
  --shadow-feature: rgba(0, 0, 0, 0.08) 0px 0.36px 1.8px -1.4px, rgba(0, 0, 0, 0.07) 0px 1.37px 6.87px -2.8px, rgba(0, 0, 0, 0.016) 0px 6px 30px -4.25px;
  --shadow-glow: rgba(20, 90, 255, 0.1) 0px 0px 100px -28px;
}
```
