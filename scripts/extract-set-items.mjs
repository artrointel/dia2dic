import { writeFile } from 'node:fs/promises'

const SOURCE_URL = 'https://tradia.me/diablo2/set_items'
const OUTPUT_PATH = 'src/data/set-items.json'

const listHtml = await fetchText(SOURCE_URL)
const setLinks = extractSetLinks(listHtml)
const sets = []

for (const link of setLinks) {
  const html = await fetchText(link.url)
  sets.push(parseSetPage(html, link))
  await delay(700)
}

const data = {
  source: {
    title: '세트 아이템 사전 - 트레디아 디아블로2',
    url: SOURCE_URL,
  },
  sets,
}

await writeFile(`${process.cwd()}/${OUTPUT_PATH}`, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

async function fetchText(url) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'dia2dic-data-extractor/1.0',
      },
    })

    if (response.ok) {
      return response.text()
    }

    if (response.status !== 429 || attempt === 3) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`)
    }

    await delay(2500 * (attempt + 1))
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractSetLinks(html) {
  const links = [...html.matchAll(/<a href="(\/diablo2\/set_items\/\d+)" class="a pp-search-title">([\s\S]*?)<\/a>/gi)]
    .map((match) => ({
      url: new URL(match[1], SOURCE_URL).toString(),
      title: cleanCell(match[2]),
    }))
    .filter((link) => link.title && !link.title.startsWith('['))
  const seen = new Set()

  return links.filter((link) => {
    if (seen.has(link.url)) {
      return false
    }

    seen.add(link.url)
    return true
  })
}

function parseSetPage(html, link) {
  const documentHtml = html.match(/<div class="document_[^"]+ rhymix_content xe_content">([\s\S]*?)<!--AfterDocument/i)?.[1] ?? html
  const koreanName = cleanCell(matchFirst(documentHtml, /<h2[^>]*class="color-set"[^>]*>([\s\S]*?)<\/h2>/i))
  const englishName = cleanCell(matchFirst(documentHtml, /<h3[^>]*class="color-set"[^>]*>([\s\S]*?)<\/h3>/i))
  const rows = [...documentHtml.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((match) => match[0])
  const setBonusRow = rows.find((row) => !/<img\b/i.test(row))
  const itemRows = rows.filter((row) => /<img\b/i.test(row))

  return {
    id: link.url.split('/').at(-1),
    이름: koreanName || parseSetName(link.title).korean,
    영문명: englishName || parseSetName(link.title).english,
    url: link.url,
    items: itemRows.map(parseSetItemRow),
    세트효과: parseSetBonusRow(setBonusRow),
  }
}

function parseSetItemRow(rowHtml) {
  const itemName = cleanCell(matchFirst(rowHtml, /<h3[^>]*>[\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/i)).replace(/^#/, '')
  const options = parseOptionSpans(rowHtml, 'style-mod')
  const partialSetBonuses = parseOptionSpans(rowHtml, 'key-set_bonus')
  const defense = valueByClass(rowHtml, 'key-defense')
  const oneHandDamage = valueByClass(rowHtml, 'key-onehand_damage')
  const twoHandDamage = valueByClass(rowHtml, 'key-twohand_damage')
  const damage = valueByClass(rowHtml, 'key-damage')

  return {
    이름: itemName,
    영문명: cleanCell(matchFirst(rowHtml, /<span class="color-set en">([\s\S]*?)<\/span>/i)),
    베이스: cleanCell(matchFirst(rowHtml, /<a class="color-normal item"[\s\S]*?>([\s\S]*?)<\/a>/i)).replace(/^#/, ''),
    등급: valueByClass(rowHtml, 'key-tier') || null,
    방어력: parseRange(defense),
    피해: parseRange(oneHandDamage || twoHandDamage || damage),
    내구도: parseNullableNumber(valueByClass(rowHtml, 'key-durability')),
    요구레벨: parseNullableNumber(valueByClass(rowHtml, 'key-req_lvl')),
    필요힘: parseNullableNumber(valueByClass(rowHtml, 'key-req_str')),
    필요민첩: parseNullableNumber(valueByClass(rowHtml, 'key-req_dex')),
    막기확률: valueByClass(rowHtml, 'key-block') || null,
    강타피해: parseRange(valueByClass(rowHtml, 'key-smite_damage')),
    옵션: options,
    부분세트효과: partialSetBonuses,
  }
}

function parseSetBonusRow(rowHtml = '') {
  const spans = splitLines(rowHtml)
    .map((line) => ({
      className: line.match(/class="([^"]*)"/i)?.[1] ?? '',
      text: cleanCell(line),
    }))
    .filter((span) => span.className.includes('key-set_bonus') && span.text)

  return {
    부분: spans
      .filter((span) => span.className.includes('style-set') && !span.className.includes('style-set_full'))
      .map((span) => span.text),
    완성: spans
      .filter((span) => span.className.includes('style-set_full'))
      .filter((span) => span.text !== '완성 세트 효과:')
      .map((span) => span.text),
  }
}

function parseOptionSpans(rowHtml, classNamePart) {
  return splitLines(rowHtml)
    .filter((line) => line.includes(classNamePart))
    .map((line) => cleanCell(line))
    .filter(Boolean)
}

function splitLines(rowHtml) {
  return rowHtml
    .split(/<br\s*\/?>/gi)
    .map((line) => line.trim())
    .filter(Boolean)
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

function parseSetName(value) {
  const match = cleanCell(value).match(/^(.*?)\s*\((.*?)\)$/)

  return {
    korean: (match?.[1] ?? value).trim(),
    english: (match?.[2] ?? '').trim(),
  }
}

function matchFirst(value, pattern) {
  return value.match(pattern)?.[1] ?? ''
}

function cleanCell(value) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, '•')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
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
    const parsed = Number(singleMatch[1])

    return {
      최소: parsed,
      최대: parsed,
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
