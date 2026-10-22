# H4 — responsive, performance and accessibility audit

Branch: `feature/portfolio-v2`. H1–H3 manual approval was provided by the owner in
the H4 request; historical reports retain their earlier testing status. H4 makes
targeted refinements only. Copy, display typography, seeded nodes, dissolve curves,
section structure, links, legacy rollback source and deployment settings remain.
No new dependency, commit, push, merge or deployment is included. H5 is not started.

## Files changed in H4

- `src/styles/hero-v2.css`: measured-height fallback, safe areas, touch target sizing,
  narrow CTA containment, stronger left masking, scroll label legibility and forced colors.
- `src/effects/heroDissolve.js`: actual header height shared with CSS/anchor padding;
  orientation remeasurement and cleanup restoring the previous custom property.
- `src/effects/constellation.js`: coalesced pointer measurements, fewer DOM writes,
  zero-size pause/recovery, orientation handling and preference-based eligibility.
- `src/effects/constellationScene.js`: subtle link opacity increase, precomputed flow
  edge selection and no position-buffer updates for fully faded links/highlights.
- `src/effects/cursor.js`: Tab returns to the native cursor presentation.
- `tests/constellation.test.js`, `tests/hero-dissolve.test.js`,
  `tests/interactions.test.js`, `tests/portfolio-validation.test.js`: focused
  lifecycle, responsive eligibility, orientation/header, keyboard and semantic checks.
- `README.md` and this report: current status, findings and review instructions.

Existing uncommitted H1–H3 files are preserved alongside these changes. Neither
`package.json` nor the lockfile was changed by H4.

## Responsive findings and adjustments

The Hero already uses minimum height, normal-flow content, wrapping CTA rows and
responsive type. It has no fixed-height content stage; short screens/enlarged text
can increase its height. Decorative overflow stays clipped without setting a fixed
foreground height. No breakpoint, headline scale or desktop content spacing was
changed to compensate for unmeasured rendering.

The former 85/73px header assumptions could diverge from the actual mobile menu,
font metrics or zoom. Header measurements now provide `--lab-sticky-header-height`
to Hero minimum-height calculation and native anchor scroll padding, including
reduced-motion mode. Existing values remain the initial CSS fallback. A changed
header height may cause one follow-up ResizeObserver measurement; the property is
only written when height changes, preventing a measurement/style feedback loop.

Hero/navigation centered gutters now reserve the larger of the existing gutter
and either horizontal safe-area inset. Symmetric reservation also covers asymmetric
notches. Bottom Hero padding and header top padding respect relevant safe areas.
At zero insets these preserve existing dimensions. This does not enable edge-to-edge
viewport rendering for the whole portfolio or alter the viewport meta tag.

CTAs retain their approved 48/50px minimum height and row wrapping, with a maximum
width and emergency word wrapping for narrow/enlarged text. Navigation links and
the menu button have at least 44px target height, preserving their layout/palette.
Menu wrapping/breakpoints and other sections' styles are unchanged.

### Target review matrix

| Viewport | Expected Hero mode | Browser visual test |
| --- | --- | --- |
| 1920 × 1080 | Desktop 3D with fine/hover input | Pending |
| 1440 × 900 | Desktop 3D with fine/hover input | Pending |
| 1366 × 768 | Desktop 3D with fine/hover input | Pending |
| 1024 × 768 | 3D with fine/hover input; SVG on touch | Pending |
| 768 × 1024 | SVG | Pending |
| 430 × 932 | SVG | Pending |
| 390 × 844 | SVG | Pending |
| 360 × 800 | SVG | Pending |
| 320 × 568 | SVG; content grows beyond viewport if necessary | Pending |

Tests exercise fallback eligibility at these widths, not rendered layout at these
sizes. Wrapping, overflow, clipping, mobile navigation and short-screen composition
require the browser matrix; they are not confirmed by unit tests.

## Subtle constellation polish

Line opacity increases from .13 to .15 (before the unchanged dissolve envelope).
The horizontal SVG/canvas mask moves from 28% transparent / 65% opaque to
32% / 68%, reducing interference behind the headline while preserving the dense
middle-right. Node colors, illumination shader, size/depth variation, 150 seeded
positions, topology and six flow paths are unchanged. No bloom/postprocessing is
added. Scroll label size increases from .65rem to .68rem with slightly clearer
letter spacing; its muted color and understated position remain.

## Performance and quality tiers

- Nodes, links and highlights remain three batched primitives. Geometry/materials
  are allocated once and reused; no React updates or new per-node objects per frame.
- Fully faded links/flows skip their CPU position updates and buffer version writes,
  as well as drawing. Flow-edge lookup is computed once. Geometry returns correctly
  when the scroll direction reverses.
- Pointer events store coordinates; at most one Hero layout read runs per rendered
  frame, before canvas size writes. Canvas readiness mutates CSS only when it changes.
- Zero-size hosts stop RAF and wake through ResizeObserver; orientation invalidates
  framing. The existing 30 rendered FPS/DPR 1.5 caps are preserved.
- Offscreen, hidden, fully dissolved and context-lost states pause; return uses the
  latest progress. Context restore, disposal, late imports, Strict Mode replay and
  listener/observer/subscription cleanup remain covered by tests.

Keep a simple stable high/static policy. High uses the approved 150 nodes, six
highlights and existing caps. Low uses SVG for <=900px, coarse/no-hover input,
reduced motion, Save-Data, missing observers or unavailable/failed WebGL. Forced
colors hides purely decorative layers and avoids starting the GPU renderer.
Hardware memory and logical core queries were removed; neither is used to classify
devices. There is no new GPU identification, benchmarking or fingerprinting.

A medium/measured-performance tier is intentionally deferred: this session has no
browser/GPU frame-time evidence to justify trading away approved quality. There
are no unstable automatic tier oscillations or repeated failure retries. Actual
thermal/GPU/frame-rate improvement has not been measured.

## Accessibility

SSR checks verify one meaningful h1, no skipped heading levels, unique IDs, anchor
targets, ARIA references and unchanged semantic CTA/navigation markup. Canvas/SVG
remain decorative, unfocusable and pointer-transparent. No hidden duplicate copy.
H3's `:focus-within` content override and focused scroll-link override remain; fading
never changes tab order, adds inert, or removes content from assistive technology.
Tab hides the hover cursor decoration and restores native cursor presentation.
Touch/native editing input, visible focus outlines, menu Escape handling and native
scrolling remain. Real keyboard/screen-reader/menu behavior still needs a browser.

Reduced motion disables renderer/parallax/dissolve, uses SVG and readable stationary
content, and retains the existing CSS/Lenis native-scroll fallback. Layout/header
measurements still update. Forced-colors mode removes atmosphere/constellation
decoration and uses system colors for CTA borders/focus outlines.

Palette calculations (sRGB relative luminance) were compared with
[WCAG text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

| Pair | Calculated ratio |
| --- | --- |
| Main text / navy | 17.73:1 |
| Muted description/scroll label / navy | 9.12:1 |
| Muted / combined maximum 7% cyan + 7% violet atmosphere | 7.34:1 |
| Cyan headline / navy; navy text / cyan CTA | 13.04:1 |
| Secondary CTA text / hover surface | 15.60:1 |
| Violet focus outline / navy | 7.11:1 |
| Header muted / 97% navy over a white underlay | 8.63:1 |

These establish static palette contrast, not full WCAG conformance. Fading text
intentionally loses opacity; focused controls bypass that fade. Animated nodes,
composited backgrounds, actual glyph edges and focus positions require rendered
inspection. Low-contrast secondary borders and network edges are decorative;
CTA identification remains its high-contrast text, with a separate focus outline.

## Automated results and bundle audit

- Build: passes. Lint: passes. Full suite: 28 tests pass.
- New/extended tests cover target-width/input fallback selection, forced-colors and
  reduced-motion changes, pointer read coalescing, zero-size/orientation recovery,
  actual header offsets even with reduced motion, cursor keyboard return, heading
  hierarchy, hidden-buffer reuse, context/cleanup and current-progress restoration.
- Preview serves all 10 generated resources byte-for-byte under `/portfolio/`,
  including images, lazy renderer and three license files. Font references remain;
  font metrics/loading were not inspected in a browser.
- Output has two JS files. Three.js remains in the dynamically imported renderer
  chunk, absent from the critical entry and HTML preloads. `npm ls` confirms one
  Three.js 0.186.1 and deduplicated React 19.3.1. No dependency or Vite config change.
- `git diff --check` and new-file whitespace/conflict checks pass. Original root
  website and deployment workflow paths remain unchanged.

| Production output | Before H4 min / gzip kB | After H4 min / gzip kB |
| --- | --- | --- |
| Main JS | 271.69 / 83.44 | 272.21 / 83.62 |
| Lazy renderer JS | 533.31 / 133.12 | 533.45 / 133.14 |
| CSS | 22.95 / 5.87 | 23.91 / 6.06 |

Small byte increases buy lifecycle/accessibility handling and less repeated work.
No meaningful safe library-size reduction was identified without changing the
renderer or importing unsupported internal modules. The 500 kB Vite warning remains
visible; splitting the same renderer into extra files merely to silence it is not
an optimization. No warning threshold was raised.

## Manual H5 review checklist (no H5 work started)

No browser is connected: no screenshots, actual shader compilation, console audit,
GPU profiling, assistive-technology run or pixel-perfect responsiveness is claimed.
Run `npm.cmd run dev -- --host 127.0.0.1` in `react-app/` and open `/portfolio/`:

1. Inspect every viewport in the matrix with loaded and blocked fonts, 200% zoom
   and enlarged text. Check wrapping, horizontal overflow, CTA spacing, short-screen
   natural growth, scroll indicator, safe areas and sticky-header clearance.
2. Compare approved desktop composition at zero scroll: slightly clearer links,
   calm node illumination, protected headline area and restrained scroll label.
3. Scroll/reverse rapidly, jump through Home/About/Explore Work/header anchors,
   reload at a hash and return via history. Resize/rotate mid-dissolve; confirm
   zero-progress restoration and readable focused controls throughout.
4. Tab/Shift+Tab through skip link, mobile menu, CTAs and scroll indicator; test
   Escape, visible focus, native cursor return, text selection and screen-reader
   names/heading navigation. Touch controls must work without hover.
5. Toggle reduced motion and forced colors before load and live. Verify no canvas
   or renderer download in static mode, no forced smooth scrolling under reduced
   motion, normal anchors, stable SVG and stationary readable content.
6. Throttle/deny the renderer chunk and simulate shader/context failures; confirm
   usable text/CTAs and fallback without blank layers. Lose/restore WebGL context.
7. Profile offscreen/hidden/full-dissolve pause and current-progress resume, DPR
   and 30 FPS caps, repeated Strict Mode/HMR mounts and sustained integrated-GPU
   use. Check for console/network errors, duplicate canvases/listeners or leaks.
8. Smoke-test unchanged About/projects/assets, navigation, cursor and Lenis. Record
   visual/performance/accessibility signoff before authorizing H5 separately.

Stop after H4. No production settings, commit, push, merge, deployment or H5.
