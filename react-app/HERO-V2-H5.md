# Hero V2 H5 checkpoint

Branch: `feature/portfolio-v2`.
Commit message: `feat: build immersive data lab hero with 3D constellation`.

This checkpoint preserves the completed H1–H4 Hero implementation before W1.
The project owner explicitly reports approval of all seven manual browser checks
in the H5 request. This is owner-provided signoff; the agent did not independently
repeat browser/GPU testing. Earlier reports retain their historical pending-review
notes, superseded by this approval for checkpoint purposes.

## Scope and audit

- H1: approved Hero content/composition, V2 tokens/fonts and SVG constellation.
- H2: lazy Three.js 0.186.1 constellation, deterministic nodes/connections,
  parallax/highlights, progressive fallback and scoped renderer lifecycle.
- H3: measured scroll progress, reversible particle dissolve, content fading and
  keyboard-focus visibility, using the existing Lenis integration.
- H4: responsive/safe-area/header measurements, static/contrast/reduced-motion
  fallback, pointer/buffer optimizations and keyboard cursor handling.
- Tests, implementation reports and full Three.js MIT notice are included.
- Existing original stylesheet/assets/vendor notices and root website remain.
  Production workflows, main and GitHub Pages settings are unchanged.
- No W1 project redesign or other section redesign is included.

## Final validation

- `npm.cmd run build`: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd test`: all 28 tests passed, with no new failures.
- Tests verify approved Hero copy, section order, anchor/ARIA targets, unchanged
  non-Hero content, image/license parity, and lifecycle/dissolve/fallback behavior.
- Production preview resources are verified under Vite's `/portfolio/` base.
- Diff whitespace checks pass; dependency/build directories are ignored and
  excluded from staging. Only reviewed Hero implementation, documentation,
  dependency metadata, license and test files belong in this checkpoint.
- Known warning: the lazy renderer chunk is 533.45 kB minified / 133.14 kB gzip,
  above Vite's default 500 kB warning threshold. The renderer stays dynamically
  imported, with no added dependency beyond pinned Three.js.

Find the checkpoint SHA with `git log -1 --format=%H` after this commit. Push only
the feature branch to origin, setting upstream if needed. No merge, deployment,
Pages activation, automatic PR creation or W1 work is part of H5.
