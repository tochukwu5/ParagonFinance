import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useArcTestnet } from '../../hooks/useArcTestnet'
import { useTestnet } from '../../context/TestnetContext'
import { ARC_TESTNET, shortAddr, arcScanTx } from '../../utils/arcTestnet'
import { Card } from '../../components/UI'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

// ─── TRANSACTIONS PAGE ────────────────────────────────────────────────
export function TestnetTransactions() {
  const { account, isConnected, connect, isLoading, hasMetaMask } = useArcTestnet()
  const { transactions, stats, loadTransactions, isSyncing, backendOnline } = useTestnet()
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [hasLoaded, setHasLoaded] = useState(false)

  // Load transactions from MongoDB whenever account is available
  useEffect(() => {
    if (account && !hasLoaded) {
      loadTransactions(account).then(() => setHasLoaded(true))
    }
  }, [account])

  // Also reload when account changes
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
    const rows = [
      ['ID', 'Hash', 'To', 'Amount (USDC)', 'Gas (USDC)', 'Gas Used', 'Settlement (ms)', 'Status', 'Block', 'Timestamp'],
      ...transactions.map(tx => [
        tx.id, tx.hash, tx.to, tx.amount, tx.gasCost,
        tx.gasUsed, tx.settlementTime, tx.status, tx.blockNumber, tx.timestamp
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sendarc-testnet-transactions.csv'
    a.click()
  }

  return (
    <>
      <Navbar />
      <div className="bg-[#0D1117] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-16">

          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs text-[#8892a0]">
                <Link to="/testnet" className="hover:text-white transition-colors">Testnet Hub</Link>
                <span>/</span>
                <span className="text-white">Transactions</span>
              </div>
              <h1 className="text-2xl font-bold font-['Space_Grotesk']">Transaction History</h1>
              <p className="text-[#8892a0] text-sm mt-1">
                All your Arc Testnet USDC transfers — with gas costs and settlement times
              </p>
              {account && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-mono text-[#8892a0]">{account}</span>
                  {backendOnline && (
                    <span className="text-[10px] text-green-400 border border-green-500/30 bg-green-900/10 px-2 py-0.5 rounded-full">
                      {/* ● MongoDB connected */}
                    </span>
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
                className="border border-[#1e2530] text-[#8892a0] text-xs px-4 py-2 rounded-lg hover:border-[#00D4FF] hover:text-white transition-all disabled:opacity-40"
              >
                ↓ Export CSV
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { l: 'TOTAL TXS', v: stats.totalTransactions },
              { l: 'TOTAL VOLUME', v: stats.totalVolume.toFixed(2) + ' USDC' },
              { l: 'TOTAL GAS PAID', v: stats.totalGasPaid.toFixed(6) + ' USDC' },
              { l: 'AVG SETTLEMENT', v: stats.avgSettlementTime ? (stats.avgSettlementTime / 1000).toFixed(2) + 's' : '—' },
            ].map(s => (
              <Card key={s.l} className="p-4 text-center">
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-1">{s.l}</p>
                <p className="text-lg font-bold text-[#00D4FF] font-['Space_Grotesk']">{s.v}</p>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
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

          {/* Not connected state */}
          {!isConnected ? (
            <Card className="p-12 text-center">
              {/* <div className="text-4xl mb-4">🦊</div> */}
              <p className="font-semibold font-['Space_Grotesk'] mb-2">Connect your wallet to view transactions</p>
              <p className="text-[#8892a0] text-sm mb-6">
                Your transaction history is saved to MongoDB using your wallet address as your unique identifier.
              </p>
              <button
                onClick={connect}
                disabled={isLoading}
                className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Connecting...' : 'Connect MetaMask →'}
              </button>
            </Card>

          ) : isSyncing && transactions.length === 0 ? (
            /* Loading state */
            <Card className="p-12 text-center">
              <div className="text-4xl mb-4 animate-pulse">⏳</div>
              <p className="font-semibold font-['Space_Grotesk'] mb-2 text-[#00D4FF]">Loading from MongoDB...</p>
              <p className="text-[#8892a0] text-sm">Fetching your transaction history for</p>
              <p className="text-xs font-mono text-[#8892a0] mt-1">{account}</p>
            </Card>

          ) : filtered.length === 0 ? (
            /* No transactions yet */
            <Card className="p-12 text-center">
              <div className="text-4xl mb-4">📭</div>
              <p className="font-semibold font-['Space_Grotesk'] mb-2">No transactions yet</p>
              <p className="text-[#8892a0] text-sm mb-2">
                Send your first testnet USDC transaction to see it here.
              </p>
              <p className="text-xs text-[#556] mb-6">
                Your wallet: <span className="font-mono text-[#8892a0]">{account}</span>
              </p>
              <Link
                to="/testnet/send"
                className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-6 py-2.5 rounded-xl text-sm"
              >
                Send USDC →
              </Link>
            </Card>

          ) : (
            /* Transactions table */
            <Card className="overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1e2530] flex justify-between items-center">
                <p className="text-[10px] tracking-widest text-[#8892a0]">
                  {filtered.length} TRANSACTION{filtered.length !== 1 ? 'S' : ''} — ARC TESTNET
                </p>
                {backendOnline && (
                  <span className="text-[10px] text-green-400">● Live from MongoDB</span>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2530] bg-[#13181f]">
                    {['TX HASH', 'TO', 'AMOUNT', 'GAS PAID', 'GAS USED', 'SETTLEMENT', 'BLOCK', 'STATUS', 'TIME'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] tracking-widest text-[#8892a0] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(tx => (
                    <tr key={tx.id || tx._id} className="border-b border-[#0f1520] hover:bg-[#0f1822] transition-colors">
                      <td className="px-4 py-3.5">
                        <a
                          href={'https://testnet.arcscan.app/tx/' + tx.hash}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-mono text-[#00D4FF] hover:underline"
                        >
                          {tx.hash ? tx.hash.slice(0, 6) + '...' + tx.hash.slice(-4) : '—'}
                        </a>
                        <p className="text-[10px] text-[#556] mt-0.5">{tx.id}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-mono text-[#8892a0]">
                          {tx.to ? tx.to.slice(0, 6) + '...' + tx.to.slice(-4) : '—'}
                        </p>
                        {tx.to === account && (
                          <p className="text-[10px] text-[#00D4FF]">own wallet</p>
                        )}
                        {tx.selfTransfer && (
                          <p className="text-[10px] text-[#00D4FF]">self transfer</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-white">{tx.amount} USDC</td>
                      <td className="px-4 py-3.5 text-green-400 font-mono text-xs">{tx.gasCost} USDC</td>
                      <td className="px-4 py-3.5 text-[#8892a0] text-xs">
                        {tx.gasUsed ? tx.gasUsed.toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-[#00D4FF] text-xs font-semibold">
                        {tx.settlementTime ? (tx.settlementTime / 1000).toFixed(3) + 's' : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-[#8892a0] text-xs">
                        {tx.blockNumber ? '#' + tx.blockNumber.toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={
                          'text-[10px] px-2 py-0.5 rounded-full border font-bold ' +
                          (tx.status === 'confirmed'
                            ? 'bg-green-900/20 border-green-500 text-green-400'
                            : 'bg-red-900/20 border-red-500 text-red-400')
                        }>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#8892a0] text-xs whitespace-nowrap">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

// ─── LEADERBOARD PAGE ─────────────────────────────────────────────────
export function TestnetLeaderboard() {
  const { account, connect, isLoading } = useArcTestnet()
  const { leaderboard, loadLeaderboard, stats, loadTransactions, backendOnline } = useTestnet()

  useEffect(() => {
    loadLeaderboard()
  }, [])

  useEffect(() => {
    if (account) {
      loadTransactions(account)
    }
  }, [account])

  const localEntry = account ? {
    rank: 1,
    address: account,
    totalTransactions: stats.totalTransactions,
    totalVolume: stats.totalVolume.toFixed(2),
    totalGasPaid: stats.totalGasPaid.toFixed(6),
    avgSettlement: stats.avgSettlementTime
      ? (stats.avgSettlementTime / 1000).toFixed(2) + 's'
      : '—',
    successRate: stats.successRate,
    isYou: true,
  } : null

  const displayLeaderboard = leaderboard.length > 0
    ? leaderboard.map(entry => ({
        ...entry,
        isYou: entry.address === account?.toLowerCase(),
      }))
    : localEntry ? [localEntry] : []

  return (
    <>
      <Navbar />
      <div className="bg-[#0D1117] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-16">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center gap-2 mb-2 text-xs text-[#8892a0] justify-center">
              <Link to="/testnet" className="hover:text-white transition-colors">Testnet Hub</Link>
              <span>/</span>
              <span className="text-white">Leaderboard</span>
            </div>
            <div className="text-5xl mb-4">🏆</div>
            <h1 className="text-3xl font-bold font-['Space_Grotesk'] mb-3">Testnet Leaderboard</h1>
            <p className="text-[#8892a0] text-sm max-w-md mx-auto leading-relaxed">
              Top participants on Arc Testnet — ranked by volume, transactions, and activity.
              Every transfer is recorded to MongoDB using your wallet address.
            </p>
            {backendOnline && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-[10px] text-green-400 border border-green-500/30 bg-green-900/10 px-3 py-1 rounded-full">
                  ● Live data from MongoDB
                </span>
              </div>
            )}
          </div>

          {/* Your stats highlight */}
          {account ? (
            <div className="bg-[#0a2030] border border-[#00D4FF]/40 rounded-2xl p-6 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-[10px] tracking-[2px] text-[#00D4FF] font-['Space_Grotesk'] mb-1">YOUR TESTNET PROFILE</p>
                  <p className="font-mono text-white text-sm break-all">{account}</p>
                  <p className="text-[10px] text-[#8892a0] mt-1">
                    Unique identifier in MongoDB — your stats are permanently saved
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-6 text-center flex-shrink-0">
                  {[
                    { l: 'Transactions', v: stats.totalTransactions },
                    { l: 'Volume', v: stats.totalVolume.toFixed(2) + ' USDC' },
                    { l: 'Success Rate', v: stats.successRate + '%' },
                  ].map(s => (
                    <div key={s.l}>
                      <p className="text-xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{s.v}</p>
                      <p className="text-[10px] text-[#8892a0] mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0f1822] border border-[#1e2530] rounded-2xl p-6 mb-8 text-center">
              <p className="text-[#8892a0] text-sm mb-3">
                Connect your wallet to see your profile and stats
              </p>
              <button
                onClick={connect}
                disabled={isLoading}
                className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all"
              >
                {isLoading ? 'Connecting...' : 'Connect MetaMask →'}
              </button>
            </div>
          )}

          {/* Leaderboard table */}
          <Card className="overflow-hidden mb-8">
            <div className="px-5 py-4 border-b border-[#1e2530] flex justify-between items-center">
              <p className="text-[10px] tracking-widest text-[#8892a0]">RANKED PARTICIPANTS — ARC TESTNET</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#556]">Ranked by volume</span>
                <button
                  onClick={loadLeaderboard}
                  className="text-[10px] text-[#00D4FF] hover:underline ml-2"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>
            {displayLeaderboard.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">📊</div>
                <p className="font-semibold font-['Space_Grotesk'] mb-2">No participants yet</p>
                <p className="text-[#8892a0] text-sm mb-4">Be the first to appear on the leaderboard.</p>
                <Link to="/testnet/send" className="text-[#00D4FF] text-sm hover:underline">
                  Send your first transaction →
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2530] bg-[#13181f]">
                    {['RANK', 'WALLET', 'TRANSACTIONS', 'VOLUME', 'GAS PAID', 'AVG SETTLEMENT', 'SUCCESS RATE'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] tracking-widest text-[#8892a0] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayLeaderboard.map((entry, i) => (
                    <tr
                      key={entry.address}
                      className={
                        'border-b border-[#0f1520] transition-colors ' +
                        (entry.isYou ? 'bg-[#0a1a2e] hover:bg-[#0a2030]' : 'hover:bg-[#0f1822]')
                      }
                    >
                      <td className="px-5 py-4">
                        <span className={
                          'text-lg font-bold font-["Space_Grotesk"] ' +
                          (i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-[#556]')
                        }>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs text-white">
                          {entry.address ? entry.address.slice(0, 6) + '...' + entry.address.slice(-4) : '—'}
                        </p>
                        {entry.isYou && (
                          <span className="text-[10px] text-[#00D4FF] font-semibold">← You</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-[#00D4FF]">{entry.totalTransactions}</td>
                      <td className="px-5 py-4 font-semibold text-white">{entry.totalVolume} USDC</td>
                      <td className="px-5 py-4 text-green-400 text-xs font-mono">{entry.totalGasPaid} USDC</td>
                      <td className="px-5 py-4 text-[#00D4FF] text-xs">{entry.avgSettlement}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#1e2530] rounded-full overflow-hidden max-w-[60px]">
                            <div
                              className="h-full bg-gradient-to-r from-[#00D4FF] to-green-400 rounded-full"
                              style={{ width: entry.successRate + '%' }}
                            />
                          </div>
                          <span className="text-xs text-green-400 font-semibold">{entry.successRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* CTA */}
          <div className="text-center">
            <p className="text-[#8892a0] text-sm mb-4">
              Build your testnet profile — every transaction is saved permanently to MongoDB
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/testnet/send"
                className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm"
              >
                Send USDC →
              </Link>
              <Link
                to="/testnet/transactions"
                className="border border-[#1e2530] text-[#8892a0] px-6 py-3 rounded-xl hover:border-[#00D4FF] hover:text-white transition-all text-sm"
              >
                View My History
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}