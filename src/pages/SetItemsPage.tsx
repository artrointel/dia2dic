import { useMemo, useState } from 'react'
import { Boxes } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FloatingTooltip } from '../components/FloatingTooltip'
import { ItemDataTable, type ItemDataTableColumn } from '../components/ItemDataTable'
import { OptionList } from '../components/OptionList'
import { PageHeading } from '../components/PageHeading'
import {
  RecommendationBadge,
  type RecommendationFilter,
  type RecommendationInfo,
  type RecommendationTag,
} from '../components/RecommendationBadge'
import { FilterPanel, NameSearch, TableToolbar } from '../components/TableControls'
import { setItems } from '../shared/gameData'
import { readPageSearchQuery } from '../shared/searchNavigation'
import { searchItemsByQuery } from '../shared/searchUtils'
import type { SetItem, SetItemGroup, SetItemRow } from '../shared/appTypes'

const setRecommendationFilters: Exclude<RecommendationFilter, '전체'>[] = ['추천', '맨땅']

const setItemRecommendations: Record<string, RecommendationInfo> = {
  '탈 라샤의 고운 띠': {
    tag: '추천',
    note: '탈 라샤 세트 3피스/풀세트 구성에 들어가는 핵심 허리띠.',
    details: ['소서리스 매찬 세팅과 안정성 확보에 자주 사용.'],
  },
  '탈 라샤의 선고': {
    tag: '추천',
    note: '탈 라샤 세트의 중심 목걸이로 3피스 이상 구성 가치가 높음.',
    details: ['풀세트뿐 아니라 갑옷/벨트와 묶어 매찬 세팅에 활용.'],
  },
  '탈 라샤의 잠들지 않는 눈': {
    tag: '추천',
    note: '탈 라샤 풀세트 소서리스의 무기 슬롯.',
    details: ['원소 숙련 보너스와 세트 효과를 함께 볼 때 가치가 큼.'],
  },
  '탈 라샤의 보호': {
    tag: '추천',
    note: '높은 매찬과 저항으로 탈 라샤 세트에서 가장 선호도 높은 부위.',
    details: ['단품으로도 매찬 갑옷 후보가 되며 세트 조합 가치가 높음.'],
  },
  '탈 라샤의 호라드림 관모': {
    tag: '추천',
    note: '생명력/마나 흡수와 저항이 붙은 안정적인 세트 투구.',
    details: ['초중반 용병 투구나 탈셋 구성품으로 활용.'],
  },
  '기욤의 얼굴': {
    tag: '추천',
    note: '강타/치명타/타격 회복이 모두 좋아 물리 딜러와 보스전에 강함.',
    details: ['슴딘, 킥씬, 용병 보스딜 세팅에서 자주 언급되는 세트 투구.'],
  },
  '위트스탄의 보호구': {
    tag: '추천',
    note: '막기 확률이 매우 높아 저투자 블럭 세팅에 유리한 방패.',
    details: ['피해 감소보다 블럭 효율을 우선할 때 선택지.'],
  },
  '마그누스의 가죽': {
    tag: '추천',
    note: '공속과 명중률 보강이 필요한 물리 캐릭터의 저렴한 장갑 후보.',
  },
  '트래그울의 발톱': {
    tag: '추천',
    note: '시전 속도와 독 기술 보너스가 좋아 독/저주 강령술사에게 유용.',
  },
  '트래그울의 끈': {
    tag: '추천',
    note: '빙결 방지와 생명력 보강이 붙어 강령술사 세트 조합에 가치가 있음.',
  },
  '트래그울의 비늘': {
    tag: '추천',
    note: '강령술사 세트 구성과 독/소환 계열 운용에 쓰이는 갑옷.',
  },
  '나탈랴의 영혼': {
    tag: '추천',
    note: '달리기와 저항이 좋아 암살자뿐 아니라 초중반 이동 장비로도 유용.',
  },
  '나탈랴의 표식': {
    tag: '추천',
    note: '암살자 세트 구성과 빠른 공속 운용에 쓰이는 손톱.',
  },
  '마비나의 얼음 같은 손길': {
    tag: '추천',
    note: '공속과 냉기 피해 보강으로 활아마 세트 구성에 사용.',
  },
  '마비나의 활': {
    tag: '추천',
    note: '마비나 풀세트 활아마의 중심 무기.',
  },
  '불멸왕의 의지': {
    tag: '추천',
    note: '매찬 보석작이 쉬워 야만용사 초중반 파밍 투구로 자주 활용.',
  },
  '불멸왕의 용광로': {
    tag: '추천',
    note: '불멸왕 세트 구성과 힘 보강에 쓰이는 장갑.',
  },
  '불멸왕의 장식띠': {
    tag: '추천',
    note: '저항과 힘 보강이 붙어 불멸왕 세트 조합에 필요한 허리띠.',
  },
  '불멸왕의 기둥': {
    tag: '추천',
    note: '달리기와 생명력 보강이 좋아 불멸왕 세트 구성에 가치가 있음.',
  },
  '불멸왕의 파석추': {
    tag: '추천',
    note: '불멸왕 야만용사의 핵심 무기.',
  },
  안수: {
    tag: '추천',
    note: '공속과 악마 피해 보너스가 워낙 좋아 세트와 무관하게 단품 착용도 강력.',
    details: ['물리 딜러, 활아마, 보스/사냥 세팅에서 널리 쓰이는 장갑.'],
  },
  신조: {
    tag: '추천',
    note: '관통 공격이 필요한 활아마 세팅에서 선택되는 세트 허리띠.',
  },
  '알두르의 진보': {
    tag: '추천',
    note: '달리기, 생명력, 화염 저항이 좋아 드루이드 외에도 범용 신발로 사용.',
  },
  '알두르의 냉랭한 눈길': {
    tag: '추천',
    note: '드루이드 세트 구성에 필요한 무기.',
  },
  '시곤의 전투 장갑': {
    tag: '맨땅',
    note: '시곤 장갑+신발 조합의 공속 보너스로 초반 물리 캐릭터가 자주 사용.',
  },
  '시곤의 챙': {
    tag: '맨땅',
    note: '초반 세트 완성 보너스와 방어 보강용으로 쓰기 쉬운 투구.',
  },
  '시곤의 안식처': {
    tag: '맨땅',
    note: '초반 방어력과 세트 보너스를 챙기기 좋은 갑옷.',
  },
  '시곤의 나막신': {
    tag: '맨땅',
    note: '시곤 장갑과 함께 공속 보너스를 노리는 대표 초반 신발.',
  },
  '시곤의 싸개': {
    tag: '맨땅',
    note: '초반 생존과 세트 조합을 맞추기 쉬운 허리띠.',
  },
  '시곤의 보호구': {
    tag: '맨땅',
    note: '초반 블럭과 세트 보너스 확보에 쓰기 좋은 방패.',
  },
  '천사의 후광': {
    tag: '맨땅',
    note: '천사 목걸이와 함께 착용하면 명중률 보너스가 커서 초반 물리 빌드에 강함.',
  },
  '천사의 날개': {
    tag: '맨땅',
    note: '천사 반지와 묶어 초반 명중률 문제를 해결하는 대표 조합.',
  },
  '죽음의 손': {
    tag: '맨땅',
    note: '죽음의 허리띠와 함께 공속/빙결 방지 조합으로 초반 물리 캐릭터가 사용.',
  },
  '죽음의 경비': {
    tag: '맨땅',
    note: '빙결 방지와 죽음 장갑 조합 보너스 때문에 초반 가치가 높음.',
  },
  '이라타의 목깃': {
    tag: '맨땅',
    note: '이라타 세트 저항 보너스를 맞추기 쉬운 초반 목걸이.',
  },
  '이라타의 소매 장식': {
    tag: '맨땅',
    note: '초반 독 저항과 세트 저항 보너스를 노리는 장갑.',
  },
  '이라타의 고리': {
    tag: '맨땅',
    note: '이라타 세트 구성으로 저항을 크게 보강할 때 사용.',
  },
  '이라타의 노끈': {
    tag: '맨땅',
    note: '초반 저항 세트 조합을 완성하기 쉬운 허리띠.',
  },
  '흐사루스의 무쇠 발꿈치': {
    tag: '맨땅',
    note: '초반 달리기와 세트 명중률 보너스를 노리는 신발.',
  },
  '흐사루스의 무쇠 주먹': {
    tag: '맨땅',
    note: '흐사루스 신발/허리띠 조합의 초반 방어 보강용 방패.',
  },
  '흐사루스의 무쇠 고정대': {
    tag: '맨땅',
    note: '흐사루스 신발과 함께 명중률 보너스를 챙기는 초반 허리띠.',
  },
  '샌더의 사석': {
    tag: '맨땅',
    note: '달리기와 능력치 보강이 좋아 초반 신발로 쓰기 좋음.',
  },
  '샌더의 금기': {
    tag: '맨땅',
    note: '공속과 생명력 보강으로 초반 공격 캐릭터가 쓰기 쉬운 장갑.',
  },
  '비달라의 매복': {
    tag: '맨땅',
    note: '초반 달리기와 활 세트 조합용으로 사용.',
  },
  '극지 장갑': {
    tag: '맨땅',
    note: '극지 세트 조합으로 초반 활 캐릭터가 쓰기 쉬운 장갑.',
  },
  '극지 허리띠': {
    tag: '맨땅',
    note: '초반 활 세트 조합과 저항 보강에 사용.',
  },
  '젖소 왕의 발굽': {
    tag: '맨땅',
    note: '달리기와 민첩 보강이 좋아 초중반 신발로 쓸 만함.',
  },
}

export function SetItemsPage() {
  const [searchParams] = useSearchParams()
  const incomingSearchQuery = readPageSearchQuery(searchParams)
  const lastAppliedSearchQuery = useRef(incomingSearchQuery)
  const [selectedSetId, setSelectedSetId] = useState('전체')
  const [selectedRecommendation, setSelectedRecommendation] = useState<Exclude<RecommendationFilter, '전체'> | null>(null)
  const [nameQuery, setNameQuery] = useState(incomingSearchQuery)
  const canSearchByName = selectedSetId === '전체'
  const setRows = useMemo(
    () =>
      setItems.sets.flatMap((set) =>
        set.items.map((item) => ({
          ...item,
          id: `${set.id}-${item.이름}`,
          세트: set.이름,
          세트완성효과: set.세트효과.완성,
          세트부분효과: set.세트효과.부분,
          세트영문명: set.영문명,
          세트Id: set.id,
        })),
      ),
    [],
  )
  const selectedSet = selectedSetId === '전체' ? null : setItems.sets.find((set) => set.id === selectedSetId) ?? null
  const sortedSetOptions = useMemo(
    () =>
      setItems.sets.toSorted(
        (left, right) =>
          maxSetRequiredLevel(left) - maxSetRequiredLevel(right) ||
          left.이름.localeCompare(right.이름),
      ),
    [],
  )
  const filteredRows = useMemo(() => {
    const activeQuery = canSearchByName ? nameQuery.trim() : ''

    const categoryRows = setRows
      .filter((item) => (selectedSetId === '전체' ? true : item.세트Id === selectedSetId))
      .filter((item) =>
        selectedSetId === '전체' && selectedRecommendation
          ? recommendationMatches(getSetItemRecommendationTag(item), selectedRecommendation)
          : true,
      )

    return searchItemsByQuery(categoryRows, activeQuery, setItemSearchText)
      .toSorted(
        (left, right) =>
          left.세트.localeCompare(right.세트) ||
          nullableNumber(left.요구레벨) - nullableNumber(right.요구레벨) ||
          left.이름.localeCompare(right.이름),
      )
  }, [canSearchByName, nameQuery, selectedRecommendation, selectedSetId, setRows])

  useEffect(() => {
    if (incomingSearchQuery === lastAppliedSearchQuery.current) {
      return
    }

    lastAppliedSearchQuery.current = incomingSearchQuery
    setSelectedSetId('전체')
    setNameQuery(incomingSearchQuery)
  }, [incomingSearchQuery])

  return (
    <section className="normal-items-page set-items-page">
      <PageHeading
        description="트레디아 세트 아이템 사전을 기반으로 세트 구성품과 옵션을 정리합니다."
        eyebrow="아이템 정보"
        icon={Boxes}
        title="세트"
      />

      <TableToolbar>
        <FilterPanel>
          <label className="set-select-control">
            <span>세트</span>
            <select
              value={selectedSetId}
              onChange={(event) => {
                const nextSetId = event.target.value
                setSelectedSetId(nextSetId)

                if (nextSetId !== '전체') {
                  setNameQuery('')
                }
              }}
            >
              <option value="전체">전체</option>
              {sortedSetOptions.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.이름}
                </option>
              ))}
            </select>
          </label>

          {selectedSetId === '전체' && (
            <div className="normal-grade-filter">
              <span>추천</span>
              <div>
                {setRecommendationFilters.map((filter) => (
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
          )}
        </FilterPanel>
      </TableToolbar>

      {canSearchByName && (
        <NameSearch
          label="이름 검색"
          placeholder="예: 시곤, Tal Rasha, 장갑"
          value={nameQuery}
          onChange={setNameQuery}
        />
      )}

      {selectedSet && <SetBonusPanel set={selectedSet} />}

      <SetItemsTable items={filteredRows} headerMeta={`총 ${setRows.length}개 중 ${filteredRows.length}개 표시`} />
    </section>
  )
}

function maxSetRequiredLevel(set: SetItemGroup) {
  const levels = set.items
    .map((item) => item.요구레벨)
    .filter((level): level is number => level !== null && level !== undefined)

  return levels.length > 0 ? Math.max(...levels) : Number.POSITIVE_INFINITY
}

function SetBonusPanel({ set }: { set: SetItemGroup }) {
  return (
    <section className="set-bonus-panel">
      <div>
        <strong>{set.이름}</strong>
        <span>{set.영문명}</span>
      </div>
      <div className="set-bonus-grid">
        <SetBonusList title="부분 세트 효과" values={set.세트효과.부분} variant="complete" />
        <SetBonusList title="완성 세트 효과" values={set.세트효과.완성} variant="complete" />
      </div>
    </section>
  )
}

function SetBonusList({ title, values, variant }: { title: string; values: string[]; variant: 'partial' | 'complete' }) {
  return (
    <div>
      <b>{title}</b>
      {values.length > 0 ? (
        <OptionList className={`set-bonus-list set-bonus-list-${variant}`} items={values} />
      ) : (
        <span className="muted-text">-</span>
      )}
    </div>
  )
}

function SetItemsTable({ items, headerMeta }: { items: SetItemRow[]; headerMeta: string }) {
  const columns: ItemDataTableColumn<SetItemRow>[] = [
    {
      key: 'name',
      header: '이름',
      className: 'normal-item-col-name',
      render: (item) => <SetItemNameCell item={item} />,
    },
    {
      key: 'base',
      header: '베이스/등급',
      className: 'set-item-col-base',
      render: (item) => (
        <span className="set-item-base-grade">
          <span>{item.베이스}</span>
          {item.등급 ? <span>{item.등급}</span> : null}
        </span>
      ),
    },
    {
      key: 'value',
      header: '방어/피해',
      className: 'normal-item-col-defense',
      render: (item) => formatSetPrimaryValue(item),
    },
    {
      key: 'level',
      header: '요구레벨',
      className: 'normal-item-col-level',
      render: (item) => formatNullableNumber(item.요구레벨),
    },
    {
      key: 'requirements',
      header: '요구 힘/민첩',
      className: 'set-item-col-requirements',
      render: (item) => (
        <span className="set-item-requirements">
          {item.필요힘 !== null && item.필요힘 !== undefined ? <span>힘 {item.필요힘}</span> : null}
          {item.필요민첩 !== null && item.필요민첩 !== undefined ? <span>민첩 {item.필요민첩}</span> : null}
        </span>
      ),
    },
    {
      key: 'options',
      header: '옵션',
      className: 'set-item-col-options',
      render: (item) => (
        <OptionList items={[...item.옵션, ...item.부분세트효과]} getItemClassName={setItemOptionClassName} />
      ),
    },
  ]

  return (
    <ItemDataTable
      columns={columns}
      emptyMessage="세트 아이템 데이터가 없습니다."
      fillColumnKey="options"
      getRowKey={(item) => item.id}
      header={{ meta: headerMeta }}
      items={items}
      pageSize={7}
      widthMode="content"
    />
  )
}

function setItemSearchText(item: SetItemRow) {
  const recommendation = setItemRecommendations[item.이름]

  return [
    item.세트,
    item.세트영문명,
    item.이름,
    item.영문명,
    item.베이스,
    item.옵션.join(' '),
    item.부분세트효과.join(' '),
    item.세트부분효과.join(' '),
    item.세트완성효과.join(' '),
    recommendation?.tag ?? '',
    recommendation?.note ?? '',
  ].join(' ')
}

function getSetItemRecommendationTag(item: SetItemRow): RecommendationTag | null {
  return setItemRecommendations[item.이름]?.tag ?? null
}

function recommendationMatches(tag: RecommendationTag | null, filter: RecommendationFilter) {
  return filter === '전체' ? true : tag === filter
}

function SetItemNameCell({ item }: { item: SetItemRow }) {
  const card = (
    <span className="set-complete-bonus-card" role="tooltip">
      <strong>{item.세트}</strong>
      <span>{item.세트영문명}</span>
      <b>부분 세트 효과</b>
      {item.세트부분효과.length > 0 ? (
        <OptionList className="set-bonus-list set-bonus-list-complete" items={item.세트부분효과} />
      ) : (
        <span className="muted-text">정보 없음</span>
      )}
      <b>완성 세트 효과</b>
      {item.세트완성효과.length > 0 ? (
        <OptionList className="set-bonus-list set-bonus-list-complete" items={item.세트완성효과} />
      ) : (
        <span className="muted-text">정보 없음</span>
      )}
    </span>
  )

  return (
    <FloatingTooltip cardClassName="set-complete-bonus-card-shell" content={card} triggerClassName="set-item-name-trigger">
      <span className="set-item-name">
        <span className="normal-item-name-cell">
          <strong>{item.이름}</strong>
          {setItemRecommendations[item.이름] ? (
            <RecommendationBadge
              collisionTargetSelector=".set-complete-bonus-card-shell.floating-stat-card"
              info={setItemRecommendations[item.이름]}
              title={item.이름}
            />
          ) : null}
        </span>
        <span>{item.영문명}</span>
        <span className="set-item-parent">{item.세트}</span>
      </span>
    </FloatingTooltip>
  )
}

function setItemOptionClassName(option: string) {
  if (option.startsWith('부분 세트')) {
    return 'set-bonus-text-partial'
  }

  if (option.startsWith('완성 세트')) {
    return 'set-bonus-text-complete'
  }

  return undefined
}


function formatSetPrimaryValue(item: SetItem) {
  if (item.방어력.원문) {
    return `방어 ${item.방어력.원문}`
  }

  if (item.피해.원문) {
    return `피해 ${item.피해.원문}`
  }

  if (item.막기확률) {
    return `막기 ${item.막기확률}`
  }

  return ''
}

function formatNullableNumber(value: number | null | undefined) {
  return value ?? ''
}

function nullableNumber(value: number | null | undefined) {
  return value ?? 0
}


