import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
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
const VIEWPORT_MARGIN = 8

export function FloatingTooltip({ cardClassName, children, content, triggerClassName }: FloatingTooltipProps) {
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const [position, setPosition] = useState<TooltipPosition | null>(null)

  const showTooltip = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()

    setPosition({
      left: Math.max(VIEWPORT_MARGIN, rect.left),
      top: rect.bottom + TOOLTIP_GAP,
      triggerRect: rect,
    })
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

  return (
    <span className={triggerClassName} onMouseEnter={showTooltip} onMouseLeave={() => setPosition(null)}>
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
