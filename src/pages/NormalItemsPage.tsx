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
import { searchItemsByQuery } from '../shared/searchUtils'
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
  SocketByItemLevel,
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

type RecommendedItemTip = {
  note: string
  runewords: string[]
}

const recommendedItemTips: Record<string, RecommendedItemTip> = {
  '브레스트 플레이트': {
    note: '초반 힘 요구치가 낮고 3홈 방어구 제작에 무난한 베이스.',
    runewords: ['잠행', '연기', '신화'],
  },
  '고딕 플레이트': {
    note: '노멀 구간에서 4홈 확보가 가능한 중갑 베이스.',
    runewords: ['용맹', '스톤', '인내'],
  },
  '메이지 플레이트': {
    note: '힘 요구치가 낮은 3홈 방어구라 수수께끼 재료로 선호.',
    runewords: ['수수께끼', '배신', '협박'],
  },
  '더스크 슈라우드': {
    note: '힘 요구치 대비 방어력이 좋아 범용 엘리트 갑옷으로 인기.',
    runewords: ['수수께끼', '인내', '명예의 굴레'],
  },
  '스캐럽 허스크': {
    note: '힘 요구치와 방어력 균형이 좋은 엘리트 갑옷.',
    runewords: ['인내', '명예의 굴레', '스톤'],
  },
  '와이어 플리스': {
    note: '가벼운 엘리트 갑옷군으로 용병/캐릭터 방어구 재료로 사용.',
    runewords: ['인내', '명예의 굴레', '배신'],
  },
  '그레이트 허버크': {
    note: '낮은 힘 요구치와 준수한 방어력의 4홈 엘리트 갑옷.',
    runewords: ['인내', '명예의 굴레', '스톤'],
  },
  '아콘 플레이트': {
    note: '방어력과 힘 요구치 균형이 좋아 대표적인 고급 갑옷 베이스.',
    runewords: ['수수께끼', '인내', '명예의 굴레'],
  },
  '세이크리드 아머': {
    note: '매우 높은 방어력을 노리는 용병용 중갑 베이스.',
    runewords: ['인내', '스톤', '명예의 굴레'],
  },
  헬름: {
    note: '초반 2홈 투구 제작에 쓰기 쉬운 기본 베이스.',
    runewords: ['학식', '천저'],
  },
  '본 헬름': {
    note: '2홈 투구 룬워드와 강령술사 테마 장비에 어울리는 베이스.',
    runewords: ['학식', '천저'],
  },
  '워 햇': {
    note: '가벼운 익셉셔널 투구 베이스.',
    runewords: ['학식', '착란'],
  },
  샐릿: {
    note: '방어력과 요구치가 무난한 익셉셔널 투구.',
    runewords: ['학식', '착란'],
  },
  캐스크: {
    note: '2홈 투구 룬워드용으로 부담 없는 익셉셔널 베이스.',
    runewords: ['학식', '천저'],
  },
  '데스 마스크': {
    note: '3홈까지 가능해 고급 투구 룬워드 후보가 되는 베이스.',
    runewords: ['착란', '꿈'],
  },
  '그림 헬름': {
    note: '2홈 익셉셔널 투구 중 방어력 기대치가 높은 편.',
    runewords: ['학식', '천저'],
  },
  샤코: {
    note: '낮은 힘 요구치의 엘리트 투구 베이스.',
    runewords: ['학식', '착란'],
  },
  '히드라 스컬': {
    note: '방어력 높은 2홈 엘리트 투구 후보.',
    runewords: ['학식', '천저'],
  },
  아메트: {
    note: '엘리트 투구 중 요구치와 방어력 균형이 무난한 베이스.',
    runewords: ['학식', '착란'],
  },
  데몬헤드: {
    note: '3홈까지 가능해 꿈/착란 제작 후보로 볼 수 있는 엘리트 투구.',
    runewords: ['꿈', '착란'],
  },
  '본 비지즈': {
    note: '3홈 엘리트 투구 중 방어력이 높아 꿈 재료 후보.',
    runewords: ['꿈', '착란'],
  },
  '라지 쉴드': {
    note: '초반 3홈 방패 룬워드에 접근하기 쉬운 베이스.',
    runewords: ['고대인의 서약', '각운'],
  },
  '본 쉴드': {
    note: '2홈 방패 룬워드에 자주 쓰이는 초반 베이스.',
    runewords: ['각운'],
  },
  스큐텀: {
    note: '익셉셔널 3홈 방패로 초중반 저항 보강에 사용.',
    runewords: ['고대인의 서약', '각운'],
  },
  모너크: {
    note: '비팔라딘 방패 중 4홈 영혼 제작의 대표 베이스.',
    runewords: ['영혼', '불사조'],
  },
  '아카란 타아지': {
    note: '전용 저항 옵션을 노릴 수 있는 팔라딘 4홈 방패.',
    runewords: ['영혼', '망명'],
  },
  '아카란 론다쉬': {
    note: '팔라딘 전용 옵션과 4홈을 함께 노리는 익셉셔널 방패.',
    runewords: ['영혼', '망명'],
  },
  '세이크리드 타아지': {
    note: '낮은 힘 요구치와 팔라딘 전용 옵션으로 영혼 재료 선호도가 높음.',
    runewords: ['영혼', '망명', '꿈'],
  },
  '세이크리드 론다쉬': {
    note: '방어력과 요구치 균형이 좋은 팔라딘 전용 방패.',
    runewords: ['영혼', '망명', '꿈'],
  },
  '쿠라스트 쉴드': {
    note: '높은 방어력의 팔라딘 4홈 방패 후보.',
    runewords: ['영혼', '망명'],
  },
  '자카룸 쉴드': {
    note: '방어력과 막기 성능을 함께 보는 팔라딘 전용 베이스.',
    runewords: ['영혼', '망명'],
  },
  '볼텍스 쉴드': {
    note: '높은 방어력으로 망명 재료 후보가 되는 팔라딘 방패.',
    runewords: ['망명', '영혼', '꿈'],
  },
  '블레이드 보우': {
    note: '빠른 기본 속도와 4홈으로 활용도가 있는 엘리트 활.',
    runewords: ['신뢰', '조화', '안개'],
  },
  '쉐도우 보우': {
    note: '5홈까지 가능하고 피해/속도 균형이 좋은 엘리트 활.',
    runewords: ['신뢰', '안개'],
  },
  '그레이트 보우': {
    note: '빠른 공속의 4홈 엘리트 활 베이스.',
    runewords: ['신뢰', '조화'],
  },
  '다이아몬드 보우': {
    note: '5홈까지 가능해 신뢰/안개 재료 후보.',
    runewords: ['신뢰', '안개'],
  },
  '히드라 보우': {
    note: '높은 피해와 6홈을 노릴 수 있는 엘리트 활.',
    runewords: ['죽음의 숨결', '침묵'],
  },
  '메이트리어컬 보우': {
    note: '아마존 전용 +3 활/쇠뇌 기술 옵션을 노릴 수 있는 빠른 베이스.',
    runewords: ['신뢰', '조화', '안개'],
  },
  '그랜드 메이트런 보우': {
    note: '아마존 전용 +3 기술과 높은 피해를 함께 노리는 대표 활 베이스.',
    runewords: ['신뢰', '안개'],
  },
  파르티잔: {
    note: '악몽 구간 통찰용으로 접근하기 쉬운 폴암.',
    runewords: ['통찰', '순종'],
  },
  벡드코방: {
    note: '6홈까지 가능하고 중반 용병 무기 재료로 사용.',
    runewords: ['죽음의 숨결', '침묵', '순종'],
  },
  쓰레셔: {
    note: '빠른 기본 속도로 용병 공격 횟수를 챙기기 좋은 엘리트 폴암.',
    runewords: ['통찰', '무한', '순종', '긍지'],
  },
  '크립틱 액스': {
    note: '높은 피해와 5홈으로 용병 화력형 폴암 후보.',
    runewords: ['통찰', '무한', '순종'],
  },
  '그레이트 폴액스': {
    note: '높은 피해와 6홈까지 가능한 대표 엘리트 폴암.',
    runewords: ['무한', '죽음의 숨결', '긍지'],
  },
  '자이언트 쓰레셔': {
    note: '빠른 속도와 6홈을 모두 갖춘 최상급 용병 폴암 후보.',
    runewords: ['무한', '통찰', '긍지', '죽음의 숨결'],
  },
}


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

    const gradeRows = sourceItems
      .filter((item) => (selectedGrade === '전체' ? true : item.등급 === selectedGrade))

    return searchItemsByQuery(gradeRows, nameQuery, normalItemSearchText)
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
          <ArmorItemsTable items={filteredItems.filter(isArmorItemRow)} headerMeta={`총 ${totalItemCount}개 중 ${filteredItems.length}개 표시`} />
        ) : selectedCategory === '신발' ? (
          <DefensiveItemsTable emptyMessage="신발 데이터는 아직 준비 중입니다." items={filteredItems.filter(isArmorItemRow)} headerMeta={`총 ${totalItemCount}개 중 ${filteredItems.length}개 표시`} />
        ) : selectedCategory === '벨트' ? (
          <DefensiveItemsTable emptyMessage="벨트 데이터는 아직 준비 중입니다." items={filteredItems.filter(isArmorItemRow)} headerMeta={`총 ${totalItemCount}개 중 ${filteredItems.length}개 표시`} />
        ) : selectedCategory === '장갑' ? (
          <DefensiveItemsTable emptyMessage="장갑 데이터는 아직 준비 중입니다." items={filteredItems.filter(isArmorItemRow)} headerMeta={`총 ${totalItemCount}개 중 ${filteredItems.length}개 표시`} />
        ) : selectedCategory === '투구' ? (
          <DefensiveItemsTable emptyMessage="투구 데이터는 아직 준비 중입니다." items={filteredItems.filter(isArmorItemRow)} headerMeta={`총 ${totalItemCount}개 중 ${filteredItems.length}개 표시`} />
        ) : selectedCategory === '방패' ? (
          <ShieldItemsTable items={filteredItems.filter(isArmorItemRow)} headerMeta={`총 ${totalItemCount}개 중 ${filteredItems.length}개 표시`} />
        ) : selectedCategory === '무기' ? (
          <WeaponItemsTable items={filteredItems.filter(isWeaponItemRow)} headerMeta={`총 ${totalItemCount}개 중 ${filteredItems.length}개 표시`} />
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
  const documents = data.sections.flatMap((section) => [
    [data.category, section.title, section.grade].join(' '),
    ...section.items.map((item) => [item.이름, item.영문명 ?? '', item.무게 ?? '', item.전용 ?? ''].join(' ')),
  ])

  return searchItemsByQuery(documents, query, (document) => document).length > 0
}

function weaponBasesMatchSearch(data: WeaponBases, query: string) {
  const documents = data.sections.flatMap((section) => [
    [data.category, data.type, section.title, section.grade].join(' '),
    ...section.items.map((item) => [item.이름, item.전용 ?? ''].join(' ')),
  ])

  return searchItemsByQuery(documents, query, (document) => document).length > 0
}

function normalItemSearchText(item: NormalListItem) {
  return [
    item.이름,
    isArmorItemRow(item) ? item.영문명 ?? '' : '',
    item.등급,
    item.카테고리,
    isWeaponItemRow(item) ? item.계열 : '',
    isWeaponItemRow(item) ? `베이스공속 ${item.베이스공속}` : '',
    isArmorItemRow(item) ? item.무게 ?? '' : '',
    item.전용 ?? '',
  ].join(' ')
}

function ArmorItemsTable({ items, headerMeta }: { items: NormalItemRow[]; headerMeta: string }) {
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
          <RecommendBadge item={item} />
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
      header: <MaxSocketHeaderTip />,
      className: 'normal-item-col-socket',
      render: (item) => <MaxSocketCell item={item} />,
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
      header={{ meta: headerMeta }}
      items={items}
      widthMode="content"
      wrapperClassName="armor-items-table"
    />
  )
}

function DefensiveItemsTable({
  emptyMessage,
  items,
  headerMeta,
}: {
  emptyMessage: string
  items: NormalItemRow[]
  headerMeta: string
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
          <RecommendBadge item={item} />
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
            header: <MaxSocketHeaderTip />,
            className: 'normal-item-col-socket',
            render: (item: NormalItemRow) => <MaxSocketCell item={item} />,
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
      header={{ meta: headerMeta }}
      items={items}
      widthMode="content"
    />
  )
}

function ShieldItemsTable({ items, headerMeta }: { items: NormalItemRow[]; headerMeta: string }) {
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
          <RecommendBadge item={item} />
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
      header: <MaxSocketHeaderTip />,
      className: 'normal-item-col-socket',
      render: (item) => <MaxSocketCell item={item} />,
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
      header={{ meta: headerMeta }}
      items={items}
      widthMode="content"
    />
  )
}

function WeaponItemsTable({ items, headerMeta }: { items: WeaponItemRow[]; headerMeta: string }) {
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
          <RecommendBadge item={item} />
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
      key: 'base-speed',
      header: <BaseSpeedHeaderTip />,
      className: 'normal-item-col-base-speed',
      render: (item) => formatBaseSpeed(item.베이스공속),
    },
    {
      key: 'sockets',
      header: <MaxSocketHeaderTip />,
      className: 'normal-item-col-socket',
      render: (item) => <MaxSocketCell item={item} />,
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
      header={{ meta: headerMeta }}
      items={items}
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

function RecommendBadge({ item }: { item: NormalListItem }) {
  if (!item.추천) {
    return null
  }

  const tip = recommendedItemTips[item.이름] ?? {
    note: '룬워드 재료로 활용도가 높은 베이스.',
    runewords: [],
  }

  return (
    <FloatingTooltip
      cardClassName="recommend-tip-card"
      content={<RecommendTipContent item={item} tip={tip} />}
      triggerClassName="recommend-tip-trigger"
    >
      <span className="normal-item-recommend">추천</span>
    </FloatingTooltip>
  )
}

function RecommendTipContent({ item, tip }: { item: NormalListItem; tip: RecommendedItemTip }) {
  return (
    <>
      <strong>{item.이름}</strong>
      <span>{tip.note}</span>
      {tip.runewords.length > 0 ? (
        <span className="recommend-tip-runewords">
          <b>대표 룬워드</b>
          <span>{tip.runewords.join(', ')}</span>
        </span>
      ) : null}
    </>
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
        카테고리: data.category as NormalItemCategory,
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
      카테고리: '무기',
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

function formatBaseSpeed(value: number) {
  return value > 0 ? `+${value}` : value
}

function BaseSpeedHeaderTip() {
  return (
    <FloatingTooltip
      cardClassName="info-tip-card"
      content={
        <>
          <strong>베이스 공속</strong>
          <span>무기 속도 보정값(WSM)입니다.</span>
          <span>숫자가 낮을수록 더 빠른 베이스입니다.</span>
        </>
      }
      triggerClassName="info-tip-trigger"
    >
      <span>베이스 공속*</span>
    </FloatingTooltip>
  )
}

function MaxSocketHeaderTip() {
  return (
    <FloatingTooltip
      cardClassName="info-tip-card"
      content={
        <>
          <strong>최대홈</strong>
          <span>아이템 베이스와 숨렙에 따라 가능한 최대 소켓 수입니다.</span>
          <span>값에 마우스를 올리면 숨렙별 최대 홈과 큐브 확률을 볼 수 있습니다.</span>
        </>
      }
      triggerClassName="info-tip-trigger"
    >
      <span>최대홈*</span>
    </FloatingTooltip>
  )
}

function MaxSocketCell({ item }: { item: NormalListItem }) {
  if (item.최대홈 === null || item.최대홈 === undefined) {
    return <span className="muted-text">-</span>
  }

  if (!item.숨렙별최대홈) {
    return <strong>{item.최대홈}</strong>
  }

  return (
    <FloatingTooltip
      cardClassName="max-socket-card"
      content={<MaxSocketTooltip item={item} sockets={item.숨렙별최대홈} />}
      triggerClassName="max-socket-trigger"
    >
      <strong>{item.최대홈}</strong>
    </FloatingTooltip>
  )
}

function MaxSocketTooltip({ item, sockets }: { item: NormalListItem; sockets: SocketByItemLevel }) {
  const rollSides = cubeSocketRollSides(item)
  const rows = [
    { isHighest: true, label: '숨렙 41+', value: sockets['41+'] },
    { isHighest: false, label: '숨렙 26~40', value: sockets['26-40'] },
    { isHighest: false, label: '숨렙 1~25', value: sockets['1-25'] },
  ]
  const maxSocket = Math.max(...rows.map((row) => row.value))

  return (
    <>
      <strong>{item.이름} 최대 홈</strong>
      <span className="max-socket-note">라주크 보상은 해당 숨렙 구간의 최대 홈으로 확정</span>

      <table className="max-socket-ilvl-table">
        <thead>
          <tr>
            <th>숨렙</th>
            <th>최대</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className={row.isHighest ? 'is-highest-ilvl' : ''} key={row.label}>
              <td>{row.label}</td>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <span className="max-socket-note">큐브 소켓 공식: 1~{rollSides} 균등 굴림, 최대 홈 초과값은 최대 홈으로 보정</span>

      <table className="max-socket-probability-table">
        <thead>
          <tr>
            <th>숨렙</th>
            {Array.from({ length: maxSocket }, (_, index) => (
              <th key={index + 1}>{index + 1}홈</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className={row.isHighest ? 'is-highest-ilvl' : ''} key={row.label}>
              <td>{row.label.replace('숨렙 ', '')}</td>
              {Array.from({ length: maxSocket }, (_, index) => {
                const socketCount = index + 1

                return <td key={socketCount}>{formatSocketChance(cubeSocketChance(row.value, socketCount, rollSides))}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function cubeSocketRollSides(item: NormalListItem) {
  if (isWeaponItemRow(item)) {
    return 6
  }

  if (item.카테고리 === '투구') {
    return 3
  }

  if (item.카테고리 === '갑옷' || item.카테고리 === '방패') {
    return 4
  }

  return Math.max(item.최대홈 ?? 1, 1)
}

function cubeSocketChance(maxSocket: number, socketCount: number, rollSides: number) {
  if (socketCount > maxSocket) {
    return 0
  }

  if (socketCount === maxSocket) {
    return (rollSides - maxSocket + 1) / rollSides
  }

  return 1 / rollSides
}

function formatSocketChance(chance: number) {
  if (chance <= 0) {
    return '-'
  }

  return `${Number((chance * 100).toFixed(1))}%`
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




