import {
  BookOpen,
  Boxes,
  Gem,
  Map,
  Search,
  Shield,
  Sparkles,
  Sword,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Route, Routes } from 'react-router-dom'
import './App.css'

type Section = {
  path: string
  title: string
  description: string
  icon: LucideIcon
}

const sections: Section[] = [
  {
    path: '/items',
    title: '아이템',
    description: '유니크, 세트, 베이스, 접두사와 접미사 정보를 정리합니다.',
    icon: Sword,
  },
  {
    path: '/runewords',
    title: '룬워드',
    description: '룬 조합, 요구 레벨, 재료 타입, 주요 옵션을 비교합니다.',
    icon: Gem,
  },
  {
    path: '/skills',
    title: '스킬',
    description: '직업별 스킬 트리, 시너지, 빌드 핵심 정보를 모읍니다.',
    icon: Sparkles,
  },
  {
    path: '/areas',
    title: '지역',
    description: '액트별 지역, 몬스터 레벨, 파밍 포인트를 제공합니다.',
    icon: Map,
  },
  {
    path: '/systems',
    title: '시스템',
    description: '공속, 패캐, 저항, 매직 파인드 같은 계산 규칙을 다룹니다.',
    icon: Shield,
  },
  {
    path: '/guides',
    title: '가이드',
    description: '초반 진행, 래더 스타트, 파밍 루트와 빌드 노트를 정리합니다.',
    icon: BookOpen,
  },
]

function Header() {
  return (
    <header className="site-header">
      <NavLink to="/" className="brand" aria-label="dia2dic 홈">
        <span className="brand-mark">D2</span>
        <span>
          <strong>dia2dic</strong>
          <small>Diablo II Archive</small>
        </span>
      </NavLink>

      <nav className="main-nav" aria-label="주요 메뉴">
        <NavLink to="/">홈</NavLink>
        {sections.slice(0, 4).map((section) => (
          <NavLink key={section.path} to={section.path}>
            {section.title}
          </NavLink>
        ))}
      </nav>
    </header>
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
            아이템, 룬워드, 스킬, 지역, 시스템 정보를 한 곳에서 검색하고 비교할 수
            있는 아카이브로 확장해 나갈 기본 골격입니다.
          </p>

          <form className="search-panel" role="search">
            <Search aria-hidden="true" size={20} />
            <input
              type="search"
              placeholder="예: 수수께끼, 샤코, 팔라딘 해머딘"
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
        {sections.map((section) => {
          const Icon = section.icon

          return (
            <NavLink className="section-card" key={section.path} to={section.path}>
              <Icon aria-hidden="true" size={24} />
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </NavLink>
          )
        })}
      </section>
    </>
  )
}

function CategoryPage({ title, description, icon: Icon }: Section) {
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
        <h2>데이터 모델과 목록 UI를 붙일 자리입니다.</h2>
        <p>
          이후 JSON, API, 크롤링된 정적 데이터 중 원하는 방식으로 자료를 연결하면
          됩니다.
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
          {sections.map((section) => (
            <Route
              key={section.path}
              path={section.path}
              element={<CategoryPage {...section} />}
            />
          ))}
        </Routes>
      </main>
    </div>
  )
}

export default App
