import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Badge, Card } from '../components/UI'

function SectionLabel({ children }) {
  return <p className="text-[11px] font-semibold tracking-[2px] text-[#00D4FF] font-['Space_Grotesk'] mb-3">{children}</p>
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

export default function Docs() {
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
          <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 relative">
            <div className="flex items-center gap-2 text-xs text-[#8892a0] mb-5">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-[#00D4FF]">Documentation</span>
            </div>
            <Badge>WHITE PAPER v1.0</Badge>
            <h1 className="text-5xl font-bold font-['Space_Grotesk'] mt-5 mb-4">
              Paragon Finance <span className="gradient-text">Documentation</span>
            </h1>
            <p className="text-[#8892a0] text-base leading-relaxed max-w-2xl mb-8">
              Borderless money infrastructure built on Arc Network. This document covers the full architecture, use cases, security model, and roadmap of the Paragon Finance protocol.
            </p>
            <div className="flex gap-3 flex-wrap">
              {/* <Link to="/testnet/send" className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-all">
                Launch App →
              </Link> */}
              <a href="https://www.arc.network" target="_blank" rel="noreferrer"
                className="border border-[#1e2530] text-[#8892a0] text-sm px-6 py-3 rounded-xl hover:border-[#00D4FF] hover:text-white transition-all">
                Arc Network Docs ↗
              </a>
            </div>
          </div>
        </div>

        {/* ── INTRODUCTION ── */}
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-10">
          <SectionLabel>OVERVIEW</SectionLabel>
          <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-5">Introduction</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-[#8892a0] leading-relaxed mb-4 text-sm">
                Paragon Finance is a stablecoin-powered cross-border payment and remittance infrastructure designed to transform how money moves globally built natively on Arc Network's stablecoin-native Layer-1 blockchain by Circle.
              </p>
              <p className="text-[#8892a0] leading-relaxed text-sm">
                Paragon Finance enables instant, low-cost, transparent, and secure financial transactions powered by programmable stablecoin rails with sub-second settlement and fees as low as $0.003 per transfer.
              </p>
            </div>
            <Card glow className="p-6">
              <SectionLabel>CORE TAGLINE</SectionLabel>
              <p className="text-white font-['Space_Grotesk'] font-semibold text-base italic border-l-2 border-[#00D4FF] pl-4 leading-relaxed">
                "Move money faster. Move money cheaper. Move money globally. Built on Arc. Powered by USDC."
              </p>
              <div className="flex gap-2 flex-wrap mt-4">
                {['<1s Settlement', '$0.003 Fee', 'EVM Compatible', '8 Destinations'].map(t => (
                  <span key={t} className="text-[11px] border border-[#1e2530] text-[#8892a0] px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ── EXECUTIVE SUMMARY ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionLabel>EXECUTIVE SUMMARY</SectionLabel>
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-4">What Paragon Finance is building</h2>
            <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
              Paragon Finance eliminates the inefficiencies of traditional remittance systems by leveraging Arc Network's purpose-built financial infrastructure designed to support a broad range of financial activity across global markets.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: '⚡', title: 'Stablecoin-native settlement', desc: 'USDC transfers settled directly on-chain — instant, final, verifiable.' },
                { icon: '💰', title: 'Predictable $0.003 fee', desc: 'Fixed, USDC-denominated cost per transaction. Never volatile, never a surprise.' },
                { icon: '🔗', title: 'Crosschain interoperability', desc: 'Send from Ethereum, Base, Arbitrum, Solana — all settled on Arc.' },
                { icon: '🌍', title: '8 live destinations', desc: 'Nigeria, Ghana, Kenya, South Africa, Rwanda, Tanzania and more.' },
                { icon: '⚙️', title: 'EVM-compatible', desc: 'Solidity smart contracts on proven, auditable Arc infrastructure.' },
                { icon: '📄', title: 'On-chain receipts', desc: 'Auto-generated, downloadable, shareable via WhatsApp — fully transparent.' },
              ].map(f => <InfoCard key={f.title} {...f} />)}
            </div>
          </div>
        </div>

        {/* ── VISION & MISSION ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <SectionLabel>VISION & MISSION</SectionLabel>
          <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-8">Why we exist</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <Card className="p-6">
              <SectionLabel>VISION</SectionLabel>
              <p className="text-white font-['Space_Grotesk'] font-semibold text-sm leading-relaxed">
                To become the leading stablecoin-powered financial infrastructure layer for borderless payments and programmable money movement.
              </p>
            </Card>
            <Card glow className="p-6">
              <SectionLabel>MISSION</SectionLabel>
              <p className="text-white font-['Space_Grotesk'] font-semibold text-sm leading-relaxed">
                To provide instant, affordable, transparent, and secure cross-border financial services powered by blockchain infrastructure accessible to anyone, anywhere.
              </p>
            </Card>
          </div>
          <Card className="p-6">
            <p className="text-base leading-relaxed text-white italic border-l-2 border-[#00D4FF] pl-4">
              Paragon Finance is building the future financial operating system for borderless money movement — instant, stablecoin-powered, and accessible to all.
            </p>
          </Card>
        </div>

        {/* ── PROBLEM ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionLabel>THE PROBLEM</SectionLabel>
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-4">The remittance system is broken</h2>
            <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
              Every year, billions of dollars flow across borders through remittances. Despite this growth, the current ecosystem remains fundamentally broken — expensive, slow, fragmented, and highly dependent on intermediaries.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {[
                { icon: '💸', title: 'High Fees', desc: 'Transfer fees average 6–8% per transaction, eroding remittance value. Sending $100 via bank wire costs up to $25 in fees alone.' },
                { icon: '⏳', title: 'Slow Settlement', desc: 'Settlements take 1–5 business days, creating uncertainty for families and businesses that need money now — not next week.' },
                { icon: '📉', title: 'Poor FX Rates', desc: 'Currency conversion markups add hidden costs on top of the stated fee. Recipients often receive far less than expected.' },
                { icon: '🚫', title: 'Limited Access', desc: 'Banking restrictions and infrastructure gaps exclude millions from the financial system entirely.' },
              ].map(p => <InfoCard key={p.title} {...p} />)}
            </div>

            {/* Comparison table */}
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1e2530]">
                <p className="text-[10px] tracking-widest text-[#8892a0] font-['Space_Grotesk']">SENDING $100 — ALL PROVIDERS COMPARED</p>
              </div>
              <div className="divide-y divide-[#1e2530]">
                {[
                  { provider: 'Paragon Finance (Arc Network)', fee: '$0.003', time: '0.78 seconds', best: true },
                  { provider: 'Western Union', fee: '~$5.00', time: '1–5 business days', best: false },
                  { provider: 'Bank Wire', fee: '~$25.00', time: '2–5 business days', best: false },
                  { provider: 'PayPal', fee: '~$4.99', time: '3–5 days to withdraw', best: false },
                ].map(r => (
                  <div key={r.provider} className={'flex justify-between items-center px-5 py-4 text-sm ' + (r.best ? 'bg-[#0a2030]' : '')}>
                    <span className={r.best ? 'text-white font-semibold font-["Space_Grotesk"]' : 'text-[#8892a0]'}>{r.provider}</span>
                    <div className="flex gap-10">
                      <span className={r.best ? 'text-[#00D4FF] font-bold' : 'text-red-400'}>{r.fee}</span>
                      <span className={r.best ? 'text-green-400' : 'text-[#556]'}>{r.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ── WHY ARC ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <SectionLabel>WHY ARC NETWORK</SectionLabel>
          <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-4">Built on the right infrastructure</h2>
          <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
            Paragon Finance is built on Arc because Arc is purpose-built for real-world financial activity — not speculation or generalized computation. Arc focuses exclusively on stablecoin-native financial execution.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {[
              { icon: '💵', title: 'Stablecoin-Based Gas Fees', desc: 'Arc uses USDC as gas, eliminating volatile transaction fees. For Paragon Finance, this means always $0.003 — reliable remittance pricing, never a surprise.' },
              { icon: '⚡', title: 'Deterministic Finality', desc: 'Transactions on Arc finalize in under one second. No challenge period, no waiting — the settlement is final the moment it happens.' },
              { icon: '🔗', title: 'EVM Compatibility', desc: 'Arc is fully EVM-compatible. Paragon Finance deploys Solidity smart contracts and integrates existing Ethereum tooling via Circle CCTP.' },
              { icon: '🌐', title: 'Crosschain Interoperability', desc: 'Arc integrates with Circle CCTP, enabling Paragon Finance to accept USDC from Ethereum, Base, Arbitrum, and Solana — all settled on Arc.' },
              { icon: '🏛️', title: 'Institutional Backing', desc: 'Arc is backed by Goldman Sachs, Mastercard, and Visa — the institutions behind global payments infrastructure.' },
              { icon: '✅', title: 'Compliance-Ready', desc: 'Enterprise-grade infrastructure enabling regulated payment flows, transparent auditing, and institutional-grade financial tooling.' },
            ].map(f => <InfoCard key={f.title} {...f} />)}
          </div>

          {/* Arc stats banner */}
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
            <SectionLabel>ARCHITECTURE</SectionLabel>
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-4">System Architecture</h2>
            <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
              Paragon Finance is designed as a modular, layered infrastructure stack each layer purpose-built for performance, security, and scalability.
            </p>
            <div className="space-y-4 mb-10">
              {[
                { num: '01', name: 'Frontend Layer', stack: 'React · Tailwind CSS · Vite · Wagmi · RainbowKit', desc: 'Mobile-first interface with wallet connectivity, live rate calculator, send flow, transaction dashboard, and on-chain receipt generation.', color: '#00D4FF' },
                { num: '02', name: 'API Layer', stack: 'Node.js · Express.js · REST API · Resend', desc: 'Backend REST API handling user sessions, transaction records, email receipts, exchange rate aggregation, and Arc Network RPC integration.', color: '#00FFCC' },
                { num: '03', name: 'Database Layer', stack: 'MongoDB · Mongoose', desc: 'Persistent storage for user profiles, transaction history, rate snapshots, and notification preferences.', color: '#0080FF' },
                { num: '04', name: 'Smart Contract Layer', stack: 'Solidity · EVM · Arc Network', desc: 'EVM-compatible Solidity contracts handling stablecoin transfers, payment verification, fee management, and cross-border settlements.', color: '#00D4FF' },
                { num: '05', name: 'Arc Settlement Layer', stack: 'Arc Network · USDC · Circle CCTP', desc: "Arc's primary settlement infrastructure — sub-second finality, USDC-native gas, crosschain interoperability, and liquidity routing.", color: '#00FFCC' },
              ].map(l => (
                <div key={l.num} className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-5 flex gap-5 hover:border-[#00D4FF]/30 transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-['Space_Grotesk']"
                    style={{ background: l.color + '15', border: '1px solid ' + l.color + '40', color: l.color }}>
                    {l.num}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <p className="font-semibold font-['Space_Grotesk'] text-white text-sm">{l.name}</p>
                      <span className="text-[10px] text-[#556] bg-[#13181f] border border-[#1e2530] px-2 py-0.5 rounded-full font-mono">{l.stack}</span>
                    </div>
                    <p className="text-xs text-[#8892a0] leading-relaxed">{l.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Smart contract code snippet */}
            <Card className="overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1e2530] flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500 opacity-60" />
                  <span className="w-3 h-3 rounded-full bg-amber-500 opacity-60" />
                  <span className="w-3 h-3 rounded-full bg-green-500 opacity-60" />
                </div>
                <span className="text-[10px] text-[#556] font-mono ml-2">ParagonFinance.sol — example transfer flow</span>
              </div>
              <div className="p-5">
                <pre className="text-xs text-[#00D4FF] font-mono leading-relaxed overflow-x-auto">{`// User initiates transfer
paragonFinance.transfer({
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
          <SectionLabel>USE CASES</SectionLabel>
          <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-4">Core Use Cases</h2>
          <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
            Paragon Finance is designed to power a wide range of real-world financial activity across borders.
          </p>
          <div className="space-y-4">
            {[
              { num: '01', icon: '💸', title: 'Diaspora Remittances', desc: 'Send instant stablecoin-powered payments with lower fees, faster settlement, transparent exchange rates, and borderless accessibility. Paragon Finance removes the friction that costs diaspora communities billions in unnecessary fees each year.' },
              { num: '02', icon: '🏢', title: 'Cross-Border Business Payments', desc: 'Businesses can pay suppliers instantly, settle invoices globally, reduce banking friction, and access stable digital payment rails — enabling the commercial velocity that growing economies demand.' },
              { num: '03', icon: '👨‍💻', title: 'Freelance & Creator Payments', desc: 'Instant creator payouts, remote worker payments, and global freelance settlements. Stablecoin-powered payments preserve income value against local currency volatility, giving global talent fair and timely compensation.' },
              { num: '04', icon: '🛒', title: 'Merchant Payments', desc: "Merchants can accept stablecoin payments, settle instantly, reduce processing costs, and access global customers — all through Paragon Finance's programmable payment infrastructure." },
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

        {/* ── SECURITY ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionLabel>SECURITY</SectionLabel>
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-4">Security Framework</h2>
            <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
              Paragon Finance is built with a security-first mindset across every layer. We never hold user funds — all transfers are non-custodial and settled directly on Arc Network.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {[
                { icon: '🔐', title: 'Non-Custodial Architecture', desc: 'Paragon Finance never holds user funds. All transfers are peer-to-peer via smart contracts. Your keys, your money.' },
                { icon: '✅', title: 'Audited Smart Contracts', desc: 'Smart contracts are independently audited before mainnet deployment. All contract code is open-source and verifiable.' },
                { icon: '🔑', title: 'Multi-Signature Treasury', desc: 'Protocol treasury is protected by multi-signature systems, requiring multiple approvals for any fund movement.' },
                { icon: '👁️', title: 'Real-Time Monitoring', desc: 'On-chain transaction monitoring and fraud detection systems running continuously across all transfer activity.' },
                { icon: '🛡️', title: 'Secure API Architecture', desc: 'Backend API protected with authentication, rate limiting, and role-based access permissions.' },
                { icon: '📄', title: 'Full Transparency', desc: 'Every transaction is publicly verifiable on ArcScan. On-chain receipts are immutable and permanently accessible.' },
              ].map(s => <InfoCard key={s.title} {...s} />)}
            </div>
            <div className="bg-[#0a1520] border border-[#00D4FF]/20 rounded-xl p-5">
              <p className="text-xs text-[#8892a0] leading-relaxed">
                <span className="text-white font-semibold">USDC Safety: </span>
                All transfers are denominated in USDC — issued by Circle, backed 1:1 by US dollars held in regulated financial institutions, and fully audited. USDC is the most trusted and regulated stablecoin for cross-border value transfer.
              </p>
            </div>
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <SectionLabel>PRODUCT</SectionLabel>
          <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-4">How It Works</h2>
          <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
            Four steps from wallet connection to confirmed on-chain receipt — under two minutes total.
          </p>
          <div className="space-y-5 mb-12">
            {[
              { num: '01', title: 'Connect Your Wallet', desc: 'Connect MetaMask, WalletConnect, or Coinbase Wallet. No bank account or KYC required. Your wallet is your identity on Arc Network. USDC balance is read directly from your connected wallet.' },
              { num: '02', title: 'Enter Amount & Recipient', desc: 'Choose your source chain (Arc, Ethereum, Base, Arbitrum, or Solana), enter the USDC amount, select a destination country, and paste or scan the recipient wallet address. Exact fees are shown upfront — no surprises.' },
              { num: '03', title: 'Arc Settles Instantly', desc: 'Once you sign the transaction in your wallet, Arc Network processes and finalises it in under one second. Deterministic finality — the settlement is final the moment it happens.' },
              { num: '04', title: 'Recipient Gets USDC', desc: 'The recipient receives USDC directly in their wallet. An on-chain receipt is automatically generated — downloadable as PDF, copyable as a Transaction ID, and shareable via WhatsApp.' },
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

          {/* Competitive advantage */}
          <SectionLabel>COMPETITIVE ADVANTAGE</SectionLabel>
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-6">What sets Paragon Finance apart</h2>
          <Card className="p-5">
            {[
              'Stablecoin-native infrastructure built on Arc Network',
              'Deterministic sub-second settlement — irreversible finality',
              'Fixed $0.003 fee per transaction — never volatile',
              'Non-custodial — users always control their funds',
              'EVM-compatible smart contract architecture',
              'Crosschain support via Circle CCTP (ETH, Base, Arbitrum, Solana)',
              'On-chain receipts — publicly verifiable on ArcScan',
              'No bank account required — wallet is your identity',
            ].map(f => <CheckRow key={f} label={f} />)}
          </Card>
        </div>

        {/* ── SUPPORTED COUNTRIES ── */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionLabel>SUPPORTED DESTINATIONS</SectionLabel>
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-4">Countries & Rates</h2>
            <p className="text-[#8892a0] text-sm max-w-2xl mb-8 leading-relaxed">
              Paragon Finance currently supports 8 live destinations. All rates are updated every 60 seconds from live market data. Fees shown are fixed per transaction regardless of amount.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                { flag: '🇳🇬', name: 'Nigeria', currency: 'NGN', rate: '₦1,634 / USDC', cashout: 'Yellow Card · Mara · Binance P2P' },
                { flag: '🇬🇭', name: 'Ghana', currency: 'GHS', rate: '₵15.2 / USDC', cashout: 'Yellow Card · MTN MoMo · Mara' },
                { flag: '🇰🇪', name: 'Kenya', currency: 'KES', rate: 'KSh 129 / USDC', cashout: 'M-Pesa · Yellow Card · Mara' },
                { flag: '🇿🇦', name: 'South Africa', currency: 'ZAR', rate: 'R18.4 / USDC', cashout: 'Luno · VALR · Yellow Card' },
                { flag: '🇷🇼', name: 'Rwanda', currency: 'RWF', rate: 'RWF 1,310 / USDC', cashout: 'MTN MoMo · Airtel Money' },
                { flag: '🇹🇿', name: 'Tanzania', currency: 'TZS', rate: 'TZS 2,640 / USDC', cashout: 'Vodacom M-Pesa · Airtel Money' },
              ].map(c => (
                <div key={c.name} className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-5 hover:border-[#00D4FF]/30 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{c.flag}</span>
                    <div>
                      <p className="font-bold font-['Space_Grotesk'] text-white text-sm">{c.name}</p>
                      <p className="text-xs text-[#8892a0]">{c.currency}</p>
                    </div>
                    <span className="ml-auto text-sm font-bold text-[#00D4FF] font-['Space_Grotesk']">{c.rate}</span>
                  </div>
                  <p className="text-[10px] text-[#556] tracking-widest mb-1">CASHOUT</p>
                  <p className="text-xs text-[#8892a0]">{c.cashout}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-4">
              <p className="text-xs text-[#8892a0]">
                🇪🇹 Ethiopia · 🇸🇳 Senegal · 🇪🇬 Egypt · 🇺🇬 Uganda —
                <span className="text-amber-400 ml-1">Coming soon</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── ROADMAP ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <SectionLabel>ROADMAP</SectionLabel>
          <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-4">Development Roadmap</h2>
          <p className="text-[#8892a0] text-sm max-w-2xl mb-10 leading-relaxed">
            Paragon Finance's development is structured across four phases, each building on the last to deliver progressively greater capability and reach.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { phase: 'Phase 1', title: 'Foundation', status: 'In Progress', color: '#00D4FF', items: ['Frontend MVP — live at paragonfinance.xyz', 'Arc Testnet integration', 'Wallet connection (MetaMask, WalletConnect)', 'Live rate calculator and send flow', 'Transaction dashboard with history'] },
              { phase: 'Phase 2', title: 'Payments Expansion', status: 'Upcoming', color: '#00FFCC', items: ['Backend API — Node.js + MongoDB', 'Real USDC transfers on Arc Testnet', 'Email receipts via Resend', 'Cashout partner integrations', 'Crosschain support via Circle CCTP'] },
              { phase: 'Phase 3', title: 'Pan-Global Infrastructure', status: 'Planned', color: '#0080FF', items: ['Arc Mainnet launch', 'Merchant payment integration', 'Business settlement tooling', 'Embedded finance APIs', 'Expanded country coverage'] },
              { phase: 'Phase 4', title: 'Financial Ecosystem Layer', status: 'Future', color: '#8892a0', items: ['AI-powered financial tooling', 'Programmable payment automation', 'Developer APIs and SDK', 'Institutional integrations', 'Ecosystem expansion'] },
            ].map(p => (
              <Card key={p.phase} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg font-['Space_Grotesk'] mb-2 inline-block"
                      style={{ background: p.color + '15', color: p.color, border: '1px solid ' + p.color + '30' }}>
                      {p.phase}
                    </span>
                    <p className="font-bold font-['Space_Grotesk'] text-white mt-1">{p.title}</p>
                  </div>
                  <span className={
                    'text-[10px] px-2 py-1 rounded-full font-semibold font-["Space_Grotesk"] ' +
                    (p.status === 'In Progress' ? 'bg-green-900/20 border border-green-500 text-green-400' :
                    p.status === 'Upcoming' ? 'bg-[#0a2030] border border-[#00D4FF] text-[#00D4FF]' :
                    'bg-[#13181f] border border-[#1e2530] text-[#8892a0]')
                  }>{p.status}</span>
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

        {/* ── CONCLUSION ── */}
        <div className="bg-[#0f1822] border-t border-[#1e2530] py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionLabel>CONCLUSION</SectionLabel>
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-6">The future of money movement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-10">
              <div>
                <p className="text-[#8892a0] leading-relaxed mb-4 text-sm">
                  Paragon Finance combines stablecoin infrastructure, Arc Network's enterprise-grade blockchain architecture, and financial innovation to redefine cross-border payments.
                </p>
                <p className="text-[#8892a0] leading-relaxed text-sm">
                  Paragon Finance is not just a remittance platform. It is building the financial infrastructure layer for the next generation of economic coordination — instant, borderless, stablecoin-powered, and globally accessible.
                </p>
              </div>
              <Card glow className="p-6">
                <p className="text-base leading-relaxed text-white italic border-l-2 border-[#00D4FF] pl-4 mb-4">
                  "Move money faster. Move money cheaper. Move money globally. Built on Arc. Powered by Stablecoins."
                </p>
                <div className="flex gap-3 flex-wrap">
                  {/* <Link to="/testnet/send" className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-all">
                    Launch App →
                  </Link> */}
                  <Link to="/about" className="border border-[#1e2530] text-[#8892a0] text-sm px-5 py-2.5 rounded-xl hover:border-[#00D4FF] hover:text-white transition-all">
                    About Paragon Finance
                  </Link>
                </div>
              </Card>
            </div>
            <p className="text-xs text-[#556] text-center">Confidential — For informational purposes only. Not an offer to sell securities.</p>
          </div>
        </div>

      </div>
      <Footer />
    </>
  )
}