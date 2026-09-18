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
import { executeSwap as executeUnitflowSwap } from './unitflowSwap'
export const PARAGON_SWAP_ROUTER = import.meta.env.VITE_SWAP_ROUTER_ADDRESS || null


// ParagonFinance takes a flat fee per swap, settled to Treasury by
// ParagonFinanceSwapRouter. Flat rather than percentage because swap sizes
// vary far more than transfers do, and a percentage is either invisible on



function extractSynthraTx(data) {
  // console.log('[synthra] /swap response:', JSON.stringify(data, null, 2))
  const tx = data?.transaction || data?.tx || data?.swap || data
 
  const to = tx?.to || tx?.router || tx?.target || tx?.address
  const calldata = tx?.data || tx?.calldata || tx?.callData || tx?.input
  const value = tx?.value ?? tx?.msgValue ?? '0'
 
  if (!to || !calldata) {
    console.warn('[synthra] no transaction in /swap response. Shape received:', data)
    return null
  }
 
  return {
    to,
    data: calldata.startsWith('0x') ? calldata : '0x' + calldata,
    value: typeof value === 'string' && value.startsWith('0x')
      ? BigInt(value)
      : BigInt(value || 0),
  }
}
 
/**
 * Execute a Synthra swap using calldata from their API.
 *
 * Synthra runs a UniversalRouter behind Permit2, and treats Arc's USDC as an
 * ERC-20 at 0x3600… rather than as native value — their transaction.value is
 * always "0" and the router pulls tokens through Permit2 instead.
 *
 * That means two allowances before the first swap:
 *   1. ERC-20 approve  → Permit2
 *   2. Permit2 approve → their UniversalRouter
 *
 * Their API also offers a signature path (approval.permit2.typedData) that
 * would collapse step 2 into an off-chain signature. We use the on-chain
 * approve instead: the returned calldata carries no PERMIT2_PERMIT command,
 * so a signature would have nowhere to go without re-requesting the route.
 * One extra first-time prompt is a fair trade for not depending on that.
 *
 * Note their Permit2 is the canonical 0x0000…78BA3, which is NOT the one
 * UnitFlow uses — approving for one venue grants nothing to the other.
 */
async function executeSynthraSwap({
  tokenIn, tokenOut, amountIn, quote, slippageBps, provider, from, onStatus,
}) {
  const start = Date.now()

  onStatus('Building route via Synthra...')

  const res = await getSynthraSwapCalldata({
    tokenIn, tokenOut, amountIn, account: from, slippageBps,
  })

  const tx = extractSynthraTx(res)
  if (!tx) {
    throw new Error(
      'Synthra returned a quote but no executable transaction. ' +
      'This pair may be quote-only for now — try UnitFlow instead.'
    )
  }

  const approval = res?.approval || null

  // Step 1: ERC-20 → Permit2. Their API hands back ready-made calldata, so
  // we send theirs rather than re-encoding an approve ourselves.
  const tokenApproval = approval?.tokenApproval
  if (tokenApproval?.needsApproval && tokenApproval?.approveTransaction) {
    const a = tokenApproval.approveTransaction
    onStatus('Approve ' + tokenIn.symbol + ' for Synthra (1 of 2)...')
    await provider.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: a.to, data: a.data, value: '0x0', gas: '0x186A0' }],
    })
  }

  // Step 2: Permit2 → router.
  const p2 = approval?.permit2
  if (p2?.available && p2?.spender && BigInt(p2.currentAllowance || '0') === 0n) {
    // Permit2.approve(address token, address spender, uint160 amount, uint48 expiration)
    const MAX_UINT160 = (1n << 160n) - 1n
    const expiration = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60)
    const pad = (v) => BigInt(v).toString(16).padStart(64, '0')
    const addr = (v) => String(v).replace(/^0x/, '').toLowerCase().padStart(64, '0')

    const data = '0x87517c45'
      + addr(approval.token?.address || tokenIn.address)
      + addr(p2.spender)
      + pad(MAX_UINT160)
      + pad(expiration)

    onStatus('Approve Synthra router (2 of 2)...')
    await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to: p2.permit2Address || '0x000000000022D473030F116dDEE9F6B43aC78BA3',
        data,
        value: '0x0',
        gas: '0x186A0',
      }],
    })
  }

  onStatus('Confirm the swap in your wallet...')

  // Use their gasLimit when given — they simulated the route and know how
  // many hops it takes. This one splits 10/90 across four pools, which a
  // fixed guess would likely underestimate.
   const gasLimit = res?.transaction?.gasLimit
    ? '0x' + Math.ceil(Number(res.transaction.gasLimit) * 1.2).toString(16)
    : '0x927C0'

  const txHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: tx.to,
      data: tx.data,
      value: tx.value > 0n ? '0x' + tx.value.toString(16) : '0x0',
      gas: gasLimit,
    }],
  })

  onStatus('Waiting for confirmation...')

  let receipt = null
  for (let i = 0; i < 40 && !receipt; i++) {
    await new Promise(r => setTimeout(r, 500))
    try {
      receipt = await provider.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      })
    } catch { /* keep polling */ }
  }

  if (receipt && receipt.status === '0x0') {
    // V3TooLittleReceived is the usual cause — the pool moved between quote
    // and execution and the fill landed under minOut. Blaming approvals sent
    // people to check something that wasn't the problem.
    throw new Error(
      'Swap reverted — the price moved beyond your ' +
      (slippageBps / 100).toFixed(2) + '% slippage tolerance. ' +
      'Try again, or raise the tolerance to 1%.'
    )
  }
 // ← NEW CODE STARTS HERE
  console.log('[paragon] router:', PARAGON_SWAP_ROUTER)

  let feeHash = null
  if (PARAGON_SWAP_ROUTER) {
    try {
      onStatus('Confirming ParagonFinance fee...')
      const tokenOutAddr = String(tokenOut.address || '')
        .replace(/^0x/, '').toLowerCase().padStart(64, '0')
      const feeData = '0xfe7edecc' + tokenOutAddr
      const feeValue = BigInt(1e17)

      feeHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: PARAGON_SWAP_ROUTER,
          data: feeData,
          value: '0x' + feeValue.toString(16),
          gas: '0x186A0',
        }],
      })
    } catch (err) {
      console.warn('[paragon] swap fee not collected:', err?.message)
    }
  }

  return {
    hash: txHash,
    from,
    tokenIn: tokenIn.symbol,
    tokenOut: tokenOut.symbol,
    amountIn: parseFloat(amountIn),
    amountOut: parseFloat(quote.amountOut),
    slippageBps,
    settlementTime: Date.now() - start,
    blockNumber: receipt ? parseInt(receipt.blockNumber, 16) : 0,
    status: 'confirmed',
    network: 'mainnet',
    networkLabel: 'Arc',
    chainId: 5042,
    dex: 'Synthra',
    source: 'Synthra',
    routeString: res?.routeString || null,
    swap: true,
  }
}

/**
 * Execute a Tower swap.
 *
 * Tower is an aggregator: their /quote returns routeOptions across Tower DEX,
 * Synthra, XyloNet and UnitFlow, then build-tx produces calldata for whichever
 * won. We pass their quote object back verbatim — it carries routing state we
 * shouldn't be reconstructing.
 *
 * Their TowerSwapExecutor pulls tokens via ERC-20 approval, and swap.value is
 * always "0" — so like Synthra, the ParagonFinance fee is a separate
 * transaction rather than riding inside the swap. Only UnitFlow, which takes
 * native USDC as msg.value, can be routed atomically through our contract.
 *
 * Note Tower charges 25 bps of their own (feeBps in the quote). Our 0.1 USDC
 * sits on top of that, and the review screen should say so.
 */
async function executeTowerSwap({
  tokenIn, tokenOut, amountIn, quote, slippageBps, provider, from, onStatus,
}) {
  const start = Date.now()

  onStatus('Building route via Tower...')

  const res = await fetch(TOWER_API + '/swap/build-tx', {
    method: 'POST',
    headers: towerHeaders(),
    body: JSON.stringify({
      // Their own quote object, unmodified. build-tx validates against it.
      quote: quote.towerQuote,
      userAddress: from,
    }),
    signal: AbortSignal.timeout(12000),
  })

  if (!res.ok) {
    if (res.status === 403) throw new Error("Tower key lacks the 'swaps' scope.")
    throw new Error('Tower build-tx failed: ' + res.status)
  }

  const json = await res.json()
  if (json?.success === false) {
    throw new Error(json.error || 'Tower could not build this transaction.')
  }

  const { approval, swap } = json?.data || {}
  if (!swap?.to || !swap?.data) {
    console.warn('[tower] no swap payload in build-tx response:', json)
    throw new Error('Tower returned a quote but no executable transaction.')
  }

  // Their docs: a null approval means the allowance is already in place.
  if (approval?.to && approval?.data) {
    onStatus('Approve ' + tokenIn.symbol + ' for Tower...')
    await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to: approval.to,
        data: approval.data,
        value: '0x0',
        gas: '0x' + Number(approval.gasLimit || 100000).toString(16),
      }],
    })
  }

  onStatus('Confirm the swap in your wallet...')

  const txHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: swap.to,
      data: swap.data,
      value: swap.value && swap.value !== '0'
        ? '0x' + BigInt(swap.value).toString(16)
        : '0x0',
      // Their estimate plus headroom — they simulated the route and know
      // its hop count better than a fixed guess would.
      gas: '0x' + Math.ceil(Number(swap.gasLimit || 500000) * 1.2).toString(16),
    }],
  })

  onStatus('Waiting for confirmation...')

  let receipt = null
  for (let i = 0; i < 40 && !receipt; i++) {
    await new Promise(r => setTimeout(r, 500))
    try {
      receipt = await provider.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      })
    } catch { /* keep polling */ }
  }

  if (receipt && receipt.status === '0x0') {
    throw new Error(
      'Swap reverted on Tower. If this is your first swap with them, the ' +
      'approval may not have confirmed yet — wait a moment and try again.'
    )
  }

  // Fee after the swap, same reasoning as Synthra: a reverted swap should
  // cost the user nothing.
  let feeHash = null
  if (PARAGON_SWAP_ROUTER) {
    try {
      onStatus('Confirming ParagonFinance fee...')
      const tokenOutAddr = String(tokenOut.address || '')
        .replace(/^0x/, '').toLowerCase().padStart(64, '0')
      feeHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: PARAGON_SWAP_ROUTER,
          data: '0xfe7edecc' + tokenOutAddr, // collectSwapFee(address)
          value: '0x' + BigInt(1e17).toString(16),
          gas: '0x186A0',
        }],
      })
    } catch (err) {
      console.warn('[paragon] swap fee not collected:', err?.message)
    }
  }

  return {
    hash: txHash,
    feeHash,
    from,
    tokenIn: tokenIn.symbol,
    tokenOut: tokenOut.symbol,
    amountIn: parseFloat(amountIn),
    amountOut: parseFloat(quote.amountOut),
    paragonFee: feeHash ? 0.1 : 0,
    slippageBps,
    settlementTime: Date.now() - start,
    blockNumber: receipt ? parseInt(receipt.blockNumber, 16) : 0,
    status: 'confirmed',
    network: 'mainnet',
    networkLabel: 'Arc',
    chainId: 5042,
    dex: quote.dexName || 'Tower',
    source: 'Tower',
    swap: true,
  }
}


/**
 * Execute a XyloNet swap.
 *
 * Uniswap-V2-style: approve the router, then swapExactTokensForTokens with a
 * path. Their pools take ERC-20 via transferFrom rather than native value, so
 * the ParagonFinance fee is a separate transaction — same as Synthra and
 * Tower, and for the same reason.
 */
async function executeXyloSwap({
  tokenIn, tokenOut, amountIn, quote, slippageBps, provider, from, onStatus,
}) {
  const start = Date.now()
  const inAddr = quote.tokenInAddr
  const outAddr = quote.tokenOutAddr

  // allowance(owner, spender)
  onStatus('Checking approval...')
  let allowance = 0n
  try {
    const res = await arcCall(inAddr,
      '0xdd62ed3e' + encAddress(from) + encAddress(XYLONET_ROUTER))
    if (res && res !== '0x') allowance = BigInt(res)
  } catch { /* treat as unapproved */ }

  if (allowance < quote.amountInRaw) {
    onStatus('Approve ' + tokenIn.symbol + ' for XyloNet...')
    const MAX = (1n << 256n) - 1n
    await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to: inAddr,
        data: '0x095ea7b3' + encAddress(XYLONET_ROUTER) + encUint(MAX),
        value: '0x0',
        gas: '0x186A0',
      }],
    })
  }

  const minOut = (quote.amountOutRaw * BigInt(10000 - slippageBps)) / 10000n
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300)

  // Five head words, so the address[] offset is 5 * 32 = 160. Tail carries
  // the array length then its two elements.
  const data = '0x' + XYLO_SWAP_SELECTOR
    + encUint(quote.amountInRaw)
    + encUint(minOut)
    + encUint(160)
    + encAddress(from)
    + encUint(deadline)
    + encUint(2)
    + encAddress(inAddr)
    + encAddress(outAddr)

  onStatus('Confirm the swap in your wallet...')

  const txHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: XYLONET_ROUTER, data, value: '0x0', gas: '0x493E0' }],
  })

  onStatus('Waiting for confirmation...')

  let receipt = null
  for (let i = 0; i < 40 && !receipt; i++) {
    await new Promise(r => setTimeout(r, 500))
    try {
      receipt = await provider.request({
        method: 'eth_getTransactionReceipt', params: [txHash],
      })
    } catch { /* keep polling */ }
  }

  if (receipt && receipt.status === '0x0') {
    throw new Error(
      'Swap reverted on XyloNet — the price moved beyond your ' +
      (slippageBps / 100).toFixed(2) + '% tolerance. Try again, or raise it.'
    )
  }

  // Fee after the swap, so a revert costs the user nothing.
  let feeHash = null
  if (PARAGON_SWAP_ROUTER) {
    try {
      onStatus('Confirming ParagonFinance fee...')
      feeHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: PARAGON_SWAP_ROUTER,
          data: '0xfe7edecc' + encAddress(outAddr), // collectSwapFee(address)
          value: '0x' + BigInt(1e17).toString(16),
          gas: '0x186A0',
        }],
      })
    } catch (err) {
      console.warn('[paragon] swap fee not collected:', err?.message)
    }
  }

  return {
    hash: txHash,
    feeHash,
    from,
    tokenIn: tokenIn.symbol,
    tokenOut: tokenOut.symbol,
    amountIn: parseFloat(amountIn),
    amountOut: parseFloat(quote.amountOut),
    paragonFee: feeHash ? 0.1 : 0,
    slippageBps,
    settlementTime: Date.now() - start,
    blockNumber: receipt ? parseInt(receipt.blockNumber, 16) : 0,
    status: 'confirmed',
    network: 'mainnet',
    networkLabel: 'Arc',
    chainId: 5042,
    dex: 'XyloNet',
    source: 'XyloNet',
    swap: true,
  }
}
/**
 * Execute whichever venue won the quote.
 *
 * The venue tag is set by the adapter that produced the quote, so the
 * transaction can never be built for a different router than the one whose
 * price was displayed.
 */
export async function executeSwapForQuote({
  tokenIn, tokenOut, amountIn, quoteEntry, slippageBps = 50,
  provider, from, onStatus = () => {},
}) {
  if (!quoteEntry?.quote) throw new Error('No route selected')

  const venue = quoteEntry.quote.venue || quoteEntry.sourceId

  // A ternary only handles two venues. With a third, an if-chain keeps each
  // case readable and makes adding a fourth a two-line change.
  const args = {
    tokenIn, tokenOut, amountIn,
    quote: quoteEntry.quote,
    slippageBps, provider, from, onStatus,
  }

  let result
  if (venue === 'synthra') {
    result = await executeSynthraSwap(args)
  } else if (venue === 'tower') {
    result = await executeTowerSwap(args)
      } else if (venue === 'lifi') {
    result = await executeLifiSwap(args)
  } else {
    // The mainnet V3 SwapRouter. executeUnitflowSwap built UniversalRouter
    // calldata for a contract that has no mainnet deployment.
    result = await executeUnitflowMainnetSwap(args)
  }

  // The backend's Transaction schema requires the same core fields for every
  // transaction type. A swap has amountIn and amountOut, but the schema wants
  // a single `amount` — so it was rejecting with "Missing required fields"
  // even though the swap itself had already settled on-chain.
  //
  // Normalising here rather than in each venue means a new venue can't
  // reintroduce the same gap.
  result.amount = result.amountIn ?? parseFloat(amountIn)
  result.to = result.to || from
  result.gasCost = result.gasCost ?? '0'
  result.sourceChain = result.sourceChain || 'Arc'
  result.destinationChain = result.destinationChain || 'Arc'
  result.sourceChainKey = result.sourceChainKey || 'arc'
  result.destinationChainKey = result.destinationChainKey || 'arc'
  result.cctpBridge = false

  return result
}
 



// small trades or punitive on large ones.
export const SWAP_FEE_USDC = 0.1


// ─── Synthra ──────────────────────────────────────────────────────────────
// Endpoint and auth confirmed from their app's own network traffic:
//   POST https://trading-api.synthra.org/v1/quote
//   header: x-api-key
//   CORS: access-control-allow-origin: * — so browser calls are fine and
//   no proxy is needed.
const SYNTHRA_API = (import.meta.env.VITE_SYNTHRA_API || '').replace(/\/$/, '') || null
const SYNTHRA_KEY = import.meta.env.VITE_SYNTHRA_KEY || null

// Arc mainnet. Testnet was 5042002.
const ARC_CHAIN_ID = 5042

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
  if (data?.state === 'Not found') return null
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

    console.log('[tower] decimals in/out:', inDecimals, outDecimals, 'sending:', amountRaw.toString())

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


// ═══════════════════════════════════════════════════════════════════════════
// LI.FI ADAPTER
//
// Append to src/utils/swapQuotes.js, above the SOURCES array.
// Then add the entry and the execute branch shown at the bottom.
//
// LI.FI is an aggregator that routes across many DEXes. XyloNet's own swap
// is a LI.FI frontend, so integrating LI.FI covers XyloNet and whatever else
// they aggregate on Arc, rather than three separate integrations.
//
// Simplest of the four: a public API with no key, and /v1/quote returns a
// ready-made transactionRequest — no calldata to build, no encoding to get
// wrong. What we lose is control over the route, which is the trade the
// aggregator exists to make.
// ═══════════════════════════════════════════════════════════════════════════

const LIFI_API = 'https://li.quest/v1'

// Registered with LI.FI. Their fee-split machinery reads this, so a revenue
// share can be switched on later without touching this code.
const LIFI_INTEGRATOR = 'paragonfinance'

// The LI.FI Diamond on Arc. Both the approval spender and the call target —
// their response confirms this on every quote, but pinning it means a
// malformed response can't redirect an approval somewhere else.
const LIFI_DIAMOND = '0xA4072583658Fae592A3506A42431cb6316a8d40b'

async function getLifiQuote({ tokenIn, tokenOut, amountIn, account, slippageBps = 50 }) {
  if (!tokenIn.address || !tokenOut.address) return null

  const inDecimals = synthraDecimals(tokenIn)
  const outDecimals = synthraDecimals(tokenOut)
  const amountRaw = parseUnits(amountIn, inDecimals)

  // Quoting needs an address but not the user's — someone comparing rates
  // shouldn't have to connect a wallet first.
  const who = account || '0x0000000000000000000000000000000000000000'

  try {
    const url = new URL(LIFI_API + '/quote')
    url.search = new URLSearchParams({
      fromChain: '5042',
      toChain: '5042',
      fromToken: tokenIn.address,
      toToken: tokenOut.address,
      fromAmount: amountRaw.toString(),
      fromAddress: who,
      integrator: LIFI_INTEGRATOR,
      // LI.FI takes a fraction, not basis points.
      slippage: String(slippageBps / 10000),
    }).toString()

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null

    const data = await res.json()
    const out = data?.estimate?.toAmount
    if (!out) return null

    const raw = BigInt(out)
    if (raw === 0n) return null

    return {
      amountOut: formatUnits(raw, data.action?.toToken?.decimals ?? outDecimals),
      amountOutRaw: raw,
      amountInRaw: amountRaw,
      inDecimals,
      outDecimals,
      minOut: data.estimate?.toAmountMin || null,
      // The whole response — executeLifiSwap needs transactionRequest, and
      // re-quoting at execution time would produce a different route than
      // the one the user was shown.
      lifiQuote: data,
      // "Fly", "Aero", whichever DEX won. Shown in the quote row so people
      // can see the route isn't a black box.
      routedVia: data.toolDetails?.name || data.tool || 'LI.FI',
      venue: 'lifi',
      raw: data,
    }
  } catch {
    return null
  }
}

/**
 * Execute a LI.FI swap.
 *
 * Their quote carries a complete transactionRequest, so this is mostly
 * approval handling and sending what they built. The route was decided when
 * the user saw the price, and re-quoting here would silently execute a
 * different one.
 *
 * ERC-20 input needs an approval to the Diamond. Native USDC arrives as
 * value and needs none — which is also why the ParagonFinance fee is a
 * second transaction here rather than riding inside the swap: LI.FI's
 * calldata is theirs, and wrapping it would break their fee accounting.
 */
async function executeLifiSwap({
  tokenIn, tokenOut, amountIn, quote, slippageBps, provider, from, onStatus,
}) {
  const start = Date.now()

  const tx = quote.lifiQuote?.transactionRequest
  if (!tx?.to || !tx?.data) {
    throw new Error('LI.FI returned a quote without an executable transaction.')
  }

  // Approval, when the input is an ERC-20. Their approvalAddress is the
  // Diamond; we compare against our pinned value rather than trusting the
  // response outright — an approval is the one thing worth being strict
  // about.
  const spender = quote.lifiQuote?.estimate?.approvalAddress || LIFI_DIAMOND
  if (spender.toLowerCase() !== LIFI_DIAMOND.toLowerCase()) {
    throw new Error('LI.FI returned an unexpected approval address. Not proceeding.')
  }

   {
    onStatus('Checking approval...')
    let allowance = 0n
    try {
      const res = await arcCall(tokenIn.address,
        '0xdd62ed3e' + encAddress(from) + encAddress(spender))
      if (res && res !== '0x') allowance = BigInt(res)
    } catch { /* treat as unapproved */ }

    if (allowance < quote.amountInRaw) {
      onStatus('Approve ' + tokenIn.symbol + '...')
      const MAX = (1n << 256n) - 1n
      await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: tokenIn.address,
          data: '0x095ea7b3' + encAddress(spender) + encUint(MAX),
          value: '0x0',
          gas: '0x186A0',
        }],
      })
    }
  }

  onStatus('Confirm the swap in your wallet...')

  const txHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: tx.to,
      data: tx.data,
      value: tx.value && tx.value !== '0x0' ? tx.value : '0x0',
      // Their own estimate. They simulated the route; a fixed guess would
      // underestimate a multi-hop path.
      gas: tx.gasLimit || '0xC6BD3',
    }],
  })

  onStatus('Waiting for confirmation...')

  let receipt = null
  for (let i = 0; i < 40 && !receipt; i++) {
    await new Promise(r => setTimeout(r, 500))
    try {
      receipt = await provider.request({
        method: 'eth_getTransactionReceipt', params: [txHash],
      })
    } catch { /* keep polling */ }
  }

  if (receipt && receipt.status === '0x0') {
    throw new Error(
      'Swap reverted — the price moved beyond your ' +
      (slippageBps / 100).toFixed(2) + '% tolerance. Try again, or raise it.'
    )
  }

  // ParagonFinance fee, after the swap. A reverted swap should cost nothing.
  let feeHash = null
  if (PARAGON_SWAP_ROUTER) {
    try {
      onStatus('Confirming ParagonFinance fee...')
      feeHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: PARAGON_SWAP_ROUTER,
          data: '0xfe7edecc' + encAddress(tokenOut.address), // collectSwapFee(address)
          value: '0x' + BigInt(1e17).toString(16),           // 0.1 USDC, 18 dp
          gas: '0x186A0',
        }],
      })
    } catch (err) {
      console.warn('[paragon] swap fee not collected:', err?.message)
    }
  }

  return {
    hash: txHash,
    feeHash,
    from,
    tokenIn: tokenIn.symbol,
    tokenOut: tokenOut.symbol,
    amountIn: parseFloat(amountIn),
    amountOut: parseFloat(quote.amountOut),
    paragonFee: feeHash ? 0.1 : 0,
    slippageBps,
    settlementTime: Date.now() - start,
    blockNumber: receipt ? parseInt(receipt.blockNumber, 16) : 0,
    status: 'confirmed',
      network: 'mainnet',
    networkLabel: 'Arc',
    chainId: 5042,
    dex: quote.routedVia || 'LI.FI',
    source: 'LI.FI',
    swap: true,
  }
}


// ─── On-chain reads ───────────────────────────────────────────────────────
// Used by the UnitFlow quoter and every allowance check. It was called in
// four places and defined in none — the resulting ReferenceError was caught
// by each try/catch, so every quote returned null and looked like empty
// liquidity rather than a missing function.
const ARC_RPC_URL = 'https://rpc.mainnet.arc.io'

async function arcCall(to, data) {
  const res = await fetch(ARC_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'eth_call',
      params: [{ to, data }, 'latest'],
    }),
    signal: AbortSignal.timeout(8000),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error.message || 'eth_call failed')
  return json.result
}

const encAddress = (a) => String(a).replace(/^0x/, '').toLowerCase().padStart(64, '0')
const encUint = (n) => BigInt(n).toString(16).padStart(64, '0')



// ═══════════════════════════════════════════════════════════════════════════
// UNITFLOW V3 — ARC MAINNET
//
// Append to src/utils/swapQuotes.js, above the SOURCES array.
// Then add the SOURCES entry and the execute branch at the bottom.
//
// Different from the testnet integration: that used a UniversalRouter with
// Permit2 and command-encoded calldata. Mainnet uses a plain V3 SwapRouter —
// ERC-20 approve, then exactInputSingle. Simpler, and confirmed against a
// real mainnet transaction (0x746ba4f6…) that swapped 0.5 USDC for 0.435729
// EURC through pool 0x99a0505D.
//
// Their quoter is QuoterV1, not V2. V2 takes a struct; V1 takes flat
// arguments in a different order (fee before amount). Calling it with the V2
// signature reverts, which is what made the pool look empty when it wasn't.
// ═══════════════════════════════════════════════════════════════════════════

const UNITFLOW_MAINNET = {
  router:  '0x6fD8351b9596C1F0b2f2479BfA6A171cb3d0f410',
  quoter:  '0x5AF6E89F0960Ff375AF84d9911D8153ef6240E34',
  factory: '0x5bfBCeb73d39F722B1cB83fD2F11736b28c1Be6d',
}

// quoteExactInputSingle(address,address,uint24,uint256,uint160) — QuoterV1
const UNITFLOW_QUOTE_SELECTOR = 'f7729d43'
// exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))
const UNITFLOW_SWAP_SELECTOR = '414bf389'

// Their USDC/EURC pool runs at 100 (0.01%) — far tighter than the 3000 a
// V3 integration usually defaults to. Ordered so the likeliest is tried
// first; a pair on another tier still gets found.
const UNITFLOW_FEE_TIERS = [100, 500, 3000, 10000]

async function quoteUnitflowAtFee(inAddr, outAddr, fee, amountRaw) {
  try {
    const data = '0x' + UNITFLOW_QUOTE_SELECTOR
      + encAddress(inAddr)
      + encAddress(outAddr)
      + encUint(fee)
      + encUint(amountRaw)
      + encUint(0)   // sqrtPriceLimitX96 — 0 means no limit

    const result = await arcCall(UNITFLOW_MAINNET.quoter, data)
    if (result && result !== '0x' && result.length >= 66) {
      const out = BigInt(result.slice(0, 66))
      if (out > 0n) return out
    }
  } catch (err) {
    console.warn('[unitflow] tier', fee, 'failed:', err?.message)
  }
  return null
}
  
async function getUnitflowMainnetQuote({ tokenIn, tokenOut, amountIn }) {
  if (!tokenIn.address || !tokenOut.address) return null

  const inDecimals = synthraDecimals(tokenIn)
  const outDecimals = synthraDecimals(tokenOut)
  const amountRaw = parseUnits(amountIn, inDecimals)

  // Every tier in parallel — four eth_calls is cheaper than four round
  // trips, and the pair could sit on any of them.
  const results = await Promise.all(
    UNITFLOW_FEE_TIERS.map(async fee => ({
      fee,
      out: await quoteUnitflowAtFee(tokenIn.address, tokenOut.address, fee, amountRaw),
    }))
  )

    console.log('[unitflow] tiers:', results.map(r => r.fee + '=' + r.out))

  const viable = results.filter(r => r.out !== null)
  if (!viable.length) return null

  const best = viable.reduce((a, b) => (b.out > a.out ? b : a))

  return {
    amountOut: formatUnits(best.out, outDecimals),
    amountOutRaw: best.out,
    amountInRaw: amountRaw,
    inDecimals,
    outDecimals,
    fee: best.fee,
    venue: 'unitflow',
  }
}

/**
 * Execute through UnitFlow's V3 SwapRouter.
 *
 * Eight static struct members, so exactInputSingle encodes inline with no
 * offset word.
 *
 * Native USDC is passed as value; an ERC-20 input needs a prior approval to
 * the router. That difference is also why the ParagonFinance fee is a second
 * transaction rather than riding inside the swap — routing through our own
 * contract would make msg.sender the router, and the pool would pull from a
 * contract holding nothing.
 */
async function executeUnitflowMainnetSwap({
  tokenIn, tokenOut, amountIn, quote, slippageBps, provider, from, onStatus,
  
}) {
  const start = Date.now()

  // Approval, when the input isn't native.
   {
    onStatus('Checking approval...')
    let allowance = 0n
    try {
      const res = await arcCall(tokenIn.address,
        '0xdd62ed3e' + encAddress(from) + encAddress(UNITFLOW_MAINNET.router))
      if (res && res !== '0x') allowance = BigInt(res)
    } catch { /* treat as unapproved */ }

    if (allowance < quote.amountInRaw) {
      onStatus('Approve ' + tokenIn.symbol + ' for UnitFlow...')
      const MAX = (1n << 256n) - 1n
      await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: tokenIn.address,
          data: '0x095ea7b3' + encAddress(UNITFLOW_MAINNET.router) + encUint(MAX),
          value: '0x0',
          gas: '0x186A0',
        }],
      })
    }
  }

  // Slippage floor. Without it the swap accepts any fill, which on a thin
  // pool means an arbitrarily bad price.
  const minOut = (quote.amountOutRaw * BigInt(10000 - slippageBps)) / 10000n
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300)

  const data = '0x' + UNITFLOW_SWAP_SELECTOR
    + encAddress(tokenIn.address)
    + encAddress(tokenOut.address)
    + encUint(quote.fee)
    + encAddress(from)          // recipient — the user, not the router
    + encUint(deadline)
    + encUint(quote.amountInRaw)
    + encUint(minOut)
    + encUint(0)                // sqrtPriceLimitX96

  onStatus('Confirm the swap in your wallet...')

  const txHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: UNITFLOW_MAINNET.router,
      data,
      // Native input travels as value; an ERC-20 is pulled via the approval
      // granted above.
           // UnitFlow's V3 router pulls USDC through the ERC-20 interface, not as
      // native value — their own mainnet transactions show Value: 0.
      value: '0x0',
      gas: '0x493E0',
    }],
  })

  onStatus('Waiting for confirmation...')

  let receipt = null
  for (let i = 0; i < 40 && !receipt; i++) {
    await new Promise(r => setTimeout(r, 500))
    try {
      receipt = await provider.request({
        method: 'eth_getTransactionReceipt', params: [txHash],
      })
    } catch { /* keep polling */ }
  }

  if (receipt && receipt.status === '0x0') {
    throw new Error(
      'Swap reverted — the price moved beyond your ' +
      (slippageBps / 100).toFixed(2) + '% tolerance. Try again, or raise it.'
    )
  }

    console.log('[paragon] router:', PARAGON_SWAP_ROUTER)
  // ParagonFinance fee, after the swap. A reverted swap costs nothing.
  let feeHash = null
  if (PARAGON_SWAP_ROUTER) {
    try {
      onStatus('Confirming ParagonFinance fee...')
      feeHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: PARAGON_SWAP_ROUTER,
          data: '0xfe7edecc' + encAddress(tokenOut.address), // collectSwapFee(address)
          value: '0x' + BigInt(1e17).toString(16),           // 0.1 USDC, 18 dp
          gas: '0x186A0',
        }],
      })
    } catch (err) {
      console.warn('[paragon] swap fee not collected:', err?.message)
    }
  }

  return {
    hash: txHash,
    feeHash,
    from,
    tokenIn: tokenIn.symbol,
    tokenOut: tokenOut.symbol,
    amountIn: parseFloat(amountIn),
    amountOut: parseFloat(quote.amountOut),
    paragonFee: feeHash ? 0.1 : 0,
    slippageBps,
    settlementTime: Date.now() - start,
    blockNumber: receipt ? parseInt(receipt.blockNumber, 16) : 0,
    status: 'confirmed',
    network: 'mainnet',
    networkLabel: 'Arc',
    chainId: 5042,
    dex: 'UnitFlow',
    source: 'UnitFlow',
    swap: true,
  }
}





// ─── Sources ──────────────────────────────────────────────────────────────
export const SOURCES = [
    {
    id: 'lifi',
    name: 'LI.FI',
    logo: '/dex/lifi.png',
    color: '#3B82F6',
    getQuote: getLifiQuote,
  },
  {
    id: 'unitflow',
    name: 'UnitFlow',
    logo: '/dex/unitflow.webp',
    color: '#00D4FF',
    getQuote: getUnitflowMainnetQuote,
  },
  {
    id: 'synthra',
    name: 'Synthra',
    logo: '/dex/synthra11.svg',
    color: '#8B5CF6',
    getQuote: getSynthraQuote,
  },
    {
    id: 'tower',
    name: 'Tower',
    logo: '/dex/tower11.svg',
    color: '#5B8DEF',
    getQuote: getTowerQuote,
  },
]





// ─── Tower Exchange ───────────────────────────────────────────────────────
// Tower is an aggregator, not a venue — their docs say they route across
// "Synthra, UnitFlow, and Tower DEX". So a Tower quote may be the same
// UnitFlow pool we already quote directly, wearing a different name.
//
// That's fine, and arguably useful: if Tower's routing beats our direct
// quote on the same underlying liquidity, that's a real edge worth showing.
// But it does mean the row count isn't a count of distinct liquidity
// sources, and it would be dishonest to market it as one.
const TOWER_API = (import.meta.env.VITE_TOWER_API || 'https://www.tower.exchange/api/public')
  .replace(/\/$/, '')
const TOWER_KEY = import.meta.env.VITE_TOWER_KEY || null

// TowerSwapExecutor on Arc, from their build-tx docs. Their /swap response
// carries the real `to`, so this is only a sanity reference.
export const TOWER_EXECUTOR = '0x2De8906a641d65d490bC60A4179d961d59742bCb'

function towerHeaders() {
  return {
    'Content-Type': 'application/json',
    // Their docs accept either. x-api-key avoids the Bearer prefix being
    // mangled if the key ever contains characters that need escaping.
    'x-api-key': TOWER_KEY,
    'Authorization': 'Bearer ' + TOWER_KEY,
  }
}

async function getTowerQuote({ tokenIn, tokenOut, amountIn }) {
  if (!TOWER_KEY) return { unconfigured: true }
  if (!tokenIn.address || !tokenOut.address) return null

   const inDecimals = synthraDecimals(tokenIn)
  const outDecimals = 18
  const amountRaw = parseUnits(amountIn, inDecimals)

  try {
    const res = await fetch(TOWER_API + '/swap/quote', {
      method: 'POST',
      headers: towerHeaders(),
      body: JSON.stringify({
        inputToken: tokenIn.address,
        outputToken: tokenOut.address,
        inputAmount: amountRaw.toString(),
        chainId: 5042,
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      if (res.status === 403) console.warn("[tower] key lacks the 'swaps' scope")
      if (res.status === 401) console.warn('[tower] invalid key — check VITE_TOWER_KEY')
      return null
    }

    const json = await res.json()

    // Their build-tx docs wrap payloads in { success, data }, so quotes
    // very likely do the same. Unwrap either shape.
    const data = json?.data ?? json
    if (json?.success === false) return null

    const out = extractAmountOut(data, outDecimals)
    if (!out) return null

       return {
      amountOut: out.display,
      amountOutRaw: out.raw,
      amountInRaw: amountRaw,
      inDecimals,
      outDecimals,
      // build-tx takes the whole quote verbatim, so store it rather than
      // reconstructing from parsed fields.
      towerQuote: data,
      dexId: data?.route?.hops?.[0]?.dexId ?? null,
      dexName: data?.route?.hops?.[0]?.dexName ?? 'Tower',
      minOut: data?.minOut ?? null,
      feeBps: data?.feeBps ?? null,
      venue: 'tower',
      raw: data,
    }
  } catch {
    return null
  }
}

/**
 * Quote every source in parallel, reporting each as it resolves.
 *
 * onProgress fires per source so the UI can show rows filling in rather than
 * a single spinner — a quote taking three seconds shouldn't hold back one
 * that took two hundred milliseconds.
 *
 * Returns all results sorted best-first, with `best: true` on the winner.
 *
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

      // "Never asked" and "asked, nothing there" are different facts, and
      // the UI reports them differently.
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