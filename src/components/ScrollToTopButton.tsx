import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import './ScrollToTopButton.css'

const SHOW_OFFSET = 240

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateVisibility = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      const canScrollVertically = scrollableHeight > 24

      setIsVisible(canScrollVertically && window.scrollY > SHOW_OFFSET)
    }

    updateVisibility()

    window.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('resize', updateVisibility)

    return () => {
      window.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', updateVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      behavior: 'smooth',
      top: 0,
    })
  }

  return (
    <button
      className={`scroll-to-top-button ${isVisible ? 'is-visible' : ''}`}
      type="button"
      aria-label="페이지 최상단으로 이동"
      onClick={scrollToTop}
    >
      <ArrowUp aria-hidden="true" size={22} />
    </button>
  )
}
