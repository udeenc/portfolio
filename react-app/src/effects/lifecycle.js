// Track listeners with an optional shorter-lived input-session signal.
export function createLifecycle() {
  const controller = new AbortController()
  const sessions = new Set()

  function on(target, type, callback, options = {}) {
    if (!target || controller.signal.aborted) return
    const settings = typeof options === 'boolean' ? { capture: options } : options
    if (!settings.signal) {
      target.addEventListener(type, callback, { ...settings, signal: controller.signal })
      return
    }
    if (settings.signal.aborted) return
    const remove = () => {
      target.removeEventListener(type, callback, settings)
      settings.signal.removeEventListener('abort', remove)
      sessions.delete(remove)
    }
    sessions.add(remove)
    settings.signal.addEventListener('abort', remove, { once: true })
    target.addEventListener(type, callback, settings)
  }

  function dispose() {
    controller.abort()
    for (const remove of sessions) remove()
    sessions.clear()
  }

  return { on, dispose }
}
