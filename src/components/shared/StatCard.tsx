import {type  ReactNode } from 'react'
import Card from '../ui/Card'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: string
  trendUp?: boolean
  color?: 'blue' | 'green' | 'orange' | 'purple'
}

export default function StatCard({ title, value, icon, trend, trendUp, color = 'blue' }: StatCardProps) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-green-500 to-emerald-600 shadow-green-500/30',
    orange: 'from-orange-500 to-amber-600 shadow-orange-500/30',
    purple: 'from-purple-500 to-violet-600 shadow-purple-500/30',
  }
  
  return (
    <Card className="p-5" hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[color]} text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}