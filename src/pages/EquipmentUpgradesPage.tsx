import { Fragment, useMemo } from 'react'
import { PackageSearch } from 'lucide-react'
import { ItemDataTable, type ItemDataTableColumn } from '../components/ItemDataTable'
import { PageHeading } from '../components/PageHeading'
import { UpgradeIngredient } from '../components/UpgradeIngredient'
import { equipmentUpgrades } from '../shared/gameData'
import type { EquipmentUpgrade } from '../shared/appTypes'

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

            <EquipmentUpgradeTable recipes={group.recipes} />
          </section>
        ))}
      </div>
    </section>
  )
}

function EquipmentUpgradeTable({ recipes }: { recipes: EquipmentUpgrade[] }) {
  const columns: ItemDataTableColumn<EquipmentUpgrade>[] = [
    {
      key: 'target',
      header: '대상',
      className: 'upgrade-target-cell',
      getCellProps: (recipe, index, items) => {
        const isFirstTargetRow = index === 0 || items[index - 1].대상 !== recipe.대상

        return {
          hidden: !isFirstTargetRow,
          rowSpan: isFirstTargetRow
            ? items.filter((candidate) => candidate.대상 === recipe.대상).length
            : undefined,
        }
      },
      render: (recipe) => recipe.대상,
    },
    {
      key: 'upgrade',
      header: '업그레이드',
      className: 'equipment-upgrade-flow-cell',
      render: (recipe) => (
        <div className="upgrade-recipe-flow">
          <b>{recipe.현재등급}</b>
          <span>→</span>
          <b>{recipe.결과등급}</b>
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
      emptyMessage="장비 업그레이드 데이터가 없습니다."
      getRowKey={(recipe) => `${recipe.분류}-${recipe.현재등급}-${recipe.결과등급}`}
      items={recipes}
      tableClassName="upgrade-recipe-table"
      wrapperClassName="upgrade-recipe-table-wrap"
      widthMode="content"
    />
  )
}
