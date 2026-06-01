import { useEffect, type RefObject } from 'react'

export function useTableCrosshair(tableRef: RefObject<HTMLTableElement | null>) {
  useEffect(() => {
    const table = tableRef.current

    if (!table) {
      return undefined
    }

    const clearHighlight = () => {
      table
        .querySelectorAll('.is-crosshair-row, .is-crosshair-column, .is-crosshair-cell')
        .forEach((cell) => {
          cell.classList.remove('is-crosshair-row', 'is-crosshair-column', 'is-crosshair-cell')
        })
    }

    const handleMouseOver = (event: MouseEvent) => {
      const cell = (event.target as HTMLElement).closest<HTMLTableCellElement>('th, td')

      if (!cell || !table.contains(cell)) {
        return
      }

      clearHighlight()

      const columnIndex = cell.cellIndex
      const row = cell.parentElement

      row?.querySelectorAll('th, td').forEach((rowCell) => {
        rowCell.classList.add('is-crosshair-row')
      })

      table.querySelectorAll('tr').forEach((tableRow) => {
        const columnCell = tableRow.children.item(columnIndex)

        if (columnCell instanceof HTMLTableCellElement) {
          columnCell.classList.add('is-crosshair-column')
        }
      })

      cell.classList.add('is-crosshair-cell')
    }

    table.addEventListener('mouseover', handleMouseOver)
    table.addEventListener('mouseleave', clearHighlight)

    return () => {
      clearHighlight()
      table.removeEventListener('mouseover', handleMouseOver)
      table.removeEventListener('mouseleave', clearHighlight)
    }
  }, [tableRef])
}
