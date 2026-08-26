import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useArcTestnet } from '../hooks/useArcTestnet'
import { shortAddr } from '../utils/arcTestnet'

export default function Navbar() {
  const { wallet, disconnect } = useWallet()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const {
    account: arcAccount,
    balance: arcBalance,
    disconnect: arcDisconnect,
  } = useArcTestnet()

  // The app carries two connection states: WalletContext (navbar, /send,
  // /connect) and useArcTestnet (everything under /testnet). Connecting via
  // one leaves the other null, which is why the navbar kept offering
  // "Connect Wallet" while the testnet page showed a live address.
  //
  // Treating either as connected papers over that until the two are merged
  // into one source — which is the real fix, since two states for one wallet
  // will keep producing this class of bug.
  const isConnected = !!wallet || !!arcAccount
  const displayAddress = wallet?.shortAddress || (arcAccount ? shortAddr(arcAccount) : null)
  const displayBalance = wallet?.balance || arcBalance

  const links = [
    { to: '/how-it-works', label: 'How it works' },
    { to: '/countries', label: 'Countries' },
    { to: '/rates', label: 'Rates' },
    { to: '/about', label: 'About' },
    { to: '/docs', label: 'Docs' },
  ]

  const isTestnet = pathname.startsWith('/testnet')

  const handleDisconnect = () => {
    arcDisconnect()
    disconnect()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1e2530] bg-[#0D1117]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <img src="/logo.jpg" alt="Paragon Finance" className="h-9 w-9 rounded-lg object-contain flex-shrink-0" />
          <span className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold text-white truncate">Paragon </span>
          <span className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold text-[#00D4FF] -ml-1.5 truncate">Finance</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link key={l.to} to={l.to}
              className={`text-sm transition-colors ${pathname === l.to ? 'text-[#00D4FF]' : 'text-[#8892a0] hover:text-white'}`}>
              {l.label}
            </Link>
          ))}

          <Link to="/testnet"
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all font-['Space_Grotesk'] ${
              isTestnet
                ? 'bg-[#0a2030] border-[#00D4FF] text-[#00D4FF]'
                : 'border-[#00D4FF]/40 text-[#00D4FF] hover:bg-[#0a2030]'
            }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
            Testnet
          </Link>

          <span className="text-xs border border-[#1e2530] text-[#8892a0] px-3 py-1 rounded-full">
            • Built on Arc
          </span>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <div className="flex items-center gap-2 bg-[#0f1822] border border-[#1e2530] rounded-lg px-3 py-2 hover:border-[#00D4FF] transition-all">
                  <div className="live-dot" />
                  <span className="text-xs font-mono text-white">{displayAddress}</span>
                  <span className="text-xs text-[#00D4FF] font-semibold">{displayBalance} USDC</span>
                </div>
              </Link>
              <button onClick={handleDisconnect}
                className="text-xs text-[#8892a0] hover:text-red-400 transition-colors">
                Disconnect
              </button>
            </div>
          ) : (
            <Link to="/connect"
              className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm px-5 py-2 rounded-lg hover:opacity-90 transition-all hover:-translate-y-0.5">
              Connect Wallet
            </Link>
          )}
        </div>

        {/* Mobile: chain pill + connect + hamburger.
            Connecting is the primary action on a landing page, so on mobile it
            belongs in the persistent top bar rather than two taps deep behind
            the menu — which is where it used to live. */}
        <div className="flex md:hidden items-center gap-2 flex-shrink-0">

          {/* Chain indicator. Doubles as a link to the testnet section, and
              lights up when you're already in it. */}
       

          {isConnected ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 bg-[#0f1822] border border-[#1e2530] rounded-full px-2.5 py-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-xs font-mono text-white">{displayAddress}</span>
            </Link>
          ) : (
            <Link
              to="/connect"
              className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-xs px-4 py-2 rounded-full hover:opacity-90 transition-all"
            >
              Connect
            </Link>
          )}

          <button
            className="text-[#8892a0] p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <div className="space-y-1.5">
              <span className="block w-5 h-0.5 bg-current" />
              <span className="block w-5 h-0.5 bg-current" />
              <span className="block w-5 h-0.5 bg-current" />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0f1822] border-t border-[#1e2530] px-6 py-4 flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2.5 mb-2" onClick={() => setMenuOpen(false)}>
            <img src="/logo.jpg" alt="Paragon Finance" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-['Space_Grotesk'] text-lg font-bold text-white">Paragon</span>
            <span className="font-['Space_Grotesk'] text-lg font-bold text-[#00D4FF] -ml-1.5">Finance</span>
          </Link>

          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm text-[#8892a0] hover:text-white" onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}

          <span className="flex items-center gap-1.5 text-sm text-[#556] cursor-not-allowed">
            Create USD Account
            <span className="text-[9px] border border-[#2a3340] text-[#00D4FF] px-1.5 py-0.5 rounded-full">Soon</span>
          </span>

          <Link to="/testnet" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-1.5 text-sm text-[#00D4FF] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
            Testnet
          </Link>

          {/* No Connect button here — it lives in the top bar on mobile now.
              A connected wallet still shows its details and a disconnect,
              since neither fits in the pill. */}
          {isConnected && (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 bg-[#0D1117] border border-[#1e2530] rounded-lg px-3 py-2.5">
                <div className="live-dot" />
                <span className="text-xs font-mono text-white">{displayAddress}</span>
                <span className="text-xs text-[#00D4FF] font-semibold ml-auto">{displayBalance} USDC</span>
              </Link>
              <button onClick={handleDisconnect}
                className="text-sm text-[#8892a0] hover:text-red-400 transition-colors text-left">
                Disconnect
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}