// Multi-source swap quoting.
//
// Each liquidity source is an adapter with the same shape, so adding one is
// dropping an object into SOURCES rather than touching the UI. Quotes are
// fetched in parallel and reported as they land, which is what lets the
// interface fill the list progressively instead of blocking on the slowest
// venue.
//
// A source returning null means "no route here" — a normal outcome on a
// young DEX, not an error worth surfacing.

import { getSwapQuote as getUnitflowQuote, SWAP_TOKENS } from './unitflowSwap'

// ParagonFinance takes a flat fee per swap, settled to Treasury by the
// router. Flat rather than percentage because at these sizes a percentage
// fee is either invisible or punitive, with little in between.
export const SWAP_FEE_USDC = 0.1

export const PARAGON_SWAP_ROUTER = import.meta.env.VITE_SWAP_ROUTER_ADDRESS || null

// ─── Synthra ──────────────────────────────────────────────────────────────
// Synthra runs SynRoute on Arc with a quote/calldata API in front of it.
// The endpoint isn't published in their public docs, so it's read from env
// and the adapter no-ops until it's set — the aggregator still works with
// UnitFlow alone, and Synthra appears in the list the moment it's
// configured.
const SYNTHRA_API = import.meta.env.VITE_SYNTHRA_API || null

async function getSynthraQuote({ tokenIn, tokenOut, amountIn }) {
  if (!SYNTHRA_API) return null

  try {
    const url =
      SYNTHRA_API.replace(/\/$/, '') +
      '/quote' +
      '?tokenIn=' + encodeURIComponent(tokenIn.address) +
      '&tokenOut=' + encodeURIComponent(tokenOut.address) +
      '&amountIn=' + encodeURIComponent(amountIn) +
      '&chainId=5042002'

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null

    const data = await res.json()
    // Shape varies between aggregators; accept the common spellings rather
    // than assuming one.
    const out = data.amountOut ?? data.outAmount ?? data.toAmount ?? data.quote
    if (out === undefined || out === null) return null

    return {
      amountOut: String(out),
      amountOutRaw: data.amountOutRaw ? BigInt(data.amountOutRaw) : null,
      route: data.route || data.path || null,
      calldata: data.calldata || data.data || null,
      to: data.to || data.router || null,
      raw: data,
    }
  } catch {
    return null
  }
}

// ─── Sources ──────────────────────────────────────────────────────────────
export const SOURCES = [
  {
    id: 'unitflow',
    name: 'UnitFlow',
    logo: '/dex/unitflow.svg',
    color: '#00D4FF',
    getQuote: async ({ tokenIn, tokenOut, amountIn }) => {
      const q = await getUnitflowQuote({ tokenIn, tokenOut, amountIn })
      if (!q) return null
      return {
        amountOut: q.amountOut,
        amountOutRaw: q.amountOutRaw,
        fee: q.fee,
        inDecimals: q.inDecimals,
        outDecimals: q.outDecimals,
        amountInRaw: q.amountInRaw,
        raw: q,
      }
    },
  },
  {
    id: 'synthra',
    name: 'Synthra',
    logo: '/dex/synthra.svg',
    color: '#8B5CF6',
    getQuote: getSynthraQuote,
  },
]

/**
 * Quote every source in parallel, reporting each as it resolves.
 *
 * onProgress fires per source so the UI can show rows filling in rather
 * than a single spinner — a quote that takes three seconds shouldn't hold
 * back one that took two hundred milliseconds.
 *
 * Returns all results sorted best-first, with `best: true` on the winner.
 */
export async function getAllQuotes({ tokenIn, tokenOut, amountIn, onProgress = () => {} }) {
  if (!tokenIn?.available || !tokenOut?.available) return []
  if (!amountIn || parseFloat(amountIn) <= 0) return []

  const results = []

  await Promise.all(
    SOURCES.map(async source => {
      const started = Date.now()
      let quote = null

      try {
        quote = await source.getQuote({ tokenIn, tokenOut, amountIn })
      } catch {
        quote = null
      }

      const entry = {
        sourceId: source.id,
        name: source.name,
        logo: source.logo,
        color: source.color,
        quote,
        elapsed: Date.now() - started,
        available: quote !== null,
      }

      results.push(entry)
      onProgress(entry)
    })
  )

  // Sort by output, descending. Unavailable sources sink to the bottom so
  // they're visible but never mistaken for a route.
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
 * Worth showing only when there's a real spread — with one source, or with
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