import express from 'express'
import rateLimit from 'express-rate-limit'

// AchSwap proxy.
//
// The AchSwap API key is a secret ("keep it server-side only" in their docs),
// and anything in a VITE_ variable is shipped to every visitor's browser. So
// the browser never talks to AchSwap directly: it calls these two routes, and
// this file adds the key, the fee settings and the limits AchSwap asks for.
//
// Environment (set in Railway → Variables, never in a file or in Git):
//   ACHSWAP_API_KEY        required
//   ACHSWAP_FEE_BPS        optional, default 0. ParagonFinance charges its
//                          flat 0.1 USDC per swap on every venue (collected by
//                          the frontend), so no in-swap fee is added here.
//                          Leave it unset unless you want an extra percentage.
//   ACHSWAP_FEE_RECIPIENT  only needed when ACHSWAP_FEE_BPS is above 0
//   ACHSWAP_API_BASE       optional, defaults to AchSwap's production URL

const router = express.Router()

const API_BASE = (process.env.ACHSWAP_API_BASE || 'https://trade.achswap.app/api/v1').replace(/\/$/, '')
const ARC_CHAIN_ID = 5042
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const AMOUNT_RE = /^[1-9]\d{0,29}$/

// AchSwap allows 2 requests in flight per key. More than that gets a 429, so
// extra requests wait their turn here instead of failing.
const MAX_IN_FLIGHT = 2
const MAX_QUEUED = 30
let active = 0
const waiters = []

function acquire() {
  if (active < MAX_IN_FLIGHT) { active++; return Promise.resolve() }
  if (waiters.length >= MAX_QUEUED) {
    const err = new Error('busy')
    err.busy = true
    return Promise.reject(err)
  }
  return new Promise(resolve => waiters.push(resolve))
}

function release() {
  const next = waiters.shift()
  if (next) next()   // hand the slot straight over; `active` stays counted
  else active--
}

// Quotes are indicative, and AchSwap suggests sharing one between users who
// are looking at the same pair and amount for a few seconds. This is also
// what keeps a busy page inside the per-key request limit.
const QUOTE_TTL_MS = 8000
const quoteCache = new Map()

function cacheGet(key) {
  const hit = quoteCache.get(key)
  if (!hit) return null
  if (hit.expires < Date.now()) { quoteCache.delete(key); return null }
  return hit.value
}

function cacheSet(key, value) {
  if (quoteCache.size > 300) {
    const now = Date.now()
    for (const [k, v] of quoteCache) if (v.expires < now) quoteCache.delete(k)
    if (quoteCache.size > 300) quoteCache.clear()
  }
  quoteCache.set(key, { value, expires: Date.now() + QUOTE_TTL_MS })
}

// Our own per-visitor limits, so one browser can't spend the whole key's
// allowance. The swap route is called only when someone confirms.
const quoteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 45,
  message: { error: 'Too many quote requests — please slow down', code: 'RATE_LIMITED' },
})
const swapLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  message: { error: 'Too many swap requests — please slow down', code: 'RATE_LIMITED' },
})

function feeSettings() {
  const raw = parseInt(process.env.ACHSWAP_FEE_BPS ?? '0', 10)
  const feeBps = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0
  const feeRecipient = process.env.ACHSWAP_FEE_RECIPIENT || ''
  if (feeBps > 0 && !ADDRESS_RE.test(feeRecipient)) return { error: true }
  return feeBps > 0 ? { feeBps, feeRecipient } : { feeBps: 0 }
}

// Only what the browser is allowed to choose. Fee, recipient and chain are
// ours, so a caller can't set their own fee or redirect ours.
function buildBody(input, withSender) {
  const { tokenIn, tokenOut, amountIn, slippageBps, sender, recipient, deadline } = input || {}

  if (!ADDRESS_RE.test(tokenIn || '') || !ADDRESS_RE.test(tokenOut || '')) {
    return { error: 'Invalid token address' }
  }
  if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
    return { error: 'Choose two different tokens' }
  }
  if (typeof amountIn !== 'string' || !AMOUNT_RE.test(amountIn)) {
    return { error: 'Invalid amount' }
  }

  let slip = 50
  if (slippageBps !== undefined) {
    slip = Number(slippageBps)
    if (!Number.isInteger(slip) || slip < 0 || slip > 2000) return { error: 'Invalid slippage' }
  }

  const fee = feeSettings()
  if (fee.error) return { error: 'Swap fee is not configured', status: 503 }

  const body = {
    chainId: ARC_CHAIN_ID,
    tokenIn,
    tokenOut,
    amountIn,
    slippageBps: slip,
    ...(fee.feeBps > 0 ? { feeBps: fee.feeBps, feeRecipient: fee.feeRecipient } : {}),
  }

  if (withSender) {
    if (!ADDRESS_RE.test(sender || '')) return { error: 'Invalid sender address' }
    body.sender = sender
    if (recipient !== undefined) {
      if (!ADDRESS_RE.test(recipient)) return { error: 'Invalid recipient address' }
      body.recipient = recipient
    }
    if (deadline !== undefined) {
      const d = Number(deadline)
      if (!Number.isInteger(d)) return { error: 'Invalid deadline' }
      body.deadline = d
    }
  }

  return { body }
}

async function callAchswap(path, body) {
  const key = process.env.ACHSWAP_API_KEY
  if (!key) {
    return { status: 503, json: { error: 'AchSwap is not configured', code: 'UNAVAILABLE' } }
  }

  await acquire()
  try {
    // Two attempts at most, and only for the failures AchSwap says are
    // temporary. A 409 or 422 is an answer, not a glitch.
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(API_BASE + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })

      const json = await res.json().catch(() => ({}))
      const retryable = [502, 503, 504].includes(res.status)

      if (retryable && attempt === 0) {
        const wait = Math.min(2000, (parseInt(res.headers.get('retry-after') || '0', 10) || 0) * 1000 || 600)
        await new Promise(r => setTimeout(r, wait))
        continue
      }

      return { status: res.status, json, retryAfter: res.headers.get('retry-after') }
    }
    return { status: 503, json: { error: 'AchSwap is busy', code: 'OVERLOADED' } }
  } finally {
    release()
  }
}

// Passes AchSwap's answer through, minus anything that isn't ours to share.
function respond(res, upstream) {
  if (upstream.retryAfter) res.set('Retry-After', upstream.retryAfter)
  const j = upstream.json || {}
  if (upstream.status >= 200 && upstream.status < 300) return res.status(200).json(j)

  // Errors: keep the code, the reason and the request id so a failure can be
  // traced with AchSwap's support, drop everything else.
  return res.status(upstream.status === 401 ? 502 : upstream.status).json({
    error: j.error || j.message || 'AchSwap request failed',
    code: upstream.status === 401 ? 'UPSTREAM_AUTH' : j.code,
    reason: j.reason,
    requestId: j.requestId,
  })
}

// ─── POST /api/achswap/quote ───────────────────────────────────────────
router.post('/quote', quoteLimiter, async (req, res) => {
  try {
    const { body, error, status } = buildBody(req.body, false)
    if (error) return res.status(status || 400).json({ error })

    const cacheKey = JSON.stringify(body)
    const cached = cacheGet(cacheKey)
    if (cached) return res.status(200).json(cached)

    const upstream = await callAchswap('/quote', body)
    if (upstream.status >= 200 && upstream.status < 300) cacheSet(cacheKey, upstream.json)
    return respond(res, upstream)
  } catch (err) {
    if (err.busy) return res.status(503).json({ error: 'Quotes are busy — try again shortly', code: 'OVERLOADED' })
    console.error('AchSwap quote error:', err?.message)
    res.status(502).json({ error: 'Could not reach AchSwap' })
  }
})

// ─── POST /api/achswap/swap ────────────────────────────────────────────
// Builds the transaction for the connected wallet. Never cached: it is
// specific to the sender and has to be fresh when the user signs.
router.post('/swap', swapLimiter, async (req, res) => {
  try {
    const { body, error, status } = buildBody(req.body, true)
    if (error) return res.status(status || 400).json({ error })

    const upstream = await callAchswap('/swap', body)
    return respond(res, upstream)
  } catch (err) {
    if (err.busy) return res.status(503).json({ error: 'Swaps are busy — try again shortly', code: 'OVERLOADED' })
    console.error('AchSwap swap error:', err?.message)
    res.status(502).json({ error: 'Could not reach AchSwap' })
  }
})

export default router