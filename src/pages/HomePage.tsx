import { ArrowRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { navigationItems, routePages } from '../navigation/navigation'
import type { NavigationItem } from '../shared/appTypes'

const pageDescriptionByPath = new Map(routePages.map((page) => [page.path, page.description]))
const homeNavigationGroups = navigationItems
  .map((item) => ({
    ...item,
    children: visibleNavigationPages(item),
  }))
  .filter((item) => item.children.length > 0)

export function HomePage() {
  return (
    <>
      <section className="home-intro" aria-labelledby="home-intro-title">
        <span>Diablo II knowledge base</span>
        <h1 id="home-intro-title">디아블로2 자료를 쉽게 찾는 사전형 웹페이지</h1>
        <p>
          디아블로2의 모든 자료를 한 곳에서 검색할 수 있는 아카이브입니다.
        </p>
      </section>

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
