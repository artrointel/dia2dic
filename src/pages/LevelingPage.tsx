import { useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import { TrendingUp } from 'lucide-react'
import { PageHeading } from '../components/PageHeading'
import { levelingEfficiency } from '../shared/gameData'
import type { LevelingEfficiency } from '../shared/appTypes'

export function LevelingPage() {
  const [hoveredLevel, setHoveredLevel] = useState<{
    row: LevelingEfficiency['rows'][number]
    x: number
    y: number
  } | null>(null)
  const difficultyGroups = useMemo(
    () =>
      [...new Set(levelingEfficiency.columns.map((column) => column.difficulty))].map(
        (difficulty) => ({
          difficulty,
          columns: levelingEfficiency.columns.filter((column) => column.difficulty === difficulty),
        }),
      ),
    [],
  )
  const updateHoveredLevel = (
    event: MouseEvent<HTMLTableRowElement>,
    row: LevelingEfficiency['rows'][number],
  ) => {
    const position = getLevelingCardPosition(event.clientX, event.clientY)

    setHoveredLevel({
      row,
      ...position,
    })
  }

  return (
    <section className="leveling-page">
      <PageHeading
        description="캐릭터 레벨별 난이도와 액트의 경험치 획득 효율을 비교합니다."
        eyebrow="레벨업"
        icon={TrendingUp}
        title="레벨업 효율표"
      />

      <div className="leveling-table-wrap">
        <table className="leveling-table">
          <thead>
            <tr>
              <th className="leveling-level-header" rowSpan={2}>레벨</th>
              {difficultyGroups.map((group) => (
                <th className="leveling-difficulty-header" colSpan={group.columns.length} key={group.difficulty}>
                  {group.difficulty}
                </th>
              ))}
            </tr>
            <tr>
              {levelingEfficiency.columns.map((column) => (
                <th key={`${column.id}-act`}>{column.act}</th>
              ))}
            </tr>
            <tr>
              <th className="leveling-average-label">평균 경험치</th>
              {levelingEfficiency.columns.map((column) => (
                <th className="leveling-average-exp" key={`${column.id}-average`}>
                  {column.averageExp.toLocaleString()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {levelingEfficiency.rows.map((row) => (
              <tr
                className={row.level % 5 === 0 ? 'is-level-marker' : undefined}
                key={row.level}
                onMouseEnter={(event) => updateHoveredLevel(event, row)}
                onMouseLeave={() => setHoveredLevel(null)}
                onMouseMove={(event) => updateHoveredLevel(event, row)}
              >
                <td className="leveling-level">{row.level}</td>
                {levelingEfficiency.columns.map((column) => {
                  const efficiency = row.values[column.id]

                  return (
                    <td className={levelingEfficiencyClass(efficiency)} key={column.id}>
                      {efficiency}%
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hoveredLevel ? (
        <LevelingMiniCard
          row={hoveredLevel.row}
          style={{
            left: hoveredLevel.x,
            top: hoveredLevel.y,
          }}
        />
      ) : null}
    </section>
  )
}

function getLevelingCardPosition(clientX: number, clientY: number) {
  const offset = 14
  const cardWidth = 260
  const cardHeight = 260
  const maxX = window.innerWidth - cardWidth - offset
  const maxY = window.innerHeight - cardHeight - offset

  return {
    x: Math.max(offset, Math.min(clientX + offset, maxX)),
    y: Math.max(offset, Math.min(clientY + offset, maxY)),
  }
}

function LevelingMiniCard({
  row,
  style,
}: {
  row: LevelingEfficiency['rows'][number]
  style?: CSSProperties
}) {
  const bestColumns = levelingEfficiency.columns
    .map((column) => ({
      ...column,
      efficiency: row.values[column.id],
    }))
    .toSorted((left, right) => right.efficiency - left.efficiency)
  const bestEfficiency = bestColumns[0]?.efficiency ?? 0
  const recommendations = bestColumns.filter((column) => column.efficiency === bestEfficiency)

  return (
    <span className="leveling-mini-card" role="tooltip" style={style}>
      <span className="leveling-mini-card-title">레벨 {row.level}</span>
      {recommendations.map((recommendation) => (
        <span className="leveling-mini-card-row" key={recommendation.id}>
          <span>난이도</span>
          <strong>{recommendation.difficulty}</strong>
          <span>액트</span>
          <strong>{recommendation.act}</strong>
          <span>효율</span>
          <strong>{recommendation.efficiency}%</strong>
          <span>평균 경험치</span>
          <strong>{recommendation.averageExp.toLocaleString()}</strong>
        </span>
      ))}
    </span>
  )
}

function levelingEfficiencyClass(value: number) {
  if (value >= 95) {
    return 'leveling-efficiency-cell is-peak'
  }

  if (value >= 75) {
    return 'leveling-efficiency-cell is-high'
  }

  if (value >= 45) {
    return 'leveling-efficiency-cell is-mid'
  }

  return 'leveling-efficiency-cell is-low'
}


