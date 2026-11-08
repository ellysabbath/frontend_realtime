interface BadgeProps {
  children: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple'
}

export default function Badge({ children, color = 'gray' }: BadgeProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    green: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    gray: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
    purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  )
}