import { writeFile } from 'node:fs/promises'

const SOURCE_URL = 'https://tradia.me/diablo2/item_craft'
const OUTPUT_PATH = 'src/data/craft-items.json'
const craftPages = [
  {
    id: 'hit-power',
    이름: '히트 파워',
    url: 'https://tradia.me/diablo2/item_craft/3188845',
  },
  {
    id: 'blood',
    이름: '블러드',
    url: 'https://tradia.me/diablo2/item_craft/3188853',
  },
  {
    id: 'caster',
    이름: '캐스터',
    url: 'https://tradia.me/diablo2/item_craft/3188857',
  },
  {
    id: 'safety',
    이름: '세이프티',
    url: 'https://tradia.me/diablo2/item_craft/3188860',
  },
]

const tipsHtml = await fetchText('https://tradia.me/diablo2/item_craft/4321326')
const data = {
  source: {
    title: '크래프트 - 트레디아 디아블로2',
    url: SOURCE_URL,
  },
  tips: extractTips(tipsHtml),
  categories: [],
}

for (const craftPage of craftPages) {
  const html = await fetchText(craftPage.url)
  data.categories.push(parseCraftPage(html, craftPage))
}

await writeFile(`${process.cwd()}/${OUTPUT_PATH}`, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'dia2dic-data-extractor/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  return response.text()
}

function extractTips(html) {
  const documentHtml = documentContent(html)
  const text = cleanCell(documentHtml)
  const tipPatterns = [
    /매직 아이템만 재료가 될 수 있다\./,
  ]

  const sourceTips = tipPatterns
    .map((pattern) => text.match(pattern)?.[0])
    .filter(Boolean)

  return [
    ...sourceTips,
    '결과 아이템 레벨은 캐릭터 레벨과 재료 아이템 레벨을 함께 따른다.',
    '랜덤 접두사/접미사 4개를 확정하려면 결과 아이템 레벨 71 이상을 노리는 편이 좋다.',
    '랜덤 옵션은 접두사와 접미사 합산이며, 한쪽은 최대 3개까지만 붙는다.',
    '재료 아이템과 주얼의 기존 옵션은 결과물에 계승되지 않는다.',
  ]
}

function parseCraftPage(html, craftPage) {
  const documentHtml = documentContent(html)
  const rows = [...documentHtml.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)]
    .map((match) => match[0])
    .slice(1)
  const recipes = rows.map(parseRecipeRow)
  const gemAndJewel = recipes.find((recipe) => recipe.보석주얼)?.보석주얼 ?? ''

  return {
    ...craftPage,
    recipes: recipes.map((recipe) => ({
      ...recipe,
      보석주얼: recipe.보석주얼 ?? gemAndJewel,
    })),
  }
}

function parseRecipeRow(rowHtml) {
  return {
    이름: cleanCell(matchFirst(rowHtml, /<h3>[\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/i)).replace(/^#/, ''),
    재료: extractBaseItems(rowHtml),
    룬: cleanCell(matchFirst(rowHtml, /<a\b[^>]*class="rune item"[^>]*>([\s\S]*?)<\/a>/i)).replace(/^#/, ''),
    보석주얼: extractGemAndJewel(rowHtml),
    고정옵션: extractFixedOptions(rowHtml),
    용도: extractUsage(rowHtml),
  }
}

function extractBaseItems(rowHtml) {
  const headerHtml = matchFirst(rowHtml, /<th\b[\s\S]*?>([\s\S]*?)<\/th>/i)

  return [...headerHtml.matchAll(/<a\b(?![^>]*class="[^"]*\bitem\b[^"]*style=)[^>]*class="[^"]*\bo item\b[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => cleanCell(match[1]).replace(/^#/, ''))
    .filter(Boolean)
}

function extractGemAndJewel(rowHtml) {
  const gemCell = matchFirst(rowHtml, /<td\b[^>]*rowspan="9"[\s\S]*?>([\s\S]*?)<\/td>/i)

  if (!gemCell) {
    return null
  }

  return cleanCell(gemCell).replace(/#/g, '')
}

function extractFixedOptions(rowHtml) {
  const optionHtml = matchFirst(rowHtml, /<div class="o">([\s\S]*?)<\/div>/i)

  return optionHtml
    .split(/<br\s*\/?>/gi)
    .map(cleanCell)
    .filter(Boolean)
}

function extractUsage(rowHtml) {
  const text = cleanCell(rowHtml)
  const usageMatch = text.match(/용도:\s*(.*?)(?:\s*우대:|$)/)
  const preferenceMatch = text.match(/우대:\s*(.*?)$/)

  return {
    용도: usageMatch?.[1]?.trim() || '',
    우대: preferenceMatch?.[1]?.trim() || '',
  }
}

function documentContent(html) {
  return html.match(/<div class="document_[^"]+ rhymix_content xe_content">([\s\S]*?)<!--AfterDocument/i)?.[1] ?? html
}

function matchFirst(value, pattern) {
  return value.match(pattern)?.[1] ?? ''
}

function cleanCell(value) {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
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
