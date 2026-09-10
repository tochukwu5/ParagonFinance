import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from './UI'

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

const BADGE_STYLE = {
  active:     { bg: '#0a2030', border: '#00D4FF', text: '#00D4FF' },
  builder:    { bg: '#0a2030', border: '#00FFCC', text: '#00FFCC' },
  advocate:   { bg: '#1a1030', border: '#8B5CF6', text: '#A78BFA' },
  ambassador: { bg: '#2a1a08', border: '#F59E0B', text: '#FBBF24' },
}

export default function RewardsPanel({ account }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!account) { setLoading(false); return }
    let cancelled = false

    fetch(API_BASE + '/rewards/' + account)
      .then(r => r.json())
      .then(d => { if (!cancelled && d.success) setData(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [account])

  if (!account) return null

  if (loading) {
    return (
      <Card className="p-6 mb-5">
        <div className="h-4 w-24 bg-[#161d28] rounded animate-pulse mb-4" />
        <div className="h-10 w-40 bg-[#161d28] rounded animate-pulse" />
      </Card>
    )
  }

  if (!data) return null

  const referralLink = typeof window !== 'undefined'
    ? window.location.origin + '/?ref=' + data.referralCode
    : ''

  const copy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const badge = data.level?.badge ? BADGE_STYLE[data.level.badge] : null

  // Progress toward the next level. Measured from the current level's floor
  // rather than zero, so the bar doesn't sit near-full the whole way up.
  const progress = data.nextLevel
    ? Math.min(100, Math.round(
        ((data.totalPoints - data.level.min) /
         (data.nextLevel.min - data.level.min)) * 100
      ))
    : 100

  const pendingReferrals = data.referrals?.filter(r => !r.qualified).length || 0

  return (
    <Card glow className="p-6 mb-5">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <p className="text-[10px] tracking-[2px] text-[#4a5568] mb-1.5">$PARA EARNED</p>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-4xl font-bold text-[#00D4FF] font-['Space_Grotesk']">
              {data.totalPoints.toLocaleString()}
            </span>
            <span className="text-sm text-[#8892a0]">$PARA</span>
            {data.isAffiliate && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#2a1a08] border border-[#F59E0B] text-[#FBBF24]">
                AFFILIATE
              </span>
            )}
          </div>
        </div>

        {badge && (
          <div
            className="px-3 py-1.5 rounded-xl text-xs font-semibold font-['Space_Grotesk']"
            style={{ background: badge.bg, border: '1px solid ' + badge.border, color: badge.text }}
          >
            {data.level.name}
          </div>
        )}
      </div>

      {data.nextLevel && (
        <div className="mb-5">
          <div className="flex justify-between text-[10px] text-[#8892a0] mb-1.5">
            <span>{data.level.name}</span>
            <span>{data.nextLevel.min - data.totalPoints} $PARA to {data.nextLevel.name}</span>
          </div>
          <div className="h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00FFCC] transition-all duration-700"
              style={{ width: progress + '%' }}
            />
          </div>
        </div>
      )}

      {/* Where the points came from. Zero-value sources stay visible rather
          than being hidden — an empty Referrals row is a prompt to share the
          link, where an absent one is nothing at all. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {[
          { label: 'TRANSACTIONS', value: data.points.transactions },
          { label: 'REFERRALS', value: data.points.referrals },
          { label: 'JOINING', value: data.points.signup },
          ...(data.isAffiliate
            ? [{ label: 'AFFILIATE', value: data.points.affiliateBonus }]
            : []),
        ].map(s => (
          <div key={s.label} className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-white font-['Space_Grotesk']">{s.value}</p>
            <p className="text-[9px] tracking-widest text-[#4a5568] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] tracking-[2px] text-[#4a5568]">YOUR REFERRAL LINK</p>
          <span className="text-[10px] text-[#8892a0]">
            {data.qualifiedReferralCount} qualified
            {pendingReferrals > 0 && (
              <span className="text-[#4a5568]"> · {pendingReferrals} pending</span>
            )}
          </span>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 min-w-0 bg-[#0f1822] border border-[#1e2530] rounded-lg px-3 py-2">
            <p className="text-xs font-mono text-[#8892a0] truncate">{referralLink}</p>
          </div>
          <button
            onClick={copy}
            className={
              "px-4 rounded-lg text-xs font-semibold font-['Space_Grotesk'] transition-all flex-shrink-0 " +
              (copied
                ? 'bg-green-900/20 border border-green-500 text-green-400'
                : 'bg-[#00D4FF] text-[#0D1117] hover:opacity-90')
            }
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Stating the qualification rule up front. A referral that silently
            fails to pay reads as a broken product; one that explains what it
            needs reads as a rule. */}
        <p className="text-[10px] text-[#4a5568] mt-2.5 leading-relaxed">
          You earn {data.isAffiliate ? 80 : 50} $PARA per referral, credited once they
          complete 3 transactions across 2 days.
        </p>
      </div>

      {data.isAffiliate && data.affiliateBonusProgress && !data.affiliateBonusPaid && (
        <div className="mt-3 bg-[#2a1a08] border border-[#F59E0B]/30 rounded-xl p-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-[#FBBF24] font-semibold">Affiliate bonus — 1,000 $PARA</span>
            <span className="text-[#8892a0]">
              {data.affiliateBonusProgress.current} / {data.affiliateBonusProgress.required}
            </span>
          </div>
          <div className="h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F59E0B] transition-all duration-700"
              style={{
                width: Math.min(100, (data.affiliateBonusProgress.current /
                  data.affiliateBonusProgress.required) * 100) + '%',
              }}
            />
          </div>
        </div>
      )}

      {!data.isAffiliate && (
        <Link
          to="/affiliate"
          className="block mt-3 text-center text-xs text-[#00D4FF] hover:underline font-['Space_Grotesk']"
        >
          Have an audience of 5,000+? Apply to the affiliate programme →
        </Link>
      )}
    </Card>
  )
}