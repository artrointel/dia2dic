import { useEffect, type RefObject } from 'react'

type CellCoverage = {
  cell: HTMLTableCellElement
  colEnd: number
  colStart: number
  rowEnd: number
  rowStart: number
}

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

      const { coverageByCell, grid } = createTableGrid(table)
      const hoveredCoverage = coverageByCell.get(cell)
      const fallbackRowIndex = cell.closest<HTMLTableRowElement>('tr')?.rowIndex
      const rowIndex = getVisualRowIndex(table, event.clientY) ?? fallbackRowIndex

      if (!hoveredCoverage || rowIndex === undefined) {
        return
      }

      const rowCoverages = new Set<CellCoverage>()
      const columnCoverages = new Set<CellCoverage>()

      grid.get(rowIndex)?.forEach((coverage) => {
        rowCoverages.add(coverage)
      })

      grid.forEach((rowMap) => {
        rowMap.forEach((coverage, columnIndex) => {
          if (columnIndex >= hoveredCoverage.colStart && columnIndex <= hoveredCoverage.colEnd) {
            columnCoverages.add(coverage)
          }
        })
      })

      rowCoverages.forEach((coverage) => {
        coverage.cell.classList.add('is-crosshair-row')
      })

      columnCoverages.forEach((coverage) => {
        coverage.cell.classList.add('is-crosshair-column')
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

function createTableGrid(table: HTMLTableElement) {
  const coverageByCell = new Map<HTMLTableCellElement, CellCoverage>()
  const grid = new Map<number, Map<number, CellCoverage>>()
  const rows = Array.from(table.rows)

  rows.forEach((row, rowIndex) => {
    let columnIndex = 0

    Array.from(row.cells).forEach((cell) => {
      while (grid.get(rowIndex)?.has(columnIndex)) {
        columnIndex += 1
      }

      const rowSpan = cell.rowSpan === 0 ? rows.length - rowIndex : cell.rowSpan
      const colSpan = cell.colSpan
      const coverage = {
        cell,
        colEnd: columnIndex + colSpan - 1,
        colStart: columnIndex,
        rowEnd: rowIndex + rowSpan - 1,
        rowStart: rowIndex,
      }

      coverageByCell.set(cell, coverage)

      for (let coveredRowIndex = coverage.rowStart; coveredRowIndex <= coverage.rowEnd; coveredRowIndex += 1) {
        const rowMap = grid.get(coveredRowIndex) ?? new Map<number, CellCoverage>()

        for (let coveredColumnIndex = coverage.colStart; coveredColumnIndex <= coverage.colEnd; coveredColumnIndex += 1) {
          rowMap.set(coveredColumnIndex, coverage)
        }
        grid.set(coveredRowIndex, rowMap)
      }

      columnIndex += colSpan
    })
  })

  return { coverageByCell, grid }
}

function getVisualRowIndex(table: HTMLTableElement, clientY: number) {
  return Array.from(table.rows).find((row) => {
    const rect = row.getBoundingClientRect()

    return clientY >= rect.top && clientY <= rect.bottom
  })?.rowIndex
}
