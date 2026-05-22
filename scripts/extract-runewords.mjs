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

const EQUIPMENT_NORMALIZERS = [
  { pattern: /^(?:도검|도검\(소드\))$/, value: '도검(Sword)' },
  { pattern: /^(?:단도|단검|대거|대거\(단검\))$/, value: '단도(Dagger)' },
  { pattern: /^(?:망치|해머)$/, value: '망치(Hammer)' },
  { pattern: /^(?:메이스\*?|철퇴|철퇴\(메이스\))$/, value: '철퇴(Mace)' },
  { pattern: /^도끼$/, value: '도끼(Axe)' },
  { pattern: /^(?:미늘창|미늘창\(폴암\))$/, value: '미늘창(Polearm)' },
  { pattern: /^(?:창|창\(스피어\))$/, value: '창(Spear)' },
  { pattern: /^활$/, value: '활(Bow)' },
  { pattern: /^쇠뇌$/, value: '쇠뇌(Crossbow)' },
  { pattern: /^(?:지팡이|지팡이\(스테프\))$/, value: '지팡이(Staff)' },
  { pattern: /^완드$/, value: '완드(Wand)' },
  { pattern: /^(?:홀|홀\(셉터\))$/, value: '홀(Scepter)' },
  { pattern: /^(?:손톱|손톱\(클러\))$/, value: '손톱(Claw)' },
  { pattern: /^투구$/, value: '투구(Helm)' },
  { pattern: /^갑옷$/, value: '갑옷(Armor)' },
  { pattern: /^방패$/, value: '방패(Shield)' },
  { pattern: /^무기$/, value: '무기(Weapon)' },
  { pattern: /^근접 무기$/, value: '근접 무기(Melee Weapon)' },
  { pattern: /^원거리 무기$/, value: '원거리 무기(Ranged Weapon)' },
  { pattern: /^팔라딘 방패$/, value: '팔라딘 방패(Paladin Shield)' },
  { pattern: /^네크 전용 방패$/, value: '네크 전용 방패(Necromancer Shield)' },
  { pattern: /^팔라$/, value: '팔라딘 전용 장비(Paladin Item)' },
  { pattern: /^악마술사$/, value: '악마술사 전용 장비(Demonologist Item)' },
]

function normalizeEquipmentPart(part) {
  const normalizedPart = part.replace(/\*/g, '').trim()
  const normalizer = EQUIPMENT_NORMALIZERS.find(({ pattern }) => pattern.test(normalizedPart))

  return normalizer?.value ?? normalizedPart
}

function normalizeEquipment(equipment) {
  return unique(
    equipment
      .split(/[/,]/)
      .map(normalizeEquipmentPart)
      .filter(Boolean),
  ).join('/')
}

function normalizeVersion(name, version) {
  if (name === '경계(Vigilance)' && !version.includes('래더 전용')) {
    return [...version, '래더 전용']
  }

  return version
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
      id: `${levelRequired}-${slug(combination.name)}-${slug(normalizeEquipment(combination.equipmentType))}`,
      이름: combination.name,
      렙제: levelRequired,
      '소켓 수': combination.socketCount,
      장비: normalizeEquipment(combination.equipmentType),
      룬조합: combination.runeCombination,
      버전: normalizeVersion(combination.name, combination.version),
      options: cellLines(cells[2]),
      sourceUrl: SOURCE_URL,
    }
  })

  await mkdir(dirname(OUTPUT_PATH), { recursive: true })
  await writeFile(OUTPUT_PATH, `${JSON.stringify(runewords, null, 2)}\n`, 'utf8')
  console.log(`Generated ${runewords.length} runewords -> ${OUTPUT_PATH}`)
}

await main()
