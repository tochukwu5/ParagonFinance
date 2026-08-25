import { useState } from 'react'
import { Link } from 'react-router-dom'
import { COUNTRIES, COMPETITORS, REGIONS } from '../data/constants'
import { Badge, Card, StatCard, LiveBadge } from '../components/UI'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

// ─── HOW IT WORKS ────────────────────────────────────────────────────
export function HowItWorks() {
  const steps = [
    { num: '01', icon: '👛', tag: 'STEP ONE', title: 'Connect your wallet', desc: 'Connect MetaMask, Coinbase Wallet, or any EVM-compatible wallet. No bank account, no KYC for basic transfers. Your wallet is your identity on Arc Network.', details: [{ l: 'Supported wallets', v: 'MetaMask, WalletConnect, Coinbase' }, { l: 'Network', v: 'Arc Testnet (EVM)' }, { l: 'Token required', v: 'USDC (Circle)' }] },
    { num: '02', icon: '💸', tag: 'STEP TWO', title: 'Enter amount & recipient', desc: 'Choose your source chain, enter how much USDC to send, pick the destination country, and paste or scan the recipient\'s wallet address. See exact fees before you send — no surprises.', details: [{ l: 'Source chains', v: 'Arc, Ethereum, Base, Arbitrum, Solana' }, { l: 'Destinations', v: '18+ countries worldwide' }, { l: 'Fee shown upfront', v: '~$0.003' }] },
    { num: '03', icon: '⚡', tag: 'STEP THREE', title: 'Arc settles instantly', desc: 'Once you confirm the transaction in your wallet, Arc Network processes and finalises it in under one second. Deterministic finality no challenge period, no waiting.', details: [{ l: 'Settlement time', v: '< 1 second' }, { l: 'Finality type', v: 'Deterministic · Irreversible' }, { l: 'Network fee', v: '$0.003 USDC' }] },
    { num: '04', icon: '✅', tag: 'STEP FOUR', title: 'Recipient gets USDC', desc: 'Your family receives USDC directly in their wallet. They can hold it, spend it, or cash out through local partners. An on-chain receipt is auto-generated and shareable via WhatsApp.', details: [{ l: 'Receipt type', v: 'On-chain · Downloadable PDF' }, { l: 'Shareable via', v: 'WhatsApp · Copy TX ID' }, { l: 'Explorer', v: 'ArcScan (public)' }] },
  ]

  const faqs = [
    { q: 'Do I need a bank account?', a: 'No. SendArc is fully non-custodial. You only need a crypto wallet like MetaMask. No bank account, no wire transfer, no paperwork.' },
    { q: 'How does the recipient cash out?', a: 'Recipients can hold USDC in their wallet, spend it with USDC-accepting merchants, or use local partners like Mara, Yellow Card, or Binance P2P to convert to local currency.' },
    { q: 'What is Arc Network?', a: 'Arc is a stablecoin-native Layer-1 blockchain built by Circle the company behind USDC. It offers sub-second finality, USDC-denominated fees, and is backed by Goldman Sachs, Mastercard, and Visa.' },
    { q: 'Is my money safe?', a: 'USDC is fully backed 1:1 by US dollars and issued by Circle. Every transaction is recorded on-chain and publicly verifiable on ArcScan. SendArc never holds your funds.' },
  ]

  return (
    <>
      <Navbar />
      <div className="bg-[#0D1117] min-h-screen">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[400px] rounded-full bg-[#00D4FF] opacity-[0.05] blur-[100px]" />
          </div>
          <div className="max-w-5xl mx-auto px-6 pt-16 pb-10 text-center">
            <Badge>SIMPLE PROCESS</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mt-5 mb-4">How <span className="gradient-text">SendArc</span> Works</h1>
            <p className="text-[#8892a0] text-base max-w-xl mx-auto leading-relaxed">Four simple steps. No bank account needed. Your family receives USDC in under one second on-chain and verifiable.</p>
          </div>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto px-6 pb-16">
          <div className="space-y-6">
            {steps.map((s, i) => (
              <Card key={s.num} className="p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0a2030] border-2 border-[#00D4FF] flex items-center justify-center">
                    <span className="text-[#00D4FF] font-bold text-sm font-['Space_Grotesk']">{s.num}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="section-label mb-2">{s.tag}</p>
                  <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-3">{s.title}</h3>
                  <p className="text-[#8892a0] text-sm leading-relaxed mb-4">{s.desc}</p>
                  <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-4 space-y-2">
                    {s.details.map(d => (
                      <div key={d.l} className="flex justify-between text-sm border-b border-[#1e2530] pb-2 last:border-0 last:pb-0">
                        <span className="text-[#8892a0]">{d.l}</span>
                        <span className="text-[#00D4FF] font-semibold">{d.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-center mb-3">Frequently asked questions</h2>
            <p className="text-center text-[#8892a0] text-sm mb-8">Everything you need to know about SendArc</p>
            <div className="space-y-3">
              {faqs.map(f => (
                <Card key={f.q} className="p-5">
                  <p className="font-semibold font-['Space_Grotesk'] text-sm mb-2">{f.q}</p>
                  <p className="text-[#8892a0] text-sm leading-relaxed">{f.a}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            {/* Send Money CTA — disabled until Arc mainnet launches */}
            <button
              disabled
              title="Arc Network mainnet has not launched yet"
              className="inline-flex items-center gap-2 bg-[#1e2530] text-[#556] font-['Space_Grotesk'] font-bold text-base px-10 py-4 rounded-xl cursor-not-allowed mb-3"
            >
              Send money (🔒 Mainnet Coming Soon)
            </button>
            <div>
              <Link to="/testnet" className="text-sm text-[#00D4FF] hover:underline">
                Try the live testnet now →
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

// ─── COUNTRIES PAGE ──────────────────────────────────────────────────
export function CountriesPage() {
  const [activeRegion, setActiveRegion] = useState('All')
  const live = COUNTRIES.filter(c => c.status === 'live' && (activeRegion === 'All' || c.region === activeRegion))
  const soon = COUNTRIES.filter(c => c.status === 'soon')

  return (
    <>
      <Navbar />
      <div className="bg-[#0D1117] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
          <Badge>GLOBAL REACH</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mt-5 mb-4">Send to <span className="gradient-text">18+ Countries Worldwide</span></h1>
          <p className="text-[#8892a0] text-base max-w-xl mx-auto leading-relaxed">
            Instant USDC transfers across every continent with live exchange rates updated every 60 seconds from Arc Network.
          </p>
          <div className="flex items-center justify-center gap-2 mt-5 text-sm text-[#8892a0]">
            <span className="live-dot" />
            Rates live · Updated 12 seconds ago
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[{ v: '18+', l: 'COUNTRIES' }, { v: '<1s', l: 'SETTLEMENT' }, { v: '$0.003', l: 'AVG FEE' }, { v: '24/7', l: 'ALWAYS OPEN' }].map(s => (
              <StatCard key={s.l} value={s.v} label={s.l} />
            ))}
          </div>

          <div className="flex gap-2 flex-wrap mb-8">
            {REGIONS.map(r => (
              <button
                key={r}
                onClick={() => setActiveRegion(r)}
                className={"px-4 py-2 rounded-xl text-sm font-semibold border transition-all " + (
                  activeRegion === r
                    ? "bg-[#0a2030] border-[#00D4FF] text-[#00D4FF]"
                    : "border-[#1e2530] text-[#8892a0] hover:border-[#00D4FF]/50 hover:text-white"
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <p className="section-label mb-6">LIVE DESTINATIONS</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
            {live.map(c => (
              <Card key={c.code} className="p-6 hover:border-[#00D4FF] transition-all">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{c.flag}</span>
                    <div>
                      <p className="font-bold font-[\'Space_Grotesk\'] text-lg">{c.name}</p>
                      <p className="text-xs text-[#8892a0]">{c.currency} · {c.symbol} · {c.region}</p>
                    </div>
                  </div>
                  <LiveBadge />
                </div>
                <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-4 mb-4">
                  <p className="text-2xl font-bold text-[#00D4FF] font-[\'Space_Grotesk\']">{c.symbol}{c.rate.toLocaleString()} / USDC</p>
                  <p className="text-xs text-[#8892a0] mt-1">1 USDC = {c.symbol}{c.rate.toLocaleString()} · Updated 12s ago</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[{ l: 'AVG FEE', v: '$0.003' }, { l: 'SETTLEMENT', v: '< 1 second' }, { l: 'MIN SEND', v: '$1 USDC' }, { l: 'MAX SEND', v: '$50,000 USDC' }].map(d => (
                    <div key={d.l} className="bg-[#13181f] rounded-lg p-2.5">
                      <p className="text-[10px] text-[#8892a0] mb-1">{d.l}</p>
                      <p className="text-sm font-semibold font-[\'Space_Grotesk\']">{d.v}</p>
                    </div>
                  ))}
                </div>
                {c.cashout.length > 0 && (
                  <div>
                    <p className="text-[10px] tracking-widests text-[#8892a0] mb-2">CASHOUT OPTIONS</p>
                    <div className="flex gap-2 flex-wrap">
                      {c.cashout.map(co => (
                        <span key={co} className="text-[10px] border border-[#1e2530] text-[#8892a0] px-2 py-0.5 rounded-full">{co}</span>
                      ))}
                      <span className="text-[10px] border border-[#1e2530] text-[#8892a0] px-2 py-0.5 rounded-full">Hold USDC</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
            {live.length === 0 && (
              <div className="col-span-2 text-center py-12 text-[#556]">No countries available for this region yet,more launching soon.</div>
            )}
          </div>

          <p className="section-label text-center mb-4">COMING SOON</p>
          <h2 className="text-2xl font-bold text-center mb-2 font-[\'Space_Grotesk\']">Expanding globally</h2>
          <p className="text-[#8892a0] text-sm text-center mb-8">More countries across every continent launching soon</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {soon.map(c => (
              <Card key={c.code} className="p-5 text-center opacity-60">
                <div className="text-3xl mb-2">{c.flag}</div>
                <p className="font-semibold font-[\'Space_Grotesk\'] mb-1">{c.name}</p>
                <p className="text-[10px] text-[#8892a0] mb-2">{c.region}</p>
                <span className="text-[11px] border border-amber-500 text-amber-400 px-2 py-0.5 rounded-full bg-amber-900/10">Coming soon</span>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

// ─── RATES PAGE ──────────────────────────────────────────────────────
export function RatesPage() {
  const [sendAmount, setSendAmount] = useState(100)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const live = COUNTRIES.filter(c => c.status === 'live')

  return (
    <>
      <Navbar />
      <div className="bg-[#0D1117] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
          <Badge>TRANSPARENT PRICING</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mt-5 mb-4">Live <span className="gradient-text">Exchange Rates</span></h1>
          <p className="text-[#8892a0] text-base max-w-xl mx-auto leading-relaxed">Real-time rates across all 18+ global destinations. Fees shown upfront. No hidden charges, ever.</p>
          <div className="flex items-center justify-center gap-2 mt-5 text-sm text-[#8892a0]">
            <span className="live-dot" />
            Rates update every 60 seconds · Powered by Arc Network
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-16">
          {/* Calculator */}
          <Card glow className="p-6 mb-10">
            <p className="font-semibold font-['Space_Grotesk'] text-sm mb-5">Rate calculator — see what your family receives</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-4">
              <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-4">
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-2">YOU SEND</p>
                <input type="number" value={sendAmount} onChange={e => setSendAmount(Number(e.target.value) || 0)}
                  className="w-full bg-transparent text-white text-2xl font-bold outline-none font-['Space_Grotesk'] mb-1" />
                <p className="text-xs text-[#8892a0]">USDC · from your wallet</p>
              </div>
              <div className="text-center text-[#00D4FF] text-2xl">→</div>
              <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-4">
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-2">THEY RECEIVE</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{(sendAmount * selectedCountry.rate).toLocaleString()}</p>
                  <select value={selectedCountry.code} onChange={e => setSelectedCountry(COUNTRIES.find(c => c.code === e.target.value))}
                    className="bg-[#1e2530] text-white text-xs rounded-md px-2 py-1 outline-none mb-0.5">
                    {live.map(c => <option key={c.code} value={c.code}>{c.flag} {c.currency}</option>)}
                  </select>
                </div>
                <p className="text-xs text-[#8892a0] mt-1">{selectedCountry.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: 'EXCHANGE RATE', v: `${selectedCountry.symbol}${selectedCountry.rate}`, color: 'text-[#00D4FF]' },
                { l: 'ARC NETWORK FEE', v: '$0.003', color: 'text-green-400' },
                { l: 'YOU SAVE VS WIRE', v: '-$24.97', color: 'text-green-400' },
              ].map(d => (
                <div key={d.l} className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-3">
                  <p className="text-[10px] text-[#8892a0] mb-1">{d.l}</p>
                  <p className={`font-bold font-['Space_Grotesk'] ${d.color}`}>{d.v}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Rates table */}
          <p className="section-label mb-2">LIVE RATES</p>
          <h2 className="text-xl font-bold font-['Space_Grotesk'] mb-1">All destination rates</h2>
          <p className="text-[#8892a0] text-sm mb-5">Per 1 USDC sent · Rates refreshed every 60 seconds</p>

          <Card className="overflow-hidden mb-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2530] bg-[#13181f]">
                  {['COUNTRY', 'EXCHANGE RATE', 'SENDARC FEE', 'SETTLEMENT', 'SAVE VS WIRE', 'STATUS'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] tracking-widest text-[#8892a0] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {live.map(c => (
                  <tr key={c.code} className="border-b border-[#0f1520] hover:bg-[#0f1822] transition-colors">
                    <td className="px-5 py-4"><div className="flex items-center gap-2"><span className="text-xl">{c.flag}</span><div><p className="font-semibold font-['Space_Grotesk']">{c.name}</p><p className="text-[10px] text-[#8892a0]">{c.currency}</p></div></div></td>
                    <td className="px-5 py-4 text-[#00D4FF] font-semibold">{c.symbol}{c.rate.toLocaleString()}</td>
                    <td className="px-5 py-4 text-green-400 font-semibold">$0.003</td>
                    <td className="px-5 py-4 text-green-400">&lt; 1 second</td>
                    <td className="px-5 py-4 text-green-400 font-semibold">~$24.97</td>
                    <td className="px-5 py-4"><LiveBadge /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Fee comparison */}
          <p className="section-label mb-2">FEE COMPARISON</p>
          <h2 className="text-xl font-bold font-['Space_Grotesk'] mb-1">SendArc vs the old way</h2>
          <p className="text-[#8892a0] text-sm mb-5">Sending $100 internationally — all providers compared</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {COMPETITORS.map(c => (
              <div key={c.name} className={`rounded-xl p-6 text-center border ${c.badge === 'best' ? 'bg-[#0a2030] border-[#00D4FF]' : 'bg-[#0f1822] border-[#1e2530]'}`}>
                <p className="text-[11px] text-[#8892a0] tracking-wider mb-3 font-['Space_Grotesk']">{c.name}</p>
                <p className={`text-3xl font-bold font-['Space_Grotesk'] mb-2 ${c.badge === 'best' ? 'text-[#00D4FF]' : 'text-red-400'}`}>{c.fee}</p>
                <p className="text-xs text-[#8892a0] mb-4">{c.time}</p>
                {c.badge === 'best'
                  ? <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-green-900/30 border border-green-500 text-green-400">Best value</span>
                  : <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-red-900/20 border border-red-500 text-red-400">Avoid</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

// ─── ABOUT PAGE ──────────────────────────────────────────────────────
export function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="bg-[#0D1117] min-h-screen">

        {/* Hero */}
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge>OUR STORY</Badge>
            <h1 className="text-4xl font-bold mt-5 mb-4 font-['Space_Grotesk']">
              Designed by Developers, for <span className="gradient-text">for Real-World Needs</span>
            </h1>
            <p className="text-[#8892a0] leading-relaxed mb-4 text-sm">
              SendArc was born from a simple frustration — watching family members receive less money than was sent, eaten up by fees and delays from legacy remittance providers.
            </p>
            <p className="text-[#8892a0] leading-relaxed text-sm">
              We built SendArc on Arc Network because it is the most direct and honest infrastructure for moving value across borders. Near-zero fees. Sub-second finality. USDC backed 1:1 by US dollars.
            </p>
          </div>
          <Card glow className="p-6">
            <p className="section-label mb-3">OUR MISSION</p>
            <p className="text-base leading-relaxed text-white italic border-l-2 border-[#00D4FF] pl-4">
              More money should reach the family, not the middleman. Building instant, borderless remittances with stablecoins — predictable fees, zero delays. The new way to send money home.
            </p>
          </Card>
        </div>

        {/* Problem */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6 mb-14">
          <div className="max-w-6xl mx-auto">
            <p className="section-label text-center mb-3">THE OPPORTUNITY</p>
            <h2 className="text-2xl font-bold text-center mb-3 font-['Space_Grotesk']">
              Global remittance is broken
            </h2>
            <p className="text-center text-[#8892a0] text-sm max-w-xl mx-auto mb-10">
              Billions of people send money across borders every year, but the system is slow, expensive, and built for banks — not people. SendArc changes that with near-zero fees and instant settlement.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { num: '$800B', title: 'Sent globally in remittances annually', desc: 'Over $800 billion moves across borders every year — most of it eaten by fees and delays.' },
                { num: '8%', title: 'Average remittance fee to Africa', desc: 'Nearly 3x what it costs using stablecoins on Arc Network.' },
                { num: '$0.003', title: 'SendArc fee per transaction', desc: 'Fractions of a cent — regardless of whether you send $10 or $10,000.' },
              ].map(s => (
                <Card key={s.num} className="p-6">
                  <div className="text-3xl font-bold text-[#00D4FF] font-['Space_Grotesk'] mb-2">{s.num}</div>
                  <p className="font-semibold font-['Space_Grotesk'] mb-2 text-sm">{s.title}</p>
                  <p className="text-xs text-[#8892a0] leading-relaxed">{s.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="max-w-6xl mx-auto px-6 mb-14">
          <p className="section-label mb-3">THE BUILDERS</p>
          <h2 className="text-2xl font-bold mb-8 font-['Space_Grotesk']">Who's behind SendArc</h2>

          <div className="space-y-5">

            {/* Julius — Founder */}
            <Card className="p-7 flex flex-col md:flex-row gap-6 items-start">
  <div className="w-16 h-16 rounded-2xl bg-[#0a2030] border-2 border-[#00D4FF] flex items-center justify-center text-2xl font-bold text-[#00D4FF] font-['Space_Grotesk'] flex-shrink-0">
    EJ
  </div>

  <div className="flex-1">
    <div className="flex flex-wrap items-center gap-3 mb-1">
      <h3 className="text-xl font-bold font-['Space_Grotesk']">Eze J.</h3>
      <span className="text-xs text-[#556] font-mono">@6figuresdev33</span>
    </div>

    <p className="text-sm text-[#00D4FF] mb-3">
      Founder of <span className="font-bold">@SENDARC</span> | Solidity Developer
    </p>

    <p className="text-sm text-[#8892a0] leading-relaxed mb-4">
      Eze Julius is a Solidity and Web3 developer with over 6 years of experience building decentralized applications and blockchain-powered financial systems. He is the founder of @SENDARC, a stablecoin-powered cross-border payment and remittance platform built on Arc, designed to make global money transfers faster, cheaper, and more accessible using blockchain technology.
    </p>

    <div className="flex gap-2 flex-wrap">
      {[
        'Solidity',
        'Ethereum',
        'Smart Contracts',
        'Web3',
        'DeFi',
        'Founder @SENDARC'
      ].map(t => (
        <span key={t} className="text-xs border border-[#1e2530] text-[#8892a0] px-3 py-1 rounded-full">
          {t}
        </span>
      ))}
    </div>
  </div>
</Card>

            {/* David — Co-Founder */}
            <Card className="p-7 flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 rounded-2xl bg-[#0a2030] border-2 border-[#00D4FF] flex items-center justify-center text-2xl font-bold text-[#00D4FF] font-['Space_Grotesk'] flex-shrink-0">
                DE
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold font-['Space_Grotesk']">David E.</h3>
                  <span className="text-xs text-[#556] font-mono">@daviwork</span>
                </div>
                <p className="text-sm text-[#00D4FF] mb-3">
                  Co-Founder of <span className="font-bold">@SENDARC</span> | Fullstack Developer
                </p>
                <p className="text-sm text-[#8892a0] leading-relaxed mb-4">
                  David is a MERN stack developer with over 5 years of experience building production-grade web applications. He studied Computer Statistics at the University of Nigeria, Nsukka, and currently works as a Fullstack Developer at Enzo Solution Network while co-founding SendArc as an open contribution to borderless financial infrastructure.
                </p>
                <div className="flex gap-2 flex-wrap">
                  {['React.js', 'Node.js', 'MongoDB', 'Tailwind CSS', 'Web3', 'Enugu, Nigeria 🇳🇬'].map(t => (
                    <span key={t} className="text-xs border border-[#1e2530] text-[#8892a0] px-3 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            </Card>

          </div>
        </div>

        {/* Arc Banner */}
        <div className="max-w-6xl mx-auto px-6 mb-16">
          <div className="bg-[#0a2030] border-2 border-[#00D4FF] rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-[#0D1117] border border-[#00D4FF] rounded-lg px-4 py-2 text-[#00D4FF] font-bold text-sm">
                Arc Network
              </div>
              <div>
                <p className="font-bold font-['Space_Grotesk']">Built on Arc — powered by Circle</p>
                <p className="text-xs text-[#8892a0] mt-0.5">
                  Stablecoin-native Layer-1 · Backed by Goldman Sachs, Mastercard &amp; Visa
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[
                { v: '$0.003', l: 'AVG FEE PER TX' },
                { v: '<1s', l: 'FINALITY' },
                { v: '100%', l: 'USDC BACKED' },
                { v: 'EVM', l: 'COMPATIBLE' },
              ].map(s => (
                <div key={s.l} className="text-center bg-[#0D1117] border border-[#1e2530] rounded-xl p-4">
                  <p className="text-2xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{s.v}</p>
                  <p className="text-[10px] text-[#8892a0] tracking-widest mt-1">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {['Goldman Sachs', 'Mastercard', 'Visa', 'Circle (USDC)', 'CCTP'].map(b => (
                <span key={b} className="text-xs bg-[#13181f] border border-[#1e2530] px-3 py-1.5 rounded-lg text-[#8892a0]">{b}</span>
              ))}
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </>
  )
}


// ─── DOCS PAGE ───────────────────────────────────────────────────────
export function DocsPage() {
  return (
    <>
      <Navbar />
      <div className="bg-[#0D1117] min-h-screen">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full bg-[#00D4FF] opacity-[0.05] blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-[#0055FF] opacity-[0.04] blur-[100px]" />
          </div>
          <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative">
            <div>
              <Badge>WHITE PAPER v1.0</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mt-5 mb-4 font-['Space_Grotesk']">
                SendArc <span className="gradient-text">Documentation</span>
              </h1>
              <p className="text-[#8892a0] leading-relaxed mb-2 text-sm">
                Borderless Money Infrastructure Built on Arc Network.
              </p>
              <p className="text-[#8892a0] leading-relaxed mb-6 text-sm">
                This document covers the full architecture, use cases, security model, and roadmap of the SendArc protocol.
              </p>
              <div className="flex gap-3 flex-wrap">
                <a href="/testnet/send" className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-all">
                  Launch App →
                </a>
                <a href="https://www.arc.network" target="_blank" rel="noreferrer"
                  className="border border-[#1e2530] text-[#8892a0] text-sm px-6 py-3 rounded-xl hover:border-[#00D4FF] hover:text-white transition-all">
                  Arc Network ↗
                </a>
              </div>
            </div>
            <Card glow className="p-6">
              <p className="section-label mb-3">CORE TAGLINE</p>
              <p className="text-base leading-relaxed text-white italic border-l-2 border-[#00D4FF] pl-4 mb-5">
                "Move money faster. Move money cheaper. Move money globally. Built on Arc. Powered by Stablecoins."
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: '<1s', l: 'Settlement' },
                  { v: '$0.003', l: 'Avg Fee' },
                  { v: 'EVM', l: 'Compatible' },
                  { v: '8', l: 'Destinations' },
                ].map(s => (
                  <div key={s.l} className="bg-[#0D1117] border border-[#1e2530] rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-[#00D4FF] font-['Space_Grotesk']">{s.v}</p>
                    <p className="text-[10px] text-[#8892a0] tracking-widest mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ── EXECUTIVE SUMMARY ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="section-label text-center mb-3">EXECUTIVE SUMMARY</p>
            <h2 className="text-2xl font-bold text-center mb-3 font-['Space_Grotesk']">What SendArc is building</h2>
            <p className="text-center text-[#8892a0] text-sm max-w-2xl mx-auto mb-10 leading-relaxed">
              SendArc is a stablecoin-powered cross-border payment and remittance infrastructure designed to transform how money moves globally built natively on Arc Network, leveraging programmable stablecoin rails for instant, low-cost, and transparent financial transactions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              {[
                { icon: '⚡', title: 'Stablecoin-native settlement', desc: 'USDC transfers settled directly on-chain instant, final, and publicly verifiable on ArcScan.' },
                { icon: '💰', title: 'Predictable $0.003 fee', desc: 'Fixed, USDC-denominated cost per transaction. Never volatile, never a surprise regardless of amount sent.' },
                { icon: '🔗', title: 'Crosschain interoperability', desc: 'Send from Ethereum, Base, Arbitrum, or Solana all routed through Circle CCTP and settled on Arc.' },
                { icon: '🌍', title: 'Real-time payments', desc: '8 live destinations with exchange rates refreshed every 60 seconds from live market data.' },
                { icon: '⚙️', title: 'EVM-compatible', desc: 'Solidity smart contracts on Arc  proven, auditable infrastructure built for financial activity.' },
                { icon: '📄', title: 'On-chain receipts', desc: 'Auto-generated receipts for every transfer downloadable as PDF and shareable via WhatsApp.' },
              ].map(f => (
                <Card key={f.title} className="p-5 flex gap-4 hover:border-[#00D4FF]/40 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-[#0a2030] border border-[#00D4FF]/30 flex items-center justify-center flex-shrink-0 text-lg">
                    {f.icon}
                  </div>
                  <div>
                    <p className="font-semibold font-['Space_Grotesk'] text-sm mb-1">{f.title}</p>
                    <p className="text-xs text-[#8892a0] leading-relaxed">{f.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* ── VISION & MISSION ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <p className="section-label mb-3">VISION & MISSION</p>
          <h2 className="text-2xl font-bold mb-8 font-['Space_Grotesk']">Why we exist</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <Card className="p-6">
              <p className="section-label mb-3">VISION</p>
              <p className="text-white font-['Space_Grotesk'] font-semibold text-sm leading-relaxed">
                To become the leading stablecoin-powered financial infrastructure layer for borderless payments and programmable money movement starting with the most underserved remittance corridors in the world.
              </p>
            </Card>
            <Card glow className="p-6">
              <p className="section-label mb-3">MISSION</p>
              <p className="text-white font-['Space_Grotesk'] font-semibold text-sm leading-relaxed">
                To provide instant, affordable, transparent, and secure cross-border financial services powered by blockchain infrastructure accessible to anyone with a crypto wallet.
              </p>
            </Card>
          </div>
          <Card className="p-6">
            <p className="text-base leading-relaxed text-white italic border-l-2 border-[#00D4FF] pl-4">
              "More money should reach the family, not the middleman. Building instant, borderless remittances with stablecoins  predictable fees, zero delays. The new way to send money home."
            </p>
          </Card>
        </div>

        {/* ── PROBLEM STATEMENT ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="section-label text-center mb-3">THE PROBLEM</p>
            <h2 className="text-2xl font-bold text-center mb-3 font-['Space_Grotesk']">The remittance system is broken</h2>
            <p className="text-center text-[#8892a0] text-sm max-w-xl mx-auto mb-10 leading-relaxed">
              Every year, billions of dollars flow across borders through remittances. Yet the current ecosystem remains expensive, slow, fragmented, and highly dependent on intermediaries.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
              {[
                { icon: '💸', title: 'High Fees', desc: 'Transfer fees erode remittance value, hitting recipients hardest. Average global fee sits at 6–8% per transaction sending $100 via bank wire costs up to $25 in fees alone.' },
                { icon: '⏳', title: 'Slow Settlement', desc: 'Settlements take 1–5 business days, creating uncertainty for families and businesses that need money now not next week.' },
                { icon: '📉', title: 'Poor FX Rates', desc: 'Currency conversion markups add hidden costs on top of the stated fee. Recipients often receive far less than the sender intended.' },
                { icon: '🚫', title: 'Limited Access', desc: 'Banking restrictions and infrastructure gaps exclude millions from the financial system entirely no bank account means no transfer.' },
              ].map(p => (
                <Card key={p.title} className="p-6">
                  <div className="text-2xl mb-3">{p.icon}</div>
                  <p className="font-semibold font-['Space_Grotesk'] text-sm mb-2">{p.title}</p>
                  <p className="text-xs text-[#8892a0] leading-relaxed">{p.desc}</p>
                </Card>
              ))}
            </div>
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1e2530]">
                <p className="text-[10px] tracking-widest text-[#8892a0] font-['Space_Grotesk']">SENDING $100 — ALL PROVIDERS COMPARED</p>
              </div>
              {[
                { provider: 'SendArc (Arc Network)', fee: '$0.003', time: '0.78 seconds', best: true },
                { provider: 'Western Union', fee: '~$5.00', time: '1–5 business days', best: false },
                { provider: 'Bank Wire', fee: '~$25.00', time: '2–5 business days', best: false },
                { provider: 'PayPal', fee: '~$4.99', time: '3–5 days to withdraw', best: false },
              ].map(r => (
                <div key={r.provider} className={`flex justify-between items-center px-5 py-4 text-sm border-b border-[#1e2530] last:border-0 ${r.best ? 'bg-[#0a2030]' : ''}`}>
                  <span className={r.best ? 'text-white font-semibold font-["Space_Grotesk"]' : 'text-[#8892a0]'}>{r.provider}</span>
                  <div className="flex gap-10">
                    <span className={r.best ? 'text-[#00D4FF] font-bold' : 'text-red-400'}>{r.fee}</span>
                    <span className={r.best ? 'text-green-400' : 'text-[#556]'}>{r.time}</span>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>

        {/* ── WHY ARC ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <p className="section-label mb-3">WHY ARC NETWORK</p>
          <h2 className="text-2xl font-bold mb-3 font-['Space_Grotesk']">Built on the right infrastructure</h2>
          <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
            SendArc is built on Arc because Arc is purpose-built for real world financial activity not speculation or generalized computation. Arc focuses entirely on stablecoin-native execution, making it the ideal foundation for a remittance product that real people depend on.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {[
              { icon: '💵', title: 'Stablecoin-Based Gas Fees', desc: 'Arc uses USDC as gas eliminating volatile fees. For SendArc this means always $0.003, reliable remittance pricing, and easy financial forecasting.' },
              { icon: '⚡', title: 'Deterministic Finality', desc: 'Transactions finalize in under 1 second on Arc. SendArc users send and receive instantly no uncertainty, no counterparty risk, no waiting.' },
              { icon: '🔗', title: 'EVM Compatibility', desc: 'Arc is fully EVM-compatible. SendArc deploys Solidity smart contracts and integrates Ethereum tooling on a proven, auditable foundation.' },
                { icon: '🌐', title: 'Crosschain via CCTP', desc: "Arc integrates with Circle's CCTP bridge, enabling SendArc to accept USDC from Ethereum, Base, Arbitrum, and Solana for settlement." },
              { icon: '🏛️', title: 'Institutional Backing', desc: 'Backed by Goldman Sachs, Mastercard, and Visa the same institutions behind global payments infrastructure SendArc is here to improve.' },
              { icon: '✅', title: 'Compliance-Ready', desc: 'Arc provides enterprise grade infrastructure enabling regulated payment flows, transparent auditing, and institutional-grade financial tooling.' },
            ].map(f => (
              <Card key={f.title} className="p-5">
                <div className="text-2xl mb-3">{f.icon}</div>
                <p className="font-semibold font-['Space_Grotesk'] text-sm mb-2">{f.title}</p>
                <p className="text-xs text-[#8892a0] leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
          <div className="bg-[#0a2030] border-2 border-[#00D4FF] rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-[#0D1117] border border-[#00D4FF] rounded-lg px-4 py-2 text-[#00D4FF] font-bold text-sm">Arc Network</div>
              <div>
                <p className="font-bold font-['Space_Grotesk']">Built on Arc — powered by Circle</p>
                <p className="text-xs text-[#8892a0] mt-0.5">Stablecoin-native Layer-1 · Backed by Goldman Sachs, Mastercard &amp; Visa</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[{ v: '$0.003', l: 'AVG FEE PER TX' }, { v: '<1s', l: 'FINALITY' }, { v: '100%', l: 'USDC BACKED' }, { v: 'EVM', l: 'COMPATIBLE' }].map(s => (
                <div key={s.l} className="text-center bg-[#0D1117] border border-[#1e2530] rounded-xl p-4">
                  <p className="text-2xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{s.v}</p>
                  <p className="text-[10px] text-[#8892a0] tracking-widest mt-1">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {['Goldman Sachs', 'Mastercard', 'Visa', 'Circle (USDC)', 'CCTP'].map(b => (
                <span key={b} className="text-xs bg-[#13181f] border border-[#1e2530] px-3 py-1.5 rounded-lg text-[#8892a0]">{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── ARCHITECTURE ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="section-label mb-3">ARCHITECTURE</p>
            <h2 className="text-2xl font-bold mb-3 font-['Space_Grotesk']">System Architecture</h2>
            <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
              SendArc is designed as a modular, layered infrastructure stack — each layer purpose-built for performance, security, and scalability.
            </p>
            <div className="space-y-4 mb-10">
              {[
                { num: '01', name: 'Frontend Layer', stack: 'React · Tailwind CSS · Vite · Wagmi · RainbowKit', desc: 'Mobile-first interface with fast onboarding, wallet connectivity, live rate calculator, payment management, send flow, transaction dashboard, and on-chain receipt generation.', color: '#00D4FF' },
                { num: '02', name: 'API Layer', stack: 'Node.js · Express.js · MongoDB · Resend', desc: 'Backend REST API handling user sessions, transaction records, email receipts via Resend, exchange rate aggregation, and Arc Network RPC integration for on-chain data.', color: '#00FFCC' },
                { num: '03', name: 'Smart Contract Layer', stack: 'Solidity · EVM · Arc Network', desc: 'EVM-compatible Solidity contracts handling USDC transfers, payment verification, fee management ($0.003 protocol fee), and cross-border settlements on Arc.', color: '#0080FF' },
                { num: '04', name: 'Arc Settlement Layer', stack: 'Arc Network · USDC · Circle CCTP', desc: 'Arc primary settlement infrastructure providing sub-second finality, USDC-native gas, crosschain interoperability via CCTP, and stablecoin liquidity routing.', color: '#00D4FF' },
              ].map(l => (
                <Card key={l.num} className="p-5 flex gap-5 hover:border-[#00D4FF]/30 transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-['Space_Grotesk']"
                    style={{ background: `${l.color}15`, border: `1px solid ${l.color}40`, color: l.color }}>
                    {l.num}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <p className="font-semibold font-['Space_Grotesk'] text-white text-sm">{l.name}</p>
                      <span className="text-[10px] text-[#556] bg-[#13181f] border border-[#1e2530] px-2 py-0.5 rounded-full font-mono">{l.stack}</span>
                    </div>
                    <p className="text-xs text-[#8892a0] leading-relaxed">{l.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
            <Card className="overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1e2530] flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500 opacity-60" />
                  <span className="w-3 h-3 rounded-full bg-amber-500 opacity-60" />
                  <span className="w-3 h-3 rounded-full bg-green-500 opacity-60" />
                </div>
                <span className="text-[10px] text-[#556] font-mono ml-2">SendArc — example transfer flow</span>
              </div>
              <div className="p-5">
                <pre className="text-xs text-[#00D4FF] font-mono leading-relaxed overflow-x-auto">{`// User initiates transfer
sendArc.transfer({
  to: "0x8f2a...4e91",
  amount: 100_000000,   // 100 USDC (6 decimals)
  destinationChain: "arc-testnet",
  currency: "NGN"
})

// Arc settles in < 1 second
// Event: TransferComplete { txHash, amount, recipient, settlementTime }
// Receipt auto-generated on-chain → downloadable PDF`}</pre>
              </div>
            </Card>
          </div>
        </div>

        {/* ── USE CASES ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <p className="section-label mb-3">USE CASES</p>
          <h2 className="text-2xl font-bold mb-3 font-['Space_Grotesk']">Core Use Cases</h2>
          <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
            SendArc is designed to power a wide range of real-world financial activity — from individual remittances to enterprise payments.
          </p>
          <div className="space-y-4">
            {[
              { num: '01', icon: '💸', title: 'Diaspora Remittances', desc: 'Instantly send stablecoin-powered payments home with lower fees, faster settlement, transparent exchange rates, and borderless accessibility. SendArc removes the friction that costs diaspora communities billions in unnecessary fees every year.' },
              { num: '02', icon: '🏢', title: 'Cross-Border Business Payments', desc: 'Businesses operating across markets can pay suppliers instantly, settle invoices globally, reduce banking friction, and access stable digital payment rails — enabling the commercial velocity that modern economies demand.' },
              { num: '03', icon: '👨‍💻', title: 'Freelance & Creator Payments', desc: 'Instant creator payouts, remote worker payments, and global freelance settlements. Stablecoin-powered income preserves value against local currency volatility — giving global talent fair and timely compensation.' },
              { num: '04', icon: '🛒', title: 'Merchant Payments', desc: "Merchants can accept stablecoin payments, settle instantly, reduce processing costs, and access global customers — all through SendArc's programmable payment infrastructure." },
              { num: '05', icon: '💱', title: 'Stablecoin FX Infrastructure', desc: 'Onchain FX conversion, multi-currency liquidity routing, real-time exchange infrastructure, and transparent pricing systems — the stablecoin FX layer that modern global commerce needs.' },
            ].map(u => (
              <Card key={u.num} className="p-6 hover:border-[#00D4FF]/30 transition-all">
                <div className="flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#0a2030] border border-[#00D4FF]/30 flex items-center justify-center text-lg">{u.icon}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-[#556] font-['Space_Grotesk']">{u.num}</span>
                      <p className="font-bold font-['Space_Grotesk'] text-white text-sm">{u.title}</p>
                    </div>
                    <p className="text-sm text-[#8892a0] leading-relaxed">{u.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ── COMPETITIVE ADVANTAGE ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="section-label text-center mb-3">COMPETITIVE ADVANTAGE</p>
            <h2 className="text-2xl font-bold text-center mb-3 font-['Space_Grotesk']">What sets SendArc apart</h2>
            <p className="text-center text-[#8892a0] text-sm max-w-xl mx-auto mb-10 leading-relaxed">
              SendArc differentiates through purpose-built infrastructure and stablecoin-native architecture that legacy remittance providers simply cannot replicate.
            </p>
            <Card className="p-5 max-w-2xl mx-auto">
              {[
                'Stablecoin-native infrastructure built on Arc Network',
                'Deterministic sub-second settlement — irreversible finality',
                'Fixed $0.003 fee per transaction — never volatile',
                'Non-custodial — users always control their own funds',
                'EVM-compatible smart contract architecture',
                'Crosschain support via Circle CCTP (ETH, Base, Arbitrum, Solana)',
                'On-chain receipts — publicly verifiable on ArcScan',
                'No bank account required — wallet is your identity',
              ].map(f => (
                <div key={f} className="flex items-center justify-between py-3 border-b border-[#1e2530] last:border-0 text-sm">
                  <span className="text-[#8892a0]">{f}</span>
                  <span className="text-green-400 font-bold flex items-center gap-1.5 flex-shrink-0 ml-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />Yes
                  </span>
                </div>
              ))}
            </Card>
          </div>
        </div>

        {/* ── SECURITY ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <p className="section-label mb-3">SECURITY</p>
          <h2 className="text-2xl font-bold mb-3 font-['Space_Grotesk']">Security Framework</h2>
          <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
            SendArc is built with a security-first mindset across every layer of the stack. We never hold user funds — all transfers are non-custodial and settled directly on Arc Network.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {[
              { icon: '🔐', title: 'Non-Custodial Architecture', desc: 'SendArc never holds user funds. All transfers are peer-to-peer via smart contracts on Arc Network. Your keys, your money.' },
              { icon: '✅', title: 'Audited Smart Contracts', desc: 'Smart contracts independently audited by security firms before mainnet deployment. All code is open-source and publicly verifiable.' },
              { icon: '🔑', title: 'Multi-Sig Treasury', desc: 'Protocol treasury is protected by multi-signature systems requiring multiple approvals for any fund movement.' },
              { icon: '👁️', title: 'Real-Time Monitoring', desc: 'On-chain transaction monitoring and fraud detection systems running continuously across all transfer activity.' },
              { icon: '🛡️', title: 'Secure API Architecture', desc: 'Backend API protected with authentication, rate limiting, and role-based access permissions across all infrastructure.' },
              { icon: '📄', title: 'Full On-Chain Transparency', desc: 'Every transaction publicly verifiable on ArcScan. On-chain receipts are immutable, permanent, and shareable.' },
            ].map(s => (
              <Card key={s.title} className="p-5">
                <div className="text-2xl mb-3">{s.icon}</div>
                <p className="font-semibold font-['Space_Grotesk'] text-sm mb-2">{s.title}</p>
                <p className="text-xs text-[#8892a0] leading-relaxed">{s.desc}</p>
              </Card>
            ))}
          </div>
          <div className="bg-[#0a1520] border border-[#00D4FF]/20 rounded-xl p-5">
            <p className="text-xs text-[#8892a0] leading-relaxed">
              <span className="text-white font-semibold">USDC Safety: </span>
              All SendArc transfers are denominated in USDC — issued by Circle, backed 1:1 by US dollars held in regulated financial institutions, and fully audited monthly. USDC is the most trusted and regulated stablecoin for cross-border value transfer.
            </p>
          </div>
        </div>

        {/* ── ROADMAP ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="section-label text-center mb-3">ROADMAP</p>
            <h2 className="text-2xl font-bold text-center mb-3 font-['Space_Grotesk']">Development Roadmap</h2>
            <p className="text-center text-[#8892a0] text-sm max-w-xl mx-auto mb-10 leading-relaxed">
            SendArc development is structured across four phases — each building on the last to deliver progressively greater capability and reach.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  phase: 'Phase 1', title: 'Foundation', status: 'In Progress', color: '#00D4FF',
                  items: ['Frontend MVP — live at paragonfinance.xyz', 'Arc Testnet integration', 'Wallet connection (MetaMask, WalletConnect, Coinbase)', 'Live rate calculator and full send flow', 'Dashboard with transaction history', 'On-chain receipt generation']
                },
                {
                  phase: 'Phase 2', title: 'Payments Expansion', status: 'Upcoming', color: '#00FFCC',
                  items: ['Backend API — Node.js + MongoDB', 'Real USDC transfers on Arc Testnet', 'Email receipts via Resend', 'Cashout partner integrations (Yellow Card, Mara)', 'Crosschain support via Circle CCTP', 'Arc Mainnet launch']
                },
                {
                  phase: 'Phase 3', title: 'Infrastructure Expansion', status: 'Planned', color: '#0080FF',
                  items: ['Merchant payment acceptance', 'Business cross-border settlements', 'Stablecoin FX routing', 'Expanded country coverage', 'Embedded finance APIs', 'Enterprise treasury tooling']
                },
                {
                  phase: 'Phase 4', title: 'Financial Ecosystem Layer', status: 'Future', color: '#8892a0',
                  items: ['AI-powered financial tooling', 'Programmable payment automation', 'Advanced treasury systems', 'Developer APIs and SDK', 'Institutional integrations', 'Ecosystem-wide expansion']
                },
              ].map(p => (
                <Card key={p.phase} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg font-['Space_Grotesk'] mb-2 inline-block"
                        style={{ background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}30` }}>
                        {p.phase}
                      </span>
                      <p className="font-bold font-['Space_Grotesk'] text-white mt-1">{p.title}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-semibold font-['Space_Grotesk'] ${
                      p.status === 'In Progress' ? 'bg-green-900/20 border border-green-500 text-green-400' :
                      p.status === 'Upcoming' ? 'bg-[#0a2030] border border-[#00D4FF] text-[#00D4FF]' :
                      'bg-[#13181f] border border-[#1e2530] text-[#8892a0]'
                    }`}>{p.status}</span>
                  </div>
                  <div className="space-y-2">
                    {p.items.map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-[#8892a0]">
                        <span style={{ color: p.color }}>→</span>{item}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONCLUSION ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="section-label mb-3">CONCLUSION</p>
              <h2 className="text-2xl font-bold mb-4 font-['Space_Grotesk']">The future of money movement</h2>
              <p className="text-[#8892a0] leading-relaxed mb-4 text-sm">
            SendArc combines stablecoin infrastructure, Arc Network enterprise-grade blockchain architecture, and financial innovation to redefine cross-border payments — delivering a new standard for how money moves globally.
              </p>
              <p className="text-[#8892a0] leading-relaxed text-sm">
                SendArc is not just a remittance platform. It is building the financial infrastructure layer for the next generation of economic coordination — instant, borderless, stablecoin-powered, and globally accessible.
              </p>
            </div>
            <Card glow className="p-6">
              <p className="section-label mb-3">GET STARTED</p>
              <p className="text-base leading-relaxed text-white italic border-l-2 border-[#00D4FF] pl-4 mb-5">
                "Move money faster. Move money cheaper. Move money globally. Built on Arc. Powered by Stablecoins."
              </p>
              <div className="flex gap-3 flex-wrap mb-4">
                <a href="/testnet/send" className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-all">
                  Launch App →
                </a>
                <a href="/about" className="border border-[#1e2530] text-[#8892a0] text-sm px-5 py-2.5 rounded-xl hover:border-[#00D4FF] hover:text-white transition-all">
                  About SendArc
                </a>
              </div>
              <p className="text-[10px] text-[#556]">Confidential — For informational purposes only. Not an offer to sell securities.</p>
            </Card>
          </div>
        </div>

      </div>
      <Footer />
    </>
  )
}