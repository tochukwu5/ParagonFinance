import { useState } from 'react'
import { Link } from 'react-router-dom'
import { COUNTRIES, COMPETITORS } from '../data/constants'
import { Badge, StatCard, Card } from '../components/UI'

export default function Home() {
  const [sendAmount, setSendAmount] = useState(100)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])

  const received = (sendAmount * selectedCountry.rate).toLocaleString()
  const liveCountries = COUNTRIES.filter(c => c.status === 'live')

  return (
    <div className="bg-[#0D1117] min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[500px] rounded-full bg-[#00D4FF] opacity-[0.06] blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#0055FF] opacity-[0.05] blur-[100px]" />
          <div className="absolute inset-0 grid-bg opacity-[0.03]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge>🌐 THE WORLD'S FASTEST REMITTANCE NETWORK</Badge>

            <h1 className="mt-6 text-5xl md:text-6xl font-bold leading-tight">
              Send Money<br />
              <span className="gradient-text">Anywhere, Instantly</span>
            </h1>

            <p className="mt-5 text-[#8892a0] text-lg leading-relaxed">
              Zero bank delays. Near-zero fees. Send USDC to 18+ countries across
              every continent recipients receive in under 1 second.
            </p>

            <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
              {/* Mainnet send button — disabled until Arc mainnet launches */}
              <button
                disabled
                title="Arc Network mainnet has not launched yet"
                className="bg-[#1e2530] text-[#556] font-['Space_Grotesk'] font-bold text-base px-8 py-3 rounded-xl cursor-not-allowed flex items-center gap-2"
              >
                Send money (🔒 Mainnet Coming Soon)
              </button>
              <Link
                to="/how-it-works"
                className="border border-[#1e2530] text-white font-['Space_Grotesk'] font-semibold text-base px-8 py-3 rounded-xl hover:border-[#00D4FF] transition-all"
              >
                See How It Works
              </Link>
            </div>

            <Link
              to="/testnet"
              className="inline-block mt-4 text-sm text-[#00D4FF] hover:underline"
            >
              Try the live testnet now →
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14">
            {[
              { value: '<1s',    label: 'SETTLEMENT TIME' },
              { value: '$0.003', label: 'AVG. FEE' },
              { value: '24/7',   label: 'ALWAYS OPEN' },
              { value: '18+',    label: 'COUNTRIES SUPPORTED' },
            ].map(s => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Live Calculator */}
          <div className="max-w-lg mx-auto">
            <Card glow className="p-6">
              <div className="flex justify-between items-center mb-5">
                <p className="font-['Space_Grotesk'] font-semibold text-sm">SEND MONEY</p>
                <span className="flex items-center gap-1.5 text-[11px] text-[#00D4FF]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
                  LIVE RATES
                </span>
              </div>

              <div className="mb-3">
                <p className="text-[10px] tracking-widests text-[#8892a0] mb-2">YOU SEND (USDC)</p>
                <div className="flex items-center gap-3 bg-[#0D1117] border border-[#1e2530] rounded-lg px-4 py-3">
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={e => setSendAmount(Number(e.target.value) || 0)}
                    className="flex-1 bg-transparent text-white text-xl font-bold outline-none font-['Space_Grotesk']"
                  />
                  <span className="text-sm text-white bg-[#1e2530] px-3 py-1 rounded-md">🇺🇸 USDC</span>
                </div>
              </div>

              <div className="flex justify-center my-3">
                <div className="w-8 h-8 rounded-full bg-[#0a2030] border border-[#00D4FF] flex items-center justify-center text-[#00D4FF] text-sm">↓</div>
              </div>

              <div className="mb-4">
                <p className="text-[10px] tracking-widests text-[#8892a0] mb-2">THEY RECEIVE</p>
                <div className="flex items-center gap-3 bg-[#0D1117] border border-[#1e2530] rounded-lg px-4 py-3">
                  <span className="flex-1 text-xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{received}</span>
                  <select
                    value={selectedCountry.code}
                    onChange={e => setSelectedCountry(COUNTRIES.find(c => c.code === e.target.value))}
                    className="bg-[#1e2530] text-white text-sm rounded-md px-2 py-1 outline-none border-none"
                  >
                    {liveCountries.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.currency}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 mb-5 text-sm">
                <div className="flex justify-between text-[#8892a0]">
                  <span>Exchange Rate</span>
                  <span className="text-[#00D4FF] font-semibold">
                    1 USDC = {selectedCountry.symbol}{selectedCountry.rate.toLocaleString()} {selectedCountry.currency}
                  </span>
                </div>
                <div className="flex justify-between text-[#8892a0]">
                  <span>Network Fee (Arc)</span>
                  <span className="text-[#00D4FF]">~$0.003</span>
                </div>
                <div className="flex justify-between text-[#8892a0]">
                  <span>You Save vs. Western Union</span>
                  <span className="text-green-400">~$4.97 per transfer</span>
                </div>
              </div>

              {/* Mainnet CTA — disabled */}
              <button
                disabled
                title="Arc Network mainnet has not launched yet"
                className="block w-full bg-[#1e2530] text-[#556] font-['Space_Grotesk'] font-bold text-center py-3 rounded-xl cursor-not-allowed"
              >
                Send money (🔒 Mainnet Coming Soon)
              </button>

              <p className="text-center text-[11px] text-[#556] mt-3">
                Powered by <span className="text-[#00D4FF]">Arc Network</span> · Built on Circle USDC
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Countries strip */}
      <section className="border-t border-b border-[#1e2530] bg-[#0f1822] py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-center section-label mb-3">GLOBAL REACH</p>
          <h2 className="text-center text-3xl font-bold mb-2">Send to 18+ Countries Worldwide</h2>
          <p className="text-center text-[#8892a0] text-sm mb-8">
            Africa · Americas · Asia Pacific · Europe · Middle East
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-3">
            {liveCountries.map(c => (
              <Link key={c.code} to="/countries">
                <div className="bg-[#0D1117] border border-[#1e2530] hover:border-[#00D4FF] transition-colors rounded-xl p-3 text-center group">
                  <div className="text-2xl mb-1.5">{c.flag}</div>
                  <div className="font-semibold text-xs font-['Space_Grotesk'] truncate">{c.name}</div>
                  <div className="text-[9px] text-[#8892a0] mt-0.5">{c.currency}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <p className="section-label text-center mb-3">SIMPLE PROCESS</p>
        <h2 className="text-center text-3xl font-bold mb-12">How ParagonFinance Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { num: '01', icon: '👛', title: 'Connect Your Wallet', desc: 'Connect MetaMask or any EVM wallet. No bank account needed. Works with USDC on Arc, Ethereum, Base, or Arbitrum.' },
            { num: '02', icon: '💸', title: 'Enter Amount & Recipient', desc: 'Choose your source chain, pick the destination country, and paste the recipient wallet address. Exact fees shown upfront.' },
            { num: '03', icon: '⚡', title: 'Arc Settles Instantly', desc: 'Arc Network confirms your transaction in under 1 second. No bank hours. No waiting. Deterministic, irreversible finality.' },
            { num: '04', icon: '✅', title: 'Recipient Gets USDC', desc: 'Your recipient gets USDC instantly in their wallet. On-chain receipt auto-generated and shareable via WhatsApp or PDF.' },
          ].map(step => (
            <Card key={step.num} className="p-6 relative">
              <div className="text-3xl font-bold text-[#1e2530] font-['Space_Grotesk'] mb-4">{step.num}</div>
              <div className="text-2xl mb-3">{step.icon}</div>
              <h3 className="font-['Space_Grotesk'] font-bold text-sm mb-2">{step.title}</h3>
              <p className="text-sm text-[#8892a0] leading-relaxed">{step.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Fee Comparison */}
      <section className="bg-[#0f1822] border-t border-[#1e2530] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="section-label text-center mb-3">FEE COMPARISON</p>
          <h2 className="text-center text-3xl font-bold mb-3">ParagonFinance vs The Old Way</h2>
          <p className="text-center text-[#8892a0] text-sm mb-10">Sending $100 internationally — all providers compared</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {COMPETITORS.map(c => (
              <div key={c.name} className={'rounded-xl p-6 text-center border ' + (c.badge === 'best' ? 'bg-[#0a2030] border-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.1)]' : 'bg-[#0D1117] border-[#1e2530]')}>
                <p className="text-[11px] text-[#8892a0] tracking-wider mb-3 font-['Space_Grotesk']">{c.name.toUpperCase()}</p>
                <p className={'text-4xl font-bold font-[\'Space_Grotesk\'] mb-2 ' + (c.badge === 'best' ? 'text-[#00D4FF]' : 'text-red-400')}>{c.fee}</p>
                <p className="text-xs text-[#8892a0] mb-4">{c.time}</p>
                {c.badge === 'best'
                  ? <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-900/30 border border-green-500 text-green-400">Best value</span>
                  : <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-900/20 border border-red-500 text-red-400">Avoid</span>
                }
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Arc Network Banner */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-[#0f1822] border border-[#1e2530] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <p className="section-label mb-3">POWERED BY</p>
            <h2 className="text-3xl font-bold mb-3">Built on Arc Network<br />by Circle</h2>
            <p className="text-[#8892a0] text-sm leading-relaxed max-w-md">
              ParagonFinance runs on Arc, a stablecoin-native Layer-1 blockchain built by Circle,
              the company behind USDC. Backed by Goldman Sachs, Mastercard, and Visa.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center flex-shrink-0">
            {[
              { v: '$0.003', l: 'AVG FEE PER TX' },
              { v: '<1s',    l: 'FINALITY' },
              { v: '100%',  l: 'USDC BACKED' },
            ].map(s => (
              <div key={s.l}>
                <div className="text-2xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{s.v}</div>
                <div className="text-[10px] text-[#8892a0] tracking-widests mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-6 pb-20">
        <h2 className="text-3xl font-bold mb-4">Ready to send money globally?</h2>
        <p className="text-[#8892a0] mb-8">Join the movement. Send smarter — anywhere in the world — with ParagonFinance.</p>

        {/* Mainnet CTA — disabled until Arc mainnet launches */}
        <button
          disabled
          title="Arc Network mainnet has not launched yet"
          className="inline-flex items-center gap-2 bg-[#1e2530] text-[#556] font-['Space_Grotesk'] font-bold text-base px-10 py-4 rounded-xl cursor-not-allowed"
        >
          Send money (🔒 Mainnet Coming Soon)
        </button>

        <div>
          <Link to="/testnet" className="inline-block mt-4 text-sm text-[#00D4FF] hover:underline">
            Try the live testnet now →
          </Link>
        </div>
      </section>
    </div>
  )
}