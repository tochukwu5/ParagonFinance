import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useArcTestnet } from '../../hooks/useArcTestnet'
import { useTestnet } from '../../context/TestnetContext'
import {
  ARC_TESTNET, EVM_CHAINS, shortAddr, arcScanTx,
  switchToChain, sendUsdcOnChain, getUsdcBalance
} from '../../utils/arcTestnet'
import { Card, LoadingSpinner } from '../../components/UI'
import Navbar from '../../components/Navbar'

const STEPS = ['Connect Wallet', 'Send Details', 'Confirm', 'Complete']

const CHAIN_LIST = [
  EVM_CHAINS.arc,
  EVM_CHAINS.ethereum,
  EVM_CHAINS.base,
  EVM_CHAINS.arbitrum,
]

// CCTP flow steps shown during cross-chain send
const CCTP_STEPS = [
  { key: 'approve',     label: 'Approve USDC',         desc: 'Allow CCTP to spend your USDC' },
  { key: 'burn',        label: 'Burn on Source Chain',  desc: 'CCTP burns USDC on ' },
  { key: 'attest',      label: 'Circle Attestation',    desc: 'Circle signs the burn proof' },
  { key: 'mint',        label: 'Mint on Arc Testnet',   desc: 'USDC minted to recipient on Arc' },
]

export default function TestnetSend() {
  const {
    account, balance: arcBalance, isConnected,
    connect, isLoading, error, hasMetaMask, refreshBalance
  } = useArcTestnet()
  const { recordTransaction, loadTransactions } = useTestnet()

  const [step, setStep] = useState(isConnected ? 1 : 0)
  const [sourceChainKey, setSourceChainKey] = useState('arc')
  const [chainBalance, setChainBalance] = useState(arcBalance)
  const [switchingChain, setSwitchingChain] = useState(false)
  const [switchError, setSwitchError] = useState(null)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [txResult, setTxResult] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [useOwnAddress, setUseOwnAddress] = useState(false)

  // CCTP progress tracking
  const [cctpStatus, setCctpStatus] = useState('')
  const [cctpActiveStep, setCctpActiveStep] = useState(-1)
  const [cctpDoneSteps, setCctpDoneSteps] = useState([])

  const selectedChain = EVM_CHAINS[sourceChainKey]
  const isCCTP = selectedChain && selectedChain.useCCTP

  useEffect(() => {
    if (isConnected && step === 0) setStep(1)
  }, [isConnected, step])

  const handleChainSelect = async (chainKey) => {
    if (chainKey === sourceChainKey) return
    setSwitchingChain(true)
    setSwitchError(null)
    setAmount('')
    try {
      await switchToChain(chainKey)
      setSourceChainKey(chainKey)
      if (account) {
        const bal = await getUsdcBalance(chainKey, account)
        setChainBalance(bal)
      }
    } catch (err) {
      setSwitchError(err.message || 'Could not switch network')
    } finally {
      setSwitchingChain(false)
    }
  }

  useEffect(() => {
    if (!account) return
    getUsdcBalance(sourceChainKey, account).then(setChainBalance)
  }, [sourceChainKey, account, arcBalance])

  // Parse CCTP status message to update step indicators
  const handleStatusUpdate = (msg) => {
    setCctpStatus(msg)
    if (msg.includes('Approving')) { setCctpActiveStep(0); setCctpDoneSteps([]) }
    else if (msg.includes('Approval confirmed')) { setCctpDoneSteps(['approve']); setCctpActiveStep(1) }
    else if (msg.includes('Burning')) { setCctpActiveStep(1) }
    else if (msg.includes('burned on')) { setCctpDoneSteps(p => [...p, 'burn']); setCctpActiveStep(2) }
    else if (msg.includes('attestation')) { setCctpActiveStep(2) }
    else if (msg.includes('Attestation received')) { setCctpDoneSteps(p => [...p, 'attest']); setCctpActiveStep(3) }
    else if (msg.includes('Switching to Arc') || msg.includes('minting')) { setCctpActiveStep(3) }
    else if (msg.includes('minted on Arc')) { setCctpDoneSteps(p => [...p, 'mint']); setCctpActiveStep(-1) }
  }

  const handleSend = async () => {
    setSending(true)
    setSendError(null)
    setCctpStatus('')
    setCctpActiveStep(-1)
    setCctpDoneSteps([])
    try {
      const result = await sendUsdcOnChain(sourceChainKey, { to: recipient, amount }, handleStatusUpdate)
      await recordTransaction(result, account)
      await loadTransactions(account)
      if (sourceChainKey === 'arc') refreshBalance()
      else {
        const bal = await getUsdcBalance(sourceChainKey, account)
        setChainBalance(bal)
      }
      setTxResult(result)
      setStep(3)
    } catch (err) {
      if (err.code === 4001) setSendError('Transaction rejected in MetaMask.')
      else setSendError(err.message || 'Transaction failed. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const afterSend = amount && parseFloat(chainBalance)
    ? (parseFloat(chainBalance) - parseFloat(amount)).toFixed(6)
    : null
  const isValidAddress = recipient && recipient.startsWith('0x') && recipient.length === 42
  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(chainBalance)

  const explorerTxUrl = (hash) => selectedChain
    ? selectedChain.explorerUrl + '/tx/' + hash
    : arcScanTx(hash)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0D1117]">

        {/* Top bar */}
        <div className="border-b border-[#1e2530] bg-[#0f1822] px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/testnet" className="text-[#8892a0] hover:text-white text-sm transition-colors">
              ← Testnet Hub
            </Link>
            <span className="text-[#1e2530]">/</span>
            <span className="text-sm text-white font-['Space_Grotesk'] font-semibold">Send USDC</span>
            {isCCTP && (
              <span className="text-[10px] bg-[#00D4FF]/10 border border-[#00D4FF]/40 text-[#00D4FF] px-2 py-0.5 rounded-full">
                Circle CCTP Bridge
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] border border-[#00D4FF]/30 text-[#00D4FF] px-2 py-1 rounded-full">
              {selectedChain ? selectedChain.name : 'Arc Testnet'}
              {isCCTP && ' → Arc Testnet'}
            </span>
            {account && (
              <div className="flex items-center gap-2 bg-[#0D1117] border border-[#1e2530] rounded-lg px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-mono text-white">{shortAddr(account)}</span>
                <span className="text-xs text-[#00D4FF] font-semibold">{chainBalance} USDC</span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left */}
          <div className="lg:col-span-3">
            <h1 className="text-2xl font-bold font-['Space_Grotesk'] mb-1">Send USDC</h1>
            <p className="text-[#8892a0] text-sm mb-8">
              {isCCTP
                ? 'Cross-chain via Circle CCTP — USDC burns on source, mints on Arc Testnet'
                : 'Native Arc Testnet transfer — instant sub-second settlement'
              }
            </p>

            {/* Steps */}
            <div className="space-y-2 mb-8">
              {STEPS.map((s, i) => (
                <div key={s} className={'flex items-center gap-3 p-3.5 rounded-xl border transition-all ' + (
                  i === step ? 'bg-[#0a2030] border-[#00D4FF]' :
                  i < step  ? 'border-[#1e2530] bg-[#0f1822]' : 'border-[#1e2530] opacity-40'
                )}>
                  <div className={'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ' + (
                    i < step  ? 'bg-[#00D4FF] text-[#0D1117]' :
                    i === step ? 'border-2 border-[#00D4FF] text-[#00D4FF]' : 'border border-[#1e2530] text-[#8892a0]'
                  )}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={'text-sm font-[\'Space_Grotesk\'] font-semibold ' + (i === step ? 'text-white' : 'text-[#8892a0]')}>{s}</span>
                </div>
              ))}
            </div>

            {/* Step 0 — Connect */}
            {step === 0 && (
              <Card className="p-6 text-center">
                <div className="text-4xl mb-4">🦊</div>
                {!hasMetaMask ? (
                  <>
                    <h3 className="font-bold font-['Space_Grotesk'] mb-2">MetaMask Required</h3>
                    <p className="text-[#8892a0] text-sm mb-4">Install MetaMask to use ParagonFinance — it handles all chains automatically.</p>
                    <a href="https://metamask.io" target="_blank" rel="noreferrer"
                      className="bg-[#e8821a] text-white font-['Space_Grotesk'] font-bold px-6 py-2.5 rounded-xl hover:opacity-90 inline-block">
                      Install MetaMask ↗
                    </a>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold font-['Space_Grotesk'] mb-2">Connect MetaMask</h3>
                    <p className="text-[#8892a0] text-sm mb-4">Connect once — we switch networks automatically for CCTP.</p>
                    <button onClick={connect} disabled={isLoading}
                      className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-8 py-3 rounded-xl hover:opacity-90 disabled:opacity-50">
                      {isLoading ? 'Connecting…' : 'Connect MetaMask'}
                    </button>
                    {error && <p className="mt-3 text-red-400 text-xs">{error}</p>}
                  </>
                )}
              </Card>
            )}

            {/* Step 1 — Send Details */}
            {step === 1 && (
              <div className="space-y-4">

                {/* Source Chain */}
                <Card className="p-5">
                  <p className="text-[10px] tracking-widest text-[#8892a0] mb-3">SOURCE CHAIN</p>
                  <div className="flex gap-2 flex-wrap">
                    {CHAIN_LIST.map(chain => {
                      const key = Object.keys(EVM_CHAINS).find(k => EVM_CHAINS[k].id === chain.id)
                      const isActive = sourceChainKey === key
                      return (
                        <button
                          key={chain.id}
                          onClick={() => handleChainSelect(key)}
                          disabled={switchingChain}
                          className={'px-4 py-2 rounded-xl border text-sm font-semibold transition-all flex items-center gap-1.5 disabled:opacity-60 ' + (
                            isActive ? 'text-white' : 'border-[#1e2530] text-[#8892a0] hover:border-[#00D4FF]/50 hover:text-white'
                          )}
                          style={isActive ? { borderColor: chain.color, backgroundColor: chain.color + '15' } : {}}
                        >
                          <span>{chain.icon}</span>
                          <span>{chain.name}</span>
                        </button>
                      )
                    })}
                  </div>

                  {switchingChain && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#00D4FF]">
                      <LoadingSpinner size="sm" /> Switching network in MetaMask…
                    </div>
                  )}
                  {switchError && <p className="mt-2 text-xs text-red-400">{switchError}</p>}

                  {!switchingChain && !switchError && selectedChain && (
                    <div className={'mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg ' + (
                      isCCTP
                        ? 'bg-[#00D4FF]/5 border border-[#00D4FF]/20 text-[#00D4FF]'
                        : 'bg-green-900/10 border border-green-500/20 text-green-400'
                    )}>
                      {isCCTP ? (
                        <>
                          <span>⚡ Circle CCTP</span>
                          <span>·</span>
                          <span>Burns on {selectedChain.name} → Mints on Arc Testnet</span>
                        </>
                      ) : (
                        <>
                          <span>● Native Arc</span>
                          <span>·</span>
                          <span>Direct transfer · sub-second finality</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* CCTP explanation */}
                  {isCCTP && (
                    <div className="mt-3 bg-[#0a1520] rounded-lg p-3">
                      <p className="text-[10px] text-[#8892a0] leading-relaxed">
                        <span className="text-[#00D4FF] font-semibold">How CCTP works:</span> Your USDC is
                        burned on {selectedChain?.name}, Circle's attestation service verifies the burn,
                        then equivalent USDC is minted directly on Arc Testnet for the recipient.
                        No wrapping. No bridges to trust. Circle guarantees the mint.
                      </p>
                    </div>
                  )}
                </Card>

                {/* Wallet + Amount */}
                <Card className="p-5">
                  <p className="text-[10px] tracking-widest text-[#8892a0] mb-3">FROM (YOUR WALLET)</p>
                  <div className="bg-[#0D1117] border border-[#1e2530] rounded-lg p-3 mb-4">
                    <p className="font-mono text-sm text-white break-all">{account}</p>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] text-[#8892a0]">USDC Balance on {selectedChain?.name}</span>
                      <span className="text-[10px] text-[#00D4FF] font-semibold">{chainBalance} USDC</span>
                    </div>
                  </div>

                  <p className="text-[10px] tracking-widest text-[#8892a0] mb-2">AMOUNT (USDC)</p>
                  <div className="flex items-center gap-3 bg-[#0D1117] border border-[#1e2530] rounded-lg px-4 py-3 mb-2">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => {
                        const val = parseFloat(e.target.value)
                        if (e.target.value === '' || e.target.value === '0') setAmount('')
                        else if (!isNaN(val) && val > 0) setAmount(e.target.value)
                      }}
                      min="0"
                      max={parseFloat(chainBalance)}
                      className="flex-1 bg-transparent text-white text-2xl font-bold outline-none font-['Space_Grotesk']"
                    />
                    <span className="text-sm text-white bg-[#1e2530] px-3 py-1 rounded-md">USDC</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#8892a0]">
                    <span>Balance: <span className="text-[#00D4FF]">{chainBalance} USDC</span></span>
                    <button
                      onClick={() => setAmount((Math.max(0, parseFloat(chainBalance) - 0.001)).toFixed(6))}
                      className="text-[#00D4FF] hover:underline"
                    >
                      Max
                    </button>
                  </div>
                  {afterSend !== null && (
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-[#8892a0]">After Send</span>
                      <span className={parseFloat(afterSend) < 0 ? 'text-red-400' : 'text-[#8892a0]'}>
                        {afterSend} USDC
                      </span>
                    </div>
                  )}
                </Card>

                <Card className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] tracking-widest text-[#8892a0]">RECIPIENT ADDRESS (ARC TESTNET)</p>
                    <button onClick={() => { setRecipient(account || ''); setUseOwnAddress(true) }}
                      className="text-[10px] text-[#00D4FF] hover:underline">
                      Use my own address
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="0x... Arc Testnet wallet address"
                    value={recipient}
                    onChange={e => { setRecipient(e.target.value); setUseOwnAddress(false) }}
                    className="w-full bg-[#0D1117] border border-[#1e2530] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-[#00D4FF] transition-colors font-mono"
                  />
                  {useOwnAddress && <p className="text-[10px] text-[#00D4FF] mt-2">✓ Sending to your own address</p>}
                  {recipient && !isValidAddress && (
                    <p className="text-[10px] text-red-400 mt-2">Must be a valid 0x address (42 characters)</p>
                  )}

                  <p className="text-[10px] tracking-widests text-[#8892a0] mt-4 mb-2">MEMO (OPTIONAL)</p>
                  <input
                    type="text"
                    placeholder="Add a note to this transaction"
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                    maxLength={100}
                    className="w-full bg-[#0D1117] border border-[#1e2530] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF] transition-colors"
                  />
                </Card>

                {isCCTP && (
                  <div className="bg-amber-900/10 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-xs text-amber-400 font-semibold mb-1">⏱ CCTP takes 2–5 minutes</p>
                    <p className="text-xs text-[#8892a0]">
                      Cross-chain via CCTP requires Circle's attestation service to verify the burn.
                      You will need ETH for gas on {selectedChain?.name} + a small amount for the Arc mint step.
                      MetaMask will prompt you 3 times: approve, burn, then mint on Arc.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  disabled={!isValidAddress || !isValidAmount || switchingChain}
                  className="w-full bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Review Transaction →
                </button>
              </div>
            )}

            {/* Step 2 — Confirm */}
            {step === 2 && (
              <div className="space-y-4">
                <Card className="p-5">
                  <p className="text-[10px] tracking-widest text-[#8892a0] mb-4">TRANSACTION REVIEW</p>
                  <div className="space-y-3">
                    {[
                      { l: 'Bridge Type',   v: isCCTP ? 'Circle CCTP (official)' : 'Native Arc transfer', accent: isCCTP },
                      { l: 'Source Chain',  v: selectedChain ? selectedChain.name : 'Arc Testnet' },
                      { l: 'Destination',   v: 'Arc Testnet (Chain 5042002)' },
                      { l: 'From',          v: shortAddr(account), mono: true },
                      { l: 'To',            v: shortAddr(recipient), mono: true },
                      { l: 'Amount',        v: amount + ' USDC' },
                      { l: 'Gas Token',     v: isCCTP ? 'ETH (on ' + selectedChain?.name + ')' : 'USDC (native Arc)' },
                      { l: 'Est. Time',     v: isCCTP ? '2–5 minutes (CCTP attestation)' : '< 1 second', accent: true },
                      { l: 'MetaMask Prompts', v: isCCTP ? '3 (approve + burn + mint)' : '1 (sign tx)' },
                    ].map(r => (
                      <div key={r.l} className="flex justify-between items-center border-b border-[#1e2530] pb-2.5 last:border-0 text-sm">
                        <span className="text-[#8892a0]">{r.l}</span>
                        <span className={'font-semibold ' + (r.accent ? 'text-[#00D4FF]' : 'text-white') + (r.mono ? ' font-mono text-xs' : '')}>
                          {r.v}
                        </span>
                      </div>
                    ))}
                    {memo && (
                      <div className="border-t border-[#1e2530] pt-2.5 text-sm">
                        <span className="text-[#8892a0]">Memo: </span>
                        <span className="text-white">{memo}</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* CCTP flow indicator */}
                {isCCTP && (
                  <Card className="p-5">
                    <p className="text-[10px] tracking-widests text-[#8892a0] mb-3">CCTP BRIDGE FLOW</p>
                    <div className="space-y-3">
                      {CCTP_STEPS.map((s, i) => (
                        <div key={s.key} className="flex items-center gap-3">
                          <div className={'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ' + (
                            cctpDoneSteps.includes(s.key)
                              ? 'bg-green-500 border-green-500 text-white'
                              : cctpActiveStep === i && sending
                              ? 'border-[#00D4FF] text-[#00D4FF] animate-pulse'
                              : 'border-[#1e2530] text-[#556]'
                          )}>
                            {cctpDoneSteps.includes(s.key) ? '✓' : i + 1}
                          </div>
                          <div className="flex-1">
                            <p className={'text-sm font-semibold ' + (cctpActiveStep === i && sending ? 'text-[#00D4FF]' : cctpDoneSteps.includes(s.key) ? 'text-green-400' : 'text-[#8892a0]')}>
                              {s.label}
                            </p>
                            <p className="text-[10px] text-[#556]">{s.desc}{s.key === 'burn' ? selectedChain?.name : ''}</p>
                          </div>
                          {cctpActiveStep === i && sending && <LoadingSpinner size="sm" />}
                        </div>
                      ))}
                    </div>
                    {cctpStatus && (
                      <div className="mt-3 bg-[#0a2030] rounded-lg px-3 py-2">
                        <p className="text-xs text-[#00D4FF]">{cctpStatus}</p>
                      </div>
                    )}
                  </Card>
                )}

                <div className="bg-[#0a1520] border border-[#00D4FF]/20 rounded-xl p-4">
                  <p className="text-xs text-[#8892a0] leading-relaxed">
                    {isCCTP ? (
                      <>
                        <span className="text-white font-semibold">MetaMask will prompt 3 times:</span> First to
                        approve USDC spend, then to burn on {selectedChain?.name}, then to mint on Arc Testnet.
                        Do not close MetaMask between prompts.
                      </>
                    ) : (
                      <>
                        <span className="text-white font-semibold">MetaMask will open once</span> — sign the
                        transfer. Gas is paid in USDC on Arc Testnet. Confirms in under 1 second.
                      </>
                    )}
                  </p>
                </div>

                {sendError && (
                  <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-xs text-red-400">{sendError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => { setStep(1); setSendError(null); setCctpStatus('') }}
                    className="flex-1 border border-[#1e2530] text-[#8892a0] py-3 rounded-xl hover:border-[#00D4FF] transition-all font-['Space_Grotesk'] font-semibold text-sm">
                    Edit
                  </button>
                  <button onClick={handleSend} disabled={sending}
                    className="flex-[2] bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {sending ? (
                      <><LoadingSpinner size="sm" /> {isCCTP ? 'Bridging via CCTP…' : 'Processing…'}</>
                    ) : (
                      isCCTP ? '⚡ Bridge via CCTP →' : 'Sign & Send →'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Success */}
            {step === 3 && txResult && (
              <Card glow className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center mx-auto mb-5 text-3xl">✓</div>
                <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-1">
                  {txResult.cctpBridge ? 'CCTP Bridge ' : 'Transfer '}
                  <span className="text-green-400">Confirmed!</span>
                </h2>
                <p className="text-[#8892a0] text-sm mb-1">
                  {txResult.cctpBridge
                    ? txResult.sourceChain + ' → Arc Testnet via Circle CCTP'
                    : 'Confirmed on Arc Testnet'
                  }
                </p>
                <p className="text-[#00D4FF] text-xs mb-8">
                  Total time: <strong>{(txResult.settlementTime / 1000).toFixed(1)}s</strong>
                </p>

                {txResult.cctpBridge && (
                  <div className="bg-[#0a2030] border border-[#00D4FF]/20 rounded-xl p-4 mb-5 text-left">
                    <p className="text-[10px] tracking-widests text-[#8892a0] mb-2">CCTP BRIDGE COMPLETED</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-white font-semibold">{txResult.sourceChain}</span>
                      <span className="text-[#00D4FF]">→ Circle CCTP →</span>
                      <span className="text-white font-semibold">Arc Testnet</span>
                      <span className="text-green-400 ml-auto">✓ Minted</span>
                    </div>
                  </div>
                )}

                <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-5 text-left mb-5 space-y-3">
                  {[
                    { l: 'Amount',       v: txResult.amount + ' USDC' },
                    { l: 'Source Chain', v: txResult.sourceChain },
                    { l: 'Destination',  v: 'Arc Testnet' },
                    { l: 'Gas Paid',     v: txResult.gasCost, accent: true },
                    { l: 'Total Time',   v: (txResult.settlementTime / 1000).toFixed(1) + 's', accent: true },
                    { l: 'Status',       v: 'Confirmed · FINAL', green: true },
                    { l: 'Bridge',       v: txResult.cctpBridge ? 'Circle CCTP V1' : 'Native Arc' },
                  ].map(r => (
                    <div key={r.l} className="flex justify-between border-b border-[#1e2530] pb-2 last:border-0 text-sm">
                      <span className="text-[#8892a0]">{r.l}</span>
                      <span className={'font-semibold ' + (r.green ? 'text-green-400' : r.accent ? 'text-[#00D4FF]' : 'text-white')}>
                        {r.v}
                      </span>
                    </div>
                  ))}

                  <div className="pt-1 space-y-2">
                    <div>
                      <p className="text-[10px] text-[#8892a0] mb-1">{txResult.cctpBridge ? 'BURN TX HASH' : 'TX HASH'}</p>
                      <a href={explorerTxUrl(txResult.hash)} target="_blank" rel="noreferrer"
                        className="text-[10px] text-[#00D4FF] font-mono break-all hover:underline">
                        {txResult.hash}
                      </a>
                    </div>
                    {txResult.mintTxHash && (
                      <div>
                        <p className="text-[10px] text-[#8892a0] mb-1">MINT TX HASH (ARC TESTNET)</p>
                        <a href={arcScanTx(txResult.mintTxHash)} target="_blank" rel="noreferrer"
                          className="text-[10px] text-[#00D4FF] font-mono break-all hover:underline">
                          {txResult.mintTxHash}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mb-3">
                  <a href={explorerTxUrl(txResult.hash)} target="_blank" rel="noreferrer"
                    className="flex-1 border border-[#00D4FF] text-[#00D4FF] py-2.5 rounded-xl text-sm font-['Space_Grotesk'] font-bold hover:bg-[#0a2030] transition-all text-center">
                    View on Explorer ↗
                  </a>
                  <button onClick={() => navigator.clipboard.writeText(txResult.hash)}
                    className="flex-1 border border-[#1e2530] text-[#8892a0] py-2.5 rounded-xl text-sm hover:border-[#00D4FF] transition-all">
                    📋 Copy TX Hash
                  </button>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => {
                    setStep(1); setRecipient(''); setAmount(''); setMemo('')
                    setTxResult(null); setCctpStatus(''); setCctpDoneSteps([]); setCctpActiveStep(-1)
                  }} className="flex-1 bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-2.5 rounded-xl text-sm hover:opacity-90">
                    Send Another →
                  </button>
                  <Link to="/testnet/transactions"
                    className="flex-1 border border-[#1e2530] text-[#8892a0] py-2.5 rounded-xl text-sm hover:border-[#00D4FF] hover:text-white transition-all text-center">
                    View History
                  </Link>
                </div>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5">
              <p className="text-[10px] tracking-widests text-[#8892a0] mb-3">TRANSACTION SUMMARY</p>
              {selectedChain && (
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1e2530]">
                  <span className="text-xl">{selectedChain.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white font-semibold">{selectedChain.name}</p>
                    <p className="text-[10px] text-green-400">● Live</p>
                  </div>
                  {isCCTP && (
                    <>
                      <span className="text-[#00D4FF] text-sm">→</span>
                      <div>
                        <p className="text-sm text-white font-semibold">Arc Testnet</p>
                        <p className="text-[10px] text-[#00D4FF]">via CCTP</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="text-4xl font-bold font-['Space_Grotesk'] text-white mb-1">{amount || '0'}</div>
              <p className="text-xs text-[#8892a0] mb-4">USDC</p>

              {amount && parseFloat(amount) > 0 && (
                <div className="bg-[#0D1117] border border-[#1e2530] rounded-lg p-3 mb-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8892a0]">Your Balance</span>
                    <span className="text-[#00D4FF]">{chainBalance} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8892a0]">After Send</span>
                    <span className={afterSend && parseFloat(afterSend) < 0 ? 'text-red-400' : 'text-white'}>
                      {afterSend} USDC
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2.5 text-sm">
                {[
                  { l: 'Gas Token',   v: isCCTP ? 'ETH (source chain)' : 'USDC (native Arc)' },
                  { l: 'Settlement',  v: isCCTP ? '2–5 min (CCTP)' : '< 1 second', accent: !isCCTP },
                  { l: 'Bridge',      v: isCCTP ? 'Circle CCTP V1' : 'Direct transfer', accent: isCCTP },
                  { l: 'MetaMask',    v: isCCTP ? '3 prompts' : '1 prompt' },
                ].map(r => (
                  <div key={r.l} className="flex justify-between border-b border-[#1e2530] pb-2 last:border-0">
                    <span className="text-[#8892a0]">{r.l}</span>
                    <span className={r.accent ? 'text-[#00D4FF] font-semibold' : 'text-white'}>{r.v}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-[10px] tracking-widests text-[#8892a0] mb-4">YOUR WALLET</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8892a0]">Address</span>
                  <span className="font-mono text-xs text-white">{shortAddr(account)}</span>
                </div>
                <div className="flex justify-between border-t border-[#1e2530] pt-2.5">
                  <span className="text-[#8892a0]">USDC Balance</span>
                  <span className="text-[#00D4FF] font-bold">{chainBalance}</span>
                </div>
                <div className="flex justify-between border-t border-[#1e2530] pt-2.5">
                  <span className="text-[#8892a0]">Active Chain</span>
                  <span className="text-green-400 text-xs font-semibold">
                    ● {selectedChain ? selectedChain.name : 'Arc Testnet'}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-[10px] tracking-widests text-[#8892a0] mb-3">SUPPORTED CHAINS</p>
              <div className="space-y-1">
                {CHAIN_LIST.map(chain => {
                  const key = Object.keys(EVM_CHAINS).find(k => EVM_CHAINS[k].id === chain.id)
                  const isActive = sourceChainKey === key
                  return (
                    <button
                      key={chain.id}
                      onClick={() => handleChainSelect(key)}
                      disabled={switchingChain}
                      className={'w-full flex items-center justify-between py-2 px-2 rounded-lg border transition-all ' + (
                        isActive ? 'border-[#00D4FF]/40 bg-[#0a2030]' : 'border-transparent hover:border-[#1e2530]'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span>{chain.icon}</span>
                        <div className="text-left">
                          <p className="text-sm text-white">{chain.name}</p>
                          {chain.useCCTP && <p className="text-[9px] text-[#00D4FF]">via CCTP</p>}
                        </div>
                      </div>
                      <span className="text-[10px] bg-green-900/20 border border-green-500 text-green-400 px-2 py-0.5 rounded-full">
                        Live
                      </span>
                    </button>
                  )
                })}
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-[10px] tracking-widests text-[#8892a0] mb-1">NEED TESTNET USDC?</p>
              <p className="text-[10px] text-[#556] mb-3">Get USDC on any testnet from Circle's official faucet</p>
              <a href={ARC_TESTNET.faucetUrl} target="_blank" rel="noreferrer"
                className="block w-full text-center border border-[#00D4FF] text-[#00D4FF] py-2.5 rounded-xl text-sm font-['Space_Grotesk'] font-bold hover:bg-[#0a2030] transition-all">
                Circle Faucet → Free Testnet USDC
              </a>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}