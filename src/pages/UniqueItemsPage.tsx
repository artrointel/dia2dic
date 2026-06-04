import { useEffect, useMemo, useRef, useState } from 'react'
import { PackageSearch } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { FloatingTooltip } from '../components/FloatingTooltip'
import { ItemDataTable, type ItemDataTableColumn } from '../components/ItemDataTable'
import { OptionList } from '../components/OptionList'
import { PageHeading } from '../components/PageHeading'
import { FilterPanel, NameSearch, SegmentedFilter, SortControl, TableToolbar } from '../components/TableControls'
import { uniqueItems } from '../shared/gameData'
import { readPageSearchQuery } from '../shared/searchNavigation'
import { matchesSearchText } from '../shared/searchUtils'
import type {
  UniqueItem,
  UniqueItemCategoryFilter,
  UniqueItemGradeFilter,
  UniqueItemSortType,
} from '../shared/appTypes'

const uniqueCategoryFilters: UniqueItemCategoryFilter[] = ['전체', '무기', '방어구', '장신구', '차암', '주얼', '기타']
const uniqueGradeFilters: UniqueItemGradeFilter[] = ['전체', '노멀', '익셉셔널', '엘리트']
const weaponCategoryTitles = ['단도', '도검', '도끼', '미늘창', '손톱', '쇠뇌', '지팡이', '창', '철퇴', '홀', '투창', '활']
const armorCategoryTitles = ['투구', '갑옷', '방패', '장갑', '허리띠', '신발']
const uniqueSortOptions: Array<{ value: UniqueItemSortType; label: string }> = [
  { value: 'level-asc', label: '레벨제한 오름차순' },
  { value: 'level-desc', label: '레벨제한 내림차순' },
  { value: 'name-asc', label: '이름순' },
]

const uniqueRows = uniqueItems.categories.flatMap((category) =>
  category.items.map((item) => ({
    ...item,
    카테고리: category.title,
  })),
)

type UniqueItemRow = UniqueItem & {
  카테고리: string
}

export function UniqueItemsPage() {
  const [searchParams] = useSearchParams()
  const incomingSearchQuery = readPageSearchQuery(searchParams)
  const initialSearchState = useMemo(() => resolveUniqueSearchState(incomingSearchQuery), [incomingSearchQuery])
  const lastAppliedSearchQuery = useRef(incomingSearchQuery)
  const [selectedCategory, setSelectedCategory] = useState<UniqueItemCategoryFilter>(initialSearchState.category)
  const [selectedWeaponCategory, setSelectedWeaponCategory] = useState(initialSearchState.weaponCategory)
  const [selectedArmorCategory, setSelectedArmorCategory] = useState(initialSearchState.armorCategory)
  const [selectedGrade, setSelectedGrade] = useState<UniqueItemGradeFilter>('전체')
  const [nameQuery, setNameQuery] = useState(initialSearchState.nameQuery)
  const [sortType, setSortType] = useState<UniqueItemSortType>('level-asc')

  const filteredItems = useMemo(() => {
    const activeQuery = nameQuery.trim()

    return uniqueRows
      .filter((item) => categoryMatches(item, selectedCategory, selectedWeaponCategory, selectedArmorCategory))
      .filter((item) => selectedGrade === '전체' || item.등급 === selectedGrade)
      .filter((item) => (activeQuery ? matchesSearchText(uniqueItemSearchText(item), activeQuery) : true))
      .toSorted((left, right) => sortUniqueItems(left, right, sortType))
  }, [nameQuery, selectedArmorCategory, selectedCategory, selectedGrade, selectedWeaponCategory, sortType])

  useEffect(() => {
    if (incomingSearchQuery === lastAppliedSearchQuery.current) {
      return
    }

    const nextSearchState = resolveUniqueSearchState(incomingSearchQuery)
    lastAppliedSearchQuery.current = incomingSearchQuery
    setSelectedCategory(nextSearchState.category)
    setSelectedWeaponCategory(nextSearchState.weaponCategory)
    setSelectedArmorCategory(nextSearchState.armorCategory)
    setNameQuery(nextSearchState.nameQuery)
  }, [incomingSearchQuery])

  return (
    <section className="normal-items-page unique-items-page">
      <PageHeading
        description="유니크 아이템의 베이스, 요구치, 주요 옵션을 필터링하고 정렬합니다."
        eyebrow="아이템 정보"
        icon={PackageSearch}
        title="유니크"
      />

      <TableToolbar sort={<SortControl options={uniqueSortOptions} value={sortType} onChange={setSortType} />}>
        <FilterPanel>
          <SegmentedFilter
            items={uniqueCategoryFilters}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {selectedCategory === '무기' && (
            <div className="normal-grade-filter">
              <span>무기 계열</span>
              <div>
                {weaponCategoryTitles.map((category) => (
                  <button
                    className={category === selectedWeaponCategory ? 'is-active' : ''}
                    key={category}
                    onClick={() => setSelectedWeaponCategory(category)}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedCategory === '방어구' && (
            <div className="normal-grade-filter">
              <span>방어구 부위</span>
              <div>
                {armorCategoryTitles.map((category) => (
                  <button
                    className={category === selectedArmorCategory ? 'is-active' : ''}
                    key={category}
                    onClick={() => setSelectedArmorCategory(category)}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="normal-grade-filter">
            <span>등급</span>
            <div>
              {uniqueGradeFilters.map((grade) => (
                <button
                  className={grade === selectedGrade ? 'is-active' : ''}
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  type="button"
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>
        </FilterPanel>
      </TableToolbar>

      <NameSearch
        label="검색"
        placeholder="예: 샤코, 마라, 요르단, 시전 속도"
        value={nameQuery}
        onChange={setNameQuery}
      />

      <UniqueItemsTable
        items={filteredItems}
        headerMeta={`총 ${uniqueRows.length}개 중 ${filteredItems.length}개 표시`}
      />
    </section>
  )
}

function UniqueItemsTable({ items, headerMeta }: { items: UniqueItemRow[]; headerMeta: string }) {
  const columns: ItemDataTableColumn<UniqueItemRow>[] = [
    {
      key: 'name',
      header: '이름',
      className: 'normal-item-col-name unique-item-col-name',
      render: (item) => <UniqueItemName item={item} />,
    },
    {
      key: 'base',
      header: '베이스/분류',
      className: 'set-item-col-base unique-item-col-base',
      render: (item) => (
        <span className="set-item-base-grade">
          <span>{item.베이스}</span>
          <span>{item.분류}</span>
        </span>
      ),
    },
    {
      key: 'primary',
      header: '기본',
      className: 'unique-item-col-primary',
      render: (item) => <UniquePrimaryStats item={item} />,
    },
    {
      key: 'options',
      header: '옵션',
      className: 'set-item-col-options unique-item-col-options',
      render: (item) => <OptionList items={item.옵션.length > 0 ? item.옵션 : ['정보 없음']} />,
    },
    {
      key: 'requirements',
      header: '요구치',
      className: 'set-item-col-requirements',
      render: (item) => <UniqueRequirements item={item} />,
    },
  ]

  return (
    <ItemDataTable
      columns={columns}
      emptyMessage="유니크 아이템 데이터가 없습니다."
      fillColumnKey="options"
      getRowKey={(item) => item.id}
      header={{ meta: headerMeta }}
      items={items}
      pageSize={7}
      widthMode="content"
    />
  )
}

function UniqueRequirements({ item }: { item: UniqueItemRow }) {
  const values = [
    item.요구레벨 ? `레벨 ${item.요구레벨}` : '',
    item.필요힘 ? `힘 ${item.필요힘}` : '',
    item.필요민첩 ? `민첩 ${item.필요민첩}` : '',
  ].filter(Boolean)

  return values.length > 0 ? (
    <span className="set-item-requirements">
      {values.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </span>
  ) : (
    <span className="muted-text">-</span>
  )
}

function UniqueItemName({ item }: { item: UniqueItemRow }) {
  return (
    <FloatingTooltip
      cardClassName="unique-item-tooltip-card"
      content={<UniqueItemTooltipCard item={item} />}
      triggerClassName="unique-item-tooltip-trigger"
    >
      <span className="normal-item-name-cell unique-item-name-cell">
        {item.이미지 ? <img src={item.이미지} alt="" loading="lazy" /> : null}
        <span className="formatted-runeword-name unique-item-name">
          <span className="runeword-name">{item.이름}</span>
          {item.별칭.map((alias) => (
            <span key={alias}>({alias})</span>
          ))}
        </span>
      </span>
    </FloatingTooltip>
  )
}

function UniqueItemTooltipCard({ item }: { item: UniqueItemRow }) {
  return (
    <>
      <span className={['unique-tooltip-identity', item.이미지 ? '' : 'is-text-only'].filter(Boolean).join(' ')}>
        {item.이미지 ? <img src={item.이미지} alt="" aria-hidden="true" /> : null}
        <span className="unique-tooltip-title">
          <strong>{item.이름}</strong>
          {item.별칭.map((alias) => (
            <span key={alias}>({alias})</span>
          ))}
        </span>

        <span className="unique-tooltip-base">
          <b>{item.베이스}</b>
          <span>{item.분류}</span>
        </span>

        <UniqueTooltipSection values={uniqueRequirementLines(item)} />
        <UniqueTooltipSection values={uniquePrimaryLines(item)} />
      </span>

      <UniqueTooltipSection className="unique-tooltip-options" values={item.옵션} />
    </>
  )
}

function UniqueTooltipSection({ className = '', values }: { className?: string; values: string[] }) {
  if (values.length === 0) {
    return null
  }

  return (
    <span className={['unique-tooltip-section', className].filter(Boolean).join(' ')}>
      {values.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </span>
  )
}

function UniquePrimaryStats({ item }: { item: UniqueItemRow }) {
  const values = uniquePrimaryLines(item)

  return values.length > 0 ? (
    <span className="unique-primary-stats">
      {values.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </span>
  ) : (
    <span className="muted-text">-</span>
  )
}

function uniqueRequirementLines(item: UniqueItemRow) {
  return [
    item.요구레벨 ? `요구 레벨: ${item.요구레벨}` : '',
    item.필요힘 ? `필요 힘: ${item.필요힘}` : '',
    item.필요민첩 ? `필요 민첩: ${item.필요민첩}` : '',
  ].filter(Boolean)
}

function uniquePrimaryLines(item: UniqueItemRow) {
  return [
    item.피해 ? `피해 ${item.피해}` : '',
    item.방어력 ? `방어 ${item.방어력}` : '',
    item.막기확률 ? `막기 ${item.막기확률}` : '',
    item.공격속도 ? `공속 ${item.공격속도}` : '',
    item.내구도 ? `내구 ${item.내구도}` : '',
  ].filter(Boolean)
}

function resolveUniqueSearchState(query: string): {
  armorCategory: string
  category: UniqueItemCategoryFilter
  nameQuery: string
  weaponCategory: string
} {
  const trimmedQuery = query.trim()
  const defaultState = {
    armorCategory: armorCategoryTitles[0],
    category: '전체' as UniqueItemCategoryFilter,
    nameQuery: trimmedQuery,
    weaponCategory: weaponCategoryTitles[0],
  }

  if (!trimmedQuery) {
    return defaultState
  }

  const matchingItem = uniqueRows.find((item) => matchesSearchText(uniqueItemSearchText(item), trimmedQuery))

  if (!matchingItem) {
    return defaultState
  }

  if (weaponCategoryTitles.includes(matchingItem.카테고리)) {
    return {
      ...defaultState,
      category: '무기',
      weaponCategory: matchingItem.카테고리,
    }
  }

  if (armorCategoryTitles.includes(matchingItem.카테고리)) {
    return {
      ...defaultState,
      armorCategory: matchingItem.카테고리,
      category: '방어구',
    }
  }

  if (matchingItem.카테고리 === '장신구') {
    return { ...defaultState, category: '장신구' }
  }

  if (matchingItem.카테고리 === '차암') {
    return { ...defaultState, category: '차암' }
  }

  if (matchingItem.카테고리 === '주얼') {
    return { ...defaultState, category: '주얼' }
  }

  return { ...defaultState, category: '기타' }
}

function categoryMatches(
  item: UniqueItemRow,
  category: UniqueItemCategoryFilter,
  weaponCategory: string,
  armorCategory: string,
) {
  if (category === '전체') {
    return true
  }

  if (category === '무기') {
    return item.카테고리 === weaponCategory
  }

  if (category === '방어구') {
    return item.카테고리 === armorCategory
  }

  if (category === '장신구') {
    return item.카테고리 === '장신구'
  }

  if (category === '차암') {
    return item.카테고리 === '차암'
  }

  if (category === '주얼') {
    return item.카테고리 === '주얼'
  }

  return item.카테고리 === '기타'
}

function sortUniqueItems(left: UniqueItemRow, right: UniqueItemRow, sortType: UniqueItemSortType) {
  if (sortType === 'level-desc') {
    return nullableNumber(right.요구레벨) - nullableNumber(left.요구레벨) || left.이름.localeCompare(right.이름)
  }

  if (sortType === 'name-asc') {
    return left.이름.localeCompare(right.이름)
  }

  return nullableNumber(left.요구레벨) - nullableNumber(right.요구레벨) || left.이름.localeCompare(right.이름)
}

function uniqueItemSearchText(item: UniqueItemRow) {
  return [
    item.이름,
    item.별칭.join(' '),
    item.베이스,
    item.분류,
    item.등급 ?? '',
    item.기본속성.join(' '),
    item.옵션.join(' '),
    item.비고 ?? '',
    item.카테고리,
  ].join(' ')
}

function nullableNumber(value: number | null) {
  return value ?? 0
}
