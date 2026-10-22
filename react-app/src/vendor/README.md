# Local vendor adaptations

Original vendor files under the repository root are unchanged. Full upstream
notices are retained here and in `public/licenses/`, which Vite copies to dist.

## Lenis 1.3.27

`lenis-1.3.27.js` derives from `../../../js/vendor/lenis-1.3.27.min.js`.
Copyright (c) 2024 darkroom.engineering; MIT, see `lenis.LICENSE.txt`.

Adaptations:

- Return the constructor from its existing closure and export it as ESM,
  replacing the globalThis.Lenis constructor assignment.
- Remove the unavailable source-map reference.
- Give the existing resize debounce a cancel method, called by dimension disposal.
- Track the existing completion/prevent-next-scroll one-shot requestAnimationFrame
  calls and cancel pending handles in destroy(). Auto-RAF behavior is unchanged.

These disposal patches prevent pending vendor work from surviving React unmount
or Strict Mode replay. Scrolling math, options, and input handling are unchanged.
The vendor's informational window.lenis/version fields are retained.

The application controller in `../effects/smoothScroll.js` owns instance creation,
anchor integration, and the event-driven RAF. autoRaf remains false. The minified
vendor file is excluded from application lint; the controller is linted and the
actual local constructor is exercised by lifecycle tests.

## React Bits Orb

`../effects/orbRenderer.js` derives from `../../../js/hero-orb.js`.
Copyright (c) 2026 David Haz. MIT + Commons Clause; see
`react-bits-orb.LICENSE.md`. The original header attribution remains in the port.

The shader calculations, defaults, palette, animation equations, and pointer
behavior are retained. The IIFE/global auto-initializer becomes an exported
initializer accepting a React-owned container and canvas. React creates/removes
those nodes; the renderer owns only canvas drawing, visual state classes, and
WebGL resources. Cleanup releases programs/buffers/VAOs and listeners. A microtask
checks canvas ownership before requesting context loss on final unmount, preserving
the canvas context during synchronous Strict Mode replay.
