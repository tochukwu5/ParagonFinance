import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import MetaMaskIcon from '../assets/wallets/metamask.svg'
import RabbyIcon from '../assets/wallets/rabby.svg'
import CoinbaseIcon from '../assets/wallets/coinbase.svg'
import WalletConnectIcon from '../assets/wallets/walletconnect.svg'

// Wallet groups — matches the reference design's "Recommended" / "Other wallets" layout
const WALLET_GROUPS = [
  {
    label: 'Recommended',
    wallets: [
      { id: 'metamask', name: 'MetaMask', icon: MetaMaskIcon, available: true },
      { id: 'rabby', name: 'Rabby Wallet', icon: RabbyIcon, available: false },
      { id: 'coinbase', name: 'Coinbase Wallet', icon: CoinbaseIcon, available: false },
    ],
  },
  {
    label: 'Other wallets',
    wallets: [
      { id: 'walletconnect', name: 'WalletConnect', icon: WalletConnectIcon, available: false },
    ],
  },
]

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

// Register the wallet in MongoDB on first connect
async function registerWallet(address) {
  try {
    await fetch(API_BASE + '/testnet/wallet/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address.toLowerCase() }),
    })
  } catch {
    console.warn('Wallet pre-registration skipped (will be created on first tx)')
  }
}

export default function ConnectWallet() {
  const { connect, isConnected, wallet } = useWallet()
  const navigate = useNavigate()
  const [connecting, setConnecting] = useState(null)
  const [error, setError] = useState(null)
  const [step, setStep] = useState('idle') // idle | waiting | switching | success

  if (isConnected && wallet) {
    return <Navigate to="/testnet/send" replace />
  }

  const handleConnect = async (walletId) => {
    const allWallets = WALLET_GROUPS.flatMap(g => g.wallets)
    if (!allWallets.find(w => w.id === walletId)?.available) return

    setConnecting(walletId)
    setError(null)
    setStep('waiting')

    try {
      const address = await connect(walletId)
      setStep('switching')
      await registerWallet(address)
      setStep('success')
      await new Promise(r => setTimeout(r, 600))
      navigate('/testnet/send')
    } catch (err) {
      setError(err.message || 'Connection failed. Please try again.')
      setConnecting(null)
      setStep('idle')
    }
  }

  const stepLabel = {
    idle: null,
    waiting: 'Waiting for MetaMask approval...',
    switching: 'Switching to Arc Testnet...',
    success: '✓ Connected! Redirecting...',
  }

  return (
    <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[600px] bg-[#00D4FF] opacity-[0.04] blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10">

        {/* Modal-style two-panel card */}
        <div className="bg-[#0c1119] border border-[#1c232e] rounded-2xl overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-7 pb-5">
            <h1 className="text-xl font-bold font-['Space_Grotesk'] text-white">Connect a Wallet</h1>
            <a
              href="/"
              className="w-8 h-8 rounded-full bg-[#161d28] flex items-center justify-center text-[#8892a0] hover:text-white hover:bg-[#1c232e] transition-all text-base"
            >
              ✕
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* LEFT — Wallet list */}
            <div className="px-8 pb-8">
              {WALLET_GROUPS.map(group => (
                <div key={group.label} className="mb-6 last:mb-0">
                  <p className="text-[13px] text-[#5b6573] font-medium mb-3">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.wallets.map(w => {
                      const isThisConnecting = connecting === w.id
                      const isDone = step === 'success' && isThisConnecting

                      return (
                        <button
                          key={w.id}
                          onClick={() => handleConnect(w.id)}
                          disabled={!!connecting || !w.available}
                          className={
                            'w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all text-left relative ' +
                            (isDone
                              ? 'bg-green-900/10'
                              : isThisConnecting
                              ? 'bg-[#101a26]'
                              : w.available
                              ? 'hover:bg-[#11161f]'
                              : 'opacity-40 cursor-not-allowed')
                          }
                        >
                          <img
                            src={w.icon}
                            alt={w.name}
                            className="w-7 h-7 rounded-lg flex-shrink-0"
                          />
                          <span className="flex-1 font-semibold text-[15px] text-white">
                            {w.name}
                          </span>

                          {isDone ? (
                            <span className="text-green-400 text-base font-bold">✓</span>
                          ) : isThisConnecting ? (
                            <div className="w-4 h-4 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {step !== 'idle' && (
                <div className={
                  'mt-2 text-center text-xs py-2.5 px-4 rounded-lg border ' +
                  (step === 'success'
                    ? 'text-green-400 bg-green-900/20 border-green-500/30'
                    : 'text-[#00D4FF] bg-[#00D4FF]/5 border-[#00D4FF]/20')
                }>
                  {stepLabel[step]}
                </div>
              )}
              {error && (
                <div className="mt-2 text-center text-red-400 text-xs py-2.5 px-4 rounded-lg bg-red-900/20 border border-red-500/30">
                  {error}
                </div>
              )}
            </div>

            {/* RIGHT — Education panel */}
            <div className="px-8 pb-8 md:border-l border-[#1c232e] flex flex-col">
              <h2 className="text-lg font-bold font-['Space_Grotesk'] text-white text-center mb-7">
                What is a Wallet?
              </h2>

              <div className="space-y-6 flex-1">
                <div className="flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1a2540] to-[#0d1420] flex items-center justify-center flex-shrink-0">
                    <img src={MetaMaskIcon} alt="MetaMask" className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-white mb-1">A Home for your Digital Assets</p>
                    <p className="text-[13px] text-[#8892a0] leading-relaxed">
                      Wallets are used to send, receive, store, and display digital assets like USDC and crypto.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2a1a40] to-[#15101f] flex items-center justify-center flex-shrink-0 text-xl">
                    🔑
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-white mb-1">A New Way to Log In</p>
                    <p className="text-[13px] text-[#8892a0] leading-relaxed">
                      Instead of creating new accounts and passwords on every website, just connect your wallet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 mt-8">
                <a
                  href="https://metamask.io"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-center bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm py-3 rounded-full hover:opacity-90 transition-all"
                >
                  Get a Wallet
                </a>
                <a
                  href="https://ethereum.org/en/wallets/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] text-[#00D4FF] hover:underline"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[#556] text-xs mt-6">
          Powered by Arc Network · USDC native gas · EVM compatible
        </p>
      </div>
    </div>
  )
}