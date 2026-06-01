import { Search } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { pages } from '../navigation/navigation'

export function HomePage() {
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
