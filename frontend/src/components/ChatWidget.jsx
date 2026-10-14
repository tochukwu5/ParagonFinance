import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

// AI support chat.
//
// Talks to our own backend (/api/chat/*), never to the bot's webhook
// directly — the webhook address and any secret stay on the server.
//
// The button only appears when the backend says the bot is configured, so a
// missing or mis-set CHAT_WEBHOOK_URL means "no chat button", not a launcher
// that can only fail.

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

const MAX_CHARS = 1000
const REQUEST_TIMEOUT_MS = 45000
const STORAGE_KEY = 'paragon_chat_v1'
const MAX_STORED = 40

// Pages that are internal tools rather than product pages.
const HIDDEN_ON = ['/admin', '/stats']

const GREETING =
  "Hi! I'm Paragon, your Paragon Finance assistant. Ask me about sending money, swaps, bridging, payment links or fees."

const SUGGESTIONS = [
  'How do I send USDC?',
  'What fees do you charge?',
  'How does bridging work?',
  'How do I get a payment link?',
]

// ─── Storage helpers ──────────────────────────────────────────────────
// sessionStorage can throw (private windows, blocked site data), and the
// chat has to work without it.
function loadStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.sid !== 'string' || !Array.isArray(parsed.messages)) return null
    return parsed
  } catch {
    return null
  }
}

function saveStored(sid, messages) {
  try {
    // Errors are transient and are not worth restoring.
    const keep = messages.filter(m => m.role !== 'error').slice(-MAX_STORED)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ sid, messages: keep }))
  } catch { /* fine */ }
}

function newSessionId() {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID()
  } catch { /* fall through */ }
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12)
}

let msgCounter = 0
const nextId = () => 'm' + Date.now().toString(36) + (msgCounter++)

// ─── Safe text rendering ──────────────────────────────────────────────
// Replies are rendered as React text nodes — never as HTML — so nothing the
// bot (or anyone who manipulates it) says can inject markup or script.
// Only http(s) links become clickable, and **bold** is supported because
// language models use it constantly.
const TOKEN_RE = /(\*\*[^*\n]+\*\*|https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g

function renderInline(line, keyBase) {
  const parts = line.split(TOKEN_RE)
  return parts.map((part, i) => {
    if (!part) return null
    const key = keyBase + '-' + i
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key} className="font-semibold text-white">{part.slice(2, -2)}</strong>
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={key}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00D4FF] underline underline-offset-2 break-all hover:opacity-80"
        >
          {part}
        </a>
      )
    }
    return <span key={key}>{part}</span>
  })
}

function MessageText({ text }) {
  const lines = String(text).split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className="block min-h-[1em]">
          {renderInline(line, 'l' + i)}
        </span>
      ))}
    </>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────
const ChatIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.6-.7L3 21l1.9-5.1A8.4 8.4 0 1 1 21 11.5Z" />
  </svg>
)
const CloseIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)
const SendIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" />
  </svg>
)
const RefreshIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 21v-5h5" />
  </svg>
)

// ─── Component ────────────────────────────────────────────────────────
export default function ChatWidget({ defaultOpen = false, forceAvailable = false }) {
  const { pathname } = useLocation()

  const [available, setAvailable] = useState(forceAvailable ? true : null)
  const [open, setOpen] = useState(defaultOpen)
  const [unread, setUnread] = useState(false)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')

  const stored = useRef(null)
  if (stored.current === null) stored.current = loadStored() || { sid: newSessionId(), messages: [] }

  const [sessionId, setSessionId] = useState(stored.current.sid)
  const [messages, setMessages] = useState(stored.current.messages)

  const listRef = useRef(null)
  const inputRef = useRef(null)
  const launcherRef = useRef(null)
  const abortRef = useRef(null)
  const openRef = useRef(open)
  openRef.current = open

  // Ask the backend whether the bot is configured. Anything other than a
  // clear "yes" hides the button.
  useEffect(() => {
    if (forceAvailable) return
    let cancelled = false
    fetch(API_BASE + '/chat/status', { signal: AbortSignal.timeout(8000) })
      .then(r => (r.ok ? r.json() : { available: false }))
      .then(j => { if (!cancelled) setAvailable(j?.available === true) })
      .catch(() => { if (!cancelled) setAvailable(false) })
    return () => { cancelled = true }
  }, [forceAvailable])

  useEffect(() => { saveStored(sessionId, messages) }, [sessionId, messages])

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, sending, open])

  useEffect(() => {
    if (open) {
      setUnread(false)
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open])

  // Escape closes the panel and hands focus back to the launcher.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        launcherRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Grow the box with the text, up to a cap.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 112) + 'px'
  }, [input, open])

  // Don't leave a request running if the widget unmounts.
  useEffect(() => () => abortRef.current?.abort(), [])

  const send = useCallback(async (raw, { retry = false } = {}) => {
    const text = String(raw || '').trim()
    if (!text || sending) return

    setMessages(prev => {
      // A retry replaces the error line rather than duplicating the question.
      const base = retry ? prev.filter(m => m.role !== 'error') : prev
      return retry ? base : [...base, { id: nextId(), role: 'user', text }]
    })
    setInput('')
    setSending(true)

    const controller = new AbortController()
    abortRef.current = controller
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const res = await fetch(API_BASE + '/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId, page: pathname }),
        signal: controller.signal,
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json.reply) {
        throw new Error(json.error || 'Something went wrong. Please try again.')
      }

      setMessages(prev => [...prev, { id: nextId(), role: 'bot', text: json.reply }])
      if (!openRef.current) setUnread(true)
    } catch (err) {
      const aborted = err?.name === 'AbortError'
      setMessages(prev => [
        ...prev.filter(m => m.role !== 'error'),
        {
          id: nextId(),
          role: 'error',
          text: aborted
            ? 'The assistant took too long to answer.'
            : (err?.message || 'Could not reach support.'),
          retryText: text,
        },
      ])
    } finally {
      clearTimeout(timer)
      setSending(false)
      abortRef.current = null
    }
  }, [sending, sessionId, pathname])

  const reset = () => {
    abortRef.current?.abort()
    setMessages([])
    setSessionId(newSessionId())
    setInput('')
    setSending(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    send(input)
  }

  const onKeyDown = (e) => {
    // Enter sends, Shift+Enter makes a new line.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(input)
    }
  }

  const hidden = HIDDEN_ON.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (available !== true || hidden) return null

  const empty = messages.length === 0
  const remaining = MAX_CHARS - input.length

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-label="Chat with Paragon"
          className="fixed z-[60] bottom-24 right-3 left-3 sm:left-auto sm:right-6 sm:w-[380px]
                     h-[min(560px,calc(100vh-8rem))] flex flex-col overflow-hidden
                     bg-[#0f1822] border border-[#1e2530] rounded-2xl
                     shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
        >
          {/* Header */}
          <header className="flex items-center gap-3 px-4 py-3 border-b border-[#1e2530] bg-[#0d141d] flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center text-[#00D4FF] flex-shrink-0">
              <ChatIcon className="w-[18px] h-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-['Space_Grotesk'] font-bold text-white text-sm leading-tight">Paragon</p>
              <p className="text-[11px] text-[#8892a0] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FFCC] animate-pulse" />
                AI assistant · Paragon Finance
              </p>
            </div>
            <button
              onClick={reset}
              disabled={empty && !sending}
              title="Start a new conversation"
              aria-label="Start a new conversation"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8892a0] hover:text-white hover:bg-[#161d28] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#8892a0] transition-all"
            >
              <RefreshIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setOpen(false); launcherRef.current?.focus() }}
              aria-label="Close chat"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8892a0] hover:text-white hover:bg-[#161d28] transition-all"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </header>

          {/* Messages */}
          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          >
            <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-[#161d28] border border-[#1e2530] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#c9d1dc]">
              {GREETING}
            </div>

            {empty && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={sending}
                    className="text-xs text-[#00D4FF] border border-[#00D4FF]/30 bg-[#00D4FF]/5 hover:bg-[#00D4FF]/10 rounded-full px-3 py-1.5 transition-all disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map(m => {
              if (m.role === 'user') {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-[#00D4FF] text-[#0D1117] px-3.5 py-2.5 text-[13px] leading-relaxed font-medium whitespace-pre-wrap break-words">
                      {m.text}
                    </div>
                  </div>
                )
              }
              if (m.role === 'error') {
                return (
                  <div key={m.id} className="max-w-[92%] rounded-2xl rounded-tl-md bg-red-500/10 border border-red-500/25 px-3.5 py-2.5 text-[13px] text-red-300">
                    <p>{m.text}</p>
                    <button
                      onClick={() => send(m.retryText, { retry: true })}
                      disabled={sending}
                      className="mt-1.5 text-xs font-semibold text-red-200 underline underline-offset-2 hover:text-white disabled:opacity-50"
                    >
                      Try again
                    </button>
                  </div>
                )
              }
              return (
                <div key={m.id} className="max-w-[88%] rounded-2xl rounded-tl-md bg-[#161d28] border border-[#1e2530] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#c9d1dc] break-words">
                  <MessageText text={m.text} />
                </div>
              )
            })}

            {sending && (
              <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-[#161d28] border border-[#1e2530] px-4 py-3" aria-label="The assistant is typing">
                {[0, 150, 300].map(d => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full bg-[#8892a0] animate-bounce"
                    style={{ animationDelay: d + 'ms' }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={onSubmit} className="flex-shrink-0 border-t border-[#1e2530] bg-[#0d141d] p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Type your question..."
                aria-label="Your message"
                className="flex-1 resize-none max-h-28 bg-[#0f1822] border border-[#1e2530] focus:border-[#00D4FF]/50 outline-none rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-[#5b6573] transition-colors"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Send message"
                className="w-10 h-10 rounded-xl bg-[#00D4FF] text-[#0D1117] flex items-center justify-center flex-shrink-0 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <SendIcon className="w-[18px] h-[18px]" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 gap-3">
              <p className="text-[10px] leading-snug text-[#5b6573]">
                AI can make mistakes. Never share your seed phrase or private keys — we will never ask for them.
              </p>
              {remaining <= 100 && (
                <span className={'text-[10px] flex-shrink-0 ' + (remaining <= 0 ? 'text-red-400' : 'text-[#5b6573]')}>
                  {remaining}
                </span>
              )}
            </div>
          </form>
        </section>
      )}

      {/* Launcher */}
      <button
        ref={launcherRef}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat with Paragon' : 'Chat with Paragon'}
        aria-expanded={open}
        className="fixed z-[60] bottom-6 right-6 w-14 h-14 rounded-full bg-[#00D4FF] text-[#0D1117]
                   flex items-center justify-center shadow-[0_8px_30px_-6px_rgba(0,212,255,0.6)]
                   hover:scale-105 active:scale-95 transition-transform"
      >
        {open ? <CloseIcon className="w-6 h-6" /> : <ChatIcon className="w-6 h-6" />}
        {unread && !open && (
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#00FFCC] border-2 border-[#0D1117]" />
        )}
      </button>
    </>
  )
}