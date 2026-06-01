import { Boxes } from 'lucide-react'
import { PageHeading } from '../components/PageHeading'
import type { Page } from '../shared/appTypes'

export function CategoryPage({ title, description, icon: Icon }: Page) {
  return (
    <section className="category-page">
      <PageHeading description={description} eyebrow="준비 중" icon={Icon} title={title} />

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


