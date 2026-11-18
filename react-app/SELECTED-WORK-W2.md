# W2 — project reveals, hover emphasis and shared screenshot galleries

Branch: `feature/portfolio-v2`. The H5 checkpoint remains `12bc123`; all uncommitted
W1 work and the owner-supplied screenshots are preserved. No commit, push, merge,
deployment, Pages setting change, new dependency or W3/W4 detail page is included.

## Files changed in W2

- `src/components/SelectedWork.jsx`: one scoped reveal effect/ref and entry markers.
- `src/components/ProjectShowcase.jsx`: each existing article gets an entry marker.
- `src/components/ProjectMedia.jsx`: shared, load-safe gallery enhanced from the W1
  pipeline button UI, now used by Olist as well.
- `src/components/PipelineGallery.jsx`: preserves the pipeline entry point and
  labels, delegates to the same shared gallery without duplicating interaction code.
- `src/effects/galleryState.js`: pure selection/load/fade state transitions and
  a scoped reduced-motion subscription.
- `src/effects/workReveal.js`: once-only IntersectionObserver entry controller.
- `src/styles/selected-work.css`: shared gallery styling, calm reveals, hover/focus
  emphasis, responsive controls and reduced-motion/forced-colors fallbacks.
- `tests/work-interactions.test.js`: six focused gallery/reveal tests.
- `tests/portfolio-validation.test.js`: verifies both gallery defaults, orders,
  selected states, all existing copy, alt text, dimensions, IDs and links.
- `package.json`: includes the new test file in the complete test command.
- `README.md` and this report: implementation and review status.

Project data, screenshot files, copy, palette, typography, Hero implementation and
other sections were not changed by W2. The legacy conceptual PipelineVisual is
retained as rollback/reference source. No Selected Work module imports Three.js.

## Once-only reveals

Reuses the existing `createLifecycle` listener utility and the About reveal pattern
without modifying either. One IntersectionObserver watches five targets: eyebrow,
headline, description and two project articles. Each target is unobserved on first
entry. CSS uses 600ms opacity/20px translation, with 80ms and 160ms intro delays.

Content is visible by default. Animation is applied only to an entering target;
there is no permanent pre-hidden CSS state or React scroll state. This deliberately
uses finite CSS keyframes rather than arming hidden-to-visible transitions: missing
observers or initialization failure leave content readable. Setup failures clean up
partially installed observers/listeners. Reduced motion exposes everything and does
not replay reveals if switched off later. Focus entering a showcase cancels/skips
its reveal; focus does not become obscured during the animation. Cleanup removes
entry classes/listeners and disconnects the observer. No RAF or timer loop is added.

## Hover and focus

Fine-pointer hover raises only the media frame by 3px, brightens its existing accent
border and adds a restrained shadow. Link arrows move 2px. Focused gallery/project
controls also emphasize the media border, with independent visible focus outlines.
There is no scale, tilt, floating animation or hidden hover-only functionality.
Reduced motion disables nonessential animation/translation/transitions; focus
outlines remain. Cyan and violet continue to distinguish the existing projects.

## Shared galleries and transition safety

The pipeline's labeled native buttons, requested order and default are preserved:
Architecture Diagram, Airflow DAG, Star Schema. Olist now uses those same controls
with its existing labels: Executive overview, Sales analysis, Customer experience;
Executive Overview is the default. No screenshot or verified project fact changed.

Only the default screenshot is rendered initially per gallery (lazy/async). Other
screenshots are requested when explicitly selected. The current image stays visible
while a requested layer loads and decodes. After it is ready, the new image fades
over the retained previous image for 240ms; the previous layer is then removed.
Keys keep already-loaded DOM images stable through the layer change. There is no
whole-showcase remount, all-image preload, autoplay, continuous RAF or animation timer.

Selection versions reject stale load/error/fade actions during rapid clicks, even
when returning to a previously requested image. New requests cancel pending state
and old fade buffers; returning to the current image cancels the outstanding switch.
Failed requested images roll back selection to the last working image and provide
an explicit retry message. Decode completion after unmount cannot update state.
Reduced motion skips the fade buffer immediately, including live preference changes.

Both galleries reserve the same 16:9 viewport (4:3 below 600px); images are contained
without cropping or enlargement beyond native size. Captions reserve two lines of
space; short loading text avoids large layout changes. Each visible image has its
original meaningful alt text and full-size new-tab link. The link/caption describe
the image actually shown, including while a new selection loads.

## Accessibility and responsive behavior

- Native buttons work with Tab/Shift+Tab and Enter/Space and stay mounted/focused
  when selection changes. There is no focus trap or forced focus movement.
- `aria-pressed` exposes the requested selection; `aria-controls` points to the
  unique figure and `aria-busy` reports pending loading. Selection uses pressed
  state rather than also repeating the caption through a live region. Only errors
  use a status announcement. Background/loading layers have empty alt text and
  are hidden from assistive technology, leaving one meaningful screenshot.
- Controls have a 44px minimum height, clear selected border/inset emphasis and
  visible accent focus. Button dimensions/font weight stay consistent on selection.
  Forced colors retain system-color focus and selected boundaries.
- Desktop controls wrap; <=600px controls stack. Existing 800/600px summary,
  process and metric breakpoints remain. No important information depends on hover.
- Existing project information, rounded dataset metrics, association caveat,
  repository URL, heading hierarchy and navigation targets remain verified by SSR.

## Validation

- `npm.cmd run build`: passes. `npm.cmd run lint`: passes.
- `npm.cmd test`: all 34 tests pass (28 existing plus six new focused tests).
- New tests cover shared gallery defaults/navigation, selected/requested/current
  state, preserving an image until ready, stale events under rapid switching,
  failure/retry, live reduced-motion behavior and subscription cleanup, reveal
  once-only/focus behavior, setup failure, missing observers and mount replay.
- SSR validates actual rendered defaults and accessible pressed/control attributes,
  project ordering, all original Olist copy, image dimensions/assets and links.
- Production preview verifies all 13 resources byte-for-byte under `/portfolio/`,
  including all six screenshots and licenses. Hero renderer remains dynamically
  imported; no WebGL renderer is pulled into the critical gallery path.
- `git diff --check` and new-file whitespace/conflict checks pass. Hero, other
  section implementations and production workflow paths remain unchanged.
- Known build warning remains: lazy Three renderer ~533.45 kB minified / 133.14 kB
  gzip. W2 does not alter the warning threshold or renderer. Main JS is now
  ~277.49 kB / 85.65 kB gzip; CSS ~34.79 kB / 7.89 kB gzip.

Tests exercise real reducer/controller logic and SSR, with fake observer/media
events. They are not a browser click/rendering/assistive-technology test. A connected
browser is unavailable; no visual, console-error, GPU, overflow or real interaction
verification is claimed.

## Manual review before W3

Run `npm.cmd run dev -- --host 127.0.0.1` from `react-app/`, open `/portfolio/`:

1. At 1440, 1024, 768, 430, 390, 360 and 320px widths, inspect screenshot framing,
   no clipping/overflow, caption spacing, wrapped/stacked 44px controls, long labels,
   descriptions/tags and the approved W1 visual composition. Include 200% zoom.
2. Scroll down/up: intro staggers gently, articles reveal once, no replay or page
   scroll jank. Disable IntersectionObserver and reload: content must remain visible.
   Confirm Hero/dissolve, Lenis, cursor and unchanged sections remain intact.
3. Use mouse, touch and Tab/Shift+Tab + Enter/Space on every gallery button. Verify
   order/defaults, pressed states, focus staying on controls, captions/alt text,
   full-size links and a calm 240ms fade with no blank image between selections.
4. Throttle images, click repeatedly/reverse selections while loading, block a
   requested image and retry. The last working screenshot must stay visible;
   stale requests must not replace the final choice or trigger redundant errors.
5. Toggle reduced motion before load and mid-reveal/mid-gallery fade. Text stays
   readable, fades/elevation stop, galleries still switch, and focus remains clear.
   Test forced colors and a screen reader for selected-state/alt/link announcements
   without duplicated caption noise.
6. Inspect Console/Network and repeat HMR/remounts under React Strict Mode: no
   extra observer/listener ownership, blank layers, broken asset requests or state
   updates from a disposed decode. Background tabs and rapid switching must settle.

Stop after W2 for visual review. Do not start W3 or commit without authorization.
