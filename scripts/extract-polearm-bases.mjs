import { writeFile } from 'node:fs/promises'

const SOURCE_URL = 'https://roroyo.tistory.com/74'
const OUTPUT_PATH = 'src/data/weapon-polearm-bases.json'

const sectionDefinitions = [
  {
    id: 'normal',
    title: '노멀 폴암',
    grade: '노멀',
  },
  {
    id: 'exceptional',
    title: '익셉셔널 폴암',
    grade: '익셉셔널',
  },
  {
    id: 'elite',
    title: '엘리트 폴암',
    grade: '엘리트',
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
    title: '[디아블로2 레저렉션] 노멀/익셉셔널/엘리트 폴암',
    url: SOURCE_URL,
    publishedAt: '2021-11-29T20:12:05+09:00',
    modifiedAt: '2022-01-14T03:51:25+09:00',
  },
  category: '무기',
  type: '폴암',
  notes: [
    '노멀, 익셉셔널, 엘리트 폴암의 양손 데미지, 렙제, 힘제, 최대 소켓 정리',
    '볼드체 처리된 폴암은 원문에서 많이 사용된다고 표시된 항목',
  ],
  sections: tables.map((table, index) => {
    const definition = sectionDefinitions[index]

    return {
      ...definition,
      columns: ['이름', '양손 데미지', '사거리', '요구 레벨', '필요 힘', '필요 민첩', '최대 홈'],
      items: parseTable(table[0]),
    }
  }),
}

await writeFile(`${process.cwd()}/${OUTPUT_PATH}`, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

function parseTable(tableHtml) {
  const rows = expandTableRows(tableHtml, 7)
    .filter((row) => row.length > 0)
    .slice(1)

  return rows.map((cells) => {
    const nameCell = cells[0] ?? ''

    return {
      이름: normalizeItemName(cleanCell(nameCell)),
      양손데미지: parseDamage(cleanCell(cells[1] ?? '')),
      사거리: parseNullableNumber(cleanCell(cells[2] ?? '')),
      추천: /<b[\s>]/i.test(nameCell),
      요구레벨: parseNullableNumber(cleanCell(cells[3] ?? '')),
      필요힘: parseNullableNumber(cleanCell(cells[4] ?? '')),
      필요민첩: parseNullableNumber(cleanCell(cells[5] ?? '')),
      최대홈: parseNullableNumber(cleanCell(cells[6] ?? '')),
    }
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

function normalizeItemName(value) {
  return value.replace(/싸이드/g, '사이드')
}
