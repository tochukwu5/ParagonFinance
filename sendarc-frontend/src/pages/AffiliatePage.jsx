import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useArcTestnet } from '../hooks/useArcTestnet'
import { Badge, Card } from '../components/UI'
import { Reveal } from '../components/Reveal'
import Footer from '../components/Footer'
import AffiliateReview from './AffiliateReview'

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

const PLATFORMS = [
  { id: 'twitter',   label: 'X / Twitter' },
  { id: 'telegram',  label: 'Telegram' },
  { id: 'youtube',   label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok',    label: 'TikTok' },
  { id: 'discord',   label: 'Discord' },
]

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-semibold tracking-[2px] text-[#00D4FF] font-['Space_Grotesk'] mb-3">
      {children}
    </p>
  )
}

export default function AffiliatePage() {
  const { account, isConnected } = useArcTestnet()

  const [status, setStatus] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  const [form, setForm] = useState({
    name: '', email: '', audienceDescription: '', promotionPlan: '',
  })
  const [socials, setSocials] = useState([
    { platform: 'twitter', handle: '', url: '', followers: '' },
  ])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!account) { setLoadingStatus(false); return }
    let cancelled = false

    fetch(API_BASE + '/rewards/affiliate/status/' + account)
      .then(r => r.json())
      .then(d => { if (!cancelled && d.success) setStatus(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingStatus(false) })

    return () => { cancelled = true }
  }, [account])

  const updateSocial = (i, field, value) => {
    setSocials(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const addSocial = () => {
    if (socials.length >= 4) return
    setSocials(prev => [...prev, { platform: 'twitter', handle: '', url: '', followers: '' }])
  }

  const removeSocial = (i) => {
    setSocials(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(API_BASE + '/rewards/affiliate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account,
          ...form,
          socials: socials
            .filter(s => s.handle && s.url && s.followers)
            .map(s => ({ ...s, followers: parseInt(s.followers, 10) })),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')

      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const validSocials = socials.filter(s => s.handle && s.url && s.followers)
  const meetsThreshold = validSocials.some(s => parseInt(s.followers, 10) >= 5000)
  // A wallet isn't required to apply — plenty of people with an audience
  // won't have connected one yet, and turning them away at the form loses
  // applicants for no good reason. It IS required before approval, since
  // that's what the affiliate flag and rewards attach to.
  const canSubmit = form.name && form.email && meetsThreshold && !submitting
  return (
    <>
      <div className="bg-[#0D1117] min-h-screen">

        {/* Hero */}
        <div className="relative overflow-hidden border-b border-[#1e2530]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full bg-[#00D4FF] opacity-[0.05] blur-[120px]" />
          </div>
          <div className="max-w-5xl mx-auto px-6 pt-16 pb-14 relative text-center">
            <Badge>AFFILIATE PROGRAMME</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mt-5 mb-4 font-['Space_Grotesk']">
              Earn more for<br />
              <span className="gradient-text">bringing your audience</span>
            </h1>
            <p className="text-[#8892a0] text-base leading-relaxed max-w-2xl mx-auto">
              Anyone can refer. Affiliates earn a higher rate, a bonus at ten
              referrals, and a badge on their dashboard.
            </p>
          </div>
        </div>

        {/* What you get */}
        <div className="max-w-5xl mx-auto px-6 py-14">
          <Reveal>
            <SectionLabel>WHAT YOU GET</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-bold mb-8 font-['Space_Grotesk']">
              Affiliate
            </h2>
          </Reveal>

                  <Reveal delay={100}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                {
                  value: '80 $PARA',
                  title: 'Per qualified referral',
                  desc: 'Credited each time someone you brought completes three transactions across two days.',
                },
                {
                  value: '1,000 $PARA',
                  title: 'Approval bonus',
                  desc: 'Unlocked once ten of your referrals have qualified. Paid in full, once.',
                },
                {
                  value: 'Badge',
                  title: 'Affiliate status',
                  desc: 'Marked on your dashboard and on the public leaderboard.',
                },
                {
                  value: 'Full',
                  title: 'Referral analytics',
                  desc: 'See who has qualified and who is still short, so you know where to follow up.',
                },
              ].map(b => (
                <div
                  key={b.title}
                  className="bg-[#0f1822] border border-[#1e2530] rounded-xl p-5 hover:border-[#00D4FF]/40 transition-all"
                >
                  <p className="text-2xl font-bold text-[#00D4FF] font-['Space_Grotesk'] mb-2">
                    {b.value}
                  </p>
                  <p className="font-semibold font-['Space_Grotesk'] text-white text-sm mb-1.5">
                    {b.title}
                  </p>
                  <p className="text-xs text-[#8892a0] leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="bg-[#0a1520] border border-[#00D4FF]/20 rounded-xl px-5 py-4">
              <p className="text-xs text-[#8892a0] leading-relaxed">
                <span className="text-white font-semibold">How referrals are counted: </span>
                a referral pays once the person you referred completes three
                transactions across two separate days. The 1,000 $PARA bonus
                unlocks at ten of those. We count real usage rather than
                sign-ups, which keeps the reward pool going to people who
                actually brought users.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Requirements */}
        <div className="bg-[#0f1822] border-t border-b border-[#1e2530] py-14 px-6">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <SectionLabel>REQUIREMENTS</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold mb-8 font-['Space_Grotesk']">
                Who we're looking for
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  title: '5,000+ audience',
                  desc: 'On at least one platform — X, Telegram, YouTube, Instagram, TikTok or Discord. One qualifying account is enough.',
                },
                {
                  title: 'Relevant audience',
                  desc: 'People interested in crypto, payments, remittance or DeFi. Reach matters less than fit.',
                },
                {
                  title: 'A plan',
                  desc: 'Tell us how you intend to introduce Paragon. A specific plan beats a large following with no intent.',
                },
              ].map(r => (
                <Reveal key={r.title} delay={0}>
                  <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-5 h-full">
                    <p className="font-semibold font-['Space_Grotesk'] text-white text-sm mb-2">{r.title}</p>
                    <p className="text-xs text-[#8892a0] leading-relaxed">{r.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* Application */}
        <div className="max-w-2xl mx-auto px-6 py-14">
          <SectionLabel>APPLY</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 font-['Space_Grotesk']">
            Submit your application
          </h2>

                 {loadingStatus ? (
            <Card className="p-8">
              <div className="h-4 w-32 bg-[#161d28] rounded animate-pulse" />
            </Card>
          ) : status?.isAffiliate ? (
            <Card glow className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#2a1a08] border-2 border-[#F59E0B] flex items-center justify-center mx-auto mb-4 text-xl">
                ★
              </div>
              <h3 className="font-bold font-['Space_Grotesk'] text-white mb-2">
                You're an approved affiliate
              </h3>
              <p className="text-sm text-[#8892a0] mb-6">
                Your referral link and stats are on your dashboard.
              </p>
              <Link
                to="/dashboard"
                className="inline-block bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm px-8 py-3 rounded-xl hover:opacity-90 transition-all"
              >
                Go to dashboard →
              </Link>
            </Card>
          ) : submitted || status?.application?.status === 'pending' ? (
            <Card className="p-8 text-center">
              <h3 className="font-bold font-['Space_Grotesk'] text-white mb-2">
                Application under review
              </h3>
              <p className="text-sm text-[#8892a0]">
                We review within 3–5 days and will email you either way.
              </p>
            </Card>
          ) : (
            <>
              {status?.application?.status === 'rejected' && (
                <div className="bg-[#1a1408] border border-[#3d2f10] rounded-xl px-4 py-3 mb-5">
                  <p className="text-xs text-[#e8c374] leading-relaxed">
                    A previous application wasn't approved.
                    {status.application.reviewNote && (
                      <span className="block mt-1 text-[#8892a0]">
                        {status.application.reviewNote}
                      </span>
                    )}
                    <span className="block mt-1">You're welcome to apply again.</span>
                  </p>
                </div>
              )}

              <Card className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-widest text-[#4a5568] mb-2">NAME</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full bg-[#0D1117] border border-[#1e2530] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest text-[#4a5568] mb-2">EMAIL</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full bg-[#0D1117] border border-[#1e2530] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF] transition-colors"
                    />
                  </div>
                </div>

                {/* Socials */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] tracking-widest text-[#4a5568]">
                      SOCIAL ACCOUNTS
                    </label>
                    {socials.length < 4 && (
                      <button
                        onClick={addSocial}
                        className="text-[10px] text-[#00D4FF] hover:underline"
                      >
                        + Add another
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {socials.map((s, i) => (
                      <div key={i} className="bg-[#0D1117] border border-[#1e2530] rounded-lg p-3 space-y-2.5">
                        <div className="flex gap-2">
                          <select
                            value={s.platform}
                            onChange={e => updateSocial(i, 'platform', e.target.value)}
                            className="bg-[#0f1822] border border-[#1e2530] rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-[#00D4FF]"
                          >
                            {PLATFORMS.map(p => (
                              <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={s.handle}
                            onChange={e => updateSocial(i, 'handle', e.target.value)}
                            placeholder="@handle"
                            className="flex-1 min-w-0 bg-[#0f1822] border border-[#1e2530] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00D4FF]"
                          />
                          {socials.length > 1 && (
                            <button
                              onClick={() => removeSocial(i)}
                              className="text-[#4a5568] hover:text-red-400 px-2 transition-colors"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={s.url}
                            onChange={e => updateSocial(i, 'url', e.target.value)}
                            placeholder="https://…"
                            className="flex-1 min-w-0 bg-[#0f1822] border border-[#1e2530] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00D4FF]"
                          />
                          <input
                            type="number"
                            value={s.followers}
                            onChange={e => updateSocial(i, 'followers', e.target.value)}
                            placeholder="Followers"
                            min="0"
                            className="w-32 bg-[#0f1822] border border-[#1e2530] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00D4FF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Says what's missing rather than leaving a greyed button
                      with no explanation. */}
                  {validSocials.length > 0 && !meetsThreshold && (
                    <p className="text-[10px] text-[#e8c374] mt-2">
                      At least one account needs 5,000+ followers.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] tracking-widest text-[#4a5568] mb-2">
                    YOUR AUDIENCE
                  </label>
                  <textarea
                    value={form.audienceDescription}
                    onChange={e => setForm({ ...form, audienceDescription: e.target.value })}
                    placeholder="Who follows you, and what are they interested in?"
                    rows={3}
                    maxLength={1000}
                    className="w-full bg-[#0D1117] border border-[#1e2530] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF] transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-widest text-[#4a5568] mb-2">
                    HOW YOU'D PROMOTE PARAGON
                  </label>
                  <textarea
                    value={form.promotionPlan}
                    onChange={e => setForm({ ...form, promotionPlan: e.target.value })}
                    placeholder="Threads, a video, a community walkthrough — whatever you have in mind."
                    rows={3}
                    maxLength={1000}
                    className="w-full bg-[#0D1117] border border-[#1e2530] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF] transition-colors resize-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                                {!isConnected && (
                  <div className="bg-[#0a1520] border border-[#00D4FF]/20 rounded-lg px-3 py-2.5">
                    <p className="text-[11px] text-[#8892a0] leading-relaxed">
                      You can apply without a wallet. You'll need to connect one
                      before approval — it's what your rewards and referral link
                      attach to.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting…' : 'Submit application'}
                </button>

                <p className="text-[10px] text-[#4a5568] text-center">
                  Follower counts are verified during review.
                </p>
              </Card>
            </>
          )}
        </div>

      </div>
    </>
  )
}