import { useEffect, useState } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

export function ImageViewer({
  alt,
  isOpen,
  onClose,
  src,
  title,
}: {
  alt: string
  isOpen: boolean
  onClose: () => void
  src: string
  title: string
}) {
  const [scale, setScale] = useState(1)
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setScale(1)
    setNaturalSize(null)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, src])

  if (!isOpen) {
    return null
  }

  const updateScale = (nextScale: number) => {
    setScale(Math.min(4, Math.max(0.4, nextScale)))
  }

  return (
    <div className="image-viewer-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="image-viewer-panel">
        <div className="image-viewer-toolbar">
          <strong>{title}</strong>
          <div className="image-viewer-actions">
            <button
              aria-label="이미지 축소"
              onClick={() => updateScale(scale - 0.2)}
              type="button"
            >
              <ZoomOut aria-hidden="true" />
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button
              aria-label="이미지 확대"
              onClick={() => updateScale(scale + 0.2)}
              type="button"
            >
              <ZoomIn aria-hidden="true" />
            </button>
            <button aria-label="이미지 뷰어 닫기" onClick={onClose} type="button">
              <X aria-hidden="true" />
            </button>
          </div>
        </div>
        <div
          className="image-viewer-stage"
          onWheel={(event) => {
            if (!event.ctrlKey) {
              return
            }

            event.preventDefault()
            updateScale(scale + (event.deltaY > 0 ? -0.12 : 0.12))
          }}
        >
          <img
            alt={alt}
            draggable={false}
            onLoad={(event) =>
              setNaturalSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
            src={src}
            style={
              naturalSize
                ? {
                    height: naturalSize.height * scale,
                    width: naturalSize.width * scale,
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  )
}
