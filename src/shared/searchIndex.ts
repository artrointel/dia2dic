import {
  armorBases,
  beltBases,
  bootBases,
  craftItems,
  equipmentUpgrades,
  gloveBases,
  helmBases,
  miscRecipes,
  runeUpgrades,
  runewords,
  setItems,
  shieldBases,
  shieldPaladinBases,
  socketRecipes,
  uniqueItems,
  weaponBowBases,
  weaponPolearmBases,
  weaponSpearBases,
} from './gameData'
import type { ArmorBases, WeaponBases } from './appTypes'
import { matchesSearchText } from './searchUtils'

export type SearchPageCandidate = {
  count: number
  description: string
  examples: string[]
  path: string
  title: string
}

type SearchDocument = {
  label: string
  text: string
}

type SearchPageIndex = {
  description: string
  documents: SearchDocument[]
  path: string
  title: string
}

const MAX_EXAMPLES = 5

const pageIndexes: SearchPageIndex[] = [
  {
    path: '/cube/runewords',
    title: '룬워드 조합',
    description: '룬워드 이름, 룬 조합, 장비 타입, 옵션에서 검색합니다.',
    documents: runewords.map((item) => ({
      label: item.이름,
      text: [item.이름, item.장비, item['방어구 부위'], item.룬조합.join(' '), item.options.join(' '), item.버전.join(' ')].join(' '),
    })),
  },
  {
    path: '/items/runes',
    title: '룬',
    description: '룬 이름, 영문명, 번호, 조합 방법, 효과에서 검색합니다.',
    documents: runeUpgrades.map((rune) => ({
      label: `${rune.한글명} (${rune.영문명})`,
      text: [rune.번호, rune.한글명, rune.영문명, rune.제한레벨, rune.조합방법, rune.무기.join(' '), rune.방어구.join(' ')].join(' '),
    })),
  },
  {
    path: '/cube/crafting',
    title: '크래프트 조합',
    description: '크래프트 종류, 재료, 룬, 보석/주얼, 고정 옵션에서 검색합니다.',
    documents: craftItems.categories.flatMap((category) => [
      {
        label: category.이름,
        text: [category.id, category.이름, craftItems.tips.join(' ')].join(' '),
      },
      ...category.recipes.map((recipe) => ({
        label: `${category.이름} - ${recipe.이름}`,
        text: [
          category.id,
          category.이름,
          recipe.이름,
          recipe.재료.join(' '),
          recipe.룬,
          recipe.보석주얼,
          recipe.고정옵션.join(' '),
          recipe.용도.용도,
          recipe.용도.우대,
        ].join(' '),
      })),
    ]),
  },
  {
    path: '/cube/equipment-upgrades',
    title: '장비 업글',
    description: '업그레이드 분류, 대상, 등급 변화, 재료에서 검색합니다.',
    documents: equipmentUpgrades.map((recipe) => ({
      label: `${recipe.분류} - ${recipe.현재등급} → ${recipe.결과등급}`,
      text: [recipe.분류, recipe.대상, recipe.현재등급, recipe.결과등급, recipe.재료.join(' '), recipe.결과].join(' '),
    })),
  },
  {
    path: '/cube/socket-recipes',
    title: '소켓 뚫기',
    description: '소켓 대상, 재료, 결과에서 검색합니다.',
    documents: socketRecipes.map((recipe) => ({
      label: `${recipe.대상} 소켓`,
      text: [recipe.대상, recipe.재료.join(' '), recipe.결과].join(' '),
    })),
  },
  {
    path: '/cube/recipes',
    title: '기타 조합',
    description: '파괴참 갱신 등 기타 호라드릭 함 조합식에서 검색합니다.',
    documents: miscRecipes.map((recipe) => ({
      label: `${recipe.분류} - ${recipe.결과}`,
      text: [recipe.분류, recipe.대상, recipe.현재, recipe.결과, recipe.재료.join(' ')].join(' '),
    })),
  },
  {
    path: '/items/normal',
    title: '일반',
    description: '일반 베이스 아이템 이름, 영문명, 등급, 타입에서 검색합니다.',
    documents: normalItemDocuments(),
  },
  {
    path: '/items/sets',
    title: '세트',
    description: '세트명, 세트 아이템, 베이스, 옵션, 세트 효과에서 검색합니다.',
    documents: setItems.sets.flatMap((set) => [
      {
        label: `${set.이름} (${set.영문명})`,
        text: [set.이름, set.영문명, set.세트효과.부분.join(' '), set.세트효과.완성.join(' ')].join(' '),
      },
      ...set.items.map((item) => ({
        label: `${set.이름} - ${item.이름}`,
        text: [
          set.이름,
          set.영문명,
          item.이름,
          item.영문명,
          item.베이스,
          item.등급,
          item.옵션.join(' '),
          item.부분세트효과.join(' '),
        ].join(' '),
      })),
    ]),
  },
  {
    path: '/items/uniques',
    title: '유니크',
    description: '유니크 아이템 이름, 별칭, 베이스, 요구치, 옵션에서 검색합니다.',
    documents: uniqueItems.categories.flatMap((category) =>
      category.items.map((item) => ({
        label: `${item.이름}${item.별칭.length > 0 ? ` (${item.별칭.join(', ')})` : ''}`,
        text: [
          category.title,
          item.이름,
          item.별칭.join(' '),
          item.베이스,
          item.분류,
          item.등급 ?? '',
          item.기본속성.join(' '),
          item.옵션.join(' '),
          item.비고 ?? '',
        ].join(' '),
      })),
    ),
  },
]

export function searchPageCandidates(query: string): SearchPageCandidate[] {
  if (!query.trim()) {
    return []
  }

  return pageIndexes.flatMap((page) => {
    const matches = page.documents.filter((document) => matchesSearchText(document.text, query))

    if (matches.length === 0) {
      return []
    }

    return {
      count: matches.length,
      description: page.description,
      examples: [...new Set(matches.map((match) => match.label))].slice(0, MAX_EXAMPLES),
      path: page.path,
      title: page.title,
    }
  })
}

function normalItemDocuments(): SearchDocument[] {
  return [
    ...armorDocuments(helmBases),
    ...armorDocuments(armorBases),
    ...armorDocuments(gloveBases),
    ...armorDocuments(beltBases),
    ...armorDocuments(bootBases),
    ...armorDocuments(shieldBases),
    ...armorDocuments(shieldPaladinBases),
    ...weaponDocuments(weaponPolearmBases),
    ...weaponDocuments(weaponBowBases),
    ...weaponDocuments(weaponSpearBases),
  ]
}

function armorDocuments(data: ArmorBases): SearchDocument[] {
  return data.sections.flatMap((section) =>
    section.items.map((item) => ({
      label: item.이름,
      text: [data.category, section.title, section.grade, item.이름, item.영문명, item.무게, item.전용].join(' '),
    })),
  )
}

function weaponDocuments(data: WeaponBases): SearchDocument[] {
  return data.sections.flatMap((section) =>
    section.items.map((item) => ({
      label: item.이름,
      text: [data.category, data.type, section.title, section.grade, item.이름, item.전용].join(' '),
    })),
  )
}
