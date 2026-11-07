import { useEffect, useRef } from 'react'

// Stack of open modals so only the top one reacts to Escape/Tab.
const stack = []
const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Focus handling, Escape to close, Tab trap, scroll lock and focus restore for a dialog. */
export function useModal(ref, onClose) {
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const previous = document.activeElement
    const token = {}
    stack.push(token)
    document.body.style.overflow = 'hidden'
    ;(el.querySelector('[data-autofocus]') ?? el).focus()

    const onKey = (e) => {
      if (stack[stack.length - 1] !== token) return
      if (e.key === 'Escape') {
        e.preventDefault()
        closeRef.current?.()
      } else if (e.key === 'Tab') {
        const items = [...el.querySelectorAll(FOCUSABLE)]
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      stack.splice(stack.indexOf(token), 1)
      if (!stack.length) document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [ref])
}
