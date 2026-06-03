import { writeFile } from 'node:fs/promises'

const SOURCE_URL = 'https://namu.wiki/w/%EB%94%94%EC%95%84%EB%B8%94%EB%A1%9C%202/%EA%B3%A0%EC%9C%A0%20%EC%95%84%EC%9D%B4%ED%85%9C'
const OUTPUT_PATH = 'src/data/unique-items.json'
const PAGE_DELAY_MS = 900

const rootHtml = await fetchText(SOURCE_URL)
const categoryLinks = extractCategoryLinks(rootHtml)
const categoryMap = new Map()
const pages = [
  {
    title: '기타',
    url: SOURCE_URL,
  },
  ...categoryLinks,
]

for (const page of pages) {
  const html = page.url === SOURCE_URL ? rootHtml : await fetchText(page.url)
  const items = parseUniqueItemPage(html, page)

  items.forEach((item) => addCategoryItem(categoryMap, resolveOutputCategoryTitle(page, item), page.url, item))

  if (page.url !== SOURCE_URL) {
    await delay(PAGE_DELAY_MS)
  }
}

const categories = [...categoryMap.values()]

const data = {
  source: {
    title: '디아블로 2/고유 아이템 - 나무위키',
    url: SOURCE_URL,
  },
  categories,
}

await writeFile(`${process.cwd()}/${OUTPUT_PATH}`, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

console.log(`Wrote ${categories.reduce((sum, category) => sum + category.items.length, 0)} unique items to ${OUTPUT_PATH}`)

async function fetchText(url) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'dia2dic-data-extractor/1.0 Mozilla/5.0',
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

function addCategoryItem(categoryMap, title, url, item) {
  if (!categoryMap.has(title)) {
    categoryMap.set(title, {
      id: slugify(title),
      title,
      url,
      items: [],
    })
  }

  categoryMap.get(title).items.push(item)
}

function resolveOutputCategoryTitle(page, item) {
  if (page.title === '철퇴' && /홀|셉터/.test(item.분류)) {
    return '홀'
  }

  return page.title
}

function extractCategoryLinks(html) {
  const anchors = [...html.matchAll(/<a\b[\s\S]*?<\/a>/gi)]
    .map((match) => {
      const anchorHtml = match[0]
      const href = anchorHtml.match(/href=(['"])(.*?)\1/i)?.[2] ?? ''
      const title = cleanText(anchorHtml)

      return {
        title,
        url: href ? new URL(href, SOURCE_URL).toString() : '',
      }
    })
    .filter((link) => link.url && link.title)

  const seen = new Set()

  return anchors
    .filter((link) => {
      const decodedPath = decodeURIComponent(new URL(link.url).pathname)

      return decodedPath.startsWith('/w/디아블로 2/고유 아이템/') && !link.url.includes('#')
    })
    .filter((link) => {
      const decodedPath = decodeURIComponent(new URL(link.url).pathname)
      const isLeafWeaponPage = decodedPath.startsWith('/w/디아블로 2/고유 아이템/무기/')
      const isDirectItemPage = /^\/w\/디아블로 2\/고유 아이템\/(투구|갑옷|방패|장갑|허리띠|신발|장신구)$/.test(decodedPath)

      return isLeafWeaponPage || isDirectItemPage
    })
    .filter((link) => {
      const key = new URL(link.url).pathname

      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
}

function parseUniqueItemPage(html, page) {
  const tokens = extractContentTokens(html)
  const items = []
  const context = {
    h2: '',
    h3: '',
    h4: '',
  }

  for (const token of tokens) {
    if (token.type === 'heading') {
      context[`h${token.level}`] = token.title

      if (token.level <= 3) {
        context.h4 = ''
      }

      if (token.level <= 2) {
        context.h3 = ''
      }

      continue
    }

    const parsedItems = parseUniqueItemTable(token.html, {
      ...context,
      pageTitle: page.title,
      pageUrl: page.url,
      sectionId: token.sectionId,
    })

    parsedItems.forEach((item) => {
      items.push({
        ...item,
        id: uniqueItemId(page.title, item.이름, items.length),
      })
    })
  }

  return items
}

function extractContentTokens(html) {
  const matches = [
    ...[...html.matchAll(/<h([234])\b[\s\S]*?<\/h\1>/gi)].map((match) => ({
      index: match.index ?? 0,
      type: 'heading',
      level: Number(match[1]),
      html: match[0],
      title: cleanHeading(match[0]),
    })),
    ...[...html.matchAll(/<table\b[\s\S]*?<\/table>/gi)].map((match) => ({
      index: match.index ?? 0,
      type: 'table',
      html: match[0],
    })),
  ].sort((left, right) => left.index - right.index)

  let currentSectionId = ''

  return matches.map((match) => {
    if (match.type === 'heading') {
      currentSectionId = match.html.match(/<a id='([^']+)'/i)?.[1] ?? currentSectionId
    }

    return {
      ...match,
      sectionId: currentSectionId,
    }
  })
}

function parseUniqueItemTable(tableHtml, context) {
  const specialJewelItems = parseAncientJewelTable(tableHtml, context)

  if (specialJewelItems.length > 0) {
    return specialJewelItems
  }

  if (!isUniqueItemTable(tableHtml) || isUnavailableSection(context)) {
    return []
  }

  const cells = [...tableHtml.matchAll(/<t[dh]\b[\s\S]*?<\/t[dh]>/gi)].map((match) => match[0])
  const noteCell = cells.length > 1 ? cleanText(cells[0]) : ''
  const detailCells = cells.filter((cellHtml) => isUniqueItemDetailCell(cellHtml))
  const imageUrl = extractImageUrl(tableHtml)

  return detailCells
    .map((detailCell) => parseUniqueItemDetailCell(detailCell, context, noteCell, imageUrl))
    .filter((item) => item !== null)
}

function parseUniqueItemDetailCell(detailCell, context, noteCell, imageUrl) {
  const lines = splitCellLines(detailCell)

  if (lines.length < 3) {
    return null
  }

  if (isLegacyItemLines(lines)) {
    return null
  }

  const name = stripHeadingDecorations(lines[0])
  const base = stripHeadingDecorations(lines[1])

  if (!name || isNavigationText(name) || isNavigationText(base)) {
    return null
  }

  const headingInfo = parseItemHeading(context.h4 || context.h3 || name)
  const stats = []
  const options = []

  lines.slice(2).forEach((line) => {
    const normalizedLine = normalizeOptionText(line)

    if (!normalizedLine || normalizedLine === name || normalizedLine === base) {
      return
    }

    if (isStatLine(normalizedLine)) {
      stats.push(normalizedLine)
    } else {
      options.push(normalizedLine)
    }
  })

  return {
    이름: name,
    별칭: headingInfo.aliases,
    베이스: base,
    분류: resolveItemGroup(context),
    등급: resolveGradeFromContext(context),
    요구레벨: parseNumberValue(stats, /(?:요구|필요) 레벨:\s*(\d+)/),
    필요힘: parseNumberValue(stats, /필요 힘:\s*(\d+)/),
    필요민첩: parseNumberValue(stats, /필요 민첩:\s*(\d+)/),
    내구도: parseNumberValue(stats, /내구도:\s*(\d+)/),
    피해: parseFirstValue(stats, /(?:한손|양손|투척|발차기|강타|손톱) 피해:\s*(.+)/),
    방어력: parseFirstValue(stats, /방어력:\s*(.+)/),
    막기확률: parseFirstValue(stats, /막기 확률:\s*(.+)/),
    공격속도: parseFirstValue(stats, /공격 속도:\s*(.+)/),
    기본속성: stats,
    옵션: options,
    비고: noteCell || null,
    태그: headingInfo.tags,
    이미지: imageUrl,
    url: `${context.pageUrl}${context.sectionId ? `#${context.sectionId}` : ''}`,
  }
}

function parseAncientJewelTable(tableHtml, context) {
  if (!/border:\s*2px solid #c7b377/i.test(tableHtml) || !cleanText(tableHtml).includes('고대인 주얼')) {
    return []
  }

  const rows = [...tableHtml.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((match) => match[0])

  return rows.slice(1).flatMap((rowHtml) => {
    const cells = [...rowHtml.matchAll(/<t[dh]\b[\s\S]*?<\/t[dh]>/gi)].map((match) => match[0])
    const guardian = cleanText(cells[0] ?? '')
    const jewelCell = cells[1] ?? ''
    const names = [...jewelCell.matchAll(/<strong\b[\s\S]*?<\/strong>/gi)]
      .map((match) => cleanText(match[0]))
      .filter(Boolean)
    const images = [...jewelCell.matchAll(/\bdata-src=(['"])(.*?)\1/gi)].map((match) =>
      match[2].startsWith('//') ? `https:${match[2]}` : match[2],
    )

    return names.map((name, index) => ({
      이름: name,
      별칭: [],
      베이스: '주얼',
      분류: context.h3 || '주얼',
      등급: null,
      요구레벨: null,
      필요힘: null,
      필요민첩: null,
      내구도: null,
      피해: null,
      방어력: null,
      막기확률: null,
      공격속도: null,
      기본속성: [],
      옵션: [],
      비고: guardian || null,
      태그: [],
      이미지: images[index] ?? null,
      url: `${context.pageUrl}${context.sectionId ? `#${context.sectionId}` : ''}`,
    }))
  })
}

function isUniqueItemTable(tableHtml) {
  if (!/border:\s*2px solid #8e7745/i.test(tableHtml)) {
    return false
  }

  const text = cleanText(tableHtml)

  return !isNavigationText(text) && !text.includes('디아블로 2 고유 아이템')
}

function isUniqueItemDetailCell(cellHtml) {
  const lines = splitCellLines(cellHtml)

  return lines.length >= 3 && lines.some(isStatLine)
}

function isUnavailableSection(context) {
  return /미사용|삭제|더 이상|드랍되지|사용되지/.test([context.h2, context.h3, context.h4].join(' '))
}

function isLegacyItemLines(lines) {
  return lines.some((line) => /1\.09\s*이전|구버전|구 버전|레거시|미사용|삭제|더 이상|드랍되지|사용되지/.test(line))
}

function splitCellLines(cellHtml) {
  return cellHtml
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .split(/<br\b[^>]*>/gi)
    .map(cleanText)
    .map((line) => line.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean)
}

function cleanHeading(headingHtml) {
  return cleanText(headingHtml)
    .replace(/^\d+(?:\.\d+)*\.\s*/, '')
    .replace(/\s*\[편집\]$/, '')
    .trim()
}

function cleanText(value) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function stripHeadingDecorations(value) {
  return value.replace(/[🔰🔁🎓😈👑]+/g, '').trim()
}

function parseItemHeading(value) {
  const cleaned = stripHeadingDecorations(value)
  const aliases = []

  cleaned.replace(/\(([^)]+)\)/g, (_, aliasText) => {
    aliases.push(...aliasText.split('/').map((alias) => alias.trim()).filter(Boolean))
    return ''
  })

  return {
    aliases: [...new Set(aliases)],
    tags: [...new Set([...value.matchAll(/[🔰🔁🎓😈👑]/gu)].map((match) => match[0]))],
  }
}

function resolveItemGroup(context) {
  if (context.pageTitle === '기타') {
    return context.h3 || context.h2 || context.pageTitle
  }

  return context.h2 && !context.h2.includes('개요') ? context.h2 : context.pageTitle
}

function resolveGrade(value) {
  if (/일반|노멀/.test(value)) {
    return '노멀'
  }

  if (/특급|익셉셔널/.test(value)) {
    return '익셉셔널'
  }

  if (/정예|엘리트/.test(value)) {
    return '엘리트'
  }

  return null
}

function resolveGradeFromContext(context) {
  return resolveGrade(context.h3) ?? resolveGrade(context.h2)
}

function isStatLine(value) {
  return /^(?:한손|양손|투척|발차기|강타|손톱) 피해:|^방어력:|^내구도:|^필요 |^요구 |^공격 속도:|^수량:|^막기 확률:/u.test(value)
}

function normalizeOptionText(value) {
  return value.replace(/\s+([~\-–—])\s+/g, '$1').trim()
}

function parseNumberValue(values, pattern) {
  const rawValue = parseFirstValue(values, pattern)

  return rawValue ? Number(rawValue) : null
}

function parseFirstValue(values, pattern) {
  const match = values.map((value) => value.match(pattern)?.[1]?.trim()).find(Boolean)

  return match ?? null
}

function extractImageUrl(tableHtml) {
  const src = tableHtml.match(/\bdata-src=(['"])(.*?)\1/i)?.[2] ?? tableHtml.match(/\bsrc=(['"])(.*?)\1/i)?.[2] ?? ''

  if (!src || src.startsWith('data:')) {
    return null
  }

  return src.startsWith('//') ? `https:${src}` : src
}

function isNavigationText(value) {
  return /디아블로 2 아이템|품질별|성질별|고유 아이템 무기/.test(value)
}

function uniqueItemId(categoryTitle, name, index) {
  return `${slugify(categoryTitle)}-${slugify(name) || 'item'}-${index + 1}`
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}
