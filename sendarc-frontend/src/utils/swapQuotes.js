// Multi-source swap quoting.
//
// Each liquidity source is an adapter with the same shape, so adding one is
// dropping an object into SOURCES rather than touching the UI. Quotes are
// fetched in parallel and reported as they land, which lets the interface
// fill progressively instead of blocking on the slowest venue.
//
// The two venues are quoted differently on purpose:
//
//   UnitFlow — on-chain QuoterV2. No API exists, and single-pool stablecoin
//   pairs don't need one.
//
//   Synthra — their REST API. It handles multi-hop routing that an on-chain
//   single-pool quote would miss, and the matching /swap endpoint returns
//   ready-made calldata, which is what makes execution through
//   ParagonFinanceSwapRouter possible without reimplementing their router.

import { getSwapQuote as getUnitflowQuote, SWAP_TOKENS } from './unitflowSwap'

// ParagonFinance takes a flat fee per swap, settled to Treasury by
// ParagonFinanceSwapRouter. Flat rather than percentage because swap sizes
// vary far more than transfers do, and a percentage is either invisible on
// small trades or punitive on large ones.
export const SWAP_FEE_USDC = 0.1

export const PARAGON_SWAP_ROUTER = import.meta.env.VITE_SWAP_ROUTER_ADDRESS || null

// ─── Synthra ──────────────────────────────────────────────────────────────
// Endpoint and auth confirmed from their app's own network traffic:
//   POST https://trading-api.synthra.org/v1/quote
//   header: x-api-key
//   CORS: access-control-allow-origin: * — so browser calls are fine and
//   no proxy is needed.
const SYNTHRA_API = (import.meta.env.VITE_SYNTHRA_API || '').replace(/\/$/, '') || null
const SYNTHRA_KEY = import.meta.env.VITE_SYNTHRA_KEY || null

const ARC_CHAIN_ID = 5042002

// Synthra prices tokens at their ERC-20 decimals and uses the native USDC
// address directly — 5 USDC posts as "5000000", not "5e18". Arc's 18-decimal
// native representation applies to value fields on-chain, not to this API,
// and conflating the two would misquote by twelve orders of magnitude.
const SYNTHRA_DECIMALS = {
  USDC: 6,
  EURC: 6,
  cirBTC: 8,
  USDT: 6,
}

function synthraDecimals(token) {
  return SYNTHRA_DECIMALS[token.symbol] ?? token.decimals ?? 18
}

function parseUnits(value, decimals) {
  const [whole = '0', frac = ''] = String(value).split('.')
  return BigInt((whole || '0') + (frac + '0'.repeat(decimals)).slice(0, decimals))
}

function formatUnits(raw, decimals) {
  const s = BigInt(raw).toString().padStart(decimals + 1, '0')
  const w = s.slice(0, s.length - decimals)
  const f = s.slice(s.length - decimals).replace(/0+$/, '')
  return f ? w + '.' + f : w
}

/**
 * Pull the output amount out of Synthra's response.
 *
 * Written defensively because the response shape hasn't been observed yet —
 * only the request has. Aggregators vary on whether they return raw units or
 * a decimal string, and on what they call the field. Rather than assume one
 * and fail silently, this tries the common spellings and logs what it
 * actually received when none match, so the gap surfaces in the console
 * instead of as a permanent "No route".
 */
function extractAmountOut(data, outDecimals) {
  const candidates = [
    data?.amountOut,
    data?.outputAmount,
    data?.toAmount,
    data?.quote?.amountOut,
    data?.route?.amountOut,
    data?.amountOutRaw,
    data?.destinationAmount,
  ]

  for (const c of candidates) {
    if (c === undefined || c === null) continue

    const s = String(c)

    // A decimal point means it's already human-readable.
    if (s.includes('.')) {
      const n = parseFloat(s)
      if (isFinite(n) && n > 0) {
        return { display: s, raw: parseUnits(s, outDecimals) }
      }
      continue
    }

    try {
      const raw = BigInt(s)
      if (raw > 0n) return { display: formatUnits(raw, outDecimals), raw }
    } catch { /* not numeric, try the next */ }
  }

  console.warn(
    '[synthra] could not find an output amount in the response. ' +
    'Shape received:', data
  )
  return null
}

async function getSynthraQuote({ tokenIn, tokenOut, amountIn, account }) {
  // Distinct from returning null. Null means "asked, no liquidity"; this
  // means "never asked" — reporting the second as the first would claim a
  // partner has no depth when we simply hadn't configured them.
  if (!SYNTHRA_API || !SYNTHRA_KEY) return { unconfigured: true }
  if (!tokenIn.address || !tokenOut.address) return null

  const inDecimals = synthraDecimals(tokenIn)
  const outDecimals = synthraDecimals(tokenOut)
  const amountRaw = parseUnits(amountIn, inDecimals)

  // Quoting needs an address, but not the user's. Falling back to the zero
  // address means the panel still fills before a wallet is connected —
  // someone comparing rates shouldn't have to connect first.
  const who = account || '0x0000000000000000000000000000000000000000'

  const body = {
    chainId: ARC_CHAIN_ID,
    tokenIn: tokenIn.address,
    tokenInDecimals: inDecimals,
    tokenInSymbol: tokenIn.symbol,
    tokenOut: tokenOut.address,
    tokenOutDecimals: outDecimals,
    tokenOutSymbol: tokenOut.symbol,
    amount: amountRaw.toString(),
    sender: who,
    recipient: who,
    // 0 = EXACT_INPUT, matching TradeType in their SDK.
    tradeType: 0,
    strictDestinationSwap: false,
  }

  try {
    const res = await fetch(SYNTHRA_API + '/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SYNTHRA_KEY,
      },
      body: JSON.stringify(body),
      // Without a ceiling, one slow venue holds the whole panel. Eight
      // seconds is generous for a quote and still short enough that a user
      // isn't left watching a spinner.
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.warn('[synthra] auth rejected — check VITE_SYNTHRA_KEY')
      }
      return null
    }

    const data = await res.json()
    const out = extractAmountOut(data, outDecimals)
    if (!out) return null

    return {
      amountOut: out.display,
      amountOutRaw: out.raw,
      amountInRaw: amountRaw,
      inDecimals,
      outDecimals,
      // Kept so execution can reuse the route this quote was priced against
      // rather than re-deriving one that may differ.
      route: data.route ?? data.path ?? null,
      priceImpact: data.priceImpact ?? null,
      venue: 'synthra',
      raw: data,
    }
  } catch (err) {
    if (err?.name === 'TimeoutError') {
      console.warn('[synthra] quote timed out')
    }
    return null
  }
}

/**
 * Fetch executable calldata for a Synthra swap.
 *
 * Separate from quoting because it needs the real sender and a slippage
 * bound, and because a quote that's only being displayed shouldn't be
 * generating transaction data.
 */
export async function getSynthraSwapCalldata({
  tokenIn, tokenOut, amountIn, account, slippageBps = 50,
}) {
  if (!SYNTHRA_API || !SYNTHRA_KEY) throw new Error('Synthra is not configured')
  if (!account) throw new Error('Wallet not connected')

  const inDecimals = synthraDecimals(tokenIn)
  const outDecimals = synthraDecimals(tokenOut)

  const body = {
    chainId: ARC_CHAIN_ID,
    tokenIn: tokenIn.address,
    tokenInDecimals: inDecimals,
    tokenInSymbol: tokenIn.symbol,
    tokenOut: tokenOut.address,
    tokenOutDecimals: outDecimals,
    tokenOutSymbol: tokenOut.symbol,
    amount: parseUnits(amountIn, inDecimals).toString(),
    sender: account,
    recipient: account,
    tradeType: 0,
    strictDestinationSwap: false,
    slippageBps,
  }

  const res = await fetch(SYNTHRA_API + '/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': SYNTHRA_KEY },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  })

  if (!res.ok) throw new Error('Synthra swap request failed: ' + res.status)
  return res.json()
}

// ─── Sources ──────────────────────────────────────────────────────────────
export const SOURCES = [
  {
    id: 'unitflow',
    name: 'UnitFlow',
    logo: '/dex/unitflow.webp',
    color: '#00D4FF',
    getQuote: async ({ tokenIn, tokenOut, amountIn }) => {
      const q = await getUnitflowQuote({ tokenIn, tokenOut, amountIn })
      if (!q) return null
      return {
        amountOut: q.amountOut,
        amountOutRaw: q.amountOutRaw,
        amountInRaw: q.amountInRaw,
        fee: q.fee,
        inDecimals: q.inDecimals,
        outDecimals: q.outDecimals,
        venue: 'unitflow',
        raw: q,
      }
    },
  },
  {
    id: 'synthra',
    name: 'Synthra',
    logo: '/dex/synthra.png',
    color: '#8B5CF6',
    getQuote: getSynthraQuote,
  },
]

/**
 * Quote every source in parallel, reporting each as it resolves.
 *
 * onProgress fires per source so the UI can show rows filling in rather than
 * a single spinner — a quote taking three seconds shouldn't hold back one
 * that took two hundred milliseconds.
 *
 * Returns all results sorted best-first, with `best: true` on the winner.
 */
export async function getAllQuotes({ tokenIn, tokenOut, amountIn, account, onProgress = () => {} }) {
  if (!tokenIn?.available || !tokenOut?.available) return []
  if (!amountIn || parseFloat(amountIn) <= 0) return []

  const results = []

  await Promise.all(
    SOURCES.map(async source => {
      const started = Date.now()
      let quote = null

      try {
        quote = await source.getQuote({ tokenIn, tokenOut, amountIn, account })
      } catch {
        quote = null
      }

      const unconfigured = quote?.unconfigured === true

      const entry = {
        sourceId: source.id,
        name: source.name,
        logo: source.logo,
        color: source.color,
        quote: unconfigured ? null : quote,
        elapsed: Date.now() - started,
        available: !unconfigured && quote !== null,
        unconfigured,
      }

      results.push(entry)
      onProgress(entry)
    })
  )

  // Sort by output, descending. Unavailable sources sink to the bottom so
  // they stay visible but are never mistaken for a route.
  const sorted = results.sort((a, b) => {
    if (!a.available && !b.available) return 0
    if (!a.available) return 1
    if (!b.available) return -1
    return parseFloat(b.quote.amountOut) - parseFloat(a.quote.amountOut)
  })

  if (sorted.length && sorted[0].available) sorted[0].best = true

  return sorted
}

/**
 * Percentage the best quote beats the second-best by.
 *
 * Worth showing only when there's a real spread — with one venue, or with
 * near-identical fills, the number is noise dressed up as insight.
 */
export function bestPriceEdge(quotes) {
  const live = quotes.filter(q => q.available)
  if (live.length < 2) return null

  const best = parseFloat(live[0].quote.amountOut)
  const next = parseFloat(live[1].quote.amountOut)
  if (!next) return null

  const edge = ((best - next) / next) * 100
  return edge > 0.01 ? edge : null
}

export { SWAP_TOKENS }