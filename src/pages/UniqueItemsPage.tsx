import { useEffect, useMemo, useRef, useState } from 'react'
import { PackageSearch } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { FloatingTooltip } from '../components/FloatingTooltip'
import { ItemDataTable, type ItemDataTableColumn } from '../components/ItemDataTable'
import { OptionAlternative } from '../components/OptionAlternative'
import { OptionList } from '../components/OptionList'
import { PageHeading } from '../components/PageHeading'
import {
  RecommendationBadge,
  type RecommendationFilter,
  type RecommendationInfo,
  type RecommendationTag,
} from '../components/RecommendationBadge'
import { FilterPanel, NameSearch, SegmentedFilter, SortControl, TableToolbar } from '../components/TableControls'
import { uniqueItems } from '../shared/gameData'
import { readPageSearchQuery } from '../shared/searchNavigation'
import { searchItemsByQuery } from '../shared/searchUtils'
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
const uniqueRecommendationFilters: Exclude<RecommendationFilter, '전체'>[] = ['추천', '맨땅', '용병']
const uniqueSortOptions: Array<{ value: UniqueItemSortType; label: string }> = [
  { value: 'level-asc', label: '레벨제한 오름차순' },
  { value: 'level-desc', label: '레벨제한 내림차순' },
  { value: 'name-asc', label: '이름순' },
]

const uniqueItemRecommendations: Record<string, RecommendationInfo> = {
  어나이얼러스: {
    tag: '추천',
    note: '능력치, 저항, 경험치 보너스를 동시에 주는 최상급 범용 차암.',
  },
  '지옥불 횃불': {
    tag: '추천',
    note: '직업 기술과 능력치/저항을 크게 올리는 엔드게임 핵심 차암.',
  },
  '기드의 행운': {
    tag: '추천',
    note: '매찬과 상점 할인 때문에 파밍 캐릭터가 자주 챙기는 거대 부적.',
  },
  '칠흑의 천공': {
    tag: '추천',
    note: '마법 면역 파괴용 차암. 마법 피해 빌드에서 선택지.',
  },
  '뼈의 분쇄': {
    tag: '추천',
    note: '물리 면역 파괴용 차암. 물리 빌드가 사냥 범위를 넓힐 때 사용.',
  },
  '불길의 균열': {
    tag: '추천',
    note: '화염 면역 파괴용 차암. 화염 빌드의 사냥 지역 확장에 사용.',
  },
  '추위의 파열': {
    tag: '추천',
    note: '냉기 면역 파괴용 차암. 냉기 소서리스 등에게 가치가 높음.',
  },
  '천상의 틈': {
    tag: '추천',
    note: '번개 면역 파괴용 차암. 번개 빌드의 핵심 선택지.',
  },
  '부패의 분열': {
    tag: '추천',
    note: '독 면역 파괴용 차암. 독 빌드의 사냥 범위를 넓힘.',
  },
  '새로워진 추위의 파열': {
    tag: '추천',
    note: '냉기 면역 파괴와 추가 옵션 선택지가 붙은 신규 파괴참.',
  },
  '새로워진 불길의 균열': {
    tag: '추천',
    note: '화염 면역 파괴와 추가 옵션 선택지가 붙은 신규 파괴참.',
  },
  '새로워진 천상의 틈': {
    tag: '추천',
    note: '번개 면역 파괴와 추가 옵션 선택지가 붙은 신규 파괴참.',
  },
  '새로워진 부패의 분열': {
    tag: '추천',
    note: '독 면역 파괴와 추가 옵션 선택지가 붙은 신규 파괴참.',
  },
  '새로워진 칠흑의 천공': {
    tag: '추천',
    note: '마법 면역 파괴와 추가 옵션 선택지가 붙은 신규 파괴참.',
  },
  '새로워진 뼈의 분쇄': {
    tag: '추천',
    note: '물리 면역 파괴와 추가 옵션 선택지가 붙은 신규 파괴참.',
  },
  '무지개 자락': {
    tag: '추천',
    note: '원소 피해와 적 저항 감소가 붙는 대표 유니크 주얼.',
    details: ['원소 빌드의 투구/갑옷/무기/방패 홈작 후보.'],
  },
  '혼령 파편': {
    tag: '맨땅',
    note: '시전 속도와 저항이 붙어 초반 캐스터 무기로 쓰기 좋음.',
  },
  '마법사의 쐐기검': {
    tag: '추천',
    note: '높은 시전 속도, 마나, 모든 저항으로 캐스터 생존 세팅에 강함.',
  },
  살점갈퀴: {
    tag: '추천',
    note: '강타, 치명타, 상처 악화가 붙어 보스전 물리 딜러에게 유용.',
  },
  '알리바바의 칼날': {
    tag: '추천',
    note: '레벨 비례 매찬/골드 증가로 스왑 파밍 무기로 사용.',
  },
  머리분쇄기: {
    tag: '추천',
    note: '레벨 비례 치명타와 높은 피해로 초중반 물리 무기로 강함.',
  },
  '푸른 서슬': {
    tag: '추천',
    note: '마법/냉기 피해와 성역 오라로 물리 면역 대응에 가치가 있음.',
  },
  라이트세이버: {
    tag: '추천',
    note: '공속, 번개 흡수, 마법 피해가 붙은 쌍수/질딘용 후보.',
  },
  궤멸자: {
    tag: '추천',
    note: '높은 피해와 모든 기술 보너스로 물리 캐릭터 무기 후보.',
  },
  '도살자의 제자': {
    tag: '맨땅',
    note: '공속과 치명타가 좋아 악몽 구간 물리 무기로 쓰기 좋음.',
  },
  '죽음 가르개': {
    tag: '추천',
    note: '공속, 치명타, 방어 무시가 붙은 강력한 한손 도끼.',
  },
  아른날: {
    tag: '추천',
    note: '원소 피해와 수량 자동 회복으로 투척 야만용사 후보.',
  },
  '사신의 종소리': {
    tag: '용병',
    note: '노화 발동과 생명력 훔침으로 2막 용병 무기 최상급 후보.',
    details: ['에테리얼이면 용병용 가치가 더 높음.'],
  },
  '무덤 강탈자': {
    tag: '용병',
    note: '소켓, 저항, 매찬, 높은 피해가 붙은 강력한 미늘창.',
    details: ['에테리얼 3홈은 용병 무기로 특히 가치가 높음.'],
  },
  뼈자르개: {
    tag: '용병',
    note: '소켓과 높은 피해로 초중반 용병 무기 후보.',
  },
  '바르툭의 목 따개': {
    tag: '추천',
    note: '암살자 기술, 공속, 능력치가 붙은 대표 손톱.',
  },
  '비취 발톱': {
    tag: '추천',
    note: '암살자 기술과 높은 저항으로 안정성을 챙기기 좋음.',
  },
  '눈보라 포': {
    tag: '맨땅',
    note: '관통과 냉기 피해가 좋아 초중반 활/쇠뇌 진행용으로 강함.',
  },
  '악마의 기계': {
    tag: '추천',
    note: '폭발 화살과 관통 세팅으로 인챈트 빌드에 쓰이는 쇠뇌.',
  },
  늑골분쇄기: {
    tag: '추천',
    note: '강타와 빠른 공속으로 변신 드루이드 보스딜 무기로 유명.',
  },
  '자해의 가지': {
    tag: '추천',
    note: '시전 속도와 모든 기술 보너스로 초중반 캐스터 무기로 우수.',
  },
  망울: {
    tag: '추천',
    note: '소서리스 기술, 시전 속도, 매찬이 붙은 대표 파밍 무기.',
  },
  '죽음의 깊이': {
    tag: '추천',
    note: '냉기 기술 피해가 붙어 냉기 소서리스 최상급 무기 후보.',
  },
  '죽음의 거미줄': {
    tag: '추천',
    note: '독 저항 감소와 독 기술 보너스로 독 강령술사 핵심 무기.',
  },
  '거인의 복수': {
    tag: '추천',
    note: '투창 아마존의 대표 무기. 기술, 달리기, 능력치, 수량 회복이 강점.',
  },
  천둥일격: {
    tag: '추천',
    note: '번개 투창 아마존의 고화력 무기 후보.',
  },
  '마녀림의 시위': {
    tag: '추천',
    note: '치명타, 저항, 증폭 피해 발동으로 물리 활아마가 활용 가능.',
  },
  '황금일격 활': {
    tag: '추천',
    note: '공속과 악마/언데드 피해 보너스로 사냥용 활 후보.',
  },
  수리뿔: {
    tag: '추천',
    note: '높은 피해와 명중률 보너스로 활아마 무기 후보.',
  },
  바람살: {
    tag: '추천',
    note: '높은 물리 피해와 넉백으로 대표적인 유니크 활.',
  },
  분쇄테: {
    tag: '맨땅',
    note: '강타가 붙어 초반 보스전용 스왑 무기로 쓰기 쉬움.',
  },
  뼈절단기: {
    tag: '맨땅',
    note: '강타와 높은 피해로 악몽 구간 양손 무기 후보.',
  },
  폭풍채찍: {
    tag: '추천',
    note: '공속, 강타, 전자기장 발동으로 질딘/킥씬 등에게 강력.',
  },
  '천상의 빛': {
    tag: '추천',
    note: '기술, 공속, 강타, 소켓이 붙은 성기사 무기 후보.',
  },
  구원자: {
    tag: '추천',
    note: '성기사 전투 기술과 높은 피해 보너스로 슴딘/질딘 후보.',
  },
  타른헬름: {
    tag: '맨땅',
    note: '기술과 매찬이 붙어 초반 캐스터/파밍 투구로 사용.',
  },
  '평민의 왕관': {
    tag: '맨땅',
    note: '기술, 달리기, 생명력/마나가 붙은 초중반 범용 투구.',
  },
  바위막이: {
    tag: '맨땅',
    note: '저항과 피해 감소, 타격 회복이 붙어 초중반 생존 투구로 좋음.',
  },
  '흡혈귀의 눈길': {
    tag: '용병',
    note: '피해 감소와 흡혈이 붙어 물리 캐릭터/용병 투구로 사용.',
  },
  '할리퀸 관모': {
    tag: '추천',
    note: '모든 기술, 생명력/마나, 피해 감소, 매찬이 붙은 대표 범용 투구.',
  },
  '밤날개의 너울': {
    tag: '추천',
    note: '냉기 기술 피해가 붙어 냉기 빌드 핵심 투구 후보.',
  },
  '시대의 왕관': {
    tag: '추천',
    note: '피해 감소, 저항, 소켓이 붙은 고급 생존 투구.',
  },
  '안다리엘의 두개골': {
    tag: '용병',
    note: '공속, 생명력 훔침, 힘, 기술 보너스로 용병 투구 대표 후보.',
    details: ['에테리얼이면 용병용 가치가 높음.'],
  },
  '키라의 수호자': {
    tag: '용병',
    note: '높은 모든 저항과 빙결 방지로 용병 생존 세팅에 유용.',
  },
  '그리폰의 눈': {
    tag: '추천',
    note: '번개 기술 피해와 적 번개 저항 감소로 번개 빌드 핵심 투구.',
  },
  '아리앗의 얼굴': {
    tag: '추천',
    note: '야만용사 기술, 저항, 능력치, 흡혈이 붙은 대표 야만 투구.',
  },
  '잘랄의 갈기': {
    tag: '추천',
    note: '드루이드 기술, 저항, 능력치가 붙은 대표 드루이드 투구.',
  },
  '독사마술사의 가죽': {
    tag: '추천',
    note: '기술, 시전 속도, 모든 저항이 붙은 캐스터 대표 갑옷.',
  },
  '장대막이': {
    tag: '용병',
    note: '피해 감소가 높아 물리 피해가 아픈 구간의 용병 갑옷으로 사용.',
  },
  '두리엘의 껍질': {
    tag: '용병',
    note: '저항, 힘, 빙결 방지가 붙어 초중반 본체/용병 갑옷으로 좋음.',
  },
  '스쿨더의 분노': {
    tag: '추천',
    note: '레벨 비례 매찬과 기술 보너스로 파밍 갑옷 후보.',
  },
  '수호 천사': {
    tag: '용병',
    note: '최대 저항 증가로 원소 피해 대응용 용병 갑옷으로 사용.',
  },
  '쿠에 히간의 지혜': {
    tag: '맨땅',
    note: '기술, 시전 속도, 타격 회복이 붙은 초중반 캐스터 갑옷.',
  },
  '오르무스의 장포': {
    tag: '추천',
    note: '원소 기술 피해와 시전 속도로 소서리스 화력 세팅에 사용.',
  },
  폭풍막이: {
    tag: '추천',
    note: '높은 피해 감소와 블럭 성능으로 물리 피해 대응 방패의 대표.',
  },
  '모저의 축복받은 고리': {
    tag: '맨땅',
    note: '소켓과 모든 저항으로 초중반 저항 보강 방패로 좋음.',
  },
  '각성의 벽': {
    tag: '맨땅',
    note: '기술과 시전 속도가 붙은 초중반 캐스터 방패.',
  },
  '자카룸의 전령': {
    tag: '추천',
    note: '성기사 기술, 저항, 막기 성능이 뛰어난 대표 팔라딘 방패.',
  },
  호문쿨루스: {
    tag: '추천',
    note: '강령술사 기술, 저항, 막기 성능이 좋은 대표 네크 방패.',
  },
  피주먹: {
    tag: '맨땅',
    note: '타격 회복과 생명력이 좋아 초반 생존 장갑으로 우수.',
  },
  '행운의 장갑': {
    tag: '추천',
    note: '매찬과 골드 증가로 파밍 캐릭터가 자주 사용하는 장갑.',
  },
  마수: {
    tag: '추천',
    note: '시전 속도와 화염 기술 보너스로 캐스터 대표 장갑.',
  },
  서리불꽃: {
    tag: '추천',
    note: '마나 최대치 증가로 마나 수급이 필요한 캐스터가 사용.',
  },
  '드라쿨의 손아귀': {
    tag: '추천',
    note: '생명력 추출 발동으로 슴딘/물리 근접 세팅에서 강력.',
  },
  레니모: {
    tag: '맨땅',
    note: '마나 재생과 저항이 붙어 초반 캐스터 허리띠로 사용.',
  },
  '금박 허리띠': {
    tag: '추천',
    note: '매찬과 공속이 붙어 파밍/공격 세팅에서 자주 사용.',
  },
  '귀 꿰미': {
    tag: '추천',
    note: '피해 감소와 흡혈이 붙어 물리 생존 허리띠로 유용.',
  },
  서슬꼬리: {
    tag: '추천',
    note: '관통 공격 보너스로 활아마/투창아마 세팅에서 핵심 허리띠.',
  },
  '천둥신의 박력': {
    tag: '추천',
    note: '번개 흡수와 힘/활력 보너스로 번개 피해 대응에 강함.',
  },
  '노스페라투의 고리': {
    tag: '추천',
    note: '공속과 생명력 훔침으로 공격 세팅 허리띠 후보.',
  },
  '베르둔고의 튼튼한 노끈': {
    tag: '추천',
    note: '피해 감소와 활력 보너스로 근접 생존 세팅에 강함.',
  },
  '거미 그물띠': {
    tag: '추천',
    note: '모든 기술과 시전 속도가 붙은 캐스터 최상급 허리띠.',
  },
  다혈질: {
    tag: '맨땅',
    note: '화염 저항 최대치가 높아 초반 특정 구간 대응용으로 유용.',
  },
  '고블린 발가락': {
    tag: '맨땅',
    note: '강타가 붙어 초반 보스전용 신발로 가치가 높음.',
  },
  물나그네: {
    tag: '추천',
    note: '달리기, 생명력, 민첩이 붙은 범용 신발 후보.',
  },
  '전쟁 여행자': {
    tag: '추천',
    note: '매찬과 피해 보너스로 파밍 캐릭터의 대표 신발.',
  },
  '선혈 기수': {
    tag: '추천',
    note: '강타, 치명타, 상처 악화가 붙은 물리 딜러 대표 신발.',
  },
  '모래폭풍 여로': {
    tag: '추천',
    note: '타격 회복, 힘/활력, 독 저항이 좋아 범용 생존 신발로 사용.',
  },
  '그림자 춤꾼': {
    tag: '추천',
    note: '암살자 기술과 빠른 달리기, 타격 회복이 붙은 암살자 신발.',
  },
  '나겔링 반지': {
    tag: '맨땅',
    note: '매찬이 붙어 초반 파밍 반지로 사용.',
  },
  '요르단의 반지': {
    tag: '추천',
    note: '모든 기술과 마나 증가가 붙은 대표 캐스터 반지.',
  },
  왜성: {
    tag: '추천',
    note: '화염 흡수와 골드 증가로 특정 사냥/골드 파밍에 유용.',
  },
  '칠흑 서리': {
    tag: '추천',
    note: '빙결 방지, 명중률, 민첩이 붙은 물리 캐릭터 대표 반지.',
  },
  '불카토스의 결혼 반지': {
    tag: '추천',
    note: '기술과 생명력 훔침이 붙은 근접/물리 캐릭터 반지 후보.',
  },
  '자연의 평화': {
    tag: '추천',
    note: '시체 안식 효과로 니흘라탁 등 특정 사냥에서 가치가 높음.',
  },
  '위습 투사기': {
    tag: '추천',
    note: '번개 흡수와 소환 충전 옵션으로 특정 지역 대응에 사용.',
  },
  '고양이 눈': {
    tag: '추천',
    note: '공속, 달리기, 민첩이 붙어 활/물리 캐릭터에게 유용.',
  },
  '아트마의 스카라베': {
    tag: '추천',
    note: '피해 증폭 발동으로 물리 빌드가 물리 면역 대응에 사용.',
  },
  '대군주의 진노': {
    tag: '추천',
    note: '기술, 공속, 레벨 비례 치명타가 붙은 물리 딜러 대표 목걸이.',
  },
  '마라의 만화경': {
    tag: '추천',
    note: '모든 기술, 모든 저항, 능력치가 붙은 대표 범용 목걸이.',
  },
  '금속 격자': {
    tag: '추천',
    note: '높은 명중률과 저항으로 물리 캐릭터 안정성 보강에 사용.',
  },
}

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
  const [selectedRecommendation, setSelectedRecommendation] = useState<Exclude<RecommendationFilter, '전체'> | null>(null)
  const [nameQuery, setNameQuery] = useState(initialSearchState.nameQuery)
  const [sortType, setSortType] = useState<UniqueItemSortType>('level-asc')

  const filteredItems = useMemo(() => {
    const activeQuery = nameQuery.trim()

    const scopedRows = uniqueRows
      .filter((item) => categoryMatches(item, selectedCategory, selectedWeaponCategory, selectedArmorCategory))
      .filter((item) => selectedGrade === '전체' || item.등급 === selectedGrade)
      .filter((item) =>
        selectedRecommendation ? recommendationMatches(getUniqueItemRecommendationTag(item), selectedRecommendation) : true,
      )

    return searchItemsByQuery(scopedRows, activeQuery, uniqueItemSearchText)
      .toSorted((left, right) => sortUniqueItems(left, right, sortType))
  }, [nameQuery, selectedArmorCategory, selectedCategory, selectedGrade, selectedRecommendation, selectedWeaponCategory, sortType])

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

          <div className="normal-grade-filter">
            <span>추천</span>
            <div>
              {uniqueRecommendationFilters.map((filter) => (
                <button
                  className={filter === selectedRecommendation ? 'is-active' : ''}
                  key={filter}
                  onClick={() => setSelectedRecommendation((current) => (current === filter ? null : filter))}
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
          <span className="unique-item-title-line">
            <span className="runeword-name">{item.이름}</span>
            {uniqueItemRecommendations[item.이름] ? (
              <RecommendationBadge
                collisionTargetSelector=".unique-item-tooltip-card.floating-stat-card"
                info={uniqueItemRecommendations[item.이름]}
                title={item.이름}
              />
            ) : null}
          </span>
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
        <span key={value}>{className === 'unique-tooltip-options' ? <OptionAlternative value={value} /> : value}</span>
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

  const matchingItem = searchItemsByQuery(uniqueRows, trimmedQuery, uniqueItemSearchText)[0]

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
  const recommendation = uniqueItemRecommendations[item.이름]

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
    recommendation?.tag ?? '',
    recommendation?.note ?? '',
  ].join(' ')
}

function getUniqueItemRecommendationTag(item: UniqueItemRow): RecommendationTag | null {
  return uniqueItemRecommendations[item.이름]?.tag ?? null
}

function recommendationMatches(tag: RecommendationTag | null, filter: RecommendationFilter) {
  return filter === '전체' ? true : tag === filter
}

function nullableNumber(value: number | null) {
  return value ?? 0
}
