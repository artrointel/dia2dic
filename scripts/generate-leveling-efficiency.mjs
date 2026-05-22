import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const OUTPUT_PATH = resolve('src/data/leveling-efficiency.json')

const columns = [
  { id: 'normal-act-1', difficulty: '노말', difficultyEn: 'Normal', act: 'Act 1', averageExp: 78, areaLevels: range(1, 13) },
  { id: 'normal-act-2', difficulty: '노말', difficultyEn: 'Normal', act: 'Act 2', averageExp: 219, areaLevels: range(12, 18) },
  { id: 'normal-act-3', difficulty: '노말', difficultyEn: 'Normal', act: 'Act 3', averageExp: 391, areaLevels: range(19, 24) },
  { id: 'normal-act-4', difficulty: '노말', difficultyEn: 'Normal', act: 'Act 4', averageExp: 647, areaLevels: range(24, 31) },
  { id: 'normal-act-5', difficulty: '노말', difficultyEn: 'Normal', act: 'Act 5', averageExp: 2740, areaLevels: range(32, 42) },
  { id: 'nightmare-act-1', difficulty: '나이트메어', difficultyEn: 'Nightmare', act: 'Act 1', averageExp: 3463, areaLevels: range(37, 43) },
  { id: 'nightmare-act-2', difficulty: '나이트메어', difficultyEn: 'Nightmare', act: 'Act 2', averageExp: 7009, areaLevels: range(43, 48) },
  { id: 'nightmare-act-3', difficulty: '나이트메어', difficultyEn: 'Nightmare', act: 'Act 3', averageExp: 8471, areaLevels: range(49, 52) },
  { id: 'nightmare-act-4', difficulty: '나이트메어', difficultyEn: 'Nightmare', act: 'Act 4', averageExp: 11053, areaLevels: range(53, 62) },
  { id: 'nightmare-act-5', difficulty: '나이트메어', difficultyEn: 'Nightmare', act: 'Act 5', averageExp: 14748, areaLevels: range(58, 66) },
  { id: 'hell-act-1', difficulty: '헬', difficultyEn: 'Hell', act: 'Act 1', averageExp: 34364, areaLevels: range(63, 73) },
  { id: 'hell-act-2', difficulty: '헬', difficultyEn: 'Hell', act: 'Act 2', averageExp: 53949, areaLevels: range(74, 80) },
  { id: 'hell-act-3', difficulty: '헬', difficultyEn: 'Hell', act: 'Act 3', averageExp: 54147, areaLevels: range(81, 83) },
  { id: 'hell-act-4', difficulty: '헬', difficultyEn: 'Hell', act: 'Act 4', averageExp: 55251, areaLevels: range(83, 94) },
  { id: 'hell-act-5', difficulty: '헬', difficultyEn: 'Hell', act: 'Act 5', averageExp: 56680, areaLevels: range(95, 99) },
]

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function levelPenalty(characterLevel, monsterLevel) {
  if (characterLevel < 25) {
    if (monsterLevel > characterLevel + 5) {
      return Math.max(5, Math.round((characterLevel / monsterLevel) * 100))
    }

    if (monsterLevel < characterLevel - 5) {
      return Math.max(5, Math.round((monsterLevel / characterLevel) * 100))
    }

    return 100
  }

  const difference = Math.abs(characterLevel - monsterLevel)

  if (difference <= 5) {
    return 100
  }

  if (difference === 6) {
    return 81
  }

  if (difference === 7) {
    return 62
  }

  if (difference === 8) {
    return 43
  }

  if (difference === 9) {
    return 24
  }

  return 5
}

function averageEfficiency(characterLevel, areaLevels) {
  const total = areaLevels.reduce(
    (sum, monsterLevel) => sum + levelPenalty(characterLevel, monsterLevel),
    0,
  )

  return Math.round(total / areaLevels.length)
}

const data = {
  columns: columns.map(({ areaLevels, ...column }) => column),
  rows: range(1, 99).map((level) => ({
    level,
    values: Object.fromEntries(
      columns.map((column) => [column.id, averageEfficiency(level, column.areaLevels)]),
    ),
  })),
}

await mkdir(dirname(OUTPUT_PATH), { recursive: true })
await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
console.log(`Generated leveling efficiency table -> ${OUTPUT_PATH}`)
