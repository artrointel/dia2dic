import { useMemo, useState } from 'react'
import { PackageSearch } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ItemDataTable, type ItemDataTableColumn } from '../components/ItemDataTable'
import { FloatingTooltip } from '../components/FloatingTooltip'
import { PageHeading } from '../components/PageHeading'
import type { RecommendationFilter, RecommendationTag } from '../components/RecommendationBadge'
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
  runewords,
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
const normalWeaponBaseSources: Array<{
  data: WeaponBases
  itemFilter?: (item: WeaponBaseItem) => boolean
  type: NormalWeaponTypeFilter
}> = [
  { data: weaponDaggerBases, type: '단도' },
  { data: weaponSwordBases, type: '도검' },
  { data: weaponAxeBases, type: '도끼' },
  { data: weaponPolearmBases, type: '폴암' },
  { data: weaponClawBases, type: '손톱' },
  { data: weaponCrossbowBases, type: '쇠뇌' },
  { data: weaponStaffBases, type: '지팡이' },
  { data: weaponSpearBases, type: '창' },
  { data: weaponMaceBases, type: '철퇴' },
  { data: weaponScepterBases, type: '홀' },
  { data: weaponJavelinBases, type: '투창' },
  { data: weaponBowBases, type: '일반 활', itemFilter: isRegularBowItem },
  { data: weaponBowBases, type: '아마존 활', itemFilter: isAmazonBowItem },
  { data: weaponThrowingBases, type: '투척' },
  { data: weaponWandBases, type: '완드' },
  { data: weaponOrbBases, type: '오브' },
  { data: weaponAmazonBases, type: '아마존 전용' },
]
const normalWeaponTypeFilters: NormalWeaponTypeFilter[] = normalWeaponBaseSources.map((source) => source.type)
const recommendationFilters: RecommendationFilter[] = ['전체', '추천', '맨땅']
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

export type RecommendedItemTip = {
  note: string
  runewords: string[]
  specialOptions?: string[]
  tag?: RecommendationTag
}

// eslint-disable-next-line react-refresh/only-export-components
export const recommendedItemTips: Record<string, RecommendedItemTip> = {
  '브레스트 플레이트': {
    note: '초반 힘 요구치가 낮고 3홈 방어구 제작에 무난한 베이스.',
    runewords: ['잠행', '연기', '신화'],
    tag: '맨땅',
  },
  '고딕 플레이트': {
    note: '낮은 요구힘의 3홈 수수께끼 외형 베이스로 선택되는 갑옷.',
    runewords: ['수수께끼'],
  },
  '메이지 플레이트': {
    note: '힘 요구치가 낮은 3홈 방어구라 수수께끼 재료로 선호.',
    runewords: ['수수께끼', '배신'],
  },
  '더스크 슈라우드': {
    note: '힘 요구치 대비 방어력이 좋아 범용 엘리트 갑옷으로 인기.',
    runewords: ['수수께끼', '인내', '명예의 굴레', '협박'],
  },
  '스캐럽 허스크': {
    note: '힘 요구치와 방어력 균형이 좋은 엘리트 갑옷.',
    runewords: ['인내', '명예의 굴레', '스톤', '협박'],
  },
  '와이어 플리스': {
    note: '가벼운 엘리트 갑옷군으로 용병/캐릭터 방어구 재료로 사용.',
    runewords: ['인내', '명예의 굴레', '배신', '협박'],
  },
  '그레이트 허버크': {
    note: '낮은 힘 요구치와 준수한 방어력의 4홈 엘리트 갑옷.',
    runewords: ['인내', '명예의 굴레', '스톤', '협박'],
  },
  '아콘 플레이트': {
    note: '방어력과 힘 요구치 균형이 좋아 대표적인 고급 갑옷 베이스.',
    runewords: ['수수께끼', '인내', '명예의 굴레', '협박'],
  },
  '세이크리드 아머': {
    note: '매우 높은 방어력을 노리는 용병용 중갑 베이스.',
    runewords: ['인내', '스톤', '명예의 굴레', '협박'],
  },
  헬름: {
    note: '초반 2홈 투구 제작에 쓰기 쉬운 기본 베이스.',
    runewords: ['학식', '천저'],
    tag: '맨땅',
  },
  '본 헬름': {
    note: '2홈 투구 룬워드와 강령술사 테마 장비에 어울리는 베이스.',
    runewords: ['학식', '천저'],
    tag: '맨땅',
  },
  '워 햇': {
    note: '가벼운 익셉셔널 투구 베이스.',
    runewords: ['학식'],
    tag: '맨땅',
  },
  샐릿: {
    note: '방어력과 요구치가 무난한 익셉셔널 투구.',
    runewords: ['학식'],
    tag: '맨땅',
  },
  캐스크: {
    note: '2홈 투구 룬워드용으로 부담 없는 익셉셔널 베이스.',
    runewords: ['학식', '천저'],
    tag: '맨땅',
  },
  '데스 마스크': {
    note: '3홈까지 가능해 고급 투구 룬워드 후보가 되는 베이스.',
    runewords: ['치료', '착란', '꿈'],
  },
  '그림 헬름': {
    note: '2홈 익셉셔널 투구 중 방어력 기대치가 높은 편.',
    runewords: ['학식', '천저'],
    tag: '맨땅',
  },
  데몬헤드: {
    note: '3홈까지 가능해 꿈/착란 제작 후보로 볼 수 있는 엘리트 투구.',
    runewords: ['치료', '꿈', '착란'],
  },
  '본 비지즈': {
    note: '3홈 엘리트 투구 중 방어력이 높아 꿈 재료 후보.',
    runewords: ['치료', '꿈', '착란'],
  },
  '라지 쉴드': {
    note: '초반 3홈 방패 룬워드에 접근하기 쉬운 베이스.',
    runewords: ['고대인의 서약', '각운'],
    tag: '맨땅',
  },
  '본 쉴드': {
    note: '2홈 방패 룬워드에 자주 쓰이는 초반 베이스.',
    runewords: ['각운'],
    tag: '맨땅',
  },
  스큐텀: {
    note: '익셉셔널 3홈 방패로 초중반 저항 보강에 사용.',
    runewords: ['고대인의 서약', '각운'],
    tag: '맨땅',
  },
  모너크: {
    note: '비팔라딘 방패 중 4홈 영혼 제작의 대표 베이스. 에테 모너크는 소집 스왑용 영혼으로도 선호.',
    runewords: ['영혼', '불사조'],
  },
  '아카란 타아지': {
    note: '노말 카우 등에서 4홈 영혼을 빠르게 노릴 수 있는 맨땅 팔라딘 방패.',
    runewords: ['영혼'],
    tag: '맨땅',
  },
  '아카란 론다쉬': {
    note: '전용 저항 옵션과 4홈 영혼을 함께 노리는 맨땅 팔라딘 방패.',
    runewords: ['영혼'],
    tag: '맨땅',
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
  '크리스탈 소드': {
    note: '요구치가 낮아 4홈 영혼과 5홈 소집 재료로 널리 쓰이는 도검 베이스.',
    runewords: ['영혼', '소집'],
  },
  크리스: {
    note: '3홈 공허 제작이 가능한 단도 베이스.',
    runewords: ['공허'],
    specialOptions: ['공허 재료는 심연 +3이 붙으면 특급 베이스로 취급.'],
  },
  '페이즈 블레이드': {
    note: '내구도 소모가 없고 빠른 공속으로 고급 한손 도검 룬워드의 대표 베이스.',
    runewords: ['슬픔', '마지막 소원', '집행자', '초승달', '정의의손길'],
  },
  '콜로서스 블레이드': {
    note: '6홈 양손 도검 중 피해 기대치가 높아 고룬 무기 재료 후보.',
    runewords: ['죽음의 숨결', '마지막 소원', '침묵'],
  },
  '버서커 액스': {
    note: '한손 도끼 중 사거리와 피해가 좋아 고급 무기 룬워드 재료로 선호.',
    runewords: ['슬픔', '야수', '죽음의 숨결', '파멸', '마지막 소원'],
  },
  '글로리어스 액스': {
    note: '6홈 양손 도끼 중 피해가 높아 죽음의 숨결 같은 고룬 무기 후보.',
    runewords: ['죽음의 숨결', '침묵'],
  },
  프레일: {
    note: '낮은 요구치와 4~5홈 접근성으로 오심/소집 재료로 널리 쓰이는 베이스.',
    runewords: ['참나무의 심장', '소집'],
  },
  '워 셉터': {
    note: '초반 성기사 기술 옵션을 노릴 수 있는 3홈 홀 베이스.',
    runewords: ['왕의 은총', '집행자'],
    specialOptions: ['유효 성기사 기술 +3 조합은 맨땅/전용 빌드에서 가치가 크게 상승.'],
    tag: '맨땅',
  },
  카두세우스: {
    note: '성기사 기술 옵션과 빠른 공속을 함께 노리는 엘리트 홀 베이스.',
    runewords: ['야수', '집행자', '왕 시해자'],
    specialOptions: ['선고, 광신, 천상의 주먹, 신성한 방패 등 빌드 핵심 기술 +3이면 고급 재료.'],
  },
  '워 스태프': {
    note: '4홈 기억 재료 후보. 스태프류는 목적 기술 +3 조합 여부가 핵심.',
    runewords: ['기억'],
    specialOptions: ['잎새는 워 스태프 고정 추천이 아니라 노멀 2홈 스태프류에 화염구, 온기, 마법부여 등 목적 기술 +3 조합을 우대.'],
    tag: '맨땅',
  },
  '아콘 스태프': {
    note: '언데드 추가 피해와 높은 기본 피해로 악마술사 에테 4홈 통찰 재료로 선호.',
    runewords: ['통찰', '침묵', '죽음의 숨결'],
    specialOptions: ['고급 스태프는 마력 보호막, 냉기 갑옷류, 화력 기술 등 목적 기술 +3 여부가 중요. 숨렙 26~40 구간은 라주크 4홈 확정.'],
  },
  쉴레일리: {
    note: '언데드 추가 피해가 붙는 4홈 엘리트 스태프라 악마술사 에테 통찰 재료로 활용.',
    runewords: ['통찰'],
    specialOptions: ['에테리얼 4홈이면 악마술사용 통찰 베이스로 가치가 높다.'],
  },
  '본 원드': {
    note: '강령술사 핵심 기술 옵션과 2홈 순백을 함께 노릴 수 있는 초반 베이스.',
    runewords: ['순백'],
    specialOptions: ['순백 재료는 뼈 창, 뼈 영혼, 부활, 저주 계열 등 목적 기술 +3 조합을 우대.'],
    tag: '맨땅',
  },
  '그레이브 원드': {
    note: '익셉셔널 2홈 완드로 순백 재료 후보.',
    runewords: ['순백'],
    specialOptions: ['뼈 창/뼈 영혼 같은 핵심 강령술사 기술 +3이면 가치가 크게 상승.'],
  },
  '그레이터 탤런': {
    note: '빠른 공속과 암살자 기술 옵션을 함께 노리는 손톱 베이스.',
    runewords: ['혼돈', '역병', '분노'],
    specialOptions: ['번개 파수기, 죽음 파수기, 정신 폭발, 흐리기, 맹독 등 목적 기술 +3 조합을 우대.'],
  },
  '루닉 탤런': {
    note: '빠른 공속의 엘리트 손톱으로 혼돈/역병 재료 후보.',
    runewords: ['혼돈', '역병', '분노'],
    specialOptions: ['혼돈/역병 재료는 용의 비상, 정신 폭발, 죽음 파수기, 맹독 등 유효 기술 조합이 중요.'],
  },
  '페럴 클러': {
    note: '엘리트 손톱 중 기술 옵션과 룬워드 조합을 함께 노릴 수 있는 베이스.',
    runewords: ['혼돈', '역병', '분노'],
    specialOptions: ['암살자 핵심 기술 +3과 보조 유효 기술이 같이 붙으면 특급 재료.'],
  },
  '블레이드 보우': {
    note: '빠른 기본 속도와 4홈으로 활용도가 있는 엘리트 활.',
    runewords: ['신뢰', '조화'],
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
    specialOptions: ['아마존 전용 활은 활과 쇠뇌 기술 +3이 붙은 4~5홈 베이스를 우대.'],
  },
  '그랜드 메이트런 보우': {
    note: '아마존 전용 +3 기술과 높은 피해를 함께 노리는 대표 활 베이스.',
    runewords: ['신뢰', '안개'],
    specialOptions: ['신뢰/안개 재료는 활과 쇠뇌 기술 +3 여부가 핵심 가치.'],
  },
  싸이드: {
    note: '낮은 요구치와 빠른 공속으로 저힘 세팅의 무한 재료 후보.',
    runewords: ['무한', '통찰'],
  },
  파르티잔: {
    note: '악몽 구간 통찰용으로 접근하기 쉬운 폴암.',
    runewords: ['통찰', '순종'],
    tag: '맨땅',
  },
  벡드코방: {
    note: '6홈까지 가능하고 중반 용병 무기 재료로 사용.',
    runewords: ['죽음의 숨결', '순종'],
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
    runewords: ['무한', '죽음의 숨결', '긍지', '침묵'],
  },
  '자이언트 쓰레셔': {
    note: '빠른 속도와 6홈을 모두 갖춘 최상급 용병 폴암 후보.',
    runewords: ['무한', '통찰', '긍지', '죽음의 숨결', '침묵'],
  },
  맨캐쳐: {
    note: '빠른 공속과 긴 사거리로 용병 무한 재료 후보가 되는 창 베이스.',
    runewords: ['무한', '순종'],
  },
}

const runewordSocketByName = new Map(
  runewords.flatMap((runeword) =>
    runewordDisplayNames(runeword.이름).map((name) => [name, runeword['소켓 수']] as const),
  ),
)

const mercenaryArmorBases = new Set([
  '더스크 슈라우드',
  '스캐럽 허스크',
  '와이어 플리스',
  '그레이트 허버크',
  '아콘 플레이트',
  '세이크리드 아머',
])

const mercenaryHelmBases = new Set(['데스 마스크', '데몬헤드', '본 비지즈'])


export function NormalItemsPage() {
  const [searchParams] = useSearchParams()
  const incomingSearchQuery = readPageSearchQuery(searchParams)
  const initialSearchState = useMemo(() => resolveNormalSearchState(incomingSearchQuery), [incomingSearchQuery])
  const lastAppliedSearchQuery = useRef(incomingSearchQuery)
  const [selectedCategory, setSelectedCategory] = useState<NormalItemCategory>(initialSearchState.category)
  const [selectedGrade, setSelectedGrade] = useState<NormalItemGradeFilter>('전체')
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationFilter>('전체')
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
  const weaponItemsByType = useMemo(() => getWeaponItemsByType(), [])
  const selectedWeaponItems = useMemo(
    () => weaponItemsByType[selectedWeaponType] ?? [],
    [selectedWeaponType, weaponItemsByType],
  )
  const sortOptions =
    selectedCategory === '무기'
      ? isBowWeaponType(selectedWeaponType)
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
          ? selectedWeaponItems
          : []

    const gradeRows = sourceItems
      .filter((item) => (selectedGrade === '전체' ? true : item.등급 === selectedGrade))
      .filter((item) => recommendationMatches(getNormalItemRecommendationTag(item), selectedRecommendation))

    return searchItemsByQuery(gradeRows, nameQuery, normalItemSearchText)
      .toSorted((left, right) => sortNormalItems(left, right, activeSortType))
  }, [activeSortType, armorItems, beltItems, bootItems, gloveItems, helmItems, nameQuery, paladinShieldItems, selectedCategory, selectedGrade, selectedRecommendation, selectedShieldType, selectedWeaponItems, shieldItems])

  useEffect(() => {
    if (incomingSearchQuery === lastAppliedSearchQuery.current) {
      return
    }

    const nextSearchState = resolveNormalSearchState(incomingSearchQuery)
    lastAppliedSearchQuery.current = incomingSearchQuery
    setSelectedCategory(nextSearchState.category)
    setSelectedGrade('전체')
    setSelectedRecommendation('전체')
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
        ? selectedWeaponItems.length
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

          <div className="normal-grade-filter">
            <span>추천</span>
            <div>
              {recommendationFilters.map((filter) => (
                <button
                  className={filter === selectedRecommendation ? 'is-active' : ''}
                  key={filter}
                  onClick={() => setSelectedRecommendation(filter)}
                  type="button"
                >
                  {filter}
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

  const matchingEntry = searchItemsByQuery(normalSearchStateEntries(), trimmedQuery, (entry) =>
    normalItemSearchText(entry.row),
  )[0]

  if (matchingEntry) {
    return {
      ...defaultState,
      category: matchingEntry.category,
      shieldType: matchingEntry.shieldType ?? defaultState.shieldType,
      weaponType: matchingEntry.weaponType ?? defaultState.weaponType,
    }
  }

  return defaultState
}

function normalSearchStateEntries(): Array<{
  category: NormalItemCategory
  row: NormalListItem
  shieldType?: NormalShieldTypeFilter
  weaponType?: NormalWeaponTypeFilter
}> {
  const groups: Array<{
    category: NormalItemCategory
    rows: NormalListItem[]
    shieldType?: NormalShieldTypeFilter
    weaponType?: NormalWeaponTypeFilter
  }> = [
    { category: '투구', rows: getHelmBaseRows() },
    { category: '갑옷', rows: getArmorBaseRows() },
    { category: '장갑', rows: getGloveBaseRows() },
    { category: '벨트', rows: getBeltBaseRows() },
    { category: '신발', rows: getBootBaseRows() },
    { category: '방패', shieldType: '팔라딘 방패', rows: getShieldBaseRows(shieldPaladinBases) },
    { category: '방패', shieldType: '일반 방패', rows: getShieldBaseRows(shieldBases) },
    ...normalWeaponBaseSources.map(({ data, itemFilter, type }) => ({
      category: '무기' as NormalItemCategory,
      weaponType: type,
      rows: getWeaponBaseRows(data, type, itemFilter),
    })),
  ]

  return groups.flatMap(({ rows, ...group }) => rows.map((row) => ({ ...group, row })))
}

function normalItemSearchText(item: NormalListItem) {
  const recommendationTag = getNormalItemRecommendationTag(item)
  const recommendationTip = recommendedItemTips[item.이름]

  return [
    item.이름,
    item.영문명 ?? '',
    item.등급,
    item.카테고리,
    isWeaponItemRow(item) ? item.계열 : '',
    isWeaponItemRow(item) ? `베이스공속 ${item.베이스공속}` : '',
    isArmorItemRow(item) ? item.무게 ?? '' : '',
    item.전용 ?? '',
    recommendationTag ?? '',
    recommendationTip?.note ?? '',
    recommendationTip?.runewords.join(' ') ?? '',
    recommendationTip?.specialOptions?.join(' ') ?? '',
  ].join(' ')
}

function getNormalItemRecommendationTag(item: NormalListItem): RecommendationTag | null {
  if (!item.추천) {
    return null
  }

  return recommendedItemTips[item.이름]?.tag ?? '추천'
}

function recommendationMatches(tag: RecommendationTag | null, filter: RecommendationFilter) {
  return filter === '전체' ? true : tag === filter
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
      header: <RequiredStrengthHeaderTip />,
      className: 'normal-item-col-strength',
      render: (item) => <RequiredStatCell label="필요힘" value={item.필요힘} />,
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
      header: <RequiredStrengthHeaderTip />,
      className: 'normal-item-col-strength',
      render: (item) => <RequiredStatCell label="필요힘" value={item.필요힘} />,
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
      header: <RequiredStrengthHeaderTip />,
      className: 'normal-item-col-strength',
      render: (item) => <RequiredStatCell label="필요힘" value={item.필요힘} />,
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
      header: '데미지',
      className: 'normal-item-col-damage',
      render: (item) => <WeaponDamageCell damage={item.양손데미지} />,
    },
    {
      key: 'average-damage',
      header: <SpeedAdjustedDamageHeaderTip />,
      className: 'normal-item-col-damage-average',
      render: (item) => <SpeedAdjustedDamageCell item={item} />,
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
      header: <RequiredStrengthHeaderTip />,
      className: 'normal-item-col-strength',
      render: (item) => <RequiredStatCell label="필요힘" value={item.필요힘} />,
    },
    {
      key: 'dexterity',
      header: <RequiredDexterityHeaderTip />,
      className: 'normal-item-col-dexterity',
      render: (item) => <RequiredStatCell label="필요민첩" value={item.필요민첩} />,
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
  const iasFrame = bowIasFrameByName.get(item.이름)

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
  const tag = tip.tag ?? '추천'

  return (
    <FloatingTooltip
      cardClassName="recommend-tip-card"
      content={<RecommendTipContent item={item} tip={tip} />}
      triggerClassName="recommend-tip-trigger"
    >
      <span
        className={[
          'normal-item-recommend',
          tag === '맨땅' ? 'is-starter' : '',
        ].filter(Boolean).join(' ')}
      >
        {tag}
      </span>
    </FloatingTooltip>
  )
}

function RecommendTipContent({ item, tip }: { item: NormalListItem; tip: RecommendedItemTip }) {
  const demonologistTip = recommendedDemonologistTip(item)
  const mercenaryTip = demonologistTip ? null : recommendedMercenaryTip(item)
  const etherealTip = recommendedEtherealTip(item, mercenaryTip, demonologistTip)
  const strengthTip = recommendedStrengthTip(item)
  const specialOptionTips = recommendedSpecialOptionTips(item, tip)

  return (
    <>
      <strong>{item.이름}</strong>
      <span>{tip.note}</span>
      {demonologistTip ? (
        <span>
          <b>악마술사</b>
          {demonologistTip}
        </span>
      ) : null}
      {specialOptionTips.length > 0 ? (
        <span className="recommend-tip-runewords">
          <b>특급 옵션</b>
          <span>{specialOptionTips.join(' ')}</span>
        </span>
      ) : null}
      {mercenaryTip ? (
        <span>
          <b>용병</b>
          {mercenaryTip}
        </span>
      ) : null}
      {etherealTip ? (
        <span>
          <b>에테</b>
          {etherealTip}
        </span>
      ) : null}
      {strengthTip ? (
        <span>
          <b>요구힘</b>
          {strengthTip}
        </span>
      ) : null}
      {tip.runewords.length > 0 ? (
        <span className="recommend-tip-runewords">
          <b>대표 룬워드</b>
          <span>{tip.runewords.map(formatRecommendedRuneword).join(', ')}</span>
        </span>
      ) : null}
    </>
  )
}

function recommendedSpecialOptionTips(item: NormalListItem, tip: RecommendedItemTip) {
  const tips = [...(tip.specialOptions ?? [])]

  if (!isWeaponItemRow(item)) {
    return tips
  }

  if (item.계열 === '홀') {
    tips.push('홀은 성기사 개별 기술이 붙을 수 있어, 목적 빌드의 핵심 기술 +3 여부를 확인.')
  }

  if (item.계열 === '완드') {
    tips.push('완드는 강령술사 개별 기술이 붙을 수 있어, 순백/전용 빌드용 핵심 기술 +3 조합을 우대.')
  }

  if (item.계열 === '지팡이') {
    tips.push('지팡이는 원소술사 개별 기술이 붙을 수 있어, 잎새/기억 등은 목적 기술 +3 여부가 중요.')
  }

  if (item.계열 === '손톱') {
    tips.push('손톱은 암살자 개별 기술이 붙을 수 있어, 주력 기술과 보조 기술이 같이 붙으면 가치 상승.')
  }

  if (item.계열 === '오브') {
    tips.push('오브는 원소술사 개별 기술이 붙을 수 있어, 주력 원소 기술 +3 조합을 우대.')
  }

  if (item.계열 === '아마존 활') {
    tips.push('아마존 전용 활은 활과 쇠뇌 기술 +3 자동 옵션이 붙은 베이스를 우대.')
  }

  if (item.계열 === '아마존 전용') {
    tips.push('아마존 전용 무기는 해당 기술 계열 +3 자동 옵션이 붙은 베이스를 우대.')
  }

  return [...new Set(tips)]
}

function recommendedDemonologistTip(item: NormalListItem) {
  if (isWeaponItemRow(item) && (item.이름 === '아콘 스태프' || item.이름 === '쉴레일리')) {
    return '에테리얼 4홈 통찰 베이스로 선호.'
  }

  return null
}

function recommendedMercenaryTip(item: NormalListItem) {
  if (isWeaponItemRow(item)) {
    if (item.계열 === '폴암' || item.계열 === '창' || item.이름 === '맨캐쳐') {
      return '2막 용병 주력 베이스.'
    }

    if (item.계열 === '일반 활') {
      return '1막 용병용으로도 선택 가능.'
    }

    return null
  }

  if (item.카테고리 === '갑옷') {
    return mercenaryArmorBases.has(item.이름) ? '용병 방어구로도 선호.' : null
  }

  if (item.카테고리 === '투구') {
    return mercenaryHelmBases.has(item.이름) ? '치료 등 3홈 용병 투구로 활용.' : null
  }

  return null
}

function recommendedEtherealTip(item: NormalListItem, mercenaryTip: string | null, demonologistTip: string | null) {
  if (demonologistTip) {
    return null
  }

  if (item.이름 === '모너크') {
    return '본체 소집 스왑용 영혼은 에테리얼도 선호.'
  }

  if (isWeaponItemRow(item) && isBowWeaponType(item.계열)) {
    return null
  }

  if (mercenaryTip) {
    return '용병용이면 에테리얼 선호.'
  }

  return null
}

function recommendedStrengthTip(item: NormalListItem) {
  if (item.필요힘 === null || item.필요힘 === undefined) {
    return '요구힘 부담이 낮은 초반 베이스.'
  }

  const similarItems = comparableStrengthItems(item)
  const strengthValues = similarItems
    .map((similarItem) => similarItem.필요힘)
    .filter((strength): strength is number => strength !== null && strength !== undefined)

  if (strengthValues.length < 2) {
    return null
  }

  const sortedStrengths = strengthValues.toSorted((left, right) => left - right)
  const medianStrength = sortedStrengths[Math.floor(sortedStrengths.length / 2)]

  if (item.필요힘 <= medianStrength) {
    return `요구힘 ${item.필요힘}로 유사 베이스 대비 낮은 편.`
  }

  return null
}

function comparableStrengthItems(item: NormalListItem): NormalListItem[] {
  if (isWeaponItemRow(item)) {
    const weaponBasesByType = getWeaponItemsByType()

    return (weaponBasesByType[item.계열] ?? []).filter((candidate) => candidate.등급 === item.등급)
  }

  const armorBasesByCategory: Partial<Record<NormalItemCategory, ArmorBases[]>> = {
    갑옷: [armorBases],
    방패: [shieldBases, shieldPaladinBases],
    투구: [helmBases],
  }

  return (armorBasesByCategory[item.카테고리] ?? [])
    .flatMap((data) => getDefensiveBaseRows(data))
    .filter((candidate) => candidate.등급 === item.등급)
}

function formatRecommendedRuneword(name: string) {
  const socketCount = runewordSocketByName.get(name) ?? runewordSocketByName.get(normalizeRecommendedRunewordName(name))

  return socketCount ? `${name}(${socketCount})` : name
}

function runewordDisplayNames(name: string) {
  const parsedName = parseRecommendedRunewordName(name)
  const names = [parsedName.primary, ...parsedName.aliases].filter(Boolean)

  return [...new Set(names.flatMap((displayName) => [displayName, normalizeRecommendedRunewordName(displayName)]))]
}

function normalizeRecommendedRunewordName(name: string) {
  return name.replace(/\s+/g, '')
}

function parseRecommendedRunewordName(name: string) {
  const normalizedName = name.replace(/\s+/g, ' ').trim()
  const bracketMatch = normalizedName.match(/^(.*?)\s*(?:\[|\()([^\])]+)(?:\]|\))\s*$/)
  const primarySource = (bracketMatch?.[1] ?? normalizedName).trim()
  const content = (bracketMatch?.[2] ?? '').trim()
  const [primary, ...inlineAliases] = primarySource
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
  const aliases = [
    ...inlineAliases,
    ...content
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.startsWith('구:'))
      .flatMap((part) => part.replace(/^구:\s*/, '').split('/'))
      .map((part) => part.trim())
      .filter(Boolean),
  ]

  return {
    aliases,
    primary: primary || normalizedName,
  }
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
        추천: item.추천 || Boolean(recommendedItemTips[item.이름]),
        id: `${data.category}-${section.id}-${item.이름}`,
        등급: section.grade,
        카테고리: data.category as NormalItemCategory,
      })),
    )
}

function getWeaponBaseRows(
  data: WeaponBases,
  typeOverride?: NormalWeaponTypeFilter,
  itemFilter: (item: WeaponBaseItem) => boolean = () => true,
): WeaponItemRow[] {
  const weaponType = typeOverride ?? data.type

  return data.sections.flatMap((section) =>
    section.items.filter(itemFilter).map((item) => ({
      ...item,
      추천: item.추천 || Boolean(recommendedItemTips[item.이름]),
      id: `${weaponType}-${section.id}-${item.이름}`,
      등급: section.grade,
      계열: weaponType,
      카테고리: '무기',
    })),
  )
}

function getWeaponItemsByType(): Partial<Record<NormalWeaponTypeFilter, WeaponItemRow[]>> {
  return Object.fromEntries(
    normalWeaponBaseSources.map(({ data, itemFilter, type }) => [type, getWeaponBaseRows(data, type, itemFilter)]),
  ) as Partial<Record<NormalWeaponTypeFilter, WeaponItemRow[]>>
}

function isBowWeaponType(type: NormalWeaponTypeFilter) {
  return type === '활' || type === '일반 활' || type === '아마존 활'
}

function isRegularBowItem(item: WeaponBaseItem) {
  return item.전용 !== '아마존 전용'
}

function isAmazonBowItem(item: WeaponBaseItem) {
  return item.전용 === '아마존 전용'
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

function RequiredStrengthHeaderTip() {
  return (
    <FloatingTooltip
      cardClassName="info-tip-card"
      content={
        <>
          <strong>필요힘</strong>
          <span>아이템 착용에 필요한 힘 수치입니다.</span>
          <span>에테리얼 장비는 힘/민첩 요구치가 각각 10 감소합니다.</span>
        </>
      }
      triggerClassName="info-tip-trigger"
    >
      <span>필요힘*</span>
    </FloatingTooltip>
  )
}

function RequiredDexterityHeaderTip() {
  return (
    <FloatingTooltip
      cardClassName="info-tip-card"
      content={
        <>
          <strong>필요민첩</strong>
          <span>아이템 착용에 필요한 민첩 수치입니다.</span>
          <span>에테리얼 장비는 힘/민첩 요구치가 각각 10 감소합니다.</span>
        </>
      }
      triggerClassName="info-tip-trigger"
    >
      <span>필요민첩*</span>
    </FloatingTooltip>
  )
}

function RequiredStatCell({ label, value }: { label: '필요민첩' | '필요힘'; value: number | null | undefined }) {
  if (value === null || value === undefined) {
    return <span className="muted-text">-</span>
  }

  const etherealValue = Math.max(0, value - 10)

  return (
    <FloatingTooltip
      cardClassName="info-tip-card"
      content={
        <>
          <strong>에테리얼 {label}</strong>
          <span>일반: {value}</span>
          <span>에테리얼: {etherealValue}</span>
          <span>감소량: -{value - etherealValue}</span>
        </>
      }
      triggerClassName="info-tip-trigger"
    >
      <strong>{value}</strong>
    </FloatingTooltip>
  )
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

function SpeedAdjustedDamageHeaderTip() {
  return (
    <FloatingTooltip
      cardClassName="info-tip-card"
      content={
        <>
          <strong>공속보정 평균</strong>
          <span>표기 평균 피해에 베이스 공속(WSM)만 반영한 비교 지수입니다.</span>
          <span>낮은 WSM은 빠른 베이스라 더 높은 값으로 보정됩니다.</span>
          <span>실제 DPS는 직업/용병 모션, 기술, IAS, 브레이크포인트에 따라 달라집니다.</span>
        </>
      }
      triggerClassName="info-tip-trigger"
    >
      <span>공속보정 평균*</span>
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

function SpeedAdjustedDamageCell({ item }: { item: WeaponItemRow }) {
  const averageDamage = averageWeaponDamage(item.양손데미지)

  if (averageDamage === null) {
    return <span className="muted-text">-</span>
  }

  const multiplier = baseSpeedDamageMultiplier(item.베이스공속)
  const adjustedDamage = averageDamage * multiplier

  return (
    <FloatingTooltip
      cardClassName="info-tip-card"
      content={
        <>
          <strong>공속보정 평균</strong>
          <span>표기 평균 피해: {formatCompactDecimal(averageDamage)}</span>
          <span>베이스 공속: {formatBaseSpeed(item.베이스공속)}</span>
          <span>보정 배율: x{formatCompactDecimal(multiplier)}</span>
          <span>계산: 평균 피해 x (100 - 베이스공속) / 100</span>
          <span>실제 공격 프레임 기반 DPS가 아닌 베이스 비교용 값입니다.</span>
        </>
      }
      triggerClassName="info-tip-trigger"
    >
      <strong>{formatCompactDecimal(adjustedDamage)}</strong>
    </FloatingTooltip>
  )
}

function averageWeaponDamage(damage: WeaponBaseItem['양손데미지']) {
  if (damage.최소 === null || damage.최대 === null) {
    return damage.평균
  }

  return (damage.최소 + damage.최대) / 2
}

function baseSpeedDamageMultiplier(baseSpeed: number) {
  return (100 - baseSpeed) / 100
}

function formatCompactDecimal(value: number) {
  return Number(value.toFixed(1)).toLocaleString('ko-KR')
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




