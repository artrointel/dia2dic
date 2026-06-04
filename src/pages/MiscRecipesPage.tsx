import { Fragment, useMemo } from 'react'
import { FlaskConical } from 'lucide-react'
import { ItemDataTable, type ItemDataTableColumn } from '../components/ItemDataTable'
import { PageHeading } from '../components/PageHeading'
import { UpgradeIngredient } from '../components/UpgradeIngredient'
import { miscRecipes } from '../shared/gameData'
import type { MiscRecipe } from '../shared/appTypes'

export function MiscRecipesPage() {
  const groups = useMemo(
    () =>
      [...new Set(miscRecipes.map((recipe) => recipe.분류))].map((category) => ({
        category,
        recipes: miscRecipes.filter((recipe) => recipe.분류 === category),
      })),
    [],
  )

  return (
    <section className="equipment-upgrades-page misc-recipes-page">
      <PageHeading
        description="파괴참 갱신 등 호라드릭 함 기타 조합식을 확인합니다."
        eyebrow="호라드릭 함"
        icon={FlaskConical}
        title="기타 조합"
      />

      <div className="upgrade-recipe-groups">
        {groups.map((group) => (
          <section className="upgrade-recipe-group" key={group.category}>
            <MiscRecipeTable
              header={{
                className: 'upgrade-recipe-group-header',
                meta: `${group.recipes.length}개 조합`,
                title: group.category,
              }}
              recipes={group.recipes}
            />
          </section>
        ))}
      </div>
    </section>
  )
}

function MiscRecipeTable({
  header,
  recipes,
}: {
  header: { className: string; meta: string; title: string }
  recipes: MiscRecipe[]
}) {
  const columns: ItemDataTableColumn<MiscRecipe>[] = [
    {
      key: 'result',
      header: '결과',
      className: 'equipment-upgrade-flow-cell',
      render: (recipe) => (
        <div className="upgrade-recipe-flow">
          <b>{recipe.결과}</b>
        </div>
      ),
    },
    {
      key: 'materials',
      header: '조합',
      className: 'equipment-upgrade-materials-cell',
      render: (recipe) => (
        <div className="upgrade-ingredient-list">
          {recipe.재료.map((ingredient, ingredientIndex) => (
            <Fragment key={`${ingredient}-${ingredientIndex}`}>
              {ingredientIndex > 0 && <span className="upgrade-plus">+</span>}
              <UpgradeIngredient ingredient={ingredient} />
            </Fragment>
          ))}
        </div>
      ),
    },
  ]

  return (
    <ItemDataTable
      columns={columns}
      emptyMessage="기타 조합 데이터가 없습니다."
      getRowKey={(recipe) => `${recipe.분류}-${recipe.결과}`}
      header={header}
      items={recipes}
      pageSize="all"
      tableClassName="upgrade-recipe-table misc-recipe-table"
      wrapperClassName="upgrade-recipe-table-wrap"
      widthMode="content"
    />
  )
}
