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

applyUniqueMiscAdjustments(categoryMap)

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

function applyUniqueMiscAdjustments(categoryMap) {
  const miscCategory = categoryMap.get('기타')

  if (!miscCategory) {
    return
  }

  const remainingMiscItems = []
  const charmItems = []
  const jewelItems = []

  for (const item of miscCategory.items) {
    if (item.베이스.includes('부적') || item.분류.includes('부적')) {
      charmItems.push(item)
      continue
    }

    if (item.베이스 === '주얼' || item.분류 === '주얼') {
      jewelItems.push(enrichUniqueJewel(item))
      continue
    }

    remainingMiscItems.push(item)
  }

  for (const item of supplementalRainbowFacetItems()) {
    if (!jewelItems.some((candidate) => candidate.이름 === item.이름 && candidate.비고 === item.비고)) {
      jewelItems.push(item)
    }
  }

  for (const item of supplementalSunderCharmItems(charmItems)) {
    if (!charmItems.some((candidate) => candidate.이름 === item.이름)) {
      charmItems.push(item)
    }
  }

  categoryMap.set('차암', {
    id: '차암',
    title: '차암',
    url: miscCategory.url,
    items: charmItems.map((item, index) => withCategoryId(item, '차암', index)),
  })
  categoryMap.set('주얼', {
    id: '주얼',
    title: '주얼',
    url: miscCategory.url,
    items: jewelItems.map((item, index) => withCategoryId(item, '주얼', index)),
  })

  if (remainingMiscItems.length > 0) {
    miscCategory.items = remainingMiscItems.map((item, index) => withCategoryId(item, '기타', index))
  } else {
    categoryMap.delete('기타')
  }
}

function withCategoryId(item, categoryTitle, index) {
  return {
    ...item,
    id: uniqueItemId(categoryTitle, item.이름, index),
  }
}

function enrichUniqueJewel(item) {
  const override = ancientJewelOverrides[item.이름]

  if (!override) {
    return item
  }

  return {
    ...item,
    별칭: override.aliases ?? item.별칭,
    요구레벨: 75,
    기본속성: ['요구 레벨: 75'],
    옵션: override.options,
    비고: override.note ?? item.비고,
    이미지: override.image ?? item.이미지,
  }
}

const ancientJewelOverrides = {
  '수호자의 불': {
    aliases: ["Defender's Fire"],
    note: '탈릭: 수호자의 불 or 수호자의 역정',
    image: 'https://d2db.net/images/fragment_cold.webp',
    options: [
      '피격 시 1% 확률로 25 레벨 불길 시전',
      '화염 피해 20 - 60 추가',
      '화염 기술 피해 +5~10%',
      '적의 화염 저항 -5~10%',
      '경험치 획득량 +3~5%',
      '괴물에게서 얻는 금화 25~50% 증가',
      '마법 아이템 발견 확률 15~35% 증가',
    ],
  },
  '수호자의 역정': {
    aliases: ["Defender's Bile"],
    note: '탈릭: 수호자의 불 or 수호자의 역정',
    image: 'https://d2db.net/images/fragment_magic.webp',
    options: [
      '피격 시 1% 확률로 25 레벨 뼈 갑옷 시전',
      '독 피해 +95 (1초에 걸쳐)',
      '독 기술 피해 +5~10%',
      '적의 독 저항 -5~10%',
      '경험치 획득량 +3~5%',
      '괴물에게서 얻는 금화 25~50% 증가',
      '마법 아이템 발견 확률 15~35% 증가',
    ],
  },
  '보호자의 돌': {
    aliases: ["Protector's Stone"],
    note: '콜릭: 보호자의 돌 or 보호자의 서리',
    image: 'https://d2db.net/images/fragment_fire.webp',
    options: [
      '피격 시 1% 확률로 15 레벨 흐리기 시전',
      '피해 +30~50% 증가',
      '피해 10 - 30 추가',
      '적의 물리 피해 저항 -5~10%',
      '경험치 획득량 +3~5%',
      '괴물에게서 얻는 금화 25~50% 증가',
      '마법 아이템 발견 확률 15~35% 증가',
    ],
  },
  '보호자의 서리': {
    aliases: ["Protector's Frost"],
    note: '콜릭: 보호자의 돌 or 보호자의 서리',
    image: 'https://d2db.net/images/fragment_lightning.webp',
    options: [
      '피격 시 1% 확률로 25 레벨 얼어붙은 갑옷 시전',
      '냉기 피해 10 - 30 추가',
      '적의 냉기 저항 -5~10%',
      '냉기 기술 피해 +5~10%',
      '경험치 획득량 +3~5%',
      '괴물에게서 얻는 금화 25~50% 증가',
      '마법 아이템 발견 확률 15~35% 증가',
    ],
  },
  '감시자의 빛': {
    aliases: ["Guardian's Light"],
    note: '마도크: 감시자의 빛 or 감시자의 천둥',
    image: 'https://d2db.net/images/fragment_poison.webp',
    options: [
      '피격 시 1% 확률로 25 레벨 정신 결계 시전',
      '마법 피해 15 - 35 추가',
      '적의 마법 저항 -5~10%',
      '마법 기술 피해 +5~10%',
      '경험치 획득량 +3~5%',
      '괴물에게서 얻는 금화 25~50% 증가',
      '마법 아이템 발견 확률 15~35% 증가',
    ],
  },
  '감시자의 천둥': {
    aliases: ["Guardian's Thunder"],
    note: '마도크: 감시자의 빛 or 감시자의 천둥',
    image: 'https://d2db.net/images/fragment_physical.webp',
    options: [
      '피격 시 1% 확률로 25 레벨 회오리 갑옷 시전',
      '번개 피해 1 - 75 추가',
      '번개 기술 피해 +5~10%',
      '적의 번개 저항 -5~10%',
      '경험치 획득량 +3~5%',
      '괴물에게서 얻는 금화 25~50% 증가',
      '마법 아이템 발견 확률 15~35% 증가',
    ],
  },
}

function supplementalRainbowFacetItems() {
  const image = 'https://d2db.net/images/unique392.webp'
  const variants = [
    {
      label: '냉기',
      aliases: ['레인보우 패시트(냉기)', 'Rainbow Facet(Cold)'],
      trigger: '사망 시 100% 확률로 37 레벨 눈보라 시전 or 레벨 상승 시 100% 확률로 43 레벨 서릿발 시전',
      damage: '냉기 피해 24 - 38 추가',
      skill: '냉기 기술 피해 +3~5%',
      pierce: '적의 냉기 저항 -3~5%',
    },
    {
      label: '화염',
      aliases: ['레인보우 패시트(화염)', 'Rainbow Facet(Fire)'],
      trigger: '사망 시 100% 확률로 31 레벨 운석 낙하 시전 or 레벨 상승 시 100% 확률로 29 레벨 불길 시전',
      damage: '화염 피해 17 - 45 추가',
      skill: '화염 기술 피해 +3~5%',
      pierce: '적의 화염 저항 -3~5%',
    },
    {
      label: '번개',
      aliases: ['레인보우 패시트(번개)', 'Rainbow Facet(Lightning)'],
      trigger: '사망 시 100% 확률로 41 레벨 번개 파장 시전 or 레벨 상승 시 100% 확률로 47 레벨 연쇄 번개 시전',
      damage: '번개 피해 1 - 74 추가',
      skill: '번개 기술 피해 +3~5%',
      pierce: '적의 번개 저항 -3~5%',
    },
    {
      label: '독',
      aliases: ['레인보우 패시트(독)', 'Rainbow Facet(Poison)'],
      trigger: '사망 시 100% 확률로 51 레벨 맹독 확산 시전 or 레벨 상승 시 100% 확률로 23 레벨 맹독 시전',
      damage: '독 피해 +37 (2초에 걸쳐)',
      skill: '독 기술 피해 +3~5%',
      pierce: '적의 독 저항 -3~5%',
    },
  ]

  return variants.map((variant) => ({
    이름: '무지개 자락',
    별칭: variant.aliases,
    베이스: '주얼',
    분류: '주얼',
    등급: null,
    요구레벨: 49,
    필요힘: null,
    필요민첩: null,
    내구도: null,
    피해: null,
    방어력: null,
    막기확률: null,
    공격속도: null,
    기본속성: ['요구 레벨: 49'],
    옵션: [variant.trigger, variant.damage, variant.skill, variant.pierce],
    비고: `${variant.label} 변형`,
    태그: [],
    이미지: image,
    url: `${SOURCE_URL}#s-5.3.1`,
  }))
}

function supplementalSunderCharmItems(charmItems) {
  const entries = [
    {
      latentName: '잠복된 추위의 파열',
      renewedName: '새로워진 추위의 파열',
      aliases: ['Latent Cold Rupture', 'Renewed Cold Rupture'],
      originalName: '추위의 파열',
      immunity: '냉기',
      latentPenalty: '냉기 저항 -(70~90)%',
      renewedPenalty: '냉기 저항 -70%',
      offensiveOption: '냉기 기술 피해 +5~15% or 적의 냉기 저항 -5~10%',
    },
    {
      latentName: '잠복된 불길의 균열',
      renewedName: '새로워진 불길의 균열',
      aliases: ['Latent Flame Rift', 'Renewed Flame Rift'],
      originalName: '불길의 균열',
      immunity: '화염',
      latentPenalty: '화염 저항 -(70~90)%',
      renewedPenalty: '화염 저항 -70%',
      offensiveOption: '화염 기술 피해 +5~15% or 적의 화염 저항 -5~10%',
    },
    {
      latentName: '잠복된 천상의 틈',
      renewedName: '새로워진 천상의 틈',
      aliases: ['Latent Crack of the Heavens', 'Renewed Crack of the Heavens'],
      originalName: '천상의 틈',
      immunity: '번개',
      latentPenalty: '번개 저항 -(70~90)%',
      renewedPenalty: '번개 저항 -70%',
      offensiveOption: '번개 기술 피해 +5~15% or 적의 번개 저항 -5~10%',
    },
    {
      latentName: '잠복된 부패의 분열',
      renewedName: '새로워진 부패의 분열',
      aliases: ['Latent Rotting Fissure', 'Renewed Rotting Fissure'],
      originalName: '부패의 분열',
      immunity: '독',
      latentPenalty: '독 저항 -(70~90)%',
      renewedPenalty: '독 저항 -70%',
      offensiveOption: '독 기술 피해 +5~15% or 적의 독 저항 -5~10%',
    },
    {
      latentName: '잠복된 칠흑의 천공',
      renewedName: '새로워진 칠흑의 천공',
      aliases: ['Latent Black Cleft', 'Renewed Black Cleft'],
      originalName: '칠흑의 천공',
      immunity: '마법',
      latentPenalty: '마법 저항 -(45~65)%',
      renewedPenalty: '마법 저항 -45%',
      offensiveOption: '마법 기술 피해 +10~15% or 적의 마법 저항 -5~10%',
    },
    {
      latentName: '잠복된 뼈의 분쇄',
      renewedName: '새로워진 뼈의 분쇄',
      aliases: ['Latent Bone Break', 'Renewed Bone Break'],
      originalName: '뼈의 분쇄',
      immunity: '물리',
      latentPenalty: '받는 물리 피해 10~20% 증가',
      renewedPenalty: '받는 물리 피해 10% 증가',
      offensiveOption: '피해 +75~100% 증가 or 적의 물리 피해 저항 -5~10%',
    },
  ]

  return entries.flatMap((entry) => {
    const image = charmItems.find((item) => item.이름 === entry.originalName)?.이미지 ?? null

    return [latentSunderCharm(entry, image), renewedSunderCharm(entry, image)]
  })
}

function latentSunderCharm(entry, image) {
  return {
    이름: entry.latentName,
    별칭: [entry.aliases[0]],
    베이스: '거대 부적',
    분류: '파괴참',
    등급: null,
    요구레벨: 75,
    필요힘: null,
    필요민첩: null,
    내구도: null,
    피해: null,
    방어력: null,
    막기확률: null,
    공격속도: null,
    기본속성: ['요구 레벨: 75'],
    옵션: [`괴물의 ${entry.immunity} 면역이 파괴됨`, entry.latentPenalty, 'Herald 계열 몬스터 및 일반 드랍풀에서 획득 가능'],
    비고: '잠복된 파괴참',
    태그: [],
    이미지: image,
    url: 'https://news.blizzard.com/en-us/article/24261478/diablo-ii-resurrected-ladder-season-14-now-live',
  }
}

function renewedSunderCharm(entry, image) {
  return {
    이름: entry.renewedName,
    별칭: [entry.aliases[1]],
    베이스: '거대 부적',
    분류: '파괴참',
    등급: null,
    요구레벨: 75,
    필요힘: null,
    필요민첩: null,
    내구도: null,
    피해: null,
    방어력: null,
    막기확률: null,
    공격속도: null,
    기본속성: ['요구 레벨: 75'],
    옵션: [
      `괴물의 ${entry.immunity} 면역이 파괴됨`,
      entry.renewedPenalty,
      entry.offensiveOption,
      '마법 아이템 발견 확률 14~25% 증가 or 괴물에게서 얻는 금화 20~55% 증가',
      '생명력 +10~65 or 마나 +10~75',
      '달리기/걷기 속도 +5~10% or 타격 회복 속도 +12~24% or 모든 능력치 +3~8',
      '마법 피해 감소 5~10 or 피해 감소 5~10',
      '새로워진 파괴참은 각 옵션 묶음에서 하나씩 선택됨',
    ],
    비고: '새로워진 파괴참',
    태그: [],
    이미지: image,
    url: 'https://d2db.net/sundering-charms-guide',
  }
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
