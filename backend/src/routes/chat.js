import express from 'express'
import rateLimit from 'express-rate-limit'

// AI support chat proxy.
//
// The browser never talks to the chatbot's webhook directly. Two reasons:
//   1. The webhook URL (and secret, if there is one) are not meant to be
//      public. Anything in a VITE_ variable ships to every visitor.
//   2. This is where the limits live — message size, requests per minute,
//      one question at a time per conversation — so the bot can't be
//      spammed or run up a bill through our site.
//
// Environment (Railway → Variables, never in a file or in Git):
//   CHAT_WEBHOOK_URL      required. The PRODUCTION webhook URL from the bot's
//                         developer (an n8n URL containing /webhook/, not
//                         /webhook-test/)
//   CHAT_WEBHOOK_SECRET   optional. Sent as the `x-paragon-secret` header so
//                         the workflow can reject calls that don't come from us
//   CHAT_TIMEOUT_MS       optional, default 30000 (an AI answer is slow)
//
// What we send to the webhook (JSON POST):
//   { message, chatInput, sessionId, page, source: 'paragon-web', timestamp }
//   `chatInput` duplicates `message` because n8n's chat nodes read that name.
//
// What we accept back: plain text, or JSON with the answer under one of
//   output | reply | response | text | message | answer  (also inside an
//   array, or inside `data`).

const router = express.Router()

const MAX_MESSAGE_CHARS = 1000
const MAX_REPLY_CHARS = 4000
const MAX_IN_FLIGHT = 15
const SESSION_RE = /^[A-Za-z0-9_-]{8,64}$/
const PAGE_RE = /^\/[A-Za-z0-9/_\-.]{0,99}$/

const timeoutMs = () => {
  const n = parseInt(process.env.CHAT_TIMEOUT_MS || '30000', 10)
  return Number.isFinite(n) ? Math.min(60000, Math.max(1000, n)) : 30000
}

const isConfigured = () => {
  try {
    const u = new URL(process.env.CHAT_WEBHOOK_URL || '')
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

// One question at a time per conversation, and a ceiling on the total that
// can be waiting on the bot at once.
const busySessions = new Set()
let inFlight = 0

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'You are sending messages too quickly. Please wait a moment.', code: 'RATE_LIMITED' },
})

// Pulls the answer text out of whatever shape the workflow returns.
function extractReply(data, depth = 0) {
  if (data == null || depth > 3) return null
  if (typeof data === 'string') return data.trim() || null
  if (Array.isArray(data)) {
    for (const item of data) {
      const r = extractReply(item, depth + 1)
      if (r) return r
    }
    return null
  }
  if (typeof data === 'object') {
    for (const key of ['output', 'reply', 'response', 'text', 'message', 'answer']) {
      if (typeof data[key] === 'string' && data[key].trim()) return data[key].trim()
    }
    for (const key of ['data', 'json', 'result', 'output', 'response']) {
      if (data[key] && typeof data[key] === 'object') {
        const r = extractReply(data[key], depth + 1)
        if (r) return r
      }
    }
  }
  return null
}

// Strips control characters; the frontend renders text, never HTML, but there
// is no reason to pass odd bytes along.
function cleanReply(text) {
  return String(text)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .slice(0, MAX_REPLY_CHARS)
}

// ─── GET /api/chat/status ──────────────────────────────────────────────
// Lets the site hide the chat button when the bot isn't configured, rather
// than show a launcher that can only fail.
router.get('/status', (req, res) => {
  res.json({ available: isConfigured() })
})

// ─── POST /api/chat/message ────────────────────────────────────────────
router.post('/message', chatLimiter, async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({
      error: 'Support chat is not available right now.',
      code: 'ASSISTANT_OFFLINE',
    })
  }

  const { message, sessionId, page } = req.body || {}

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Please type a message.' })
  }
  const text = message.trim()
  if (text.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({ error: 'Message is too long (max ' + MAX_MESSAGE_CHARS + ' characters).' })
  }
  if (typeof sessionId !== 'string' || !SESSION_RE.test(sessionId)) {
    return res.status(400).json({ error: 'Invalid session.' })
  }
  const pagePath = typeof page === 'string' && PAGE_RE.test(page) ? page : undefined

  if (busySessions.has(sessionId)) {
    return res.status(429).json({
      error: 'Still answering your last message — one moment.',
      code: 'SESSION_BUSY',
    })
  }
  if (inFlight >= MAX_IN_FLIGHT) {
    return res.status(503).json({
      error: 'Support is very busy right now. Please try again shortly.',
      code: 'OVERLOADED',
    })
  }

  busySessions.add(sessionId)
  inFlight++
  const started = Date.now()

  try {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/plain' }
    if (process.env.CHAT_WEBHOOK_SECRET) headers['x-paragon-secret'] = process.env.CHAT_WEBHOOK_SECRET

    const upstream = await fetch(process.env.CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: text,
        chatInput: text,
        sessionId,
        page: pagePath,
        source: 'paragon-web',
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(timeoutMs()),
    })

    const raw = await upstream.text()

    if (!upstream.ok) {
      // Message contents are never logged — people paste wallet addresses
      // and other private details into support chats.
      console.error('[chat] webhook returned', upstream.status,
        upstream.status === 404
          ? '(not registered — is the workflow active, and is this the production /webhook/ URL rather than /webhook-test/?)'
          : '')
      return res.status(503).json({
        error: 'Support chat is unavailable right now. Please try again in a few minutes.',
        code: 'ASSISTANT_OFFLINE',
      })
    }

    let data = raw
    try { data = JSON.parse(raw) } catch { /* plain text answer */ }

    const reply = extractReply(data)
    if (!reply) {
      console.error('[chat] webhook answered', upstream.status, 'but no reply text was found (' + raw.length + ' bytes)')
      return res.status(502).json({
        error: 'The assistant did not send an answer. Please try again.',
        code: 'NO_REPLY',
      })
    }

    console.log('[chat] ok in', Date.now() - started, 'ms')
    return res.json({ reply: cleanReply(reply) })
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      console.error('[chat] webhook timed out after', Date.now() - started, 'ms')
      return res.status(504).json({
        error: 'The assistant took too long to answer. Please try again.',
        code: 'TIMEOUT',
      })
    }
    console.error('[chat] webhook request failed:', err?.message)
    return res.status(502).json({
      error: 'Could not reach support right now. Please try again.',
      code: 'UPSTREAM_ERROR',
    })
  } finally {
    busySessions.delete(sessionId)
    inFlight--
  }
})

export default router