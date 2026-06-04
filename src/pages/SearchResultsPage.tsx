import { ArrowRight, Search } from 'lucide-react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { searchPageCandidates } from '../shared/searchIndex'
import { readPageSearchQuery, searchDestinationPath } from '../shared/searchNavigation'

export function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const searchQuery = readPageSearchQuery(searchParams)
  const candidates = searchPageCandidates(searchQuery)

  return (
    <section className="search-results-page">
      <header className="search-results-heading">
        <Search aria-hidden="true" size={22} />
        <div>
          <h1>검색 결과</h1>
          <p>
            {searchQuery ? (
              <>
                <strong>{searchQuery}</strong>
                <span>{candidates.length > 0 ? `${candidates.length}개 페이지 후보` : '검색 결과 없음'}</span>
              </>
            ) : (
              <span>헤더 검색창에 찾을 자료를 입력하세요.</span>
            )}
          </p>
        </div>
      </header>

      {searchQuery && candidates.length > 0 ? (
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
      ) : null}

      {searchQuery && candidates.length === 0 ? (
        <p className="search-empty-message">해당 검색어가 포함된 JSON 데이터 페이지를 찾지 못했습니다.</p>
      ) : null}
    </section>
  )
}
