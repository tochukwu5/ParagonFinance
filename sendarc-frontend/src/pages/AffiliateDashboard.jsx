import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { Card, LoadingSpinner } from '../components/UI'

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

const EVENT_LABEL = {
  transaction: 'Transaction',
  signup: 'Joining bonus',
  referral: 'Referral',
  affiliate_bonus: 'Affiliate bonus',
  manual: 'Adjustment',
}

function timeAgo(date) {
  const mins = Math.floor((Date.now() - new Date(date)) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return mins + 'm ago'
  if (mins < 1440) return Math.floor(mins / 60) + 'h ago'
  return Math.floor(mins / 1440) + 'd ago'
}

export default function AffiliateDashboard() {
  const { wallet } = useWallet()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!wallet?.address) { setLoading(false); return }
    let cancelled = false

    fetch(API_BASE + '/rewards/' + wallet.address)
      .then(r => r.json())
      .then(d => { if (!cancelled && d.success) setData(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [wallet])

  if (!wallet) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center text-center px-6">
        <div>
          <p className="text-[#8892a0] mb-4">Connect your wallet to see your referrals</p>
          <Link to="/connect" className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-6 py-3 rounded-xl">
            Connect Wallet
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!data) return null

  const referralLink = window.location.origin + '/?ref=' + data.referralCode
  const copy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pending = data.referrals?.filter(r => !r.qualified) || []
  const qualified = data.referrals?.filter(r => r.qualified) || []
  const rate = data.referralCount > 0
    ? Math.round((data.qualifiedReferralCount / data.referralCount) * 100)
    : 0

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <main className="max-w-5xl mx-auto p-6 md:p-8">

        <div className="flex justify-between items-start flex-wrap gap-3 mb-8">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold font-['Space_Grotesk']">Referrals</h1>
              {data.isAffiliate && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#2a1a08] border border-[#F59E0B] text-[#FBBF24]">
                  AFFILIATE
                </span>
              )}
            </div>
            <p className="text-[#8892a0] text-sm mt-1">
              {data.isAffiliate
                ? 'Earning 80 points  per qualified referral'
                : 'Earning 50 points per qualified referral'}
            </p>
          </div>
          <Link
            to="/dashboard"
            className="text-xs text-[#8892a0] border border-[#1e2530] rounded-lg px-3 py-2 hover:border-[#00D4FF] hover:text-white transition-all"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Headline numbers. Qualified is first and largest because it's the
            one that pays — total referrals is vanity by comparison. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { value: data.qualifiedReferralCount, label: 'QUALIFIED', accent: true },
            { value: pending.length, label: 'PENDING' },
            { value: data.points.referrals, label: 'POINTS FROM REFERRALS' },
            { value: rate + '%', label: 'CONVERSION' },
          ].map(s => (
            <Card key={s.label} className="p-5">
              <p className={
                "text-2xl font-bold font-['Space_Grotesk'] " +
                (s.accent ? 'text-[#00D4FF]' : 'text-white')
              }>
                {s.value}
              </p>
              <p className="text-[9px] tracking-widest text-[#4a5568] mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Referral link */}
        <Card className="p-5 mb-6">
          <p className="text-[10px] tracking-[2px] text-[#4a5568] mb-3">YOUR LINK</p>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0 bg-[#0D1117] border border-[#1e2530] rounded-lg px-3 py-2.5">
              <p className="text-xs font-mono text-[#8892a0] truncate">{referralLink}</p>
            </div>
            <button
              onClick={copy}
              className={
                "px-5 rounded-lg text-xs font-semibold font-['Space_Grotesk'] transition-all flex-shrink-0 " +
                (copied
                  ? 'bg-green-900/20 border border-green-500 text-green-400'
                  : 'bg-[#00D4FF] text-[#0D1117] hover:opacity-90')
              }
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </Card>

        {/* Affiliate bonus progress */}
        {data.isAffiliate && data.affiliateBonusProgress && !data.affiliateBonusPaid && (
          <Card className="p-5 mb-6 border-[#F59E0B]/30">
            <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
              <div>
                <p className="text-sm font-semibold text-[#FBBF24] font-['Space_Grotesk']">
                  Affiliate bonus — 1,000 points
                </p>
                <p className="text-xs text-[#8892a0] mt-0.5">
                  {data.affiliateBonusProgress.required - data.affiliateBonusProgress.current} more
                  qualified referrals to unlock
                </p>
              </div>
              <span className="text-lg font-bold text-white font-['Space_Grotesk']">
                {data.affiliateBonusProgress.current} / {data.affiliateBonusProgress.required}
              </span>
            </div>
            <div className="h-2 bg-[#0D1117] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F59E0B] transition-all duration-700"
                style={{
                  width: Math.min(100, (data.affiliateBonusProgress.current /
                    data.affiliateBonusProgress.required) * 100) + '%',
                }}
              />
            </div>
          </Card>
        )}

        {/* Referral list */}
        <Card className="overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-[#1e2530] flex items-center justify-between">
            <p className="text-sm font-semibold font-['Space_Grotesk']">Your referrals</p>
            <span className="text-[10px] text-[#4a5568]">{data.referralCount} total</span>
          </div>

          {data.referrals?.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-[#8892a0] mb-2">No referrals yet</p>
              <p className="text-xs text-[#4a5568] max-w-sm mx-auto leading-relaxed">
                Share your link. You'll be credited once someone you referred
                completes three transactions across two separate days.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#1e2530]">
              {[...qualified, ...pending].map((r, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-white">{r.wallet}</p>
                    <p className="text-[10px] text-[#4a5568] mt-0.5">
                      Joined {timeAgo(r.joinedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Progress toward qualification, so it's obvious who's
                        close and worth a nudge rather than just "pending". */}
                    <div className="text-right">
                      <p className="text-xs text-[#8892a0]">
                        {r.transactions} / 3 tx
                      </p>
                    </div>
                    <span className={
                      'text-[10px] font-semibold px-2 py-1 rounded-full ' +
                      (r.qualified
                        ? 'bg-green-900/20 border border-green-500 text-green-400'
                        : 'bg-[#1a1408] border border-[#3d2f10] text-[#e8c374]')
                    }>
                      {r.qualified ? 'Qualified' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent activity */}
        {data.recentEvents?.length > 0 && (
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e2530]">
              <p className="text-sm font-semibold font-['Space_Grotesk']">Recent points</p>
            </div>
            <div className="divide-y divide-[#1e2530]">
              {data.recentEvents.slice(0, 10).map((e, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-white">
                      {EVENT_LABEL[e.type] || e.type}
                      {e.txType && <span className="text-[#4a5568]"> · {e.txType}</span>}
                    </p>
                    <p className="text-[10px] text-[#4a5568] mt-0.5">{timeAgo(e.createdAt)}</p>
                  </div>
                  <span className={
                    "text-sm font-bold font-['Space_Grotesk'] flex-shrink-0 " +
                    (e.points >= 0 ? 'text-[#00D4FF]' : 'text-red-400')
                  }>
                    {e.points >= 0 ? '+' : ''}{e.points}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!data.isAffiliate && (
          <div className="mt-6 bg-[#0a1520] border border-[#00D4FF]/20 rounded-xl p-5 text-center">
            <p className="text-sm text-white font-semibold font-['Space_Grotesk'] mb-1.5">
              Earn 80 points per referral instead of 50
            </p>
            <p className="text-xs text-[#8892a0] mb-4 max-w-md mx-auto leading-relaxed">
              The affiliate programme is open to anyone with 5,000+ followers on
              one platform. Approved affiliates also get 1,000 points at ten
              qualified referrals.
            </p>
            <Link
              to="/affiliate"
              className="inline-block bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-all"
            >
              Apply →
            </Link>
          </div>
        )}

      </main>
    </div>
  )
}