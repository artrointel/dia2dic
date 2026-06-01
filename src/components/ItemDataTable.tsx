import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

export type ItemDataTableColumn<TItem> = {
  key: string
  header: ReactNode
  className: string
  render: (item: TItem) => ReactNode
}

type ItemDataTableProps<TItem> = {
  columns: ItemDataTableColumn<TItem>[]
  emptyMessage: string
  getRowKey: (item: TItem) => string
  items: TItem[]
  tableClassName?: string
  wrapperClassName?: string
}

const TABLE_CELL_HORIZONTAL_PADDING = 24
const TABLE_COLUMN_BORDER_WIDTH = 1

export function ItemDataTable<TItem>({
  columns,
  emptyMessage,
  getRowKey,
  items,
  tableClassName = '',
  wrapperClassName = '',
}: ItemDataTableProps<TItem>) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const headerTableRef = useRef<HTMLTableElement>(null)
  const bodyTableRef = useRef<HTMLTableElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState(0)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const tableClasses = ['runewords-table', 'normal-items-table', tableClassName]
    .filter(Boolean)
    .join(' ')
  const tableWidth = Math.ceil(Object.values(columnWidths).reduce((sum, width) => sum + width, 0))
  const tableStyle: CSSProperties | undefined = tableWidth > 0 ? { minWidth: '100%', width: `${tableWidth}px` } : undefined

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current

    if (!wrapper) {
      return undefined
    }

    const updateAvailableWidth = () => {
      setAvailableWidth(Math.floor(wrapper.clientWidth))
    }
    const resizeObserver = new ResizeObserver(updateAvailableWidth)

    updateAvailableWidth()
    resizeObserver.observe(wrapper)

    return () => resizeObserver.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (!availableWidth) {
      return
    }

    const measuredWidths = measureColumnContentWidths(columns, measureRef.current)
    const nextWidths = fitColumnWidths(columns, measuredWidths, availableWidth)

    setColumnWidths((currentWidths) => {
      const currentEntries = Object.entries(currentWidths)
      const nextEntries = Object.entries(nextWidths)
      const isSame =
        currentEntries.length === nextEntries.length &&
        nextEntries.every(([key, width]) => currentWidths[key] === width)

      return isSame ? currentWidths : nextWidths
    })
  }, [availableWidth, columns, items])

  return (
    <div className={['normal-split-table', wrapperClassName].filter(Boolean).join(' ')} ref={wrapperRef}>
      <div aria-hidden="true" className="item-table-measure-layer" ref={measureRef}>
        {columns.map((column) => (
          <div className={column.className} data-column-key={column.key} key={column.key}>
            <span>{column.header}</span>
            {items.map((item) => (
              <span key={getRowKey(item)}>{column.render(item)}</span>
            ))}
          </div>
        ))}
      </div>

      <div className="normal-table-horizontal-scroll">
        <table className={tableClasses} ref={headerTableRef} style={tableStyle}>
          <ItemDataTableColgroup columnWidths={columnWidths} columns={columns} />
          <thead>
            <tr>
              {columns.map((column) => (
                <th className={column.className} data-column-key={column.key} key={column.key}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>

        <div className="normal-items-table-scroll">
          <table className={tableClasses} ref={bodyTableRef} style={tableStyle}>
            <ItemDataTableColgroup columnWidths={columnWidths} columns={columns} />
            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={getRowKey(item)}>
                    {columns.map((column) => (
                      <td className={column.className} data-column-key={column.key} key={column.key}>
                        {column.render(item)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="normal-item-empty" colSpan={columns.length}>
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function measureColumnContentWidths<TItem>(columns: ItemDataTableColumn<TItem>[], measureLayer: HTMLDivElement | null) {
  return columns.map((column) => {
    const columnElement = measureLayer?.querySelector<HTMLElement>(`[data-column-key="${CSS.escape(column.key)}"]`)
    const measuredWidth = Array.from(columnElement?.children ?? []).reduce(
      (width, element) => Math.max(width, element.scrollWidth),
      0,
    )

    return Math.ceil(Math.max(measuredWidth + TABLE_CELL_HORIZONTAL_PADDING + TABLE_COLUMN_BORDER_WIDTH, 48))
  })
}

function fitColumnWidths<TItem>(columns: ItemDataTableColumn<TItem>[], measuredWidths: number[], availableWidth: number) {
  const lastColumnIndex = Math.max(columns.length - 1, 0)
  const fixedWidth = measuredWidths.slice(0, lastColumnIndex).reduce((sum, width) => sum + width, 0)
  const lastMeasuredWidth = measuredWidths[lastColumnIndex] ?? 48
  const lastWidth = Math.max(availableWidth - fixedWidth - TABLE_COLUMN_BORDER_WIDTH, lastMeasuredWidth)

  return Object.fromEntries(
    columns.map((column, index) => [column.key, Math.round(index === lastColumnIndex ? lastWidth : measuredWidths[index])]),
  )
}

function ItemDataTableColgroup<TItem>({
  columnWidths,
  columns,
}: {
  columnWidths: Record<string, number>
  columns: ItemDataTableColumn<TItem>[]
}) {
  return (
    <colgroup>
      {columns.map((column) => {
        const width = columnWidths[column.key]
        const style: CSSProperties | undefined = width ? { width: `${width}px` } : undefined

        return <col className={column.className} key={column.key} style={style} />
      })}
    </colgroup>
  )
}
