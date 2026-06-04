import { ArrowRight } from 'lucide-react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { pages } from '../navigation/navigation'
import { searchPageCandidates } from '../shared/searchIndex'
import { readPageSearchQuery, searchDestinationPath } from '../shared/searchNavigation'

export function HomePage() {
  const [searchParams] = useSearchParams()
  const searchQuery = readPageSearchQuery(searchParams)
  const candidates = searchPageCandidates(searchQuery)

  return (
    <>
      {searchQuery ? (
        <section className="hero-section">
          <div className="hero-copy">
            <div className="home-search-results">
              <div className="search-result-summary">
                <strong>{searchQuery}</strong>
                <span>{candidates.length > 0 ? `${candidates.length}개 페이지 후보` : '검색 결과 없음'}</span>
              </div>

              {candidates.length > 0 ? (
                <div className="search-result-list">
                  {candidates.map((candidate) => (
                    <NavLink className="search-result-card" key={candidate.path} to={searchDestinationPath(candidate.path, searchQuery)}>
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
          </div>
        </section>
      ) : null}

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
