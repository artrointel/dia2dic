import { RuneCombinationToken } from './RuneMiniCard'

export function UpgradeIngredient({ ingredient }: { ingredient: string }) {
  const runeName = ingredient.match(/^(.+)룬$/)?.[1]

  if (!runeName) {
    return <span className="upgrade-ingredient">{ingredient}</span>
  }

  return (
    <span className="upgrade-ingredient is-rune">
      <RuneCombinationToken name={runeName} />
    </span>
  )
}
