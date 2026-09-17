import { useState, useEffect, useCallback } from 'react'
import { Card, Badge, LoadingSpinner, StatusBadge } from '../components/UI'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const SESSION_KEY = 'sendarc_admin_session'

function formatNum(n, decimals = 2) {
  if (n === undefined || n === null || isNaN(n)) return '0'
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: decimals })
}

function shortAddr(addr) {
  if (!addr) return '—'
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

function AdminLogin({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setChecking(true)
    try {
      const res = await fetch(API_BASE + '/admin/overview', {
        headers: { 'x-admin-key': password },
      })
      if (res.status === 401) {
        setError('Incorrect admin password')
        setChecking(false)
        return
      }
      if (!res.ok) {
        setError('Could not reach the server. Try again.')
        setChecking(false)
        return
      }
      sessionStorage.setItem(SESSION_KEY, password)
      onSuccess(password)
    } catch {
      setError('Network error. Check your connection.')
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-6">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#00D4FF] opacity-[0.04] blur-[140px] rounded-full pointer-events-none" />
      <Card glow className="p-8 w-full max-w-sm relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0a2030] to-[#051018] border border-[#00D4FF]/40 flex items-center justify-center mx-auto mb-4 text-2xl">
            🔐
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-white mb-1">Admin Access</h1>
          <p className="text-xs text-[#8892a0]">Paragon Finance Owner Dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter admin password"
            autoFocus
            className="w-full bg-[#0D1117] border border-[#1e2530] focus:border-[#00D4FF] rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors mb-3"
          />
          {error && (
            <p className="text-red-400 text-xs mb-3 text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={checking || !password}
            className="w-full bg-[#00D4FF] text-black font-bold py-3 rounded-xl text-sm hover:bg-[#00bfe6] transition-all disabled:opacity-50"
          >
            {checking ? 'Verifying...' : 'Enter Dashboard'}
          </button>
        </form>
      </Card>
    </div>
  )
}

function AdminDashboard({ adminKey, onLogout }) {
  const [overview, setOverview] = useState(null)
  const [wallets, setWallets] = useState([])
  const [walletPage, setWalletPage] = useState(1)
  const [walletTotalPages, setWalletTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [walletsLoading, setWalletsLoading] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [walletDetail, setWalletDetail] = useState(null)
  const [tab, setTab] = useState('overview')

  const authedFetch = useCallback((path) => {
    return fetch(API_BASE + path, { headers: { 'x-admin-key': adminKey } }).then(r => {
      if (r.status === 401) {
        sessionStorage.removeItem(SESSION_KEY)
        onLogout()
        throw new Error('Session expired')
      }
      return r.json()
    })
  }, [adminKey, onLogout])

  useEffect(() => {
    authedFetch('/admin/overview')
      .then(data => { if (data.success) setOverview(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [authedFetch])

  useEffect(() => {
    if (tab !== 'wallets') return
    setWalletsLoading(true)
    const params = new URLSearchParams({ page: walletPage, limit: 20, search })
    authedFetch('/admin/wallets?' + params.toString())
      .then(data => {
        if (data.success) {
          setWallets(data.wallets)
          setWalletTotalPages(data.totalPages)
        }
      })
      .catch(() => {})
      .finally(() => setWalletsLoading(false))
  }, [tab, walletPage, search, authedFetch])

  const openWalletDetail = async (address) => {
    setSelectedWallet(address)
    setWalletDetail(null)
    try {
      const data = await authedFetch('/admin/wallets/' + address)
      if (data.success) setWalletDetail(data)
    } catch {}
  }

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    onLogout()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D1117] px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white">Admin Dashboard</h1>
            <p className="text-xs text-[#8892a0] mt-1">Paragon Finance platform overview · Owner only</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="green">● Live Data</Badge>
            <button
              onClick={handleLogout}
              className="text-xs text-[#8892a0] border border-[#1e2530] rounded-lg px-4 py-2 hover:border-red-500 hover:text-red-400 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-[#1e2530]">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'wallets', label: 'Wallets' },
            { id: 'affiliates', label: 'Affiliates' },
            { id: 'points', label: 'Points' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ' +
                (tab === t.id
                  ? 'border-[#00D4FF] text-[#00D4FF]'
                  : 'border-transparent text-[#8892a0] hover:text-white')
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'affiliates' && <AffiliateReview adminKey={adminKey} />}

        {tab === 'points' && <PointsTracking adminKey={adminKey} />}

        {tab === 'overview' && overview && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-5">
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-2">TOTAL WALLETS</p>
                <p className="text-3xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{formatNum(overview.totalWallets, 0)}</p>
                <p className="text-xs text-[#556] mt-1">Registered users</p>
              </Card>
              <Card className="p-5">
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-2">TOTAL VOLUME</p>
                <p className="text-3xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{formatNum(overview.totalVolume)} USDC</p>
                <p className="text-xs text-[#556] mt-1">All-time volume</p>
              </Card>
              <Card className="p-5">
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-2">TRANSACTIONS</p>
                <p className="text-3xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{formatNum(overview.totalTransactions, 0)}</p>
                <p className="text-xs text-green-400 mt-1">{overview.successRate}% success rate</p>
              </Card>
              <Card className="p-5">
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-2">AVG SETTLEMENT</p>
                <p className="text-3xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{(overview.avgSettlementMs / 1000).toFixed(2)}s</p>
                <p className="text-xs text-[#556] mt-1">Network speed</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <Card className="p-5">
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-3">LAST 24 HOURS</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white font-['Space_Grotesk']">{formatNum(overview.last24h.count, 0)}</p>
                    <p className="text-xs text-[#556]">transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{formatNum(overview.last24h.volume)}</p>
                    <p className="text-xs text-[#556]">USDC volume</p>
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-3">LAST 7 DAYS</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white font-['Space_Grotesk']">{formatNum(overview.last7d.count, 0)}</p>
                    <p className="text-xs text-[#556]">transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{formatNum(overview.last7d.volume)}</p>
                    <p className="text-xs text-[#556]">USDC volume</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-5">
              <p className="text-[10px] tracking-widest text-[#8892a0] mb-3">NETWORK HEALTH</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xl font-bold text-green-400 font-['Space_Grotesk']">{formatNum(overview.confirmedTransactions, 0)}</p>
                  <p className="text-xs text-[#556]">Confirmed</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-red-400 font-['Space_Grotesk']">{formatNum(overview.failedTransactions, 0)}</p>
                  <p className="text-xs text-[#556]">Failed</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white font-['Space_Grotesk']">{formatNum(overview.totalGasPaid, 9)} ARC</p>
                  <p className="text-xs text-[#556]">Total gas paid</p>
                </div>
              </div>
            </Card>
          </>
        )}

        {tab === 'wallets' && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">All Wallets</p>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setWalletPage(1) }}
                placeholder="Search wallet address..."
                className="bg-[#0D1117] border border-[#1e2530] focus:border-[#00D4FF] rounded-lg px-3 py-2 text-xs text-white outline-none w-64"
              />
            </div>

            {walletsLoading ? (
              <div className="py-12 flex justify-center"><LoadingSpinner /></div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1e2530] text-left">
                        {['WALLET', 'TRANSACTIONS', 'VOLUME', 'SUCCESS RATE', 'LAST ACTIVE'].map(h => (
                          <th key={h} className="px-3 py-2 text-[10px] tracking-widest text-[#556] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {wallets.map(w => (
                        <tr
                          key={w.walletAddress}
                          onClick={() => openWalletDetail(w.walletAddress)}
                          className="border-b border-[#1e2530]/50 hover:bg-[#0a1520] cursor-pointer transition-colors"
                        >
                          <td className="px-3 py-3 text-[#00D4FF] font-mono text-xs">{shortAddr(w.walletAddress)}</td>
                          <td className="px-3 py-3 text-white">{w.totalTransactions}</td>
                          <td className="px-3 py-3 text-white">{formatNum(w.totalVolume)} USDC</td>
                          <td className="px-3 py-3">
                            <span className={w.totalTransactions ? (Math.round((w.confirmedTransactions / w.totalTransactions) * 100) >= 90 ? 'text-green-400' : 'text-amber-400') : 'text-[#556]'}>
                              {w.totalTransactions ? Math.round((w.confirmedTransactions / w.totalTransactions) * 100) : 100}%
                            </span>
                          </td>
                          <td className="px-3 py-3 text-[#8892a0] text-xs">
                            {w.lastActivity ? new Date(w.lastActivity).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                      {wallets.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-8 text-[#556] text-sm">No wallets found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1e2530]">
                  <p className="text-xs text-[#556]">Page {walletPage} of {walletTotalPages || 1}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWalletPage(p => Math.max(1, p - 1))}
                      disabled={walletPage <= 1}
                      className="text-xs border border-[#1e2530] rounded-lg px-3 py-1.5 text-[#8892a0] hover:border-[#00D4FF] disabled:opacity-30 transition-colors"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setWalletPage(p => Math.min(walletTotalPages, p + 1))}
                      disabled={walletPage >= walletTotalPages}
                      className="text-xs border border-[#1e2530] rounded-lg px-3 py-1.5 text-[#8892a0] hover:border-[#00D4FF] disabled:opacity-30 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>
        )}

        {selectedWallet && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50"
            onClick={() => setSelectedWallet(null)}
          >
            <Card
              glow
              className="p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-[#8892a0] mb-1">Wallet Detail</p>
                  <p className="text-[#00D4FF] font-mono text-sm">{selectedWallet}</p>
                </div>
                <button
                  onClick={() => setSelectedWallet(null)}
                  className="text-[#8892a0] hover:text-white text-xl leading-none"
                >
                  ×
                </button>
              </div>

              {!walletDetail ? (
                <div className="py-12 flex justify-center"><LoadingSpinner /></div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-[#0D1117] border border-[#1e2530] rounded-lg p-3">
                      <p className="text-[10px] text-[#556] mb-1">TOTAL VOLUME</p>
                      <p className="text-lg font-bold text-[#00D4FF] font-['Space_Grotesk']">{formatNum(walletDetail.stats.totalVolume)}</p>
                    </div>
                    <div className="bg-[#0D1117] border border-[#1e2530] rounded-lg p-3">
                      <p className="text-[10px] text-[#556] mb-1">TRANSACTIONS</p>
                      <p className="text-lg font-bold text-white font-['Space_Grotesk']">{walletDetail.stats.totalTransactions}</p>
                    </div>
                    <div className="bg-[#0D1117] border border-[#1e2530] rounded-lg p-3">
                      <p className="text-[10px] text-[#556] mb-1">GAS PAID</p>
                      <p className="text-lg font-bold text-white font-['Space_Grotesk']">{formatNum(walletDetail.stats.totalGasPaid, 6)}</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#8892a0] mb-2">Recent Transactions</p>
                  <div className="space-y-2">
                    {walletDetail.transactions.slice(0, 10).map(tx => (
                      <div key={tx._id} className="flex items-center justify-between bg-[#0D1117] border border-[#1e2530] rounded-lg px-3 py-2 text-xs">
                        <span className="text-[#8892a0] font-mono">{shortAddr(tx.hash)}</span>
                        <span className="text-white">{tx.amount} USDC</span>
                        <StatusBadge status={tx.status} />
                        <span className="text-[#556]">{new Date(tx.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {walletDetail.transactions.length === 0 && (
                      <p className="text-center text-[#556] text-xs py-4">No transactions yet</p>
                    )}
                  </div>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved) setAdminKey(saved)
    setChecked(true)
  }, [])

  if (!checked) return null

  if (!adminKey) {
    return <AdminLogin onSuccess={setAdminKey} />
  }

  return <AdminDashboard adminKey={adminKey} onLogout={() => setAdminKey(null)} />
}
// ═══════════════════════════════════════════════════════════════════════════
// AFFILIATE REVIEW
//
// Inlined rather than imported. Every wiring step in this file has been a
// place for something to go missing, and a review queue that silently fails
// to render is worse than a long file.
//
// Follower counts are self-reported, so each application needs someone to
// open the profile links and check. The layout is built around that: links
// are prominent, and approval takes a deliberate second click rather than
// sitting under the cursor while you scan the list.
// ═══════════════════════════════════════════════════════════════════════════

const PLATFORM_LABEL = {
  twitter: 'X', telegram: 'Telegram', youtube: 'YouTube',
  instagram: 'Instagram', tiktok: 'TikTok', discord: 'Discord',
}

function timeAgo(date) {
  const mins = Math.floor((Date.now() - new Date(date)) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return mins + 'm ago'
  if (mins < 1440) return Math.floor(mins / 60) + 'h ago'
  return Math.floor(mins / 1440) + 'd ago'
}

function AffiliateReview({ adminKey }) {
  const [tab, setTab] = useState('pending')
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [acting, setActing] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [note, setNote] = useState('')
  const [walletInput, setWalletInput] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(API_BASE + '/rewards/admin/applications?status=' + tab, {
        headers: { 'x-admin-key': adminKey },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setApplications(data.applications || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tab, adminKey])

  useEffect(() => { load() }, [load])

  const review = async (app, decision) => {
    setActing(app._id)
    setError(null)
    try {
      const res = await fetch(API_BASE + '/rewards/admin/applications/' + app._id + '/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          decision,
          note,
          reviewer: 'admin',
          // Supplied when the applicant didn't connect a wallet. Without one
          // there's nothing to attach the affiliate flag to, so approval
          // would grant a status that earns nothing.
          walletAddress: app.walletAddress || walletInput.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Review failed')

      // Remove locally rather than refetching — the row leaves this tab
      // either way, and a refetch makes the whole list flash.
      setApplications(prev => prev.filter(a => a._id !== app._id))
      setConfirming(null)
      setNote('')
      setWalletInput('')
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold font-['Space_Grotesk'] text-white">Affiliate applications</h2>
          <p className="text-xs text-[#8892a0] mt-0.5">
            Follower counts are self-reported — open the links before approving.
          </p>
        </div>
        <button
          onClick={load}
          className="text-xs text-[#8892a0] border border-[#1e2530] rounded-lg px-3 py-1.5 hover:border-[#00D4FF] hover:text-white transition-all"
        >
          Refresh
        </button>
      </div>

      <div className="flex gap-1 bg-[#0f1822] border border-[#1e2530] rounded-xl p-1 mb-5 w-fit">
        {['pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={
              "px-4 py-1.5 rounded-lg text-xs font-semibold font-['Space_Grotesk'] transition-all capitalize " +
              (tab === s ? 'bg-[#00D4FF] text-[#0D1117]' : 'text-[#8892a0] hover:text-white')
            }
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-3 mb-4">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <Card className="p-10 flex justify-center"><LoadingSpinner /></Card>
      ) : applications.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-[#8892a0]">
            {tab === 'pending' ? 'Nothing waiting for review.' : 'No ' + tab + ' applications.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map(app => {
            const topFollowers = Math.max(...(app.socials?.map(s => s.followers) || [0]))
            const isConfirming = confirming === app._id
            const isActing = acting === app._id

            return (
              <Card key={app._id} className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1">
                      <h3 className="font-bold font-['Space_Grotesk'] text-white">{app.name}</h3>
                      {app.walletAddress ? (
                        <span className="text-[10px] font-mono text-[#4a5568]">
                          {shortAddr(app.walletAddress)}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1408] border border-[#3d2f10] text-[#e8c374]">
                          no wallet
                        </span>
                      )}
                    </div>
                    <a href={'mailto:' + app.email} className="text-xs text-[#00D4FF] hover:underline">
                      {app.email}
                    </a>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-[#00D4FF] font-['Space_Grotesk']">
                      {topFollowers.toLocaleString()}
                    </p>
                    <p className="text-[9px] tracking-widest text-[#4a5568]">TOP ACCOUNT</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {app.socials?.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 bg-[#0D1117] border border-[#1e2530] rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] tracking-widest text-[#4a5568] w-16 flex-shrink-0">
                          {PLATFORM_LABEL[s.platform] || s.platform}
                        </span>
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-[#00D4FF] hover:underline truncate">
                          {s.handle}
                        </a>
                      </div>
                      <span className={'text-xs font-semibold flex-shrink-0 ' + (s.followers >= 5000 ? 'text-white' : 'text-[#4a5568]')}>
                        {s.followers.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {(app.audienceDescription || app.promotionPlan) && (
                  <div className="space-y-3 mb-4">
                    {app.audienceDescription && (
                      <div>
                        <p className="text-[10px] tracking-widest text-[#4a5568] mb-1">AUDIENCE</p>
                        <p className="text-xs text-[#8892a0] leading-relaxed">{app.audienceDescription}</p>
                      </div>
                    )}
                    {app.promotionPlan && (
                      <div>
                        <p className="text-[10px] tracking-widest text-[#4a5568] mb-1">PLAN</p>
                        <p className="text-xs text-[#8892a0] leading-relaxed">{app.promotionPlan}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-[#1e2530]">
                  {tab === 'pending' && isConfirming ? (
                    <div className="space-y-2.5">
                      {!app.walletAddress && (
                        <div>
                          <label className="block text-[10px] tracking-widest text-[#4a5568] mb-1.5">
                            WALLET ADDRESS (required to approve)
                          </label>
                          <input
                            type="text"
                            value={walletInput}
                            onChange={e => setWalletInput(e.target.value)}
                            placeholder="0x…"
                            className="w-full bg-[#0D1117] border border-[#1e2530] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-[#00D4FF]"
                          />
                          <p className="text-[10px] text-[#4a5568] mt-1">
                            Ask them for it by email. Rewards attach to a wallet.
                          </p>
                        </div>
                      )}

                      <input
                        type="text"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Note (optional, shown to the applicant)"
                        className="w-full bg-[#0D1117] border border-[#1e2530] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00D4FF]"
                      />

                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => review(app, 'approved')}
                          disabled={isActing || (!app.walletAddress && !walletInput.trim())}
                          className="text-xs font-semibold px-4 py-2 rounded-lg bg-green-900/20 border border-green-500 text-green-400 hover:bg-green-900/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isActing ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => review(app, 'rejected')}
                          disabled={isActing}
                          className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-900/20 border border-red-500 text-red-400 hover:bg-red-900/40 transition-all disabled:opacity-50"
                        >
                          {isActing ? '…' : 'Reject'}
                        </button>
                        <button
                          onClick={() => { setConfirming(null); setNote(''); setWalletInput('') }}
                          className="text-xs text-[#8892a0] hover:text-white px-3"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <span className="text-[10px] text-[#4a5568]">
                        {timeAgo(app.createdAt)}
                        {app.reviewedAt && ' · reviewed ' + timeAgo(app.reviewedAt)}
                        {app.reviewNote && ' · "' + app.reviewNote + '"'}
                      </span>
                      {tab === 'pending' && (
                        // One Review button rather than approve/reject inline.
                        // Approval pays 1,000 points and can't be undone, so
                        // it shouldn't be one stray click away while scrolling.
                        <button
                          onClick={() => setConfirming(app._id)}
                          className="text-xs font-semibold px-5 py-1.5 rounded-lg bg-[#00D4FF] text-[#0D1117] hover:opacity-90 transition-all"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// POINTS TRACKING
//
// Every wallet and what it has earned — the view you need before any
// distribution, and the one that answers "why hasn't this affiliate been
// paid" without opening MongoDB.
// ═══════════════════════════════════════════════════════════════════════════

function PointsTracking({ adminKey }) {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('points')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        API_BASE + '/rewards/admin/users?filter=' + filter + '&sort=' + sort + '&limit=100',
        { headers: { 'x-admin-key': adminKey } }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filter, sort, adminKey])

  useEffect(() => { load() }, [load])

  const openDetail = async (wallet) => {
    setLoadingDetail(true)
    setDetail({ walletAddress: wallet })
    try {
      const res = await fetch(API_BASE + '/rewards/admin/users/' + wallet, {
        headers: { 'x-admin-key': adminKey },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setDetail(json)
    } catch (err) {
      setError(err.message)
      setDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const exportCsv = () => {
    // Fetched rather than linked, because the download needs the admin
    // header — a plain <a href> would arrive unauthenticated.
    fetch(API_BASE + '/rewards/admin/export', { headers: { 'x-admin-key': adminKey } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'paragon-points.csv'
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => setError('Export failed'))
  }

  // ─── Detail view ────────────────────────────────────────────────────
  if (detail) {
    return (
      <div>
        <button
          onClick={() => setDetail(null)}
          className="text-xs text-[#8892a0] hover:text-white mb-5 transition-colors"
        >
          ← Back to all wallets
        </button>

        {loadingDetail ? (
          <Card className="p-10 flex justify-center"><LoadingSpinner /></Card>
        ) : !detail.user ? (
          <Card className="p-10 text-center">
            <p className="text-sm text-[#8892a0]">Wallet not found</p>
          </Card>
        ) : (
          <>
            <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <h2 className="text-lg font-bold font-['Space_Grotesk'] text-white font-mono">
                    {shortAddr(detail.user.walletAddress)}
                  </h2>
                  {detail.user.isAffiliate && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#2a1a08] border border-[#F59E0B] text-[#FBBF24]">
                      AFFILIATE
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-[#4a5568] break-all">
                  {detail.user.walletAddress}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#00D4FF] font-['Space_Grotesk']">
                  {formatNum(detail.user.totalPoints, 0)}
                </p>
                <p className="text-[9px] tracking-widest text-[#4a5568]">POINTS</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'TRANSACTIONS', value: detail.user.points?.transactions || 0 },
                { label: 'REFERRALS', value: detail.user.points?.referrals || 0 },
                { label: 'JOINING', value: detail.user.points?.signup || 0 },
                { label: 'AFFILIATE', value: detail.user.points?.affiliateBonus || 0 },
              ].map(s => (
                <Card key={s.label} className="p-4">
                  <p className="text-xl font-bold text-white font-['Space_Grotesk']">{s.value}</p>
                  <p className="text-[9px] tracking-widest text-[#4a5568] mt-0.5">{s.label}</p>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'SENDS', value: detail.user.txCounts?.send || 0 },
                { label: 'SWAPS', value: detail.user.txCounts?.swap || 0 },
                { label: 'BRIDGES', value: detail.user.txCounts?.bridge || 0 },
                { label: 'ACTIVE DAYS', value: detail.user.activeDays || 0 },
              ].map(s => (
                <Card key={s.label} className="p-4">
                  <p className="text-xl font-bold text-white font-['Space_Grotesk']">{s.value}</p>
                  <p className="text-[9px] tracking-widest text-[#4a5568] mt-0.5">{s.label}</p>
                </Card>
              ))}
            </div>

            {detail.referredBy && (
              <Card className="p-4 mb-5">
                <p className="text-[10px] tracking-widest text-[#4a5568] mb-1.5">REFERRED BY</p>
                <button
                  onClick={() => openDetail(detail.referredBy.walletAddress)}
                  className="text-xs font-mono text-[#00D4FF] hover:underline"
                >
                  {shortAddr(detail.referredBy.walletAddress)}
                </button>
              </Card>
            )}

            {/* Their referrals, with progress. This is the answer to "why
                hasn't this affiliate been paid" — nearly always that the
                referrals haven't hit 3 transactions across 2 days yet. */}
            <Card className="overflow-hidden mb-5">
              <div className="px-5 py-3.5 border-b border-[#1e2530] flex justify-between items-center">
                <p className="text-sm font-semibold font-['Space_Grotesk'] text-white">
                  Referrals
                </p>
                <span className="text-[10px] text-[#4a5568]">
                  {detail.user.qualifiedReferralCount} qualified of {detail.user.referralCount}
                </span>
              </div>
              {detail.referrals?.length === 0 ? (
                <p className="p-6 text-center text-xs text-[#4a5568]">No referrals</p>
              ) : (
                <div className="divide-y divide-[#1e2530]">
                  {detail.referrals.map((r, i) => (
                    <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                      <button
                        onClick={() => openDetail(r.walletAddress)}
                        className="text-xs font-mono text-[#00D4FF] hover:underline"
                      >
                        {shortAddr(r.walletAddress)}
                      </button>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-[#8892a0]">
                          {r.transactions} tx · {r.activeDays}d
                        </span>
                        <span className={
                          'text-[10px] font-semibold px-2 py-1 rounded-full ' +
                          (r.qualified
                            ? 'bg-green-900/20 border border-green-500 text-green-400'
                            : 'bg-[#1a1408] border border-[#3d2f10] text-[#e8c374]')
                        }>
                          {r.qualified ? 'Qualified' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#1e2530]">
                <p className="text-sm font-semibold font-['Space_Grotesk'] text-white">
                  Points history
                </p>
              </div>
              <div className="divide-y divide-[#1e2530] max-h-96 overflow-y-auto">
                {detail.events?.map((e, i) => (
                  <div key={i} className="px-5 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-white capitalize">
                        {e.type.replace('_', ' ')}
                        {e.txType && <span className="text-[#4a5568]"> · {e.txType}</span>}
                      </p>
                      {e.note && <p className="text-[10px] text-[#4a5568] mt-0.5">{e.note}</p>}
                    </div>
                    <span className="text-sm font-bold text-[#00D4FF] font-['Space_Grotesk'] flex-shrink-0">
                      +{e.points}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    )
  }

  // ─── List view ──────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold font-['Space_Grotesk'] text-white">Points tracking</h2>
          <p className="text-xs text-[#8892a0] mt-0.5">
            Every wallet and what it has earned. Click any row for the detail.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="text-xs text-[#8892a0] border border-[#1e2530] rounded-lg px-3 py-1.5 hover:border-[#00D4FF] hover:text-white transition-all"
          >
            Export CSV
          </button>
          <button
            onClick={load}
            className="text-xs text-[#8892a0] border border-[#1e2530] rounded-lg px-3 py-1.5 hover:border-[#00D4FF] hover:text-white transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'TOTAL POINTS', value: formatNum(data.summary.totalPoints, 0), accent: true },
            { label: 'WALLETS', value: formatNum(data.summary.totalWallets, 0) },
            { label: 'AFFILIATES', value: formatNum(data.summary.totalAffiliates, 0) },
            { label: 'REFERRALS', value: formatNum(data.summary.totalReferrals, 0) },
            { label: 'TRANSACTIONS', value: formatNum(data.summary.totalTransactions, 0) },
          ].map(s => (
            <Card key={s.label} className="p-4">
              <p className={
                "text-xl font-bold font-['Space_Grotesk'] " +
                (s.accent ? 'text-[#00D4FF]' : 'text-white')
              }>
                {s.value}
              </p>
              <p className="text-[9px] tracking-widest text-[#4a5568] mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-3 flex-wrap mb-5">
        <div className="flex gap-1 bg-[#0f1822] border border-[#1e2530] rounded-xl p-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'affiliates', label: 'Affiliates' },
            { id: 'referrers', label: 'Referrers' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={
                "px-3 py-1.5 rounded-lg text-xs font-semibold font-['Space_Grotesk'] transition-all " +
                (filter === f.id ? 'bg-[#00D4FF] text-[#0D1117]' : 'text-[#8892a0] hover:text-white')
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="bg-[#0f1822] border border-[#1e2530] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#00D4FF]"
        >
          <option value="points">Most points</option>
          <option value="referrals">Most referrals</option>
          <option value="transactions">Most transactions</option>
          <option value="recent">Newest</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-3 mb-4">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <Card className="p-10 flex justify-center"><LoadingSpinner /></Card>
      ) : !data?.users?.length ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-[#8892a0]">No wallets yet</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2530] text-[10px] tracking-widest text-[#4a5568]">
                  <th className="text-left px-5 py-3 font-normal">WALLET</th>
                  <th className="text-right px-3 py-3 font-normal">POINTS</th>
                  <th className="text-right px-3 py-3 font-normal">TX</th>
                  <th className="text-right px-3 py-3 font-normal">REFERRALS</th>
                  <th className="text-right px-5 py-3 font-normal">CODE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2530]">
                {data.users.map(u => (
                  <tr
                    key={u.walletAddress}
                    onClick={() => openDetail(u.walletAddress)}
                    className="hover:bg-[#11161f] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-white">
                          {shortAddr(u.walletAddress)}
                        </span>
                        {u.isAffiliate && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#2a1a08] border border-[#F59E0B] text-[#FBBF24]">
                            AFF
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right px-3 py-3 font-bold text-[#00D4FF] font-['Space_Grotesk']">
                      {formatNum(u.totalPoints, 0)}
                    </td>
                    <td className="text-right px-3 py-3 text-[#8892a0] text-xs">
                      {u.totalTransactions}
                    </td>
                    <td className="text-right px-3 py-3 text-xs">
                      <span className="text-white">{u.qualifiedReferralCount}</span>
                      {u.referralCount > u.qualifiedReferralCount && (
                        <span className="text-[#4a5568]"> / {u.referralCount}</span>
                      )}
                    </td>
                    <td className="text-right px-5 py-3 font-mono text-[10px] text-[#4a5568]">
                      {u.referralCode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}