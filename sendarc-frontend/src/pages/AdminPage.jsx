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
                <p className="text-xs text-[#556] mt-1">All-time testnet volume</p>
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