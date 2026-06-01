import { Fragment, useRef, useState } from 'react'
import { PackageSearch } from 'lucide-react'
import { ImageViewer } from '../components/ImageViewer'
import { PageHeading } from '../components/PageHeading'
import { UpgradeIngredient } from '../components/UpgradeIngredient'
import { useTableCrosshair } from '../hooks/useTableCrosshair'
import { assetUrl, socketRecipes } from '../shared/gameData'

export function SocketRecipesPage() {
  const tableRef = useRef<HTMLTableElement>(null)
  const [isSocketImageOpen, setIsSocketImageOpen] = useState(false)
  useTableCrosshair(tableRef)

  return (
    <section className="socket-recipes-page">
      <PageHeading
        description="일반 장비에 소켓을 생성하는 조합식을 대상별로 확인합니다."
        eyebrow="호라드릭 함"
        icon={PackageSearch}
        title="소켓 뚫기"
      />

      <aside className="socket-probability-note">
        <h2>소켓 수 확률</h2>
        <p>
          큐브 소켓은 1~6 주사위 결과를 기준으로 정해지고, 아이템의 최대 소켓 수를
          넘는 값은 최대 소켓으로 보정됩니다.
        </p>
        <p>
          예를 들어 최대 4소켓 장비는 1~3소켓이 각각 1/6, 4소켓은 4·5·6이 합쳐져
          1/2 확률입니다.
        </p>
      </aside>

      <button
        className="socket-reference-card"
        onClick={() => setIsSocketImageOpen(true)}
        type="button"
      >
        <h2>아이템 별 숨렙에 따른 최대 소켓 수 보기</h2>
      </button>

      <div className="upgrade-recipe-table-wrap socket-recipe-table-wrap">
        <table className="table-crosshair upgrade-recipe-table socket-recipe-table" ref={tableRef}>
          <thead>
            <tr>
              <th>대상</th>
              <th>조합</th>
              <th>결과</th>
            </tr>
          </thead>
          <tbody>
            {socketRecipes.map((recipe) => (
              <tr key={recipe.대상}>
                <td className="upgrade-target-cell">{recipe.대상}</td>
                <td>
                  <div className="upgrade-ingredient-list">
                    {recipe.재료.map((ingredient, ingredientIndex) => (
                      <Fragment key={`${recipe.대상}-${ingredient}`}>
                        {ingredientIndex > 0 && <span className="upgrade-plus">+</span>}
                        <UpgradeIngredient ingredient={ingredient} />
                      </Fragment>
                    ))}
                  </div>
                </td>
                <td className="socket-recipe-result">{recipe.결과}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ImageViewer
        alt="아이템 별 숨렙에 따른 최대 소켓 수"
        isOpen={isSocketImageOpen}
        onClose={() => setIsSocketImageOpen(false)}
        src={assetUrl('/assets/images/socket/max-sockets-by-item.png')}
        title="아이템 별 숨렙에 따른 최대 소켓 수"
      />
    </section>
  )
}



