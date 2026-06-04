import { ArrowRight } from 'lucide-react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { navigationItems, routePages } from '../navigation/navigation'
import type { NavigationItem } from '../shared/appTypes'
import { searchPageCandidates } from '../shared/searchIndex'
import { readPageSearchQuery, searchDestinationPath } from '../shared/searchNavigation'

const pageDescriptionByPath = new Map(routePages.map((page) => [page.path, page.description]))
const homeNavigationGroups = navigationItems
  .map((item) => ({
    ...item,
    children: visibleNavigationPages(item),
  }))
  .filter((item) => item.children.length > 0)

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

      <section className="home-category-list" aria-label="자료 분류">
        {homeNavigationGroups.map((group) => {
          const Icon = group.icon

          return (
            <section className="home-category-group" key={group.title}>
              <header className="home-category-header">
                {Icon ? <Icon aria-hidden="true" size={21} /> : null}
                <h2>{group.title}</h2>
                <span>{group.children.length}개 페이지</span>
              </header>

              <div className="home-category-pages">
                {group.children.map((page) => {
                  const PageIcon = page.icon
                  const description = page.description ?? (page.path
                    ? pageDescriptionByPath.get(page.path) ?? '자료 페이지로 이동합니다.'
                    : '외부 페이지로 이동합니다.')
                  const content = (
                    <>
                      {PageIcon ? <PageIcon aria-hidden="true" size={20} /> : null}
                      <span>
                        <strong>{page.title}</strong>
                        <small>{description}</small>
                      </span>
                      <ArrowRight aria-hidden="true" size={18} />
                    </>
                  )

                  return page.path ? (
                    <NavLink className="home-page-card" key={page.path} to={page.path}>
                      {content}
                    </NavLink>
                  ) : (
                    <a className="home-page-card" href={page.href} key={page.href} rel="noreferrer" target="_blank">
                      {content}
                    </a>
                  )
                })}
              </div>
            </section>
          )
        })}
      </section>
    </>
  )
}

function visibleNavigationPages(item: NavigationItem): NavigationItem[] {
  if (item.children) {
    return item.children.filter((child) => child.path || child.href)
  }

  return item.path || item.href ? [item] : []
}
