import { useEffect, useId, useReducer, useRef } from 'react'
import { createGalleryState, galleryReducer, watchGalleryMotion } from '../effects/galleryState.js'

// Shared W1 button gallery, enhanced with a load-safe two-layer image fade.
export default function ProjectMedia({ images, label = 'Olist dashboard screenshots', className = '' }) {
  const [state, dispatch] = useReducer(galleryReducer, images.length, createGalleryState)
  const panelId = useId()
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    const stop = watchGalleryMotion(reduced => dispatch({ type: 'motion', reduced }))
    return () => { mounted.current = false; stop() }
  }, [])
  const image = images[state.current]
  const layers = [state.previous, state.current, state.pending].filter(index => index !== null)
  return (
    <div className={`project-media ${className}`.trim()}>
      <div className="project-media__controls" role="group" aria-label={label}>
        {images.map((item, index) => (
          <button type="button" key={item.label} aria-pressed={index === state.requested}
            aria-controls={panelId} onClick={() => dispatch({ type: 'select', index })}>
            {item.label}
          </button>
        ))}
      </div>
      <figure id={panelId} aria-busy={state.pending !== null}>
        <div className="project-media__viewport">
          <a href={image.src} target="_blank" rel="noopener noreferrer"
            aria-label={`View full ${image.name ? `${image.name} dashboard` : image.label} (opens in a new tab)`}>
            {layers.map(index => {
              const item = images[index]
              const current = index === state.current
              const pending = index === state.pending
              return <img key={index} src={item.src} alt={current ? item.alt : ''}
                aria-hidden={current ? undefined : true} width={item.width} height={item.height}
                className={`project-media__image${pending ? ' is-pending' : ''}${current ? ' is-current' : ''}${current && state.previous !== null ? ' is-entering' : ''}`}
                loading={pending ? 'eager' : 'lazy'} decoding="async"
                onLoad={async event => {
                  if (!pending) return
                  const element = event.currentTarget
                  try {
                    await element.decode?.()
                    if (mounted.current) dispatch({ type: 'ready', index, version: state.version })
                  } catch { if (mounted.current) dispatch({ type: 'failed', index, version: state.version }) }
                }}
                onError={() => { if (pending) dispatch({ type: 'failed', index, version: state.version }) }}
                onAnimationEnd={() => dispatch({ type: 'finish', index, version: state.version })} />
            })}
          </a>
        </div>
        <figcaption>{image.label}{state.pending !== null && <span className="project-media__loading"> · Loading…</span>}</figcaption>
      </figure>
      {state.error !== null && <p className="project-media__error" role="status">Could not load {images[state.error].label}. Select it again to retry; the previous image remains available.</p>}
    </div>
  )
}
