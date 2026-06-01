import type { ReactNode } from 'react'
import './TableControls.css'

type TableToolbarProps = {
  children: ReactNode
  sort?: ReactNode
}

export function TableToolbar({ children, sort }: TableToolbarProps) {
  return (
    <div className="table-toolbar">
      {children}
      {sort}
    </div>
  )
}

type FilterPanelProps = {
  actions?: ReactNode
  children: ReactNode
  title?: string
}

export function FilterPanel({ actions, children, title = '필터' }: FilterPanelProps) {
  return (
    <div className="filter-panel">
      <div className="filter-panel-header">
        <strong>{title}</strong>
        {actions}
      </div>
      {children}
    </div>
  )
}

type NameSearchProps = {
  label: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}

export function NameSearch({ label, onChange, placeholder, value }: NameSearchProps) {
  return (
    <div className="name-search-row">
      <label className="name-search-control">
        <span>{label}</span>
        <input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  )
}

type SelectOption<TValue extends string> = {
  label: string
  value: TValue
}

type SortControlProps<TValue extends string> = {
  onChange: (value: TValue) => void
  options: Array<SelectOption<TValue>>
  value: TValue
}

export function SortControl<TValue extends string>({ onChange, options, value }: SortControlProps<TValue>) {
  return (
    <label className="sort-control">
      <span>정렬</span>
      <select value={value} onChange={(event) => onChange(event.target.value as TValue)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

type SegmentedFilterProps<TValue extends string, TItem = TValue> = {
  className?: string
  getLabel?: (item: TItem) => string
  getValue?: (item: TItem) => TValue
  items: TItem[]
  onSelect: (value: TValue) => void
  selected: TValue
}

export function SegmentedFilter<TValue extends string, TItem = TValue>({
  className = 'normal-category-filter',
  getLabel,
  getValue,
  items,
  onSelect,
  selected,
}: SegmentedFilterProps<TValue, TItem>) {
  return (
    <div className={className}>
      {items.map((item) => {
        const value = getValue ? getValue(item) : (item as unknown as TValue)
        const label = getLabel ? getLabel(item) : String(item)

        return (
          <button
            className={value === selected ? 'is-active' : ''}
            key={value}
            onClick={() => onSelect(value)}
            type="button"
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
