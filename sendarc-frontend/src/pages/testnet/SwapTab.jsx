import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  SWAP_TOKENS, SWAP_TOKEN_LIST, getSwapQuote, executeSwap,
  checkAllowances, UNITFLOW,
} from '../../utils/unitflowSwap'
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

export default function SwapTab({ account, provider, onRecordTransaction }) {
  const [view, setView] = useState('form') // 'form' | 'confirm' | 'success'

  const [tokenInSymbol, setTokenInSymbol] = useState('USDC')
  const [tokenOutSymbol, setTokenOutSymbol] = useState('EURC')
  const [amount, setAmount] = useState('')

  const [showInModal, setShowInModal] = useState(false)
  const [showOutModal, setShowOutModal] = useState(false)

  const [quote, setQuote] = useState(null)
  const [quoting, setQuoting] = useState(false)
  const [noRoute, setNoRoute] = useState(false)

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

  // A token can't be swapped for itself, so the opposite side never offers
  // the one already chosen. Picking a token that's currently on the other
  // side swaps them rather than creating an invalid pair — almost certainly
  // what the user meant by that action.
  const inputChoices = SWAP_TOKEN_LIST.filter(t => t.symbol !== tokenOutSymbol)
  const outputChoices = SWAP_TOKEN_LIST.filter(t => t.symbol !== tokenInSymbol)

  const balanceOf = (symbol) => balances[symbol] ?? null
  const inBalance = balanceOf(tokenInSymbol)

  // ── Balances ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!account) return
    let cancelled = false

    const load = async () => {
      const [usdc, eurc, cirbtc] = await Promise.all([
        getUsdcBalance('arc', account),
        getEurcBalance(account),
        getCirbtcBalance(account),
      ])
      if (cancelled) return
      setBalances({ USDC: usdc, EURC: eurc, cirBTC: cirbtc, USDT: null })
    }

    load()
    return () => { cancelled = true }
  }, [account, result])

  // ── Live quote, debounced ───────────────────────────────────────────
  // Every keystroke would otherwise fire four eth_calls (one per fee tier),
  // so this waits for a pause before asking.
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0 || !tokenIn?.available || !tokenOut?.available) {
      setQuote(null)
      setNoRoute(false)
      return
    }

    let cancelled = false
    setQuoting(true)
    setNoRoute(false)

    const timer = setTimeout(async () => {
      try {
        const q = await getSwapQuote({ tokenIn, tokenOut, amountIn: amount })
        if (cancelled) return
        setQuote(q)
        setNoRoute(q === null)
      } catch {
        if (!cancelled) { setQuote(null); setNoRoute(true) }
      } finally {
        if (!cancelled) setQuoting(false)
      }
    }, 450)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [amount, tokenInSymbol, tokenOutSymbol])

  // ── Approval state ──────────────────────────────────────────────────
  // Surfaced up front so the review screen can say how many wallet prompts
  // to expect, rather than surprising the user mid-swap.
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
    setQuote(null)
    setNoRoute(false)
  }

  const selectInput = (symbol) => {
    if (symbol === tokenOutSymbol) { handleFlip(); return }
    setTokenInSymbol(symbol)
    setAmount('')
  }

  const selectOutput = (symbol) => {
    if (symbol === tokenInSymbol) { handleFlip(); return }
    setTokenOutSymbol(symbol)
  }

  const handleSwap = async () => {
    setSwapping(true)
    setSwapError(null)
    setStatus('')
    try {
      const r = await executeSwap({
        tokenIn, tokenOut, amountIn: amount, quote,
        slippageBps, provider, from: account,
        onStatus: setStatus,
      })
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
    setView('form'); setAmount(''); setQuote(null); setResult(null)
    setSwapError(null); setStatus(''); setNoRoute(false)
  }

  const bothAvailable = tokenIn?.available && tokenOut?.available
  const numericBalance = inBalance === null ? null : parseFloat(inBalance)
  const exceedsBalance = numericBalance !== null && amount && parseFloat(amount) > numericBalance

  const promptCount = tokenIn?.isNative
    ? 1
    : 1 + (approvals?.needsTokenApproval ? 1 : 0) + (approvals?.needsPermit2Approval ? 1 : 0)

  const minReceived = quote
    ? (parseFloat(quote.amountOut) * (10000 - slippageBps) / 10000).toFixed(6)
    : null

  const canReview = !!quote && !quoting && !exceedsBalance && bothAvailable && !!account

  // ── Token box ───────────────────────────────────────────────────────
  const tokenBox = ({ label, token, isInput, onPick, balance, value, onChange, readOnly }) => (
    <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl px-4 py-3">
      <div className="flex items-center justify-between flex-wrap gap-y-1 mb-2">
        <span className="text-[10px] tracking-widest text-[#8892a0]">{label}</span>
        <span className="text-[10px] text-[#8892a0]">
          Balance: {balance === null ? '—' : balance}
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
        <button
          onClick={onPick}
          className="flex items-center gap-1.5 bg-[#1e2530] px-3 py-1.5 rounded-lg text-sm text-white font-semibold hover:opacity-80 transition-opacity flex-shrink-0"
        >
          <CoinIcon symbol={token.symbol} size={20} />
          {token.symbol}
          <ChevronDown className="w-4 h-4 text-[#8892a0]" />
        </button>
        {readOnly ? (
          <span className={
            'flex-1 min-w-0 text-2xl font-bold font-[\'Space_Grotesk\'] text-right truncate ' +
            (quoting ? 'text-[#ccccd6] animate-pulse' : 'text-white')
          }>
            {quoting ? '…' : quote ? parseFloat(quote.amountOut).toFixed(6) : '0.00'}
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
            className="flex-1 min-w-0 bg-transparent text-white text-2xl font-bold outline-none font-['Space_Grotesk'] text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
          />
        )}
      </div>
      <p className="text-[10px] text-[#ccccd6] mt-1.5">{token.name}</p>
      {!token.available && (
        <p className="text-[10px] text-[#e8c374] mt-1">{token.unavailableReason}</p>
      )}
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
          via UnitFlow on Arc Testnet · {(result.settlementTime / 1000).toFixed(1)}s
        </p>

        <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-4 text-left mb-5 space-y-2.5">
          {[
            { l: 'Swapped', v: result.amountIn + ' ' + result.tokenIn },
            { l: 'Received', v: '~' + result.amountOut.toFixed(6) + ' ' + result.tokenOut },
            { l: 'Pool fee', v: (result.fee / 10000).toFixed(2) + '%' },
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
            {quote ? parseFloat(quote.amountOut).toFixed(6) : '—'} {tokenOut.symbol}
          </span>
        </div>

        <div className="space-y-3 mb-5">
          {[
            { l: 'Rate', v: quote ? '1 ' + tokenIn.symbol + ' ≈ ' + quote.rate.toFixed(6) + ' ' + tokenOut.symbol : '—' },
            { l: 'Minimum received', v: minReceived ? minReceived + ' ' + tokenOut.symbol : '—', accent: true },
            { l: 'Max slippage', v: (slippageBps / 100).toFixed(2) + '%' },
            { l: 'Pool fee tier', v: quote ? (quote.fee / 10000).toFixed(2) + '%' : '—' },
            { l: 'Routed via', v: 'UnitFlow Finance' },
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
              {tokenIn.symbol} needs a one-time approval before UnitFlow can route it,
              so expect {promptCount} wallet prompts this first time. Later swaps of{' '}
              {tokenIn.symbol} will only need one.
            </p>
          </div>
        )}

        {status && swapping && (
          <p className="text-xs text-[#00D4FF] mb-4">{status}</p>
        )}

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
          <button onClick={handleSwap} disabled={swapping || !quote}
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
        {/* <span className="text-[10px] tracking-widest text-[#8892a0]">
          POWERED BY UNITFLOW
        </span> */}
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
            The swap reverts rather than filling below this. Tighter protects
            your price; looser is more likely to go through on a thin pool.
          </p>
          <div className="flex gap-2">
            {SLIPPAGE_OPTIONS.map(o => (
              <button
                key={o.bps}
                onClick={() => setSlippageBps(o.bps)}
                className={
                  'text-[11px] px-3 py-1 rounded-full border transition-all ' +
                  (slippageBps === o.bps
                    ? 'bg-[#0a2030] border-[#00D4FF] text-[#00D4FF]'
                    : 'border-[#1e2530] text-[#8892a0] hover:border-[#00D4FF]')
                }
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tokenBox({
        label: 'YOU PAY',
        token: tokenIn,
        isInput: true,
        onPick: () => setShowInModal(true),
        balance: inBalance,
        value: amount,
        onChange: setAmount,
        readOnly: false,
      })}

      <div className="flex justify-center -my-2.5 relative z-10">
        <button
          onClick={handleFlip}
          title="Flip direction"
          className="w-8 h-8 rounded-full bg-[#0f1822] border border-[#1e2530] flex items-center justify-center text-[#8892a0] hover:text-[#00D4FF] hover:border-[#00D4FF] hover:rotate-180 active:scale-90 transition-all duration-300"
        >
          ↓↑
        </button>
      </div>

      {tokenBox({
        label: 'YOU RECEIVE',
        token: tokenOut,
        isInput: false,
        onPick: () => setShowOutModal(true),
        balance: balanceOf(tokenOutSymbol),
        value: '',
        onChange: () => {},
        readOnly: true,
      })}

      {!bothAvailable && (
        <div className="mt-2.5 bg-[#1a1408] border border-[#3d2f10] rounded-lg px-3 py-2 flex items-start gap-2">
          <span className="text-sm">🚧</span>
          <p className="text-xs text-[#e8c374]">
            {(!tokenIn.available ? tokenIn.symbol : tokenOut.symbol)} isn't live on
            Arc Testnet yet. Arc currently supports USDC, EURC and cirBTC.
          </p>
        </div>
      )}

      {noRoute && bothAvailable && (
        <div className="mt-2.5 bg-[#1a1408] border border-[#3d2f10] rounded-lg px-3 py-2 flex items-start gap-2">
          <span className="text-sm">🔀</span>
          <p className="text-xs text-[#e8c374]">
            No liquidity pool for {tokenIn.symbol}/{tokenOut.symbol} on UnitFlow yet.
            Try a different pair, or{' '}
            <a href="https://app.unitflow.finance" target="_blank" rel="noreferrer" className="underline">
              check UnitFlow directly →
            </a>
          </p>
        </div>
      )}

      {exceedsBalance && (
        <div className="mt-2.5 bg-[#1a1408] border border-[#3d2f10] rounded-lg px-3 py-2 flex items-start gap-2">
          <span className="text-sm">⚠️</span>
          <p className="text-xs text-[#e8c374]">
            You only have {inBalance} {tokenIn.symbol}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#1e2530] text-center">
        <div>
          <p className="text-[9px] text-[#8892a0] mb-0.5">RATE</p>
          <p className="text-xs text-white font-semibold">
            {quoting ? '…' : quote ? '1 : ' + quote.rate.toFixed(4) : '—'}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-[#8892a0] mb-0.5">EST. TIME</p>
          <p className="text-xs text-white font-semibold">&lt; 1 sec</p>
        </div>
        <div>
          <p className="text-[9px] text-[#8892a0] mb-0.5">MIN RECEIVED</p>
          <p className="text-xs text-white font-semibold">
            {minReceived ? parseFloat(minReceived).toFixed(4) : '—'}
          </p>
        </div>
      </div>

      <button
        onClick={() => setView('confirm')}
        disabled={!canReview}
        className="w-full mt-5 bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {!account ? 'Connect wallet to swap' : quoting ? 'Finding best route…' : 'Review & Swap →'}
      </button>

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