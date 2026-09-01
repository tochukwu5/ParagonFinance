import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import { TestnetProvider } from './context/TestnetContext'
import { useEffect } from 'react'
import { useArcTestnet } from './hooks/useArcTestnet'
import { useTestnet } from './context/TestnetContext'

import Sidebar from './components/Sidebar'
import { ScrollToTop } from './components/Reveal'
import Footer from './components/Footer'

import Home from './pages/Home'
import ConnectWallet from './pages/ConnectWallet'
import Dashboard from './pages/Dashboard'
import { Transactions, WalletPage, Notifications, Settings } from './pages/DashboardPages'
import { HowItWorks, AboutPage, DocsPage } from './pages/PublicPages'

import TestnetSend from './pages/testnet/TestnetSend'
import AdminPage from './pages/AdminPage'
import StatsPage from './pages/StatsPage'



// Sidebar plus content. md:pl-16 clears the collapsed rail — the expanded
// state overlays rather than reflowing, so this padding never changes as the
// sidebar animates.
function AppLayout({ children }) {
  return (
    <>
      <Sidebar />
      <div className="md:pl-16 min-h-screen bg-[#0D1117]">
        {children}
        <Footer />
      </div>
    </>
  )
}

function AppShell({ children }) {
  return (
    <>
      <Sidebar />
      <div className="md:pl-16 min-h-screen bg-[#0D1117]">
        {children}
      </div>
    </>
  )
}

// Some pages bring their own chrome — Dashboard renders its own sidebar,
// ConnectWallet is a focused single-purpose screen, Admin is internal.
// Wrapping those would double up the navigation.
function BareLayout({ children }) {
  return <div className="min-h-screen bg-[#0D1117]">{children}</div>
}

// ─── GLOBAL WALLET BRIDGE ─────────────────────────────────────────────
// Watches for wallet auto-reconnect on any page. The moment an account
// becomes available — including after a refresh — it loads that wallet's
// MongoDB history, so individual pages don't each have to arrange it.
function WalletBridge() {
  const { account, isConnected } = useArcTestnet()
  const { loadTransactions } = useTestnet()

  useEffect(() => {
    if (account && isConnected) {
      loadTransactions(account)
    }
  }, [account, isConnected])

  return null
}

export default function App() {
  return (
    <WalletProvider>
      <TestnetProvider>
        <BrowserRouter>
          {/* Both must sit inside BrowserRouter — they read router state. */}
          <ScrollToTop />
          <WalletBridge />
          <Routes>

            {/* ── Public ─────────────────────────────────────────── */}
            <Route path="/" element={<AppLayout><Home /></AppLayout>} />
            <Route path="/how-it-works" element={<AppLayout><HowItWorks /></AppLayout>} />
            {/* Countries and Rates retired — the platform is positioned
                around chains and stablecoin rails now, not a list of
                destinations. Redirects keep old links alive. */}
            <Route path="/countries" element={<Navigate to="/how-it-works" replace />} />
            <Route path="/rates" element={<Navigate to="/how-it-works" replace />} />
            <Route path="/about" element={<AppLayout><AboutPage /></AppLayout>} />
            <Route path="/docs" element={<AppLayout><DocsPage /></AppLayout>} />

            {/* ── Testnet ────────────────────────────────────────────
                The hub and the leaderboard are retired — the sidebar does
                the launching the hub used to do, so it was a page that only
                pointed elsewhere. Redirects rather than 404s keep existing
                links, bookmarks and anything already shared working. */}
            {/* <Route path="/testnet/send" element={<AppLayout><TestnetSend /></AppLayout>} /> */}
                       <Route path="/testnet" element={<AppShell><TestnetSend /></AppShell>} />
          
            <Route path="/testnet/send" element={<Navigate to="/testnet" replace />} />
            <Route path="/testnet/transactions" element={<Navigate to="/testnet/send" replace />} />
            <Route path="/testnet/leaderboard" element={<Navigate to="/testnet/send" replace />} />

            {/* /send is the mainnet flow and isn't live yet — it rendered a
                wallet prompt that went nowhere. Points at the working flow
                instead of removing the URL entirely. */}
            <Route path="/send" element={<Navigate to="/testnet/send" replace />} />

            {/* ── Wallet ─────────────────────────────────────────── */}
            <Route path="/connect" element={<BareLayout><ConnectWallet /></BareLayout>} />

            {/* ── Dashboard — renders its own sidebar ────────────── */}
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/dashboard/transactions" element={<AppLayout><Transactions /></AppLayout>} />
            <Route path="/dashboard/wallet" element={<AppLayout><WalletPage /></AppLayout>} />
            <Route path="/dashboard/notifications" element={<AppLayout><Notifications /></AppLayout>} />
            <Route path="/dashboard/settings" element={<AppLayout><Settings /></AppLayout>} />

            {/* ── Internal ───────────────────────────────────────── */}
            <Route path="/admin" element={<BareLayout><AdminPage /></BareLayout>} />
            <Route path="/stats" element={<BareLayout><StatsPage /></BareLayout>} />

            {/* ── 404 ────────────────────────────────────────────── */}
            <Route path="*" element={
              <AppLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
                  <p className="text-8xl font-bold text-[#1e2530] font-['Space_Grotesk'] mb-4">404</p>
                  <h1 className="text-2xl font-bold mb-3">Page not found</h1>
                  <p className="text-[#8892a0] mb-8">This page doesn't exist on Paragon Finance.</p>
                  <a href="/" className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all">
                    Back to Home →
                  </a>
                </div>
              </AppLayout>
            } />
          </Routes>
        </BrowserRouter>
      </TestnetProvider>
    </WalletProvider>
  )
}