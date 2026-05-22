import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const SOURCE_URL = 'https://malthael.tistory.com/8'
const OUTPUT_PATH = resolve('src/data/runewords.json')

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function cellLines(html) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>|<\/div>|<\/li>|<\/tr>|<\/h\d>|<\/td>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function redVersionLines(html) {
  return [
    ...html.matchAll(
      /<span[^>]*style="[^"]*color:\s*#ee2323[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
    ),
  ]
    .flatMap((match) => cellLines(match[1]))
    .filter((line) => /(신규|래더|확장팩|전용)/.test(line))
}

function unique(values) {
  return [...new Set(values)]
}

function tableRows(html) {
  const tableStart = html.indexOf(
    '<table style="border-collapse: collapse; width: 100%; height: 26140px;"',
  )
  const tableEnd = html.indexOf('</table>', tableStart)

  if (tableStart < 0 || tableEnd < 0) {
    throw new Error('룬워드 표를 찾지 못했습니다.')
  }

  return [
    ...html.slice(tableStart, tableEnd).matchAll(/<tr[\s\S]*?<\/tr>/gi),
  ].map((match) => match[0])
}

function rowCells(row) {
  return [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1])
}

function parseCombinationCell(html) {
  const lines = cellLines(html)
  const version = unique(redVersionLines(html))
  const socketLineIndex = lines.findIndex((line) => /^\[\d+\]/.test(line))

  if (socketLineIndex < 0) {
    throw new Error(`소켓/부위 라인을 찾지 못했습니다: ${lines.join(' / ')}`)
  }

  const socketLine = lines[socketLineIndex]
  const socketMatch = socketLine.match(/^\[(\d+)\]\s*(.+)$/)
  const versionSet = new Set(version)
  const detailLines = lines
    .slice(socketLineIndex + 1)
    .filter((line) => !versionSet.has(line))

  const runeKo = detailLines.find((line) => line.includes('+') && !line.startsWith('(')) ?? ''
  const runeEn = detailLines.find((line) => /^\(.+\)$/.test(line)) ?? ''

  return {
    name: lines.slice(0, socketLineIndex).join(' '),
    socketCount: Number(socketMatch?.[1] ?? 0),
    equipmentType: socketMatch?.[2] ?? socketLine,
    runeCombination: [runeKo, runeEn].filter(Boolean),
    version,
  }
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  const html = await fetch(SOURCE_URL).then((response) => {
    if (!response.ok) {
      throw new Error(`원본 페이지 요청 실패: ${response.status}`)
    }

    return response.text()
  })

  const dataRows = tableRows(html).slice(1)
  const runewords = dataRows.map((row, index) => {
    const cells = rowCells(row)

    if (cells.length !== 3) {
      throw new Error(`${index + 1}번째 데이터 행의 셀 개수가 올바르지 않습니다.`)
    }

    const levelRequired = Number(cellLines(cells[0])[0])
    const combination = parseCombinationCell(cells[1])

    return {
      id: `${levelRequired}-${slug(combination.name)}-${slug(combination.equipmentType)}`,
      이름: combination.name,
      렙제: levelRequired,
      '소켓 수': combination.socketCount,
      '방어구 부위': combination.equipmentType,
      룬조합: combination.runeCombination,
      버전: combination.version,
      options: cellLines(cells[2]),
      sourceUrl: SOURCE_URL,
    }
  })

  await mkdir(dirname(OUTPUT_PATH), { recursive: true })
  await writeFile(OUTPUT_PATH, `${JSON.stringify(runewords, null, 2)}\n`, 'utf8')
  console.log(`Generated ${runewords.length} runewords -> ${OUTPUT_PATH}`)
}

await main()
