import { useState, useEffect, useRef } from 'react'
import {
  SWAP_TOKENS, SWAP_TOKEN_LIST, checkAllowances,
} from '../../utils/unitflowSwap'
import {
  getAllQuotes, bestPriceEdge, SWAP_FEE_USDC, PARAGON_SWAP_ROUTER,
  executeSwapForQuote,
} from '../../utils/swapQuotes'
import { ARC_TESTNET, arcScanTx, getUsdcBalance, getEurcBalance, getCirbtcBalance } from '../../utils/arcTestnet'
import { Card, LoadingSpinner } from '../../components/UI'
import TokenSelectModal from '../../components/TokenSelectModal'
import { CoinIcon } from '../../components/CoinLogos'

const ChevronDown = ({ className = 'w-4 h-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const SLIPPAGE_OPTIONS = [
  { bps: 10, label: '0.1%' },
  { bps: 50, label: '0.5%' },
  { bps: 100, label: '1%' },
]


// Indicative USD references for the secondary line under each amount.
// Testnet tokens have no real market, so these are illustrative only and
// never feed anything that affects execution.
//
// cirBTC tracks BTC. At a stale 65000 every cirBTC quote read roughly 7x
// low against what the venues themselves display.
const USD_REFERENCE = {
  USDC: 1.00,
  EURC: 1.08,
  cirBTC: 422000,
  USDT: 1.00,
}

const usd = (symbol, amount) => {
  const rate = USD_REFERENCE[symbol]
  if (!rate || !amount) return null
  const v = parseFloat(amount) * rate
  if (!isFinite(v)) return null
  return v < 0.01 ? '<$0.01' : '$' + v.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })
}

export default function SwapTab({ account, provider, onRecordTransaction }) {
  const [view, setView] = useState('form') // 'form' | 'confirm' | 'success'

  const [tokenInSymbol, setTokenInSymbol] = useState('USDC')
  const [tokenOutSymbol, setTokenOutSymbol] = useState('EURC')
  const [amount, setAmount] = useState('')

  const [showInModal, setShowInModal] = useState(false)
  const [showOutModal, setShowOutModal] = useState(false)

  // Quote rows, filled progressively. `searching` stays true until every
  // source has answered, but rows appear as each one lands — waiting on the
  // slowest venue to show the fastest venue's price helps nobody.
  const [quotes, setQuotes] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedSource, setSelectedSource] = useState(null)
  const requestId = useRef(0)

  const [slippageBps, setSlippageBps] = useState(50)
  const [showSlippage, setShowSlippage] = useState(false)

  const [balances, setBalances] = useState({})
  const [approvals, setApprovals] = useState(null)

  const [swapping, setSwapping] = useState(false)
  const [status, setStatus] = useState('')
  const [swapError, setSwapError] = useState(null)
  const [result, setResult] = useState(null)

  const tokenIn = SWAP_TOKENS[tokenInSymbol]
  const tokenOut = SWAP_TOKENS[tokenOutSymbol]

  const inputChoices = SWAP_TOKEN_LIST.filter(t => t.symbol !== tokenOutSymbol)
  const outputChoices = SWAP_TOKEN_LIST.filter(t => t.symbol !== tokenInSymbol)

  const balanceOf = (symbol) => balances[symbol] ?? null
  const inBalance = balanceOf(tokenInSymbol)
  const numericBalance = inBalance === null ? null : parseFloat(inBalance)

  // The row the user has picked, or the best one if they haven't picked.
  // Selection is respected because a venue with a marginally worse price
  // may still be the one someone wants for reasons we can't see.
  const liveQuotes = quotes.filter(q => q.available)
  const activeQuote =
    liveQuotes.find(q => q.sourceId === selectedSource) ||
    liveQuotes.find(q => q.best) ||
    liveQuotes[0] ||
    null

  const edge = bestPriceEdge(quotes)
  const noRoute = !searching && quotes.length > 0 && liveQuotes.length === 0

  // ── Balances ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!account) return
    let cancelled = false
    Promise.all([
      getUsdcBalance('arc', account),
      getEurcBalance(account),
      getCirbtcBalance(account),
    ]).then(([usdc, eurc, cirbtc]) => {
      if (!cancelled) setBalances({ USDC: usdc, EURC: eurc, cirBTC: cirbtc, USDT: null })
    })
    return () => { cancelled = true }
  }, [account, result])

  // ── Quote every source, debounced ───────────────────────────────────
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0 || !tokenIn?.available || !tokenOut?.available) {
      setQuotes([])
      setSearching(false)
      return
    }

    const id = ++requestId.current
    let cancelled = false

    setSearching(true)
    setQuotes([])
    setSelectedSource(null)

    const timer = setTimeout(async () => {
      try {
        const all = await getAllQuotes({
          tokenIn,
          tokenOut,
          amountIn: amount,
           account,
          // Rows appear one at a time as each venue answers. A stale
          // request's results are dropped by the id check — otherwise a
          // slow quote from two keystrokes ago could overwrite a fresh one.
          onProgress: (entry) => {
            if (cancelled || id !== requestId.current) return
            setQuotes(prev => {
              const next = [...prev, entry]
              return next.sort((a, b) => {
                if (!a.available && !b.available) return 0
                if (!a.available) return 1
                if (!b.available) return -1
                return parseFloat(b.quote.amountOut) - parseFloat(a.quote.amountOut)
              })
            })
          },
        })
        if (!cancelled && id === requestId.current) setQuotes(all)
      } finally {
        if (!cancelled && id === requestId.current) setSearching(false)
      }
    }, 450)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [amount, tokenInSymbol, tokenOutSymbol])

  // ── Approvals ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!account || !tokenIn || tokenIn.isNative) { setApprovals(null); return }
    let cancelled = false
    checkAllowances({ token: tokenIn, owner: account })
      .then(a => { if (!cancelled) setApprovals(a) })
      .catch(() => { if (!cancelled) setApprovals(null) })
    return () => { cancelled = true }
  }, [account, tokenInSymbol])

  const handleFlip = () => {
    const oldIn = tokenInSymbol
    setTokenInSymbol(tokenOutSymbol)
    setTokenOutSymbol(oldIn)
    setAmount('')
    setQuotes([])
  }

  const selectInput = (s) => { if (s === tokenOutSymbol) return handleFlip(); setTokenInSymbol(s); setAmount('') }
  const selectOutput = (s) => { if (s === tokenInSymbol) return handleFlip(); setTokenOutSymbol(s) }

  const handleSwap = async () => {
    if (!activeQuote) return
    setSwapping(true)
    setSwapError(null)
    setStatus('')
    try {
         const r = await executeSwapForQuote({
        tokenIn, tokenOut, amountIn: amount,
        quoteEntry: activeQuote,
        slippageBps, provider, from: account,
        onStatus: setStatus,
      })
      r.source = activeQuote.name
      if (onRecordTransaction) {
        try { await onRecordTransaction(r, account) } catch { /* logging only */ }
      }
      setResult(r)
      setView('success')
    } catch (err) {
      if (err.code === 4001) setSwapError('Rejected in your wallet.')
      else setSwapError(err.message || 'Swap failed. Please try again.')
    } finally {
      setSwapping(false)
      setStatus('')
    }
  }

  const reset = () => {
    setView('form'); setAmount(''); setQuotes([]); setResult(null)
    setSwapError(null); setStatus(''); setSelectedSource(null)
  }

  const bothAvailable = tokenIn?.available && tokenOut?.available
  const exceedsBalance = numericBalance !== null && amount && parseFloat(amount) > numericBalance

  const promptCount = tokenIn?.isNative
    ? 1
    : 1 + (approvals?.needsTokenApproval ? 1 : 0) + (approvals?.needsPermit2Approval ? 1 : 0)

  const minReceived = activeQuote
    ? (parseFloat(activeQuote.quote.amountOut) * (10000 - slippageBps) / 10000).toFixed(6)
    : null

  const canReview = !!activeQuote && !searching && !exceedsBalance && bothAvailable && !!account

  // ── Token box ───────────────────────────────────────────────────────
  const tokenBox = ({ label, token, isInput, onPick, balance, value, onChange, readOnly }) => (
    <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl px-4 py-3">
      <div className="flex items-center justify-between flex-wrap gap-y-1 mb-2">
        <span className="text-[10px] tracking-widest text-[#8892a0]">{label}</span>
        <span className="text-[10px] text-[#8892a0]">
          {balance === null ? '—' : balance} {token.symbol}
          {isInput && numericBalance > 0 && (
            <>
              <button onClick={() => setAmount((numericBalance * 0.5).toFixed(6))}
                className="ml-2 text-[#8892a0] hover:text-[#00D4FF] transition-colors">50%</button>
              <button onClick={() => setAmount(Math.max(0, numericBalance - 0.001).toFixed(6))}
                className="ml-2 text-[#00D4FF] hover:underline">Max</button>
            </>
          )}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <button onClick={onPick}
          className="flex items-center gap-1.5 bg-[#1e2530] px-3 py-1.5 rounded-lg text-sm text-white font-semibold hover:opacity-80 transition-opacity flex-shrink-0">
          <CoinIcon symbol={token.symbol} size={20} />
          {token.symbol}
          <ChevronDown className="w-4 h-4 text-[#8892a0]" />
        </button>

        <div className="flex-1 min-w-0 text-right">
          {readOnly ? (
            <span className={
              'block text-2xl font-bold font-[\'Space_Grotesk\'] truncate ' +
              (searching && !activeQuote ? 'text-[#556] animate-pulse' : 'text-white')
            }>
              {searching && !activeQuote
                ? '…'
                : activeQuote
                  ? parseFloat(activeQuote.quote.amountOut).toFixed(6)
                  : '0.00'}
            </span>
          ) : (
            <input
              type="number"
              placeholder="0.00"
              value={value}
              onChange={e => {
                const v = parseFloat(e.target.value)
                if (e.target.value === '' || e.target.value === '0') onChange('')
                else if (!isNaN(v) && v > 0) onChange(e.target.value)
              }}
              min="0"
              className="w-full bg-transparent text-white text-2xl font-bold outline-none font-['Space_Grotesk'] text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
            />
          )}
          {/* Indicative dollar value, mirroring the reference layout. */}
          <span className="block text-[11px] text-[#556] mt-0.5">
            {readOnly
              ? (activeQuote ? usd(token.symbol, activeQuote.quote.amountOut) : null)
              : usd(token.symbol, value)}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-[#556] mt-1.5">{token.name}</p>
      {!token.available && (
        <p className="text-[10px] text-[#e8c374] mt-1">{token.unavailableReason}</p>
      )}
    </div>
  )

  // ── Quote row ───────────────────────────────────────────────────────
    // ── Quote row ───────────────────────────────────────────────────────
  // Every venue stays readable. Greying an unavailable row to 40% made it
  // look broken rather than simply unselected — and a second-place venue
  // with a real quote is a legitimate choice, not a failure, so it gets
  // full contrast and a working hover.
  const QuoteRow = ({ q }) => {
    const isActive = activeQuote?.sourceId === q.sourceId

    // Dollar advantage over the next-best fill. Shown only on the winner,
    // and only when there's something to beat — with one venue the number
    // would be meaningless.
    let delta = null
    if (q.best && liveQuotes.length > 1) {
      const bestUsd = parseFloat(q.quote.amountOut) * (USD_REFERENCE[tokenOutSymbol] || 0)
      const nextUsd = parseFloat(liveQuotes[1].quote.amountOut) * (USD_REFERENCE[tokenOutSymbol] || 0)
      const d = bestUsd - nextUsd
      if (d > 0.005) delta = '+$' + d.toFixed(2)
    }

    return (
      <button
        onClick={() => q.available && setSelectedSource(q.sourceId)}
        disabled={!q.available}
        className={
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left border ' +
          (isActive
            ? 'bg-[#101a26] border-[#00D4FF]/40'
            : q.available
              ? 'border-transparent hover:bg-[#141b24] hover:border-[#1e2530] cursor-pointer'
              : 'border-transparent cursor-default')
        }
      >
        <div
          className={
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ' +
            (q.available ? '' : 'grayscale opacity-60')
          }
          style={{
            background: q.color + (q.available ? '18' : '0d'),
            border: '1px solid ' + q.color + (q.available ? '35' : '1a'),
          }}
        >
          <img
            src={q.logo}
            alt=""
            className="w-5 h-5 object-contain "
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={
            'text-sm font-semibold truncate ' +
            (q.available ? 'text-white' : 'text-[#6b7683]')
          }>
            {q.name}
          </span>
          {q.best && q.available && (
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30 flex-shrink-0">
              Best Price
            </span>
          )}
        </div>

        {delta && (
          <span className="text-[11px] font-semibold text-green-400 flex-shrink-0">
            {delta}
          </span>
        )}

        <div className="text-right flex-shrink-0 min-w-[64px]">
          {q.available ? (
            <>
              <p className="text-sm font-bold text-white leading-tight tabular-nums">
                {(() => {
                  const v = parseFloat(q.quote.amountOut)
                  if (v >= 1000) return v.toFixed(2)
                  if (v >= 1) return v.toFixed(4)
                  if (v >= 0.001) return v.toFixed(6)
                  return v.toFixed(8)
                })()}
              </p>
              <p className="text-[10px] text-[#6b7683] tabular-nums">
                ~{usd(tokenOutSymbol, q.quote.amountOut)}
              </p>
            </>
          ) : (
            <p className="text-[11px] text-[#6b7683]">
              {q.unconfigured ? 'Coming soon' : 'No route'}
              </p>
          )}
        </div>
      </button>
    )
  }

  // Placeholder rows for venues still being queried, so the panel has its
  // final shape from the first frame rather than growing as answers land.
  const pendingCount = Math.max(0, 2 - quotes.length)
  const SkeletonRow = () => (
    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl">
      <div className="w-7 h-7 rounded-lg bg-[#161d28] animate-pulse flex-shrink-0" />
      <div className="h-3 w-20 rounded bg-[#161d28] animate-pulse" />
      <div className="ml-auto h-3 w-12 rounded bg-[#161d28] animate-pulse" />
    </div>
  )

  // ── Success ─────────────────────────────────────────────────────────
  if (view === 'success' && result) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
        <h2 className="text-xl font-bold font-['Space_Grotesk'] mb-1">
          Swap <span className="text-green-400">confirmed</span>
        </h2>
        <p className="text-[#8892a0] text-xs mb-6">
          via {result.source || 'UnitFlow'} on Arc Testnet · {(result.settlementTime / 1000).toFixed(1)}s
        </p>

        <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-4 text-left mb-5 space-y-2.5">
          {[
            { l: 'Swapped', v: result.amountIn + ' ' + result.tokenIn },
            { l: 'Received', v: '~' + result.amountOut.toFixed(6) + ' ' + result.tokenOut },
            { l: 'Routed via', v: result.source || 'UnitFlow' },
            { l: 'Max slippage', v: (result.slippageBps / 100).toFixed(2) + '%' },
            { l: 'Status', v: 'Confirmed', green: true },
          ].map(r => (
            <div key={r.l} className="flex justify-between border-b border-[#1e2530] pb-2 last:border-0 text-sm">
              <span className="text-[#8892a0]">{r.l}</span>
              <span className={'font-semibold ' + (r.green ? 'text-green-400' : 'text-white')}>{r.v}</span>
            </div>
          ))}
          <div className="pt-1">
            <p className="text-[10px] text-[#8892a0] mb-1">TX HASH</p>
            <a href={arcScanTx(result.hash)} target="_blank" rel="noreferrer"
              className="text-[10px] text-[#00D4FF] font-mono break-all hover:underline">
              {result.hash}
            </a>
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          <a href={arcScanTx(result.hash)} target="_blank" rel="noreferrer"
            className="flex-1 border border-[#00D4FF] text-[#00D4FF] py-2.5 rounded-xl text-sm font-['Space_Grotesk'] font-bold hover:bg-[#0a2030] transition-all text-center">
            View on Explorer ↗
          </a>
          <button onClick={() => navigator.clipboard.writeText(result.hash)}
            className="flex-1 border border-[#1e2530] text-[#8892a0] py-2.5 rounded-xl text-sm hover:border-[#00D4FF] transition-all">
            Copy TX Hash
          </button>
        </div>

        <button onClick={reset}
          className="w-full bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-2.5 rounded-xl text-sm hover:opacity-90">
          Swap Again →
        </button>
      </div>
    )
  }

  // ── Confirm ─────────────────────────────────────────────────────────
  if (view === 'confirm') {
    return (
      <div>
        <p className="text-[10px] tracking-widest text-[#8892a0] mb-4">SWAP REVIEW</p>

        <div className="flex items-center justify-center gap-3 mb-4 pb-4 border-b border-[#1e2530]">
          <span className="flex items-center gap-1.5 text-sm text-white font-semibold">
            <CoinIcon symbol={tokenIn.symbol} size={18} /> {amount} {tokenIn.symbol}
          </span>
          <span className="text-[#00D4FF]">→</span>
          <span className="flex items-center gap-1.5 text-sm text-white font-semibold">
            <CoinIcon symbol={tokenOut.symbol} size={18} />
            {activeQuote ? parseFloat(activeQuote.quote.amountOut).toFixed(6) : '—'} {tokenOut.symbol}
          </span>
        </div>

        <div className="space-y-3 mb-5">
          {[
            { l: 'Routed via', v: activeQuote?.name || '—' },
            { l: 'Rate', v: activeQuote ? '1 ' + tokenIn.symbol + ' ≈ ' + (parseFloat(activeQuote.quote.amountOut) / parseFloat(amount)).toFixed(6) + ' ' + tokenOut.symbol : '—' },
            { l: 'Minimum received', v: minReceived ? minReceived + ' ' + tokenOut.symbol : '—', accent: true },
            { l: 'Max slippage', v: (slippageBps / 100).toFixed(2) + '%' },
            // Disclosed before signing rather than after — a fee someone
            // discovers on the explorer is a fee they didn't agree to.
            ...(PARAGON_SWAP_ROUTER ? [{ l: 'ParagonFinance fee', v: SWAP_FEE_USDC + ' USDC' }] : []),
            { l: 'Prompts', v: promptCount + (promptCount === 1 ? ' (swap)' : ' (approvals + swap)') },
          ].map(r => (
            <div key={r.l} className="flex justify-between items-center border-b border-[#1e2530] pb-2.5 last:border-0 text-sm">
              <span className="text-[#8892a0]">{r.l}</span>
              <span className={'font-semibold ' + (r.accent ? 'text-[#00D4FF]' : 'text-white')}>{r.v}</span>
            </div>
          ))}
        </div>

        {promptCount > 1 && (
          <div className="bg-[#0a1520] border border-[#00D4FF]/20 rounded-xl px-3 py-2.5 mb-4">
            <p className="text-[11px] text-[#8892a0] leading-relaxed">
              {tokenIn.symbol} needs a one-time approval before it can be routed, so expect{' '}
              {promptCount} wallet prompts this first time. Later swaps of {tokenIn.symbol} need
              only one.
            </p>
          </div>
        )}

        {status && swapping && <p className="text-xs text-[#00D4FF] mb-4">{status}</p>}

        {swapError && (
          <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-3 mb-4">
            <p className="text-xs text-red-400">{swapError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => { setView('form'); setSwapError(null) }} disabled={swapping}
            className="flex-1 border border-[#1e2530] text-[#8892a0] py-3 rounded-xl hover:border-[#00D4FF] transition-all font-['Space_Grotesk'] font-semibold text-sm disabled:opacity-40">
            Edit
          </button>
          <button onClick={handleSwap} disabled={swapping || !activeQuote}
            className="flex-[2] bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {swapping ? (<><LoadingSpinner size="sm" /> Swapping…</>) : 'Confirm & Swap →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] tracking-widest text-[#8892a0]">
          BEST PRICE ACROSS VENUES
        </span>
        <button
          onClick={() => setShowSlippage(!showSlippage)}
          className="text-[10px] text-[#8892a0] hover:text-[#00D4FF] transition-colors border border-[#1e2530] rounded-lg px-2.5 py-1"
        >
          Slippage {(slippageBps / 100).toFixed(2)}%
        </button>
      </div>

      {showSlippage && (
        <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl px-3 py-2.5 mb-3">
          <p className="text-[10px] text-[#8892a0] mb-2">
            The swap reverts rather than filling below this. Tighter protects your price;
            looser is likelier to go through on a thin pool.
          </p>
          <div className="flex gap-2">
            {SLIPPAGE_OPTIONS.map(o => (
              <button key={o.bps} onClick={() => setSlippageBps(o.bps)}
                className={
                  'text-[11px] px-3 py-1 rounded-full border transition-all ' +
                  (slippageBps === o.bps
                    ? 'bg-[#0a2030] border-[#00D4FF] text-[#00D4FF]'
                    : 'border-[#1e2530] text-[#8892a0] hover:border-[#00D4FF]')
                }>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tokenBox({
        label: 'YOU PAY', token: tokenIn, isInput: true,
        onPick: () => setShowInModal(true), balance: inBalance,
        value: amount, onChange: setAmount, readOnly: false,
      })}

      <div className="flex justify-center -my-2.5 relative z-10">
        <button onClick={handleFlip} title="Flip direction"
          className="w-8 h-8 rounded-full bg-[#0f1822] border border-[#1e2530] flex items-center justify-center text-[#8892a0] hover:text-[#00D4FF] hover:border-[#00D4FF] hover:rotate-180 active:scale-90 transition-all duration-300">
          ↓↑
        </button>
      </div>

      {tokenBox({
        label: 'YOU RECEIVE', token: tokenOut, isInput: false,
        onPick: () => setShowOutModal(true), balance: balanceOf(tokenOutSymbol),
        value: '', onChange: () => {}, readOnly: true,
      })}

      {!bothAvailable && (
        <div className="mt-2.5 bg-[#1a1408] border border-[#3d2f10] rounded-lg px-3 py-2 flex items-start gap-2">
          <span className="text-sm">🚧</span>
          <p className="text-xs text-[#e8c374]">
            {(!tokenIn.available ? tokenIn.symbol : tokenOut.symbol)} isn't live on Arc Testnet yet.
            Arc currently supports USDC, EURC and cirBTC.
          </p>
        </div>
      )}

      {exceedsBalance && (
        <div className="mt-2.5 bg-[#1a1408] border border-[#3d2f10] rounded-lg px-3 py-2 flex items-start gap-2">
          <span className="text-sm">⚠️</span>
          <p className="text-xs text-[#e8c374]">You only have {inBalance} {tokenIn.symbol}.</p>
        </div>
      )}

      <button
        onClick={() => setView('confirm')}
        disabled={!canReview}
        className="w-full mt-4 bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {!account
          ? 'Connect wallet to swap'
          : searching
            ? 'Finding best route…'
            : noRoute
              ? 'No route available'
              : 'Review & Swap →'}
      </button>

      {/* ── Quotes panel ────────────────────────────────────────────────
          Shown whenever there's an amount to quote, so the panel doesn't
          appear and vanish between keystrokes. */}
      {amount && parseFloat(amount) > 0 && bothAvailable && (
        <div className="mt-4 bg-[#0D1117] border border-[#1e2530] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Quotes</span>
              {searching && (
                <span className="flex items-center gap-1.5 text-[10px] text-[#00D4FF]">
                  <span className="w-3 h-3 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
                  searching…
                </span>
              )}
            </div>

            {/* "Via UnitFlow and 1 other" — names the winner rather than
                just counting venues, so the header says something the rows
                below don't already. */}
            {!searching && liveQuotes.length > 0 && (
              <div className="flex items-center gap-2">
                {edge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#00D4FF]/12 text-[#00D4FF]">
                    {edge.toFixed(1)}%
                  </span>
                )}
                <span className="text-[10px] text-[#6b7683]">
                  Via <span className="text-[#8892a0]">{liveQuotes[0].name}</span>
                  {quotes.length > 1 && ' and ' + (quotes.length - 1) +
                    (quotes.length - 1 === 1 ? ' other' : ' others')}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-0.5">
            {quotes.map(q => <QuoteRow key={q.sourceId} q={q} />)}
            {searching && Array.from({ length: pendingCount }).map((_, i) => <SkeletonRow key={'sk' + i} />)}
          </div>

          {noRoute && (
            <p className="text-[11px] text-[#e8c374] px-3 py-2">
              No liquidity for {tokenIn.symbol}/{tokenOut.symbol} on any connected venue yet.
            </p>
          )}
        </div>
      )}

      <TokenSelectModal
        open={showInModal}
        onClose={() => setShowInModal(false)}
        tokens={inputChoices.map(t => ({
          symbol: t.symbol, name: t.name,
          balance: balanceOf(t.symbol) ?? '—',
          enabled: t.available,
        }))}
        selected={tokenInSymbol}
        onSelect={selectInput}
      />
      <TokenSelectModal
        open={showOutModal}
        onClose={() => setShowOutModal(false)}
        tokens={outputChoices.map(t => ({
          symbol: t.symbol, name: t.name,
          balance: balanceOf(t.symbol) ?? '—',
          enabled: t.available,
        }))}
        selected={tokenOutSymbol}
        onSelect={selectOutput}
      />
    </div>
  )
}