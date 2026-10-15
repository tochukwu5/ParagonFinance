import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { Card } from '../components/UI'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useTestnet } from '../context/TestnetContext'
import { useArcTestnet } from '../hooks/useArcTestnet'
import RewardsPanel from '../components/RewardsPanel'

// Same explorer link this page used before. The Transactions/Wallet pages use
// testnet.arcscan.app — pick one and change it here.
const EXPLORER = 'https://explorer.arc.io'

// NAV_ITEMS — Send Money is commented out for testnet phase.
// It will be re-enabled when Arc mainnet launches and /send route goes live.
const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: '📊', path: '/dashboard' },
  // { id: 'send', label: 'Send Money', icon: '💸', path: '/send' }, // Mainnet only — re-enable on launch
  { id: 'transactions', label: 'Transactions', icon: '📋', path: '/dashboard/transactions' },
  { id: 'rates',        label: 'Exchange Rates',icon: '💱', path: '/rates' },
]

const ACCOUNT_ITEMS = [
  { id: 'wallet',        label: 'Wallet',        icon: '👛', path: '/dashboard/wallet' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', path: '/dashboard/notifications' },
  { id: 'settings',      label: 'Settings',      icon: '⚙️', path: '/dashboard/settings' },
]

function Sidebar({ active }) {
  const { wallet, disconnect } = useWallet()
  const { disconnect: arcDisconnect } = useArcTestnet()
  const navigate = useNavigate()

  return (
    <aside className="w-60 flex-shrink-0 bg-[#0D1117] border-r border-[#1e2530] min-h-screen flex flex-col">
      <div className="p-5 border-b border-[#1e2530]">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.jpg" alt="ParagonFinance" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-['Space_Grotesk'] text-lg font-bold text-white">Paragon</span>
          <span className="font-['Space_Grotesk'] text-lg font-bold text-[#00D4FF] -ml-1">Finance</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <p className="text-[10px] tracking-widests text-[#556] mb-2 px-2">MAIN</p>
        {NAV_ITEMS.map(n => (
          <Link key={n.id} to={n.path}
            className={'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-[\'Space_Grotesk\'] font-medium transition-all ' + (
              active === n.id
                ? 'bg-[#0a2030] text-[#00D4FF] border border-[#00D4FF]/30'
                : 'text-[#8892a0] hover:text-white hover:bg-[#0f1822]'
            )}
          >
            <span className="text-base">{n.icon}</span>{n.label}
          </Link>
        ))}

        {/* Testnet shortcut — always accessible during testnet phase */}
        <Link
        to="/app"
          className={'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-[\'Space_Grotesk\'] font-medium transition-all ' + (
            active === 'testnet'
              ? 'bg-[#0a2030] text-[#00D4FF] border border-[#00D4FF]/30'
              : 'text-[#8892a0] hover:text-white hover:bg-[#0f1822]'
          )}
        >
          {/* <span className="text-base">⚡</span>Testnet Hub */}
        </Link>

        <p className="text-[10px] tracking-widests text-[#556] mb-2 px-2 mt-6">ACCOUNT</p>
        {ACCOUNT_ITEMS.map(n => (
          <Link key={n.id} to={n.path}
            className={'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-[\'Space_Grotesk\'] font-medium transition-all ' + (
              active === n.id
                ? 'bg-[#0a2030] text-[#00D4FF] border border-[#00D4FF]/30'
                : 'text-[#8892a0] hover:text-white hover:bg-[#0f1822]'
            )}
          >
            <span className="text-base">{n.icon}</span>{n.label}
          </Link>
        ))}
      </nav>

      {wallet && (
        <div className="p-4 border-t border-[#1e2530]">
          <div className="bg-[#0f1822] border border-[#1e2530] rounded-xl p-3">
            <p className="text-[10px] tracking-widests text-[#556] mb-1">CONNECTED WALLET</p>
            <p className="text-xs text-[#00D4FF] font-mono mb-1">{wallet.shortAddress}</p>
            <p className="text-sm font-bold text-white font-['Space_Grotesk']">
              <span className="live-dot inline-block mr-1.5" />{wallet.balance} USDC
            </p>
            <button
              onClick={() => {
                arcDisconnect()
                disconnect()
                navigate('/')
              }}
              className="text-[10px] text-red-400 hover:underline mt-2 block"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

// ─── Formatting helpers ─────────────────────────────────────────────

const short = (s) => (s ? s.slice(0, 6) + '…' + s.slice(-4) : '—')

const money = (n, max = 2) => {
  const v = Number(n)
  return Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: max }) : '0'
}

// Gas arrives in two shapes (raw wei-style integers and already-scaled
// decimals); this is the same correction the page applied before.
const gasValue = (raw) => {
  const g = parseFloat(raw || 0)
  if (!Number.isFinite(g)) return 0
  return g > 1 ? g / 1e12 : g
}

const fmtGas = (v) => {
  if (!v) return '0'
  if (v < 0.000001) return '< 0.000001'
  return String(Number(v.toFixed(6)))
}

function fmtDay(d) {
  if (!d) return '—'
  const date = new Date(d)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString(undefined, sameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' })
}

const fmtClock = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''

const STATUS_TEXT = {
  confirmed: { label: 'Confirmed', cls: 'text-green-400' },
  failed: { label: 'Failed', cls: 'text-red-400' },
}

// Last six calendar months, ending with the current one, built from the
// user's own confirmed transfers.
function monthlyVolume(txs) {
  const now = new Date()
  const buckets = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      key: d.getFullYear() + '-' + d.getMonth(),
      month: d.toLocaleDateString(undefined, { month: 'short' }),
      usdc: 0,
    })
  }
  for (const tx of txs) {
    if (tx.status !== 'confirmed' || !tx.createdAt) continue
    const d = new Date(tx.createdAt)
    const b = buckets.find((x) => x.key === d.getFullYear() + '-' + d.getMonth())
    if (b) b.usdc += Number(tx.amount) || 0
  }
  return buckets.map((b) => ({ ...b, usdc: Math.round(b.usdc * 100) / 100 }))
}

export default function Dashboard() {
  const { wallet } = useWallet()
  const { stats: testnetStats, transactions: testnetTxs, loadTransactions } = useTestnet()

  useEffect(() => {
    if (wallet?.address) {
      loadTransactions(wallet.address)
    }
  }, [wallet])

  const monthly = useMemo(() => monthlyVolume(testnetTxs), [testnetTxs])
  const hasVolume = monthly.some((m) => m.usdc > 0)

  if (!wallet) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center text-center px-6">
        <div>
          <p className="text-[#8892a0] mb-4">Connect your wallet to access the dashboard</p>
          <Link to="/connect" className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-6 py-3 rounded-xl">
            Connect Wallet
          </Link>
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Volume sent', value: money(testnetStats.totalVolume), unit: 'USDC' },
    { label: 'Transfers', value: money(testnetStats.totalTransactions, 0) },
    { label: 'Network fees', value: fmtGas(gasValue(testnetStats.totalGasPaid)), unit: 'ARC' },
    { label: 'Success rate', value: money(testnetStats.successRate, 1) + '%' },
  ]

  const recent = testnetTxs.slice(0, 5)

  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      {/* <Sidebar active="dashboard" /> */}
      <main className="flex-1 p-5 sm:p-8 max-w-6xl">

        <div className="flex justify-between items-end gap-4 flex-wrap mb-8">
          <div>
            <h1 className="text-2xl font-bold font-['Space_Grotesk']">Dashboard</h1>
            <p className="text-[#8892a0] text-sm mt-1">
              Welcome back. Here's what's happened on{' '}
              <span className="font-mono text-xs text-white" title={wallet.address}>
                {wallet.shortAddress || short(wallet.address)}
              </span>
              .
            </p>
          </div>
          <Link
            to="/app"
            className="border border-[#00D4FF] text-[#00D4FF] font-['Space_Grotesk'] font-semibold px-4 py-2 rounded-xl hover:bg-[#0a2030] transition-all text-sm"
          >
            Open app
          </Link>
          {/* Send Money button (mainnet) — disabled until Arc mainnet launches */}
          {/* <Link to="/send" className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm"> + Send Money </Link> */}
        </div>

        <div className="mb-8">
          <RewardsPanel account={wallet.address} />
        </div>

        {/* One strip instead of four separate cards */}
        <Card className="grid grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={
                'px-5 py-4 border-[#1e2530] ' +
                (i % 2 === 1 ? 'border-l ' : '') +
                (i >= 2 ? 'border-t lg:border-t-0 ' : '') +
                (i > 0 ? 'lg:border-l' : '')
              }
            >
              <p className="text-xs text-[#8892a0]">{s.label}</p>
              <p className="text-2xl font-semibold text-white font-['Space_Grotesk'] mt-1 tabular-nums">
                {s.value}
                {s.unit && <span className="text-sm font-normal text-[#8892a0] ml-1.5">{s.unit}</span>}
              </p>
            </div>
          ))}
        </Card>

        {/* Monthly volume, from the wallet's own confirmed transfers. */}
        <Card className="p-5 mb-8">
          <div className="flex justify-between items-baseline mb-4">
            <p className="text-sm font-semibold font-['Space_Grotesk']">Monthly volume</p>
            <span className="text-xs text-[#8892a0]">USDC, last 6 months</span>
          </div>
          {hasVolume ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00D4FF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#8892a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8892a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [money(v) + ' USDC', 'Sent']}
                  contentStyle={{ background: '#0f1822', border: '0.5px solid #1e2530', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="usdc" stroke="#00D4FF" strokeWidth={2} fill="url(#cg)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[#8892a0] py-10 text-center">
              No confirmed transfers in the last six months.
            </p>
          )}
        </Card>

        {/* Recent transactions */}
        <Card className="overflow-hidden">
          <div className="flex justify-between items-baseline px-5 py-4 border-b border-[#1e2530]">
            <p className="text-sm font-semibold font-['Space_Grotesk']">Recent transactions</p>
            <Link to="/dashboard/transactions" className="text-xs text-[#00D4FF] hover:underline">
              See all
            </Link>
          </div>

          {recent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-[#8892a0] border-b border-[#1e2530]">
                    <th className="px-5 py-2.5 text-left font-normal">Date</th>
                    <th className="px-5 py-2.5 text-left font-normal">Recipient</th>
                    <th className="px-5 py-2.5 text-right font-normal">Amount</th>
                    <th className="px-5 py-2.5 text-right font-normal">Fee</th>
                    <th className="px-5 py-2.5 text-right font-normal">Settled in</th>
                    <th className="px-5 py-2.5 text-left font-normal">Status</th>
                    <th className="px-5 py-2.5 text-right font-normal">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((tx) => {
                    const st = STATUS_TEXT[tx.status] || { label: 'Pending', cls: 'text-amber-400' }
                    return (
                      <tr
                        key={tx.id || tx._id || tx.hash}
                        className="border-b border-[#0f1520] last:border-0 hover:bg-[#0f1822] transition-colors"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-white">{fmtDay(tx.createdAt)}</span>
                          <span className="block text-[11px] text-[#556]">{fmtClock(tx.createdAt)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-[#8892a0]">
                          {tx.selfTransfer ? (
                            <span className="text-white">Your wallet</span>
                          ) : (
                            <span className="font-mono text-xs" title={tx.to}>{short(tx.to)}</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right text-white font-medium tabular-nums whitespace-nowrap">
                          {money(tx.amount, 6)} <span className="text-[#8892a0] font-normal">USDC</span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-xs text-[#8892a0] tabular-nums whitespace-nowrap">
                          {fmtGas(gasValue(tx.gasCost))} ARC
                        </td>
                        <td className="px-5 py-3.5 text-right text-xs text-[#8892a0] tabular-nums">
                          {tx.settlementTime ? (tx.settlementTime / 1000).toFixed(1) + 's' : '—'}
                        </td>
                        <td className={'px-5 py-3.5 text-xs ' + st.cls}>{st.label}</td>
                        <td className="px-5 py-3.5 text-right">
                          {tx.hash ? (
                            <a
                              href={EXPLORER + '/tx/' + tx.hash}
                              target="_blank"
                              rel="noreferrer"
                              title={tx.hash}
                              className="font-mono text-xs text-[#00D4FF] hover:underline"
                            >
                              {short(tx.hash)}
                            </a>
                          ) : (
                            <span className="text-[#556]">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            // Never show invented rows here — an empty list is the truth.
            <div className="py-12 text-center">
              <p className="text-sm text-white mb-1">Nothing here yet</p>
              <p className="text-xs text-[#8892a0] mb-5">
                Transfers, swaps and bridges will show up once they confirm.
              </p>
              <Link
                to="/app"
                className="inline-block bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all"
              >
                Make your first transfer
              </Link>
            </div>
          )}
        </Card>

      </main>
    </div>
  )
}

export { Sidebar }