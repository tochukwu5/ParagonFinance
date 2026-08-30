import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { MOCK_TRANSACTIONS } from '../data/constants'
import { Card, StatusBadge } from '../components/UI'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useTestnet } from '../context/TestnetContext'
import { useArcTestnet } from '../hooks/useArcTestnet'

const CHART_DATA = [
  { month: 'Dec', usdc: 120 }, { month: 'Jan', usdc: 340 }, { month: 'Feb', usdc: 280 },
  { month: 'Mar', usdc: 520 }, { month: 'Apr', usdc: 740 }, { month: 'May', usdc: 840 },
]

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

// Global regions breakdown — replaces Africa-only country stats
const GLOBAL_REGIONS = [
  { flag: '🌍', name: 'Americas',        pct: 42 },
  { flag: '🌎', name: 'Africa',      pct: 28 },
  { flag: '🌏', name: 'Europe & ME',  pct: 20 },
  { flag: '🌐', name: 'Asia Pacific',   pct: 10 },
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
        <Link to="/testnet"
          className={'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-[\'Space_Grotesk\'] font-medium transition-all ' + (
            active === 'testnet'
              ? 'bg-[#0a2030] text-[#00D4FF] border border-[#00D4FF]/30'
              : 'text-[#8892a0] hover:text-white hover:bg-[#0f1822]'
          )}
        >
          <span className="text-base">⚡</span>Testnet Hub
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

export default function Dashboard() {
  const { wallet } = useWallet()
  const { stats: testnetStats, transactions: testnetTxs, loadTransactions, backendOnline } = useTestnet()
  const navigate = useNavigate()

  useEffect(() => {
    if (wallet?.address) {
      loadTransactions(wallet.address)
    }
  }, [wallet])

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

  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      {/* <Sidebar active="dashboard" /> */}
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold font-['Space_Grotesk']">Dashboard</h1>
            <p className="text-[#8892a0] text-sm mt-1">
              Welcome back here's your testnet activity
      
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/testnet/send"
              className="border border-[#00D4FF] text-[#00D4FF] font-['Space_Grotesk'] font-bold px-4 py-2.5 rounded-xl hover:bg-[#0a2030] transition-all text-sm"
            >
              ⚡ Testnet
            </Link>
            {/* Send Money button (mainnet) — disabled until Arc mainnet launches */}
            {/* <Link to="/send" className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm"> + Send Money </Link> */}
            <button
              disabled
              title="Available at mainnet launch"
              className="bg-[#1e2530] text-[#556] font-['Space_Grotesk'] font-bold px-5 py-2.5 rounded-xl cursor-not-allowed text-sm flex items-center gap-1.5"
            >
              (🔒 Mainnet Coming Soon)
            </button>
          </div>
        </div>

        {/* Stat cards — real data from MongoDB */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'TOTAL SENT',
              value: testnetStats.totalVolume.toFixed(2) + ' USDC',
              sub: testnetStats.totalVolume > 0 ? '↑ Testnet volume' : 'No transactions yet',
              subColor: testnetStats.totalVolume > 0 ? 'text-green-400' : 'text-[#556]',
            },
            {
              label: 'TRANSACTIONS',
              value: testnetStats.totalTransactions,
              // sub: backendOnline ? 'Saved to MongoDB' : 'Local session only',
              subColor: 'text-[#8892a0]',
            },
            {
              label: 'GAS PAID',
              value: (testnetStats.totalGasPaid > 1
                ? testnetStats.totalGasPaid / 1e12
                : testnetStats.totalGasPaid) < 0.000001
                  ? '~0 ARC'
                  : ((testnetStats.totalGasPaid > 1
                      ? testnetStats.totalGasPaid / 1e12
                      : testnetStats.totalGasPaid).toFixed(9) + ' ARC'),
              sub: 'Arc Network fees',
              subColor: 'text-[#8892a0]',
            },
            {
              label: 'SUCCESS RATE',
              value: testnetStats.successRate + '%',
              // sub: testnetStats.uniqueRecipients + ' unique recipient' + (testnetStats.uniqueRecipients !== 1 ? 's' : ''),
              subColor: 'text-[#8892a0]',
            },
          ].map(s => (
            <Card key={s.label} className="p-5">
              <p className="text-[10px] tracking-widests text-[#8892a0] mb-2">{s.label}</p>
              <p className="text-3xl font-bold text-[#00D4FF] font-['Space_Grotesk'] mb-1">{s.value}</p>
              <p className={'text-xs ' + s.subColor}>{s.sub}</p>
            </Card>
          ))}
        </div>

        {/* Chart + Global Regions */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          <Card className="lg:col-span-3 p-5">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-semibold font-['Space_Grotesk']">MONTHLY VOLUME (USDC)</p>
              <span className="text-xs text-[#8892a0]">Last 6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00D4FF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#8892a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8892a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f1822', border: '0.5px solid #1e2530', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                <Area type="monotone" dataKey="usdc" stroke="#00D4FF" strokeWidth={2} fill="url(#cg)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Global regions — replaces Africa-only breakdown */}
          <Card className="lg:col-span-2 p-5">
            <p className="text-sm font-semibold font-['Space_Grotesk'] mb-4">BY REGION</p>
            <div className="space-y-4">
              {GLOBAL_REGIONS.map(r => (
                <div key={r.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="flex items-center gap-2">
                      <span>{r.flag}</span>
                      <span className="text-white font-['Space_Grotesk'] font-semibold">{r.name}</span>
                    </span>
                    <span className="text-[#00D4FF] font-bold">{r.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[#1e2530] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00FFCC] rounded-full"
                      style={{ width: r.pct + '%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-[#1e2530]">
            <p className="text-sm font-semibold font-['Space_Grotesk']">
              RECENT TRANSACTIONS
              {testnetTxs.length > 0 && backendOnline && (
                <span className="ml-2 text-[10px] text-green-400 font-normal">from MongoDB</span>
              )}
            </p>
            <Link to="/testnet/transactions" className="text-xs text-[#00D4FF] hover:underline">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            {testnetTxs.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2530]">
                    {['TX HASH', 'TO', 'AMOUNT', 'GAS PAID', 'SETTLEMENT', 'STATUS', 'DATE'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] tracking-widests text-[#8892a0] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {testnetTxs.slice(0, 5).map(tx => (
                    <tr key={tx.id || tx._id} className="border-b border-[#0f1520] hover:bg-[#0f1822] transition-colors">
                      <td className="px-5 py-4">
                        <a
                          href={'https://testnet.arcscan.app/tx/' + tx.hash}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-[#00D4FF] hover:underline"
                        >
                          {tx.hash ? tx.hash.slice(0, 6) + '...' + tx.hash.slice(-4) : '—'}
                        </a>
                        <p className="text-[10px] text-[#556]">{tx.sourceChain || 'Arc Testnet'}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-[#8892a0]">
                        {tx.to ? tx.to.slice(0, 6) + '...' + tx.to.slice(-4) : '—'}
                        {tx.selfTransfer && (
                          <span className="ml-1 text-[10px] text-[#00D4FF]">(self)</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-white">{tx.amount} USDC</td>
                      <td className="px-5 py-4 text-green-400 text-xs">
                        {(() => {
                          const g = parseFloat(tx.gasCost || 0)
                          const corrected = g > 1 ? g / 1e12 : g
                          return corrected < 0.000000001 ? '~0 ARC' : corrected.toFixed(9) + ' ARC'
                        })()}
                      </td>
                      <td className="px-5 py-4 text-[#00D4FF] text-xs">
                        {tx.settlementTime ? (tx.settlementTime / 1000).toFixed(2) + 's' : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={'text-[10px] px-2 py-0.5 rounded-full border font-bold ' + (
                          tx.status === 'confirmed'
                            ? 'bg-green-900/20 border-green-500 text-green-400'
                            : 'bg-red-900/20 border-red-500 text-red-400'
                        )}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#8892a0]">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2530]">
                    {['TRANSACTION', 'TO', 'AMOUNT SENT', 'THEY RECEIVED', 'FEE', 'STATUS', 'TIME'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] tracking-widests text-[#8892a0] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TRANSACTIONS.map(tx => (
                    <tr key={tx.id} className="border-b border-[#0f1520] hover:bg-[#0f1822] transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs text-white">{tx.id}</p>
                        <p className="text-[10px] text-[#556]">{tx.network}</p>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <span className="mr-1">{tx.country.flag}</span>
                        <span className="font-mono text-[#8892a0]">{tx.to}</span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-white">{tx.sent} USDC</td>
                      <td className="px-5 py-4 font-bold text-[#00D4FF]">{tx.received}</td>
                      <td className="px-5 py-4 text-green-400">{tx.fee}</td>
                      <td className="px-5 py-4"><StatusBadge status={tx.status} /></td>
                      <td className="px-5 py-4 text-xs text-[#8892a0]">{tx.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Testnet prompt when no transactions yet */}
        {testnetStats.totalTransactions === 0 && (
          <div className="mt-4 bg-[#0a2030] border border-[#00D4FF]/30 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold font-['Space_Grotesk'] text-white mb-1">
                Start your testnet activity
              </p>
              <p className="text-xs text-[#8892a0]">
                Send your first USDC on the testnet — stats and transaction history will appear here live from MongoDB.
              </p>
            </div>
            <Link
              to="/testnet"
              className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all flex-shrink-0 ml-4"
            >
              Go to Testnet →
            </Link>
          </div>
        )}

      </main>
    </div>
  )
}

export { Sidebar }