// Pure transitions make late image events harmless under rapid selection changes.
export function createGalleryState(count) {
  return { count, current: 0, requested: 0, pending: null, previous: null, version: 0, reduced: false, error: null }
}
export function galleryReducer(state, action) {
  switch (action.type) {
    case 'select': {
      const index = action.index
      if (!Number.isInteger(index) || index < 0 || index >= state.count ||
        (index === state.requested && state.error === null)) return state
      return { ...state, requested: index, pending: index === state.current ? null : index,
        previous: null, version: state.version + 1, error: null }
    }
    case 'ready':
      if (action.version !== state.version || action.index !== state.pending) return state
      return { ...state, current: action.index, pending: null, previous: state.reduced ? null : state.current }
    case 'failed':
      if (action.version !== state.version || action.index !== state.pending) return state
      return { ...state, requested: state.current, pending: null, previous: null, error: action.index }
    case 'finish':
      if (action.version !== state.version || action.index !== state.current || state.previous === null) return state
      return { ...state, previous: null }
    case 'motion':
      if (action.reduced === state.reduced) return state
      return { ...state, reduced: action.reduced, previous: action.reduced ? null : state.previous }
    default: return state
  }
}
export function watchGalleryMotion(callback, win = window) {
  const media = win.matchMedia('(prefers-reduced-motion: reduce)')
  const update = () => callback(media.matches)
  media.addEventListener('change', update)
  update()
  return () => media.removeEventListener('change', update)
}
