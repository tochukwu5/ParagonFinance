import { Link, useParams } from 'react-router-dom'
import { Badge, Card } from '../components/UI'
import Footer from '../components/Footer'

// ═══════════════════════════════════════════════════════════════════════════
// LEGAL PAGES
//
// IMPORTANT — READ BEFORE LAUNCH
//
// What follows is a structural skeleton with your real company details
// filled in. It is NOT legal advice and has not been drafted or reviewed by
// a lawyer.
//
// Three things here genuinely need professional review before you handle
// real money:
//
//   1. Nigeria's NDPR governs how you collect and process personal data.
//      The privacy policy below describes what your code actually does, but
//      NDPR has specific disclosure and consent requirements it does not
//      attempt to satisfy.
//
//   2. Non-custodial framing is a legal position, not just a description.
//      Getting it wrong is the difference between a software product and a
//      regulated money transmitter.
//
//   3. The $PARA points programme involves paying people to recruit people,
//      in units expected to have future value. That structure attracts
//      scrutiny in most jurisdictions and needs an opinion before mainnet.
//
// Publishing this as-is is better than having no legal pages at all, and
// worse than having real ones. Treat it as a placeholder with a deadline.
// ═══════════════════════════════════════════════════════════════════════════

const COMPANY = {
  name: 'Paragon Tech Ventures',
  product: 'Paragon Finance',
  regNumber: '9834873',
  regDate: '7 September 2026',
  type: 'Sole Proprietorship',
  address: 'Block B, Shop 28/29, Utako Ultra-Modern Market, A.E. Ekukinam Street, Utako, Abuja, FCT, Nigeria',
  email: 'support@paragonfinance.xyz',
  website: 'paragonfinance.xyz',
}

const LAST_UPDATED = 'September 2026'

function LegalShell({ title, subtitle, children }) {
  return (
    <>
      <div className="bg-[#0D1117] min-h-screen">
        <div className="border-b border-[#1e2530]">
          <div className="max-w-3xl mx-auto px-6 pt-14 pb-10">
            <Link to="/legal" className="text-xs text-[#8892a0] hover:text-white transition-colors">
              ← All legal documents
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-3 font-['Space_Grotesk']">
              {title}
            </h1>
            {subtitle && <p className="text-[#8892a0] text-sm">{subtitle}</p>}
            <p className="text-xs text-[#4a5568] mt-3">Last updated: {LAST_UPDATED}</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="space-y-8">{children}</div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function Section({ heading, children }) {
  return (
    <section>
      <h2 className="text-lg font-bold font-['Space_Grotesk'] text-white mb-3">{heading}</h2>
      <div className="space-y-3 text-sm text-[#8892a0] leading-relaxed">{children}</div>
    </section>
  )
}

// ─── Hub ──────────────────────────────────────────────────────────────────
export function LegalIndex() {
  const docs = [
    {
      to: '/legal/privacy',
      title: 'Privacy Policy',
      desc: 'What data we collect, why, and what we do with it.',
    },
    {
      to: '/legal/terms',
      title: 'Terms & Conditions',
      desc: 'The terms governing your use of Paragon Finance.',
    },
    {
      to: '/legal/imprint',
      title: 'Imprint',
      desc: 'Company registration and contact details.',
    },
    {
      to: '/legal/risk',
      title: 'Risk Disclosure',
      desc: 'What can go wrong when moving value on-chain.',
    },
  ]

  return (
    <>
      <div className="bg-[#0D1117] min-h-screen">
        <div className="border-b border-[#1e2530]">
          <div className="max-w-3xl mx-auto px-6 pt-16 pb-12">
            <Badge>LEGAL</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mt-5 mb-3 font-['Space_Grotesk']">
              Legal documents
            </h1>
            <p className="text-[#8892a0] text-sm leading-relaxed">
              {COMPANY.product} is operated by {COMPANY.name}, registered in
              Nigeria under number {COMPANY.regNumber}.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {docs.map(d => (
              <Link
                key={d.to}
                to={d.to}
                className="bg-[#0f1822] border border-[#1e2530] rounded-xl p-5 hover:border-[#00D4FF]/40 transition-all"
              >
                <p className="font-semibold font-['Space_Grotesk'] text-white text-sm mb-1.5">
                  {d.title}
                </p>
                <p className="text-xs text-[#8892a0] leading-relaxed">{d.desc}</p>
              </Link>
            ))}
          </div>

          <div className="mt-8 bg-[#0a1520] border border-[#00D4FF]/20 rounded-xl p-5">
            <p className="text-xs text-[#8892a0] leading-relaxed">
              <span className="text-white font-semibold">Questions? </span>
              Write to{' '}
              <a href={'mailto:' + COMPANY.email} className="text-[#00D4FF] hover:underline">
                {COMPANY.email}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

// ─── Privacy ──────────────────────────────────────────────────────────────
export function PrivacyPolicy() {
  return (
    <LegalShell
      title="Privacy Policy"
      subtitle={'How ' + COMPANY.name + ' handles your data.'}
    >
      <Section heading="What we collect">
        <p>
          Paragon Finance is non-custodial. We never hold your funds and never
          have access to your private keys or seed phrase.
        </p>
        <p>We store:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-1">
          <li>Your public wallet address</li>
          <li>Transaction records you create through the platform — hashes, amounts, timestamps, source and destination chains</li>
          <li>Points earned through the rewards programme, and referral relationships</li>
          <li>If you apply to the affiliate programme: your name, email address, and the social media accounts you submit</li>
        </ul>
        <p>
          We do not collect your legal name, address, or identity documents
          unless you provide them in an affiliate application.
        </p>
      </Section>

      <Section heading="What is already public">
        <p>
          Blockchain transactions are public by design. Your wallet address,
          transaction history, and balances are visible to anyone on Arc's
          block explorer, whether or not you use Paragon Finance. We do not
          control that and cannot remove it.
        </p>
      </Section>

      <Section heading="Why we collect it">
        <ul className="list-disc list-inside space-y-1.5 ml-1">
          <li>To show your transaction history and balances</li>
          <li>To calculate rewards and referrals</li>
          <li>To review affiliate applications</li>
          <li>To detect abuse of the rewards programme</li>
          <li>To improve the service</li>
        </ul>
      </Section>

      <Section heading="Who we share it with">
        <p>
          We do not sell your data. We share only what is necessary with the
          infrastructure we run on:
        </p>
        <ul className="list-disc list-inside space-y-1.5 ml-1">
          <li><span className="text-white">MongoDB Atlas</span> — database hosting</li>
          <li><span className="text-white">Railway</span> — backend hosting</li>
          <li><span className="text-white">Vercel</span> — frontend hosting</li>
          <li><span className="text-white">Circle</span> — USDC and CCTP infrastructure</li>
          <li><span className="text-white">Resend</span> — transactional email</li>
        </ul>
      </Section>

      <Section heading="Your rights">
        <p>
          You may request a copy of your data, ask for corrections, or ask us
          to delete it. Write to{' '}
          <a href={'mailto:' + COMPANY.email} className="text-[#00D4FF] hover:underline">
            {COMPANY.email}
          </a>
          .
        </p>
        <p>
          Deletion removes your records from our database. It cannot remove
          anything already written to a public blockchain.
        </p>
      </Section>

      <Section heading="Cookies">
        <p>
          We use browser local storage to remember your wallet connection,
          session timing, and any referral code you arrived with. We do not
          use advertising or third-party tracking cookies.
        </p>
      </Section>
    </LegalShell>
  )
}

// ─── Terms ────────────────────────────────────────────────────────────────
export function TermsConditions() {
  return (
    <LegalShell
      title="Terms & Conditions"
      subtitle={'The terms governing your use of ' + COMPANY.product + '.'}
    >
      <Section heading="1. What Paragon Finance is">
        <p>
          Paragon Finance is a non-custodial interface for moving stablecoins
          on Arc Network and supported chains. We provide software. We do not
          hold, control, or take custody of your funds at any point.
        </p>
        <p>
          The service is currently on testnet. Testnet tokens have no monetary
          value.
        </p>
      </Section>

      <Section heading="2. Your responsibilities">
        <ul className="list-disc list-inside space-y-1.5 ml-1">
          <li>You are responsible for your wallet, your private keys, and your seed phrase. We cannot recover them.</li>
          <li>You are responsible for verifying recipient addresses. Blockchain transactions cannot be reversed.</li>
          <li>You are responsible for complying with the laws that apply to you.</li>
          <li>You must not use the service for illegal activity.</li>
        </ul>
      </Section>

      <Section heading="3. Fees">
        <p>
          Fees are shown before you confirm any transaction. Network gas costs
          are separate and paid to the network, not to us. Third-party
          liquidity venues and bridge providers may charge their own fees,
          which we disclose where we can see them.
        </p>
      </Section>

      <Section heading="4. Third-party services">
        <p>
          Paragon Finance routes transactions through third-party protocols
          including Circle's CCTP and various decentralised exchanges. We do
          not control those protocols and are not responsible for their
          failures, downtime, or losses arising from them.
        </p>
      </Section>

      <Section heading="5. Rewards programme">
        <p>
          Points earned through the rewards programme are a record of
          participation. They are not a currency, a security, or a promise of
          future value. We may adjust the rules, correct balances, or remove
          points obtained through abuse or automation.
        </p>
        <p>
          Any future conversion of points to tokens is at our discretion and
          subject to the rules published at that time.
        </p>
      </Section>

      <Section heading="6. No warranty">
        <p>
          The service is provided as-is. We do not guarantee it will be
          available, uninterrupted, or error-free.
        </p>
      </Section>

      <Section heading="7. Limitation of liability">
        <p>
          To the extent permitted by law, {COMPANY.name} is not liable for
          losses arising from your use of the service, including losses caused
          by user error, smart contract failure, third-party protocol failure,
          or network conditions.
        </p>
      </Section>

      <Section heading="8. Changes">
        <p>
          We may update these terms. Continued use after an update means you
          accept the revised terms.
        </p>
      </Section>

      <Section heading="9. Governing law">
        <p>
          These terms are governed by the laws of the Federal Republic of
          Nigeria.
        </p>
      </Section>
    </LegalShell>
  )
}

// ─── Imprint ──────────────────────────────────────────────────────────────
export function Imprint() {
  const rows = [
    { label: 'Registered name', value: COMPANY.name },
    { label: 'Trading as', value: COMPANY.product },
    { label: 'Registration number', value: COMPANY.regNumber },
    { label: 'Registered', value: COMPANY.regDate },
    { label: 'Business type', value: COMPANY.type },
    { label: 'Jurisdiction', value: 'Federal Republic of Nigeria' },
    { label: 'Registered under', value: 'Companies and Allied Matters Act 2020' },
    { label: 'Principal place of business', value: COMPANY.address },
    { label: 'Email', value: COMPANY.email },
    { label: 'Website', value: COMPANY.website },
  ]

  return (
    <LegalShell
      title="Imprint"
      subtitle="Company registration and contact details."
    >
      <Card className="overflow-hidden">
        <div className="divide-y divide-[#1e2530]">
          {rows.map(r => (
            <div
              key={r.label}
              className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4"
            >
              <span className="text-xs text-[#4a5568] sm:w-52 flex-shrink-0">{r.label}</span>
              <span className="text-sm text-white">{r.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Section heading="Regulatory status">
        <p>
          {COMPANY.name} is a registered business name in Nigeria. Paragon
          Finance provides non-custodial software and does not hold customer
          funds.
        </p>
      </Section>
    </LegalShell>
  )
}

// ─── Risk ─────────────────────────────────────────────────────────────────
export function RiskDisclosure() {
  return (
    <LegalShell
      title="Risk Disclosure"
      subtitle="What can go wrong when moving value on-chain."
    >
      <Section heading="Transactions are irreversible">
        <p>
          Once confirmed, a blockchain transaction cannot be undone. Sending to
          a wrong address means the funds are gone. Check every address before
          confirming.
        </p>
      </Section>

      <Section heading="You control your keys">
        <p>
          We cannot recover a lost seed phrase, reverse a transaction, or
          restore access to a compromised wallet. Nobody can.
        </p>
      </Section>

      <Section heading="Smart contract risk">
        <p>
          Paragon Finance uses smart contracts, as do the protocols it routes
          through. Smart contracts can contain bugs. Audits reduce that risk
          but do not eliminate it.
        </p>
      </Section>

      <Section heading="Cross-chain risk">
        <p>
          Bridging moves value between independent networks. A transfer can
          burn on one chain and fail to complete on the other, leaving funds
          recoverable but temporarily inaccessible. Where this happens we show
          you the transaction and what is needed to complete it.
        </p>
      </Section>

      <Section heading="Third-party risk">
        <p>
          We route through external liquidity venues and bridge providers.
          Their downtime, bugs, or failures can affect your transaction, and
          we do not control them.
        </p>
      </Section>

      <Section heading="Testnet">
        <p>
          The service currently operates on Arc Testnet. Testnet tokens have no
          monetary value and testnets may be reset without notice, clearing all
          balances and history.
        </p>
      </Section>
    </LegalShell>
  )
}