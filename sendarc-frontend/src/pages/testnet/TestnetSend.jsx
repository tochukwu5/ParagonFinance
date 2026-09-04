import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useArcTestnet } from '../../hooks/useArcTestnet'
import { useTestnet } from '../../context/TestnetContext'
import {
  ARC_TESTNET, EVM_CHAINS, shortAddr, arcScanTx,
  switchToChain, sendUsdcOnChain, getUsdcBalance,
  getEurcBalance, sendEurcOnArc, getCirbtcBalance, sendCirbtcOnArc,
  bridgeUsdcViaAppKit, estimateSendPaymentGasCost,
  BRIDGE_FLAT_FEE_USDC, BRIDGE_FEE_RECIPIENT
} from '../../utils/arcTestnet'
import { Card, LoadingSpinner } from '../../components/UI'
import Navbar from '../../components/Navbar'
import TokenSelectModal from '../../components/TokenSelectModal'
import { CoinIcon } from '../../components/CoinLogos'
import NetworkTokenModal from '../../components/NetworkTokenModal'
import SwapTab from './SwapTab'
import PartnerCards from '../../components/PartnerCards'

// ─── Chain icons ───────────────────────────────────────────────────────────
// EVM_CHAINS.icon is either an emoji ('⬡') or an image path ('/ethlogo.svg').
// Both are strings, so React renders either as text unless we branch on which
// kind it is and wrap image paths in an <img>.
function isImageIcon(icon) {
  if (typeof icon !== 'string') return false
  return (
    icon.startsWith('/') ||
    icon.startsWith('http') ||
    icon.startsWith('data:') ||
    /\.(svg|png|jpe?g|webp|gif)$/i.test(icon)
  )
}

function ChainIcon({ chain, size = 16, className = '' }) {
  if (!chain) return null
  const { icon, name } = chain

  if (isImageIcon(icon)) {
    return (
      <img
        src={icon}
        alt={name || 'chain'}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={'inline-block object-contain rounded-full shrink-0 ' + className}
      />
    )
  }

  return (
    <span
      style={{ fontSize: size, lineHeight: 1 }}
      className={'inline-block shrink-0 ' + className}
      aria-hidden="true"
    >
      {icon}
    </span>
  )
}

const ChevronDown = ({ className = 'w-4 h-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
)

// CCTP flow steps shown while a bridge transaction is in flight
const CCTP_STEPS = [
  { key: 'approve', label: 'Approve' },
  { key: 'burn',     label: 'Burn' },
  { key: 'attest',   label: 'Attest' },
  { key: 'mint',     label: 'Mint' },
]

const ALL_NETWORKS = Object.keys(EVM_CHAINS).map(key => ({
  key,
  name: EVM_CHAINS[key].name,
  icon: EVM_CHAINS[key].icon,
  iconNode: <ChainIcon chain={EVM_CHAINS[key]} size={20} />,
  usdcAddress: EVM_CHAINS[key].usdcAddress,
  enabled: true,
}))

const AMOUNT_PRESETS = [1, 5, 10]

// How long a same-chain selection must persist before it's treated as a real
// mistake worth warning about. Anything shorter than this is almost certainly
// a transient state mid-swap, not something the user did.
const SAME_CHAIN_WARNING_DELAY_MS = 300

export default function TestnetSend() {
  const {
    account, balance: arcBalance, isConnected,
    connect, isLoading, error, hasMetaMask, refreshBalance
  } = useArcTestnet()
  const { recordTransaction, loadTransactions } = useTestnet()

  const [activeTab, setActiveTab] = useState('bridge') // 'bridge' | 'send' | 'swap'
  const [view, setView] = useState('form')            // 'form' | 'confirm' | 'success'

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

  const [estimatedFee, setEstimatedFee] = useState(null)
  const [estimatingFee, setEstimatingFee] = useState(false)

  const [cctpStatus, setCctpStatus] = useState('')
  const [cctpActiveStep, setCctpActiveStep] = useState(-1)
  const [cctpDoneSteps, setCctpDoneSteps] = useState([])
  
  // Phantom sits alongside the EVM wallet rather than replacing it — a Solana
  // bridge needs both: Phantom signs the burn, MetaMask receives on the
  // destination.
  const [solanaAddress, setSolanaAddress] = useState(null)
  const [connectingSolana, setConnectingSolana] = useState(false)

  // Only the SOURCE chain's wallet signs the burn. Bridging TO Solana needs
  // nothing but a destination address — requiring Phantom there forces an
  // extension on someone who is only receiving.
    const needsSolana = sourceChainKey === 'solana' || bridgeToKey === 'solana'

  const handleConnectSolana = async () => {
    setConnectingSolana(true)
    try {
      const { connectSolanaWallet } = await import('../../utils/solanaBridge')
      setSolanaAddress(await connectSolanaWallet())
    } catch (err) {
      setSwitchError(err.message || 'Could not connect Solana wallet')
    } finally {
      setConnectingSolana(false)
    }
  }
  const [strandedBridge, setStrandedBridge] = useState(null)
  const [missingGas, setMissingGas] = useState(null)

  const [showSameChainWarning, setShowSameChainWarning] = useState(false)

  const selectedChain = EVM_CHAINS[sourceChainKey]
  const destChain = EVM_CHAINS[bridgeToKey]
  const isCCTP = activeTab === 'bridge'
  const tokenSupported = selectedToken === 'USDC' || selectedToken === 'EURC' || selectedToken === 'cirBTC'
  const activeBalance = selectedToken === 'EURC' ? eurcBalance : selectedToken === 'cirBTC' ? cirbtcBalance : arcUsdcBalance

  const sameChainPicked = activeTab === 'bridge' && sourceChainKey === bridgeToKey

  const sendTokens = [
    { symbol: 'USDC',   name: 'USD Coin',       balance: arcUsdcBalance, enabled: true },
    { symbol: 'EURC',   name: 'Euro Coin',      balance: eurcBalance,   enabled: true },
    { symbol: 'cirBTC', name: 'Circle Bitcoin', balance: cirbtcBalance, enabled: true },
  ]

  const applyBalance = (setter, value) => { if (value !== null && value !== undefined) setter(value) }

  // Only surface the same-chain warning once the condition has held for
  // SAME_CHAIN_WARNING_DELAY_MS. Clearing is immediate — the moment the
  // chains differ the warning should go, with no lag.
  useEffect(() => {
    if (!sameChainPicked) {
      setShowSameChainWarning(false)
      return
    }
    const timer = setTimeout(() => setShowSameChainWarning(true), SAME_CHAIN_WARNING_DELAY_MS)
    return () => clearTimeout(timer)
  }, [sameChainPicked])

  const handleChainSelect = async (chainKey) => {
    if (chainKey === sourceChainKey) return

    // If the user picks the chain already set as the destination, swap rather
    // than creating an invalid pair — that's what they almost certainly meant.
    if (chainKey === bridgeToKey) {
      handleSwapDirection()
      return
    }

    setSwitchingChain(true)
    setSwitchError(null)
    setAmount('')
       try {
      // MetaMask can't switch to Solana — it isn't an EVM chain. The Solana
      // wallet connects separately, so there's no network switch to make.
      if (!EVM_CHAINS[chainKey]?.isSolana) {
        await switchToChain(chainKey)
      }
      setSourceChainKey(chainKey)
      if (account) applyBalance(setChainBalance, await getUsdcBalance(chainKey, account))
    } catch (err) {
      setSwitchError(err.message || 'Could not switch network')
    } finally {
      setSwitchingChain(false)
    }
  }

  const handleSwapDirection = async () => {
    const newSource = bridgeToKey
    const newDest = sourceChainKey

    // Both keys move in the same render pass, so the pair is never
    // momentarily equal. React batches these — the old version awaited a
    // MetaMask switch between them, which is what let the collision through.
    setSourceChainKey(newSource)
    setBridgeToKey(newDest)
    setAmount('')

    // Swap the cached balances too, so each box shows its own chain's number
    // immediately instead of briefly displaying the other's.
    setChainBalance(destBalance)
    setDestBalance(chainBalance)

    // The wallet switch happens after the UI is already consistent. A failure
    // here is recoverable — the bridge itself will prompt for the right
    // network — so it doesn't roll back the swap.
    setSwitchingChain(true)
    setSwitchError(null)
    try {
      // Solana isn't EVM — wallet_switchEthereumChain needs a chainId, and
      // Solana's is null. The Solana wallet connects separately, so there's
      // no network switch to make. Same guard as handleChainSelect.
      if (!EVM_CHAINS[newSource]?.isSolana) {
        await switchToChain(newSource)
      }
      if (account) {
        applyBalance(setChainBalance, await getUsdcBalance(newSource, account))
        applyBalance(setDestBalance, await getUsdcBalance(newDest, account))
      }
    } catch (err) {
      setSwitchError(err.message || 'Could not switch network')
    } finally {
      setSwitchingChain(false)
    }
  }

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

  useEffect(() => {
    setMissingGas(null)
    setStrandedBridge(null)
    setSendError(null)
  }, [sourceChainKey, bridgeToKey, activeTab])

  useEffect(() => {
    if (!account) return
    getUsdcBalance('arc', account).then(v => applyBalance(setArcUsdcBalance, v))
  }, [account])

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

  useEffect(() => {
     if (activeTab === 'bridge' && !showWalletInput) {
      // Bridging to Solana means the recipient must be a Solana address.
      // Defaulting to the EVM account would burn USDC and mint to an
      // address nobody controls.
      const target = bridgeToKey === 'solana' ? solanaAddress : account
      if (target) {
        setRecipient(target)
        setUseOwnAddress(true)
      }
    }
   }, [activeTab, account, showWalletInput, bridgeToKey, solanaAddress])

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
        // The ParagonFinance fee rides inside the bridge via App Kit's
        // customFee — charged in USDC on the source chain, settled atomically.
        result = await bridgeUsdcViaAppKit(
          {
            fromChainKey: sourceChainKey,
            toChainKey: bridgeToKey,
            from: account,
            to: recipient,
            amount,
            feeUsdc: BRIDGE_FLAT_FEE_USDC,
            feeRecipient: BRIDGE_FEE_RECIPIENT,
          },
          handleStatusUpdate
        )

      } else {
        result = await sendUsdcOnChain('arc', { to: recipient, amount }, handleStatusUpdate)
      }

      await recordTransaction(result, account)
      await loadTransactions(account)

      if (selectedToken === 'EURC') {
        applyBalance(setEurcBalance, await getEurcBalance(account))
      } else if (selectedToken === 'cirBTC') {
        applyBalance(setCirbtcBalance, await getCirbtcBalance(account))
      } else if (activeTab === 'bridge') {
        applyBalance(setChainBalance, await getUsdcBalance(sourceChainKey, account))
        applyBalance(setDestBalance, await getUsdcBalance(bridgeToKey, account))
        refreshBalance()
        applyBalance(setArcUsdcBalance, await getUsdcBalance('arc', account))
      } else {
        refreshBalance()
        applyBalance(setArcUsdcBalance, await getUsdcBalance('arc', account))
      }

      setTxResult(result)
      setView('success')
     } catch (err) {
      if (err.preflightBlocked) {
        setMissingGas({ token: err.missingGasToken, chain: err.missingGasChain })
        setSendError(null)
      } else if (err.code === 4001) {
        setSendError('Transaction rejected in MetaMask.')
      } else {
        setSendError(err.message || 'Transaction failed. Please try again.')
      }

      if (err.recoverable) {
        setStrandedBridge({
          burnHash: err.burnHash,
          sourceChainKey: err.sourceChainKey || sourceChainKey,
          destinationChainKey: err.destinationChainKey || bridgeToKey,
          amount: err.pendingAmount || parseFloat(amount),
        })
      }
    } finally {
      setSending(false)
    }
  }

  const resetForm = () => {
    setView('form'); setAmount(''); setMemo(''); setShowMemo(false); setShowWalletInput(false)
        setTxResult(null); setCctpStatus(''); setCctpDoneSteps([]); setCctpActiveStep(-1)
    setSendError(null); setStrandedBridge(null); setMissingGas(null)
  }

  const changeTab = (tab) => {
    if (tab === activeTab) return
    setActiveTab(tab)
    setSelectedToken('USDC')
    resetForm()
  }

  const validationBalance = activeTab === 'send' ? activeBalance : chainBalance

  const totalDebit = amount
    ? parseFloat(amount) + (isCCTP ? BRIDGE_FLAT_FEE_USDC : 0)
    : null

  const afterSend = totalDebit !== null && parseFloat(validationBalance)
    ? (parseFloat(validationBalance) - totalDebit).toFixed(6)
    : null


      // Solana addresses are base58 with no 0x prefix, so the EVM check rejects
  // every valid one.
  const isValidAddress = bridgeToKey === 'solana'
    ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(recipient || '')
    : recipient && recipient.startsWith('0x') && recipient.length === 42
    
    const isValidAmount = amount && parseFloat(amount) > 0 && totalDebit <= parseFloat(validationBalance)

  // Gating uses the RAW comparison, not the delayed warning state — an
  // invalid bridge must never be startable, not even for 300ms.
  const canReview = isValidAddress && isValidAmount && !switchingChain && tokenSupported && !sameChainPicked && (!needsSolana || !!solanaAddress)

  const explorerTxUrl = (hash, result) => {
    const key = result?.sourceChainKey || 'arc'
    const chain = EVM_CHAINS[key]
    return chain ? chain.explorerUrl + '/tx/' + hash : arcScanTx(hash)
  }

  const fillAmount = (val) => {
    const max = Math.max(0, (parseFloat(chainBalance) || 0) - BRIDGE_FLAT_FEE_USDC)
    const capped = Math.min(val, max)
    setAmount(capped > 0 ? capped.toString() : '')
  }

  const fromBox = (
    <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl px-4 py-3">
      <div className="flex items-center justify-between flex-wrap gap-y-1 mb-2">
        <span className="text-[10px] tracking-widest text-[#8892a0]">BRIDGE FROM</span>
        <span className="text-[10px] text-[#8892a0]">
          Balance: {chainBalance} USDC
          {parseFloat(chainBalance) > BRIDGE_FLAT_FEE_USDC && (
            <>
              <button
                onClick={() => setAmount(Math.max(0, ((parseFloat(chainBalance) || 0) - BRIDGE_FLAT_FEE_USDC) * 0.5).toFixed(6))}
                className="ml-2 text-[#8892a0] hover:text-[#00D4FF] transition-colors">50%</button>
              <button
                onClick={() => setAmount(Math.max(0, (parseFloat(chainBalance) || 0) - BRIDGE_FLAT_FEE_USDC - 0.001).toFixed(6))}
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
          USDC <ChevronDown className="w-4 h-4 text-[#8892a0]" />
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
      <p className="flex items-center gap-1.5 text-[10px] text-[#ccccd6] mt-1.5">
        <ChainIcon chain={selectedChain} size={14} />
        {selectedChain?.name}
      </p>
      {/* {switchingChain && (
        <p className="mt-1.5 text-xs text-[#00D4FF] flex items-center gap-1.5">
          <LoadingSpinner size="sm" /> Switching network…
        </p>
      )} */}
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
          USDC <ChevronDown className="w-4 h-4 text-[#8892a0]" />
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
      <p className="flex items-center gap-1.5 text-[10px] text-[#ccccd6] mt-1.5">
        <ChainIcon chain={destChain} size={14} />
        {destChain?.name}
      </p>
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
              <h1 className="text-lg sm:text-xl font-bold font-['Space_Grotesk'] text-white">Bridge, Send &amp; Swap USDC</h1>
              <p className="text-xs text-[#8892a0] mt-0.5">Move USDC across wallets and chains.</p>
            </div>
            {account && (
              <div className="flex items-center gap-2 bg-[#0f1822] border border-[#1e2530] rounded-lg px-3 py-1.5">
                {/* <span className="live-dot" /> */}
                <span className="text-xs font-mono text-white">{shortAddr(account)}</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#0f1822] border border-[#1e2530] rounded-xl p-1 mb-4">
            {[
              { key: 'bridge', label: 'Bridge' },
              { key: 'send', label: 'Send' },
              { key: 'swap', label: 'Swap' },
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
                      <ChevronDown className="w-4 h-4 text-[#8892a0]" />
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

                <div className="flex justify-center -my-2.5 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-[#0f1822] border border-[#1e2530] flex items-center justify-center text-[#8892a0]">↓</div>
                </div>

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
                  <button onClick={() => setShowMemo(true)} className="text-[10px] text-[#ccccd6] hover:text-[#00D4FF] mt-2 pl-4">
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
                      getUsdcBalance('arc', account).then(v => applyBalance(setArcUsdcBalance, v)),
                    ])}
                    className="w-8 h-8 rounded-lg border border-[#1e2530] flex items-center justify-center text-[#8892a0] hover:text-white hover:border-[#00D4FF] transition-colors text-sm">
                    🔄
                  </button>
                </div>

                {fromBox}

                <div className="flex justify-center -my-2.5 relative z-10">
                <button
                 onClick={handleSwapDirection}
                    disabled={switchingChain}
                 title="Swap direction" class="w-8 h-8 rounded-full bg-[#0f1822] border border-[#1e2530]
                 flex items-center justify-center text-[#8892a0] hover:text-[#00D4FF] hover:border-[#00D4FF] hover:rotate-[360deg] active:scale-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  ↓↑</button>
                </div>

                {toBox}

                                {needsSolana && (
                  <div className="mt-2.5 bg-[#0f1822] border border-[#1e2530] rounded-xl px-4 py-3">
                    {solanaAddress ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-xs text-[#8892a0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
                          Phantom connected
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-white">
                            {solanaAddress.slice(0, 4)}…{solanaAddress.slice(-4)}
                          </span>
                          <button
                            onClick={() => setSolanaAddress(null)}
                            className="text-[10px] text-[#8892a0] hover:text-red-400 transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-[#8892a0] mb-2.5 leading-relaxed">
                          Connect Phantom so we can deliver to your Solana wallet.
                          Your EVM wallet signs the transaction — Phantom won't be asked to.
                        </p>
                        <button
                          onClick={handleConnectSolana}
                          disabled={connectingSolana}
                          className="w-full bg-[#14F195] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {connectingSolana ? 'Connecting…' : 'Connect Phantom'}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Delayed by SAME_CHAIN_WARNING_DELAY_MS so a swap in progress
                    doesn't flash a warning for something the user didn't do. */}
                {showSameChainWarning && (
                  <div className="mt-2.5 bg-[#1a1408] border border-[#3d2f10] rounded-lg px-3 py-2 flex items-start gap-2">
                    <span className="text-sm">🚧</span>
                    <p className="text-xs text-[#e8c374]">Source and destination can't be the same chain.</p>
                  </div>
                )}

                {!showWalletInput ? (
                  <button onClick={() => setShowWalletInput(true)} className="text-[10px] text-[#ccccd6] hover:text-[#00D4FF] mt-2 pl-4">
                 + Add {bridgeToKey === 'solana' ? 'Solana' : 'EVM'} receiving wallet
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
                       placeholder={bridgeToKey === 'solana' ? 'Enter Solana address…' : '0x…'}
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
                    <p className="text-[9px] text-[#8892a0] mb-0.5">PARAGON FEE</p>
                    <p className="text-xs text-white font-semibold">{BRIDGE_FLAT_FEE_USDC} USDC</p>
                  </div>
                </div>

                {amount && parseFloat(amount) > 0 && (
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between text-[#8892a0]">
                      <span>Recipient receives</span>
                      <span className="text-white font-semibold">{parseFloat(amount).toFixed(2)} USDC</span>
                    </div>
                    <div className="flex justify-between text-[#8892a0]">
                      <span>Total debited</span>
                      <span className="text-white font-semibold">{totalDebit.toFixed(2)} USDC</span>
                    </div>
                    {afterSend !== null && (
                      <div className="flex justify-between text-[#8892a0]">
                        <span>Balance after</span>
                        <span className={parseFloat(afterSend) < 0 ? 'text-red-400' : 'text-white'}>{afterSend} USDC</span>
                      </div>
                    )}
                  </div>
                )}

                               <button
                  onClick={() => setView('confirm')}
                  disabled={!canReview}
                  className="w-full mt-5 bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {!isValidAddress && bridgeToKey === 'solana'
                    ? 'Enter Solana Address'
                    : !isValidAddress
                      ? 'Enter EVM Address'
                      : 'Review & Bridge →'}
                </button>
              </div>
            )}

            {/* Swap runs its own form/confirm/success cycle internally, so it
                sits outside the shared `view` state the other two tabs use. */}
            {hasMetaMask && activeTab === 'swap' && (
              <SwapTab
                account={account}
                provider={typeof window !== 'undefined' ? window.ethereum : null}
                onRecordTransaction={recordTransaction}
              />
            )}

            {/* Confirm view */}
            {view === 'confirm' && activeTab !== 'swap' && (
              <div>
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-4">
                  {activeTab === 'bridge' ? 'BRIDGE REVIEW' : 'TRANSFER REVIEW'}
                </p>

                {isCCTP && (
                  <div className="flex items-center justify-center gap-3 mb-4 pb-4 border-b border-[#1e2530]">
                    <span className="flex items-center gap-1.5 text-sm text-white font-semibold">
                      <ChainIcon chain={selectedChain} size={18} />
                      {selectedChain?.name}
                    </span>
                    <span className="text-[#00D4FF]">→</span>
                    <span className="flex items-center gap-1.5 text-sm text-white font-semibold">
                      <ChainIcon chain={destChain} size={18} />
                      {destChain?.name}
                    </span>
                  </div>
                )}

                <div className="space-y-3 mb-5">
                  {[
                    { l: 'From',    v: shortAddr(account), mono: true },
                    { l: 'To',      v: shortAddr(recipient), mono: true },
                    { l: 'Recipient receives', v: amount + ' ' + (activeTab === 'send' ? selectedToken : 'USDC') },
                    ...(isCCTP ? [{ l: 'ParagonFinance Fee', v: BRIDGE_FLAT_FEE_USDC + ' USDC' }] : []),
                    ...(isCCTP && totalDebit ? [{ l: 'Total debited', v: totalDebit.toFixed(2) + ' USDC' }] : []),
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
                  <div className="bg-[#0a1520] border border-[#00D4FF]/20 rounded-xl px-3 py-2.5 mb-4">
                    <p className="text-[11px] text-[#8892a0] leading-relaxed">
                      The {BRIDGE_FLAT_FEE_USDC} USDC fee is collected as part of the bridge itself,
                      in USDC on {selectedChain?.name}. If the bridge doesn't complete, no fee is taken.
                    </p>
                  </div>
                )}

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

               {missingGas ? (
                  <div className="bg-[#1a1408] border border-[#3d2f10] rounded-xl p-3 mb-4">
                    <p className="text-xs text-[#e8c374]">
                      You need <strong>{missingGas.token}</strong> on {missingGas.chain} to
                      receive this bridge —{' '}
                      <a href="https://faucet.circle.com" target="_blank" rel="noreferrer"
                        className="text-[#00D4FF] underline">
                        get some from the faucet →
                      </a>
                    </p>
                  </div>
                ) : strandedBridge ? (
                  <div className="bg-[#1a1408] border border-[#3d2f10] rounded-xl p-3.5 mb-4">
                    <p className="text-xs text-[#e8c374] font-semibold mb-1.5">
                      Your USDC is safe and recoverable
                    </p>
                    <p className="text-[11px] text-[#e8c374] leading-relaxed mb-2.5">
                      {strandedBridge.amount} USDC was burned on{' '}
                      {EVM_CHAINS[strandedBridge.sourceChainKey]?.name} but has not minted on{' '}
                      {EVM_CHAINS[strandedBridge.destinationChainKey]?.name} yet. Circle holds a
                      signed attestation authorising the mint and it does not expire. Fund your
                      wallet with{' '}
                      <strong>{EVM_CHAINS[strandedBridge.destinationChainKey]?.nativeCurrency?.symbol}</strong>{' '}
                      on {EVM_CHAINS[strandedBridge.destinationChainKey]?.name}, then run this same
                      bridge again to complete it.
                    </p>
                    
                     <a href={
                        (EVM_CHAINS[strandedBridge.sourceChainKey]?.explorerUrl || '') +
                        '/tx/' + strandedBridge.burnHash
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-[#00D4FF] font-mono break-all hover:underline"
                    >
                      Burn tx: {strandedBridge.burnHash} ↗
                    </a>
                  </div>
                ) : sendError ? (
                  <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-3 mb-4">
                    <p className="text-xs text-red-400">{sendError}</p>
                  </div>
                ) : null}
                   <div className="flex gap-3">
                  <button onClick={() => {
                    setView('form')
                    setSendError(null)
                    setMissingGas(null)
                    setStrandedBridge(null)
                  }} disabled={sending}
                    className="flex-1 border border-[#1e2530] text-[#8892a0] py-3 rounded-xl hover:border-[#00D4FF] transition-all font-['Space_Grotesk'] font-semibold text-sm disabled:opacity-40">
                    Edit
                  </button>
                  <button onClick={handleSend} disabled={sending || !!missingGas}
                    className="flex-[2] bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
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
            {view === 'success' && txResult && activeTab !== 'swap' && (
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
                    ...(txResult.bridgeFeePaid
                      ? [{ l: 'ParagonFinance Fee', v: txResult.bridgeFeePaid + ' USDC' }]
                      : []),
                    ...(txResult.grossAmount
                      ? [{ l: 'Total debited', v: txResult.grossAmount.toFixed(2) + ' USDC' }]
                      : []),
                    ...(!txResult.cctpBridge
                      ? [{ l: 'Gas Paid', v: (txResult.gasCost || '0') + ' USDC' }]
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
        <PartnerCards />
    </>
  )
}