import { useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type FloatingTooltipProps = {
  cardClassName: string
  children: ReactNode
  content: ReactNode
  triggerClassName: string
}

export function FloatingTooltip({ cardClassName, children, content, triggerClassName }: FloatingTooltipProps) {
  const [position, setPosition] = useState<{ left: number; placement: 'above' | 'below'; top: number } | null>(null)

  const showTooltip = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const shouldPlaceAbove = rect.bottom + 132 > window.innerHeight

    setPosition({
      left: Math.max(8, rect.left),
      placement: shouldPlaceAbove ? 'above' : 'below',
      top: shouldPlaceAbove ? rect.top - 8 : rect.bottom + 8,
    })
  }

  return (
    <span className={triggerClassName} onMouseEnter={showTooltip} onMouseLeave={() => setPosition(null)}>
      {children}
      {position
        ? createPortal(
            <span
              className={`${cardClassName} floating-stat-card ${position.placement === 'above' ? 'is-above' : ''}`}
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
