import { useState } from 'react'
import {
  BookOpen,
  Boxes,
  ChevronDown,
  ExternalLink,
  FlaskConical,
  Gem,
  Menu,
  PackageSearch,
  Search,
  TrendingUp,
  X,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Route, Routes } from 'react-router-dom'
import './App.css'

type Page = {
  path: string
  title: string
  description: string
  icon: LucideIcon
}

type NavigationItem = {
  title: string
  path?: string
  href?: string
  icon?: LucideIcon
  children?: NavigationItem[]
}

const pages: Page[] = [
  {
    path: '/items',
    title: '아이템 정보',
    description: '유니크, 세트, 베이스, 접두사와 접미사 정보를 정리합니다.',
    icon: PackageSearch,
  },
  {
    path: '/cube/runewords',
    title: '룬워드 조합',
    description: '룬 조합, 요구 레벨, 재료 타입, 주요 옵션을 비교합니다.',
    icon: Gem,
  },
  {
    path: '/cube/equipment-upgrades',
    title: '장비 업글',
    description: '노멀, 익셉셔널, 엘리트 장비 업그레이드 조합을 정리합니다.',
    icon: FlaskConical,
  },
  {
    path: '/cube/gem-upgrades',
    title: '보석 업글',
    description: '보석 등급별 업그레이드 재료와 활용처를 제공합니다.',
    icon: Gem,
  },
  {
    path: '/cube/recipes',
    title: '기타 조합',
    description: '소켓, 수리, 크래프트 등 호라드릭 함 조합식을 모읍니다.',
    icon: FlaskConical,
  },
  {
    path: '/leveling',
    title: '레벨업 효율표',
    description: '레벨 구간별 추천 지역과 경험치 효율 정보를 정리합니다.',
    icon: TrendingUp,
  },
]

const navigationItems: NavigationItem[] = [
  {
    title: '아이템 정보',
    path: '/items',
    icon: PackageSearch,
  },
  {
    title: '호라드릭 함',
    icon: FlaskConical,
    children: [
      { title: '룬워드 조합', path: '/cube/runewords', icon: Gem },
      { title: '장비 업글', path: '/cube/equipment-upgrades', icon: PackageSearch },
      { title: '보석 업글', path: '/cube/gem-upgrades', icon: Gem },
      { title: '기타 조합', path: '/cube/recipes', icon: FlaskConical },
    ],
  },
  {
    title: '레벨업 효율표',
    path: '/leveling',
    icon: TrendingUp,
  },
  {
    title: '외부 페이지',
    icon: ExternalLink,
    children: [
      {
        title: '트레더리',
        href: 'http://traderie.com/diablo2resurrected',
        icon: ExternalLink,
      },
      {
        title: '디아인벤',
        href: 'https://diablo4.inven.co.kr',
        icon: ExternalLink,
      },
      {
        title: '카오스큐브',
        href: 'https://www.chaoscube.co.kr',
        icon: ExternalLink,
      },
      {
        title: '트레디아',
        href: 'https://tradia.me/diablo2',
        icon: ExternalLink,
      },
    ],
  },
]

function Header() {
  const [isNavOpen, setIsNavOpen] = useState(false)

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
          </span>
        </NavLink>
      </header>

      <SideNavigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
    </>
  )
}

function SideNavigation({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
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
          </div>
          <button className="icon-button" type="button" aria-label="메뉴 닫기" onClick={onClose}>
            <X aria-hidden="true" size={22} />
          </button>
        </div>

        <nav className="side-nav-list" aria-label="디아블로2 자료 메뉴">
          <NavLink to="/" end className="side-nav-link" onClick={onClose}>
            <BookOpen aria-hidden="true" size={19} />
            홈
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

function HomePage() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Diablo II knowledge base</span>
          <h1>디아블로2 자료를 빠르게 찾는 사전형 웹페이지</h1>
          <p>
            아이템, 룬워드, 호라드릭 함 조합식, 레벨업 효율 정보를 한 곳에서 검색하고
            비교할 수 있는 아카이브로 확장해 나갈 기본 골격입니다.
          </p>

          <form className="search-panel" role="search">
            <Search aria-hidden="true" size={20} />
            <input
              type="search"
              placeholder="예: 수수께끼, 샤코, 장비 업글"
              aria-label="자료 검색"
            />
            <button type="submit">검색</button>
          </form>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="stone-arch">
            <span />
          </div>
          <div className="rune-grid">
            {['El', 'Tir', 'Tal', 'Sol', 'Ber', 'Jah'].map((rune) => (
              <b key={rune}>{rune}</b>
            ))}
          </div>
        </div>
      </section>

      <section className="section-grid" aria-label="자료 분류">
        {pages.map((page) => {
          const Icon = page.icon

          return (
            <NavLink className="section-card" key={page.path} to={page.path}>
              <Icon aria-hidden="true" size={24} />
              <h2>{page.title}</h2>
              <p>{page.description}</p>
            </NavLink>
          )
        })}
      </section>
    </>
  )
}

function CategoryPage({ title, description, icon: Icon }: Page) {
  return (
    <section className="category-page">
      <div className="category-heading">
        <Icon aria-hidden="true" />
        <span>준비 중</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="empty-state">
        <Boxes aria-hidden="true" />
        <h2>이 페이지에 실제 자료 목록과 상세 정보가 들어갑니다.</h2>
        <p>
          메뉴 선택과 라우팅은 준비되어 있으니, 다음 단계에서 데이터 모델과 목록 UI를
          연결하면 됩니다.
        </p>
      </div>
    </section>
  )
}

function App() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {pages.map((page) => (
            <Route
              key={page.path}
              path={page.path}
              element={<CategoryPage {...page} />}
            />
          ))}
        </Routes>
      </main>
    </div>
  )
}

export default App
