import { useEffect, useRef, useState, type FormEvent } from 'react'
import { BookOpen, ChevronDown, ExternalLink, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { navigationItems } from '../navigation/navigation'
import type { NavigationItem, Theme } from '../shared/appTypes'
import { readPageSearchQuery, searchDestinationPath } from '../shared/searchNavigation'
import './AppHeader.css'

const TERROR_ZONE_IMAGE_URL = 'https://www.d2emu.com/tz/tz_KR.png'
const TERROR_ZONE_REFRESH_MS = 5 * 60 * 1000

export function AppHeader({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const pageSearchQuery = readPageSearchQuery(new URLSearchParams(location.search))

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextQuery = searchInputRef.current?.value.trim() ?? ''

    if (!nextQuery) {
      navigate('/')
      return
    }

    navigate(searchDestinationPath('/search', nextQuery))
  }

  return (
    <>
      <header className="site-header">
        <button
          className="menu-trigger"
          type="button"
          aria-label="메뉴 열기"
          aria-expanded={isNavOpen}
          aria-controls="side-navigation"
          onClick={() => setIsNavOpen(true)}
        >
          <Menu aria-hidden="true" size={24} />
        </button>

        <NavLink to="/" className="brand" aria-label="dia2dic 홈">
          <span className="brand-mark">D2</span>
          <span>
            <strong>dia2dic</strong>
            <small>Diablo II Archive</small>
            <small className="brand-version">악마술사의 군림</small>
          </span>
        </NavLink>

        <form className="header-search" key={pageSearchQuery} onSubmit={submitSearch} role="search">
          <Search aria-hidden="true" size={18} />
          <input
            ref={searchInputRef}
            type="search"
            placeholder="예: 수수께끼, 샤코, 크래프팅, 자룬, 소켓"
            aria-label="자료 검색"
            defaultValue={pageSearchQuery}
          />
          <button type="submit">검색</button>
        </form>

        <TerrorZoneBanner />
      </header>

      <SideNavigation
        isOpen={isNavOpen}
        theme={theme}
        onClose={() => setIsNavOpen(false)}
        onToggleTheme={onToggleTheme}
      />
    </>
  )
}

function TerrorZoneBanner() {
  const [cacheKey, setCacheKey] = useState(() => Date.now())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const feedbackTimerRef = useRef<number | null>(null)
  const sourceUrl = `${TERROR_ZONE_IMAGE_URL}?v=${cacheKey}`

  const refreshImage = () => {
    setCacheKey(Date.now())
    setIsRefreshing(true)

    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current)
    }

    feedbackTimerRef.current = window.setTimeout(() => {
      setIsRefreshing(false)
      feedbackTimerRef.current = null
    }, 700)
  }

  useEffect(() => {
    const intervalId = window.setInterval(refreshImage, TERROR_ZONE_REFRESH_MS)

    return () => {
      window.clearInterval(intervalId)

      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  return (
    <button
      className={`terror-zone-refresh ${isRefreshing ? 'is-refreshing' : ''}`}
      type="button"
      aria-label="테러존 이미지 새로고침"
      onClick={refreshImage}
    >
      <img
        className="terror-zone-banner"
        src={sourceUrl}
        alt="디아블로2 테러존 정보"
      />
    </button>
  )
}

function SideNavigation({
  isOpen,
  theme,
  onClose,
  onToggleTheme,
}: {
  isOpen: boolean
  theme: Theme
  onClose: () => void
  onToggleTheme: () => void
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    '호라드릭 함': true,
  })

  const toggleGroup = (title: string) => {
    setOpenGroups((current) => ({ ...current, [title]: !current[title] }))
  }

  return (
    <>
      <button
        className={`nav-backdrop ${isOpen ? 'is-open' : ''}`}
        type="button"
        aria-label="메뉴 닫기"
        onClick={onClose}
      />

      <aside
        id="side-navigation"
        className={`side-navigation ${isOpen ? 'is-open' : ''}`}
        aria-hidden={!isOpen}
      >
        <div className="side-nav-header">
          <div>
            <strong>자료 메뉴</strong>
            <small>Diablo II Archive</small>
            <small className="brand-version">악마술사의 군림</small>
          </div>
          <button className="icon-button" type="button" aria-label="메뉴 닫기" onClick={onClose}>
            <X aria-hidden="true" size={22} />
          </button>
        </div>

        <nav className="side-nav-list" aria-label="디아블로2 자료 메뉴">
          <NavLink to="/" end className="side-nav-link" onClick={onClose}>
            <BookOpen aria-hidden="true" size={19} />홈
          </NavLink>

          {navigationItems.map((item) => (
            <NavigationEntry
              key={item.title}
              item={item}
              isExpanded={Boolean(openGroups[item.title])}
              onToggle={() => toggleGroup(item.title)}
              onNavigate={onClose}
            />
          ))}
        </nav>

        <button
          className="theme-toggle"
          type="button"
          aria-label={theme === 'dark' ? '라이트 테마로 전환' : '다크 테마로 전환'}
          onClick={onToggleTheme}
        >
          <span className="theme-toggle-icon">
            {theme === 'dark' ? (
              <Sun aria-hidden="true" size={19} />
            ) : (
              <Moon aria-hidden="true" size={19} />
            )}
          </span>
          <span>
            <strong>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</strong>
            <small>{theme === 'dark' ? '밝은 테마로 전환' : '어두운 테마로 전환'}</small>
          </span>
        </button>
      </aside>
    </>
  )
}

function NavigationEntry({
  item,
  isExpanded,
  onToggle,
  onNavigate,
}: {
  item: NavigationItem
  isExpanded: boolean
  onToggle: () => void
  onNavigate: () => void
}) {
  const Icon = item.icon ?? BookOpen

  if (item.children?.length) {
    return (
      <div className="nav-group">
        <button
          className="side-nav-link nav-group-trigger"
          type="button"
          aria-expanded={isExpanded}
          onClick={onToggle}
        >
          <Icon aria-hidden="true" size={19} />
          <span>{item.title}</span>
          <ChevronDown aria-hidden="true" className="chevron" size={18} />
        </button>

        <div className={`nav-submenu ${isExpanded ? 'is-expanded' : ''}`}>
          {item.children.map((child) => (
            <NavigationEntry
              key={child.title}
              item={child}
              isExpanded={false}
              onToggle={() => undefined}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    )
  }

  if (item.href) {
    return (
      <a
        className="side-nav-link is-child"
        href={item.href}
        target="_blank"
        rel="noreferrer"
        onClick={onNavigate}
      >
        <Icon aria-hidden="true" size={18} />
        {item.title}
        <ExternalLink aria-hidden="true" className="external-icon" size={15} />
      </a>
    )
  }

  return (
    <NavLink className="side-nav-link" to={item.path ?? '/'} onClick={onNavigate}>
      <Icon aria-hidden="true" size={19} />
      {item.title}
    </NavLink>
  )
}
