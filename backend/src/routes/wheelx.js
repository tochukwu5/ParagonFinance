import express from 'express'
import rateLimit from 'express-rate-limit'

// WheelX quote proxy — the fallback path.
//
// WheelX's API is public (no key), so the site calls it straight from each
// visitor's browser, which also spreads WheelX's 20-requests-per-minute
// limit across visitors instead of sharing one. This route exists for the
// case where a browser can't reach it directly (for example, WheelX not
// allowing our site's origin). The frontend switches to it automatically.
//
// Only /v1/quote is proxied, only for Arc, and only with fields we
// recognise, so this can't be used as an open relay.
//
// Environment (optional):
//   WHEELX_API_BASE   defaults to https://api.wheelx.fi/v1

const router = express.Router()

const API_BASE = (process.env.WHEELX_API_BASE || 'https://api.wheelx.fi/v1').replace(/\/$/, '')
const ARC_CHAIN_ID = 5042
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const AMOUNT_RE = /^[1-9]\d{0,29}$/

// WheelX allows 20/min per IP and our server is one IP for everyone using
// this fallback. Stay under it with some margin, and cache identical quotes
// for a few seconds.
const WINDOW_MS = 60 * 1000
const MAX_PER_WINDOW = 16
const stamps = []

function budgetLeft() {
  const now = Date.now()
  while (stamps.length && now - stamps[0] > WINDOW_MS) stamps.shift()
  return stamps.length < MAX_PER_WINDOW
}

const QUOTE_TTL_MS = 8000
const cache = new Map()

function cacheGet(key) {
  const hit = cache.get(key)
  if (!hit) return null
  if (hit.expires < Date.now()) { cache.delete(key); return null }
  return hit.value
}

function cacheSet(key, value) {
  if (cache.size > 200) {
    const now = Date.now()
    for (const [k, v] of cache) if (v.expires < now) cache.delete(k)
    if (cache.size > 200) cache.clear()
  }
  cache.set(key, { value, expires: Date.now() + QUOTE_TTL_MS })
}

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many quote requests — please slow down', code: 'RATE_LIMITED' },
})

function buildBody(input) {
  const { from_token, to_token, from_address, to_address, amount, slippage, quote_only } = input || {}

  if (!ADDRESS_RE.test(from_token || '') || !ADDRESS_RE.test(to_token || '')) return { error: 'Invalid token address' }
  if (String(from_token).toLowerCase() === String(to_token).toLowerCase()) return { error: 'Choose two different tokens' }
  if (!ADDRESS_RE.test(from_address || '') || !ADDRESS_RE.test(to_address || '')) return { error: 'Invalid wallet address' }
  if (typeof amount !== 'string' || !AMOUNT_RE.test(amount)) return { error: 'Invalid amount' }

  let slip
  if (slippage !== undefined && slippage !== null) {
    slip = Number(slippage)
    if (!Number.isInteger(slip) || slip < 0 || slip > 2000) return { error: 'Invalid slippage' }
  }

  return {
    body: {
      from_chain: ARC_CHAIN_ID,
      to_chain: ARC_CHAIN_ID,
      from_token,
      to_token,
      from_address,
      to_address,
      amount,
      ...(slip !== undefined ? { slippage: slip } : {}),
      quote_only: quote_only !== false,
    },
  }
}

// ─── POST /api/wheelx/quote ────────────────────────────────────────────
router.post('/quote', limiter, async (req, res) => {
  try {
    const { body, error } = buildBody(req.body)
    if (error) return res.status(400).json({ error })

    // Only display quotes are cached. A quote_only:false request is built
    // for one specific swap and is never shared.
    const cacheKey = body.quote_only ? JSON.stringify(body) : null
    if (cacheKey) {
      const cached = cacheGet(cacheKey)
      if (cached) return res.status(200).json(cached)
    }

    if (!budgetLeft()) {
      res.set('Retry-After', '15')
      return res.status(429).json({ error: 'Quotes are busy — try again shortly', code: 'RATE_LIMITED' })
    }
    stamps.push(Date.now())

    const upstream = await fetch(API_BASE + '/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })
    const json = await upstream.json().catch(() => ({}))

    if (upstream.ok) {
      if (cacheKey) cacheSet(cacheKey, json)
      return res.status(200).json(json)
    }

    if (upstream.status === 429) res.set('Retry-After', upstream.headers.get('retry-after') || '30')
    // Keep the status and a short message; drop everything else.
    return res.status(upstream.status === 422 ? 422 : upstream.status === 429 ? 429 : 502).json({
      error: typeof json?.error === 'string' ? json.error.slice(0, 200)
        : upstream.status === 422 ? 'WheelX could not price this swap' : 'WheelX request failed',
      code: upstream.status === 429 ? 'RATE_LIMITED' : undefined,
    })
  } catch (err) {
    console.error('WheelX quote error:', err?.message)
    res.status(502).json({ error: 'Could not reach WheelX' })
  }
})

export default router