import { useMemo, useState } from 'react'
import { Boxes } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FloatingTooltip } from '../components/FloatingTooltip'
import { ItemDataTable, type ItemDataTableColumn } from '../components/ItemDataTable'
import { OptionList } from '../components/OptionList'
import { PageHeading } from '../components/PageHeading'
import { FilterPanel, NameSearch, TableToolbar } from '../components/TableControls'
import { setItems } from '../shared/gameData'
import { readPageSearchQuery } from '../shared/searchNavigation'
import { matchesSearchText } from '../shared/searchUtils'
import type { SetItem, SetItemGroup, SetItemRow } from '../shared/appTypes'

export function SetItemsPage() {
  const [searchParams] = useSearchParams()
  const incomingSearchQuery = readPageSearchQuery(searchParams)
  const lastAppliedSearchQuery = useRef(incomingSearchQuery)
  const [selectedSetId, setSelectedSetId] = useState('전체')
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

    return setRows
      .filter((item) => (selectedSetId === '전체' ? true : item.세트Id === selectedSetId))
      .filter((item) =>
        activeQuery
          ? matchesSearchText(
              [
                item.세트,
                item.세트영문명,
                item.이름,
                item.영문명,
                item.베이스,
                item.옵션.join(' '),
                item.부분세트효과.join(' '),
                item.세트부분효과.join(' '),
                item.세트완성효과.join(' '),
              ].join(' '),
              activeQuery,
            )
          : true,
      )
      .toSorted(
        (left, right) =>
          left.세트.localeCompare(right.세트) ||
          nullableNumber(left.요구레벨) - nullableNumber(right.요구레벨) ||
          left.이름.localeCompare(right.이름),
      )
  }, [canSearchByName, nameQuery, selectedSetId, setRows])

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
        <strong>{item.이름}</strong>
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


