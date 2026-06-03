import { ArrowRight, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { NavLink } from 'react-router-dom'
import { pages } from '../navigation/navigation'
import { searchPageCandidates } from '../shared/searchIndex'
import { searchDestinationPath } from '../shared/searchNavigation'

export function HomePage() {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const candidates = searchPageCandidates(submittedQuery)

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextQuery = query.trim()

    if (!nextQuery) {
      return
    }

    setSubmittedQuery(nextQuery)
  }

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

          <form className="search-panel" onSubmit={submitSearch} role="search">
            <Search aria-hidden="true" size={20} />
            <input
              type="search"
              placeholder="예: 수수께끼, 샤코, 장비 업글"
              aria-label="자료 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit">검색</button>
          </form>

          {submittedQuery ? (
            <div className="home-search-results">
              <div className="search-result-summary">
                <strong>{submittedQuery}</strong>
                <span>{candidates.length > 0 ? `${candidates.length}개 페이지 후보` : '검색 결과 없음'}</span>
              </div>

              {candidates.length > 0 ? (
                <div className="search-result-list">
                  {candidates.map((candidate) => (
                    <NavLink className="search-result-card" key={candidate.path} to={searchDestinationPath(candidate.path, submittedQuery)}>
                      <div>
                        <span>{candidate.count}개 매칭</span>
                        <h2>{candidate.title}</h2>
                        <p>{candidate.description}</p>
                      </div>

                      <ul>
                        {candidate.examples.map((example) => (
                          <li key={example}>{example}</li>
                        ))}
                      </ul>

                      <ArrowRight aria-hidden="true" size={20} />
                    </NavLink>
                  ))}
                </div>
              ) : (
                <p className="search-empty-message">해당 검색어가 포함된 JSON 데이터 페이지를 찾지 못했습니다.</p>
              )}
            </div>
          ) : null}
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
