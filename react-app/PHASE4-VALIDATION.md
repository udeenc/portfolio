# Phase 4 validation and production readiness

Audit date: 2026-10-22. Branch: `feature/react-migration`.

**Automated readiness checks pass. Visual/browser signoff is still required before
production deployment.** No merge, deployment, workflow activation, or GitHub Pages
setting change was performed.

## Baseline and scope

Git starts and ends with the expected untracked `.gitignore` and `react-app/`
from the uncommitted migration phases. No tracked original website file differs
from HEAD, and nothing is staged. The original root HTML, CSS, JavaScript,
screenshots, and licenses remain available and unchanged.

Reviewed original markup, styles, interaction scripts, Orb renderer, vendor
sources/notices, and the migrated React components, controllers, tests, and Vite
configuration. No design, copy, shader, or dependency changes were introduced.

## Results

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| Production build | Pass | Vite 8.3.5, 39 modules; JS 279.30 kB (86.07 kB gzip) |
| Application lint | Pass | No warnings or errors; adapted minified vendor remains excluded |
| Tests | Pass | 11 tests, zero failures |
| React structure and copy | Pass | Server-rendered markup matches original elements/text/attributes, allowing the functional menu state, React-owned canvas, and original script's current-year update |
| Section order | Pass | Header; main: home, about, featured, projects, skills, education, contact; footer |
| Navigation/accessibility targets | Pass | Unique IDs; every hash anchor, aria-labelledby and aria-controls target resolves |
| CSS | Pass | Source stylesheet exactly matches original; no geometry or breakpoint changes |
| Images | Pass | Three source screenshots match original bytes; built PNGs return HTTP 200 with image/png |
| Fonts | Source verified | Original Google Fonts preconnects and Barlow Condensed weight 300 URL preserved; browser font download/rendering unverified |
| External links | Source verified | GitHub/LinkedIn URLs and link attributes match original; remote destinations were not click-tested |
| Licenses | Pass | Original notice copies present under src/vendor and public/licenses; dist copies match source bytes and return HTTP 200 |
| Base URL | Pass | /portfolio/; built JS/CSS/PNG paths work under /portfolio/assets/ |
| Legacy scripts | Pass | No runtime imports/script tags for original global initialization scripts |
| Lifecycle replay | Controller tests pass | Setup-cleanup-setup tests; actual React DOM StrictMode integration remains unverified |
| Reduced-motion / touch | Controller tests pass | Typewriter/cursor/Orb/reveal fallbacks, fine-pointer gating and native scroll paths; physical-device behavior unverified |
| Production HTML delivery | Pass | Preview HTTP 200 for /portfolio/, /portfolio/#about, /portfolio/#project-details and every generated resource |

The built artifact contains only index.html, hashed JS/CSS/PNG assets, and the two
license notices. Dependencies, tests, credentials, and original root scripts are
not part of dist. There are no new dependencies.

## Defects fixed

1. **WebGL context lifetime:** cleanup already deleted programs, buffers, VAOs,
   listeners, observers and frames, but retained the canvas context. Final cleanup
   now requests context loss through WEBGL_lose_context when available. A microtask
   checks canvas ownership so synchronous StrictMode replay can safely reuse the
   canvas. No shader, palette, movement, or sizing equations changed.
2. **Missing ResizeObserver:** Lenis could start its constructor and register a
   resize listener before throwing on the missing API, leaving an inaccessible
   partial instance. The controller now chooses native scrolling before construction
   when ResizeObserver is unavailable. A regression test checks listener cleanup.
3. **Mobile Escape behavior:** Phase 2 scoped Escape to the header, while the
   original listens on document. The React listener now closes the mobile menu and
   restores toggle focus even when focus has moved outside the header. Both its
   document and media-query listeners clean up on effect rerun/unmount.
4. **Footer year:** restored the original once-per-page current-year calculation
   instead of hard-coding 2026. Current approved rendered copy is unchanged.

Regression coverage was expanded with final-context disposal/StrictMode replay,
native scrolling without ResizeObserver or fine pointer, and an SSR source-parity
suite covering structure, copy, sections, IDs, links, images, fonts, licenses,
StrictMode presence, and legacy-script references.

## Lifecycle findings

- The Orb's container and canvas remain React-owned. A per-container registry
  prevents duplicate renderers; a per-canvas owner registry protects context reuse.
- Rendering pauses offscreen, while hidden, on reduced motion, on narrow screens,
  or during context loss. Failed WebGL keeps the original CSS static ring visible.
- Cursor animation and Lenis are event-driven, with at most one owned loop each;
  pending Lenis resize/completion work is cancelled during teardown.
- Typewriter timers and observers stop on hidden/offscreen/page lifecycle changes
  and clean up on unmount. Accessible screen-reader copy remains static.
- Hero fade measurements include header/overlap layout, viewport resize,
  ResizeObserver, font readiness and font loading completion. Late font callbacks
  cannot schedule work after cleanup.
- About reveal observers disconnect after one-time reveals and on cleanup; content
  stays visible without observation or with reduced motion.
- High-frequency canvas, cursor and scroll values remain local mutable controller
  state. React state changes only for greeting text/phases and menu interaction;
  no React state update occurs on every animation frame.

Tests model event/timer/observer/WebGL APIs and exercise the actual local Lenis
constructor. They do not prove real GPU driver behavior or real React DOM effect
replay. Explicit context release depends on WEBGL_lose_context availability; object
cleanup is unconditional, and browsers own final context reclamation.

## Browser coverage and review gate

No browser is connected to this session; **no desktop or mobile viewport was
tested**. Visual fidelity is not confirmed. Still unverified:

- Hero headline wrapping, Barlow Condensed download/typography, exact scale,
  alignment, Orb placement, Scroll to Explore position and horizontal overflow.
- Real shader compilation, palette/glow/animation, pointer response, context
  recovery and final GPU resource reclamation.
- Visible typewriter timing/caret/transitions, cursor dot/outline/trailing,
  Lenis wheel scrolling, native touch, anchors, Hero fade/reverse fade and About
  reveals in a real browser.
- Academic panel, What I Bring, screenshot presentation and responsive spacing.
- Mobile menu clicks, Escape outside the header, keyboard focus/skip link,
  browser console errors, actual StrictMode/HMR behavior, and refresh/deep links.

Suggested manual comparison sizes, **not tested**: 1440x900, 1024x768, 800x900,
390x844, and 360x800. Include browser zoom and reduced motion toggled live.
Compare the original website and React preview at identical sizes and scroll
positions. Finish this review before enabling production deployment.

## GitHub Pages compatibility

Vite base is /portfolio/, matching project hosting at
https://udeenc.github.io/portfolio/. The only navigation routes are hash fragments;
requests for /portfolio/#about still load /portfolio/index.html. No react-router,
history-path routes, server rewrites, or SPA 404 workaround are required for the
current URL design. HTTP delivery was tested; actual browser restoration of
fragment scroll position remains part of manual review.

No .github/workflows file is tracked in this checkout. Read-only GitHub inspection
shows the latest successful deployment is the generated `pages build and deployment`
workflow on main, path `dynamic/pages/pages-build-deployment`:
https://github.com/udeenc/portfolio/actions/runs/39671398843

That is evidence of the current generated Pages build, not direct confirmation of
the Pages settings' source-folder selection. No setting was read through an admin
API or changed. The current root-source build does not build react-app for Pages;
a future change must publish only react-app/dist as the site's artifact root.

Vite guidance requires the repository base and a build/deployment workflow:
https://vite.dev/guide/static-deploy.html#github-pages
GitHub documents artifact upload, deploy-job permissions and environment setup:
https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Proposed Phase 5 plan — not configured or activated

1. **Complete review first.** Finish the browser matrix, actual development
   StrictMode mounting/unmounting, and original-versus-React visual comparison.
   Resolve findings. Confirm this Phase 4 result with the owner before Phase 5.
2. **Prepare a reviewable deployment change on the feature branch.** Keep the
   original root site intact. Propose a workflow under .github/workflows using
   checkout and setup-node with Node 24.22.1 (or an explicitly validated version).
   Set npm cache-dependency-path to react-app/package-lock.json. Run npm ci,
   npm run lint, npm test, npm run build with working-directory react-app.
   Use supported official action versions pinned to reviewed commit SHAs.
3. **Separate validation from publishing.** PR validation should build/test only,
   with contents: read and no deployment. The deploy job should consume a successful
   build, upload only react-app/dist with upload-pages-artifact, and use deploy-pages
   in the github-pages environment with pages: write and id-token: write. Include
   configure-pages and a Pages concurrency group. Initial publishing should be a
   deliberate workflow_dispatch restricted to the reviewed main revision and,
   where supported, an environment approval gate. Do not publish PRs/feature branches.
4. **Review Pages switch and rollback together.** Record existing Pages source
   settings and the currently deployed static commit/artifact. Propose the source
   switch to GitHub Actions only when the owner authorizes deployment. Preserve
   a rollback path: restore the original publishing configuration and redeploy the
   last approved static revision, or re-run a retained known-good Pages artifact.
   Do not delete the original files or automate rollback with destructive Git commands.
5. **Authorize production separately.** Present the exact workflow/changes,
   artifact and rollback procedure for review. Merge, settings changes and first
   deployment each require explicit authorization; none are implied by this audit.
6. **Post-deployment checks, only after authorization.** Check the public base URL,
   refresh at hash URLs, all assets/licenses, font loading, desktop/mobile layout,
   interactions and console. Roll back using the reviewed procedure if necessary.

## Remaining blockers

- Browser/visual/GPU signoff has not occurred.
- A clean Linux GitHub Actions install/build and the Pages artifact workflow have
  not been exercised; these belong to the reviewed Phase 5 preparation.
- Production workflow/source switch and publication remain intentionally absent
  and require future authorization. No code/build/test blocker remains in this audit.

Phase 4 stops here for review.
