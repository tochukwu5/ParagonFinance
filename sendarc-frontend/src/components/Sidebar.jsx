import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useArcTestnet } from '../hooks/useArcTestnet'
import { shortAddr } from '../utils/arcTestnet'

// Inline SVGs rather than an icon package — eight icons doesn't justify a
// dependency, and these inherit currentColor so the active state works
// without per-icon overrides.
const Icon = {
  home: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  ),
  dashboard: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  transactions: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 7h13M14 4l3 3-3 3" /><path d="M20 17H7M10 20l-3-3 3-3" />
    </svg>
  ),
  wallet: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3" />
      <path d="M20 9v6h-4a3 3 0 0 1 0-6h4z" />
    </svg>
  ),
  bell: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),
  howItWorks: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  countries: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
    </svg>
  ),
  rates: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="15 7 21 7 21 13" />
    </svg>
  ),
  about: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  ),
  docs: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  testnet: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  settings: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </svg>
  ),
  menu: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  ),
}

const MENU = [
  { to: '/',             label: 'Home',         icon: 'home' },
  { to: '/dashboard',    label: 'Dashboard',    icon: 'dashboard' },
  { to: '/testnet', label: 'Testnet', icon: 'testnet' },
  { to: '/how-it-works', label: 'How it works', icon: 'howItWorks' },
  { to: '/about',        label: 'About',        icon: 'about' },
  { to: '/docs',         label: 'Docs',         icon: 'docs' },
]

// Everything that belongs to the connected wallet rather than the site.
// Notifications joins them — it was the odd one left in MENU otherwise,
// and it's account state like the rest.
const ACCOUNT = [
  { to: '/dashboard/transactions',  label: 'Transactions',  icon: 'transactions' },
  { to: '/dashboard/wallet',        label: 'Wallet',        icon: 'wallet' },
  { to: '/dashboard/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/dashboard/settings',      label: 'Settings',      icon: 'settings' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { wallet, disconnect } = useWallet()
  const { account: arcAccount, balance: arcBalance, disconnect: arcDisconnect } = useArcTestnet()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Two connection states exist in the app — WalletContext and useArcTestnet.
  // Connecting through one leaves the other null, so both are checked here
  // until they're merged into a single source.
  const isConnected = !!wallet || !!arcAccount
  const displayAddress = wallet?.shortAddress || (arcAccount ? shortAddr(arcAccount) : null)
  const displayBalance = wallet?.balance || arcBalance

  const isTestnet = pathname.startsWith('/testnet')

  const handleDisconnect = () => {
    arcDisconnect()
    disconnect()
    setMobileOpen(false)
    navigate('/')
  }

  // Dashboard needs an exact match. Its child routes (/dashboard/settings,
  // /dashboard/wallet) have their own entries, and a prefix match would
  // light up Dashboard whenever any of them were open.
  const isActive = (to) => {
    // Exact matches only for these two. '/' prefixes every route, and
    // '/dashboard' prefixes its own child pages — a startsWith check would
    // light both up almost everywhere.
    if (to === '/' || to === '/dashboard') return pathname === to
    return pathname === to || pathname.startsWith(to + '/')
  }

  // One row, shared by the desktop rail and the mobile drawer. The label
  // stays mounted and fades rather than unmounting — that keeps the icons
  // from shifting as the text appears.
  const Row = ({ item, expanded, onClick, active: forceActive, accent }) => {
    const active = forceActive ?? isActive(item.to)
    const Glyph = Icon[item.icon]
    return (
      <Link
        to={item.to}
        onClick={onClick}
        className={
          'flex items-center gap-3 h-11 px-3 rounded-xl transition-colors ' +
          (active
            ? 'bg-[#131c2b] text-white'
            : 'text-[#8892a0] hover:text-white hover:bg-[#0f1822]')
        }
      >
        <Glyph className={'w-5 h-5 flex-shrink-0 ' + (active || accent ? 'text-[#00D4FF]' : '')} />
        <span
          className={
            'text-sm font-medium whitespace-nowrap transition-all duration-200 ' +
            (expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none')
          }
        >
          {item.label}
        </span>
      </Link>
    )
  }

  const SectionLabel = ({ children, expanded }) => (
    <p
      className={
        'text-[10px] tracking-[2px] text-[#4a5568] px-3 mb-2 whitespace-nowrap transition-opacity duration-200 ' +
        (expanded ? 'opacity-100' : 'opacity-0')
      }
    >
      {children}
    </p>
  )

  const Inner = ({ expanded, onNavigate }) => (
    <>
      {/* Brand */}
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 h-16 px-3 mb-4">
        <img src="/logo.jpg" alt="" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
        <span
          className={
            "font-['Space_Grotesk'] text-lg font-bold whitespace-nowrap transition-all duration-200 " +
            (expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2')
          }
        >
          <span className="text-white">Paragon </span>
          <span className="text-[#00D4FF]">Finance</span>
        </span>
      </Link>

      <SectionLabel expanded={expanded}>MENU</SectionLabel>
      <nav className="space-y-1 mb-4">
        {MENU.map(item => (
          <Row key={item.to} item={item} expanded={expanded} onClick={onNavigate} />
        ))}
      </nav>


      {/* Settings sits in its own section above the wallet block — separate
          from MENU because it's account configuration rather than a
          destination people browse to. */}
      <SectionLabel expanded={expanded}>ACCOUNT</SectionLabel>
      <nav className="space-y-1">
        {ACCOUNT.map(item => (
          <Row key={item.to} item={item} expanded={expanded} onClick={onNavigate} />
        ))}
      </nav>

      {/* Wallet block. Only meaningful once connected, so the whole thing
          swaps rather than showing an empty shell. */}
      <div className="mt-auto pt-4">
        {isConnected ? (
          <div
            className={
              'bg-[#0f1822] border border-[#1e2530] rounded-xl transition-all duration-200 overflow-hidden ' +
              (expanded ? 'p-4' : 'p-2')
            }
          >
            {expanded ? (
              <>
                <p className="text-[10px] tracking-[2px] text-[#4a5568] mb-1">BALANCE</p>
                <p className="text-lg font-bold text-white font-['Space_Grotesk'] mb-2">
                  {displayBalance} <span className="text-sm text-[#8892a0]">USDC</span>
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#8892a0]">{displayAddress}</span>
                  <button
                    onClick={handleDisconnect}
                    className="text-[10px] text-[#8892a0] hover:text-red-400 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </>
            ) : (
              <div className="flex justify-center py-1">
                <span className="w-2 h-2 rounded-full bg-green-400" />
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/connect"
            onClick={onNavigate}
            className="flex items-center justify-center bg-[#00D4FF] text-[#0D1117] font-bold rounded-xl transition-all hover:opacity-90 h-11 text-sm"
          >
            {expanded ? 'Connect Wallet' : '+'}
          </Link>
        )}

        <p
          className={
            'text-[10px] text-[#4a5568] text-center mt-3 whitespace-nowrap transition-opacity duration-200 ' +
            (expanded ? 'opacity-100' : 'opacity-0')
          }
        >
          • Built on Arc
        </p>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop rail.
          Fixed and overlaying rather than pushing content: a sidebar that
          reflows the page on every hover is visually noisy, and content only
          ever needs to clear the 64px collapsed width.
          overflow-y-auto because eight rows plus the wallet block can exceed
          a short viewport once expanded. */}
      <aside
        className="hidden md:flex fixed top-0 left-0 h-screen z-40 flex-col
                   w-16 hover:w-56 group
                   bg-[#0a0e14] border-r border-[#1e2530]
                   px-2 py-4 transition-[width] duration-200 ease-out
                   overflow-x-hidden overflow-y-auto"
      >
        {/* Two copies swapped by group-hover. Mounting the expanded state
            only on hover would mean React inserting nodes mid-animation,
            which stutters — this way both exist and only visibility flips. */}
        <div className="group-hover:hidden flex flex-col h-full min-h-0">
          <Inner expanded={false} />
        </div>
        <div className="hidden group-hover:flex flex-col h-full min-h-0">
          <Inner expanded={true} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 h-16 flex items-center justify-between px-4
                      bg-[#0D1117]/95 backdrop-blur-md border-b border-[#1e2530]">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <img src="/logo.jpg" alt="" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
          <span className="font-['Space_Grotesk'] text-lg font-bold text-white truncate">Paragon</span>
          <span className="font-['Space_Grotesk'] text-lg font-bold text-[#00D4FF] -ml-1 truncate">Finance</span>
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isConnected ? (
            <Link to="/dashboard"
              className="flex items-center gap-1.5 bg-[#0f1822] border border-[#1e2530] rounded-full px-2.5 py-1.5">
              {/* <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> */}
              <span className="text-xs font-mono text-white">{displayAddress}</span>
            </Link>
          ) : (
            <Link to="/connect"
              className="bg-[#00D4FF] text-[#0D1117] font-bold text-xs px-4 py-2 rounded-full">
              Connect
            </Link>
          )}
          <button onClick={() => setMobileOpen(true)} className="text-[#8892a0] p-1" aria-label="Menu">
            <Icon.menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            onClick={e => e.stopPropagation()}
            className="relative w-64 h-full bg-[#0a0e14] border-r border-[#1e2530] px-3 py-4 flex flex-col overflow-y-auto"
          >
            <Inner expanded={true} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}