import { useMemo, useState } from 'react'
import { Activity } from 'lucide-react'
import { ItemDataTable, type ItemDataTableColumn } from '../components/ItemDataTable'
import { PageHeading } from '../components/PageHeading'
import { FilterPanel, SegmentedFilter, TableToolbar } from '../components/TableControls'
import { breakpoints } from '../shared/gameData'
import type { BreakpointTable, BreakpointTableId } from '../shared/appTypes'
import './FrameBreakpointsPage.css'

const breakpointFilterOptions = breakpoints.tables.map((table) => ({
  label: table.label,
  value: table.id,
}))

type BreakpointRow = BreakpointTable['rows'][number]

export function FrameBreakpointsPage() {
  const [selectedTableId, setSelectedTableId] = useState<BreakpointTableId>('fcr')
  const selectedTable = useMemo(
    () => breakpoints.tables.find((table) => table.id === selectedTableId) ?? breakpoints.tables[0],
    [selectedTableId],
  )

  return (
    <section className="frame-breakpoints-page">
      <PageHeading
        description="캐릭터별 패캐, 패힛, 패블럭 임계점과 프레임을 비교합니다."
        eyebrow="캐릭터 정보"
        icon={Activity}
        title="프레임 표"
      />

      <TableToolbar>
        <FilterPanel>
          <SegmentedFilter
            getLabel={(item) => item.label}
            getValue={(item) => item.value}
            items={breakpointFilterOptions}
            selected={selectedTableId}
            onSelect={setSelectedTableId}
          />
        </FilterPanel>
      </TableToolbar>

      <BreakpointInfo table={selectedTable} />
      <BreakpointTableView table={selectedTable} />
    </section>
  )
}

function BreakpointInfo({ table }: { table: BreakpointTable }) {
  return (
    <section className="breakpoint-info-panel">
      <div>
        <span>{table.fullName}</span>
        <h2>{table.title}</h2>
      </div>
      <ul>
        {table.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </section>
  )
}

function BreakpointTableView({ table }: { table: BreakpointTable }) {
  const columns: ItemDataTableColumn<BreakpointRow>[] = [
    {
      key: 'character',
      header: '캐릭터',
      className: 'breakpoint-col-character',
      getCellProps: (row, index, rows) => {
        if (index > 0 && rows[index - 1].character === row.character) {
          return { hidden: true }
        }

        const rowSpan = rows.slice(index).findIndex((nextRow) => nextRow.character !== row.character)

        return {
          rowSpan: rowSpan === -1 ? rows.length - index : rowSpan,
        }
      },
      render: (row) => row.character,
    },
    {
      key: 'condition',
      header: '조건',
      className: 'breakpoint-col-condition',
      render: (row) => row.condition,
    },
    ...table.frames.map<ItemDataTableColumn<BreakpointRow>>((frame) => ({
      key: String(frame),
      header: frame,
      className: 'breakpoint-col-frame',
      getCellClassName: (row) => (row.values[String(frame)] ? 'has-breakpoint' : undefined),
      render: (row) => row.values[String(frame)] ?? '-',
    })),
  ]

  return (
    <div className="breakpoint-table-card">
      <ItemDataTable
        columns={columns}
        emptyMessage="프레임 데이터가 없습니다."
        getRowKey={(row) => `${row.character}-${row.condition}`}
        items={table.rows}
        pageSize={100}
        tableClassName="breakpoint-table"
        widthMode="content"
      />
      <p className="breakpoint-source">출처: {breakpoints.source.title}</p>
    </div>
  )
}
