import { CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react'
import Badge from '../ui/Badge'

interface Props {
  notifications: any[]
  open: boolean
  onClose: () => void
  onMarkRead: (id: string) => void
}

export default function NotificationPanel({ notifications, open, onClose, onMarkRead }: Props) {
  if (!open) return null

  const icons: Record<string, React.ReactNode> = {
    info: <Info size={16} className="text-blue-500" />,
    success: <CheckCircle size={16} className="text-green-500" />,
    warning: <AlertTriangle size={16} className="text-yellow-500" />,
    error: <XCircle size={16} className="text-red-500" />,
  }

  return (
    <>
      {/* Backdrop to close when clicking outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Panel */}
      <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 animate-fade-in overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Notifications</h3>
          <Badge color="blue">{notifications.filter((n) => !n.read).length} new</Badge>
        </div>
        
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  // Only mark as read if it isn't already
                  if (!n.read) onMarkRead(n.id)
                }}
                className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${
                  !n.read ? 'bg-brand-50/30' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5">{icons[n.type] || icons.info}</div>
                  <div className="flex-1">
                    <p className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'} text-slate-900`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    {n.createdAt && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  {/* Red dot for unread */}
                  {!n.read && <div className="w-2 h-2 rounded-full bg-brand-500 mt-1" />}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}