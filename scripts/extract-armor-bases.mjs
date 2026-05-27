import { writeFile } from 'node:fs/promises'

const SOURCE_URL = 'https://roroyo.tistory.com/42'
const OUTPUT_PATH = 'src/data/armor-bases.json'

const sectionDefinitions = [
  {
    id: 'normal',
    title: '노멀 갑옷',
    kind: 'base',
    grade: '노멀',
    columns: ['이름', '최소/최대 방어력', '요구 레벨', '필요 힘', '무게', '최대 홈'],
  },
  {
    id: 'exceptional',
    title: '익셉셔널 갑옷',
    kind: 'base',
    grade: '익셉셔널',
    columns: ['이름', '최소/최대 방어력', '요구 레벨', '필요 힘', '무게', '최대 홈'],
  },
  {
    id: 'elite',
    title: '엘리트 갑옷',
    kind: 'base',
    grade: '엘리트',
    columns: ['이름', '최소/최대 방어력', '요구 레벨', '필요 힘', '무게', '최대 홈'],
  },
  {
    id: 'superior-elite-defense',
    title: '고급 엘리트 갑옷 5~15% 증가된 방어력 수치',
    kind: 'superior-defense',
    grade: '엘리트',
    columns: ['이름', '최소/최대 방어력'],
  },
  {
    id: 'ethereal-elite',
    title: '에테리얼 엘리트 갑옷',
    kind: 'ethereal',
    grade: '엘리트',
    columns: ['이름', '최소/최대 방어력', '필요 힘'],
  },
  {
    id: 'superior-ethereal-elite-defense',
    title: '고급 에테리얼 엘리트 갑옷 5~15% 증가된 방어력 수치',
    kind: 'superior-ethereal-defense',
    grade: '엘리트',
    columns: ['이름', '최소/최대 방어력'],
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
    title: '[디아블로2 레저렉션] 노멀/익셉셔널/엘리트 갑옷',
    url: SOURCE_URL,
    publishedAt: '2021-11-29T20:11:51+09:00',
    modifiedAt: '2024-05-30T18:52:50+09:00',
  },
  category: '갑옷',
  notes: [
    '노멀, 익셉셔널, 엘리트 갑옷의 렙제, 힘제, 최대 소켓 정리',
    '볼드체 처리된 갑옷은 원문에서 많이 사용된다고 표시된 항목',
    '노멀 갑옷은 요구 레벨이 없음',
    '갑옷 무게는 이동 속도에 영향을 주며 Light > Medium > Heavy 순으로 가벼움',
  ],
  sections: tables.map((table, index) => {
    const definition = sectionDefinitions[index]

    return {
      ...definition,
      items: parseTable(table[0], definition),
    }
  }),
}

await writeFile(`${process.cwd()}/${OUTPUT_PATH}`, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

function parseTable(tableHtml, definition) {
  const rows = expandTableRows(tableHtml, definition.columns.length)
    .filter((row) => row.length > 0)
    .slice(1)

  return rows.map((cells) => {
    const nameCell = cells[0] ?? ''
    const name = normalizeItemName(cleanCell(nameCell))
    const defense = parseRange(cleanCell(cells[1] ?? ''))
    const item = {
      이름: name,
      방어력: defense,
      추천: /<b[\s>]/i.test(nameCell),
    }

    if (definition.kind === 'base') {
      item.요구레벨 = parseNullableNumber(cleanCell(cells[2] ?? ''))
      item.필요힘 = parseNullableNumber(cleanCell(cells[3] ?? ''))
      item.무게 = normalizeWeight(cleanCell(cells[4] ?? ''))
      item.최대홈 = parseNullableNumber(cleanCell(cells[5] ?? ''))
    }

    if (definition.kind === 'ethereal') {
      item.필요힘 = parseNullableNumber(cleanCell(cells[2] ?? ''))
    }

    return item
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

function parseRange(value) {
  const normalized = value.replace(/[~–—]/g, '-')
  const match = normalized.match(/^(\d+)\s*-\s*(\d+)$/)

  if (!match) {
    return {
      최소: null,
      최대: null,
      원문: value || null,
    }
  }

  return {
    최소: Number(match[1]),
    최대: Number(match[2]),
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

function normalizeWeight(value) {
  return value.replace(/\s+/g, '')
}

function normalizeItemName(value) {
  return value
    .replace(/아\s+머/g, '아머')
    .replace(/하스크/g, '허스크')
    .replace(/아칸/g, '아콘')
    .replace(/트릴리스트 아머/g, '트렐리스트 아머')
    .replace(/임바스트플레이트/g, '임바스트 플레이트')
    .replace(/웜하이드/g, '와이엄하이드')
}
