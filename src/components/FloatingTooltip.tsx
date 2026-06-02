import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type FloatingTooltipProps = {
  cardClassName: string
  children: ReactNode
  content: ReactNode
  triggerClassName: string
}

type TooltipPosition = {
  left: number
  top: number
  triggerRect: DOMRect
}

const TOOLTIP_GAP = 8
const TOUCH_DRAG_DISMISS_THRESHOLD = 12
const VIEWPORT_MARGIN = 8

export function FloatingTooltip({ cardClassName, children, content, triggerClassName }: FloatingTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const lastTouchTimestampRef = useRef(0)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const [position, setPosition] = useState<TooltipPosition | null>(null)

  const hideTooltip = () => setPosition(null)

  const showTooltip = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()

    setPosition({
      left: Math.max(VIEWPORT_MARGIN, rect.left),
      top: rect.bottom + TOOLTIP_GAP,
      triggerRect: rect,
    })
  }

  const handleMouseEnter = (event: MouseEvent<HTMLElement>) => {
    if (Date.now() - lastTouchTimestampRef.current < 700) {
      return
    }

    showTooltip(event.currentTarget)
  }

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') {
      lastTouchTimestampRef.current = Date.now()
      touchStartRef.current = {
        x: event.clientX,
        y: event.clientY,
      }
      showTooltip(event.currentTarget)
    }
  }

  const handleFocus = (element: HTMLElement) => {
    if (Date.now() - lastTouchTimestampRef.current < 700) {
      return
    }

    showTooltip(element)
  }

  useLayoutEffect(() => {
    const tooltip = tooltipRef.current

    if (!position || !tooltip) {
      return
    }

    const rect = tooltip.getBoundingClientRect()
    const nextLeft = Math.min(
      Math.max(VIEWPORT_MARGIN, position.triggerRect.left),
      Math.max(VIEWPORT_MARGIN, window.innerWidth - rect.width - VIEWPORT_MARGIN),
    )
    const belowTop = position.triggerRect.bottom + TOOLTIP_GAP
    const aboveTop = position.triggerRect.top - rect.height - TOOLTIP_GAP
    const belowFits = belowTop + rect.height <= window.innerHeight - VIEWPORT_MARGIN
    const aboveFits = aboveTop >= VIEWPORT_MARGIN
    const nextTop = belowFits || !aboveFits ? Math.min(belowTop, window.innerHeight - rect.height - VIEWPORT_MARGIN) : aboveTop
    const safeTop = Math.max(VIEWPORT_MARGIN, nextTop)

    if (position.left !== nextLeft || position.top !== safeTop) {
      setPosition((currentPosition) =>
        currentPosition ? { ...currentPosition, left: nextLeft, top: safeTop } : currentPosition,
      )
    }
  }, [position])

  useEffect(() => {
    if (!position) {
      return undefined
    }

    const closeOnViewportChange = () => hideTooltip()
    const closeOnOutsidePointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target

      if (!(target instanceof Node)) {
        hideTooltip()
        return
      }

      if (triggerRef.current?.contains(target) || tooltipRef.current?.contains(target)) {
        return
      }

      hideTooltip()
    }
    const closeOnTouchDrag = (event: globalThis.PointerEvent) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
        return
      }

      const touchStart = touchStartRef.current

      if (!touchStart) {
        hideTooltip()
        return
      }

      const distanceX = Math.abs(event.clientX - touchStart.x)
      const distanceY = Math.abs(event.clientY - touchStart.y)

      if (distanceX > TOUCH_DRAG_DISMISS_THRESHOLD || distanceY > TOUCH_DRAG_DISMISS_THRESHOLD) {
        hideTooltip()
      }
    }

    window.addEventListener('scroll', closeOnViewportChange, true)
    window.addEventListener('resize', closeOnViewportChange)
    window.addEventListener('orientationchange', closeOnViewportChange)
    window.addEventListener('pointercancel', closeOnViewportChange)
    window.addEventListener('pointerdown', closeOnOutsidePointerDown, true)
    window.addEventListener('pointermove', closeOnTouchDrag)

    return () => {
      window.removeEventListener('scroll', closeOnViewportChange, true)
      window.removeEventListener('resize', closeOnViewportChange)
      window.removeEventListener('orientationchange', closeOnViewportChange)
      window.removeEventListener('pointercancel', closeOnViewportChange)
      window.removeEventListener('pointerdown', closeOnOutsidePointerDown, true)
      window.removeEventListener('pointermove', closeOnTouchDrag)
    }
  }, [position])

  return (
    <span
      className={triggerClassName}
      onBlur={hideTooltip}
      onFocus={(event) => handleFocus(event.currentTarget)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={hideTooltip}
      onPointerDown={handlePointerDown}
      ref={triggerRef}
    >
      {children}
      {position
        ? createPortal(
            <span
              className={`${cardClassName} floating-stat-card`}
              ref={tooltipRef}
              role="tooltip"
              style={{ left: position.left, top: position.top }}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </span>
  )
}
