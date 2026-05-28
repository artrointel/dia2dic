import type { ReactNode } from 'react'

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

export function ItemDataTable<TItem>({
  columns,
  emptyMessage,
  getRowKey,
  items,
  tableClassName = '',
  wrapperClassName = '',
}: ItemDataTableProps<TItem>) {
  const tableClasses = ['runewords-table', 'normal-items-table', tableClassName]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={['normal-split-table', wrapperClassName].filter(Boolean).join(' ')}>
      <table className={tableClasses}>
        <ItemDataTableColgroup columns={columns} />
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
      </table>

      <div className="normal-items-table-scroll">
        <table className={tableClasses}>
          <ItemDataTableColgroup columns={columns} />
          <tbody>
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={getRowKey(item)}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render(item)}</td>
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
  )
}

function ItemDataTableColgroup<TItem>({ columns }: { columns: ItemDataTableColumn<TItem>[] }) {
  return (
    <colgroup>
      {columns.map((column) => (
        <col className={column.className} key={column.key} />
      ))}
    </colgroup>
  )
}
