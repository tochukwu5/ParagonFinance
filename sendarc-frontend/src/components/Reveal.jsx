import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Smooth-scrolls to the top on every route change.
 *
 * React Router deliberately preserves scroll between routes — it can't know
 * whether you're opening something new or returning to something you'd
 * already read. For a normal site the former is nearly always true, so
 * landing halfway down a page you've never seen reads as a bug.
 *
 * Two details that matter:
 *
 * The scroll is deferred by one frame. A route change unmounts the old page
 * and mounts the new one; scrolling before that settles means animating
 * against a document whose height is still changing, which stutters.
 *
 * Already-at-top is skipped entirely. Calling smooth scroll when there's
 * nothing to scroll still costs a frame and can swallow a genuine scroll
 * the user starts immediately afterwards.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (window.scrollY < 4) return

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const id = requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: reduced ? 'instant' : 'smooth',
      })
    })

    return () => cancelAnimationFrame(id)
  }, [pathname])

  return null
}

/**
 * Reveals children once they scroll into view.
 *
 * Uses IntersectionObserver rather than a scroll listener — the browser
 * batches these off the main thread, so it stays smooth with many elements
 * on the page where a handler firing every frame would not.
 *
 *   <Reveal>              fades up from below
 *   <Reveal from="left">  slides in from the left
 *   <Reveal delay={150}>  staggers behind its neighbours
 *
 * Fires once and disconnects. Re-animating on every pass gets tiresome and
 * makes scrolling back up feel unstable.
 */
export function Reveal({
  children,
  from = 'up',
  delay = 0,
  className = '',
  threshold = 0.12,
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Respect the OS-level reduced-motion setting. Someone who has asked for
    // less movement should get the content, not the choreography.
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold,
        // Start slightly before the element reaches the viewport edge, so the
        // animation is underway by the time it's properly visible.
        rootMargin: '0px 0px -60px 0px',
      }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  const hidden = {
    up: 'translate-y-8',
    down: '-translate-y-8',
    left: '-translate-x-10',
    right: 'translate-x-10',
    none: '',
  }[from] ?? 'translate-y-8'

  return (
    <div
      ref={ref}
      style={{ transitionDelay: delay + 'ms' }}
      className={
        'transition-all duration-700 ease-out will-change-transform ' +
        (visible ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 ' + hidden) +
        (className ? ' ' + className : '')
      }
    >
      {children}
    </div>
  )
}

/**
 * Types through a list of phrases, deleting each before the next.
 *
 *   <Typewriter phrases={['Move Money', 'Bridge Tokens', 'Swap Tokens']} />
 *
 * Timing is asymmetric on purpose: deleting reads as a correction rather
 * than a statement, so it runs roughly twice as fast as typing. The pause
 * at full length is what gives each phrase time to actually be read — too
 * short and the effect is just motion.
 *
 * The rendered line reserves its own height with a zero-width space, so the
 * layout below doesn't jump each time a phrase empties out.
 */
export function Typewriter({
  phrases = [],
  typeSpeed = 75,
  deleteSpeed = 38,
  holdFull = 1900,
  holdEmpty = 350,
  className = '',
  caretClassName = '',
}) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setReduced(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (reduced || phrases.length === 0) return

    const current = phrases[index % phrases.length]

    // Finished typing — hold, then start deleting.
    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), holdFull)
      return () => clearTimeout(t)
    }

    // Finished deleting — brief beat, then move to the next phrase.
    if (deleting && text === '') {
      const t = setTimeout(() => {
        setDeleting(false)
        setIndex(i => (i + 1) % phrases.length)
      }, holdEmpty)
      return () => clearTimeout(t)
    }

    const t = setTimeout(
      () => {
        setText(prev =>
          deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1)
        )
      },
      deleting ? deleteSpeed : typeSpeed
    )
    return () => clearTimeout(t)
  }, [text, deleting, index, phrases, typeSpeed, deleteSpeed, holdFull, holdEmpty, reduced])

  // Reduced motion gets the first phrase, static. The point of the effect is
  // decorative; the content is the phrase itself.
  if (reduced) {
    return <span className={className}>{phrases[0] ?? ''}</span>
  }

  return (
    <span className={className}>
      {/* Zero-width space keeps the line's height while the phrase is empty,
          so nothing below it shifts up and back. */}
      {text || '\u200B'}
      <span className={'tw-caret ' + caretClassName} aria-hidden="true" />
    </span>
  )
}

/**
 * Staggers a list of children so they arrive in sequence rather than all at
 * once — the difference between a section appearing and a section landing.
 */
export function RevealGroup({ children, from = 'up', step = 90, max = 500, className = '' }) {
  const items = Array.isArray(children) ? children : [children]
  return (
    <>
      {items.map((child, i) => (
        <Reveal key={i} from={from} delay={Math.min(i * step, max)} className={className}>
          {child}
        </Reveal>
      ))}
    </>
  )
}