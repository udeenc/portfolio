import { useEffect, useRef } from 'react'
import { mountCursor } from '../effects/cursor.js'

export default function CustomCursor() {
  const cursorRef = useRef(null)
  useEffect(() => mountCursor(cursorRef.current), [])
  return <div ref={cursorRef} className="custom-cursor" aria-hidden="true" />
}
