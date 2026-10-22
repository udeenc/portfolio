# Portfolio V2 — H1 static Hero foundation

Concept: **Immersive Data Lab**. Branch: `feature/portfolio-v2`.
Baseline: latest origin/main at `4fed9b2` (merged React migration).
H1 only. No new commit, push, merge, deployment, or Pages configuration change.

## Composition and exact content

Hero keeps section id home and heading id hero-title, with one semantic h1:

1. Hello, I'm Candra.
2. I build with data.

The second line is cyan. The exact eyebrow and supporting copy come from the H1
request. Explore Work points to #featured; About Me and Scroll to Explore point to
#about. Visible CTA labels provide accessible link names; decorative arrows and
constellation are hidden from assistive technology. Existing navigation/skip link,
keyboard access, custom cursor, Lenis and non-Hero section behaviors remain.

The Hero fills the viewport below the existing sticky header, grows naturally on
short screens or enlarged text, and uses three layers: navy atmosphere/vignette,
absolute static SVG constellation, and left-aligned foreground content. The SVG
is behind the content rather than a separate desktop illustration below it.
Decorative overflow is clipped; the foreground has no fixed desktop-only width.
Headline spans specify two lines, with natural wrapping available at narrow widths
or zoom rather than forcing horizontal overflow. Responsive rules adjust type,
spacing and constellation cropping at 800px and 600px.

## Files and scope

- `src/components/Hero.jsx`: new static semantic Hero; no animation hooks.
- `src/components/StaticConstellation.jsx`: decorative inline SVG, with unique
  gradient IDs from React useId. No side effects or timers.
- `src/data/constellation.js`: deterministic node/edge composition for reuse later.
- `src/styles/v2-tokens.css`: namespaced --v2-* colors, typography, spacing/radius.
- `src/styles/hero-v2.css`: H1 composition, responsive rules, static fallback.
- `src/main.jsx`: imports the new styles after the unchanged V1 stylesheet.
- `index.html`: adds the new Google Fonts stylesheet, retaining Barlow for V1.
- `tests/portfolio-validation.test.js`: exact non-Hero parity and new Hero contracts.
- `tests/interactions.test.js`: normalize both sides of the retained Orb shader
  comparison for Windows CRLF/Linux LF checkouts; renderer source is unchanged.
- This handoff and README entry document H1 and visual review status.

Major styling is limited to .lab-hero and .lab-constellation. Shared navigation
intentionally adopts the navy/cyan palette and Inter/JetBrains fonts. The cursor
controller is unchanged. About, projects, skills, education, contact and footer
retain their markup, content and V1 styling. The only adjacent-layout adjustment
is .lab-hero + .about-overlap margin-top: 0, preventing the old negative overlap
from covering the new Hero's lower controls. About's internal design is unchanged.

## Tokens and typography

| Role | Token value |
| --- | --- |
| Background | #080D16 |
| Surface | #121C2B |
| Primary text | #F0F5F9 |
| Accent | #61E8DB |
| Secondary accent | #A58AFF |
| Muted text | #A5B3C4 |
| Border | #293649 |

Space Grotesk weight 500 is the display face; Inter is the Hero/navigation body
face; JetBrains Mono is the label face. All have system fallbacks, display=swap,
and existing Google Fonts preconnects. No content has a font-loading visibility
gate. The V1 body font, Barlow typography and original global variables are not
replaced, keeping this milestone scoped.

## Static constellation and legacy effect isolation

The SVG uses 44 fixed nodes and connecting paths. Opacity, scale, radial halos,
and cyan/violet highlights create depth and a middle-right concentration. No
raster dependency, random per-render layout, WebGL, requestAnimationFrame, or
animation is involved. It works unchanged under reduced motion or WebGL failure.
It is aria-hidden, nonfocusable, pointer-events: none, and masked away from the
primary text area. Mobile crops the same absolute background at lower opacity.

Hero no longer imports HeroOrb, HeroGreeting or mountHeroFade and no longer uses
the legacy .hero / .hero-reveal class hooks. No inactive legacy effect can mutate
it. Existing CSS/renderer/components for the Orb, typewriter and fade are retained
unchanged for rollback; their old Hero code is available in the baseline commit.
The current production JS bundle excludes Orb shaders, typewriter copy and the
Hero fade controller. No Three.js, R3F, GSAP or other dependency was installed.

## Verification

- npm.cmd run build: passed (Vite 8.3.5).
- npm.cmd run lint: passed without warnings.
- npm.cmd test: all 14 tests passed, including retained lifecycle/gate tests.
- SSR checks: exact requested headline/copy, CTA anchor destinations, decorative
  accessibility, no canvas/legacy Hero hooks, unique IDs, section order, all
  anchors/ARIA targets, unchanged non-Hero markup/copy and assets/licenses.
- Original CSS file, legacy sources, non-Hero component files, dependencies,
  deployment workflows and Vite /portfolio/ base remain unchanged.
- Production preview returns HTTP 200 for /portfolio/, #about, #featured, all
  generated JS/CSS/PNG files, and both license notices. Built asset URLs use
  /portfolio/assets/.
- The official Google Fonts response includes Inter, JetBrains Mono and Space
  Grotesk; a referenced font asset returns HTTP 200. This does not prove rendered
  font metrics or browser typography.
- git diff --check passes. All changes remain uncommitted on the V2 branch.

## Visual review pending

No browser is connected to this session, so no desktop/mobile screenshot or
rendered overflow comparison was performed. Do not treat source/HTTP tests as
visual approval. Review at 1440x900, 1024x768, 800x900, 390x844 and 360x800
(suggested sizes, not completed tests), plus 200% zoom and reduced motion.

Check headline wrapping with loaded/fallback fonts, readable foreground over the
constellation, right-side density/depth, viewport height on short/mobile screens,
scroll indicator placement, CTA focus/touch targets, no horizontal overflow,
mobile menu open/close and transitions into the unchanged About section. Confirm
other sections/cursor/Lenis still behave as expected in the browser.

## H2 recommendation — after H1 visual approval

Keep this exact semantic foreground and static SVG as the baseline. Progressively
add an isolated, dynamically loaded 3D renderer in the same background layer,
reusing the fixed node/edge data and the approved composition. Retain the SVG for
reduced motion, narrow devices, loading/error states and unavailable WebGL. Scope
renderer/pointer/observer lifecycles, pause offscreen/hidden, cap resolution and
budget GPU work, and test mount/cleanup replay. Keep text/links fully usable
without the renderer. Decide any 3D dependency only after visual approval; do not
combine that work with Particle Dissolve or a redesign of the remaining sections.

Stop after H1 and wait for visual approval before implementing 3D Constellation.
