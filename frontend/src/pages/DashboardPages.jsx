import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useArcTestnet } from '../hooks/useArcTestnet'
import { useTestnet } from '../context/TestnetContext'
import { Card } from '../components/UI'

// ─── Shared bits ────────────────────────────────────────────────────

// Change these two if the explorer or chain ever moves. They were hard-coded
// further down before, which is how a stale URL ends up in three places.
const EXPLORER = 'https://testnet.arcscan.app'
const CHAIN_ID = '5042002'

const short = (s) => (s ? s.slice(0, 6) + '…' + s.slice(-4) : '—')

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''

const fmtNum = (n, max = 2) => {
  const v = Number(n)
  return Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: max }) : '—'
}

const fmtSettle = (ms) => (ms ? (ms / 1000).toFixed(1) + 's' : '—')

function ago(d) {
  if (!d) return ''
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return Math.floor(s / 60) + 'm ago'
  if (s < 86400) return Math.floor(s / 3600) + 'h ago'
  if (s < 86400 * 7) return Math.floor(s / 86400) + 'd ago'
  return fmtDate(d)
}

const STATUS = {
  confirmed: { label: 'Confirmed', dot: 'bg-green-400', text: 'text-green-400' },
  failed: { label: 'Failed', dot: 'bg-red-400', text: 'text-red-400' },
  pending: { label: 'Pending', dot: 'bg-amber-400', text: 'text-amber-400' },
}

function Status({ value }) {
  const s = STATUS[value] || STATUS.pending
  return (
    <span className={'text-xs ' + s.text}>{s.label}</span>
  )
}

const primaryBtn =
  "inline-block bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-all"

const quietBtn =
  'border border-[#1e2530] text-[#8892a0] text-xs px-3.5 py-2 rounded-lg hover:border-[#00D4FF] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed'

// CSV cells: quote anything with commas/quotes/newlines, and defuse cells that
// a spreadsheet would read as a formula.
function csvCell(v) {
  let s = v == null ? '' : String(v)
  if (/^[=+\-@]/.test(s)) s = "'" + s
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

// ─── TRANSACTIONS PAGE ─────────────────────────────────────────────
export function Transactions() {
  const { account, isConnected, isLoading } = useArcTestnet()
  const { transactions, stats, loadTransactions, isSyncing } = useTestnet()
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    if (account) loadTransactions(account)
  }, [account])

  const filtered = transactions
    .filter((tx) => filter === 'all' || tx.status === filter)
    .sort((a, b) =>
      sort === 'newest'
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt)
    )

  const exportCsv = () => {
    if (!transactions.length) return
    const rows = [
      ['ID', 'Hash', 'To', 'Amount (USDC)', 'Gas (USDC)', 'Settlement (ms)', 'Status', 'Date'],
      ...transactions.map((tx) => [
        tx.id, tx.hash, tx.to, tx.amount, tx.gasCost, tx.settlementTime, tx.status,
        tx.createdAt ? new Date(tx.createdAt).toISOString() : '',
      ]),
    ]
    const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'paragonfinance-transactions.csv'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const summary = [
    { l: 'Transactions', v: fmtNum(stats.totalTransactions, 0) },
    { l: 'Volume', v: fmtNum(stats.totalVolume) + ' USDC' },
    { l: 'Gas paid', v: fmtNum(stats.totalGasPaid, 6) + ' USDC' },
    { l: 'Avg. settlement', v: fmtSettle(stats.avgSettlementTime) },
  ]

  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      <main className="flex-1 p-5 sm:p-8">
        <div className="flex justify-between items-start gap-4 flex-wrap mb-7">
          <div>
            <h1 className="text-2xl font-bold font-['Space_Grotesk']">Transactions</h1>
            <p className="text-[#8892a0] text-sm mt-1">
              {account ? (
                <>
                  Activity for <span className="font-mono text-xs" title={account}>{short(account)}</span>
                  {isSyncing && <span className="ml-2 text-xs animate-pulse">Updating…</span>}
                </>
              ) : (
                'Everything you send from your wallet shows up here'
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {account && (
              <button onClick={() => loadTransactions(account)} disabled={isSyncing} className={quietBtn}>
                {isSyncing ? 'Refreshing…' : 'Refresh'}
              </button>
            )}
            <button onClick={exportCsv} disabled={!transactions.length} className={quietBtn}>
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
          {summary.map((s) => (
            <Card key={s.l} className="px-4 py-3.5">
              <p className="text-xs text-[#8892a0]">{s.l}</p>
              <p className="text-lg font-semibold text-white font-['Space_Grotesk'] mt-1 tabular-nums">{s.v}</p>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div className="flex gap-1.5">
            {['all', 'confirmed', 'failed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={
                  'text-xs px-3.5 py-1.5 rounded-lg border capitalize transition-all ' +
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
            onChange={(e) => setSort(e.target.value)}
            className="bg-[#0f1822] border border-[#1e2530] text-[#8892a0] text-xs rounded-lg px-3 py-2 outline-none focus:border-[#00D4FF]"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {!isConnected ? (
          <Card className="p-12 text-center">
            <p className="font-semibold font-['Space_Grotesk'] mb-1">Connect a wallet to see your transactions</p>
            <p className="text-[#8892a0] text-sm mb-6">We read your history straight from your address.</p>
            <Link to="/connect" className={primaryBtn}>
              {isLoading ? 'Connecting…' : 'Connect wallet'}
            </Link>
          </Card>
        ) : isSyncing && transactions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-[#8892a0] text-sm animate-pulse">Loading your history…</p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="font-semibold font-['Space_Grotesk'] mb-1">
              {transactions.length === 0 ? 'Nothing here yet' : 'No ' + filter + ' transactions'}
            </p>
            <p className="text-[#8892a0] text-sm mb-6">
              {transactions.length === 0
                ? 'Your first transfer will appear here as soon as it confirms.'
                : 'Try a different filter.'}
            </p>
            {transactions.length === 0 && (
              <Link to="/app" className={primaryBtn}>
                Send USDC
              </Link>
            )}
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2530] text-xs text-[#8892a0]">
                    <th className="px-5 py-3 text-left font-medium">Transaction</th>
                    <th className="px-5 py-3 text-left font-medium">To</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                    <th className="px-5 py-3 text-right font-medium">Network fee</th>
                    <th className="px-5 py-3 text-right font-medium">Settled in</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => (
                    <tr
                      key={tx.id || tx._id || tx.hash}
                      className="border-b border-[#0f1520] last:border-0 hover:bg-[#0f1822] transition-colors"
                    >
                      <td className="px-5 py-3.5">
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
                      <td className="px-5 py-3.5 text-xs text-[#8892a0]">
                        {tx.selfTransfer ? (
                          <span className="text-white">Your wallet</span>
                        ) : (
                          <span className="font-mono" title={tx.to}>{short(tx.to)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right text-white font-medium tabular-nums">
                        {fmtNum(tx.amount, 6)} <span className="text-[#8892a0] font-normal">USDC</span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-[#8892a0] tabular-nums">
                        {fmtNum(tx.gasCost, 6)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-[#8892a0] tabular-nums">
                        {fmtSettle(tx.settlementTime)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Status value={tx.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-[#8892a0] whitespace-nowrap">
                        {fmtDate(tx.createdAt)}
                        <span className="block text-[11px] text-[#556]">{fmtTime(tx.createdAt)}</span>
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
  const { account, balance, isConnected, isCorrectNetwork, refreshBalance, disconnect, walletId } = useArcTestnet()
  const [copied, setCopied] = useState(false)

  const address = account || wallet?.address || null

  const WALLET_LABEL = {
    metamask: 'MetaMask',
    rabby: 'Rabby Wallet',
    coinbase: 'Coinbase Wallet',
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — nothing useful to do */
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      <main className="flex-1 p-5 sm:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] mb-1">Wallet</h1>
        <p className="text-[#8892a0] text-sm mb-7">Your connected wallet and USDC balance</p>

        {!isConnected ? (
          // Links to /connect instead of calling connect('metamask'): hard-coding
          // one wallet throws for anyone who doesn't have it installed.
          <Card glow className="p-8 text-center mb-5">
            <h2 className="font-bold font-['Space_Grotesk'] text-white mb-2">No wallet connected</h2>
            <p className="text-sm text-[#8892a0] mb-6 max-w-sm mx-auto leading-relaxed">
              Connect a wallet to see your balance and to send or swap on Arc.
            </p>
            <Link to="/connect" className={primaryBtn}>
              Connect wallet
            </Link>
          </Card>
        ) : (
          <Card glow className="p-6 mb-5">
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div className="w-11 h-11 rounded-xl bg-[#0a2030] border border-[#00D4FF]/40 flex items-center justify-center text-[#00D4FF] font-bold text-sm font-['Space_Grotesk'] flex-shrink-0">
                {(WALLET_LABEL[walletId] || 'Wallet').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold font-['Space_Grotesk']">
                  {WALLET_LABEL[walletId] || 'Connected wallet'}
                </p>
                <p className="text-xs text-[#8892a0] font-mono mt-0.5 break-all">{address}</p>
              </div>
            </div>

            <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl px-5 py-6 mb-5">
              <p className="text-xs text-[#8892a0] mb-1.5">Balance</p>
              <p className="text-3xl font-bold text-white font-['Space_Grotesk'] tabular-nums">
                {balance} <span className="text-base font-medium text-[#8892a0]">USDC</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={copyAddress}
                className="border border-[#1e2530] text-[#8892a0] py-2.5 rounded-xl text-sm hover:border-[#00D4FF] hover:text-white transition-all"
              >
                {copied ? 'Copied' : 'Copy address'}
              </button>
              <a
                href={EXPLORER + '/address/' + address}
                target="_blank"
                rel="noreferrer"
                className="border border-[#1e2530] text-[#8892a0] py-2.5 rounded-xl text-sm hover:border-[#00D4FF] hover:text-white transition-all text-center"
              >
                View on explorer
              </a>
              <button
                onClick={refreshBalance}
                className="border border-[#1e2530] text-[#8892a0] py-2.5 rounded-xl text-sm hover:border-[#00D4FF] hover:text-white transition-all"
              >
                Refresh
              </button>
            </div>

            {/* Kept apart from the harmless buttons: it's the one action that
                changes state. */}
            <div className="mt-6 pt-4 border-t border-[#1e2530]">
              <button
                onClick={disconnect}
                className="w-full border border-[#1e2530] text-[#8892a0] py-2.5 rounded-xl text-sm hover:border-red-500/50 hover:text-red-400 hover:bg-red-900/10 transition-all"
              >
                Disconnect wallet
              </button>
              <p className="text-[11px] text-[#556] text-center mt-2">
                This removes the site's permission. You'll choose an account again next time.
              </p>
            </div>
          </Card>
        )}

        <Card className="p-5">
          <p className="text-sm font-semibold font-['Space_Grotesk'] mb-4">Network</p>
          <div className="space-y-3 text-sm">
            {[
              {
                l: 'Connection',
                v: !isConnected ? 'Not connected' : isCorrectNetwork ? 'Arc' : 'Wrong network',
                c: !isConnected ? 'text-[#556]' : isCorrectNetwork ? 'text-green-400' : 'text-amber-400',
              },
              { l: 'Chain ID', v: CHAIN_ID, c: 'text-white font-mono' },
              { l: 'Type', v: 'EVM compatible', c: 'text-white' },
              { l: 'Gas token', v: 'USDC (native)', c: 'text-white' },
            ].map((r) => (
              <div key={r.l} className="flex justify-between items-center">
                <span className="text-[#8892a0]">{r.l}</span>
                <span className={r.c}>{r.v}</span>
              </div>
            ))}
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

  useEffect(() => {
    if (account) loadTransactions(account)
  }, [account])

  const notes = [...transactions]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
    .map((tx, i) => {
      const amount = fmtNum(tx.amount, 6) + ' USDC'
      const to = tx.selfTransfer ? 'your own wallet' : short(tx.to)
      if (tx.status === 'confirmed')
        return { id: tx.id || tx.hash || i, status: 'confirmed', title: 'Transfer confirmed', desc: amount + ' to ' + to, at: tx.createdAt }
      if (tx.status === 'failed')
        return { id: tx.id || tx.hash || i, status: 'failed', title: 'Transfer failed', desc: amount + ' to ' + to + ' did not go through', at: tx.createdAt }
      return { id: tx.id || tx.hash || i, status: 'pending', title: 'Transfer pending', desc: amount + ' to ' + to, at: tx.createdAt }
    })

  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      <main className="flex-1 p-5 sm:p-8 max-w-2xl">
        <div className="mb-7">
          <h1 className="text-2xl font-bold font-['Space_Grotesk']">Notifications</h1>
          <p className="text-[#8892a0] text-sm mt-1">
            {notes.length > 0 ? 'Your latest transfers' : 'Nothing new'}
          </p>
        </div>

        {notes.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="font-semibold font-['Space_Grotesk'] mb-1">You're all caught up</p>
            <p className="text-[#8892a0] text-sm mb-6">Confirmations for your transfers will show up here.</p>
            <Link to="/app" className={primaryBtn}>
              Send USDC
            </Link>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            {notes.map((n) => (
              <div key={n.id} className="flex gap-3.5 items-start px-5 py-4 border-b border-[#0f1520] last:border-0">
                <span className={'w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ' + STATUS[n.status].dot} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-3">
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <span className="text-[11px] text-[#556] whitespace-nowrap">{ago(n.at)}</span>
                  </div>
                  <p className="text-xs text-[#8892a0] mt-0.5">{n.desc}</p>
                </div>
              </div>
            ))}
          </Card>
        )}
      </main>
    </div>
  )
}

// ─── SETTINGS PAGE ───────────────────────────────────────────────────
function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={'w-11 h-6 rounded-full transition-all flex-shrink-0 ' + (on ? 'bg-[#00D4FF]' : 'bg-[#1e2530]')}
    >
      <span className={'block w-4 h-4 bg-white rounded-full mx-1 transition-all ' + (on ? 'translate-x-5' : 'translate-x-0')} />
    </button>
  )
}

export function Settings() {
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      <main className="flex-1 p-5 sm:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] mb-1">Settings</h1>
        <p className="text-[#8892a0] text-sm mb-7">Manage your Paragon Finance preferences</p>

        <Card className="p-5 mb-4">
          <p className="text-sm font-semibold font-['Space_Grotesk'] mb-4">Notifications</p>
          <div className="space-y-5">
            {[
              { label: 'Email', sub: 'Get a confirmation email for each transfer', val: emailNotifs, set: setEmailNotifs },
              { label: 'Browser alerts', sub: 'Get notified in your browser as soon as a transfer settles', val: pushNotifs, set: setPushNotifs },
            ].map((s) => (
              <div key={s.label} className="flex justify-between items-center gap-4">
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-[#8892a0] mt-0.5">{s.sub}</p>
                </div>
                <Toggle on={s.val} onChange={s.set} label={s.label} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold font-['Space_Grotesk'] mb-4">About Paragon Finance</p>
          <div className="space-y-3 text-sm">
            {[
              { l: 'Version', v: '1.0.0-beta' },
              { l: 'Built on', v: 'Arc Network by Circle' },
            ].map((r) => (
              <div key={r.l} className="flex justify-between">
                <span className="text-[#8892a0]">{r.l}</span>
                <span className="text-white">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-5 pt-4 border-t border-[#1e2530]">
            <a href="https://docs.arc.network" target="_blank" rel="noreferrer" className="text-xs text-[#00D4FF] hover:underline">
              Arc docs
            </a>
            <a href={EXPLORER} target="_blank" rel="noreferrer" className="text-xs text-[#00D4FF] hover:underline">
              Explorer
            </a>
          </div>
        </Card>
      </main>
    </div>
  )
}