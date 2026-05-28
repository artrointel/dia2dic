import { writeFile } from 'node:fs/promises'

const SOURCE_URL = 'https://roroyo.tistory.com/120'
const OUTPUT_PATH = 'src/data/weapon-spear-bases.json'

const sectionDefinitions = [
  {
    id: 'normal',
    title: '노멀 창',
    grade: '노멀',
    hasRange: true,
  },
  {
    id: 'exceptional',
    title: '익셉셔널 창',
    grade: '익셉셔널',
    hasRange: true,
  },
  {
    id: 'elite',
    title: '엘리트 창',
    grade: '엘리트',
    hasRange: true,
  },
  {
    id: 'amazon',
    title: '아마존 전용 창',
    grade: '아마존 전용',
    hasRange: false,
  },
]

const response = await fetch(SOURCE_URL)

if (!response.ok) {
  throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status}`)
}

const html = await response.text()
const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].slice(0, sectionDefinitions.length)

if (tables.length !== sectionDefinitions.length) {
  throw new Error(`Expected ${sectionDefinitions.length} tables, found ${tables.length}`)
}

const data = {
  source: {
    title: '[디아블로2 레저렉션] 노멀/익셉셔널/엘리트 창 (스피어)',
    url: SOURCE_URL,
  },
  category: '무기',
  type: '창',
  notes: [
    '노멀, 익셉셔널, 엘리트 창의 양손 데미지, 렙제, 힘제, 민첩제, 도달 범위, 최대 소켓 정리',
    '아마존 전용 창은 원본 표에 도달 범위 컬럼이 없어 사거리 값은 비워 둠',
  ],
  sections: splitAmazonSections(tables.map((table, index) => {
    const definition = sectionDefinitions[index]

    return {
      id: definition.id,
      title: definition.title,
      grade: definition.grade,
      columns: definition.hasRange
        ? ['이름', '양손 데미지', '요구 레벨', '필요 힘', '필요 민첩', '도달 범위', '최대 홈']
        : ['이름', '양손 데미지', '요구 레벨', '필요 힘', '필요 민첩', '최대 홈'],
      items: parseTable(table[0], definition),
    }
  })),
}

await writeFile(`${process.cwd()}/${OUTPUT_PATH}`, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

function parseTable(tableHtml, definition) {
  const expectedColumnCount = definition.hasRange ? 7 : 6
  const rows = expandTableRows(tableHtml, expectedColumnCount)
    .filter((row) => row.length > 0)
    .slice(1)

  return rows.map((cells) => {
    const nameCell = cells[0] ?? ''
    const hasRequiredLevel = definition.id !== 'normal' || !definition.hasRange
    const requiredLevelIndex = hasRequiredLevel ? 2 : null
    const strengthIndex = hasRequiredLevel ? 3 : 2
    const dexterityIndex = hasRequiredLevel ? 4 : 3
    const rangeIndex = definition.hasRange ? (hasRequiredLevel ? 5 : 4) : null
    const socketIndex = definition.hasRange ? (hasRequiredLevel ? 6 : 5) : 5

    return {
      이름: cleanCell(nameCell),
      양손데미지: parseDamage(cleanCell(cells[1] ?? '')),
      사거리: rangeIndex === null ? null : parseNullableNumber(cleanCell(cells[rangeIndex] ?? '')),
      전용: definition.id === 'amazon' ? '아마존 전용' : null,
      추천: /<b[\s>]/i.test(nameCell),
      요구레벨: requiredLevelIndex === null ? null : parseNullableNumber(cleanCell(cells[requiredLevelIndex] ?? '')),
      필요힘: parseNullableNumber(cleanCell(cells[strengthIndex] ?? '')),
      필요민첩: parseNullableNumber(cleanCell(cells[dexterityIndex] ?? '')),
      최대홈: parseNullableNumber(cleanCell(cells[socketIndex] ?? '')),
    }
  })
}

function splitAmazonSections(sections) {
  return sections.flatMap((section) => {
    if (section.id !== 'amazon') {
      return section
    }

    return [
      {
        ...section,
        id: 'amazon-normal',
        title: '노멀 아마존 전용 창',
        grade: '노멀',
        items: section.items.filter((item) => ['메이든 스피어', '메이든 파이크'].includes(item.이름)),
      },
      {
        ...section,
        id: 'amazon-exceptional',
        title: '익셉셔널 아마존 전용 창',
        grade: '익셉셔널',
        items: section.items.filter((item) => ['세러모니얼 스피어', '세러모니얼 파이크'].includes(item.이름)),
      },
      {
        ...section,
        id: 'amazon-elite',
        title: '엘리트 아마존 전용 창',
        grade: '엘리트',
        items: section.items.filter((item) => ['메이트리어컬 스피어', '메이트리어컬 파이크'].includes(item.이름)),
      },
    ]
  })
}

function expandTableRows(tableHtml, expectedColumnCount) {
  const rowspans = []

  return [...tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((row) => {
    const sourceCells = [...row[0].matchAll(/<td\b[\s\S]*?<\/td>/gi)].map((cell) => cell[0])
    const expandedCells = []
    let columnIndex = 0

    const applyRowspanAtCurrentColumn = () => {
      while (rowspans[columnIndex]?.remaining > 0) {
        expandedCells[columnIndex] = rowspans[columnIndex].cell
        rowspans[columnIndex].remaining -= 1
        columnIndex += 1
      }
    }

    for (const cell of sourceCells) {
      applyRowspanAtCurrentColumn()

      const colspan = getSpanValue(cell, 'colspan')
      const rowspan = getSpanValue(cell, 'rowspan')

      for (let spanIndex = 0; spanIndex < colspan; spanIndex += 1) {
        expandedCells[columnIndex] = cell

        if (rowspan > 1) {
          rowspans[columnIndex] = {
            cell,
            remaining: rowspan - 1,
          }
        }

        columnIndex += 1
      }
    }

    while (columnIndex < expectedColumnCount) {
      applyRowspanAtCurrentColumn()

      if (!expandedCells[columnIndex]) {
        expandedCells[columnIndex] = ''
      }

      columnIndex += 1
    }

    return expandedCells
  })
}

function getSpanValue(cell, attributeName) {
  const match = cell.match(new RegExp(`${attributeName}=["']?(\\d+)`, 'i'))

  return match ? Number(match[1]) : 1
}

function cleanCell(value) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, '•')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseDamage(value) {
  const match = value.match(/^(\d+)\s*-\s*(\d+)\s*\(평균\s*([\d.]+)\)$/)

  if (!match) {
    return {
      최소: null,
      최대: null,
      평균: null,
      원문: value || null,
    }
  }

  return {
    최소: Number(match[1]),
    최대: Number(match[2]),
    평균: Number(match[3]),
    원문: value,
  }
}

function parseNullableNumber(value) {
  if (!value || value.toUpperCase() === 'X') {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}
