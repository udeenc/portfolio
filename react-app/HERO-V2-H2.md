# H2 — Interactive constellation

H2 enhances the H1-approved Hero only. Copy, typography, layout, tokens, CTA links,
static SVG, navigation, Lenis, cursor and other sections are preserved. Legacy Orb,
typewriter and Hero fade remain disconnected. Particle Dissolve belongs to H3.

## Rendering and dependencies

- Added pinned `three@0.186.1` (MIT); full notice ships at
  `/portfolio/licenses/three.LICENSE.txt`. Existing vendor notices are retained.
- Evaluated stable `@react-three/fiber@9.8.2`, whose React peer range includes the
  installed 19.3.1. Fiber 9 is the documented React 19 pairing:
  https://r3f.docs.pmnd.rs/getting-started/introduction . Direct Three.js was chosen
  because three batched primitives need no declarative scene reconciler. No Fiber,
  Drei, postprocessing, texture or other animation dependency was installed.
- React owns a decorative wrapper, the unchanged SVG and an empty host. A scoped
  effect dynamically imports the renderer and owns one fresh canvas inside that
  host. Cleanup removes it; Strict Mode replay cannot reuse a disposed context.
- One Points object draws nodes, one LineSegments object draws links, and one
  Points object draws six traveling highlights: three draw calls, no per-node
  meshes, DOM updates or React updates per frame. Point shaders create restrained
  analytic cores/halos without bloom or textures. This is an abstract decoration,
  not live project telemetry.

## Composition and motion

`constellation3d.js` starts with H1's 44 anchors and adds seeded, bounded offsets
around central/right anchors for 150 nodes. Depth spans 2.6 world units; the cloud
is neither spherical nor a uniform starfield. Sorted nearby 3D pairs within 1.9
units form a fixed graph, with at most three links per node. No edges are rebuilt
per frame. Cyan/violet match H1 tokens; depth changes apparent size and opacity.

The perspective camera matches SVG slice framing; rotation pivots around the dense
right-hand cluster. The existing left-side mask protects the reading area. Nodes
drift a few pixels and brightness varies slowly by 8%. Pointer movement is clamped
and exponentially interpolated into at most .035 radians horizontally and .018
vertically, plus small ambient rotation. Pointer leave/blur returns toward neutral.
Passive listeners never cancel input; the decorative canvas cannot intercept it.

Six deterministic edges carry highlights on 12–20.5 second cycles. Highlights use
the current moving endpoints and fade at each end before repeating. All highlights
share one geometry/material.

## Fallback and lifecycle

- The unchanged H1 SVG renders immediately, including server rendering. Canvas
  replaces it atomically only after a successful first frame and shader health
  check. Failure leaves/restores SVG, with no retry loop. It is not crossfaded, so
  the two networks never visually double up during a transition.
- Static mode: reduced motion, width <=900px, coarse/no-hover input, Save-Data,
  reported memory <4 GB or fewer than four logical cores, missing observers,
  unsupported WebGL2 or initialization/render/shader failure. Missing device hints
  alone do not disable desktop rendering. Capability hints are conservative
  heuristics, not GPU benchmarks. The download starts only when eligible and visible.
- A single RAF chain is capped at 30 rendered frames/second and DPR at 1.5.
  Transparent rendering uses no antialiasing or postprocessing. RAF callbacks still
  follow display refresh; skipped callbacks perform no draw/buffer updates.
- IntersectionObserver, page visibility and pagehide/pageshow stop/restart RAF;
  paused time is excluded. ResizeObserver and window resize update framing/DPR.
  Offscreen/hidden scenes retain GPU resources for a fast return. Switching to
  constrained/static mode releases them entirely.
- Context loss immediately restores SVG and stops RAF; context restoration lets
  Three rebuild resources before rendering resumes. Cleanup removes listeners
  before forced context loss, disposes all three geometries/materials and renderer,
  cancels RAF, disconnects observers, and removes the canvas. Late imports cannot
  initialize after unmount. All ownership is local to a mount.
- Tradeoff: the lazy renderer chunk is ~534 kB minified/~133 kB gzip; Vite emits
  its default 500 kB chunk warning. This is not downloaded on static-mode devices.
  The warning is retained, rather than hidden by raising the limit. No additional
  chunking or dependency was introduced simply to silence it.

## Validation and manual approval

Build/lint pass; 19 tests pass. Five new tests cover deterministic topology,
bounded degree, batched geometry, DPR, edge highlight positions, preference changes,
visibility/offscreen/context pause/recovery, pending imports, initialization/shader
failure, setup-cleanup-setup replay, and resource/listener/RAF disposal. GPU objects
are real Three geometry/materials with an injected fake renderer; controller tests
use fake DOM/observers/RAF. They do not compile shaders or prove actual browser
Strict Mode behavior. Production resources are checked under `/portfolio/`.

No connected browser was available; GPU rendering and visual fidelity are unverified.
Before H3, run `npm.cmd run dev -- --host 127.0.0.1` and visit the displayed URL
with `/portfolio/`. Review:

1. Desktop 1440×900 and 1920×1080: H1 headline/CTAs/scroll indicator unchanged;
   restrained middle-right network, readable left side, depth/brightness and edge
   density, smooth pointer response and neutral return. Observe several full flow
   cycles; check selection, CTA focus/clicks, cursor and Lenis anchors.
2. Mobile 390×844 and tablet 768×1024: original static SVG only, no canvas or
   renderer download, no overflow, usable menu and anchors. Also test a touch laptop.
3. Toggle reduced motion live; SVG should replace the canvas immediately. Toggle
   back on eligible desktop, then resize across 900px. Check console/network errors,
   Google Fonts, screenshot assets and `/portfolio/licenses/three.LICENSE.txt`.
4. Scroll Hero offscreen, hide/restore the tab, and navigate away/back; inspect
   Performance to confirm no scene draws while paused and only one RAF chain.
5. In DevTools obtain the canvas WebGL2 context and `WEBGL_lose_context` extension;
   lose and restore the context. SVG must cover the loss, then 3D must return.
   Simulate blocked WebGL and check that SVG remains visible on reload.
6. With React development Strict Mode/HMR, repeatedly remount; inspect for extra
   canvases, listeners or contexts and any shader errors. Test integrated/mobile
   hardware and a high-DPR desktop for sustained frame rate and thermal impact.

H2 stops here for appearance approval. No H3, commit, push, deployment, merge,
main update or Pages configuration change is included.
