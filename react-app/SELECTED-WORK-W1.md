# W1 — Selected Work static layout

Branch: `feature/portfolio-v2`. Starting checkpoint: `12bc123ed915ee24c54c47d9f2d9302abcaa6e0b`
(`feat: build immersive data lab hero with 3D constellation`). Working tree was
clean before W1. The committed H5 signoff was verified before implementation.

## Pipeline media update

The owner subsequently supplied `architecture.png`, `airflow-workflow.png` and
`star-schema.png` in the root assets folder. Byte-identical copies now live in
`src/assets/images/`, imported by the project data module for Vite base-path safety.
PipelineGallery replaces the conceptual PipelineVisual in the active showcase;
the original component and high-level source notes below remain as W1 history.

The default media is Architecture Diagram, followed by Airflow DAG and Star Schema.
Native buttons use Tab/Shift+Tab and Enter/Space, expose `aria-pressed`, retain
focus when switching and reference the media figure via `aria-controls`. A polite
caption announces the selected media; alt text describes each supplied screenshot.
Each selected image has a full-size new-tab link. No timers, autoplay, animation,
global listeners or dependencies are added. Mobile controls stack, images use a
contained stable viewport and are never cropped or enlarged beyond native size.

Pipeline-specific CSS, project metadata, the showcase visual selection and SSR
assertions were updated. Olist's component, styles and rendered showcase markup
are unchanged (before/after SSR SHA-256 matched). Hero and other section source
remain unchanged. All 28 tests, build and lint pass; production preview verifies
all 13 resources under `/portfolio/`, including the three pipeline images. The
known lazy Three.js chunk warning remains. Browser interaction/visual overflow
checks are still pending because no browser is connected. Review all three
buttons with mouse, keyboard and touch, captions/full-size links and layout at
320/390/768/1440px widths. No commit, push, merge or deployment is included.

## Composition and files

Selected Work retains `#featured` and `#featured-title`, with the requested heading
and exactly two featured articles: 01 Automated Data Pipeline / Data Engineering,
then 02 Olist E-Commerce Analytics / Data Analytics. Large visual stages, numbered
editorial headings, restrained borders and spacious summaries replace the original
single-project card. Navy surfaces and the existing V2 fonts/tokens continue the
Hero direction, with cyan for engineering and violet for analytics.

Created:
- `src/components/SelectedWork.jsx`: section introduction and ordered project list.
- `src/components/ProjectShowcase.jsx`: shared heading, visual, summary, tags/actions,
  and optional existing Olist metrics/process notes. ProjectTags is a small local
  helper, rather than a separate abstraction/file.
- `src/components/PipelineVisual.jsx`: static semantic architecture illustration.
- `src/components/ProjectMedia.jsx`: all three real Olist screenshot figures.
- `src/styles/selected-work.css`: styles confined to the new section/components.
- This report.

Modified:
- `src/App.jsx`: render SelectedWork in the same position as FeaturedProjects.
- `src/main.jsx`: import the scoped stylesheet after the existing styles.
- `src/data/projects.js`: centralize both projects' copy, technologies, diagram
  labels, screenshot metadata and verified Olist facts/repository link.
- `tests/portfolio-validation.test.js`: preserve parity outside the intentional
  section redesign and assert the new project/content/media/navigation contracts.
- `README.md`: link this W1 status and review record.

The old `FeaturedProjects.jsx` remains intact as rollback source. `Projects.jsx`
and its existing additional-projects section are unchanged; no placeholder project
was added to Selected Work. Header, Hero components/styles/effects/data, About,
Skills, Education, Contact, original root files and production workflows are unchanged.

## Source verification and content boundaries

### Automated Data Pipeline

Found local source outside this repository in `DataEngineeringProject/Code/`:

- `retail_dag.py`: imports Apache Airflow, defines a DAG and uses BashOperator to
  call `transform_data_v2.py` under the Airflow DAG directory.
- `transform_data_v2.py`: reads a CSV, performs pandas cleaning/normalization,
  constructs dimension/fact data frames and writes prepared data to MySQL.

Only these high-level stages are presented. Source was inspected, not executed;
no claim is made about a successful current deployment, throughput, data volumes,
production reliability or performance. Schedule/retry details were not promoted
into portfolio claims. No source code, data, connection strings or credentials
were copied into the portfolio.

Docker is part of the owner's explicitly supplied project context. No local Docker
configuration/README was found in that project, so the illustration uses only the
high-level Docker environment boundary, without asserting container topology.
No Git remote/public repository URL was established for the pipeline. Its GitHub
and future case-study actions are therefore omitted, rather than fabricated.

The illustration uses an ordered HTML list for CSV → Python → MySQL, connected by
CSS arrows, with a separate Airflow orchestration label and Docker boundary. Cyan
lighting is a static CSS gradient/shadow. Its caption explicitly identifies a
conceptual architecture, not live system activity. It has no timers, canvas, node
interactions, status indicators or animation libraries.

### Olist E-Commerce Analytics

The original FeaturedProjects component supplied the verified portfolio copy and
all three screenshots. The local `ecommerce-powerbi-analysis/README.md` independently
corroborates Python profiling, Power Query, DAX, star-schema modeling, PBIP/TMDL,
Git, displayed dataset metrics and the association-versus-causation caveat.

All previous descriptive text, technology tags, rounded metric caveat, process
steps and analytical observation are retained. The section/project display titles
change only as explicitly requested. No additional metric or analytical outcome
is introduced. The repository URL is unchanged:
`https://github.com/udeenc/ecommerce-powerbi-analysis`.
`git ls-remote` confirms it resolves (observed HEAD `bd7920907291d55a7551a225c77f999b0d940416`).

The lead Executive Overview dashboard occupies the full media width, followed by
two supporting figures. Existing image bytes, alt text, captions and full-size
new-tab links are preserved. Explicit dimensions match the PNG headers:
1278×720, 1278×718, and 1277×718. Lazy loading, async decoding and natural aspect
ratios avoid cropping or false dashboards and reserve space during loading.
Vite imports keep both image and full-size link URLs compatible with `/portfolio/`.

View Project still points to the real inline `#project-details` notes. Existing
`#project-title`, `#project-details-title`, navigation anchors and other section IDs
remain valid. No routing, nonexistent case-study URL, `href="#"` or fake button.

## Responsive and accessibility decisions

- Near-full-width visuals inside the same maximum 1400px centered presentation;
  existing gutters and safe-area insets protect the edges.
- Fluid heading sizes/padding; no fixed foreground height. Grid columns use
  `minmax(0, 1fr)` and long text/technology tags can wrap.
- Summaries and analytical process notes become single-column at 800px.
- Below 600px, pipeline stages become a vertical ordered flow, screenshot figures
  stack, and dataset metrics use two columns. All screenshots remain accessible.
- Semantic section/article/heading hierarchy, accessible ordered processing stages,
  descriptive image links, new-tab notices, visible focus and minimum 44px action
  height. The static visual does not intercept navigation or require hover.
- No new animation or React effects; reduced-motion users get the same static W1
  content. Forced-colors rules preserve visual boundaries and focus outlines.

These are implemented responsive rules, not browser-verified layout claims.

## Verification

- Production build and lint pass; all 28 existing tests pass with expanded SSR
  validation for project order, exact introduction, retained Olist information,
  three original images, intrinsic PNG dimensions, anchors and heading hierarchy.
- Tests preserve exact markup/copy parity for all sections outside Hero/Selected
  Work; approved Hero copy/contracts and all lifecycle/dissolve tests still pass.
- Preview serves all 10 built resources byte-for-byte under `/portfolio/`.
  The built JS references all three dashboard assets with the correct base path.
- Git diff/whitespace checks pass; Hero implementation and production workflow
  paths are unchanged. No dependencies, package metadata or lockfile changes.
- Known Vite warning remains: the lazy Three renderer is 533.45 kB minified /
  133.14 kB gzip, unchanged in size from H5. W1 does not modify that renderer.

No browser is connected. No browser console audit, real image-loading/keyboard
session, screenshot comparison, responsive overflow/clipping or visual approval
is claimed. HTTP/SSR checks do not prove rendered appearance.

## Required visual review before W2

Run `npm.cmd run dev -- --host 127.0.0.1` in `react-app/` and open `/portfolio/`:

1. Review 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 430×932,
   390×844, 360×800 and 320×568, plus enlarged text/200% zoom. Check heading
   wrapping, visual scale, whitespace, vertical connectors and horizontal overflow.
2. Compare the unchanged Hero and other sections. Inspect transition into Selected
   Work, cyan/violet balance, diagram legibility, real screenshot clarity and
   whether the supporting screenshots make the static section too long.
3. Tab through the real project notes/GitHub/image links; verify focus, full-size
   images/new-tab names, anchor clearance, mobile navigation and screen-reader
   section/heading/processing-list order. Check console and network errors.
4. Test blocked/slow images and fonts, forced colors and reduced motion; content
   and links must remain available with no layout-breaking overflow.

For W2, keep this central media array and shared figure component. Introduce an
explicit previous/next carousel only after visual approval, with accessible control
names, keyboard support, stable image aspect ratios and all images reachable.
Avoid autoplay, hidden inaccessible slides and motion required to understand the
projects. Optional restrained reveals should honor reduced motion and keep content
visible if effects fail. No carousel or reveal interaction is implemented in W1.

Stop after W1. No commit, push, merge, deployment, production-setting change,
detail page, router, hover-preview animation or W2 work is included.
