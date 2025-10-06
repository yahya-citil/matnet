import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow ${className}`}
    >
      {children}
    </div>
  )
}
