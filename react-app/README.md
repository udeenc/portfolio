# Portfolio React migration - Phase 4 validation

The existing portfolio layout, content, CSS, assets, and interactions are now in
React + Vite inside `react-app/`, on `feature/react-migration`. The original root
website remains unchanged. No production deployment or Phase 5 work has started.

Phase 4 results and the proposed Phase 5 plan are in [PHASE4-VALIDATION.md](PHASE4-VALIDATION.md).
Automated checks pass; browser/visual/GPU signoff is pending.

The Phase 4.5 checkpoint adds `.github/workflows/react-migration-ci.yml`: Ubuntu,
Node.js 24, locked dependency installation, lint, the complete test suite, and
production build. It runs on pushes to `feature/react-migration` and pull requests
targeting `main`, with read-only repository permissions. This workflow validates
the migration only; it does not publish artifacts or deploy the React version.
Browser review and an explicitly approved deployment migration are required
before merging. Auto-merge must remain disabled.

## Run locally

```powershell
cd react-app
npm.cmd ci
npm.cmd run dev
```

Open Vite's printed URL, normally http://localhost:5173/portfolio/.
Use npm.cmd on PowerShell when execution policy blocks npm.ps1; other shells can
use npm. All commands run inside `react-app/`.

```powershell
npm.cmd run build
npm.cmd run preview
npm.cmd run lint
npm.cmd test
```

Build output is `dist/`; preview normally serves http://localhost:4173/portfolio/.
The Vite base remains `/portfolio/`. No dependencies were added in Phase 3.
Environment: React/React DOM 19.3.1, Vite 8.3.5, Node 24.22.1, npm 11.19.1.

## React structure and interactions

App still composes Header, Hero, About, FeaturedProjects, Projects, Skills,
Education, Contact, and Footer in the original order. Header retains its Phase 2
React mobile menu. No content or layout redesign was made.

New components:

- `HeroGreeting.jsx`: React owns greeting text and typing/changing classes.
  Screen-reader text remains the original stable copy in Hero.
- `HeroOrb.jsx`: React owns the container/canvas and mounts the isolated renderer.
- `CustomCursor.jsx`: ref-owned decorative element with scoped pointer controller.

New effect modules:

- `effects/typewriter.js`: original messages, 55ms characters, 2000ms hold,
  180ms transition, and 800ms initial delay. Pauses offscreen/hidden and restores
  static greeting for reduced motion. Updates React state only for greeting changes.
- `effects/orbRenderer.js`: retained WebGL2 shaders, green palette, defaults,
  pointer equations, DPR cap, context-loss handling, and viewport/page lifecycle.
- `effects/cursor.js`: original frame-rate-independent .25 trailing interpolation,
  hover targeting, scroll hit testing, native text selection, and input/motion checks.
- `effects/smoothScroll.js`: local Lenis 1.3.27, lerp .12, wheel multiplier 1,
  native touch, native reduced-motion fallback, and accessible hash anchors.
- `effects/heroFade.js`: original native-scroll easing and shared Hero/Orb opacity;
  measures header/overlap on resize and font completion without section snapping.
- `effects/aboutReveal.js`: original reveal classes/threshold and one-time entrance
  behavior, with visible fallback when observers or motion are unavailable.
- `effects/lifecycle.js`: scoped event listener ownership, including shorter-lived
  cursor/scroll input sessions.

App mounts smooth scrolling once. Hero mounts fade measurements; About mounts its
reveal observer. Effects return cleanup functions. Timers, RAF handles, observers,
listeners, temporary focus attributes, styles, and WebGL objects are disposed on
unmount. High-frequency cursor/canvas/scroll state stays outside React state.
The root remains wrapped in React StrictMode. No old scripts are injected or
executed through global initializers.

## Source fidelity, assets, and licenses

`src/styles/style.css` remains byte-for-byte identical to `../css/style.css`.
This preserves geometry, cursor dimensions, responsive rules, static Orb fallback,
Hero/About overlap, and all original entrance/hover animation CSS.

Screenshots remain unchanged under `src/assets/images/`; imports produce hashed
`/portfolio/assets/` URLs for both image sources and full-size links. The original
Google Fonts links load Barlow Condensed Light, weight 300, in index.html.
All original section content, IDs, ARIA attributes, and external links remain.

The original Orb renderer was ported instead of replacing it with a different
React Bits component. No animation packages were installed. Lenis uses the exact
local 1.3.27 implementation, wrapped as ESM with small disposal patches. Details
and upstream attribution are in `src/vendor/README.md`. Full notices remain in
`src/vendor/` and `public/licenses/`, as well as the untouched root vendor files.

## Verification (2026-10-22)

- Production build and application lint pass.
- Eleven lifecycle and source-parity tests pass using fake DOM/media/timers/RAF/observers/WebGL
  objects plus the actual local Lenis constructor. They cover exact greeting
  messages/timings, pause/resume, reduced motion, setup-cleanup-setup replay,
  cursor interpolation/scroll hover, fade reversal/font remeasurement, About
  one-shot reveals, identical GLSL source, Orb resource/context/fallback paths,
  Lenis single-loop ownership, hash anchors, focus, and pending-work disposal.
- These are controller lifecycle tests, not browser or GPU integration tests.
  They model the setup/cleanup replay used by StrictMode; real React development
  StrictMode behavior still needs a browser smoke test.
- React server rendering and production resource HTTP checks pass.
- Original tracked website source, assets, styles, and vendor licenses are unchanged.
  No commit, push, merge, deployment, or GitHub Pages setting change was made.

## Intentional implementation differences

- React owns greeting state and canvas DOM nodes; imported effect modules replace
  the old global/IIFE initialization. The visual algorithms and settings are retained.
- Font completion explicitly refreshes Hero measurements, in addition to resize
  observation. About also responds when reduced-motion preference changes live.
- Orb cleanup releases all renderer-created WebGL objects/listeners, then checks
  canvas ownership in a microtask. Final unmount requests context loss when supported;
  synchronous StrictMode replay safely reclaims the canvas first.
- Lenis disposal additionally cancels its pending resize debounce and one-shot
  completion frames. No scrolling equations were changed.

## Manual verification still required

No browser is connected to this session. No pixel-perfect claim is made.
Review the original and React versions together on desktop/mobile, including:

- Actual shader compilation, GPU appearance, right-hand Orb alignment, glow,
  pointer response, context recovery, and resource behavior across navigation/HMR.
- React StrictMode replay in the browser, with no console errors, duplicate loops,
  or leaked listeners after repeated mounting.
- Actual font/image loading, headline size, Hero height, Scroll to Explore,
  About overlap, responsive layout, keyboard focus, and mobile menu.
- Typewriter/cursor/reveals/fade, tab visibility, offscreen pause/resume,
  reduced motion toggled live, native touch, and wheel/anchor scrolling.

Phase 4 is complete for review. Phase 5 has not been configured or activated.
