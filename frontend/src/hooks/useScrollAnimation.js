import { useEffect, useRef } from 'react'

// Mark body so CSS can enable the opacity-gate only when JS is running.
// Elements already in viewport on mount get .in-view immediately.
function enableScrollAnimations() {
  if (!document.body.classList.contains('js-scroll-ready')) {
    document.body.classList.add('js-scroll-ready')
  }
}

/**
 * Attach to a container ref — all .animate-on-scroll children inside
 * will get the "in-view" class when they enter the viewport.
 * Content is always visible if JS fails or observer never fires.
 */
export function useScrollAnimation(options = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const { threshold = 0.08, rootMargin = '0px 0px -32px 0px' } = options

    enableScrollAnimations()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold, rootMargin }
    )

    const container = ref.current
    if (!container) return

    const targets = container.querySelectorAll('.animate-on-scroll')
    targets.forEach((el) => {
      // If already in viewport, mark visible immediately without waiting
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('in-view')
      } else {
        observer.observe(el)
      }
    })

    return () => observer.disconnect()
  }, [])

  return ref
}

/**
 * Returns a ref for a single element that gets "in-view" class when visible.
 */
export function useElementAnimation(options = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const { threshold = 0.1, rootMargin = '0px 0px -32px 0px' } = options

    enableScrollAnimations()

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          observer.unobserve(entry.target)
        }
      },
      { threshold, rootMargin }
    )

    const el = ref.current
    if (el) {
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('in-view')
      } else {
        observer.observe(el)
      }
    }
    return () => observer.disconnect()
  }, [])

  return ref
}
