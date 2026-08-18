import { Link } from 'react-router-dom'
import { useArcTestnet } from '../../hooks/useArcTestnet'
import { useTestnet } from '../../context/TestnetContext'
import { ARC_TESTNET, shortAddr, arcScanAddr } from '../../utils/arcTestnet'
import { Card } from '../../components/UI'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useEffect } from 'react'

export default function TestnetHub() {
  const {
    account, balance, isConnected, isCorrectNetwork,
    connect, isLoading, error, hasMetaMask, refreshBalance
  } = useArcTestnet()

  const { stats, transactions, loadTransactions, isSyncing, backendOnline } = useTestnet()

  // THIS IS THE KEY — load from MongoDB every time account is available
  useEffect(() => {
    if (account) {
      loadTransactions(account)
    }
  }, [account])

  return (
    <>
      <Navbar />
      <div className="bg-[#0D1117] min-h-screen">

        {/* Hero */}
        <div className="relative overflow-hidden border-b border-[#1e2530]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[700px] h-[500px] rounded-full bg-[#00D4FF] opacity-[0.05] blur-[130px]" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[400px] rounded-full bg-[#0055FF] opacity-[0.04] blur-[100px]" />
          </div>
          <div className="max-w-6xl mx-auto px-6 pt-16 pb-14 relative">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex items-center gap-2 text-xs bg-[#0a2030] border border-[#00D4FF]/40 text-[#00D4FF] px-3 py-1.5 rounded-full font-['Space_Grotesk'] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
                ARC TESTNET LIVE
              </span>
              <span className="text-xs text-[#556] border border-[#1e2530] px-2 py-1 rounded-full">Chain ID: 5042002</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl font-bold font-['Space_Grotesk'] mb-4 leading-tight">
                  Paragon Finance <span className="text-[#00D4FF]">Testnet</span>
                </h1>
                <p className="text-[#8892a0] text-base leading-relaxed mb-6">
                  Send real USDC transactions on Arc Testnet. Every transfer is recorded on-chain, gas fees are tracked, and your activity builds your testnet profile. Get testnet USDC from the faucet and start transacting.
                </p>
                <div className="flex gap-3 flex-wrap">
                  {isConnected && isCorrectNetwork ? (
                    <Link to="/testnet/send"
                      className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-7 py-3 rounded-xl hover:opacity-90 transition-all shadow-[0_0_24px_rgba(0,212,255,0.3)]">
                      Send USDC →
                    </Link>
                  ) : (
                    <button onClick={connect} disabled={isLoading}
                      className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-7 py-3 rounded-xl hover:opacity-90 transition-all shadow-[0_0_24px_rgba(0,212,255,0.3)] disabled:opacity-50">
                      {isLoading ? 'Connecting…' : 'Connect MetaMask →'}
                    </button>
                  )}
                  <a href={ARC_TESTNET.faucetUrl} target="_blank" rel="noreferrer"
                    className="border border-[#1e2530] text-[#8892a0] font-['Space_Grotesk'] font-semibold px-7 py-3 rounded-xl hover:border-[#00D4FF] hover:text-white transition-all">
                    Get Testnet USDC ↗
                  </a>
                </div>
                {error && <p className="mt-3 text-red-400 text-xs">{error}</p>}
                {!hasMetaMask && (
                  <p className="mt-3 text-amber-400 text-xs">
                    MetaMask required for testnet. <a href="https://metamask.io" target="_blank" rel="noreferrer" className="underline">Install MetaMask ↗</a>
                  </p>
                )}
              </div>

              {/* Wallet card */}
              {isConnected ? (
                <Card glow className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-[10px] tracking-[2px] text-[#00D4FF] font-['Space_Grotesk']">CONNECTED WALLET</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                      isCorrectNetwork ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-amber-900/20 border-amber-500 text-amber-400'
                    }`}>
                      {isCorrectNetwork ? '● Arc Testnet' : '⚠ Wrong Network'}
                    </span>
                  </div>
                  <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-4 mb-4">
                    <p className="text-[10px] text-[#8892a0] mb-1">WALLET ADDRESS</p>
                    <p className="font-mono text-sm text-white">{account}</p>
                    <a href={arcScanAddr(account)} target="_blank" rel="noreferrer"
                      className="text-[10px] text-[#00D4FF] hover:underline mt-1 block">View on ArcScan ↗</a>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-4 text-center">
                      <p className="text-[10px] text-[#8892a0] mb-1">USDC BALANCE</p>
                      <p className="text-xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{balance}</p>
                      <p className="text-[10px] text-[#556] mt-0.5">Testnet USDC</p>
                    </div>
                    <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-4 text-center">
                      <p className="text-[10px] text-[#8892a0] mb-1">TRANSACTIONS</p>
                      <p className="text-xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{stats.totalTransactions}</p>
                      <p className="text-[10px] text-[#556] mt-0.5">On Arc Testnet</p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6">
                  <p className="text-[10px] tracking-[2px] text-[#8892a0] mb-4">HOW TO GET STARTED</p>
                  <div className="space-y-4">
                    {[
                      { num: '01', title: 'Connect MetaMask', desc: 'Click Connect MetaMask — we\'ll auto-add Arc Testnet to your wallet.' },
                      { num: '02', title: 'Get Testnet USDC', desc: 'Visit faucet.circle.com and request 10 USDC to your wallet address.' },
                      { num: '03', title: 'Send a Transaction', desc: 'Use the Send page to transfer USDC to any address on Arc Testnet.' },
                      { num: '04', title: 'Track Your Stats', desc: 'Every transaction is recorded — watch your volume, gas and stats grow.' },
                    ].map(s => (
                      <div key={s.num} className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#0a2030] border border-[#00D4FF]/30 flex items-center justify-center text-[10px] text-[#00D4FF] font-bold flex-shrink-0 mt-0.5">{s.num}</span>
                        <div>
                          <p className="text-sm font-semibold font-['Space_Grotesk'] text-white mb-0.5">{s.title}</p>
                          <p className="text-xs text-[#8892a0] leading-relaxed">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className="bg-[#0f1822] border-b border-[#1e2530] py-6 px-6">
          <div className="max-w-6xl mx-auto flex flex-wrap gap-6 justify-between items-center">
            {[
              { label: 'NETWORK', value: 'Arc Testnet' },
              { label: 'CHAIN ID', value: '5042002' },
              { label: 'RPC', value: 'rpc.testnet.arc.network' },
              { label: 'GAS TOKEN', value: 'USDC (native)' },
              { label: 'AVG FEE', value: '~$0.003' },
              { label: 'FINALITY', value: '< 1 second' },
              { label: 'EXPLORER', value: 'testnet.arcscan.app' },
            ].map(i => (
              <div key={i.label}>
                <p className="text-[10px] tracking-[1.5px] text-[#556] mb-0.5">{i.label}</p>
                <p className="text-xs font-mono text-[#00D4FF] font-semibold">{i.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          <p className="text-[10px] tracking-[2px] text-[#00D4FF] font-['Space_Grotesk'] font-semibold mb-3">YOUR TESTNET STATS</p>
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-8">Activity Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'TOTAL TRANSACTIONS', value: stats.totalTransactions, suffix: '', color: 'text-[#00D4FF]' },
              { label: 'TOTAL VOLUME', value: stats.totalVolume.toFixed(2), suffix: ' USDC', color: 'text-[#00D4FF]' },
              { label: 'GAS PAID', value: stats.totalGasPaid.toFixed(6), suffix: ' USDC', color: 'text-green-400' },
              { label: 'AVG SETTLEMENT', value: stats.avgSettlementTime ? `${(stats.avgSettlementTime/1000).toFixed(2)}` : '—', suffix: stats.avgSettlementTime ? 's' : '', color: 'text-[#00D4FF]' },
              { label: 'SUCCESS RATE', value: stats.successRate, suffix: '%', color: 'text-green-400' },
              { label: 'UNIQUE RECIPIENTS', value: stats.uniqueRecipients, suffix: '', color: 'text-[#00D4FF]' },
              { label: 'NETWORK', value: 'Arc Testnet', suffix: '', color: 'text-white', small: true },
              { label: 'STATUS', value: isConnected ? 'Active' : 'Inactive', suffix: '', color: isConnected ? 'text-green-400' : 'text-[#556]', small: true },
            ].map(s => (
              <Card key={s.label} className="p-5">
                <p className="text-[10px] tracking-[1.5px] text-[#8892a0] mb-2">{s.label}</p>
                <p className={`${s.small ? 'text-lg' : 'text-2xl'} font-bold font-['Space_Grotesk'] ${s.color}`}>
                  {s.value}{s.suffix}
                </p>
              </Card>
            ))}
          </div>

          {/* Quick actions */}
          <p className="text-[10px] tracking-[2px] text-[#00D4FF] font-['Space_Grotesk'] font-semibold mb-5">TESTNET ACTIONS</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {[
              {
                icon: '⚡', title: 'Send USDC', desc: 'Transfer testnet USDC to any wallet address on Arc Network. Gas is deducted automatically.',
                link: '/testnet/send', label: 'Send Now →', available: true,
              },
              {
                icon: '📊', title: 'View Transactions', desc: 'Full history of all your testnet transactions with on-chain hashes, gas costs, and settlement times.',
                link: '/testnet/transactions', label: 'View History →', available: true,
              },
              // Leaderboard — commented out for now, uncomment when ready to launch it
              // {
              //   icon: '🏆', title: 'Leaderboard', desc: 'See the top testnet participants ranked by volume, transactions, and activity. Compete for the top spot.',
              //   link: '/testnet/leaderboard', label: 'View Rankings →', available: true,
              // },
            ].map(a => (
              <Card key={a.title} className="p-6 hover:border-[#00D4FF]/40 transition-all">
                <div className="text-3xl mb-4">{a.icon}</div>
                <h3 className="font-bold font-['Space_Grotesk'] text-white mb-2">{a.title}</h3>
                <p className="text-xs text-[#8892a0] leading-relaxed mb-4">{a.desc}</p>
                <Link to={a.link} className="text-sm text-[#00D4FF] font-semibold hover:underline font-['Space_Grotesk']">
                  {a.label}
                </Link>
              </Card>
            ))}
          </div>

          {/* Recent transactions preview */}
          {transactions.length > 0 && (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] tracking-[2px] text-[#00D4FF] font-['Space_Grotesk'] font-semibold">RECENT ACTIVITY</p>
                <Link to="/testnet/transactions" className="text-xs text-[#00D4FF] hover:underline">View all →</Link>
              </div>
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e2530] bg-[#13181f]">
                      {['TX HASH', 'TO', 'AMOUNT', 'GAS', 'TIME', 'STATUS'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] tracking-widest text-[#8892a0]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map(tx => (
                      <tr key={tx.id} className="border-b border-[#0f1520] hover:bg-[#0f1822] transition-colors">
                        <td className="px-4 py-3">
                          <a href={`${ARC_TESTNET.explorerUrl}/tx/${tx.hash}`} target="_blank" rel="noreferrer"
                            className="text-xs font-mono text-[#00D4FF] hover:underline">
                            {shortAddr(tx.hash)}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-[#8892a0]">{shortAddr(tx.to)}</td>
                        <td className="px-4 py-3 font-semibold text-white text-xs">{tx.amount} USDC</td>
                        <td className="px-4 py-3 text-xs text-green-400">{tx.gasCost} USDC</td>
                        <td className="px-4 py-3 text-xs text-[#8892a0]">{tx.settlementTime ? `${(tx.settlementTime/1000).toFixed(2)}s` : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                            tx.status === 'confirmed' ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-red-900/20 border-red-500 text-red-400'
                          }`}>{tx.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}

          {/* Faucet guide */}
          <div className="mt-12 bg-[#0a2030] border border-[#00D4FF]/30 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-[10px] tracking-[2px] text-[#00D4FF] font-['Space_Grotesk'] font-semibold mb-3">GET TESTNET USDC</p>
                <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-3">How to fund your wallet</h3>
                <div className="space-y-3">
                  {[
                    'Go to faucet.circle.com',
                    'Connect your MetaMask wallet',
                    'Select Arc Testnet as the network',
                    'Choose USDC and click "Send 10 USDC"',
                    'Funds arrive in under 1 second',
                  ].map((s, i) => (
                    <div key={s} className="flex items-center gap-3 text-sm text-[#8892a0]">
                      <span className="w-5 h-5 rounded-full bg-[#0D1117] border border-[#00D4FF]/30 flex items-center justify-center text-[10px] text-[#00D4FF] font-bold flex-shrink-0">{i+1}</span>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <a href={ARC_TESTNET.faucetUrl} target="_blank" rel="noreferrer"
                  className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-6 py-3 rounded-xl text-center hover:opacity-90 transition-all">
                  Open Circle Faucet ↗
                </a>
                <a href={ARC_TESTNET.explorerUrl} target="_blank" rel="noreferrer"
                  className="border border-[#1e2530] text-[#8892a0] px-6 py-3 rounded-xl text-center text-sm hover:border-[#00D4FF] hover:text-white transition-all">
                  View on ArcScan ↗
                </a>
                <a href="https://chainlist.org/chain/5042002" target="_blank" rel="noreferrer"
                  className="border border-[#1e2530] text-[#8892a0] px-6 py-3 rounded-xl text-center text-sm hover:border-[#00D4FF] hover:text-white transition-all">
                  Add to Wallet via ChainList ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}