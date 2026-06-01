import { useMemo, useRef, useState } from 'react'
import { Activity } from 'lucide-react'
import { PageHeading } from '../components/PageHeading'
import { FilterPanel, SegmentedFilter, TableToolbar } from '../components/TableControls'
import { useTableCrosshair } from '../hooks/useTableCrosshair'
import { breakpoints } from '../shared/gameData'
import type { BreakpointTable, BreakpointTableId } from '../shared/appTypes'
import './FrameBreakpointsPage.css'

const breakpointFilterOptions = breakpoints.tables.map((table) => ({
  label: table.label,
  value: table.id,
}))

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
  const tableRef = useRef<HTMLTableElement>(null)
  useTableCrosshair(tableRef)

  return (
    <div className="breakpoint-table-card">
      <div className="breakpoint-table-scroll">
        <table className="table-crosshair breakpoint-table" ref={tableRef}>
          <thead>
            <tr>
              <th>캐릭터</th>
              <th>조건</th>
              {table.frames.map((frame) => (
                <th key={frame}>{frame}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={`${row.character}-${row.condition}`}>
                <th scope="row">{row.character}</th>
                <td>{row.condition}</td>
                {table.frames.map((frame) => (
                  <td className={row.values[String(frame)] ? 'has-breakpoint' : undefined} key={frame}>
                    {row.values[String(frame)] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="breakpoint-source">출처: {breakpoints.source.title}</p>
    </div>
  )
}
