import { Link } from 'react-router-dom'
import { COMPETITORS } from '../data/constants'
import { Badge, StatCard, Card } from '../components/UI'
import { Reveal, Typewriter } from '../components/Reveal'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="bg-[#0D1117] min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[500px] rounded-full bg-[#00D4FF] opacity-[0.06] blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#0055FF] opacity-[0.05] blur-[100px]" />
          <div className="absolute inset-0 grid-bg opacity-[0.03]" />
        </div>

        {/* Light sweep. Sits above the static glows but below the content,
            so it passes behind the text rather than washing over it. */}
        <div className="hero-sweep" />

        <div className="hero-content relative max-w-7xl mx-auto px-6 pt-20 pb-16">
          <div className="text-center max-w-3xl mx-auto mb-14">
            {/* The hero animates on mount rather than on scroll — it's
                already in view, so waiting for an intersection would mean
                it never fires. */}
            <Reveal from="none" delay={0}>
              <Badge>🌐 STABLECOIN FINANCIAL INFRASTRUCTURE</Badge>
            </Reveal>

            <Reveal delay={100}>
              {/* min-h holds the line's height steady as phrases of
                  different lengths cycle, so the subheading below doesn't
                  shift each time one empties out. */}
              <h1 className="mt-6 text-3xl md:text-6xl font-bold leading-tight">
                <span className="block min-h-[1.15em]">
                  <Typewriter
                    phrases={['Move Money', 'Bridge Tokens', 'Swap Tokens']}
                  />
                </span>
                <span className="gradient-text">Anywhere, Instantly.</span>
              </h1>
            </Reveal>

            <Reveal delay={220}>
              <p className="mt-5 text-[#8892a0] text-lg leading-relaxed">
                Send, bridge, and swap stablecoins across borders and chains in seconds.
              </p>
            </Reveal>

            <Reveal delay={340}>
              <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
                {/* Mainnet send button — disabled until Arc mainnet launches */}
                <button
                  disabled
                  title="Arc Network mainnet has not launched yet"
                  className="bg-[#1e2530] text-[#556] font-['Space_Grotesk'] font-bold text-base px-8 py-3 rounded-xl cursor-not-allowed flex items-center gap-2"
                >
                (🔒 Mainnet Coming Soon)
                </button>
                <Link
                  to="/how-it-works"
                  className="border border-[#1e2530] text-white font-['Space_Grotesk'] font-semibold text-base px-8 py-3 rounded-xl hover:border-[#00D4FF] transition-all"
                >
                  See How It Works
                </Link>
              </div>

              <Link
                to="/testnet/send"
                className="inline-block mt-4 text-sm text-[#00D4FF] hover:underline"
              >
                Try the live testnet now →
              </Link>
            </Reveal>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14">
            {[
              { value: '<1s',    label: 'SETTLEMENT TIME' },
              { value: '$0.003', label: 'AVG. FEE' },
              { value: '24/7',   label: 'ALWAYS OPEN' },
              { value: '10+',    label: 'CHAINS CONNECTED' },
            ].map((s, i) => (
              <Reveal key={s.label} delay={450 + i * 80}>
                <StatCard {...s} />
              </Reveal>
            ))}
          </div>

          {/* What you can do */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: '⚡',
                title: 'Send',
                desc: 'Move stablecoins to any wallet on Arc. Sub-second settlement, fees in fractions of a cent.',
                cta: 'Send now',
              },
              {
                icon: '🌉',
                title: 'Bridge',
                desc: 'Bring USDC in from Ethereum, Base, Arbitrum, Polygon and more via Circle CCTP.',
                cta: 'Bridge assets',
              },
              {
                icon: '🔄',
                title: 'Swap',
                desc: 'Convert between USDC, EURC and cirBTC through aggregated liquidity routing.',
                cta: 'Start swapping',
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 120}>
                <Card className="p-6 h-full hover:border-[#00D4FF]/40 transition-all">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-bold font-['Space_Grotesk'] text-white mb-2">{f.title}</h3>
                  <p className="text-xs text-[#8892a0] leading-relaxed mb-4">{f.desc}</p>
                  <Link to="/testnet/send" className="text-sm text-[#00D4FF] font-semibold hover:underline font-['Space_Grotesk']">
                    {f.cta} →
                  </Link>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Reveal>
          <p className="section-label text-center mb-3">SIMPLE PROCESS</p>
          <h2 className="text-center text-3xl font-bold mb-3">How Paragon Finance Works</h2>
          <p className="text-center text-[#8892a0] mb-12 max-w-xl mx-auto">
            Four steps from wallet to settled transaction.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            { num: '01', title: 'Connect wallet', desc: 'MetaMask, Rabby or Coinbase Wallet. No bank account, no signup form.' },
            { num: '02', title: 'Choose an action', desc: 'Send, bridge or swap. Costs and expected output shown before you commit.' },
            { num: '03', title: 'Sign once', desc: 'Routed through the best available liquidity and settled on Arc in a single transaction.' },
            { num: '04', title: 'Done in seconds', desc: 'Sub-second finality with an on-chain receipt you can verify on ArcScan.' },
          ].map((s, i) => (
            <Reveal key={s.num} delay={i * 110}>
              <Card className="p-6 h-full">
                <div className="w-9 h-9 rounded-full bg-[#0a2030] border-2 border-[#00D4FF] flex items-center justify-center mb-4">
                  <span className="text-[#00D4FF] text-xs font-bold font-['Space_Grotesk']">{s.num}</span>
                </div>
                <p className="font-bold font-['Space_Grotesk'] text-white text-sm mb-2">{s.title}</p>
                <p className="text-xs text-[#8892a0] leading-relaxed">{s.desc}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Fee Comparison */}
      <section className="bg-[#0f1822] border-t border-[#1e2530] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <p className="section-label text-center mb-3">FEE COMPARISON</p>
            <h2 className="text-center text-3xl font-bold mb-3">Paragon Finance vs The Old Way</h2>
            <p className="text-center text-[#8892a0] mb-10">Sending $100 across borders</p>
          </Reveal>

          <Reveal delay={120}>
            <Card className="overflow-hidden">
              <div className="divide-y divide-[#1e2530]">
                {COMPETITORS.map(r => (
                  <div key={r.name} className={'flex justify-between items-center px-5 py-4 text-sm ' + (r.badge === 'best' ? 'bg-[#0a2030]' : '')}>
                    <span className={r.badge === 'best' ? "text-white font-semibold font-['Space_Grotesk']" : 'text-[#8892a0]'}>
                      {r.name}
                    </span>
                    <div className="flex gap-6 sm:gap-10">
                      <span className={r.badge === 'best' ? 'text-[#00D4FF] font-bold' : 'text-red-400'}>{r.fee}</span>
                      <span className={r.badge === 'best' ? 'text-green-400' : 'text-[#556]'}>{r.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Arc Network Banner */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <Reveal>
          <div className="bg-[#0a2030] border-2 border-[#00D4FF] rounded-2xl p-8 relative overflow-hidden">
            {/* Slower sweep here — a second element moving at hero speed
                would compete with it rather than complement it. */}
            <div className="hero-sweep sweep-slow" />
            <div className="relative z-[2]">
              <p className="section-label mb-3">POWERED BY</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold font-['Space_Grotesk'] mb-3">
                    Built on Arc Network
                  </h3>
                  <p className="text-[#8892a0] text-sm leading-relaxed mb-4">
                    Paragon Finance runs on Arc, a stablecoin-native Layer-1 built by Circle and
                    backed by Goldman Sachs, Mastercard and Visa. USDC is the gas token, so costs
                    are predictable and quoted in the same unit you're already holding.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {['Goldman Sachs', 'Mastercard', 'Visa', 'Circle (USDC)', 'CCTP'].map(b => (
                      <span key={b} className="text-xs bg-[#13181f] border border-[#1e2530] px-3 py-1.5 rounded-lg text-[#8892a0]">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="text-center px-6 pb-20">
        <Reveal>
          <h2 className="text-3xl font-bold mb-4">Ready to move money globally?</h2>
          <p className="text-[#8892a0] mb-8">
            Swap, bridge and send stablecoins from one platform — built on Arc.
          </p>

          {/* Mainnet CTA — disabled until Arc mainnet launches */}
          <button
            disabled
            title="Arc Network mainnet has not launched yet"
            className="inline-flex items-center gap-2 bg-[#1e2530] text-[#556] font-['Space_Grotesk'] font-bold text-base px-10 py-4 rounded-xl cursor-not-allowed"
          >
            (🔒 Mainnet Coming Soon)
          </button>

          <div>
            <Link to="/testnet/send" className="inline-block mt-4 text-sm text-[#00D4FF] hover:underline">
              Try the live testnet now →
            </Link>
          </div>
        </Reveal>
      </section>

    </div>
  )
}