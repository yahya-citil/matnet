import type { ReactNode } from 'react'

type Props = {
  id?: string
  className?: string
  children: ReactNode
}

export default function Section({ id, className = '', children }: Props) {
  return (
    <section id={id} className={`py-16 md:py-20 ${className}`}>
      <div className="container">{children}</div>
    </section>
  )
}
