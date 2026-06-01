import { writeFile } from 'node:fs/promises'

const SOURCE_URL = 'https://tradia.me/diablo2/item_normal/2575273'
const OUTPUT_PATH = 'src/data/boot-bases.json'

const sectionDefinitions = [
  {
    id: 'normal',
    title: '신발 - 노멀',
    grade: '노멀',
  },
  {
    id: 'exceptional',
    title: '신발 - 익셉셔널',
    grade: '익셉셔널',
  },
  {
    id: 'elite',
    title: '신발 - 엘리트',
    grade: '엘리트',
  },
]

const response = await fetch(SOURCE_URL)

if (!response.ok) {
  throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status}`)
}

const html = await response.text()
const documentMatch = html.match(/<div class="document_[^"]+ rhymix_content xe_content">([\s\S]*?)<!--AfterDocument/i)
const sourceHtml = documentMatch?.[1] ?? html
const tables = [...sourceHtml.matchAll(/<table[\s\S]*?<\/table>/gi)].slice(0, sectionDefinitions.length)

if (tables.length !== sectionDefinitions.length) {
  throw new Error(`Expected ${sectionDefinitions.length} tables, found ${tables.length}`)
}

const data = {
  source: {
    title: '신발 - 노말 아이템 사전 - 트레디아 디아블로2',
    url: SOURCE_URL,
  },
  category: '신발',
  notes: [
    '트레디아 신발 노멀, 익셉셔널, 엘리트 데이터에서 방어력, 힘제, 요구 레벨만 정리',
    '내구도, 퀄리티 레벨, 사냥터 레벨, 암살자 발차기 피해는 제외',
  ],
  sections: tables.map((table, index) => {
    const definition = sectionDefinitions[index]

    return {
      id: definition.id,
      title: definition.title,
      kind: 'base',
      grade: definition.grade,
      columns: ['이름', '영문명', '방어력', '필요 힘', '요구 레벨'],
      items: parseTable(table[0]),
    }
  }),
}

await writeFile(`${process.cwd()}/${OUTPUT_PATH}`, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

function parseTable(tableHtml) {
  return [...tableHtml.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((row) => {
    const rowHtml = row[0]

    return {
      이름: cleanCell(matchFirst(rowHtml, /<h3>[\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/i)).replace(/^#/, ''),
      영문명: cleanCell(matchFirst(rowHtml, /<span class="color-normal en">([\s\S]*?)<\/span>/i)),
      방어력: parseRange(valueByClass(rowHtml, 'key-defense')),
      추천: /<b[\s>]/i.test(rowHtml),
      요구레벨: parseNullableNumber(valueByClass(rowHtml, 'key-req_lvl')),
      필요힘: parseNullableNumber(valueByClass(rowHtml, 'key-req_str')),
      최대홈: null,
    }
  }).filter((item) => item.이름)
}

function valueByClass(rowHtml, className) {
  return cleanCell(
    matchFirst(
      rowHtml,
      new RegExp(
        `<span[^>]*class="${className}[^"]*"[^>]*>[\\s\\S]*?<span class="val-1">([\\s\\S]*?)<\\/span>`,
        'i',
      ),
    ),
  )
}

function matchFirst(value, pattern) {
  return value.match(pattern)?.[1] ?? ''
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
  const rangeMatch = normalized.match(/^(\d+)\s*-\s*(\d+)$/)
  const singleMatch = normalized.match(/^(\d+)$/)

  if (rangeMatch) {
    return {
      최소: Number(rangeMatch[1]),
      최대: Number(rangeMatch[2]),
      원문: value,
    }
  }

  if (singleMatch) {
    const defense = Number(singleMatch[1])

    return {
      최소: defense,
      최대: defense,
      원문: value,
    }
  }

  return {
    최소: null,
    최대: null,
    원문: value || null,
  }
}

function parseNullableNumber(value) {
  if (!value || value.toUpperCase() === 'X') {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}
