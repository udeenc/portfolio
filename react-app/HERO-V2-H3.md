# H3 — reversible scroll-driven particle dissolve

H3 changes only the approved V2 Hero transition. H1/H2 copy, geometry, fonts,
palette, CTA destinations and the constellation at zero progress are preserved.
Header, other sections, legacy effects and deployment configuration are untouched.
There are no new dependencies. H4 is outside this work.

## Files in this phase

Created `src/effects/heroDissolve.js`, `tests/hero-dissolve.test.js` and this report.
Modified `src/components/InteractiveConstellation.jsx`, `src/data/constellation3d.js`,
`src/effects/constellation.js`, `src/effects/constellationScene.js`,
`src/styles/hero-v2.css`, `tests/constellation.test.js`, `package.json` and `README.md`.
The working tree also contains the existing uncommitted H1/H2 work; it is retained.

## Geometry and scroll ownership

The measured start is `Hero document top - header height`. The measured end is
`next section document top - header height`. Progress is clamped to [0,1] from
`(native scrollY - start) / max(1, end - start)`. With the current layout, start is
zero and completion occurs when About reaches the header. A one-pixel denominator
guard is only for degenerate layouts, not a hardcoded animation distance.

Hero/header/next-section ResizeObserver, window resize, font readiness and later
font-loading completion invalidate cached bounds. Reads are grouped before CSS
writes and are not repeated during ordinary scroll frames. Returning from hidden
pages or the browser history cache refreshes measurements. Initial mounting reads
the current scroll position immediately, including anchor/restored positions.

Native scroll events coalesce into one event-driven RAF. Existing Lenis
`portfolio:smooth-scroll` notifications consume the actual native position in the
same frame and cancel any pending native update. Identical progress skips style
writes. There is no new Lenis instance, continuous scroll loop, lock, snap or
scroll interception. A mount-local scalar store passes progress to the existing
renderer without React rerenders.

## Dissolve and reversibility

The H2 random sequence and original node data are unchanged. Once per scene, node
IDs and original positions generate bounded outward offsets around the dense
cluster, with modest depth. Full displacement is approximately 0.7–2.2 world units.
Every rendered position is recomputed as H2 base + H2 ambient motion + fixed offset
times a smooth progress envelope. No offset accumulates and no frame calls
`Math.random()`. At the same progress/time/pointer, geometry is identical in either
scroll direction; different times retain intentionally subtle H2 ambient motion.

The original conceptual stages are retained, with overlapping smoothstep ranges:

- 0–25%: exact H2 particle/connection positions, brightness and pointer behavior.
- 25–55%: gentle early spread; edge highlights fade to zero by 55%.
- 25–65%: connections stretch with their live endpoints and fade to zero.
- 55–85%: stronger outward spread and foreground fade; scene is nearly gone.
- 85–100%: dispersion settles and visibility reaches zero. Content is fully faded
  at 95%; the scene reaches zero at 100%.

The scene wrapper fades from 55–100%, covering both SVG and canvas; node shader
opacity also decreases, creating the faster final dissolution of individual nodes.
The Hero retains ordinary document scrolling, with no sticky stage or extra height.
The physical duration therefore adapts to actual viewport/content geometry and
scroll speed. Manual review must assess how much of the departing scene is visible.

## Content, focus and fallbacks

Eyebrow, both headline lines, description, CTAs and scroll indicator use opacity
and at most 16px upward translation over 55–95%. Typography and layout do not
change. CSS `:focus-within` restores the entire content group to full opacity and
zero translation when either CTA is focused; the scroll link has its own focus
override. Links remain in the tab order with unchanged destinations. Nothing is
made inert, hidden from assistive technology, or removed from the DOM. Returning
to the top restores the default presentation.

Unsupported WebGL, failed renderer, constrained desktop and mobile use the
existing SVG plus lightweight wrapper/content fade; no particle work runs there.
Reduced motion resets progress and removes all scroll-linked styles. A matching
CSS media query independently forces readable, stationary content and decoration.
Normal anchors and scrolling remain active in every mode.

## Performance and lifecycle

H2's 30 FPS/DPR 1.5 caps, three batched primitives, hidden/offscreen pause,
context recovery and GPU disposal remain. No textures, meshes or draw calls are
added. Hidden connections and flow Points are excluded from drawing once faded.
Each node adds just three offset multiplications/additions per rendered frame;
offset arrays are allocated once. Progress calculations do not allocate per-node
objects or update React state.

At progress 1 the renderer RAF is cancelled; the wrapper is fully transparent, so
a stale last canvas frame cannot remain visible. Resources are retained for return
scrolling, as with H2 offscreen pause. Falling below 1 resumes with current progress,
including after context/visibility/preference pauses. When initially mounted beyond
the Hero, the renderer is not even loaded until it is needed. Unmount unsubscribes
the shared store, aborts listeners, cancels pending RAF, disconnects observers,
restores CSS defaults and guards late font callbacks/imports. Strict Mode replay
uses fresh mount-local state.

## Validation

- Production build and lint pass; all 25 tests pass.
- Tests cover clamping, fixed offsets, geometry equality on repeated/reversed
  progress, no accumulated displacement, exact restoration at zero, the first
  quarter holding H2, final zero opacity, native/Lenis coalescing, cached layout,
  resize/font updates, anchor-sized jumps, reduced motion, lifecycle cleanup,
  renderer sleep/resume and latest progress after pauses.
- Focus override rules and unchanged focusability are checked statically; real
  keyboard usability still requires a browser. Geometry/material tests use real
  Three objects with an injected fake renderer, not an actual GPU.
- Production HTTP resource checks verify `/portfolio/` paths, images, renderer
  chunk and license files. Font link references are preserved; actual browser
  font loading is not verified here.
- `git diff --check` passes. Root website and workflow files are unchanged.
- Vite retains H2's large-chunk warning: lazy Three renderer approximately 533 kB
  minified / 133 kB gzip. No threshold was raised to conceal the warning.

## Required manual visual review

No browser is connected, so no desktop/mobile screenshots, shader compilation,
actual GPU performance or visual fidelity are claimed.

Run `npm.cmd run dev -- --host 127.0.0.1` in `react-app/`, then open the displayed
URL with `/portfolio/`:

1. Desktop 1440×900 and 1920×1080: compare zero scroll to H2, then scroll slowly
   through 25/55/85/100% and back. Review spread restraint, connection breakup,
   flow fading, text legibility, content translation and the handoff to About.
2. Reverse rapidly and jump through About/Explore Work/header anchors, reload on
   an anchor, and return to Home. Nodes must reform and text must fully return.
3. Tab through both CTAs and the scroll indicator while partially scrolled.
   Focused content must be readable with the existing focus ring and usable links.
4. Resize mid-transition and load fonts under network throttling. Progress should
   follow the newly measured geometry without breaking layout. Inspect for overflow.
5. Mobile 390×844 and tablet 768×1024: verify SVG-only fade, normal touch scrolling,
   readable content and anchors. Toggle reduced motion before load and live during
   a transition; all scroll-linked motion/fading should stop.
6. Hide/restore the page, scroll out/back, simulate WebGL context loss/restoration
   and blocked WebGL. Inspect RAF/GPU activity at full dissolve, console errors,
   fallback visibility and current progress on return. Exercise development Strict
   Mode/HMR remounts; check for duplicate canvas/listener/RAF ownership.

Stop at H3 for review; no H4, commit, push, merge, deployment or Pages change.
