import { Link } from 'react-router-dom'
import { COMPETITORS } from '../data/constants'
import { Badge, Card } from '../components/UI'
import Footer from '../components/Footer'

// ─── Shared bits ──────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-semibold tracking-[2px] text-[#00D4FF] font-['Space_Grotesk'] mb-3">
      {children}
    </p>
  )
}

function InfoCard({ icon, title, desc }) {
  return (
    <div className="bg-[#0f1822] border border-[#1e2530] rounded-xl p-5 hover:border-[#00D4FF]/40 transition-all">
      {icon && <div className="text-2xl mb-3">{icon}</div>}
      <p className="font-semibold font-['Space_Grotesk'] text-white text-sm mb-2">{title}</p>
      <p className="text-xs text-[#8892a0] leading-relaxed">{desc}</p>
    </div>
  )
}

function CheckRow({ label }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1e2530] last:border-0 text-sm">
      <span className="text-[#8892a0]">{label}</span>
      <span className="text-green-400 font-bold flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />Yes
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HOW IT WORKS
// Focused on what people can DO with the platform — the use cases and the
// flow. The architecture behind it lives in Docs.
// ═══════════════════════════════════════════════════════════════════════════
export function HowItWorks() {
  return (
    <>
      <div className="bg-[#0D1117] min-h-screen">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden border-b border-[#1e2530]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full bg-[#00D4FF] opacity-[0.05] blur-[120px]" />
          </div>
          <div className="max-w-6xl mx-auto px-6 pt-16 pb-14 relative text-center">
            <Badge>HOW IT WORKS</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mt-5 mb-4 font-['Space_Grotesk']">
              One platform.<br />
              <span className="gradient-text">Every stablecoin rail.</span>
            </h1>
            <p className="text-[#8892a0] text-base leading-relaxed max-w-2xl mx-auto">
              Swap assets, access liquidity, move value across chains, and settle payments
              globally — without hopping between half a dozen disconnected applications.
            </p>
          </div>
        </div>

        {/* ── THE FLOW ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <SectionLabel>THE FLOW</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 font-['Space_Grotesk']">
            Four steps, under two minutes
          </h2>
          <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
            The same shape whether you're swapping stablecoins, bridging across chains,
            or sending money to family.
          </p>

          <div className="space-y-5">
            {[
              {
                num: '01',
                title: 'Connect your wallet',
                desc: 'MetaMask, Rabby, or Coinbase Wallet. No bank account, no signup form, no KYC gate before you can look around. Your wallet is your identity, and your balance is read directly from the chain.',
              },
              {
                num: '02',
                title: 'Choose what to do',
                desc: 'Send stablecoins to a wallet, bridge USDC in from another network, or swap between USDC, EURC and cirBTC. Costs and expected output are shown before you commit to anything.',
              },
              {
                num: '03',
                title: 'Sign once',
                desc: 'Paragon routes the transaction through the best available liquidity and settles it on Arc. Fees are denominated in USDC, so what you are quoted is what you pay — no gas token to acquire first, no volatile pricing.',
              },
              {
                num: '04',
                title: 'Settled and verifiable',
                desc: 'Arc finalises in under a second. Every transaction produces an on-chain receipt you can check on ArcScan, download, or share — not a reference number you have to phone someone about.',
              },
            ].map(s => (
              <div key={s.num} className="flex gap-5">
                <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#0a2030] border-2 border-[#00D4FF] flex items-center justify-center">
                  <span className="text-[#00D4FF] text-xs font-bold font-['Space_Grotesk']">{s.num}</span>
                </div>
                <Card className="flex-1 p-5 hover:border-[#00D4FF]/30 transition-all">
                  <p className="font-bold font-['Space_Grotesk'] text-white text-sm mb-2">{s.title}</p>
                  <p className="text-sm text-[#8892a0] leading-relaxed">{s.desc}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* ── CORE USE CASES ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionLabel>WHAT YOU CAN DO</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-['Space_Grotesk']">
              Core use cases
            </h2>
            <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
              Paragon is built as financial infrastructure rather than a single-purpose app.
              Remittance is one thing it does well, not the whole of what it is.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  icon: '🔄',
                  title: 'DeFi swaps',
                  desc: 'Swap supported assets through aggregated liquidity. Pricing is transparent, execution is routed for the best available fill, and slippage tolerance is yours to set.',
                },
                {
                  icon: '🌊',
                  title: 'Liquidity aggregation',
                  desc: 'Rather than relying on one pool, Paragon routes across available liquidity sources. That means deeper books, better pricing, and less slippage — particularly on larger trades.',
                },
                {
                  icon: '💵',
                  title: 'Stablecoin finance',
                  desc: 'Hold, convert and move USDC, EURC and cirBTC. Use them for payments, treasury, FX, or as the settlement asset for anything else on the platform.',
                },
                {
                  icon: '🔗',
                  title: 'Cross-chain DeFi',
                  desc: 'Bring liquidity in from Ethereum, Base, Arbitrum, Optimism, Polygon, Avalanche and more. Bridging happens through Circle CCTP, so the USDC that arrives is native, not wrapped.',
                },
                {
                  icon: '🏛️',
                  title: 'Treasury management',
                  desc: 'Tools for organisations managing on-chain capital: stablecoin treasury, liquidity rebalancing, multi-asset positions, and cross-border movement between entities.',
                },
                {
                  icon: '📈',
                  title: 'Yield & DeFi integrations',
                  desc: 'Access to lending protocols, liquidity markets and yield strategies. Which integrations ship depends on protocol availability, risk parameters and security review — we would rather be slow than sorry here.',
                },
                {
                  icon: '🌍',
                  title: 'Cross-border payments',
                  desc: 'Diaspora transfers, business settlements, merchant payments, freelancer payouts. The rails that make remittance cheap are the same rails that make any cross-border payment cheap.',
                },
                {
                  icon: '🏪',
                  title: 'Merchant & business finance',
                  desc: 'Accept stablecoin settlements, pay suppliers, move treasury between markets, and manage digital assets — without a correspondent bank in the middle taking a cut and a week.',
                },
              ].map(u => <InfoCard key={u.title} {...u} />)}
            </div>
          </div>
        </div>

        {/* ── WHO IT'S FOR ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <SectionLabel>WHO IT'S FOR</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 font-['Space_Grotesk']">
            Built for people who move money
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { icon: '👨‍👩‍👧', label: 'Diaspora senders' },
              { icon: '🏢', label: 'Businesses' },
              { icon: '🏪', label: 'Merchants' },
              { icon: '💻', label: 'Freelancers' },
              { icon: '🎨', label: 'Creators' },
              { icon: '⚡', label: 'DeFi users' },
              { icon: '🛠️', label: 'Developers' },
              { icon: '📊', label: 'Treasury managers' },
              { icon: '🏦', label: 'Institutions' },
              { icon: '🌍', label: 'Everyone else' },
            ].map(a => (
              <div key={a.label} className="bg-[#0f1822] border border-[#1e2530] rounded-xl p-4 text-center hover:border-[#00D4FF]/30 transition-all">
                <div className="text-2xl mb-2">{a.icon}</div>
                <p className="text-xs text-[#8892a0]">{a.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── COMPARISON ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionLabel>THE DIFFERENCE</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-bold mb-8 font-['Space_Grotesk']">
              Sending $100 across borders
            </h2>

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
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 font-['Space_Grotesk']">
            Try it on testnet
          </h2>
          <p className="text-[#8892a0] text-sm mb-8 max-w-lg mx-auto">
            Send, bridge and swap on Arc Testnet with free USDC from Circle's faucet.
            Everything works exactly as it will on mainnet.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/testnet/send"
              className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-all">
              Launch testnet →
            </Link>
            <Link to="/docs"
              className="border border-[#1e2530] text-[#8892a0] text-sm px-6 py-3 rounded-xl hover:border-[#00D4FF] hover:text-white transition-all">
              Read the docs
            </Link>
          </div>
        </div>

      </div>
      <Footer />
    </>
  )
}

export function AboutPage() {
  return (
    <>
      <div className="bg-[#0D1117] min-h-screen">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden border-b border-[#1e2530]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full bg-[#00D4FF] opacity-[0.05] blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-[#0055FF] opacity-[0.04] blur-[100px]" />
          </div>
          <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative">
            <div>
              <Badge>OUR STORY</Badge>
              <h1 className="text-4xl font-bold mt-5 mb-4 font-['Space_Grotesk']">
                Financial infrastructure,{' '}
                <span className="gradient-text">built for how money actually moves</span>
              </h1>
              <p className="text-[#8892a0] leading-relaxed mb-4 text-sm">
                Paragon Finance started from a frustration most people in this part of the world
                know first-hand: watching money sent home arrive smaller than it left, days later
                than promised, with no way to see where it went in between.
              </p>
              <p className="text-[#8892a0] leading-relaxed text-sm">
                Fixing that meant building on rails that settle in seconds and cost fractions of a
                cent. But once those rails exist, they don't only carry remittances. They carry
                swaps, treasury movement, merchant settlement, and everything else that has been
                waiting on infrastructure this cheap and this fast.
              </p>
            </div>
            <Card glow className="p-6">
              <SectionLabel>OUR MISSION</SectionLabel>
              <p className="text-base leading-relaxed text-white italic border-l-2 border-[#00D4FF] pl-4">
                To provide accessible, transparent, and programmable financial infrastructure that
                lets people and businesses interact with stablecoins, liquidity, DeFi, and
                cross-border finance through a single platform.
              </p>
            </Card>
          </div>
        </div>

        {/* ── THE PROBLEM ── */}
        <div className="bg-[#0f1822] border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionLabel>THE PROBLEM</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-['Space_Grotesk']">
              On-chain finance works. Getting to it doesn't.
            </h2>
            <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
              Decentralised finance created real opportunities, but reaching them is fragmented.
              To do anything meaningful, people end up juggling separate applications for each
              step — and liquidity is scattered across protocols and networks in the same way.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
              {[
                {
                  icon: '🧩',
                  title: 'Fragmented tools',
                  desc: 'Swap on one platform, bridge on another, find liquidity on a third, handle payments somewhere else entirely. Each with its own wallet connection, its own fees, and its own way of going wrong.',
                },
                {
                  icon: '🌊',
                  title: 'Fragmented liquidity',
                  desc: 'Liquidity split across protocols and chains means worse execution, higher slippage, and costs that only become visible after the transaction has gone through.',
                },
                {
                  icon: '💸',
                  title: 'Expensive rails',
                  desc: 'Traditional cross-border transfer averages 6 to 8 percent, and sending $100 by bank wire can cost $25 before the exchange rate markup is counted.',
                },
                {
                  icon: '🚫',
                  title: 'Access gaps',
                  desc: 'For African users and businesses, all of the above compounds: limited access to global financial infrastructure, fragmented payment systems, and conversion friction at every border.',
                },
              ].map(p => <InfoCard key={p.title} {...p} />)}
            </div>

            <Card className="p-6">
              <p className="text-sm leading-relaxed text-white italic border-l-2 border-[#00D4FF] pl-4">
                Paragon exists to collapse that. Instead of requiring people to move between
                disconnected applications, it aims to be a single gateway to stablecoin-powered
                finance.
              </p>
            </Card>
          </div>
        </div>

        {/* ── VISION & MISSION ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <SectionLabel>VISION &amp; MISSION</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 font-['Space_Grotesk']">
            Where this is going
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="p-6">
              <SectionLabel>VISION</SectionLabel>
              <p className="text-white font-['Space_Grotesk'] font-semibold text-sm leading-relaxed">
                To become a leading African-focused DeFi and stablecoin platform, connecting users,
                businesses, liquidity, and decentralised financial infrastructure — and making
                on-chain finance usable for everyday financial activity, not just for traders.
              </p>
            </Card>
            <Card glow className="p-6">
              <SectionLabel>MISSION</SectionLabel>
              <p className="text-white font-['Space_Grotesk'] font-semibold text-sm leading-relaxed">
                To provide accessible, transparent, and programmable financial infrastructure that
                enables users and businesses to interact with DeFi, stablecoins, liquidity, and
                cross-border finance through a unified platform.
              </p>
            </Card>
          </div>
        </div>

        {/* ── WHY ARC ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionLabel>WHY ARC NETWORK</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-['Space_Grotesk']">
              Built on infrastructure designed for money
            </h2>
            <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
              Arc is built around stablecoin-native financial activity rather than general-purpose
              computation. That focus is the reason Paragon can offer predictable costs and
              sub-second settlement without asking users to understand any of it.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {[
                { icon: '💵', title: 'Stablecoin gas', desc: 'Arc uses USDC to pay for transactions. Costs are predictable and quoted in the same unit users are already holding — no separate gas token to acquire first.' },
                { icon: '⚡', title: 'Fast finality', desc: 'Transactions finalise in under a second, with no challenge period. The settlement is final the moment it happens.' },
                { icon: '🔗', title: 'EVM compatible', desc: 'Solidity contracts, existing Ethereum tooling, and wallet integrations all work — which means less bespoke infrastructure and fewer places for things to break.' },
                { icon: '🌐', title: 'Cross-chain native', desc: 'Circle CCTP connects Arc to Ethereum, Base, Arbitrum, Optimism, Polygon, Avalanche and more, so liquidity can come from wherever it already sits.' },
                { icon: '🏛️', title: 'Institutional backing', desc: 'Arc is built by Circle and backed by Goldman Sachs, Mastercard and Visa — the institutions behind existing global payments infrastructure.' },
                { icon: '✅', title: 'Compliance-ready', desc: 'Enterprise-grade infrastructure supporting regulated payment flows, transparent auditing, and institutional financial tooling.' },
              ].map(f => <InfoCard key={f.title} {...f} />)}
            </div>

            <div className="bg-[#0a2030] border-2 border-[#00D4FF] rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6 flex-wrap">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {/* ── TEAM ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <SectionLabel>THE BUILDERS</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 font-['Space_Grotesk']">
            Who's behind Paragon Finance
          </h2>

          <div className="space-y-5">
            <Card className="p-7 flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 rounded-2xl bg-[#0a2030] border-2 border-[#00D4FF] flex items-center justify-center text-2xl font-bold text-[#00D4FF] font-['Space_Grotesk'] flex-shrink-0">
                EJ
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold font-['Space_Grotesk']">Eze Julius</h3>
                  <span className="text-xs text-[#556] font-mono">@6figuresdev33</span>
                </div>
                <p className="text-sm text-[#00D4FF] mb-3">
                  Founder of <span className="font-bold">Paragon Finance</span> | Fullstack Developer
                </p>
                <p className="text-sm text-[#8892a0] leading-relaxed mb-4">
                  Eze Julius is a MERN stack developer and builder from Nigeria with over 4 years of
                  experience building scalable web applications and digital products. He founded
                  Paragon Finance to make stablecoin-powered financial infrastructure accessible to
                  users and businesses across Africa and beyond.
                </p>
                <div className="flex gap-2 flex-wrap">
                  {['React.js', 'Node.js', 'MongoDB', 'Tailwind CSS', 'Web3', 'Founder'].map(t => (
                    <span key={t} className="text-xs border border-[#1e2530] text-[#8892a0] px-3 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-7 flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 rounded-2xl bg-[#0a2030] border-2 border-[#00D4FF] flex items-center justify-center text-2xl font-bold text-[#00D4FF] font-['Space_Grotesk'] flex-shrink-0">
                DE
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold font-['Space_Grotesk']">David Emeremgini</h3>
                  <span className="text-xs text-[#556] font-mono">@daviwork</span>
                </div>
                <p className="text-sm text-[#00D4FF] mb-3">
                  Co-Founder of <span className="font-bold">Paragon Finance</span> | Fullstack Developer
                </p>
                <p className="text-sm text-[#8892a0] leading-relaxed mb-4">
                  David is a MERN stack developer based in Enugu, Nigeria, with over 4 years of
                  experience building production-grade web applications. He studied Computer
                  Statistics at the University of Nigeria, Nsukka, and works as a Fullstack
                  Developer at Enzo Solution Network while co-founding Paragon Finance.
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

        {/* ── LONG-TERM VISION ── */}
        <div className="bg-[#0f1822] border-t border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionLabel>LONG-TERM VISION</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-['Space_Grotesk']">
              Beyond a single-purpose app
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-[#8892a0] leading-relaxed mb-4 text-sm">
                  Financial infrastructure is moving on-chain, and the shape it's taking is
                  stablecoin-powered, programmable, interoperable and global. Paragon aims to be the
                  layer that connects people and businesses to it.
                </p>
                <p className="text-[#8892a0] leading-relaxed text-sm">
                  From swapping assets and accessing liquidity to managing treasury capital and
                  moving money across borders — the objective is to make decentralised financial
                  infrastructure something people can actually use, without needing to understand
                  what's underneath.
                </p>
              </div>
              <Card glow className="p-6">
                <p className="text-base leading-relaxed text-white italic border-l-2 border-[#00D4FF] pl-4 mb-5">
                  Remittance remains an important application. It is no longer the limit of the
                  platform.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Link to="/testnet/send"
                    className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-all">
                    Launch app →
                  </Link>
                  <Link to="/docs"
                    className="border border-[#1e2530] text-[#8892a0] text-sm px-5 py-2.5 rounded-xl hover:border-[#00D4FF] hover:text-white transition-all">
                    Read the docs
                  </Link>
                </div>
              </Card>
            </div>

            <div className="flex gap-2 flex-wrap justify-center mt-10">
              {['Built on Arc', 'Powered by stablecoins', 'Connected to DeFi'].map(t => (
                <span key={t} className="text-xs bg-[#0D1117] border border-[#1e2530] px-4 py-2 rounded-full text-[#8892a0]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCS
// The whitepaper: architecture, infrastructure, security, roadmap. The
// narrative lives in About; the practical guide lives in How It Works.
// ═══════════════════════════════════════════════════════════════════════════
export function DocsPage() {
  return (
    <>
      <div className="bg-[#0D1117] min-h-screen">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden border-b border-[#1e2530]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full bg-[#00D4FF] opacity-[0.05] blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-[#0055FF] opacity-[0.04] blur-[100px]" />
          </div>
          <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 relative">
            <div className="flex items-center gap-2 text-xs text-[#8892a0] mb-5">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-[#00D4FF]">Documentation</span>
            </div>
            <Badge>WHITE PAPER v2.0</Badge>
            <h1 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk'] mt-5 mb-4">
              Paragon Finance <span className="gradient-text">Documentation</span>
            </h1>
            <p className="text-[#8892a0] text-base leading-relaxed max-w-2xl mb-8">
              Global all-in-one financial infrastructure, built on Arc Network. This document covers
              the architecture, infrastructure, security model and roadmap of the Paragon protocol.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link to="/testnet/send"
                className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-all">
                Launch app →
              </Link>
              <a href="https://docs.arc.io" target="_blank" rel="noreferrer"
                className="border border-[#1e2530] text-[#8892a0] text-sm px-6 py-3 rounded-xl hover:border-[#00D4FF] hover:text-white transition-all">
                Arc Network docs ↗
              </a>
            </div>
          </div>
        </div>

        {/* ── EXECUTIVE SUMMARY ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <SectionLabel>EXECUTIVE SUMMARY</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-bold mb-5 font-['Space_Grotesk']">
            What Paragon is building
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start mb-10">
            <div>
              <p className="text-[#8892a0] leading-relaxed mb-4 text-sm">
                Paragon Finance is a stablecoin-native DeFi platform built on Arc Network, designed
                to give users and businesses access to decentralised financial infrastructure
                through a single ecosystem.
              </p>
              <p className="text-[#8892a0] leading-relaxed text-sm">
                It brings together swaps, liquidity aggregation, stablecoin finance, cross-chain
                infrastructure, treasury tools and cross-border payments — improving liquidity,
                execution, transparency and accessibility for users across Africa and globally.
              </p>
            </div>
            <Card glow className="p-6">
              <SectionLabel>POSITIONING</SectionLabel>
              <p className="text-white font-['Space_Grotesk'] font-semibold text-base italic border-l-2 border-[#00D4FF] pl-4 leading-relaxed">
                "Built on Arc. Powered by stablecoins. Connected to DeFi."
              </p>
              <div className="flex gap-2 flex-wrap mt-4">
                {['<1s Settlement', '$0.003 Fee', 'EVM Compatible', 'Multi-chain'].map(t => (
                  <span key={t} className="text-[11px] border border-[#1e2530] text-[#8892a0] px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: '💵', title: 'Stablecoin-native settlement', desc: 'USDC transfers settle directly on-chain — instant, final and verifiable.' },
              { icon: '📊', title: 'Predictable costs', desc: 'Fees denominated in USDC. Never volatile, never a surprise at signing time.' },
              { icon: '🔗', title: 'Crosschain interoperability', desc: 'Liquidity from Ethereum, Base, Arbitrum, Optimism, Polygon, Avalanche and more.' },
              { icon: '⚙️', title: 'EVM-compatible', desc: 'Solidity contracts on proven, auditable infrastructure with existing tooling.' },
              { icon: '🌊', title: 'Liquidity aggregation', desc: 'Routing across multiple sources rather than depending on any single pool.' },
              { icon: '📄', title: 'On-chain receipts', desc: 'Every transaction publicly verifiable on ArcScan — no reference numbers to chase.' },
            ].map(f => <InfoCard key={f.title} {...f} />)}
          </div>
        </div>

        {/* ── ARC INFRASTRUCTURE ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionLabel>CORE INFRASTRUCTURE</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-['Space_Grotesk']">
              Arc infrastructure powering Paragon
            </h2>
            <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
              Arc is purpose-built for real-world financial activity rather than generalised
              computation. Each property below maps to something Paragon could not otherwise offer.
            </p>

            <div className="space-y-4">
              {[
                {
                  num: '5.1',
                  name: 'Stablecoin-based gas',
                  color: '#00D4FF',
                  desc: 'Arc uses USDC as gas, giving predictable transaction costs and removing exposure to volatile gas pricing. For Paragon this means costs users can forecast, a simpler experience, and more reliable financial operations.',
                },
                {
                  num: '5.2',
                  name: 'Fast finality',
                  color: '#00FFCC',
                  desc: 'Transactions finalise in under a second with no challenge period. That supports rapid swaps, faster settlement, responsive DeFi applications, and payment execution that completes while the user is still watching.',
                },
                {
                  num: '5.3',
                  name: 'EVM compatibility',
                  color: '#0080FF',
                  desc: 'Solidity contracts and existing Ethereum-compatible infrastructure work directly. That enables contract deployment, DeFi protocol integrations, wallet support, developer tooling, and programmable financial applications.',
                },
                {
                  num: '5.4',
                  name: 'Cross-chain infrastructure',
                  color: '#00D4FF',
                  desc: 'Circle CCTP connects Arc to supported networks, enabling cross-chain asset movement, stablecoin bridging, access to external liquidity, and multi-chain DeFi integrations — with native USDC on arrival rather than a wrapped derivative.',
                },
                {
                  num: '5.5',
                  name: 'Financial infrastructure',
                  color: '#00FFCC',
                  desc: 'A foundation for transparent, programmable financial applications: DeFi products, treasury systems, payment infrastructure, liquidity systems and financial automation.',
                },
              ].map(l => (
                <div key={l.num} className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-5 flex gap-5 hover:border-[#00D4FF]/30 transition-all">
                  <div className="flex-shrink-0 w-12 h-10 rounded-lg flex items-center justify-center text-xs font-bold font-['Space_Grotesk']"
                    style={{ background: l.color + '15', border: '1px solid ' + l.color + '40', color: l.color }}>
                    {l.num}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold font-['Space_Grotesk'] text-white text-sm mb-1.5">{l.name}</p>
                    <p className="text-xs text-[#8892a0] leading-relaxed">{l.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ARCHITECTURE ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <SectionLabel>ARCHITECTURE</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 font-['Space_Grotesk']">
            System architecture
          </h2>
          <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
            Paragon is a modular, layered stack. Each layer is separable, which matters because
            liquidity sources, bridges and DeFi protocols all change faster than the platform
            itself should.
          </p>

          <div className="space-y-4 mb-10">
            {[
              {
                num: '01',
                name: 'User & Application Layer',
                stack: 'React · Tailwind · Vite',
                color: '#00D4FF',
                desc: 'The unified gateway: wallet connectivity, asset management, swaps, liquidity access, cross-chain transactions, payment management, transaction tracking and financial dashboards.',
              },
              {
                num: '02',
                name: 'Paragon Protocol Layer',
                stack: 'Solidity · EVM',
                color: '#00FFCC',
                desc: 'Coordinates the platform: transaction routing, swap execution, liquidity aggregation, fee management, payment execution, treasury routing, DeFi integrations and automated financial operations.',
              },
              {
                num: '03',
                name: 'DeFi & Liquidity Layer',
                stack: 'Multi-source routing',
                color: '#0080FF',
                desc: 'Connects Paragon to decentralised liquidity: aggregation, swap routing, stablecoin swaps, multi-source liquidity, protocol integrations, optimisation, yield and treasury liquidity. The objective is competitive execution without users hunting across venues manually.',
              },
              {
                num: '04',
                name: 'Cross-Chain Layer',
                stack: 'Circle CCTP',
                color: '#00D4FF',
                desc: 'Connects supported networks and liquidity environments: stablecoin bridging, cross-chain swaps, liquidity movement, multi-chain DeFi access and cross-chain financial applications.',
              },
              {
                num: '05',
                name: 'Arc Settlement Layer',
                stack: 'Arc Network · USDC',
                color: '#00FFCC',
                desc: 'The primary settlement environment: transaction settlement, stablecoin settlement, gas management, fast finality and smart contract execution.',
              },
            ].map(l => (
              <div key={l.num} className="bg-[#0f1822] border border-[#1e2530] rounded-xl p-5 flex gap-5 hover:border-[#00D4FF]/30 transition-all">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-['Space_Grotesk']"
                  style={{ background: l.color + '15', border: '1px solid ' + l.color + '40', color: l.color }}>
                  {l.num}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <p className="font-semibold font-['Space_Grotesk'] text-white text-sm">{l.name}</p>
                    <span className="text-[10px] text-[#556] bg-[#13181f] border border-[#1e2530] px-2 py-0.5 rounded-full font-mono">
                      {l.stack}
                    </span>
                  </div>
                  <p className="text-xs text-[#8892a0] leading-relaxed">{l.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contract suite */}
          <SectionLabel>DEPLOYED CONTRACTS</SectionLabel>
          <h3 className="text-lg font-bold mb-5 font-['Space_Grotesk']">
            Paragon contract suite on Arc
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'ParagonPaymentRouter', desc: 'Processes sends. Splits the protocol fee to Treasury and forwards the remainder to the recipient, atomically in one transaction.' },
              { name: 'ParagonBridgeRouter', desc: 'Handles bridge fee capture, verifying the source against the registry before routing.' },
              { name: 'ParagonFeeManager', desc: 'Single source of fee configuration. Rates update here without redeploying the routers.' },
              { name: 'ParagonTreasury', desc: 'Receives all protocol fees. Withdrawals restricted to the owner, with every deposit recorded on-chain.' },
              { name: 'ParagonBridgeRegistry', desc: 'Whitelist of approved bridge partners, so funds only ever route through sources that have been explicitly vetted.' },
            ].map(c => (
              <Card key={c.name} className="p-5">
                <p className="font-mono text-xs text-[#00D4FF] mb-2">{c.name}</p>
                <p className="text-xs text-[#8892a0] leading-relaxed">{c.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* ── LIQUIDITY STRATEGY ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionLabel>LIQUIDITY &amp; EXECUTION</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-['Space_Grotesk']">
              How routing works
            </h2>
            <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
              Liquidity is the core of the infrastructure. Paragon connects multiple sources and
              routes each transaction based on the conditions available at the moment it executes,
              rather than defaulting to a single venue.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {['Price', 'Liquidity depth', 'Slippage', 'Transaction efficiency', 'Supported assets', 'Network conditions'].map(o => (
                <div key={o} className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-4 text-center">
                  <p className="text-sm text-white font-semibold font-['Space_Grotesk']">{o}</p>
                </div>
              ))}
            </div>

            <Card className="p-6">
              <p className="text-sm leading-relaxed text-white italic border-l-2 border-[#00D4FF] pl-4">
                This lets Paragon function as an access layer between users and decentralised
                liquidity — rather than as another venue competing for it.
              </p>
            </Card>
          </div>
        </div>

        {/* ── SECURITY ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <SectionLabel>SECURITY</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 font-['Space_Grotesk']">
            Security framework
          </h2>
          <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
            Security is treated as a property of every layer — application, contract, liquidity and
            treasury — rather than something bolted on at the end. Paragon is non-custodial: user
            funds are never held by the platform.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {[
              { icon: '🔐', title: 'Non-custodial architecture', desc: 'Paragon never holds user funds. Transfers move peer-to-peer through smart contracts. Your keys, your money.' },
              { icon: '✅', title: 'Audited smart contracts', desc: 'Contracts are independently audited before mainnet deployment, and verified on-chain so anyone can read what they actually do.' },
              { icon: '🔑', title: 'Multi-signature treasury', desc: 'Protocol treasury protected by multi-signature approval, so no single key can move funds.' },
              { icon: '👁️', title: 'Transaction monitoring', desc: 'On-chain monitoring and fraud detection running continuously across transfer activity.' },
              { icon: '🛡️', title: 'Role-based permissions', desc: 'Backend protected with authentication, rate limiting and role-based access. Admin functions gated at the contract level.' },
              { icon: '📄', title: 'Full transparency', desc: 'Every transaction publicly verifiable on ArcScan. On-chain receipts are immutable and permanently accessible.' },
            ].map(s => <InfoCard key={s.title} {...s} />)}
          </div>

          <div className="bg-[#0a1520] border border-[#00D4FF]/20 rounded-xl p-5">
            <p className="text-xs text-[#8892a0] leading-relaxed">
              <span className="text-white font-semibold">On stablecoin safety: </span>
              Transfers are denominated in USDC and EURC — issued by Circle, backed 1:1 by reserves
              held in regulated financial institutions, and independently audited. Protocol risk is
              assessed before any DeFi integration ships, and integrations that don't clear that
              review don't ship.
            </p>
          </div>
        </div>

        {/* ── SCALABILITY ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionLabel>SCALABILITY</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-bold mb-8 font-['Space_Grotesk']">
              Designed to grow
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="text-[10px] tracking-[2px] text-[#8892a0] mb-4">ADVANTAGES</p>
                <div className="space-y-2">
                  {['Arc fast finality', 'EVM-compatible infrastructure', 'Stablecoin-native settlement', 'Cross-chain interoperability', 'Modular protocol integrations', 'Liquidity aggregation'].map(a => (
                    <div key={a} className="flex items-center gap-2.5 text-sm text-[#8892a0]">
                      <span className="text-[#00D4FF]">→</span>{a}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] tracking-[2px] text-[#8892a0] mb-4">SUPPORTS</p>
                <div className="space-y-2">
                  {['Growing user activity', 'Higher transaction volumes', 'Additional DeFi integrations', 'Enterprise applications', 'Pan-African financial infrastructure', 'Institutional integrations'].map(a => (
                    <div key={a} className="flex items-center gap-2.5 text-sm text-[#8892a0]">
                      <span className="text-[#00FFCC]">→</span>{a}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ROADMAP ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <SectionLabel>ROADMAP</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 font-['Space_Grotesk']">
            Development roadmap
          </h2>
          <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
            Four phases, each building on the last. Liquidity comes before DeFi expansion for a
            reason — integrations are only as good as the execution underneath them.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                phase: 'Phase 1',
                title: 'DeFi Foundation',
                status: 'In Progress',
                color: '#00D4FF',
                items: ['Paragon MVP — live at paragonfinance.xyz', 'Arc infrastructure integration', 'Core smart contracts deployed', 'Multi-wallet support', 'Stablecoin swaps', 'Initial liquidity integrations'],
              },
              {
                phase: 'Phase 2',
                title: 'Liquidity & Execution',
                status: 'Upcoming',
                color: '#00FFCC',
                items: ['Multi-source liquidity routing', 'Swap aggregation', 'Cross-chain liquidity', 'Slippage optimisation', 'Expanded stablecoin support', 'Additional liquidity partners'],
              },
              {
                phase: 'Phase 3',
                title: 'DeFi Expansion',
                status: 'Planned',
                color: '#0080FF',
                items: ['DeFi protocol integrations', 'Liquidity products', 'Yield integrations', 'Treasury management', 'Automated financial strategies', 'Expanded cross-chain functionality'],
              },
              {
                phase: 'Phase 4',
                title: 'Financial Ecosystem',
                status: 'Future',
                color: '#8892a0',
                items: ['Cross-border payments at scale', 'Merchant infrastructure', 'Business financial tooling', 'Developer APIs', 'Enterprise integrations', 'Institutional infrastructure'],
              },
            ].map(p => (
              <Card key={p.phase} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg font-['Space_Grotesk'] inline-block"
                      style={{ background: p.color + '15', color: p.color, border: '1px solid ' + p.color + '30' }}>
                      {p.phase}
                    </span>
                    <p className="font-bold font-['Space_Grotesk'] text-white mt-2">{p.title}</p>
                  </div>
                  <span className={
                    'text-[10px] px-2 py-1 rounded-full font-semibold font-["Space_Grotesk"] ' +
                    (p.status === 'In Progress' ? 'bg-green-900/20 border border-green-500 text-green-400' :
                     p.status === 'Upcoming' ? 'bg-[#0a2030] border border-[#00D4FF] text-[#00D4FF]' :
                     'bg-[#13181f] border border-[#1e2530] text-[#8892a0]')
                  }>
                    {p.status}
                  </span>
                </div>
                <div className="space-y-2">
                  {p.items.map(item => (
                    <div key={item} className="flex items-start gap-2 text-xs text-[#8892a0]">
                      <span style={{ color: p.color }}>→</span>{item}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ── COMPETITIVE ADVANTAGE ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionLabel>COMPETITIVE ADVANTAGE</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-['Space_Grotesk']">
              What sets Paragon apart
            </h2>
            <p className="text-[#8892a0] text-sm max-w-2xl mb-8 leading-relaxed">
              The differentiation isn't another swap interface or another payment app. It's
              combining DeFi liquidity, stablecoins, cross-chain infrastructure and real-world
              financial applications into one ecosystem, built first for African users and
              businesses.
            </p>

            <Card className="p-5">
              {[
                'Stablecoin-native infrastructure',
                'Built on Arc Network',
                'DeFi aggregation',
                'Multi-source liquidity routing',
                'Swap optimisation',
                'Cross-chain infrastructure',
                'Stablecoin FX',
                'Treasury tools',
                'Payments & remittance',
                'Africa-focused',
                'EVM-compatible architecture',
                'Programmable financial infrastructure',
              ].map(f => <CheckRow key={f} label={f} />)}
            </Card>
          </div>
        </div>

        {/* ── CONCLUSION ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <SectionLabel>CONCLUSION</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 font-['Space_Grotesk']">
            Bridging DeFi and everyday finance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-10">
            <div>
              <p className="text-[#8892a0] leading-relaxed mb-4 text-sm">
                Paragon Finance combines stablecoin infrastructure, DeFi liquidity, cross-chain
                connectivity and financial applications into a unified platform on Arc Network.
              </p>
              <p className="text-[#8892a0] leading-relaxed text-sm">
                The broader mission is an accessible financial infrastructure layer where users and
                businesses can swap, access liquidity, manage stablecoins, interact with DeFi, and
                move money globally — from one place.
              </p>
            </div>
            <Card glow className="p-6">
              <p className="text-base leading-relaxed text-white italic border-l-2 border-[#00D4FF] pl-4 mb-5">
                Built on Arc. Powered by stablecoins. Connected to DeFi.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link to="/testnet/send"
                  className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-all">
                  Launch app →
                </Link>
                <Link to="/about"
                  className="border border-[#1e2530] text-[#8892a0] text-sm px-5 py-2.5 rounded-xl hover:border-[#00D4FF] hover:text-white transition-all">
                  About Paragon
                </Link>
              </div>
            </Card>
          </div>
          <p className="text-xs text-[#556] text-center">
            Confidential — for informational purposes only. Not an offer to sell securities.
          </p>
        </div>

      </div>
      <Footer />
    </>
  )
}