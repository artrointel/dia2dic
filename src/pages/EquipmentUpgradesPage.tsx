import { Fragment, useMemo } from 'react'
import { PackageSearch } from 'lucide-react'
import { PageHeading } from '../components/PageHeading'
import { UpgradeIngredient } from '../components/UpgradeIngredient'
import { equipmentUpgrades } from '../shared/gameData'

export function EquipmentUpgradesPage() {
  const groups = useMemo(
    () =>
      [...new Set(equipmentUpgrades.map((recipe) => recipe.분류))].map((category) => ({
        category,
        recipes: equipmentUpgrades.filter((recipe) => recipe.분류 === category),
      })),
    [],
  )

  return (
    <section className="equipment-upgrades-page">
      <PageHeading
        description="레어, 유니크, 세트 장비의 등급 업그레이드 조합식을 확인합니다."
        eyebrow="호라드릭 함"
        icon={PackageSearch}
        title="장비 업글"
      />

      <div className="upgrade-recipe-groups">
        {groups.map((group) => (
          <section className="upgrade-recipe-group" key={group.category}>
            <div className="upgrade-recipe-group-header">
              <h2>{group.category}</h2>
              <span>{group.recipes.length}개 조합</span>
            </div>

            <div className="upgrade-recipe-table-wrap">
              <table className="upgrade-recipe-table">
                <thead>
                  <tr>
                    <th>대상</th>
                    <th>업그레이드</th>
                    <th>조합</th>
                  </tr>
                </thead>
                <tbody>
                  {group.recipes.map((recipe, index) => {
                    const isFirstTargetRow =
                      index === 0 || group.recipes[index - 1].대상 !== recipe.대상
                    const targetRowSpan = isFirstTargetRow
                      ? group.recipes.filter((candidate) => candidate.대상 === recipe.대상).length
                      : 0

                    return (
                      <tr key={`${recipe.분류}-${recipe.현재등급}-${recipe.결과등급}`}>
                        {isFirstTargetRow && (
                          <td className="upgrade-target-cell" rowSpan={targetRowSpan}>
                            {recipe.대상}
                          </td>
                        )}
                        <td>
                          <div className="upgrade-recipe-flow">
                            <b>{recipe.현재등급}</b>
                            <span>→</span>
                            <b>{recipe.결과등급}</b>
                          </div>
                        </td>
                        <td>
                          <div className="upgrade-ingredient-list">
                            {recipe.재료.map((ingredient, ingredientIndex) => (
                              <Fragment key={`${ingredient}-${ingredientIndex}`}>
                                {ingredientIndex > 0 && <span className="upgrade-plus">+</span>}
                                <UpgradeIngredient ingredient={ingredient} />
                              </Fragment>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}


