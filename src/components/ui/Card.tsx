import type  { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm ${
        hover ? 'hover:shadow-lg hover:border-brand-200 transition-all duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}