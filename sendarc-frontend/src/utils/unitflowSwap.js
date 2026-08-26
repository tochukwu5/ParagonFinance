// UnitFlow Finance swap integration — Arc Testnet
//
// UnitFlow is a DEX on Arc running V2.5, V3 and V4 pools behind a single
// UniversalRouter. We quote against the V3 Quoter and execute through the
// router's command interface.
//
// The wrinkle specific to Arc: USDC is the NATIVE gas token, not an ERC-20.
// AMM pools can't hold native tokens, so any swap touching USDC also has to
// wrap or unwrap through WUSDC. That's why the command sequence differs
// depending on which side USDC sits on.
//
// ABI encoding is hand-rolled below rather than pulled from viem. The
// encodings needed here are simple enough to write directly, and it keeps
// the swap path free of a dependency — the same approach arcTestnet.js
// already takes for its ERC-20 calls.
//
// Docs: https://docs.unitflow.finance/docs/dev/universal-router

import { ARC_TESTNET } from './arcTestnet'

// ─── Deployed contracts (Arc Testnet, chain 5042002) ──────────────────────
export const UNITFLOW = {
  universalRouter: '0xEaF3195bE51861632cd32850973C9515DA48e76F',
  permit2: '0x4ce562F687d0Ced27b79Ba51d79B63BD978F7F48',
  v3Quoter: '0x121aeB6DEf00F6F67665008CaC1C19805886ed1a',
  v3Factory: '0xAb6A8AAb7d490007634ef59d424b5d89688a1971',
  wusdc: '0x911b4000D3422F482F4062a913885f7b035382Df',
}

// UniversalRouter command bytes
const CMD = {
  V3_SWAP_EXACT_IN: 0x00,
  WRAP_ETH: 0x0b,
  UNWRAP_WETH: 0x0c,
}

// UniversalRouter address sentinels — the router substitutes the real
// address at execution time.
const MSG_SENDER   = '0x0000000000000000000000000000000000000001'
const ADDRESS_THIS = '0x0000000000000000000000000000000000000002'

// Fee tiers to probe when quoting. The router needs an explicit tier and
// there's no on-chain "best pool" lookup, so we quote each and keep the
// best fill.
const FEE_TIERS = [100, 500, 3000, 10000]

const MAX_UINT160 = (1n << 160n) - 1n
const MAX_UINT256 = (1n << 256n) - 1n

// ─── ABI encoding ─────────────────────────────────────────────────────────
// Every value in ABI encoding occupies a 32-byte word, left-padded. Dynamic
// types (bytes, bytes[]) put an offset in the head and their contents in a
// tail after all head words.

const strip = (hex) => String(hex).replace(/^0x/, '').toLowerCase()

function encAddress(addr) {
  return strip(addr).padStart(64, '0')
}

function encUint(value) {
  return BigInt(value).toString(16).padStart(64, '0')
}

function encBool(b) {
  return (b ? 1n : 0n).toString(16).padStart(64, '0')
}

// A dynamic `bytes` tail: length word, then data right-padded to a 32-byte
// boundary. Right-padded, unlike numbers — byte arrays are left-aligned.
function encBytesTail(hexNo0x) {
  const byteLen = hexNo0x.length / 2
  const rem = hexNo0x.length % 64
  const padded = rem === 0 ? hexNo0x : hexNo0x + '0'.repeat(64 - rem)
  return encUint(byteLen) + padded
}

// A `bytes[]`: element count, one offset per element (measured from the end
// of the count word), then each element's own length-and-data tail.
function encBytesArray(elements) {
  const n = elements.length
  let offsets = ''
  let data = ''
  let cursor = n * 32
  for (const el of elements) {
    offsets += encUint(cursor)
    const tail = encBytesTail(el)
    data += tail
    cursor += tail.length / 2
  }
  return encUint(n) + offsets + data
}

// V3 path is tightly packed, NOT word-aligned: 20-byte address, 3-byte fee,
// 20-byte address. Packing it as ABI words would produce a path the router
// can't parse.
function encodePath(tokenIn, fee, tokenOut) {
  return strip(tokenIn) + Number(fee).toString(16).padStart(6, '0') + strip(tokenOut)
}

// Decimal string to smallest unit, without floating point. Doing this with
// Number would lose precision on 18-decimal amounts.
function parseUnits(value, decimals) {
  const [whole = '0', frac = ''] = String(value).split('.')
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  return BigInt((whole || '0') + fracPadded)
}

function formatUnits(raw, decimals) {
  const s = BigInt(raw).toString().padStart(decimals + 1, '0')
  const whole = s.slice(0, s.length - decimals)
  const frac = s.slice(s.length - decimals).replace(/0+$/, '')
  return frac ? whole + '.' + frac : whole
}

// ─── Token registry ───────────────────────────────────────────────────────
// `decimals` here are starting assumptions — getTokenDecimals() reads the
// real value from each contract at runtime, because guessing decimals wrong
// silently produces amounts off by orders of magnitude.
export const SWAP_TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: ARC_TESTNET.usdcAddress,
    wrapped: UNITFLOW.wusdc,
    decimals: 18, // native value fields on Arc are 18-decimal
    isNative: true,
    available: true,
  },
  EURC: {
    symbol: 'EURC',
    name: 'Euro Coin',
    address: ARC_TESTNET.eurcAddress,
    decimals: 6,
    isNative: false,
    available: true,
  },
  cirBTC: {
    symbol: 'cirBTC',
    name: 'Circle Bitcoin',
    address: ARC_TESTNET.cirbtcAddress,
    decimals: 8,
    isNative: false,
    available: true,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: null,
    decimals: 6,
    isNative: false,
    // Circle's docs list Arc Testnet swap support as USDC, EURC and cirBTC
    // only. Shown greyed rather than hidden so the roadmap stays visible.
    available: false,
    unavailableReason: 'Not deployed on Arc Testnet yet',
  },
}

export const SWAP_TOKEN_LIST = Object.values(SWAP_TOKENS)

// ─── RPC ──────────────────────────────────────────────────────────────────
async function arcCall(to, data) {
  const res = await fetch(ARC_TESTNET.rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to, data }, 'latest'],
    }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error.message || 'eth_call failed')
  return json.result
}

const decimalsCache = {}
export async function getTokenDecimals(address) {
  if (!address) return 18
  if (decimalsCache[address] !== undefined) return decimalsCache[address]
  try {
    const result = await arcCall(address, '0x313ce567') // decimals()
    const d = result && result !== '0x' ? parseInt(result, 16) : 18
    decimalsCache[address] = d
    return d
  } catch {
    return 18
  }
}

// The address that actually enters a pool. For native USDC that's WUSDC —
// pools hold the wrapped form, never the native token.
function poolAddress(token) {
  return token.isNative ? token.wrapped : token.address
}

// ─── Quoting ──────────────────────────────────────────────────────────────
async function quoteAtFee(tokenInAddr, tokenOutAddr, amountInRaw, fee) {
  // QuoterV2 takes a struct. All members are static, so it encodes inline
  // with no offset word.
  try {
    const data = '0xc6a5026a'
      + encAddress(tokenInAddr)
      + encAddress(tokenOutAddr)
      + encUint(amountInRaw)
      + encUint(fee)
      + encUint(0)
    const result = await arcCall(UNITFLOW.v3Quoter, data)
    if (result && result !== '0x' && result.length >= 66) {
      const out = BigInt('0x' + result.slice(2, 66))
      if (out > 0n) return out
    }
  } catch { /* fall through to V1 */ }

  // QuoterV1 takes positional args, and orders fee before amountIn.
  try {
    const data = '0xf7729d43'
      + encAddress(tokenInAddr)
      + encAddress(tokenOutAddr)
      + encUint(fee)
      + encUint(amountInRaw)
      + encUint(0)
    const result = await arcCall(UNITFLOW.v3Quoter, data)
    if (result && result !== '0x') {
      const out = BigInt(result)
      if (out > 0n) return out
    }
  } catch { /* no pool at this tier */ }

  return null
}

/**
 * Best available quote across fee tiers.
 * Returns null when no pool exists for the pair — a real outcome on a young
 * testnet DEX, not an error worth throwing over.
 */
export async function getSwapQuote({ tokenIn, tokenOut, amountIn }) {
  if (!tokenIn?.available || !tokenOut?.available) return null
  if (!amountIn || parseFloat(amountIn) <= 0) return null

  const inAddr = poolAddress(tokenIn)
  const outAddr = poolAddress(tokenOut)
  if (!inAddr || !outAddr) return null

  const inDecimals = tokenIn.isNative ? tokenIn.decimals : await getTokenDecimals(inAddr)
  const outDecimals = tokenOut.isNative ? tokenOut.decimals : await getTokenDecimals(outAddr)

  const amountInRaw = parseUnits(amountIn, inDecimals)

  const results = await Promise.all(
    FEE_TIERS.map(async fee => ({ fee, out: await quoteAtFee(inAddr, outAddr, amountInRaw, fee) }))
  )

  const viable = results.filter(r => r.out !== null && r.out > 0n)
  if (!viable.length) return null

  const best = viable.reduce((a, b) => (b.out > a.out ? b : a))
  const amountOut = formatUnits(best.out, outDecimals)

  return {
    amountOut,
    amountOutRaw: best.out,
    amountInRaw,
    fee: best.fee,
    inDecimals,
    outDecimals,
    // Indicative price, for display only.
    rate: parseFloat(amountOut) / parseFloat(amountIn),
  }
}

// ─── Approvals ────────────────────────────────────────────────────────────
// ERC-20 inputs reach the router through Permit2, which needs two grants:
// the token approving Permit2, and Permit2 approving the router. Native
// USDC needs neither — it arrives as msg.value.
export async function checkAllowances({ token, owner }) {
  if (token.isNative) return { needsTokenApproval: false, needsPermit2Approval: false }

  // allowance(owner, permit2)
  const allowanceData = '0xdd62ed3e' + encAddress(owner) + encAddress(UNITFLOW.permit2)
  let erc20Allowance = 0n
  try {
    const raw = await arcCall(token.address, allowanceData)
    if (raw && raw !== '0x') erc20Allowance = BigInt(raw)
  } catch { /* treat as unapproved */ }

  // Permit2.allowance(owner, token, spender) -> (uint160 amount, uint48 expiration, uint48 nonce)
  const p2Data = '0x927da105'
    + encAddress(owner)
    + encAddress(token.address)
    + encAddress(UNITFLOW.universalRouter)
  let permit2Amount = 0n
  let permit2Expiration = 0n
  try {
    const p2Raw = await arcCall(UNITFLOW.permit2, p2Data)
    if (p2Raw && p2Raw !== '0x' && p2Raw.length >= 130) {
      permit2Amount = BigInt('0x' + p2Raw.slice(2, 66))
      permit2Expiration = BigInt('0x' + p2Raw.slice(66, 130))
    }
  } catch { /* treat as unapproved */ }

  const nowSec = BigInt(Math.floor(Date.now() / 1000))

  return {
    needsTokenApproval: erc20Allowance < MAX_UINT256 / 2n,
    needsPermit2Approval: permit2Amount === 0n || permit2Expiration < nowSec,
  }
}

export async function approveTokenForPermit2({ token, provider, from }) {
  // approve(address,uint256)
  const data = '0x095ea7b3' + encAddress(UNITFLOW.permit2) + encUint(MAX_UINT256)
  return provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: token.address, data, gas: '0x186A0' }],
  })
}

export async function approvePermit2ForRouter({ token, provider, from }) {
  // Permit2.approve(address token, address spender, uint160 amount, uint48 expiration)
  const expiration = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60) // 30 days
  const data = '0x87517c45'
    + encAddress(token.address)
    + encAddress(UNITFLOW.universalRouter)
    + encUint(MAX_UINT160)
    + encUint(expiration)
  return provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: UNITFLOW.permit2, data, gas: '0x186A0' }],
  })
}

// ─── Command building ─────────────────────────────────────────────────────
// V3_SWAP_EXACT_IN input: (address recipient, uint256 amountIn,
//                          uint256 amountOutMin, bytes path, bool payerIsUser)
// Five head words, so the dynamic `path` offset is 5 * 32 = 160.
function encodeV3SwapInput({ recipient, amountIn, amountOutMin, pathHex, payerIsUser }) {
  const head =
    encAddress(recipient) +
    encUint(amountIn) +
    encUint(amountOutMin) +
    encUint(160) +
    encBool(payerIsUser)
  return head + encBytesTail(pathHex)
}

// WRAP_ETH / UNWRAP_WETH input: (address recipient, uint256 amount)
function encodeWrapInput(recipient, amount) {
  return encAddress(recipient) + encUint(amount)
}

/**
 * Build the command sequence for a swap.
 *
 * Three shapes, decided by where native USDC sits:
 *   native -> token : WRAP_ETH, then swap from the router's own balance
 *   token -> native : swap into the router, then UNWRAP_WETH out to the user
 *   token -> token  : a single swap, funds pulled via Permit2
 */
function buildSwapCommands({ tokenIn, tokenOut, amountInRaw, minOutRaw, fee, recipient }) {
  const pathHex = encodePath(poolAddress(tokenIn), fee, poolAddress(tokenOut))
  const byte = (c) => c.toString(16).padStart(2, '0')

  if (tokenIn.isNative) {
    return {
      commandsHex: byte(CMD.WRAP_ETH) + byte(CMD.V3_SWAP_EXACT_IN),
      inputs: [
        encodeWrapInput(ADDRESS_THIS, amountInRaw),
        encodeV3SwapInput({
          recipient,
          amountIn: amountInRaw,
          amountOutMin: minOutRaw,
          pathHex,
          payerIsUser: false, // the wrapped balance already sits in the router
        }),
      ],
      value: amountInRaw,
    }
  }

  if (tokenOut.isNative) {
    return {
      commandsHex: byte(CMD.V3_SWAP_EXACT_IN) + byte(CMD.UNWRAP_WETH),
      inputs: [
        encodeV3SwapInput({
          recipient: ADDRESS_THIS, // hold WUSDC so it can be unwrapped
          amountIn: amountInRaw,
          amountOutMin: minOutRaw,
          pathHex,
          payerIsUser: true,
        }),
        encodeWrapInput(recipient, minOutRaw),
      ],
      value: 0n,
    }
  }

  return {
    commandsHex: byte(CMD.V3_SWAP_EXACT_IN),
    inputs: [
      encodeV3SwapInput({
        recipient,
        amountIn: amountInRaw,
        amountOutMin: minOutRaw,
        pathHex,
        payerIsUser: true,
      }),
    ],
    value: 0n,
  }
}

// execute(bytes commands, bytes[] inputs, uint256 deadline)
// Three head words (96 bytes), then the two dynamic tails in order.
function encodeExecuteCall(commandsHex, inputs, deadline) {
  const commandsTail = encBytesTail(commandsHex)
  const commandsOffset = 96
  const inputsOffset = commandsOffset + commandsTail.length / 2

  return '0x3593564c'
    + encUint(commandsOffset)
    + encUint(inputsOffset)
    + encUint(deadline)
    + commandsTail
    + encBytesArray(inputs)
}

// ─── Execution ────────────────────────────────────────────────────────────
export async function executeSwap({
  tokenIn,
  tokenOut,
  amountIn,
  quote,
  slippageBps = 50, // 0.50%
  provider,
  from,
  onStatus = () => {},
}) {
  if (!provider) throw new Error('No wallet provider')
  if (!quote) throw new Error('No route available for this pair')

  const start = Date.now()

  // Approvals, when the input isn't native.
  if (!tokenIn.isNative) {
    onStatus('Checking approvals...')
    const { needsTokenApproval, needsPermit2Approval } =
      await checkAllowances({ token: tokenIn, owner: from })

    if (needsTokenApproval) {
      onStatus('Approve ' + tokenIn.symbol + ' (1 of 2)...')
      await approveTokenForPermit2({ token: tokenIn, provider, from })
    }
    if (needsPermit2Approval) {
      onStatus('Approve UnitFlow router (2 of 2)...')
      await approvePermit2ForRouter({ token: tokenIn, provider, from })
    }
  }

  // Slippage floor. Without this the swap would accept any fill, which on a
  // thin pool means an arbitrarily bad price.
  const minOutRaw = (quote.amountOutRaw * BigInt(10000 - slippageBps)) / 10000n

  const { commandsHex, inputs, value } = buildSwapCommands({
    tokenIn,
    tokenOut,
    amountInRaw: quote.amountInRaw,
    minOutRaw,
    fee: quote.fee,
    recipient: MSG_SENDER,
  })

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300) // 5 minutes
  const callData = encodeExecuteCall(commandsHex, inputs, deadline)

  onStatus('Confirm the swap in your wallet...')

  const txHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: UNITFLOW.universalRouter,
      data: callData,
      value: value > 0n ? '0x' + value.toString(16) : '0x0',
      gas: '0x7A120', // 500k — multi-command routes are not cheap
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
      'Swap reverted. The price may have moved beyond your slippage tolerance — ' +
      'try again, or raise the tolerance.'
    )
  }

  return {
    hash: txHash,
    from,
    tokenIn: tokenIn.symbol,
    tokenOut: tokenOut.symbol,
    amountIn: parseFloat(amountIn),
    amountOut: parseFloat(quote.amountOut),
    minAmountOut: parseFloat(formatUnits(minOutRaw, quote.outDecimals)),
    fee: quote.fee,
    slippageBps,
    settlementTime: Date.now() - start,
    blockNumber: receipt ? parseInt(receipt.blockNumber, 16) : 0,
    status: 'confirmed',
    network: 'Arc Testnet',
    chainId: ARC_TESTNET.id,
    dex: 'UnitFlow Finance',
    swap: true,
  }
}

// Tokens selectable as output, given the input. Excludes the input itself,
// so USDC→USDC can't be chosen.
export function getAvailableOutputTokens(tokenInSymbol) {
  return SWAP_TOKEN_LIST.filter(t => t.symbol !== tokenInSymbol)
}