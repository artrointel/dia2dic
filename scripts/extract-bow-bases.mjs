import { writeFile } from 'node:fs/promises'

const SOURCE_URL = 'https://roroyo.tistory.com/99'
const OUTPUT_PATH = 'src/data/weapon-bow-bases.json'

const sectionDefinitions = [
  {
    id: 'normal',
    title: '노멀 보우(활)',
    grade: '노멀',
    hasRequiredLevel: false,
  },
  {
    id: 'exceptional',
    title: '익셉셔널 보우(활)',
    grade: '익셉셔널',
    hasRequiredLevel: true,
  },
  {
    id: 'elite',
    title: '엘리트 보우(활)',
    grade: '엘리트',
    hasRequiredLevel: true,
  },
  {
    id: 'amazon',
    title: '아마존 전용 보우(활)',
    grade: '아마존 전용',
    hasRequiredLevel: true,
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
    title: '[디아블로2 레저렉션] 노멀/익셉셔널/엘리트 보우 (활)',
    url: SOURCE_URL,
    publishedAt: '2021-11-29T20:12:31+09:00',
    modifiedAt: '2022-01-25T18:24:26+09:00',
  },
  category: '무기',
  type: '활',
  notes: [
    '노멀, 익셉셔널, 엘리트, 아마존 전용 활의 양손 데미지, 요구치, 최대 소켓 정리',
    '원본 표에 사거리 컬럼이 없어 사거리 값은 비워 둠',
  ],
  sections: splitAmazonSections(tables.map((table, index) => {
    const definition = sectionDefinitions[index]

    return {
      id: definition.id,
      title: definition.title,
      grade: definition.grade,
      columns: definition.hasRequiredLevel
        ? ['이름', '양손 데미지', '요구 레벨', '필요 힘', '필요 민첩', '최대 홈']
        : ['이름', '양손 데미지', '필요 힘', '필요 민첩', '최대 홈'],
      items: parseTable(table[0], definition.hasRequiredLevel),
    }
  })),
}

await writeFile(`${process.cwd()}/${OUTPUT_PATH}`, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

function parseTable(tableHtml, hasRequiredLevel) {
  const expectedColumnCount = hasRequiredLevel ? 6 : 5
  const rows = expandTableRows(tableHtml, expectedColumnCount)
    .filter((row) => row.length > 0)
    .slice(1)

  return rows.map((cells) => {
    const nameCell = cells[0] ?? ''
    const requiredLevelIndex = hasRequiredLevel ? 2 : -1
    const strengthIndex = hasRequiredLevel ? 3 : 2
    const dexterityIndex = hasRequiredLevel ? 4 : 3
    const socketIndex = hasRequiredLevel ? 5 : 4

    return {
      이름: normalizeItemName(cleanCell(nameCell)),
      양손데미지: parseDamage(cleanCell(cells[1] ?? '')),
      사거리: null,
      전용: null,
      추천: /<b[\s>]/i.test(nameCell),
      요구레벨: hasRequiredLevel ? parseNullableNumber(cleanCell(cells[requiredLevelIndex] ?? '')) : null,
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

    const amazonItems = section.items.map((item) => ({
      ...item,
      전용: '아마존 전용',
    }))

    return [
      {
        ...section,
        id: 'amazon-normal',
        title: '노멀 아마존 전용 보우(활)',
        grade: '노멀',
        items: amazonItems.filter((item) => ['스태그 보우', '리플렉스 보우'].includes(item.이름)),
      },
      {
        ...section,
        id: 'amazon-exceptional',
        title: '익셉셔널 아마존 전용 보우(활)',
        grade: '익셉셔널',
        items: amazonItems.filter((item) => ['애쉬우드 보우', '세러모니얼 보우'].includes(item.이름)),
      },
      {
        ...section,
        id: 'amazon-elite',
        title: '엘리트 아마존 전용 보우(활)',
        grade: '엘리트',
        items: amazonItems.filter((item) =>
          ['메이트리어컬 보우', '그랜드 메이트런 보우'].includes(item.이름),
        ),
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
    .replace(/&bull;/g, '·')
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

function normalizeItemName(value) {
  return value
    .replace(/메트리어컬/g, '메이트리어컬')
    .replace(/그랜드 메이트런/g, '그랜드 메이트런')
}
