import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// API_BASE: reads from Vercel env var VITE_API_URL
// Must be set to: https://sendarc1v2-production-bc77.up.railway.app/api
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

function StatCard({ label, value, sub, subColor = 'text-[#556]' }) {
  return (
    <div className="bg-[#0f1822] border border-[#1e2530] rounded-2xl p-6">
      <p className="text-[10px] tracking-widest text-[#8892a0] mb-3">{label}</p>
      <p className="text-3xl font-bold text-[#00D4FF] font-['Space_Grotesk'] mb-1">{value}</p>
      {sub && <p className={'text-xs ' + subColor}>{sub}</p>}
    </div>
  )
}

function LoadingCard() {
  return (
    <div className="bg-[#0f1822] border border-[#1e2530] rounded-2xl p-6 animate-pulse">
      <div className="h-3 w-24 bg-[#1e2530] rounded mb-4" />
      <div className="h-8 w-32 bg-[#1e2530] rounded mb-2" />
      <div className="h-3 w-20 bg-[#1e2530] rounded" />
    </div>
  )
}

export default function StatsPage() {
  const [overview, setOverview] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAll = async () => {
    try {
      console.log('StatsPage: fetching from', API_BASE)
      const [ovRes, lbRes, acRes] = await Promise.all([
        fetch(API_BASE + '/stats/overview'),
        fetch(API_BASE + '/stats/leaderboard'),
        fetch(API_BASE + '/stats/activity'),
      ])

      if (!ovRes.ok) throw new Error('Overview failed: ' + ovRes.status + ' ' + API_BASE + '/stats/overview')

      const [ov, lb, ac] = await Promise.all([ovRes.json(), lbRes.json(), acRes.json()])
      if (ov.success) setOverview(ov)
      if (lb.success) setLeaderboard(lb.leaderboard || [])
      if (ac.success) setActivity(ac.daily || [])
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Stats fetch error — check VITE_API_URL env var:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchAll, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0D1117]">

        {/* Hero header */}
        <div className="relative overflow-hidden border-b border-[#1e2530]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#00D4FF] opacity-[0.05] blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[200px] bg-[#0055FF] opacity-[0.04] blur-[80px] rounded-full" />
          </div>
          <div className="max-w-7xl mx-auto px-6 py-14 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
              <span className="text-[11px] tracking-widest text-[#00D4FF] font-semibold">LIVE NETWORK STATS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk'] mb-3">
              SendArc Testnet
            </h1>
            <p className="text-[#8892a0] text-base max-w-xl">
              Real-time on-chain activity from the SendArc testnet — powered by Arc Network and Circle USDC.
            </p>
            <div className="flex items-center gap-4 mt-5">
              <a
                href="https://testnet.arcscan.app/address/0xd01Bbb99Ef57a82238591f3898D721fc2f7CDf50"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#00D4FF] border border-[#00D4FF]/30 px-3 py-1.5 rounded-full hover:bg-[#0a2030] transition-all"
              >
                SendArcRouter on ArcScan ↗
              </a>
              <Link
                to="/testnet"
                className="text-xs text-[#8892a0] border border-[#1e2530] px-3 py-1.5 rounded-full hover:border-[#00D4FF] hover:text-white transition-all"
              >
                Try the Testnet →
              </Link>
              {lastUpdated && (
                <span className="text-[11px] text-[#556]">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10">

          {/* Top stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loading ? (
              Array(4).fill(0).map((_, i) => <LoadingCard key={i} />)
            ) : overview ? (
              <>
                <StatCard
                  label="TOTAL WALLETS"
                  value={overview.totalWallets.toLocaleString()}
                  sub="Unique testnet participants"
                />
                <StatCard
                  label="TOTAL VOLUME"
                  value={parseFloat(overview.totalVolume).toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' USDC'}
                  sub="All-time testnet volume"
                />
                <StatCard
                  label="TRANSACTIONS"
                  value={overview.totalTransactions.toLocaleString()}
                  sub={overview.successRate + '% success rate'}
                  subColor="text-green-400"
                />
                <StatCard
                  label="AVG SETTLEMENT"
                  value={overview.avgSettlementMs > 0 ? (overview.avgSettlementMs / 1000).toFixed(2) + 's' : '< 1s'}
                  sub="Arc Network speed"
                  subColor="text-[#00D4FF]"
                />
              </>
            ) : (
              <div className="col-span-4 text-center py-8 text-[#556]">Could not load stats. Check your connection.</div>
            )}
          </div>

          {/* 24h and 7d cards */}
          {overview && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <div className="bg-[#0f1822] border border-[#1e2530] rounded-2xl p-6">
                <p className="text-[10px] tracking-widests text-[#8892a0] mb-4">LAST 24 HOURS</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white font-['Space_Grotesk']">
                      {(overview.last24h.count || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-[#556]">transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#00D4FF] font-['Space_Grotesk']">
                      {parseFloat(overview.last24h.volume || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-[#556]">USDC volume</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f1822] border border-[#1e2530] rounded-2xl p-6">
                <p className="text-[10px] tracking-widests text-[#8892a0] mb-4">LAST 7 DAYS</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white font-['Space_Grotesk']">
                      {(overview.last7d.count || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-[#556]">transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#00D4FF] font-['Space_Grotesk']">
                      {parseFloat(overview.last7d.volume || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-[#556]">USDC volume</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f1822] border border-[#1e2530] rounded-2xl p-6">
                <p className="text-[10px] tracking-widests text-[#8892a0] mb-4">NETWORK HEALTH</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8892a0]">Confirmed</span>
                    <span className="text-green-400 font-semibold">{(overview.confirmedTransactions || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8892a0]">Failed</span>
                    <span className="text-red-400 font-semibold">{(overview.failedTransactions || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8892a0]">Success Rate</span>
                    <span className="text-[#00D4FF] font-semibold">{overview.successRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity chart */}
          {activity.length > 0 && (
            <div className="bg-[#0f1822] border border-[#1e2530] rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-semibold font-['Space_Grotesk'] text-white">Daily Volume</p>
                  <p className="text-xs text-[#556] mt-1">USDC transferred — last 30 days</p>
                </div>
                <span className="text-[11px] text-[#00D4FF] border border-[#00D4FF]/30 px-3 py-1 rounded-full">Arc Testnet</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={activity}>
                  <defs>
                    <linearGradient id="statsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="_id"
                    tick={{ fill: '#8892a0', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => v.slice(5)} // show MM-DD only
                  />
                  <YAxis
                    tick={{ fill: '#8892a0', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0f1822',
                      border: '0.5px solid #1e2530',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: 12,
                    }}
                    formatter={(value) => [parseFloat(value).toFixed(2) + ' USDC', 'Volume']}
                    labelFormatter={(label) => 'Date: ' + label}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#00D4FF"
                    strokeWidth={2}
                    fill="url(#statsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="bg-[#0f1822] border border-[#1e2530] rounded-2xl overflow-hidden mb-8">
              <div className="px-6 py-5 border-b border-[#1e2530] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold font-['Space_Grotesk'] text-white">Top Participants</p>
                  <p className="text-xs text-[#556] mt-0.5">Ranked by USDC volume</p>
                </div>
                <span className="text-[11px] text-[#556] border border-[#1e2530] px-3 py-1 rounded-full">
                  Testnet only
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e2530]">
                      {['RANK', 'WALLET', 'TRANSACTIONS', 'VOLUME', 'SUCCESS', 'LAST ACTIVE'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] tracking-widests text-[#556] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((w, i) => (
                      <tr key={w.address} className="border-b border-[#1e2530]/50 hover:bg-[#0a1520] transition-colors">
                        <td className="px-5 py-4">
                          <span className={'text-sm font-bold font-[\'Space_Grotesk\'] ' + (
                            i === 0 ? 'text-yellow-400' :
                            i === 1 ? 'text-[#aaa]' :
                            i === 2 ? 'text-amber-600' : 'text-[#556]'
                          )}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + w.rank}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-[#00D4FF]">{w.address}</td>
                        <td className="px-5 py-4 text-white">{w.totalTransactions.toLocaleString()}</td>
                        <td className="px-5 py-4 text-white font-semibold">{parseFloat(w.totalVolume).toLocaleString()} USDC</td>
                        <td className="px-5 py-4">
                          <span className={w.successRate >= 90 ? 'text-green-400' : 'text-amber-400'}>
                            {w.successRate}%
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#8892a0] text-xs">
                          {w.lastActivity ? new Date(w.lastActivity).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Powered by banner */}
          <div className="bg-[#0f1822] border border-[#1e2530] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xs text-[#556] mb-1 tracking-widests">INFRASTRUCTURE</p>
              <p className="text-white font-semibold font-['Space_Grotesk']">Powered by Arc Network + Circle USDC</p>
              <p className="text-xs text-[#8892a0] mt-1">
                SendArcRouter contract: <a
                  href="https://testnet.arcscan.app/address/0xd01Bbb99Ef57a82238591f3898D721fc2f7CDf50"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#00D4FF] hover:underline font-mono"
                >
                  0xd01B...Df50
                </a>
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/testnet"
                className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-all"
              >
                Try Testnet →
              </Link>
              <a
                href="https://testnet.arcscan.app/address/0xd01Bbb99Ef57a82238591f3898D721fc2f7CDf50"
                target="_blank"
                rel="noreferrer"
                className="border border-[#1e2530] text-[#8892a0] text-sm px-5 py-2.5 rounded-xl hover:border-[#00D4FF] hover:text-white transition-all"
              >
                View on ArcScan ↗
              </a>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}