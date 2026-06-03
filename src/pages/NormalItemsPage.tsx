import { useMemo, useState } from 'react'
import { PackageSearch } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ItemDataTable, type ItemDataTableColumn } from '../components/ItemDataTable'
import { FloatingTooltip } from '../components/FloatingTooltip'
import { PageHeading } from '../components/PageHeading'
import { FilterPanel, NameSearch, SegmentedFilter, SortControl, TableToolbar } from '../components/TableControls'
import {
  armorBases,
  beltBases,
  bootBases,
  bowIasFrameByName,
  gloveBases,
  helmBases,
  shieldBases,
  shieldPaladinBases,
  weaponBowBases,
  weaponPolearmBases,
  weaponSpearBases,
} from '../shared/gameData'
import { readPageSearchQuery } from '../shared/searchNavigation'
import { matchesSearchText } from '../shared/searchUtils'
import type {
  ArmorBaseItem,
  ArmorBases,
  BowIasFanaticismFrame,
  BowIasFrameItem,
  BowIasFrameValue,
  NormalItemCategory,
  NormalItemGradeFilter,
  NormalItemRow,
  NormalItemSortType,
  NormalListItem,
  NormalShieldTypeFilter,
  NormalWeaponTypeFilter,
  WeaponBaseItem,
  WeaponBases,
  WeaponItemRow,
} from '../shared/appTypes'

const normalItemCategories: NormalItemCategory[] = [
  '투구',
  '갑옷',
  '장갑',
  '벨트',
  '신발',
  '무기',
  '방패',
]
const normalItemGradeFilters: NormalItemGradeFilter[] = ['전체', '노멀', '익셉셔널', '엘리트']
const normalShieldTypeFilters: NormalShieldTypeFilter[] = ['일반 방패', '팔라딘 방패']
const normalWeaponTypeFilters: NormalWeaponTypeFilter[] = ['폴암', '활', '창']
const armorSortOptions: Array<{ value: NormalItemSortType; label: string }> = [
  { value: 'level-asc', label: '레벨제한' },
  { value: 'strength-asc', label: '요구힘' },
  { value: 'socket-asc', label: '홈갯수' },
  { value: 'weight-asc', label: '무게' },
  { value: 'defense-max-asc', label: '최대방어력' },
]
const defensiveSortOptions: Array<{ value: NormalItemSortType; label: string }> = [
  { value: 'level-asc', label: '레벨제한' },
  { value: 'strength-asc', label: '요구힘' },
  { value: 'socket-asc', label: '홈갯수' },
  { value: 'defense-max-asc', label: '최대방어력' },
]
const weaponSortOptions: Array<{ value: NormalItemSortType; label: string }> = [
  { value: 'level-asc', label: '레벨제한' },
  { value: 'strength-asc', label: '요구힘' },
  { value: 'dexterity-asc', label: '요구민첩' },
  { value: 'socket-asc', label: '홈갯수' },
  { value: 'damage-max-asc', label: '최대데미지' },
  { value: 'range-asc', label: '사거리' },
]


export function NormalItemsPage() {
  const [searchParams] = useSearchParams()
  const incomingSearchQuery = readPageSearchQuery(searchParams)
  const initialSearchState = useMemo(() => resolveNormalSearchState(incomingSearchQuery), [incomingSearchQuery])
  const lastAppliedSearchQuery = useRef(incomingSearchQuery)
  const [selectedCategory, setSelectedCategory] = useState<NormalItemCategory>(initialSearchState.category)
  const [selectedGrade, setSelectedGrade] = useState<NormalItemGradeFilter>('전체')
  const [selectedShieldType, setSelectedShieldType] = useState<NormalShieldTypeFilter>(initialSearchState.shieldType)
  const [selectedWeaponType, setSelectedWeaponType] = useState<NormalWeaponTypeFilter>(initialSearchState.weaponType)
  const [nameQuery, setNameQuery] = useState(initialSearchState.nameQuery)
  const [sortType, setSortType] = useState<NormalItemSortType>('weight-asc')
  const armorItems = useMemo(() => getArmorBaseRows(), [])
  const beltItems = useMemo(() => getBeltBaseRows(), [])
  const bootItems = useMemo(() => getBootBaseRows(), [])
  const gloveItems = useMemo(() => getGloveBaseRows(), [])
  const helmItems = useMemo(() => getHelmBaseRows(), [])
  const shieldItems = useMemo(() => getShieldBaseRows(shieldBases), [])
  const paladinShieldItems = useMemo(() => getShieldBaseRows(shieldPaladinBases), [])
  const bowItems = useMemo(() => getWeaponBaseRows(weaponBowBases), [])
  const polearmItems = useMemo(() => getWeaponBaseRows(weaponPolearmBases), [])
  const spearItems = useMemo(() => getWeaponBaseRows(weaponSpearBases), [])
  const sortOptions =
    selectedCategory === '무기'
      ? selectedWeaponType === '활'
        ? weaponSortOptions.filter((option) => option.value !== 'range-asc')
        : weaponSortOptions
      : selectedCategory === '갑옷'
        ? armorSortOptions
        : defensiveSortOptions

  const activeSortType = sortOptions.some((option) => option.value === sortType)
    ? sortType
    : sortOptions[0].value

  const filteredItems = useMemo(() => {
    const sourceItems =
      selectedCategory === '갑옷'
        ? armorItems
        : selectedCategory === '신발'
          ? bootItems
        : selectedCategory === '벨트'
          ? beltItems
        : selectedCategory === '장갑'
          ? gloveItems
        : selectedCategory === '투구'
          ? helmItems
        : selectedCategory === '방패'
          ? selectedShieldType === '팔라딘 방패'
            ? paladinShieldItems
            : shieldItems
        : selectedCategory === '무기'
          ? selectedWeaponType === '활'
            ? bowItems
            : selectedWeaponType === '창'
              ? spearItems
            : polearmItems
          : []

    return sourceItems
      .filter((item) => (selectedGrade === '전체' ? true : item.등급 === selectedGrade))
      .filter((item) =>
        nameQuery.trim()
          ? matchesSearchText(`${item.이름} ${isArmorItemRow(item) ? item.영문명 ?? '' : ''}`, nameQuery)
          : true,
      )
      .toSorted((left, right) => sortNormalItems(left, right, activeSortType))
  }, [activeSortType, armorItems, beltItems, bootItems, bowItems, gloveItems, helmItems, nameQuery, paladinShieldItems, polearmItems, selectedCategory, selectedGrade, selectedShieldType, selectedWeaponType, shieldItems, spearItems])

  useEffect(() => {
    if (incomingSearchQuery === lastAppliedSearchQuery.current) {
      return
    }

    const nextSearchState = resolveNormalSearchState(incomingSearchQuery)
    lastAppliedSearchQuery.current = incomingSearchQuery
    setSelectedCategory(nextSearchState.category)
    setSelectedShieldType(nextSearchState.shieldType)
    setSelectedWeaponType(nextSearchState.weaponType)
    setNameQuery(nextSearchState.nameQuery)
  }, [incomingSearchQuery])

  const totalItemCount =
    selectedCategory === '갑옷'
      ? armorItems.length
      : selectedCategory === '신발'
        ? bootItems.length
      : selectedCategory === '벨트'
        ? beltItems.length
      : selectedCategory === '장갑'
        ? gloveItems.length
      : selectedCategory === '투구'
        ? helmItems.length
      : selectedCategory === '방패'
        ? selectedShieldType === '팔라딘 방패'
          ? paladinShieldItems.length
          : shieldItems.length
      : selectedCategory === '무기'
        ? selectedWeaponType === '활'
          ? bowItems.length
          : selectedWeaponType === '창'
            ? spearItems.length
          : polearmItems.length
        : 0

  return (
    <section className="normal-items-page">
      <PageHeading
        description="일반 등급 장비의 요구치와 최대 홈 정보를 필터링하고 정렬합니다."
        eyebrow="아이템 정보"
        icon={PackageSearch}
        title="일반"
      />

      <TableToolbar sort={<SortControl options={sortOptions} value={activeSortType} onChange={setSortType} />}>
        <FilterPanel>
          <SegmentedFilter
            items={normalItemCategories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {selectedCategory === '무기' && (
            <div className="normal-grade-filter">
              <span>무기 계열</span>
              <div>
                {normalWeaponTypeFilters.map((weaponType) => (
                  <button
                    className={weaponType === selectedWeaponType ? 'is-active' : ''}
                    key={weaponType}
                    onClick={() => setSelectedWeaponType(weaponType)}
                    type="button"
                  >
                    {weaponType}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedCategory === '방패' && (
            <div className="normal-grade-filter">
              <span>방패 계열</span>
              <div>
                {normalShieldTypeFilters.map((shieldType) => (
                  <button
                    className={shieldType === selectedShieldType ? 'is-active' : ''}
                    key={shieldType}
                    onClick={() => setSelectedShieldType(shieldType)}
                    type="button"
                  >
                    {shieldType}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="normal-grade-filter">
            <span>등급</span>
            <div>
              {normalItemGradeFilters.map((grade) => (
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
        label="이름 검색"
        placeholder="예: 메이지 플레이트, 아콘"
        value={nameQuery}
        onChange={setNameQuery}
      />
      <>
        {selectedCategory === '갑옷' ? (
          <ArmorItemsTable items={filteredItems.filter(isArmorItemRow)} metaLabel={`총 ${totalItemCount}개 중 ${filteredItems.length}개 표시`} />
        ) : selectedCategory === '신발' ? (
          <DefensiveItemsTable emptyMessage="신발 데이터는 아직 준비 중입니다." items={filteredItems.filter(isArmorItemRow)} metaLabel={`총 ${totalItemCount}개 중 ${filteredItems.length}개 표시`} />
        ) : selectedCategory === '벨트' ? (
          <DefensiveItemsTable emptyMessage="벨트 데이터는 아직 준비 중입니다." items={filteredItems.filter(isArmorItemRow)} metaLabel={`총 ${totalItemCount}개 중 ${filteredItems.length}개 표시`} />
        ) : selectedCategory === '장갑' ? (
          <DefensiveItemsTable emptyMessage="장갑 데이터는 아직 준비 중입니다." items={filteredItems.filter(isArmorItemRow)} metaLabel={`총 ${totalItemCount}개 중 ${filteredItems.length}개 표시`} />
        ) : selectedCategory === '투구' ? (
          <DefensiveItemsTable emptyMessage="투구 데이터는 아직 준비 중입니다." items={filteredItems.filter(isArmorItemRow)} metaLabel={`총 ${totalItemCount}개 중 ${filteredItems.length}개 표시`} />
        ) : selectedCategory === '방패' ? (
          <ShieldItemsTable items={filteredItems.filter(isArmorItemRow)} metaLabel={`총 ${totalItemCount}개 중 ${filteredItems.length}개 표시`} />
        ) : selectedCategory === '무기' ? (
          <WeaponItemsTable items={filteredItems.filter(isWeaponItemRow)} metaLabel={`총 ${totalItemCount}개 중 ${filteredItems.length}개 표시`} />
        ) : (
          <EmptyNormalItemsTable category={selectedCategory} />
        )}
      </>
    </section>
  )
}

function resolveNormalSearchState(query: string): {
  category: NormalItemCategory
  nameQuery: string
  shieldType: NormalShieldTypeFilter
  weaponType: NormalWeaponTypeFilter
} {
  const trimmedQuery = query.trim()
  const defaultState = {
    category: '갑옷' as NormalItemCategory,
    nameQuery: trimmedQuery,
    shieldType: '일반 방패' as NormalShieldTypeFilter,
    weaponType: '폴암' as NormalWeaponTypeFilter,
  }

  if (!trimmedQuery) {
    return defaultState
  }

  const defensiveGroups: Array<{ category: NormalItemCategory; data: ArmorBases }> = [
    { category: '투구', data: helmBases },
    { category: '갑옷', data: armorBases },
    { category: '장갑', data: gloveBases },
    { category: '벨트', data: beltBases },
    { category: '신발', data: bootBases },
  ]
  const matchingDefensiveGroup = defensiveGroups.find(({ data }) => armorBasesMatchSearch(data, trimmedQuery))

  if (matchingDefensiveGroup) {
    return { ...defaultState, category: matchingDefensiveGroup.category }
  }

  if (armorBasesMatchSearch(shieldPaladinBases, trimmedQuery)) {
    return { ...defaultState, category: '방패', shieldType: '팔라딘 방패' }
  }

  if (armorBasesMatchSearch(shieldBases, trimmedQuery)) {
    return { ...defaultState, category: '방패' }
  }

  const matchingWeaponGroup = [
    weaponPolearmBases,
    weaponBowBases,
    weaponSpearBases,
  ].find((data) => weaponBasesMatchSearch(data, trimmedQuery))

  if (matchingWeaponGroup) {
    return { ...defaultState, category: '무기', weaponType: matchingWeaponGroup.type }
  }

  return defaultState
}

function armorBasesMatchSearch(data: ArmorBases, query: string) {
  return data.sections.some((section) =>
    matchesSearchText([data.category, section.title, section.grade].join(' '), query) ||
    section.items.some((item) => matchesSearchText([item.이름, item.영문명 ?? '', item.무게 ?? '', item.전용 ?? ''].join(' '), query)),
  )
}

function weaponBasesMatchSearch(data: WeaponBases, query: string) {
  return data.sections.some((section) =>
    matchesSearchText([data.category, data.type, section.title, section.grade].join(' '), query) ||
    section.items.some((item) => matchesSearchText([item.이름, item.전용 ?? ''].join(' '), query)),
  )
}

function ArmorItemsTable({ items, metaLabel }: { items: NormalItemRow[]; metaLabel: string }) {
  const columns: ItemDataTableColumn<NormalItemRow>[] = [
    {
      key: 'grade',
      header: '등급',
      className: 'normal-item-col-grade',
      render: (item) => <span className="normal-item-grade">{item.등급}</span>,
    },
    {
      key: 'name',
      header: '이름',
      className: 'normal-item-col-name',
      render: (item) => (
        <span className="normal-item-name-cell">
          <span className={`runeword-name ${weightNameClass(item.무게)}`}>{item.이름}</span>
          {item.추천 ? <span className="normal-item-recommend">추천</span> : null}
        </span>
      ),
    },
    {
      key: 'defense',
      header: <MaxDefenseHeaderTip />,
      className: 'normal-item-col-defense',
      render: (item) => <MaxDefenseCell defense={item.방어력} />,
    },
    {
      key: 'sockets',
      header: '최대홈',
      className: 'normal-item-col-socket',
      render: (item) => formatNullableNumber(item.최대홈),
    },
    {
      key: 'weight',
      header: <WeightHeaderTip />,
      className: 'normal-item-col-weight',
      render: (item) => <span className="normal-item-weight">{item.무게 || '-'}</span>,
    },
    {
      key: 'strength',
      header: '필요힘',
      className: 'normal-item-col-strength',
      render: (item) => formatNullableNumber(item.필요힘),
    },
    {
      key: 'level',
      header: '요구레벨',
      className: 'normal-item-col-level',
      render: (item) => formatNullableNumber(item.요구레벨),
    },
  ]

  return (
    <ItemDataTable
      columns={columns}
      emptyMessage="갑옷 데이터는 아직 준비 중입니다."
      fillColumnKey="name"
      getRowKey={(item) => item.id}
      items={items}
      metaLabel={metaLabel}
      widthMode="content"
      wrapperClassName="armor-items-table"
    />
  )
}

function DefensiveItemsTable({
  emptyMessage,
  items,
  metaLabel,
}: {
  emptyMessage: string
  items: NormalItemRow[]
  metaLabel: string
}) {
  const hasSockets = items.some((item) => item.최대홈 !== null && item.최대홈 !== undefined)
  const columns: ItemDataTableColumn<NormalItemRow>[] = [
    {
      key: 'grade',
      header: '등급',
      className: 'normal-item-col-grade',
      render: (item) => <span className="normal-item-grade">{item.등급}</span>,
    },
    {
      key: 'name',
      header: '이름',
      className: 'normal-item-col-name',
      render: (item) => (
        <span className="normal-item-name-cell">
          <span className="runeword-name">{item.이름}</span>
          {item.추천 ? <span className="normal-item-recommend">추천</span> : null}
        </span>
      ),
    },
    {
      key: 'defense',
      header: <MaxDefenseHeaderTip />,
      className: 'normal-item-col-defense',
      render: (item) => <MaxDefenseCell defense={item.방어력} />,
    },
    ...(hasSockets
      ? [
          {
            key: 'sockets',
            header: '최대홈',
            className: 'normal-item-col-socket',
            render: (item: NormalItemRow) => formatNullableNumber(item.최대홈),
          },
        ]
      : []),
    {
      key: 'strength',
      header: '필요힘',
      className: 'normal-item-col-strength',
      render: (item) => formatNullableNumber(item.필요힘),
    },
    {
      key: 'level',
      header: '요구레벨',
      className: 'normal-item-col-level',
      render: (item) => formatNullableNumber(item.요구레벨),
    },
  ]

  return (
    <ItemDataTable
      columns={columns}
      emptyMessage={emptyMessage}
      fillColumnKey="name"
      getRowKey={(item) => item.id}
      items={items}
      metaLabel={metaLabel}
      widthMode="content"
    />
  )
}

function ShieldItemsTable({ items, metaLabel }: { items: NormalItemRow[]; metaLabel: string }) {
  const hasBlockRate = items.some((item) => item.블럭율)
  const hasSmiteDamage = items.some((item) => item.강타피해)
  const columns: ItemDataTableColumn<NormalItemRow>[] = [
    {
      key: 'grade',
      header: '등급',
      className: 'normal-item-col-grade',
      render: (item) => <span className="normal-item-grade">{item.등급}</span>,
    },
    {
      key: 'name',
      header: '이름',
      className: 'normal-item-col-name',
      render: (item) => (
        <span className="normal-item-name-cell">
          <span className="runeword-name">{item.이름}</span>
          {item.추천 ? <span className="normal-item-recommend">추천</span> : null}
          {item.전용 ? <span className="normal-item-recommend">{item.전용}</span> : null}
        </span>
      ),
    },
    {
      key: 'defense',
      header: <MaxDefenseHeaderTip />,
      className: 'normal-item-col-defense',
      render: (item) => <MaxDefenseCell defense={item.방어력} />,
    },
    {
      key: 'sockets',
      header: '최대홈',
      className: 'normal-item-col-socket',
      render: (item) => formatNullableNumber(item.최대홈),
    },
    ...(hasBlockRate
      ? [
          {
            key: 'block',
            header: '블럭율',
            className: 'normal-item-col-block',
            render: (item: NormalItemRow) => item.블럭율 ?? '-',
          },
        ]
      : []),
    ...(hasSmiteDamage
      ? [
          {
            key: 'smite-damage',
            header: '강타 피해',
            className: 'normal-item-col-smite',
            render: (item: NormalItemRow) => formatItemRange(item.강타피해),
          },
        ]
      : []),
    {
      key: 'strength',
      header: '필요힘',
      className: 'normal-item-col-strength',
      render: (item) => formatNullableNumber(item.필요힘),
    },
    {
      key: 'level',
      header: '요구레벨',
      className: 'normal-item-col-level',
      render: (item) => formatNullableNumber(item.요구레벨),
    },
  ]

  return (
    <ItemDataTable
      columns={columns}
      emptyMessage="방패 데이터는 아직 준비 중입니다."
      fillColumnKey="name"
      getRowKey={(item) => item.id}
      items={items}
      metaLabel={metaLabel}
      widthMode="content"
    />
  )
}

function WeaponItemsTable({ items, metaLabel }: { items: WeaponItemRow[]; metaLabel: string }) {
  const hasRange = items.some((item) => item.사거리 !== null)
  const columns: ItemDataTableColumn<WeaponItemRow>[] = [
    {
      key: 'grade',
      header: '등급',
      className: 'normal-item-col-grade',
      render: (item) => <span className="normal-item-grade">{item.등급}</span>,
    },
    {
      key: 'name',
      header: '이름',
      className: 'normal-item-col-name',
      render: (item) => (
        <span className="normal-item-name-cell">
          <WeaponName item={item} />
          {item.추천 ? <span className="normal-item-recommend">추천</span> : null}
          {item.전용 ? <span className="normal-item-recommend">{item.전용}</span> : null}
        </span>
      ),
    },
    {
      key: 'damage',
      header: '양손 데미지',
      className: 'normal-item-col-damage',
      render: (item) => <WeaponDamageCell damage={item.양손데미지} />,
    },
    {
      key: 'average-damage',
      header: '평균 데미지',
      className: 'normal-item-col-damage-average',
      render: (item) => formatNullableNumber(item.양손데미지.평균),
    },
    ...(hasRange
      ? [
          {
            key: 'range',
            header: '사거리',
            className: 'normal-item-col-range',
            render: (item: WeaponItemRow) => formatNullableNumber(item.사거리),
          },
        ]
      : []),
    {
      key: 'sockets',
      header: '최대홈',
      className: 'normal-item-col-socket',
      render: (item) => formatNullableNumber(item.최대홈),
    },
    {
      key: 'strength',
      header: '필요힘',
      className: 'normal-item-col-strength',
      render: (item) => formatNullableNumber(item.필요힘),
    },
    {
      key: 'dexterity',
      header: '필요민첩',
      className: 'normal-item-col-dexterity',
      render: (item) => formatNullableNumber(item.필요민첩),
    },
    {
      key: 'level',
      header: '요구레벨',
      className: 'normal-item-col-level',
      render: (item) => formatNullableNumber(item.요구레벨),
    },
  ]

  return (
    <ItemDataTable
      columns={columns}
      emptyMessage="무기 데이터는 아직 준비 중입니다."
      fillColumnKey="name"
      getRowKey={(item) => item.id}
      items={items}
      metaLabel={metaLabel}
      widthMode="content"
    />
  )
}

function WeaponName({ item }: { item: WeaponItemRow }) {
  const iasFrame = item.계열 === '활' ? bowIasFrameByName.get(item.이름) : undefined

  if (!iasFrame) {
    return <span className="runeword-name">{item.이름}</span>
  }

  return (
    <FloatingTooltip
      cardClassName="bow-ias-mini-card"
      content={<BowIasMiniCardContent data={iasFrame} />}
      triggerClassName="weapon-ias-trigger"
    >
      <span className="runeword-name">{item.이름}</span>
    </FloatingTooltip>
  )
}

function BowIasMiniCardContent({ data }: { data: BowIasFrameItem }) {
  return (
    <>
      <strong>{data.이름}</strong>
      <span className="bow-ias-mini-card-title">공속 프레임 별 공속 요구치</span>

      <BowIasFrameTable title="광신 미적용 시" frames={data.광신미적용} />

      {data.광신적용.length > 0 && <BowIasFanaticismTable title="광신 적용 시" groups={data.광신적용} />}
    </>
  )
}

function BowIasFrameTable({ frames, title }: { frames: BowIasFrameValue[]; title: string }) {
  if (frames.length === 0) {
    return null
  }

  return (
    <span className="bow-ias-frame-section">
      <b>{title}</b>
      <span className="bow-ias-table is-basic" role="table">
        <span className="bow-ias-table-row is-head" role="row">
          <span role="columnheader">프레임</span>
          <span role="columnheader">요구 공속</span>
        </span>
        {frames.map((frame) => (
          <span className="bow-ias-table-row" key={frame.프레임} role="row">
            <span role="cell">{frame.프레임}</span>
            <strong role="cell">{frame.공속}</strong>
          </span>
        ))}
      </span>
    </span>
  )
}

function BowIasFanaticismTable({
  groups,
  title,
}: {
  groups: BowIasFanaticismFrame[]
  title: string
}) {
  const frameRows = groups[0]?.프레임.map((frame) => frame.프레임) ?? []

  return (
    <span className="bow-ias-frame-section">
      <b>{title}</b>
      <span className="bow-ias-table is-fanaticism" role="table">
        <span className="bow-ias-table-row is-head" role="row">
          <span role="columnheader">프레임</span>
          {groups.map((group) => (
            <span key={group.광신} role="columnheader">
              {group.광신}
            </span>
          ))}
        </span>
        {frameRows.map((frameName) => (
          <span className="bow-ias-table-row" key={frameName} role="row">
            <span role="cell">{frameName}</span>
            {groups.map((group) => {
              const frame = group.프레임.find((item) => item.프레임 === frameName)

              return (
                <strong key={`${frameName}-${group.광신}`} role="cell">
                  {frame?.공속 ?? '-'}
                </strong>
              )
            })}
          </span>
        ))}
      </span>
    </span>
  )
}


function EmptyNormalItemsTable({ category }: { category: NormalItemCategory }) {
  return (
    <ItemDataTable
      columns={[
        {
          key: 'empty',
          header: category,
          className: 'normal-item-empty',
          render: () => category,
        },
      ]}
      emptyMessage={`${category} 데이터는 아직 준비 중입니다.`}
      getRowKey={(item) => item.id}
      items={[] as Array<{ id: string }>}
    />
  )
}

function getArmorBaseRows(): NormalItemRow[] {
  return getDefensiveBaseRows(armorBases)
}

function getBeltBaseRows(): NormalItemRow[] {
  return getDefensiveBaseRows(beltBases)
}

function getBootBaseRows(): NormalItemRow[] {
  return getDefensiveBaseRows(bootBases)
}

function getGloveBaseRows(): NormalItemRow[] {
  return getDefensiveBaseRows(gloveBases)
}

function getHelmBaseRows(): NormalItemRow[] {
  return getDefensiveBaseRows(helmBases)
}

function getShieldBaseRows(data: ArmorBases): NormalItemRow[] {
  return getDefensiveBaseRows(data)
}

function getDefensiveBaseRows(data: ArmorBases): NormalItemRow[] {
  return data.sections
    .filter((section) => section.kind === 'base')
    .flatMap((section) =>
      section.items.map((item) => ({
        ...item,
        id: `${data.category}-${section.id}-${item.이름}`,
        등급: section.grade,
      })),
    )
}

function getWeaponBaseRows(data: WeaponBases): WeaponItemRow[] {
  return data.sections.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      id: `${data.type}-${section.id}-${item.이름}`,
      등급: section.grade,
      계열: data.type,
    })),
  )
}

function sortNormalItems(left: NormalListItem, right: NormalListItem, sortType: NormalItemSortType) {
  if (sortType === 'strength-asc') {
    return nullableNumber(left.필요힘) - nullableNumber(right.필요힘) || left.이름.localeCompare(right.이름)
  }

  if (sortType === 'socket-asc') {
    return nullableNumber(left.최대홈) - nullableNumber(right.최대홈) || nullableNumber(left.필요힘) - nullableNumber(right.필요힘)
  }

  if (sortType === 'weight-asc') {
    return weightValue(left) - weightValue(right) || nullableNumber(left.필요힘) - nullableNumber(right.필요힘)
  }

  if (sortType === 'defense-max-asc') {
    return maxDefenseValue(left) - maxDefenseValue(right) || nullableNumber(left.필요힘) - nullableNumber(right.필요힘)
  }

  if (sortType === 'damage-max-asc') {
    return maxDamageValue(left) - maxDamageValue(right) || nullableNumber(left.필요힘) - nullableNumber(right.필요힘)
  }

  if (sortType === 'range-asc') {
    return rangeValue(left) - rangeValue(right) || nullableNumber(left.필요힘) - nullableNumber(right.필요힘)
  }

  if (sortType === 'dexterity-asc') {
    return dexterityValue(left) - dexterityValue(right) || nullableNumber(left.필요힘) - nullableNumber(right.필요힘)
  }

  return nullableNumber(left.요구레벨) - nullableNumber(right.요구레벨) || nullableNumber(left.필요힘) - nullableNumber(right.필요힘)
}

function isArmorItemRow(item: NormalListItem): item is NormalItemRow {
  return '방어력' in item
}

function isWeaponItemRow(item: NormalListItem): item is WeaponItemRow {
  return '양손데미지' in item
}

function maxDefenseValue(item: NormalListItem) {
  return isArmorItemRow(item) ? nullableNumber(item.방어력.최대) : 0
}

function weightValue(item: NormalListItem) {
  return isArmorItemRow(item) ? weightRank(item.무게) : 0
}

function maxDamageValue(item: NormalListItem) {
  return isWeaponItemRow(item) ? nullableNumber(item.양손데미지.최대) : 0
}

function rangeValue(item: NormalListItem) {
  return isWeaponItemRow(item) ? nullableNumber(item.사거리) : 0
}

function dexterityValue(item: NormalListItem) {
  return isWeaponItemRow(item) ? nullableNumber(item.필요민첩) : 0
}

function nullableNumber(value: number | null | undefined) {
  return value ?? 0
}

function weightRank(weight: string | undefined) {
  return {
    Light: 1,
    Medium: 2,
    Heavy: 3,
  }[weight ?? ''] ?? 0
}

function weightNameClass(weight: string | undefined) {
  if (weight === 'Light') {
    return 'is-light-weight-name'
  }

  if (weight === 'Medium') {
    return 'is-medium-weight-name'
  }

  if (weight === 'Heavy') {
    return 'is-heavy-weight-name'
  }

  return ''
}

function formatNullableNumber(value: number | null | undefined) {
  return value ?? '-'
}

function MaxDefenseHeaderTip() {
  return (
    <FloatingTooltip
      cardClassName="info-tip-card"
      content={
        <>
          <strong>최대 방어력</strong>
          <span>에테리얼의 경우 기본 방어력이 50% 증가한다.</span>
          <span>고급 접두사의 경우 최대 15% 방어력이 증가한다.</span>
        </>
      }
      triggerClassName="info-tip-trigger"
    >
      <span>최대 방어력*</span>
    </FloatingTooltip>
  )
}

function MaxDefenseCell({ defense }: { defense: ArmorBaseItem['방어력'] }) {
  if (defense.최대 === null || defense.최대 === undefined) {
    return <span className="muted-text">-</span>
  }

  const maxDefense = defense.최대

  return (
    <FloatingTooltip
      cardClassName="max-defense-card"
      content={
        <>
          <span>
            <b>고급</b>
            <strong>{Math.ceil(maxDefense * 1.15)}</strong>
          </span>
          <span>
            <b>에테리얼</b>
            <strong>{Math.ceil(maxDefense * 1.5)}</strong>
          </span>
          <span>
            <b>고급 에테리얼</b>
            <strong>{Math.ceil(maxDefense * 1.5 * 1.15)}</strong>
          </span>
        </>
      }
      triggerClassName="max-defense-trigger"
    >
      <strong>{formatDefenseRange(defense)}</strong>
    </FloatingTooltip>
  )
}

function formatDefenseRange(defense: ArmorBaseItem['방어력']) {
  if (defense.최소 === null || defense.최대 === null) {
    return defense.원문 ?? '-'
  }

  return `${defense.최소} - ${defense.최대}`
}

function formatItemRange(range: ArmorBaseItem['강타피해']) {
  if (!range) {
    return '-'
  }

  if (range.최소 === null || range.최대 === null) {
    return range.원문 ?? '-'
  }

  return `${range.최소} - ${range.최대}`
}

function WeaponDamageCell({ damage }: { damage: WeaponBaseItem['양손데미지'] }) {
  if (damage.최소 === null || damage.최대 === null) {
    return <span className="muted-text">{damage.원문 ?? '-'}</span>
  }

  return (
    <FloatingTooltip
      cardClassName="weapon-damage-card"
      content={
        <>
          <span>
            <b>고급</b>
            <strong>{formatDamageBonusRange(damage, 1.15)}</strong>
          </span>
          <span>
            <b>에테리얼</b>
            <strong>{formatDamageBonusRange(damage, 1.5)}</strong>
          </span>
          <span>
            <b>고급 에테리얼</b>
            <strong>{formatDamageBonusRange(damage, 1.5 * 1.15)}</strong>
          </span>
        </>
      }
      triggerClassName="weapon-damage-trigger"
    >
      <strong>{formatDamageRange(damage)}</strong>
    </FloatingTooltip>
  )
}

function formatDamageBonusRange(damage: WeaponBaseItem['양손데미지'], multiplier: number) {
  if (damage.최소 === null || damage.최대 === null) {
    return '-'
  }

  return `${Math.floor(damage.최소 * multiplier)} ~ ${Math.floor(damage.최대 * multiplier)}`
}

function formatDamageRange(damage: WeaponBaseItem['양손데미지']) {
  if (damage.최소 === null || damage.최대 === null) {
    return damage.원문 ?? '-'
  }

  return `${damage.최소} ~ ${damage.최대}`
}

function WeightHeaderTip() {
  return (
    <FloatingTooltip
      cardClassName="info-tip-card"
      content={
        <>
          <strong>무게</strong>
          <span>무게가 가벼울수록 이동속도가 빠르다.</span>
          <span>Light &gt; Medium &gt; Heavy 순</span>
        </>
      }
      triggerClassName="info-tip-trigger"
    >
      <span>무게*</span>
    </FloatingTooltip>
  )
}




