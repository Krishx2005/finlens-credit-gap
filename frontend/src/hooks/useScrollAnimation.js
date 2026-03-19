import { useEffect, useRef } from 'react'

/**
 * Attach to a container ref — all .animate-on-scroll children inside
 * will get the "in-view" class when they enter the viewport.
 */
export function useScrollAnimation(options = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const { threshold = 0.12, rootMargin = '0px 0px -48px 0px' } = options
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
    targets.forEach((el) => observer.observe(el))

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
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}
