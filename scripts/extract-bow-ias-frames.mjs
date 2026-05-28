import { writeFile } from 'node:fs/promises'

const SOURCE_URL = 'https://roroyo.tistory.com/117'
const OUTPUT_PATH = 'src/data/bow-ias-frames.json'

const response = await fetch(SOURCE_URL)

if (!response.ok) {
  throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status}`)
}

const html = await response.text()
const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((match) => match[0])

if (tables.length < 4) {
  throw new Error(`Expected at least 4 tables, found ${tables.length}`)
}

const itemMap = new Map()

parseWithoutFanaticism(tables[0])
for (const table of tables.slice(1, 4)) {
  parseWithFanaticism(table)
}

const data = {
  source: {
    title: '[디아블로2 레저렉션] 보우(활)의 공속 프레임',
    url: SOURCE_URL,
  },
  category: '무기',
  type: '활',
  items: [...itemMap.values()].sort((left, right) => left.이름.localeCompare(right.이름, 'ko')),
}

await writeFile(`${process.cwd()}/${OUTPUT_PATH}`, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

function parseWithoutFanaticism(tableHtml) {
  const rows = parseRows(tableHtml)
  const headers = rows[0].slice(1)

  for (const row of rows.slice(1)) {
    const itemNames = splitItemNames(row[0])
    const frames = headers.map((header, index) => ({
      프레임: header,
      공속: minimumRequirement(row[index + 1]),
    }))

    for (const itemName of itemNames) {
      const item = getItem(itemName)
      item.광신미적용 = frames
    }
  }
}

function parseWithFanaticism(tableHtml) {
  const rows = parseRows(tableHtml)
  const itemNames = splitItemNames(rows[0][0])
  const headers = rows[1].slice(1)
  const fanaticismRows = rows.slice(2).map((row) => ({
    광신: row[0],
    프레임: headers.map((header, index) => ({
      프레임: header,
      공속: normalizeRange(row[index + 1]),
    })),
  }))

  for (const itemName of itemNames) {
    const item = getItem(itemName)
    item.광신적용 = fanaticismRows
  }
}

function parseRows(tableHtml) {
  return [...tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)]
    .map((row) => [...row[0].matchAll(/<td\b[\s\S]*?<\/td>/gi)].map((cell) => cleanCell(cell[0])))
    .filter((row) => row.length > 0)
}

function getItem(name) {
  const normalizedName = normalizeItemName(name)

  if (!itemMap.has(normalizedName)) {
    itemMap.set(normalizedName, {
      이름: normalizedName,
      광신미적용: [],
      광신적용: [],
    })
  }

  return itemMap.get(normalizedName)
}

function splitItemNames(value) {
  return value
    .split(',')
    .map((item) => normalizeItemName(item.trim()))
    .filter(Boolean)
}

function normalizeItemName(value) {
  return value.replace(/그랜드 매이트런 보우/g, '그랜드 메이트런 보우')
}

function normalizeRange(value) {
  return value.replace(/~/g, '-')
}

function minimumRequirement(value) {
  return normalizeRange(value).split('-')[0].trim()
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
