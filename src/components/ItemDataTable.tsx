import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode, TdHTMLAttributes } from 'react'
import { useTableCrosshair } from '../hooks/useTableCrosshair'
import './ItemDataTable.css'

type ItemDataTableCellProps = Pick<TdHTMLAttributes<HTMLTableCellElement>, 'colSpan' | 'rowSpan'> & {
  hidden?: boolean
}

export type ItemDataTableColumn<TItem> = {
  key: string
  header: ReactNode
  className: string
  getCellClassName?: (item: TItem, index: number, items: TItem[]) => string | undefined
  getCellProps?: (item: TItem, index: number, items: TItem[]) => ItemDataTableCellProps | undefined
  minWidth?: number
  render: (item: TItem) => ReactNode
}

type ItemDataTableProps<TItem> = {
  columns: ItemDataTableColumn<TItem>[]
  customHeader?: ReactNode
  emptyMessage: string
  getRowClassName?: (item: TItem, index: number, items: TItem[]) => string | undefined
  getRowKey: (item: TItem) => string
  getRowProps?: (item: TItem, index: number, items: TItem[]) => HTMLAttributes<HTMLTableRowElement> | undefined
  items: TItem[]
  fillColumnKey?: string
  metaLabel?: ReactNode
  stickyFirstColumn?: boolean
  tableClassName?: string
  widthMode?: 'fill' | 'content'
  wrapperClassName?: string
}

const TABLE_CELL_HORIZONTAL_PADDING = 24
const TABLE_COLUMN_BORDER_WIDTH = 1
const TABLE_CARD_BORDER_WIDTH = 2

export function ItemDataTable<TItem>({
  columns,
  customHeader,
  emptyMessage,
  getRowClassName,
  fillColumnKey,
  getRowKey,
  getRowProps,
  items,
  metaLabel,
  stickyFirstColumn = true,
  tableClassName = '',
  widthMode = 'fill',
  wrapperClassName = '',
}: ItemDataTableProps<TItem>) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState(0)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  useTableCrosshair(tableRef)

  const tableClasses = ['table-crosshair', 'runewords-table', 'normal-items-table', tableClassName]
    .filter(Boolean)
    .join(' ')
  const tableWidth = Math.ceil(Object.values(columnWidths).reduce((sum, width) => sum + width, 0))
  const tableStyle: CSSProperties | undefined =
    tableWidth > 0 ? { minWidth: widthMode === 'fill' ? '100%' : `${tableWidth}px`, width: `${tableWidth}px` } : undefined
  const contentWidthStyle: CSSProperties | undefined =
    widthMode === 'content' && tableWidth > 0
      ? { width: `min(100%, ${tableWidth + TABLE_CARD_BORDER_WIDTH}px)` }
      : undefined

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
    const nextWidths =
      widthMode === 'content'
        ? contentColumnWidths(columns, measuredWidths)
        : fitColumnWidths(columns, measuredWidths, availableWidth, fillColumnKey)

    setColumnWidths((currentWidths) => {
      const currentEntries = Object.entries(currentWidths)
      const nextEntries = Object.entries(nextWidths)
      const isSame =
        currentEntries.length === nextEntries.length &&
        nextEntries.every(([key, width]) => currentWidths[key] === width)

      return isSame ? currentWidths : nextWidths
    })
  }, [availableWidth, columns, fillColumnKey, items, widthMode])

  useLayoutEffect(() => {
    const table = tableRef.current

    if (!table || tableWidth <= 0) {
      return
    }

    const renderedWidths = renderedColumnWidths(columns, table)
    const hasExpandedColumn = Object.entries(renderedWidths).some(
      ([key, width]) => width > (columnWidths[key] ?? 0) + TABLE_COLUMN_BORDER_WIDTH,
    )

    if (!hasExpandedColumn) {
      return
    }

    setColumnWidths((currentWidths) => ({
      ...currentWidths,
      ...Object.fromEntries(
        Object.entries(renderedWidths).filter(([key, width]) => width > (currentWidths[key] ?? 0)),
      ),
    }))
  }, [columnWidths, columns, tableWidth])

  return (
    <div
      className={['item-data-table-block', widthMode === 'content' ? 'is-content-width' : ''].filter(Boolean).join(' ')}
      style={contentWidthStyle}
    >
      {metaLabel ? <div className="item-data-table-meta">{metaLabel}</div> : null}

      <div className={['runewords-table-wrap', wrapperClassName].filter(Boolean).join(' ')} style={contentWidthStyle}>
        <div
          className={[
            'normal-split-table',
            stickyFirstColumn ? 'has-sticky-first-column' : '',
            widthMode === 'content' ? 'is-content-width' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          ref={wrapperRef}
        >
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
            <table className={tableClasses} ref={tableRef} style={tableStyle}>
              <ItemDataTableColgroup columnWidths={columnWidths} columns={columns} />
              <thead>
                {customHeader ?? (
                  <tr>
                    {columns.map((column, columnIndex) => (
                      <th
                        className={column.className}
                        data-column-key={column.key}
                        data-sticky-column={columnIndex === 0 ? 'true' : undefined}
                        key={column.key}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((item, rowIndex) => (
                    <tr
                      className={getRowClassName?.(item, rowIndex, items)}
                      key={getRowKey(item)}
                      {...getRowProps?.(item, rowIndex, items)}
                    >
                      {columns.map((column, columnIndex) => {
                        const cellProps = column.getCellProps?.(item, rowIndex, items)

                        if (cellProps?.hidden) {
                          return null
                        }

                        const tableCellProps = cellProps
                          ? { colSpan: cellProps.colSpan, rowSpan: cellProps.rowSpan }
                          : undefined

                        return (
                          <td
                            className={[column.className, column.getCellClassName?.(item, rowIndex, items)]
                              .filter(Boolean)
                              .join(' ')}
                            data-column-key={column.key}
                            data-sticky-column={columnIndex === 0 ? 'true' : undefined}
                            key={column.key}
                            {...tableCellProps}
                          >
                            {column.render(item)}
                          </td>
                        )
                      })}
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

    return Math.ceil(Math.max(measuredWidth + TABLE_CELL_HORIZONTAL_PADDING + TABLE_COLUMN_BORDER_WIDTH, column.minWidth ?? 48))
  })
}

function contentColumnWidths<TItem>(columns: ItemDataTableColumn<TItem>[], measuredWidths: number[]) {
  return Object.fromEntries(columns.map((column, index) => [column.key, Math.round(measuredWidths[index] ?? 48)]))
}

function fitColumnWidths<TItem>(
  columns: ItemDataTableColumn<TItem>[],
  measuredWidths: number[],
  availableWidth: number,
  fillColumnKey?: string,
) {
  const fillColumnIndex = fillColumnKey ? columns.findIndex((column) => column.key === fillColumnKey) : columns.length - 1
  const safeFillColumnIndex = fillColumnIndex >= 0 ? fillColumnIndex : Math.max(columns.length - 1, 0)
  const fixedWidth = measuredWidths.reduce(
    (sum, width, index) => (index === safeFillColumnIndex ? sum : sum + width),
    0,
  )
  const fillMeasuredWidth = measuredWidths[safeFillColumnIndex] ?? 48
  const fillWidth = Math.max(availableWidth - fixedWidth - TABLE_COLUMN_BORDER_WIDTH, fillMeasuredWidth)

  return Object.fromEntries(
    columns.map((column, index) => [column.key, Math.round(index === safeFillColumnIndex ? fillWidth : measuredWidths[index])]),
  )
}

function renderedColumnWidths<TItem>(columns: ItemDataTableColumn<TItem>[], table: HTMLTableElement) {
  return Object.fromEntries(
    columns.map((column) => {
      const cells = table.querySelectorAll<HTMLElement>(`[data-column-key="${CSS.escape(column.key)}"]`)
      const width = Array.from(cells).reduce(
        (maxWidth, cell) => Math.max(maxWidth, cell.getBoundingClientRect().width),
        0,
      )

      return [column.key, Math.ceil(Math.max(width, column.minWidth ?? 48))]
    }),
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
