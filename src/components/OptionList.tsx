import type { ReactNode } from 'react'
import './OptionList.css'

type OptionListProps = {
  className?: string
  getItemClassName?: (value: string) => string | undefined
  items: string[]
  renderItem?: (value: string) => ReactNode
}

export function OptionList({ className = '', getItemClassName, items, renderItem }: OptionListProps) {
  return (
    <ul className={['option-list', className].filter(Boolean).join(' ')}>
      {items.map((item, index) => (
        <li className={getItemClassName?.(item)} key={`${item}-${index}`}>
          {renderItem ? renderItem(item) : item}
        </li>
      ))}
    </ul>
  )
}
