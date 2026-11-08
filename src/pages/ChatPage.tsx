import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ref, onValue, set, remove } from 'firebase/database'
import { database } from '../firebase'
import { chatApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import {
  ArrowLeft,
  Send,
  Loader2,
  MessageCircle,
  Check,
  CheckCheck,
} from 'lucide-react'

interface Message {
  id: string
  text: string
  senderId: string
  senderName: string
  senderRole: 'customer' | 'technician'
  sentAt: number
  read?: boolean
}

interface TypingState {
  user: string
  name?: string
  timestamp: number
}

// ── Timing constants ─────────────────────────────────────────────
const TYPING_TIMEOUT_MS = 2500   // local "stop typing" after last keystroke
const TYPING_DISPLAY_MS = 3500   // listener tolerance (must be > TIMEOUT)
const TYPING_REFRESH_MS = 900    // throttle heartbeat (must be < TIMEOUT)

const DEV = import.meta.env.DEV
const log = (...args: unknown[]) => {
  if (DEV) console.log('[chat]', ...args)
}

export default function ChatPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const nav = useNavigate()
  const { user } = useAuth()

  // ── Stable identity (never undefined) ─────────────────────────
  // AuthContext may expose the id under different keys.
  const myId = useMemo<string | null>(() => {
    if (!user) return null
    const u = user as any
    return u.userId ?? u.id ?? u.uid ?? u._id ?? null
  }, [user])

  const myName =
    (user as any)?.fullName ?? (user as any)?.name ?? 'You'

  const myRole: 'customer' | 'technician' =
    (user as any)?.role === 'technician' ? 'technician' : 'customer'

  // ── State ─────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  // ── Refs ──────────────────────────────────────────────────────
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isTypingRef = useRef(false)
  const lastWriteRef = useRef(0)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // ══════════════════════════════════════════════════════════════
  // 1. Messages — load history from Django + listen to Firebase
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!requestId) return

    // (a) Load historical messages from Django once
    chatApi
      .messages(requestId)
      .then((list: any[]) => {
        const sorted = [...list].sort(
          (a, b) => (a.sentAt || 0) - (b.sentAt || 0),
        )
        setMessages(sorted)
      })
      .catch(() => {
        /* Firebase will still deliver realtime messages */
      })

    // (b) Real-time listener on Firebase (only items with `.text`)
    const messagesRef = ref(database, `chats/${requestId}`)
    const unsub = onValue(messagesRef, (snap) => {
      const data = snap.val()
      if (!data || typeof data !== 'object') {
        setMessages([])
        return
      }
      const list: Message[] = Object.entries(data)
        .filter(([key, val]: [string, any]) => key !== 'typing' && val && val.text)
        .map(([id, val]: [string, any]) => ({ id, ...val }))
        .sort((a, b) => (a.sentAt || 0) - (b.sentAt || 0))
      setMessages(list)

      // Auto-mark unread from the partner as read
      if (
        myId &&
        list.some((m) => m.senderId !== myId && !m.read)
      ) {
        chatApi.markRead(requestId, myRole).catch(() => {})
      }
    })

    return () => unsub()
  }, [requestId, myId, myRole])

  // ══════════════════════════════════════════════════════════════
  // 2. Typing — listen to Firebase
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!requestId || !myId) return

    const typingRef = ref(database, `chats/${requestId}/typing`)
    const unsub = onValue(typingRef, (snap) => {
      const data = snap.val() as Record<string, TypingState> | null
      if (!data || typeof data !== 'object') {
        setTypingUsers([])
        return
      }
      const now = Date.now()
      const active = Object.values(data)
        .filter(
          (t): t is TypingState =>
            !!t && typeof t.timestamp === 'number' && t.user !== myId,
        )
        .filter((t) => now - t.timestamp < TYPING_DISPLAY_MS)
        .map((t) => t.name || t.user)

      log('typing active', active)
      setTypingUsers(active)
    })

    return () => unsub()
  }, [requestId, myId])

  // ══════════════════════════════════════════════════════════════
  // 3. Typing — write to Firebase
  // ══════════════════════════════════════════════════════════════
  const typingRef = useMemo(
    () =>
      requestId && myId
        ? ref(database, `chats/${requestId}/typing/${myId}`)
        : null,
    [requestId, myId],
  )

  const writeTypingTrue = () => {
    if (!typingRef) return
    const now = Date.now()
    // Throttle the heartbeat (but always write the first one)
    if (now - lastWriteRef.current < TYPING_REFRESH_MS) return
    lastWriteRef.current = now
    set(typingRef, {
      user: myId,
      name: myName,
      timestamp: now,
    }).catch((e) => log('typing write failed', e))
    log('typing write true')
  }

  const writeTypingFalse = () => {
    if (!typingRef) return
    lastWriteRef.current = 0
    remove(typingRef).catch(() => {})
    log('typing write false')
  }

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    if (isTypingRef.current) {
      isTypingRef.current = false
      writeTypingFalse()
    }
  }

  const handleInputChange = (value: string) => {
    setInput(value)

    const hasText = value.trim().length > 0

    if (hasText) {
      // First keystroke: write immediately + start heartbeat
      if (!isTypingRef.current) {
        isTypingRef.current = true
        lastWriteRef.current = 0 // force immediate write
        writeTypingTrue()

        // Keep the timestamp fresh while user is actively typing
        heartbeatRef.current = setInterval(() => {
          if (isTypingRef.current) writeTypingTrue()
        }, TYPING_REFRESH_MS)
      }

      // Reset the "stop typing" timer
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => stopTyping(), TYPING_TIMEOUT_MS)
    } else {
      stopTyping()
    }
  }

  // Cleanup on unmount / request change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (typingRef) remove(typingRef).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typingRef])

  // ══════════════════════════════════════════════════════════════
  // 4. Auto-scroll
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, typingUsers.length])

  // ══════════════════════════════════════════════════════════════
  // 5. Send message via Django
  // ══════════════════════════════════════════════════════════════
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending || !requestId || !myId) return

    setSending(true)
    setError(null)
    stopTyping()

    try {
      await chatApi.send({ requestId, text: input.trim() })
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // ── Group messages by date ────────────────────────────────────
  const grouped = useMemo(() => {
    return messages.reduce((acc, m) => {
      const date = new Date(m.sentAt || Date.now()).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      })
      if (!acc[date]) acc[date] = []
      acc[date].push(m)
      return acc
    }, {} as Record<string, Message[]>)
  }, [messages])

  const partnerName =
    messages.find((m) => m.senderId !== myId)?.senderName || 'Conversation'

  // ══════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => nav(-1)}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[75vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-50 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-11 h-11 rounded-full gradient-brand text-white flex items-center justify-center font-bold">
                {partnerName.charAt(0).toUpperCase()}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white transition-colors ${
                  typingUsers.length > 0
                    ? 'bg-brand-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 leading-tight truncate">
                {partnerName}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {typingUsers.length > 0 ? (
                  <span className="text-brand-600 font-semibold">
                    {typingUsers.length === 1
                      ? 'typing...'
                      : `${typingUsers.length} people typing...`}
                  </span>
                ) : (
                  'Request #' + (requestId?.slice(0, 8) ?? '')
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin">
          {messages.length === 0 && typingUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-16 text-center">
              <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                <MessageCircle size={24} />
              </div>
              <p className="font-semibold text-slate-900">Start the conversation</p>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                Say hello. Messages update in real time.
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, msgs]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-2 justify-center">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {date}
                  </span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                {msgs.map((m) => {
                  const mine = !!myId && m.senderId === myId
                  return (
                    <div
                      key={m.id}
                      className={`flex ${
                        mine ? 'justify-end' : 'justify-start'
                      } items-end gap-2`}
                    >
                      {!mine && (
                        <div className="w-8 h-8 rounded-full gradient-brand text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {m.senderName?.charAt(0) || '?'}
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] ${
                          mine ? 'items-end' : 'items-start'
                        } flex flex-col`}
                      >
                        {!mine && (
                          <p className="text-[10px] font-semibold text-slate-500 mb-1 ml-1">
                            {m.senderName || m.senderRole}
                          </p>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            mine
                              ? 'bg-brand-600 text-white rounded-br-sm'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {m.text}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <p
                            className={`text-[10px] text-slate-400 ${
                              mine ? 'mr-1' : 'ml-1'
                            }`}
                          >
                            {m.sentAt
                              ? new Date(m.sentAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </p>
                          {mine && (
                            <span className="text-[10px]">
                              {m.read ? (
                                <CheckCheck size={12} className="text-brand-500" />
                              ) : (
                                <Check size={12} className="text-slate-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}

          {/* Typing indicator (bubble) */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-100 bg-white">
          {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-11 h-11 rounded-xl gradient-brand text-white flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-all"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}