import type { LucideIcon } from 'lucide-react'
import './PageHeading.css'

type PageHeadingProps = {
  description: string
  eyebrow: string
  icon: LucideIcon
  title: string
}

export function PageHeading({ description, eyebrow, icon: Icon, title }: PageHeadingProps) {
  return (
    <div className="category-heading">
      <Icon aria-hidden="true" />
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}
