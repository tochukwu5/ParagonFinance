import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useArcTestnet } from '../../hooks/useArcTestnet'
import { useTestnet } from '../../context/TestnetContext'
import {
  ARC_TESTNET, EVM_CHAINS, shortAddr, arcScanTx,
  switchToChain, sendUsdcOnChain, getUsdcBalance,
  getEurcBalance, sendEurcOnArc, getCirbtcBalance, sendCirbtcOnArc,
  bridgeUsdcViaAppKit, estimateSendPaymentGasCost,
  payBridgeFeeToTreasury, BRIDGE_FLAT_FEE_USDC
} from '../../utils/arcTestnet'
import { Card, LoadingSpinner } from '../../components/UI'
import Navbar from '../../components/Navbar'
import TokenSelectModal from '../../components/TokenSelectModal'
import { CoinIcon } from '../../components/CoinLogos'
import NetworkTokenModal from '../../components/NetworkTokenModal'

// CCTP flow steps shown while a bridge transaction is in flight
const CCTP_STEPS = [
  { key: 'approve', label: 'Approve' },
  { key: 'burn',     label: 'Burn' },
  { key: 'attest',   label: 'Attest' },
  { key: 'mint',     label: 'Mint' },
]

// Every network in the bridge picker. All of these are real, CCTP-bridge-
// supported chains per Circle's own supported-blockchains reference — none
// of them are placeholders anymore. Arc can be either side of the bridge.
const ALL_NETWORKS = Object.keys(EVM_CHAINS).map(key => ({
  key,
  name: EVM_CHAINS[key].name,
  icon: EVM_CHAINS[key].icon,
  usdcAddress: EVM_CHAINS[key].usdcAddress,
  enabled: true,
}))

const AMOUNT_PRESETS = [1, 5, 10]

export default function TestnetSend() {
  const {
    account, balance: arcBalance, isConnected,
    connect, isLoading, error, hasMetaMask, refreshBalance
  } = useArcTestnet()
  const { recordTransaction, loadTransactions } = useTestnet()

  const [activeTab, setActiveTab] = useState('send') // 'send' | 'bridge'
  const [view, setView] = useState('form')            // 'form' | 'confirm' | 'success'

  // sourceChainKey / bridgeToKey belong to the BRIDGE tab only. The Send
  // tab always operates on Arc directly and uses `arcBalance` from the
  // hook — it never reads chainBalance, so swapping bridge direction can't
  // affect what Send shows (this was the bug: Send used to share
  // chainBalance with Bridge's "from" side, so it went to 0 whenever
  // Bridge's source wasn't Arc).
  const [sourceChainKey, setSourceChainKey] = useState('ethereum')
  const [bridgeToKey, setBridgeToKey] = useState('arc')
  const [chainBalance, setChainBalance] = useState('0.000000')
  const [destBalance, setDestBalance] = useState('0.000000')
  const [arcUsdcBalance, setArcUsdcBalance] = useState('0.000000')
  const [eurcBalance, setEurcBalance] = useState('0.000000')
  const [cirbtcBalance, setCirbtcBalance] = useState('0.00000000')
  const [switchingChain, setSwitchingChain] = useState(false)
  const [switchError, setSwitchError] = useState(null)

  const [selectedToken, setSelectedToken] = useState('USDC')
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [showFromModal, setShowFromModal] = useState(false)
  const [showToModal, setShowToModal] = useState(false)

  const [recipient, setRecipient] = useState('')
  const [useOwnAddress, setUseOwnAddress] = useState(false)
  const [showWalletInput, setShowWalletInput] = useState(false)
  const [amount, setAmount] = useState('')
  const [showMemo, setShowMemo] = useState(false)
  const [memo, setMemo] = useState('')

  const [txResult, setTxResult] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)

  // Live pre-send gas estimate for the Send tab's "NETWORK FEE" row —
  // replaces what used to be the static text "USDC gas" with a real
  // eth_estimateGas-based number for this specific recipient/amount.
  const [estimatedFee, setEstimatedFee] = useState(null)
  const [estimatingFee, setEstimatingFee] = useState(false)

  // CCTP progress tracking
  const [cctpStatus, setCctpStatus] = useState('')
  const [cctpActiveStep, setCctpActiveStep] = useState(-1)
  const [cctpDoneSteps, setCctpDoneSteps] = useState([])

  const selectedChain = EVM_CHAINS[sourceChainKey]
  const destChain = EVM_CHAINS[bridgeToKey]
  // Every Bridge-tab transfer goes through CCTP now, in either direction —
  // the Send tab (Arc-native/EURC/cirBTC) is the only non-CCTP path.
  const isCCTP = activeTab === 'bridge'
  const tokenSupported = selectedToken === 'USDC' || selectedToken === 'EURC' || selectedToken === 'cirBTC'
  // Send tab's USDC balance is arcUsdcBalance — a dedicated fetch this
  // component owns and refreshes itself, not the wallet hook's `balance`
  // field (which turned out not to refresh proactively on its own) and
  // never chainBalance (which belongs to whatever chain Bridge has selected).
  const activeBalance = selectedToken === 'EURC' ? eurcBalance : selectedToken === 'cirBTC' ? cirbtcBalance : arcUsdcBalance

  const sendTokens = [
    { symbol: 'USDC',   name: 'USD Coin',       balance: arcUsdcBalance, enabled: true },
    { symbol: 'EURC',   name: 'Euro Coin',      balance: eurcBalance,   enabled: true },
    { symbol: 'cirBTC', name: 'Circle Bitcoin', balance: cirbtcBalance, enabled: true },
  ]

  // getUsdcBalance/getEurcBalance/getCirbtcBalance return null on a genuine
  // fetch failure (after retries) rather than '0' — this keeps whatever
  // balance was last successfully shown instead of flashing to zero, which
  // was indistinguishable from an actually-empty wallet.
  const applyBalance = (setter, value) => { if (value !== null && value !== undefined) setter(value) }

  const handleChainSelect = async (chainKey) => {
    if (chainKey === sourceChainKey) return
    setSwitchingChain(true)
    setSwitchError(null)
    setAmount('')
    try {
      await switchToChain(chainKey)
      setSourceChainKey(chainKey)
      if (account) applyBalance(setChainBalance, await getUsdcBalance(chainKey, account))
    } catch (err) {
      setSwitchError(err.message || 'Could not switch network')
    } finally {
      setSwitchingChain(false)
    }
  }

  // Real swap: the wallet's active network switches to whatever becomes the
  // new source, and source/destination genuinely swap — both directions are
  // supported (Circle's App Kit docs show Arc_Testnet as a valid `from`).
  const handleSwapDirection = () => {
    const oldFrom = sourceChainKey
    const oldTo = bridgeToKey
    handleChainSelect(oldTo)
    setBridgeToKey(oldFrom)
  }

  // Keep the wallet network in sync with the active tab. This only ever
  // switches the WALLET's network — it never touches sourceChainKey/
  // bridgeToKey (those are Bridge-tab-only state), so Bridge's chosen
  // chains survive a trip to the Send tab and back. Also refetches Arc's
  // USDC balance directly here, so landing on Send always shows a current
  // number instead of whatever it last happened to be.
  useEffect(() => {
    if (!isConnected) return
    if (activeTab === 'send') {
      switchToChain('arc').catch(() => {})
      if (account) getUsdcBalance('arc', account).then(v => applyBalance(setArcUsdcBalance, v))
    }
    if (activeTab === 'bridge' && sourceChainKey === bridgeToKey) {
      setBridgeToKey(sourceChainKey === 'arc' ? 'ethereum' : 'arc')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isConnected])

  // Dedicated Arc USDC balance fetch — fires as soon as an account is
  // connected, independent of the wallet hook's own refresh timing and
  // independent of anything happening on the Bridge tab.
  useEffect(() => {
    if (!account) return
    getUsdcBalance('arc', account).then(v => applyBalance(setArcUsdcBalance, v))
  }, [account])

  // Bridge tab's "from" balance — only fetched/used when on the Bridge tab.
  useEffect(() => {
    if (!account) return
    getUsdcBalance(sourceChainKey, account).then(v => applyBalance(setChainBalance, v))
  }, [sourceChainKey, account, arcBalance])

  useEffect(() => {
    if (!account) return
    getUsdcBalance(bridgeToKey, account).then(v => applyBalance(setDestBalance, v))
  }, [bridgeToKey, account, arcBalance])

  useEffect(() => {
    if (!account) return
    getEurcBalance(account).then(v => applyBalance(setEurcBalance, v))
    getCirbtcBalance(account).then(v => applyBalance(setCirbtcBalance, v))
  }, [account, arcBalance])

  // Default the recipient to the connected wallet until the person expands
  // "Add receiving wallet" and picks someone else — mirrors the reference flow.
  useEffect(() => {
    if (activeTab === 'bridge' && account && !showWalletInput) {
      setRecipient(account)
      setUseOwnAddress(true)
    }
  }, [activeTab, account, showWalletInput])

 
    // Recompute the Send tab's gas estimate as the form changes, debounced.
  // Fires as soon as the wallet is connected — recipient and amount only
  // sharpen the figure from "what this call costs generally" to "what this
  // exact call costs." Neither is required for a number to exist, which is
  // why the row no longer blanks to "—" while the form is half-filled.
  useEffect(() => {
    if (activeTab !== 'send' || selectedToken !== 'USDC') { setEstimatedFee(null); return }
    if (!account) { setEstimatedFee(null); return }

    let cancelled = false
    setEstimatingFee(true)
    const timer = setTimeout(() => {
      estimateSendPaymentGasCost({ from: account, to: recipient, amount })
        .then(v => { if (!cancelled) setEstimatedFee(v) })
        .finally(() => { if (!cancelled) setEstimatingFee(false) })
    }, 400)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [activeTab, selectedToken, account, recipient, amount])

  const handleStatusUpdate = (msg) => {
    setCctpStatus(msg)
    if (msg.includes('Approving')) { setCctpActiveStep(0); setCctpDoneSteps([]) }
    else if (msg.includes('approved')) { setCctpDoneSteps(['approve']); setCctpActiveStep(1) }
    else if (msg.includes('Burning')) { setCctpActiveStep(1) }
    else if (msg.includes('burned')) { setCctpDoneSteps(p => [...p, 'burn']); setCctpActiveStep(2) }
    else if (msg.includes('attestation')) { setCctpActiveStep(2) }
    else if (msg.includes('Attestation received')) { setCctpDoneSteps(p => [...p, 'attest']); setCctpActiveStep(3) }
    else if (msg.includes('Minting')) { setCctpActiveStep(3) }
    else if (msg.includes('minted')) { setCctpDoneSteps(p => [...p, 'mint']); setCctpActiveStep(-1) }
  }

  const handleSend = async () => {
    setSending(true)
    setSendError(null)
    setCctpStatus('')
    setCctpActiveStep(-1)
    setCctpDoneSteps([])
    try {
      let result
      if (activeTab === 'send' && selectedToken === 'EURC') {
        result = await sendEurcOnArc({ from: account, to: recipient, amount })
      } else if (activeTab === 'send' && selectedToken === 'cirBTC') {
        result = await sendCirbtcOnArc({ from: account, to: recipient, amount })
      } else if (activeTab === 'bridge') {
        result = await bridgeUsdcViaAppKit(
          { fromChainKey: sourceChainKey, toChainKey: bridgeToKey, from: account, to: recipient, amount },
          handleStatusUpdate
        )
        // Flat ParagonFinance bridge fee, charged only after the bridge
        // itself succeeds — CCTP already involves several steps (approve,
        // burn, attest, mint) that can each fail independently, and it
        // wouldn't be right to charge a platform fee for a bridge that
        // never completed. A failure here is logged but doesn't undo or
        // hide the bridge's own success — the person already has their
        // funds moving; this is ParagonFinance's separate revenue leg.
        try {
          const feeResult = await payBridgeFeeToTreasury({ from: account })
          result.bridgeFeePaid = BRIDGE_FLAT_FEE_USDC
          result.bridgeFeeTxHash = feeResult.hash
        } catch (feeErr) {
          console.error('ParagonFinance bridge fee payment failed:', feeErr)
          result.bridgeFeePaid = null
        }
      } else {
        // Send tab, USDC — always Arc, never sourceChainKey (that belongs
        // to the Bridge tab and could be any of the 10 chains).
        result = await sendUsdcOnChain('arc', { to: recipient, amount }, handleStatusUpdate)
      }
      await recordTransaction(result, account)
      await loadTransactions(account)
      if (selectedToken === 'EURC') applyBalance(setEurcBalance, await getEurcBalance(account))
      else if (selectedToken === 'cirBTC') applyBalance(setCirbtcBalance, await getCirbtcBalance(account))
      else if (activeTab === 'bridge') {
        applyBalance(setChainBalance, await getUsdcBalance(sourceChainKey, account))
        applyBalance(setDestBalance, await getUsdcBalance(bridgeToKey, account))
        if (bridgeToKey === 'arc' || sourceChainKey === 'arc') {
          refreshBalance()
          applyBalance(setArcUsdcBalance, await getUsdcBalance('arc', account))
        }
      }
      else {
        // Send tab USDC — always Arc
        refreshBalance()
        applyBalance(setArcUsdcBalance, await getUsdcBalance('arc', account))
      }
      setTxResult(result)
      setView('success')
    } catch (err) {
      if (err.code === 4001) setSendError('Transaction rejected in MetaMask.')
      else setSendError(err.message || 'Transaction failed. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const resetForm = () => {
    setView('form'); setAmount(''); setMemo(''); setShowMemo(false); setShowWalletInput(false)
    setTxResult(null); setCctpStatus(''); setCctpDoneSteps([]); setCctpActiveStep(-1); setSendError(null)
  }

  const changeTab = (tab) => {
    if (tab === activeTab) return
    setActiveTab(tab)
    setSelectedToken('USDC')
    resetForm()
  }

  const validationBalance = activeTab === 'send' ? activeBalance : chainBalance
  const afterSend = amount && parseFloat(validationBalance)
    ? (parseFloat(validationBalance) - parseFloat(amount)).toFixed(6)
    : null
  const isValidAddress = recipient && recipient.startsWith('0x') && recipient.length === 42
  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(validationBalance)
  const sameChainPicked = activeTab === 'bridge' && sourceChainKey === bridgeToKey
  const canReview = isValidAddress && isValidAmount && !switchingChain && tokenSupported && !sameChainPicked

  // Reads the chain off the transaction result itself (sourceChainKey was
  // stamped on it at creation time in arcTestnet.js) — never off live UI
  // state. That's deliberate: sourceChainKey in this component belongs to
  // the Bridge tab and keeps changing as you use it, so a Send-tab result
  // must never depend on it or its explorer link would silently drift to
  // whatever chain Bridge happens to have selected later.
  const explorerTxUrl = (hash, result) => {
    const key = result?.sourceChainKey || 'arc'
    const chain = EVM_CHAINS[key]
    return chain ? chain.explorerUrl + '/tx/' + hash : arcScanTx(hash)
  }

  const fillAmount = (val) => {
    const capped = Math.min(val, parseFloat(chainBalance) || 0)
    setAmount(capped > 0 ? capped.toString() : '')
  }

  const fromBox = (
    <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl px-4 py-3">
      <div className="flex items-center justify-between flex-wrap gap-y-1 mb-2">
        <span className="text-[10px] tracking-widest text-[#8892a0]">BRIDGE FROM</span>
        <span className="text-[10px] text-[#8892a0]">
          Balance: {chainBalance} USDC
          {parseFloat(chainBalance) > 0 && (
            <>
              <button onClick={() => setAmount((Math.max(0, parseFloat(chainBalance) || 0) * 0.5).toFixed(6))}
                className="ml-2 text-[#8892a0] hover:text-[#00D4FF] transition-colors">50%</button>
              <button onClick={() => setAmount(Math.max(0, parseFloat(chainBalance) - 0.001).toFixed(6))}
                className="ml-2 text-[#00D4FF] hover:underline">Max</button>
            </>
          )}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <button
          onClick={() => setShowFromModal(true)}
          disabled={switchingChain}
          className="flex items-center gap-1.5 bg-[#1e2530] px-3 py-1.5 rounded-lg text-sm text-white font-semibold hover:opacity-80 transition-opacity flex-shrink-0 disabled:opacity-60"
        >
          <CoinIcon symbol="USDC" size={20} />
          USDC <span className="text-[#8892a0] text-xs">⌄</span>
        </button>
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
          className="flex-1 min-w-0 bg-transparent text-white text-2xl font-bold outline-none font-['Space_Grotesk'] text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
        />
      </div>
      <p className="text-[10px] text-[#556] mt-1">{selectedChain?.icon} {selectedChain?.name}</p>
      {switchingChain && (
        <p className="mt-1.5 text-xs text-[#00D4FF] flex items-center gap-1.5">
          <LoadingSpinner size="sm" /> Switching network…
        </p>
      )}
      {switchError && <p className="mt-1.5 text-xs text-red-400">{switchError}</p>}
    </div>
  )

  const toBox = (
    <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl px-4 py-3">
      <div className="flex items-center justify-between flex-wrap gap-y-1 mb-2">
        <span className="text-[10px] tracking-widest text-[#8892a0]">BRIDGE TO</span>
        <span className="text-[10px] text-[#8892a0]">Balance: {destBalance} USDC</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setShowToModal(true)}
          className="flex items-center gap-1.5 bg-[#1e2530] px-3 py-1.5 rounded-lg text-sm text-white font-semibold hover:opacity-80 transition-opacity flex-shrink-0"
        >
          <CoinIcon symbol="USDC" size={20} />
          USDC <span className="text-[#8892a0] text-xs">⌄</span>
        </button>
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
          className="flex-1 min-w-0 bg-transparent text-white text-2xl font-bold outline-none font-['Space_Grotesk'] text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
        />
      </div>
      <p className="text-[10px] text-[#556] mt-1">{destChain?.icon} {destChain?.name}</p>
    </div>
  )

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0D1117] px-4 py-10">
        <div className="max-w-lg mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-['Space_Grotesk'] text-white">Send &amp; Bridge USDC</h1>
              <p className="text-xs text-[#8892a0] mt-0.5">Move USDC across wallets and chains.</p>
            </div>
            {account && (
              <div className="flex items-center gap-2 bg-[#0f1822] border border-[#1e2530] rounded-lg px-3 py-1.5">
                <span className="live-dot" />
                <span className="text-xs font-mono text-white">{shortAddr(account)}</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#0f1822] border border-[#1e2530] rounded-xl p-1 mb-4">
            {[
              { key: 'send', label: 'Send' },
              { key: 'bridge', label: 'Bridge' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => changeTab(t.key)}
                className={'flex-1 py-2 rounded-lg text-sm font-semibold font-[\'Space_Grotesk\'] transition-all ' + (
                  activeTab === t.key ? 'bg-[#00D4FF] text-[#0D1117]' : 'text-[#8892a0] hover:text-white'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Card className="p-6">

            {/* Only shown when MetaMask itself isn't installed — a hard
                blocker. Otherwise the forms below are always shown; the
                Navbar's own Connect Wallet button handles connecting. */}
            {!hasMetaMask && (
              <div className="text-center py-4">
                <h3 className="font-bold font-['Space_Grotesk'] mb-1.5">MetaMask required</h3>
                <p className="text-[#8892a0] text-sm mb-4">Install MetaMask to send or bridge USDC.</p>
                <a href="https://metamask.io" target="_blank" rel="noreferrer"
                  className="bg-[#e8821a] text-white font-['Space_Grotesk'] font-bold px-6 py-2.5 rounded-xl hover:opacity-90 inline-block">
                  Install MetaMask ↗
                </a>
              </div>
            )}

            {/* ── SEND FORM ─────────────────────────────────────────── */}
            {hasMetaMask && view === 'form' && activeTab === 'send' && (
              <div>
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-2">YOU SEND</p>
                <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between flex-wrap gap-y-1 mb-2">
                    <button
                      onClick={() => setShowTokenModal(true)}
                      className="flex items-center gap-1.5 text-sm text-white font-semibold hover:text-[#00D4FF] transition-colors"
                    >
                      <CoinIcon symbol={selectedToken} size={22} />
                      {selectedToken}
                      <span className="text-[#8892a0] text-xs">⌄</span>
                    </button>
                    <span className="text-[10px] text-[#8892a0]">
                      Balance: {tokenSupported ? activeBalance : '0.000000'} {selectedToken}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      disabled={!tokenSupported}
                      onChange={e => {
                        const val = parseFloat(e.target.value)
                        if (e.target.value === '' || e.target.value === '0') setAmount('')
                        else if (!isNaN(val) && val > 0) setAmount(e.target.value)
                      }}
                      min="0"
                      className="flex-1 min-w-0 bg-transparent text-white text-2xl font-bold outline-none font-['Space_Grotesk'] disabled:opacity-30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
                    />
                    {tokenSupported && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setAmount((Math.max(0, parseFloat(activeBalance) || 0) * 0.5).toFixed(6))}
                          className="text-[10px] text-[#8892a0] hover:text-[#00D4FF] transition-colors"
                        >
                          50%
                        </button>
                        <button
                          onClick={() => setAmount(Math.max(0, parseFloat(activeBalance) - 0.001).toFixed(6))}
                          className="text-[10px] text-[#00D4FF] hover:underline"
                        >
                          Max
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {!tokenSupported && (
                  <div className="mt-2.5 bg-[#1a1408] border border-[#3d2f10] rounded-lg px-3 py-2 flex items-start gap-2">
                    <span className="text-sm">🚧</span>
                    <p className="text-xs text-[#e8c374]">{selectedToken} isn't live on Arc Testnet yet — switch to USDC to send.</p>
                  </div>
                )}

                {/* Divider arrow */}
                <div className="flex justify-center -my-2.5 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-[#0f1822] border border-[#1e2530] flex items-center justify-center text-[#8892a0]">↓</div>
                </div>

                {/* Recipient */}
                <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between flex-wrap gap-y-1 mb-2">
                    <span className="text-[10px] tracking-widest text-[#8892a0]">SEND TO</span>
                    <button onClick={() => { setRecipient(account || ''); setUseOwnAddress(true) }}
                      className="text-[10px] text-[#00D4FF] hover:underline">
                      Use my address
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="0x… wallet address"
                    value={recipient}
                    onChange={e => { setRecipient(e.target.value); setUseOwnAddress(false) }}
                    className="w-full bg-transparent text-white text-sm font-mono outline-none"
                  />
                  {useOwnAddress && <p className="text-[10px] text-[#00D4FF] mt-1">✓ Sending to your own address</p>}
                  {recipient && !isValidAddress && (
                    <p className="text-[10px] text-red-400 mt-1">Must be a valid 0x address</p>
                  )}
                </div>

                {!showMemo ? (
                  <button onClick={() => setShowMemo(true)} className="text-[10px] text-[#8892a0] hover:text-[#00D4FF] mt-2">
                    + Add a note (optional)
                  </button>
                ) : (
                  <input
                    type="text"
                    placeholder="Add a note to this transaction"
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                    maxLength={100}
                    className="w-full mt-2 bg-[#0D1117] border border-[#1e2530] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00D4FF] transition-colors"
                  />
                )}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#1e2530] text-center">
                  <div>
                    <p className="text-[9px] text-[#8892a0] mb-0.5">RATE</p>
                    <p className="text-xs text-white font-semibold">1 : 1</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#8892a0] mb-0.5">EST. TIME</p>
                    <p className="text-xs text-white font-semibold">&lt; 1 sec</p>
                  </div>
                                  <div>
                    <p className="text-[9px] text-[#8892a0] mb-0.5">NETWORK FEE</p>
                    <p className="text-xs text-white font-semibold">
                      {estimatingFee && !estimatedFee
                        ? '…'
                        : estimatedFee
                          ? '~' + estimatedFee + ' USDC'
                          : '—'}
                    </p>
                  </div>
                </div>

                {afterSend !== null && tokenSupported && (
                  <div className="flex justify-between text-xs mt-3 text-[#8892a0]">
                    <span>After send</span>
                    <span className={parseFloat(afterSend) < 0 ? 'text-red-400' : 'text-white'}>{afterSend} {selectedToken}</span>
                  </div>
                )}

                <button
                  onClick={() => setView('confirm')}
                  disabled={!canReview}
                  className="w-full mt-5 bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Review &amp; Send →
                </button>
              </div>
            )}

            {/* ── BRIDGE FORM ───────────────────────────────────────── */}
            {hasMetaMask && view === 'form' && activeTab === 'bridge' && (
              <div>
                <div className="flex justify-end gap-2 mb-3">
                  <Link to="/testnet/transactions" title="History"
                    className="w-8 h-8 rounded-lg border border-[#1e2530] flex items-center justify-center text-[#8892a0] hover:text-white hover:border-[#00D4FF] transition-colors text-sm">
                    🕓
                  </Link>
                  <button
                    title="Refresh balances"
                    onClick={() => account && Promise.all([
                      getUsdcBalance(sourceChainKey, account).then(v => applyBalance(setChainBalance, v)),
                      getUsdcBalance(bridgeToKey, account).then(v => applyBalance(setDestBalance, v)),
                    ])}
                    className="w-8 h-8 rounded-lg border border-[#1e2530] flex items-center justify-center text-[#8892a0] hover:text-white hover:border-[#00D4FF] transition-colors text-sm">
                    🔄
                  </button>
                </div>

                {/* BRIDGE FROM is always top, BRIDGE TO always bottom. The
                    arrow performs a real swap — both directions genuinely
                    work, since App Kit supports Arc as either side. */}
                {fromBox}

                <div className="flex justify-center -my-2.5 relative z-10">
                  <button
                    onClick={handleSwapDirection}
                    title="Swap direction"
                    className="w-8 h-8 rounded-full bg-[#0f1822] border border-[#1e2530] flex items-center justify-center text-[#8892a0] hover:text-[#00D4FF] hover:border-[#00D4FF] active:scale-90 transition-all duration-300"
                  >
                    ↓↑
                  </button>
                </div>

                {toBox}

                {sameChainPicked && (
                  <div className="mt-2.5 bg-[#1a1408] border border-[#3d2f10] rounded-lg px-3 py-2 flex items-start gap-2">
                    <span className="text-sm">🚧</span>
                    <p className="text-xs text-[#e8c374]">Source and destination can't be the same chain.</p>
                  </div>
                )}

                {/* Receiving wallet */}
                {!showWalletInput ? (
                  <button onClick={() => setShowWalletInput(true)} className="text-[10px] text-[#8892a0] hover:text-[#00D4FF] mt-2">
                    + Add receiving wallet
                  </button>
                ) : (
                  <div className="mt-2 bg-[#0D1117] border border-[#1e2530] rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between flex-wrap gap-y-1 mb-1.5">
                      <span className="text-[10px] tracking-widest text-[#8892a0]">RECEIVING WALLET ({destChain?.name?.toUpperCase()})</span>
                      <button onClick={() => { setRecipient(account || ''); setUseOwnAddress(true) }}
                        className="text-[10px] text-[#00D4FF] hover:underline">
                        Use my address
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="0x… wallet address"
                      value={recipient}
                      onChange={e => { setRecipient(e.target.value); setUseOwnAddress(false) }}
                      className="w-full bg-transparent text-white text-sm font-mono outline-none"
                    />
                    {useOwnAddress && <p className="text-[10px] text-[#00D4FF] mt-1">✓ Sending to your own address</p>}
                    {recipient && !isValidAddress && (
                      <p className="text-[10px] text-red-400 mt-1">Must be a valid 0x address</p>
                    )}
                  </div>
                )}

                {/* Quick presets */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {AMOUNT_PRESETS.map(v => (
                    <button
                      key={v}
                      onClick={() => fillAmount(v)}
                      className="flex items-center gap-1 bg-[#0f1822] border border-[#1e2530] rounded-full px-3 py-1 text-[11px] text-white hover:border-[#00D4FF] transition-colors"
                    >
                      <CoinIcon symbol="USDC" size={14} /> {v} USDC
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#1e2530] text-center">
                  <div>
                    <p className="text-[9px] text-[#8892a0] mb-0.5">RATE</p>
                    <p className="text-xs text-white font-semibold">1 : 1</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#8892a0] mb-0.5">EST. TIME</p>
                    <p className="text-xs text-white font-semibold">~2–5 min</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#8892a0] mb-0.5">NETWORK FEE</p>
                    <p className="text-xs text-white font-semibold">
                      Gas on {selectedChain?.name?.split(' ')[0]} + {BRIDGE_FLAT_FEE_USDC} USDC
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setView('confirm')}
                  disabled={!canReview}
                  className="w-full mt-5 bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Review &amp; Bridge →
                </button>
              </div>
            )}

            {/* Confirm view */}
            {view === 'confirm' && (
              <div>
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-4">
                  {activeTab === 'bridge' ? 'BRIDGE REVIEW' : 'TRANSFER REVIEW'}
                </p>
                <div className="space-y-3 mb-5">
                  {[
                    { l: 'Route',   v: isCCTP ? selectedChain?.name + ' → ' + destChain?.name + ' (CCTP)' : 'Arc Testnet (direct)' },
                    { l: 'From',    v: shortAddr(account), mono: true },
                    { l: 'To',      v: shortAddr(recipient), mono: true },
                    { l: 'Amount',  v: amount + ' ' + (activeTab === 'send' ? selectedToken : 'USDC') },
                    ...(isCCTP ? [{ l: 'ParagonFinance Fee', v: BRIDGE_FLAT_FEE_USDC + ' USDC' }] : []),
                    { l: 'Est. Time', v: isCCTP ? '2–5 minutes' : '< 1 second', accent: true },
                    { l: 'Prompts', v: isCCTP ? '3 (approve, burn, mint)' : '1 (sign)' },
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
                      <span className="text-[#8892a0]">Note: </span>
                      <span className="text-white">{memo}</span>
                    </div>
                  )}
                </div>

                {isCCTP && (
                  <div className="flex items-center justify-between mb-5 bg-[#0D1117] border border-[#1e2530] rounded-xl px-3 py-3">
                    {CCTP_STEPS.map((s, i) => (
                      <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
                        <div className={'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ' + (
                          cctpDoneSteps.includes(s.key) ? 'bg-green-500 border-green-500 text-white' :
                          cctpActiveStep === i && sending ? 'border-[#00D4FF] text-[#00D4FF] animate-pulse' :
                          'border-[#1e2530] text-[#556]'
                        )}>
                          {cctpDoneSteps.includes(s.key) ? '✓' : i + 1}
                        </div>
                        <span className="text-[9px] text-[#8892a0] text-center">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                {cctpStatus && sending && (
                  <p className="text-xs text-[#00D4FF] mb-4 -mt-2">{cctpStatus}</p>
                )}

                {sendError && (
                  <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-3 mb-4">
                    <p className="text-xs text-red-400">{sendError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => { setView('form'); setSendError(null) }} disabled={sending}
                    className="flex-1 border border-[#1e2530] text-[#8892a0] py-3 rounded-xl hover:border-[#00D4FF] transition-all font-['Space_Grotesk'] font-semibold text-sm disabled:opacity-40">
                    Edit
                  </button>
                  <button onClick={handleSend} disabled={sending}
                    className="flex-[2] bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {sending ? (
                      <><LoadingSpinner size="sm" /> {isCCTP ? 'Bridging…' : 'Sending…'}</>
                    ) : (
                      isCCTP ? 'Confirm & Bridge →' : 'Confirm & Send →'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Success view */}
            {view === 'success' && txResult && (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                <h2 className="text-xl font-bold font-['Space_Grotesk'] mb-1">
                  {txResult.cctpBridge ? 'Bridge ' : 'Transfer '}<span className="text-green-400">confirmed</span>
                </h2>
                <p className="text-[#8892a0] text-xs mb-6">
                  {txResult.cctpBridge ? txResult.sourceChain + ' → ' + txResult.destinationChain + ' via CCTP' : 'Confirmed on Arc Testnet'}
                  {' · '}{(txResult.settlementTime / 1000).toFixed(1)}s
                </p>

                <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-4 text-left mb-5 space-y-2.5">
                  {[
                    { l: 'Amount', v: txResult.amount + ' ' + (txResult.token || 'USDC') },
                    { l: 'Gas Paid', v: txResult.gasCost },
                    ...(txResult.cctpBridge && txResult.bridgeFeePaid
                      ? [{ l: 'ParagonFinance Fee', v: txResult.bridgeFeePaid + ' USDC' }]
                      : []),
                    ...(txResult.cctpBridge && txResult.bridgeFeePaid === null
                      ? [{ l: 'ParagonFinance Fee', v: 'Not collected (retry needed)' }]
                      : []),
                    { l: 'Status', v: 'Confirmed', green: true },
                  ].map(r => (
                    <div key={r.l} className="flex justify-between border-b border-[#1e2530] pb-2 last:border-0 text-sm">
                      <span className="text-[#8892a0]">{r.l}</span>
                      <span className={'font-semibold ' + (r.green ? 'text-green-400' : 'text-white')}>{r.v}</span>
                    </div>
                  ))}
                  <div className="pt-1">
                    <p className="text-[10px] text-[#8892a0] mb-1">TX HASH</p>
                    <a href={explorerTxUrl(txResult.hash, txResult)} target="_blank" rel="noreferrer"
                      className="text-[10px] text-[#00D4FF] font-mono break-all hover:underline">
                      {txResult.hash}
                    </a>
                  </div>
                  {txResult.mintTxHash && (
                    <div>
                      <p className="text-[10px] text-[#8892a0] mb-1">MINT TX ({(txResult.destinationChain || 'ARC TESTNET').toUpperCase()})</p>
                      <a href={explorerTxUrl(txResult.mintTxHash, { sourceChainKey: txResult.destinationChainKey })} target="_blank" rel="noreferrer"
                        className="text-[10px] text-[#00D4FF] font-mono break-all hover:underline">
                        {txResult.mintTxHash}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mb-3">
                  <a href={explorerTxUrl(txResult.hash, txResult)} target="_blank" rel="noreferrer"
                    className="flex-1 border border-[#00D4FF] text-[#00D4FF] py-2.5 rounded-xl text-sm font-['Space_Grotesk'] font-bold hover:bg-[#0a2030] transition-all text-center">
                    View on Explorer ↗
                  </a>
                  <button onClick={() => navigator.clipboard.writeText(txResult.hash)}
                    className="flex-1 border border-[#1e2530] text-[#8892a0] py-2.5 rounded-xl text-sm hover:border-[#00D4FF] transition-all">
                    Copy TX Hash
                  </button>
                </div>

                <div className="flex gap-3">
                  <button onClick={resetForm}
                    className="flex-1 bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-2.5 rounded-xl text-sm hover:opacity-90">
                    {txResult.cctpBridge ? 'Bridge Another →' : 'Send Another →'}
                  </button>
                  <Link to="/testnet/transactions"
                    className="flex-1 border border-[#1e2530] text-[#8892a0] py-2.5 rounded-xl text-sm hover:border-[#00D4FF] hover:text-white transition-all text-center">
                    View History
                  </Link>
                </div>
              </div>
            )}
          </Card>

          <p className="text-center text-xs text-[#556] mt-4">
            Need testnet USDC?{' '}
            <a href={ARC_TESTNET.faucetUrl} target="_blank" rel="noreferrer" className="text-[#00D4FF] hover:underline">
              Get some from Circle's faucet →
            </a>
          </p>
        </div>
      </div>

      <TokenSelectModal
        open={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        tokens={sendTokens}
        selected={selectedToken}
        onSelect={setSelectedToken}
      />
      <NetworkTokenModal
        open={showFromModal}
        onClose={() => setShowFromModal(false)}
        title="Bridge from"
        networks={ALL_NETWORKS}
        activeKey={sourceChainKey}
        onSelect={handleChainSelect}
      />
      <NetworkTokenModal
        open={showToModal}
        onClose={() => setShowToModal(false)}
        title="Bridge to"
        networks={ALL_NETWORKS}
        activeKey={bridgeToKey}
        onSelect={setBridgeToKey}
      />
    </>
  )
}
