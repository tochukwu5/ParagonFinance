import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useArcTestnet } from '../hooks/useArcTestnet'
import { useTestnet } from '../context/TestnetContext'
import { Card, StatusBadge } from '../components/UI'
import { Sidebar } from './Dashboard'

// ─── TRANSACTIONS PAGE ─────────────────────────────────────────────
export function Transactions() {
  const { account, isConnected, connect, isLoading } = useArcTestnet()
  const { transactions, stats, loadTransactions, isSyncing, backendOnline } = useTestnet()
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    if (account) {
      loadTransactions(account)
    }
  }, [account])

  const filtered = transactions
    .filter(tx => filter === 'all' || tx.status === filter)
    .sort((a, b) => sort === 'newest'
      ? new Date(b.createdAt) - new Date(a.createdAt)
      : new Date(a.createdAt) - new Date(b.createdAt)
    )

  const exportCsv = () => {
    if (!transactions.length) return
    const rows = [
      ['ID', 'Hash', 'To', 'Amount (USDC)', 'Gas (USDC)', 'Settlement (ms)', 'Status', 'Date'],
      ...transactions.map(tx => [
        tx.id, tx.hash, tx.to, tx.amount,
        tx.gasCost, tx.settlementTime, tx.status,
        tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sendarc-transactions.csv'
    a.click()
  }

  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      <Sidebar active="transactions" />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold font-['Space_Grotesk']">Transactions</h1>
            <p className="text-[#8892a0] text-sm mt-1">
              Full history of all your Arc Testnet USDC transfers
            </p>
            {account && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono text-[#556]">{account}</span>
                {backendOnline && (
                  <span className="text-[10px] text-green-400">● MongoDB</span>
                )}
                {isSyncing && (
                  <span className="text-[10px] text-[#8892a0] animate-pulse">Syncing...</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {account && (
              <button
                onClick={() => loadTransactions(account)}
                disabled={isSyncing}
                className="border border-[#1e2530] text-[#8892a0] text-xs px-3 py-2 rounded-lg hover:border-[#00D4FF] hover:text-white transition-all disabled:opacity-40"
              >
                {isSyncing ? 'Syncing...' : '↻ Refresh'}
              </button>
            )}
            <button
              onClick={exportCsv}
              disabled={!transactions.length}
              className="border border-[#1e2530] text-[#8892a0] text-xs px-4 py-2 rounded-lg hover:border-[#00D4FF] transition-all disabled:opacity-40"
            >
              ↓ Export CSV
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { l: 'TOTAL TXS', v: stats.totalTransactions },
            { l: 'TOTAL VOLUME', v: stats.totalVolume.toFixed(2) + ' USDC' },
            { l: 'GAS PAID', v: stats.totalGasPaid.toFixed(6) + ' USDC' },
            { l: 'AVG SETTLEMENT', v: stats.avgSettlementTime ? (stats.avgSettlementTime / 1000).toFixed(2) + 's' : '—' },
          ].map(s => (
            <Card key={s.l} className="p-4 text-center">
              <p className="text-[10px] tracking-widest text-[#8892a0] mb-1">{s.l}</p>
              <p className="text-lg font-bold text-[#00D4FF] font-['Space_Grotesk']">{s.v}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
          <div className="flex gap-2">
            {['all', 'confirmed', 'failed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={
                  'text-xs px-4 py-2 rounded-lg border font-semibold capitalize transition-all ' +
                  (filter === f
                    ? 'bg-[#0a2030] border-[#00D4FF] text-[#00D4FF]'
                    : 'border-[#1e2530] text-[#8892a0] hover:border-[#00D4FF]')
                }
              >
                {f}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-[#0f1822] border border-[#1e2530] text-[#8892a0] text-xs rounded-lg px-3 py-2 outline-none focus:border-[#00D4FF]"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {/* Not connected */}
        {!isConnected ? (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-4">🦊</div>
            <p className="font-semibold font-['Space_Grotesk'] mb-2">Connect your wallet to view transactions</p>
            <p className="text-[#8892a0] text-sm mb-6">
              Your transaction history is saved to MongoDB using your wallet address as your unique identifier.
            </p>
            <button
              onClick={connect}
              disabled={isLoading}
              className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all"
            >
              {isLoading ? 'Connecting...' : 'Connect MetaMask →'}
            </button>
          </Card>

        ) : isSyncing && transactions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <p className="font-semibold font-['Space_Grotesk'] mb-2 text-[#00D4FF]">Loading from MongoDB...</p>
            <p className="text-[#8892a0] text-sm">Fetching your transaction history</p>
          </Card>

        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="font-semibold font-['Space_Grotesk'] mb-2">No transactions yet</p>
            <p className="text-[#8892a0] text-sm mb-6">
              Send your first testnet USDC transaction to see it here.
            </p>
            <Link
              to="/testnet/send"
              className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-6 py-2.5 rounded-xl text-sm"
            >
              Send USDC →
            </Link>
          </Card>

        ) : (
          <Card className="overflow-hidden">
            <div className="px-5 py-3 border-b border-[#1e2530] flex justify-between items-center">
              <p className="text-[10px] tracking-widest text-[#8892a0]">
                {filtered.length} TRANSACTION{filtered.length !== 1 ? 'S' : ''} — ARC TESTNET
              </p>
              {backendOnline && (
                <span className="text-[10px] text-green-400">● Live from MongoDB</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2530]">
                    {['TX HASH', 'TO', 'AMOUNT', 'GAS PAID', 'SETTLEMENT', 'STATUS', 'DATE'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] tracking-widest text-[#8892a0] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(tx => (
                    <tr key={tx.id || tx._id} className="border-b border-[#0f1520] hover:bg-[#0f1822] transition-colors">
                      <td className="px-5 py-4">
                        <a
                          href={tx.hash ? 'https://testnet.arcscan.app/tx/' + tx.hash : '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-[#00D4FF] hover:underline"
                        >
                          {tx.hash ? tx.hash.slice(0, 6) + '...' + tx.hash.slice(-4) : '—'}
                        </a>
                        <p className="text-[10px] text-[#556] mt-0.5">{tx.id}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-[#8892a0]">
                        {tx.to ? tx.to.slice(0, 6) + '...' + tx.to.slice(-4) : '—'}
                        {tx.selfTransfer && (
                          <span className="ml-1 text-[10px] text-[#00D4FF]">(self)</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-white">{tx.amount} USDC</td>
                      <td className="px-5 py-4 text-green-400 text-xs">{tx.gasCost} USDC</td>
                      <td className="px-5 py-4 text-[#00D4FF] text-xs">
                        {tx.settlementTime ? (tx.settlementTime / 1000).toFixed(2) + 's' : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={
                          'text-[10px] px-2 py-0.5 rounded-full border font-bold ' +
                          (tx.status === 'confirmed'
                            ? 'bg-green-900/20 border-green-500 text-green-400'
                            : 'bg-red-900/20 border-red-500 text-red-400')
                        }>
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
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}

// ─── WALLET PAGE ────────────────────────────────────────────────────
export function WalletPage() {
  const { wallet } = useWallet()
  const { account, balance, isConnected, isCorrectNetwork, refreshBalance } = useArcTestnet()

  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      <Sidebar active="wallet" />
      <main className="flex-1 p-8 max-w-2xl">
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] mb-1">Wallet</h1>
        <p className="text-[#8892a0] text-sm mb-8">Your connected wallet and USDC balance</p>

        <Card glow className="p-6 mb-5">
          <p className="text-[10px] tracking-widest text-[#8892a0] mb-4">CONNECTED WALLET</p>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-[#e8821a] flex items-center justify-center text-white font-bold text-sm">MM</div>
            <div>
              <p className="font-semibold font-['Space_Grotesk']">MetaMask</p>
              <p className="text-xs text-[#8892a0] font-mono mt-0.5 break-all">
                {account || wallet?.address || 'Not connected'}
              </p>
            </div>
            <span className={
              'ml-auto text-xs border px-2 py-0.5 rounded-full ' +
              (isConnected
                ? 'border-green-500 text-green-400 bg-green-900/20'
                : 'border-[#556] text-[#556]')
            }>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-5 text-center mb-5">
            <p className="text-[10px] tracking-widest text-[#8892a0] mb-2">USDC BALANCE</p>
            <p className="text-4xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{balance}</p>
            <p className="text-sm text-[#8892a0] mt-1">USDC · Arc Testnet</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(account || '')}
              className="border border-[#1e2530] text-[#8892a0] py-2.5 rounded-xl text-sm hover:border-[#00D4FF] hover:text-white transition-all font-['Space_Grotesk']"
            >
              📋 Copy Address
            </button>
            <a
              href={'https://testnet.arcscan.app/address/' + account}
              target="_blank"
              rel="noreferrer"
              className="border border-[#1e2530] text-[#8892a0] py-2.5 rounded-xl text-sm hover:border-[#00D4FF] hover:text-white transition-all font-['Space_Grotesk'] text-center block">
              🔍 View on ArcScan
            </a>
          </div>
          <button
            onClick={refreshBalance}
            className="w-full mt-3 border border-[#1e2530] text-[#8892a0] py-2 rounded-xl text-xs hover:border-[#00D4FF] hover:text-white transition-all"
          >
            ↻ Refresh Balance
          </button>
        </Card>

        <Card className="p-5">
          <p className="text-[10px] tracking-widest text-[#8892a0] mb-4">NETWORK</p>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-[#8892a0]">Current Network</span>
            <span className={
              'text-xs font-semibold ' +
              (isCorrectNetwork ? 'text-green-400' : 'text-amber-400')
            }>
              {isCorrectNetwork ? '● Arc Testnet' : '⚠ Wrong Network'}
            </span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-[#8892a0]">Chain ID</span>
            <span className="text-sm text-white font-mono">5042002</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-[#8892a0]">Chain Type</span>
            <span className="text-xs border border-[#00D4FF] text-[#00D4FF] px-2 py-0.5 rounded-full">EVM Compatible</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#8892a0]">Gas Token</span>
            <span className="text-sm text-white">USDC (native)</span>
          </div>
        </Card>
      </main>
    </div>
  )
}

// ─── NOTIFICATIONS PAGE ──────────────────────────────────────────────
export function Notifications() {
  const { account } = useArcTestnet()
  const { transactions, loadTransactions } = useTestnet()
  const [notes, setNotes] = useState([])

  useEffect(() => {
    if (account) loadTransactions(account)
  }, [account])

  useEffect(() => {
    if (transactions.length > 0) {
      const txNotes = transactions.slice(0, 5).map((tx, i) => ({
        id: tx.id || i,
        type: tx.status === 'confirmed' ? 'success' : 'warning',
        title: tx.status === 'confirmed' ? 'Transaction Confirmed' : 'Transaction Pending',
        desc: (tx.id || 'TXN') + ' — ' + tx.amount + ' USDC sent · Gas: ' + tx.gasCost + ' USDC',
        time: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—',
        read: true,
      }))
      setNotes(txNotes)
    }
  }, [transactions])

  const icons = { success: '✅', info: 'ℹ️', warning: '⚠️' }

  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      <Sidebar active="notifications" />
      <main className="flex-1 p-8 max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold font-['Space_Grotesk']">Notifications</h1>
            <p className="text-[#8892a0] text-sm mt-1">
              {notes.length > 0 ? notes.length + ' recent transactions' : 'No activity yet'}
            </p>
          </div>
        </div>

        {notes.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-4">🔔</div>
            <p className="font-semibold font-['Space_Grotesk'] mb-2">No notifications yet</p>
            <p className="text-[#8892a0] text-sm mb-6">
              Your transaction confirmations will appear here.
            </p>
            <Link
              to="/testnet/send"
              className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-6 py-2.5 rounded-xl text-sm"
            >
              Send USDC →
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {notes.map(n => (
              <Card key={n.id} className="p-4 flex gap-4 items-start hover:border-[#00D4FF] transition-all cursor-pointer">
                <div className="text-xl flex-shrink-0">{icons[n.type]}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold font-['Space_Grotesk'] text-white">{n.title}</p>
                    <span className="text-[10px] text-[#556]">{n.time}</span>
                  </div>
                  <p className="text-xs text-[#8892a0] mt-1">{n.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ─── SETTINGS PAGE ───────────────────────────────────────────────────
export function Settings() {
  const [defaultCountry, setDefaultCountry] = useState('NG')
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      <Sidebar active="settings" />
      <main className="flex-1 p-8 max-w-2xl">
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] mb-1">Settings</h1>
        <p className="text-[#8892a0] text-sm mb-8">Manage your Paragon Finance preferences</p>

        <Card className="p-5 mb-4">
          <p className="text-[10px] tracking-widests text-[#8892a0] mb-4">PREFERENCES</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold">Default Country</p>
                <p className="text-xs text-[#8892a0]">Pre-select destination country</p>
              </div>
              <select
                value={defaultCountry}
                onChange={e => setDefaultCountry(e.target.value)}
                className="bg-[#0D1117] border border-[#1e2530] text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-[#00D4FF]"
              >
                <option value="NG">🇳🇬 Nigeria</option>
                <option value="GH">🇬🇭 Ghana</option>
                <option value="KE">🇰🇪 Kenya</option>
                <option value="ZA">🇿🇦 South Africa</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-5 mb-4">
          <p className="text-[10px] tracking-widest text-[#8892a0] mb-4">NOTIFICATIONS</p>
          <div className="space-y-4">
            {[
              { label: 'Email notifications', sub: 'Receive transaction confirmations via email', val: emailNotifs, set: setEmailNotifs },
              { label: 'Browser push notifications', sub: 'Get notified instantly in browser', val: pushNotifs, set: setPushNotifs },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="text-xs text-[#8892a0]">{s.sub}</p>
                </div>
                <button
                  onClick={() => s.set(!s.val)}
                  className={'w-11 h-6 rounded-full transition-all ' + (s.val ? 'bg-[#00D4FF]' : 'bg-[#1e2530]')}
                >
                  <span className={'block w-4 h-4 bg-white rounded-full mx-1 transition-all ' + (s.val ? 'translate-x-5' : 'translate-x-0')} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-[10px] tracking-widest text-[#8892a0] mb-4">ABOUT ParagonFinance</p>
          <div className="space-y-2 text-sm">
            {[
              { l: 'Version', v: '1.0.0-beta' },
              { l: 'Built on', v: 'Arc Network by Circle' },
              { l: 'Arc Network Status', v: '● Operational', vc: 'text-green-400' },
              { l: 'USDC Contract', v: 'Circle · 100% backed' },
            ].map(r => (
              <div key={r.l} className="flex justify-between border-b border-[#1e2530] pb-2">
                <span className="text-[#8892a0]">{r.l}</span>
                <span className={r.vc || 'text-white'}>{r.v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <a href="https://docs.arc.network" target="_blank" rel="noreferrer" className="text-xs text-[#00D4FF] hover:underline">Arc Docs →</a>
            <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className="text-xs text-[#00D4FF] hover:underline">ArcScan →</a>
          </div>
        </Card>
      </main>
    </div>
  )
}