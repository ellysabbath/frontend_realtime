import { Bell, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import NotificationPanel from '../shared/NotificationPannel'
import { notifApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function Topbar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Track the previous unread count to detect *new* arrivals
  const prevUnreadCount = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 1. Initialize the notification sound
  useEffect(() => {
    // Free public WhatsApp-style pop sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
    audioRef.current.volume = 0.5
  }, [])

  // 2. Poll for notifications every 5 seconds
  useEffect(() => {
    if (!user) return

    const fetchNotifs = async () => {
      try {
        // Admin sees 'admin' notifications, others see their userId notifications
        const targetId = user.role === 'admin' ? 'admin' : user.userId
        const data = await notifApi.list(targetId)
        
        setItems(data)

        const currentUnread = data.filter((n) => !n.read).length
        setUnreadCount(currentUnread)

        // 3. If unread count increased, play sound!
        if (currentUnread > prevUnreadCount.current) {
          audioRef.current?.play().catch((e) => {
            console.log('Audio play blocked until user interacts with the page:', e)
          })
        }
        
        prevUnreadCount.current = currentUnread
      } catch (err) {
        console.error('Failed to fetch notifications', err)
      }
    }

    // Fetch immediately, then poll every 5 seconds
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 5000)

    return () => clearInterval(interval)
  }, [user?.userId, user?.role])

  // 4. Mark as read
  const handleMarkRead = async (id: string) => {
    try {
      await notifApi.markRead(id)
      
      // Optimistically update local state
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
      prevUnreadCount.current = Math.max(0, prevUnreadCount.current - 1)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search anything..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 relative">
        <button
          onClick={() => setOpen(!open)}
          className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Bell size={20} className="text-slate-600" />
          
          {/* The Red Badge Count */}
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
        
        <NotificationPanel
          notifications={items}
          open={open}
          onClose={() => setOpen(false)}
          onMarkRead={handleMarkRead}
        />
      </div>
    </header>
  )
}