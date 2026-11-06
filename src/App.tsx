import { useEffect, useState, type FormEvent } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "./firebase";
import { API_BASE } from "./config";

interface Message {
  id: string;
  text: string;
  user: string;
  timestamp: number;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(
    "user-" + Math.floor(Math.random() * 1000)
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Real-time listener: Firebase → React ──
  useEffect(() => {
    const messagesRef = ref(database, "messages");
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setMessages([]);
        return;
      }
      const list: Message[] = Object.entries(data).map(
        ([id, val]) => ({ id, ...(val as Omit<Message, "id">) })
      );
      list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(list);
    });
    return () => unsubscribe();
  }, []);

  // ── Send: React → Django → Firebase ──
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/messages/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim(), user }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-3xl font-bold text-slate-800">
          Real-Time Message Board
        </h1>
        <p className="mb-4 text-sm text-slate-500">
          Django: <code>127.0.0.1:8000</code> · React:{" "}
          <code>localhost:5173</code> · Firebase: Realtime DB
        </p>

        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm text-slate-600">You are:</label>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </div>

        <div className="mb-4 h-96 overflow-y-auto rounded-lg bg-white p-4 shadow">
          {messages.length === 0 ? (
            <p className="mt-8 text-center text-slate-400">No messages yet</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className="mb-2 border-b border-slate-100 pb-2 last:border-none"
              >
                <span className="font-semibold text-blue-600">{m.user}</span>
                <span className="mx-1 text-slate-400">·</span>
                <span className="text-xs text-slate-400">
                  {m.timestamp
                    ? new Date(m.timestamp).toLocaleTimeString()
                    : ""}
                </span>
                <p className="text-slate-700">{m.text}</p>
              </div>
            ))
          )}
        </div>

        {error && (
          <p className="mb-2 rounded bg-red-50 p-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}