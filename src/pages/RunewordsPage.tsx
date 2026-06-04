import { useMemo, useState } from 'react'
import { Gem, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FloatingTooltip } from '../components/FloatingTooltip'
import { ItemDataTable, type ItemDataTableColumn } from '../components/ItemDataTable'
import { OptionList } from '../components/OptionList'
import { PageHeading } from '../components/PageHeading'
import { RecommendationBadge, type RecommendationInfo } from '../components/RecommendationBadge'
import { RuneCombinationToken } from '../components/RuneMiniCard'
import { FilterPanel, NameSearch, SortControl, TableToolbar } from '../components/TableControls'
import { recommendedItemTips } from './NormalItemsPage'
import {
  armorBases,
  helmBases,
  runewords,
  shieldBases,
  shieldPaladinBases,
  weaponAmazonBases,
  weaponAxeBases,
  weaponBowBases,
  weaponClawBases,
  weaponCrossbowBases,
  weaponDaggerBases,
  weaponJavelinBases,
  weaponMaceBases,
  weaponOrbBases,
  weaponPolearmBases,
  weaponScepterBases,
  weaponSpearBases,
  weaponStaffBases,
  weaponSwordBases,
  weaponThrowingBases,
  weaponWandBases,
} from '../shared/gameData'
import { readPageSearchQuery } from '../shared/searchNavigation'
import { searchItemsByQuery } from '../shared/searchUtils'
import type { ArmorBases, FilterType, Runeword, RunewordFilter, SortType, WeaponBases } from '../shared/appTypes'

const EQUIPMENT_FILTER_GROUPS = [
  {
    label: '투구',
    items: ['투구(Helm)'],
  },
  {
    label: '갑옷',
    items: ['갑옷(Armor)'],
  },
  {
    label: '무기류',
    items: [
      '근접 무기(Melee Weapon)',
      '원거리 무기(Ranged Weapon)',
      '모든 무기(Weapon)',
      '도검(Sword)',
      '도끼(Axe)',
      '철퇴(Mace)',
      '망치(Hammer)',
      '단도(Dagger)',
      '미늘창(Polearm)',
      '창(Spear)',
      '활(Bow)',
      '쇠뇌(Crossbow)',
      '지팡이(Staff)',
      '완드(Wand)',
      '홀(Scepter)',
      '손톱(Claw)',
      '방패(Shield)',
    ],
  },
  {
    label: '클래스 전용 방패',
    items: [
      '팔라딘 전용 방패(Paladin Shield)',
      '네크 전용 방패(Necromancer Shield)',
      '악마술사 전용 방패(Demonologist Shield)',
    ],
  },
]

const runewordSortOptions: Array<{ value: SortType; label: string }> = [
  { value: 'level-asc', label: '레벨제한 오름차순' },
  { value: 'level-desc', label: '레벨제한 내림차순' },
  { value: 'socket-asc', label: '소켓수 오름차순' },
  { value: 'socket-desc', label: '소켓수 내림차순' },
]

const runewordMercenaryRecommendations: Record<string, RecommendationInfo> = {
  통찰: {
    tag: '용병',
    note: '명상 오라로 마나 유지가 쉬워 2막/1막 용병에게 자주 사용.',
  },
  치료: {
    tag: '용병',
    note: '정화 오라와 독 지속시간 감소로 용병 생존 보조에 유용.',
  },
  순종: {
    tag: '용병',
    note: '높은 피해, 강타, 저항 보너스로 2막 용병 무기 후보.',
  },
  배신: {
    tag: '용병',
    note: '공속과 흐리기 발동으로 저렴한 용병 갑옷으로 인기가 높음.',
  },
  인내: {
    tag: '용병',
    note: '피해 증가와 높은 방어력으로 용병 최종 갑옷 후보.',
  },
  무한: {
    tag: '용병',
    note: '선고 오라로 원소 빌드 화력을 크게 올리는 대표 용병 무기.',
  },
  긍지: {
    tag: '용병',
    note: '집중 오라로 물리 소환/물리 딜러 보조용 용병 무기.',
  },
  안개: {
    tag: '용병',
    note: '집중 오라와 관통/피해 옵션으로 1막 용병 활 후보.',
  },
  신념: {
    tag: '용병',
    note: '광신 오라로 본체 공격 속도와 물리 화력을 보조하는 1막 용병 활.',
  },
  조화: {
    tag: '용병',
    note: '원기 오라로 이동 편의성을 챙기는 1막 용병 활 후보.',
  },
  연기: {
    tag: '용병',
    note: '높은 모든 저항으로 초중반 용병 생존 갑옷으로 사용.',
  },
}

function getRunewordEquipment(item: Runeword) {
  return item.장비 ?? item['방어구 부위'] ?? ''
}

function splitEquipmentTypes(equipment: string) {
  return equipment
    .split(/[/,]/)
    .map((part) => part.replace(/\*/g, '').trim())
    .filter(Boolean)
}

function groupEquipmentTypes(equipmentTypes: string[]) {
  const availableTypes = new Set(equipmentTypes)
  const groupedTypes = new Set<string>()
  const groups = EQUIPMENT_FILTER_GROUPS.map((group) => {
    const items = group.items.filter((item) => availableTypes.has(item))
    items.forEach((item) => groupedTypes.add(item))

    return { ...group, items }
  }).filter((group) => group.items.length > 0)
  const etcItems = equipmentTypes.filter((item) => !groupedTypes.has(item))

  return etcItems.length > 0 ? [...groups, { label: '기타', items: etcItems }] : groups
}


function createFilter(next: Partial<RunewordFilter> = {}): RunewordFilter {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    enabled: true,
    type: 'socket',
    socketMin: '',
    socketMax: '',
    equipmentType: '',
    text: '',
    ...next,
  }
}

export function RunewordsPage() {
  const [searchParams] = useSearchParams()
  const incomingSearchQuery = readPageSearchQuery(searchParams)
  const initialSearchState = useMemo(() => resolveRunewordSearchState(incomingSearchQuery), [incomingSearchQuery])
  const lastAppliedSearchQuery = useRef(incomingSearchQuery)
  const [filters, setFilters] = useState<RunewordFilter[]>(initialSearchState.filters)
  const [nameQuery, setNameQuery] = useState(initialSearchState.nameQuery)
  const [sortType, setSortType] = useState<SortType>('level-asc')
  const equipmentTypes = useMemo(
    () =>
      [
        ...new Set(
          runewords.flatMap((item) => splitEquipmentTypes(getRunewordEquipment(item))),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [],
  )
  const equipmentGroups = useMemo(() => groupEquipmentTypes(equipmentTypes), [equipmentTypes])

  useEffect(() => {
    if (incomingSearchQuery === lastAppliedSearchQuery.current) {
      return
    }

    const nextSearchState = resolveRunewordSearchState(incomingSearchQuery)
    lastAppliedSearchQuery.current = incomingSearchQuery
    setNameQuery(nextSearchState.nameQuery)
    setFilters(nextSearchState.filters)
  }, [incomingSearchQuery])

  const updateFilter = (id: number, next: Partial<RunewordFilter>) => {
    setFilters((current) =>
      current.map((filter) => (filter.id === id ? { ...filter, ...next } : filter)),
    )
  }

  const removeFilter = (id: number) => {
    setFilters((current) => current.filter((filter) => filter.id !== id))
  }

  const filteredRunewords = useMemo(() => {
    const activeFilters = filters.filter((filter) => filter.enabled)
    let rows = searchItemsByQuery(runewords, nameQuery, (item) => item.이름)

    activeFilters.forEach((filter) => {
      if (filter.type === 'socket') {
        if (!filter.socketMin && !filter.socketMax) {
          return
        }

        const min = Number(filter.socketMin || filter.socketMax)
        const max = Number(filter.socketMax || filter.socketMin)

        rows = rows.filter((item) => item['소켓 수'] >= min && item['소켓 수'] <= max)
        return
      }

      if (filter.type === 'equipment') {
        rows = filter.equipmentType
          ? rows.filter((item) => splitEquipmentTypes(getRunewordEquipment(item)).includes(filter.equipmentType))
          : rows
        return
      }

      if (filter.type === 'rune') {
        rows = searchItemsByQuery(rows, filter.text, (item) => item.룬조합.join(' '))
        return
      }

      if (filter.type === 'ladder') {
        rows = rows.filter((item) => item.버전.some((version) => version.replace(/\s+/g, '').includes('래더전용')))
        return
      }

      rows = searchItemsByQuery(rows, filter.text, (item) => item.options.join(' '))
    })

    return rows
      .toSorted((left, right) => {
        if (sortType === 'level-desc') {
          return right.렙제 - left.렙제
        }

        if (sortType === 'socket-asc') {
          return left['소켓 수'] - right['소켓 수'] || left.렙제 - right.렙제
        }

        if (sortType === 'socket-desc') {
          return right['소켓 수'] - left['소켓 수'] || left.렙제 - right.렙제
        }

        return left.렙제 - right.렙제
      })
  }, [filters, nameQuery, sortType])
  const columns: ItemDataTableColumn<Runeword>[] = [
    {
      key: 'name',
      header: '이름',
      className: 'runeword-name-cell',
      render: (item) => <RunewordNameCell item={item} />,
    },
    {
      key: 'level',
      header: '렙제',
      className: 'runeword-col-level',
      render: (item) => item.렙제,
    },
    {
      key: 'equipment',
      header: '장비',
      className: 'runeword-col-equipment',
      render: (item) => <EquipmentLines equipment={getRunewordEquipment(item)} />,
    },
    {
      key: 'sockets',
      header: '소켓',
      className: 'runeword-col-sockets',
      render: (item) => item['소켓 수'],
    },
    {
      key: 'runes',
      header: '룬조합',
      className: 'runeword-col-runes',
      render: (item) =>
        item.룬조합.map((line) => (
          <RuneCombinationLine line={line} key={line} />
        )),
    },
    {
      key: 'options',
      header: '옵션',
      className: 'runeword-col-options',
      render: (item) => <OptionList items={item.options} />,
    },
  ]

  return (
    <section className="runewords-page">
      <PageHeading
        description="렙제, 소켓 수, 장비 부위, 룬 조합, 버전, 옵션을 필터링하고 정렬합니다."
        eyebrow="호라드릭 함"
        icon={Gem}
        title="룬워드 조합"
      />

      <TableToolbar sort={<SortControl options={runewordSortOptions} value={sortType} onChange={setSortType} />}>
        <FilterPanel
          actions={
            <button className="add-filter-button" type="button" onClick={() => setFilters((current) => [...current, createFilter()])}>
              <Plus aria-hidden="true" size={18} />
              필터 추가
            </button>
          }
        >
          {filters.length > 0 ? (
            <div className="filter-list">
              {filters.map((filter) => (
                <RunewordFilterRow
                  key={filter.id}
                  equipmentGroups={equipmentGroups}
                  filter={filter}
                  onRemove={() => removeFilter(filter.id)}
                  onUpdate={(next) => updateFilter(filter.id, next)}
                />
              ))}
            </div>
          ) : (
            <p className="filter-empty">필터를 추가하면 조건을 AND로 조합해 검색할 수 있습니다.</p>
          )}
        </FilterPanel>
      </TableToolbar>

      <NameSearch
        label="이름 검색"
        placeholder="예: 수수께끼, Spirit, 스피릿"
        value={nameQuery}
        onChange={setNameQuery}
      />
      <ItemDataTable
        columns={columns}
        emptyMessage="룬워드 데이터가 없습니다."
        getRowKey={(item) => item.id}
        header={{ meta: `총 ${runewords.length}개 중 ${filteredRunewords.length}개 표시` }}
        items={filteredRunewords}
        pageSize={7}
        widthMode="content"
      />
    </section>
  )
}

function resolveRunewordSearchState(query: string): {
  filters: RunewordFilter[]
  nameQuery: string
} {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return { filters: [], nameQuery: '' }
  }

  if (searchItemsByQuery(runewords, trimmedQuery, (item) => item.이름).length > 0) {
    return { filters: [], nameQuery: trimmedQuery }
  }

  if (searchItemsByQuery(runewords, trimmedQuery, (item) => item.룬조합.join(' ')).length > 0) {
    return { filters: [createFilter({ type: 'rune', text: trimmedQuery })], nameQuery: '' }
  }

  const matchingEquipmentType = [
    ...new Set(runewords.flatMap((item) => splitEquipmentTypes(getRunewordEquipment(item)))),
  ].find((equipmentType) => searchItemsByQuery([equipmentType], trimmedQuery, (item) => item).length > 0)

  if (matchingEquipmentType) {
    return {
      filters: [createFilter({ type: 'equipment', equipmentType: matchingEquipmentType })],
      nameQuery: '',
    }
  }

  if (searchItemsByQuery(runewords, trimmedQuery, (item) => item.options.join(' ')).length > 0) {
    return { filters: [createFilter({ type: 'option', text: trimmedQuery })], nameQuery: '' }
  }

  return { filters: [], nameQuery: trimmedQuery }
}

function RunewordNameCell({ item }: { item: Runeword }) {
  const materialRecommendations = getRunewordMaterialRecommendations(item)
  const mercenaryRecommendation = runewordMercenaryRecommendations[runewordLookupName(item.이름)]

  return (
    <span className="normal-item-name-cell runeword-name-with-tags">
      <span className={['runeword-name', item.버전.length > 0 ? 'has-version' : ''].filter(Boolean).join(' ')}>
        <FormattedRunewordName name={item.이름} />
      </span>

      {item.버전.length > 0 ? (
        <FloatingTooltip
          cardClassName="version-popup"
          content={<RunewordVersionPopup versions={item.버전} />}
          triggerClassName="runeword-version-trigger"
        >
          <span className="runeword-version-marker">*</span>
        </FloatingTooltip>
      ) : null}

      {materialRecommendations.length > 0 ? (
        <RunewordMaterialBadge bases={materialRecommendations} title={runewordLookupName(item.이름)} />
      ) : null}

      {mercenaryRecommendation ? (
        <RecommendationBadge info={mercenaryRecommendation} title={runewordLookupName(item.이름)} />
      ) : null}
    </span>
  )
}

type RunewordMaterialRecommendation = {
  defenseMax: number | null
  equipmentTypes: string[]
  grade: string
  maxSockets: number | null
  name: string
  note: string
  recommended: boolean
}

function RunewordMaterialBadge({ bases, title }: { bases: RunewordMaterialRecommendation[]; title: string }) {
  return (
    <FloatingTooltip
      cardClassName="recommend-tip-card runeword-material-tip-card"
      content={<RunewordMaterialTip bases={bases} title={title} />}
      triggerClassName="recommend-tip-trigger"
    >
      <span className="normal-item-recommend is-material">재료</span>
    </FloatingTooltip>
  )
}

function RunewordMaterialTip({ bases, title }: { bases: RunewordMaterialRecommendation[]; title: string }) {
  return (
    <>
      <strong>{title} 추천 재료</strong>
      {bases.map((base) => (
        <span key={base.name}>
          <b>{base.name}</b>
          {base.note}
        </span>
      ))}
    </>
  )
}

function createRunewordMaterialRecommendations() {
  const materialMap = new Map<string, RunewordMaterialRecommendation[]>()
  const baseMetadataByName = createRecommendedBaseMetadataByName()

  Object.entries(recommendedItemTips).forEach(([baseName, tip]) => {
    const metadata = baseMetadataByName.get(baseName)

    if (!metadata) {
      return
    }

    tip.runewords.forEach((runewordName) => {
      const key = canonicalRunewordLookupName(runewordName)
      const currentBases = materialMap.get(key) ?? []

      currentBases.push({
        defenseMax: metadata.defenseMax,
        equipmentTypes: metadata.equipmentTypes,
        grade: metadata.grade,
        maxSockets: metadata.maxSockets,
        name: baseName,
        note: tip.note,
        recommended: true,
      })
      materialMap.set(key, currentBases)
    })
  })

  return materialMap
}

function getRunewordMaterialRecommendations(item: Runeword) {
  if (runewordLookupName(item.이름) === '잎새') {
    return getLeafMaterialRecommendations()
  }

  const curatedRecommendations = runewordMaterialRecommendations.get(runewordLookupName(item.이름)) ?? []
  const equipmentTypes = splitEquipmentTypes(getRunewordEquipment(item))
  const socketCount = item['소켓 수']
  const compatibleBases = allRunewordBaseMetadata.filter(
    (base) =>
      base.maxSockets !== null &&
      base.maxSockets >= socketCount &&
      equipmentTypes.some((equipmentType) => materialEquipmentMatches(equipmentType, base.equipmentTypes)),
  )
  const contextFilteredBases = filterBasesByRunewordContext(item, compatibleBases)
  const curatedNames = new Set(curatedRecommendations.map((recommendation) => recommendation.name))
  const curatedBases = contextFilteredBases.filter((base) => curatedNames.has(base.name))
  const fallbackBases = contextFilteredBases.filter((base) => base.recommended)
  const selectedBases = curatedBases.length > 0 ? curatedBases : fallbackBases.length > 0 ? fallbackBases : contextFilteredBases

  return selectedBases
    .toSorted(sortRunewordMaterialBases)
    .slice(0, 8)
    .map((base) => ({
      ...base,
      note: curatedRecommendations.find((recommendation) => recommendation.name === base.name)?.note ?? materialBaseNote(item, base),
    }))
}

function getLeafMaterialRecommendations(): RunewordMaterialRecommendation[] {
  return weaponStaffBases.sections
    .filter((section) => section.grade === '노멀')
    .flatMap((section) =>
      section.items
        .filter((base) => (base.최대홈 ?? 0) >= 2)
        .map((base) => ({
          defenseMax: null,
          equipmentTypes: ['지팡이(Staff)', '근접 무기(Melee Weapon)', '모든 무기(Weapon)'],
          grade: section.grade,
          maxSockets: base.최대홈 ?? null,
          name: base.이름,
          note: '2홈이면 충분. 화염구, 온기, 마법부여 등 목적 기술 +3 조합을 우대.',
          recommended: false,
        })),
    )
}

type RecommendedBaseMetadata = {
  defenseMax: number | null
  equipmentTypes: string[]
  grade: string
  maxSockets: number | null
  name: string
  note: string
  recommended: boolean
}

function createRecommendedBaseMetadataByName() {
  return new Map(allRunewordBaseMetadata.map((base) => [base.name, base]))
}

function createAllRunewordBaseMetadata() {
  const bases: RecommendedBaseMetadata[] = []

  addArmorBaseMetadata(bases, armorBases, ['갑옷(Armor)'])
  addArmorBaseMetadata(bases, helmBases, ['투구(Helm)'])
  addArmorBaseMetadata(bases, shieldBases, ['방패(Shield)'])
  addArmorBaseMetadata(bases, shieldPaladinBases, ['팔라딘 전용 방패(Paladin Shield)', '방패(Shield)'])

  weaponMetadataSources.forEach(({ data, equipmentTypes }) => {
    data.sections.forEach((section) => {
      section.items.forEach((item) => {
        bases.push({
          defenseMax: null,
          equipmentTypes,
          grade: section.grade,
          maxSockets: item.최대홈 ?? null,
          name: item.이름,
          note: '',
          recommended: item.추천,
        })
      })
    })
  })

  return bases
}

function addArmorBaseMetadata(bases: RecommendedBaseMetadata[], data: ArmorBases, equipmentTypes: string[]) {
  data.sections.forEach((section) => {
    section.items.forEach((item) => {
      bases.push({
        defenseMax: item.방어력.최대,
        equipmentTypes,
        grade: section.grade,
        maxSockets: item.최대홈 ?? null,
        name: item.이름,
        note: '',
        recommended: item.추천,
      })
    })
  })
}

const weaponMetadataSources: Array<{ data: WeaponBases; equipmentTypes: string[] }> = [
  { data: weaponDaggerBases, equipmentTypes: ['단도(Dagger)', '근접 무기(Melee Weapon)', '모든 무기(Weapon)'] },
  { data: weaponSwordBases, equipmentTypes: ['도검(Sword)', '근접 무기(Melee Weapon)', '모든 무기(Weapon)'] },
  { data: weaponAxeBases, equipmentTypes: ['도끼(Axe)', '근접 무기(Melee Weapon)', '모든 무기(Weapon)'] },
  { data: weaponMaceBases, equipmentTypes: ['철퇴(Mace)', '근접 무기(Melee Weapon)', '모든 무기(Weapon)'] },
  { data: weaponScepterBases, equipmentTypes: ['홀(Scepter)', '근접 무기(Melee Weapon)', '모든 무기(Weapon)'] },
  { data: weaponPolearmBases, equipmentTypes: ['미늘창(Polearm)', '근접 무기(Melee Weapon)', '모든 무기(Weapon)'] },
  { data: weaponSpearBases, equipmentTypes: ['창(Spear)', '근접 무기(Melee Weapon)', '모든 무기(Weapon)'] },
  { data: weaponStaffBases, equipmentTypes: ['지팡이(Staff)', '근접 무기(Melee Weapon)', '모든 무기(Weapon)'] },
  { data: weaponWandBases, equipmentTypes: ['완드(Wand)', '근접 무기(Melee Weapon)', '모든 무기(Weapon)'] },
  { data: weaponClawBases, equipmentTypes: ['손톱(Claw)', '근접 무기(Melee Weapon)', '모든 무기(Weapon)'] },
  { data: weaponOrbBases, equipmentTypes: ['오브(Orb)', '근접 무기(Melee Weapon)', '모든 무기(Weapon)'] },
  { data: weaponBowBases, equipmentTypes: ['활(Bow)', '원거리 무기(Ranged Weapon)', '모든 무기(Weapon)'] },
  { data: weaponCrossbowBases, equipmentTypes: ['쇠뇌(Crossbow)', '원거리 무기(Ranged Weapon)', '모든 무기(Weapon)'] },
  { data: weaponJavelinBases, equipmentTypes: ['투창(Javelin)', '원거리 무기(Ranged Weapon)', '모든 무기(Weapon)'] },
  { data: weaponThrowingBases, equipmentTypes: ['투척 무기(Throwing Weapon)', '원거리 무기(Ranged Weapon)', '모든 무기(Weapon)'] },
  { data: weaponAmazonBases, equipmentTypes: ['아마존 전용 무기(Amazon Weapon)', '모든 무기(Weapon)'] },
]

const allRunewordBaseMetadata = createAllRunewordBaseMetadata()

const runeRankByName = new Map(
  [
    '엘',
    '엘드',
    '티르',
    '네프',
    '에드',
    '아이드',
    '탈',
    '랄',
    '오르트',
    '주울',
    '앰',
    '솔',
    '샤엘',
    '돌',
    '헬',
    '이오',
    '포',
    '룸',
    '코',
    '팔',
    '렘',
    '풀',
    '우움',
    '말',
    '이스트',
    '굴',
    '벡스',
    '오움',
    '로',
    '수르',
    '베르',
    '자',
    '참',
    '조드',
  ].map((name, index) => [name, index + 1]),
)
const highRuneThreshold = runeRankByName.get('렘') ?? 20

function filterBasesByRunewordContext(item: Runeword, bases: RecommendedBaseMetadata[]) {
  let filteredBases = bases
  const lookupName = runewordLookupName(item.이름)
  const shouldPreferElite = isHighRuneRuneword(item) && lookupName !== '수수께끼'

  if (shouldPreferElite) {
    const eliteBases = filteredBases.filter((base) => base.grade === '엘리트')

    if (eliteBases.length > 0) {
      filteredBases = eliteBases
    }
  }

  if (isArmorRuneword(item) && hasDefenseIncreaseOption(item) && lookupName !== '수수께끼') {
    const defensiveBases = filteredBases.filter((base) => (base.defenseMax ?? 0) >= 400)

    if (defensiveBases.length > 0) {
      filteredBases = defensiveBases
    }
  }

  return filteredBases
}

function isHighRuneRuneword(item: Runeword) {
  return item.룬조합
    .filter((line) => !line.trim().startsWith('('))
    .flatMap((line) => line.split('+'))
    .map((rune) => rune.replace(/룬/g, '').trim())
    .some((rune) => (runeRankByName.get(rune) ?? 0) >= highRuneThreshold)
}

function isArmorRuneword(item: Runeword) {
  return splitEquipmentTypes(getRunewordEquipment(item)).includes('갑옷(Armor)')
}

function hasDefenseIncreaseOption(item: Runeword) {
  return item.options.some((option) => option.includes('방어력') && option.includes('증가'))
}

function sortRunewordMaterialBases(left: RecommendedBaseMetadata, right: RecommendedBaseMetadata) {
  return (
    Number(right.recommended) - Number(left.recommended) ||
    gradeSortValue(right.grade) - gradeSortValue(left.grade) ||
    (right.defenseMax ?? 0) - (left.defenseMax ?? 0) ||
    left.name.localeCompare(right.name)
  )
}

function gradeSortValue(grade: string) {
  if (grade === '엘리트') {
    return 3
  }

  if (grade === '익셉셔널') {
    return 2
  }

  return 1
}

function materialBaseNote(item: Runeword, base: RecommendedBaseMetadata) {
  if (isArmorRuneword(item) && hasDefenseIncreaseOption(item) && base.defenseMax !== null) {
    return `방어력 증가 옵션을 살리기 좋은 ${base.grade} 베이스.`
  }

  if (isHighRuneRuneword(item) && runewordLookupName(item.이름) !== '수수께끼') {
    return `렘 이상 룬워드라 ${base.grade} 베이스 우선.`
  }

  if (base.recommended) {
    return '추천 태그가 붙은 호환 베이스.'
  }

  return `${base.grade} 호환 베이스.`
}

function materialEquipmentMatches(runewordEquipmentType: string, baseEquipmentTypes: string[]) {
  if (baseEquipmentTypes.includes(runewordEquipmentType)) {
    return true
  }

  if (runewordEquipmentType.includes('방패(')) {
    return baseEquipmentTypes.some((equipmentType) => equipmentType.includes('방패('))
  }

  if (runewordEquipmentType === '망치(Hammer)') {
    return baseEquipmentTypes.includes('철퇴(Mace)')
  }

  if (runewordEquipmentType === '모든 무기(Weapon)') {
    return baseEquipmentTypes.includes('모든 무기(Weapon)')
  }

  if (runewordEquipmentType === '근접 무기(Melee Weapon)') {
    return baseEquipmentTypes.includes('근접 무기(Melee Weapon)')
  }

  if (runewordEquipmentType === '원거리 무기(Ranged Weapon)') {
    return baseEquipmentTypes.includes('원거리 무기(Ranged Weapon)')
  }

  return false
}

const runewordMaterialRecommendations = createRunewordMaterialRecommendations()

function canonicalRunewordLookupName(name: string) {
  const lookupName = runewordLookupName(name)
  const matchedRuneword = runewords.find((runeword) => runewordAllLookupNames(runeword.이름).includes(lookupName))

  return matchedRuneword ? runewordLookupName(matchedRuneword.이름) : lookupName
}

function runewordAllLookupNames(name: string) {
  const parsedName = parseRunewordName(name)

  return [...new Set([parsedName.primary, ...parsedName.aliases].map((value) => value.replace(/\s+/g, '')))]
}

function runewordLookupName(name: string) {
  return parseRunewordName(name).primary.replace(/\s+/g, '')
}

function EquipmentLines({ equipment }: { equipment: string }) {
  const parsedParts = splitEquipmentTypes(equipment).map((part) => parseEquipmentLabel(part))
  const primaryLine = parsedParts.map((part) => part.primary).join('/')
  const englishLine = parsedParts
    .map((part) => part.english)
    .filter(Boolean)
    .join('/')

  return (
    <span className="equipment-lines">
      <span className="equipment-primary">{primaryLine}</span>
      {englishLine && <span className="equipment-english">({englishLine})</span>}
    </span>
  )
}

function RunewordVersionPopup({ versions }: { versions: string[] }) {
  return (
    <>
      {versions.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </>
  )
}

function parseEquipmentLabel(label: string) {
  const match = label.trim().match(/^(.*?)\s*\(([^)]+)\)$/)

  if (!match) {
    return {
      primary: label.trim(),
      english: '',
    }
  }

  return {
    primary: match[1].trim(),
    english: match[2].trim(),
  }
}

function parseRunewordName(name: string) {
  const normalizedName = name.replace(/\s+/g, ' ').trim()
  const bracketMatch = normalizedName.match(/^(.*?)\s*(?:\[|\()([^\])]+)(?:\]|\))\s*$/)
  const malformedMatch = normalizedName.match(/^(.+?)([A-Za-z][A-Za-z\s']+(?:,\s*구:\s*.+)?)\]\s*$/)
  const primarySource = (bracketMatch?.[1] ?? malformedMatch?.[1] ?? normalizedName).trim()
  const content = (bracketMatch?.[2] ?? malformedMatch?.[2] ?? '').trim()
  const [primary, ...inlineAliases] = primarySource
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
  const contentParts = content
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const english = contentParts.find((part) => !part.startsWith('구:')) ?? ''
  const aliases = [
    ...inlineAliases,
    ...contentParts
      .filter((part) => part.startsWith('구:'))
      .flatMap((part) => part.replace(/^구:\s*/, '').split('/'))
      .map((part) => part.trim())
      .filter(Boolean),
  ]

  return {
    primary: primary || normalizedName,
    english,
    aliases,
  }
}

function FormattedRunewordName({ name }: { name: string }) {
  const parsedName = parseRunewordName(name)

  return (
    <span className="formatted-runeword-name">
      <span>{parsedName.primary}</span>
      {parsedName.english && <span>{parsedName.english}</span>}
      {parsedName.aliases.map((alias) => (
        <span key={alias}>({alias})</span>
      ))}
    </span>
  )
}

function RuneCombinationLine({ line }: { line: string }) {
  const shouldSplit = line.includes('+') && !line.startsWith('(')

  if (!shouldSplit) {
    return <span className="table-line">{line}</span>
  }

  const parts = line.split('+')

  return (
    <span className="table-line rune-combination-line">
      <span className="rune-combination-row">
        <RuneCombinationParts parts={parts} />
      </span>
    </span>
  )
}

function RuneCombinationParts({
  parts,
  trailingPlus = false,
}: {
  parts: string[]
  trailingPlus?: boolean
}) {
  return parts.flatMap((part, index) => {
    const shouldRenderPlus = index < parts.length - 1 || trailingPlus

    return [
      <RuneCombinationToken name={part} key={`${part}-${index}`} />,
      shouldRenderPlus ? <span className="rune-plus" key={`${part}-${index}-plus`}>+</span> : null,
    ]
  })
}

function RunewordFilterRow({
  equipmentGroups,
  filter,
  onRemove,
  onUpdate,
}: {
  equipmentGroups: { label: string; items: string[] }[]
  filter: RunewordFilter
  onRemove: () => void
  onUpdate: (next: Partial<RunewordFilter>) => void
}) {
  const updateSocket = (key: 'socketMin' | 'socketMax', value: string) => {
    const otherKey = key === 'socketMin' ? 'socketMax' : 'socketMin'
    const next: Partial<RunewordFilter> = { [key]: value }

    if (!filter[otherKey]) {
      next[otherKey] = value
    }

    onUpdate(next)
  }

  return (
    <div className={`filter-row ${filter.enabled ? '' : 'is-disabled'}`}>
      <input
        aria-label="필터 활성화"
        checked={filter.enabled}
        type="checkbox"
        onChange={(event) => onUpdate({ enabled: event.target.checked })}
      />

      <select value={filter.type} onChange={(event) => onUpdate({ type: event.target.value as FilterType })}>
        <option value="socket">소켓 수</option>
        <option value="equipment">장비 부위</option>
        <option value="rune">룬</option>
        <option value="option">옵션</option>
        <option value="ladder">래더전용</option>
      </select>

      <div className="filter-config">
        {filter.type === 'socket' && (
          <div className="range-filter">
            <label>
              MIN
              <input
                min="1"
                max="6"
                type="number"
                value={filter.socketMin}
                onChange={(event) => updateSocket('socketMin', event.target.value)}
              />
            </label>
            <label>
              MAX
              <input
                min="1"
                max="6"
                type="number"
                value={filter.socketMax}
                onChange={(event) => updateSocket('socketMax', event.target.value)}
              />
            </label>
          </div>
        )}

        {filter.type === 'equipment' && (
          <select value={filter.equipmentType} onChange={(event) => onUpdate({ equipmentType: event.target.value })}>
            <option value="">장비 부위 선택</option>
            {equipmentGroups.map((group) => (
              <optgroup label={`--- ${group.label} ---`} key={group.label}>
                {group.items.map((equipmentType) => (
                  <option value={equipmentType} key={equipmentType}>
                    {equipmentType}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}

        {filter.type === 'rune' && (
          <input
            type="search"
            placeholder="예: 조드, Jah, 탈"
            value={filter.text}
            onChange={(event) => onUpdate({ text: event.target.value })}
          />
        )}

        {filter.type === 'option' && (
          <input
            type="search"
            placeholder="예: 공격 속도, 모든 기술"
            value={filter.text}
            onChange={(event) => onUpdate({ text: event.target.value })}
          />
        )}

        {filter.type === 'ladder' && (
          <span className="fixed-filter-label">래더 전용 룬워드만 표시</span>
        )}
      </div>

      <button className="delete-filter-button" type="button" aria-label="필터 제거" onClick={onRemove}>
        <Trash2 aria-hidden="true" size={18} />
      </button>
    </div>
  )
}






