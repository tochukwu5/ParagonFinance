import express from 'express'
import rateLimit from 'express-rate-limit'
import UserRewards from '../models/UserRewards.js'
import AffiliateApplication from '../models/AffiliateApplication.js'
import {
  getOrCreateRewards, linkReferral, getRewardsSummary, approveAffiliate,
} from '../services/rewardService.js'
import { AFFILIATE_REQUIREMENTS, levelFor } from '../config/rewardConfig.js'
import { notifyNewApplication, notifyApplicant } from '../services/emailService.js'
import RewardEvent from '../models/RewardEvent.js'


const router = express.Router()

const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  // 3 in production. Raised while testing — put it back before launch, or
  // one person can fill the review queue faster than you can read it.
  max: process.env.NODE_ENV === 'production' ? 20 : 100,
  message: { error: 'Too many applications. Try again later.' },
})
const isAddress = (a) => typeof a === 'string' && /^0x[a-fA-F0-9]{40}$/.test(a)

// ─── GET /api/rewards/:walletAddress ──────────────────────────────────
// Everything the dashboard panel needs, in one call.
router.get('/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params
    if (!isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' })
    }
    res.json({ success: true, ...(await getRewardsSummary(walletAddress)) })
  } catch (err) {
    console.error('Rewards summary error:', err)
    res.status(500).json({ error: 'Failed to load rewards' })
  }
})

// ─── POST /api/rewards/referral ───────────────────────────────────────
// Records who referred whom. Pays nothing — the payout happens later, once
// the referred wallet proves it's a person. Called when someone lands on
// ?ref=CODE and connects a wallet.
router.post('/referral', async (req, res) => {
  try {
    const { walletAddress, referralCode } = req.body
    if (!isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' })
    }
    if (!referralCode) {
      return res.status(400).json({ error: 'referralCode is required' })
    }

    const result = await linkReferral(walletAddress, referralCode)

    // A rejected link is a normal outcome, not an error — the code may be
    // wrong, or the wallet may already have a referrer. 200 with a reason
    // lets the frontend say something useful instead of showing a failure.
    res.json({ success: result.linked, ...result })
  } catch (err) {
    console.error('Referral link error:', err)
    res.status(500).json({ error: 'Failed to record referral' })
  }
})

// ─── GET /api/rewards/leaderboard/top ─────────────────────────────────
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100)

    const leaders = await UserRewards.find({ totalPoints: { $gt: 0 } })
      .select('walletAddress totalPoints qualifiedReferralCount isAffiliate totalTransactions')
      .sort({ totalPoints: -1 })
      .limit(limit)
      .lean()

    res.json({
      success: true,
      leaderboard: leaders.map((u, i) => ({
        rank: i + 1,
        // Truncated — a public leaderboard of full addresses is a targeting
        // list for anyone who wants to phish the top holders.
        wallet: u.walletAddress.slice(0, 6) + '…' + u.walletAddress.slice(-4),
        points: u.totalPoints,
        referrals: u.qualifiedReferralCount,
        transactions: u.totalTransactions,
        isAffiliate: u.isAffiliate,
        level: levelFor(u.totalPoints).name,
      })),
    })
  } catch (err) {
    console.error('Leaderboard error:', err)
    res.status(500).json({ error: 'Failed to load leaderboard' })
  }
})

// ─── POST /api/rewards/affiliate/apply ────────────────────────────────
router.post('/affiliate/apply', applyLimiter, async (req, res) => {
  try {
    const {
      walletAddress, name, email, socials,
      audienceDescription, promotionPlan,
    } = req.body

       // Wallet optional at application time, mandatory before approval.
    if (walletAddress && !isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' })
    }
    if (!name || !email) {
      
      return res.status(400).json({ error: 'Name and email are required' })
    }
    if (!Array.isArray(socials) || socials.length === 0) {
      return res.status(400).json({ error: 'At least one social account is required' })
    }

        // Optional at application time — null is a valid state here.
    const address = walletAddress ? walletAddress.toLowerCase() : null
    // These lookups only mean anything when a wallet was supplied. Querying
    // on null matches every walletless application ever submitted.
    if (address) {
      const existing = await UserRewards.findOne({ walletAddress: address })
      if (existing?.isAffiliate) {
        return res.status(409).json({ error: 'Already an approved affiliate' })
      }

      const pending = await AffiliateApplication.findOne({
        walletAddress: address,
        status: 'pending',
      })
      if (pending) {
        return res.status(409).json({ error: 'You already have an application under review' })
      }
    }

    // Validate shape before checking the threshold, so a malformed entry
    // doesn't get reported as "not enough followers".
    for (const s of socials) {
      if (!AFFILIATE_REQUIREMENTS.platforms.includes(s.platform)) {
        return res.status(400).json({ error: `Unsupported platform: ${s.platform}` })
      }
      if (!s.handle || !s.url || typeof s.followers !== 'number') {
        return res.status(400).json({ error: 'Each social needs a handle, URL and follower count' })
      }
    }

    // Follower counts are self-reported and verified during review. There's
    // no reliable free API across six platforms, so this filters the
    // obviously-unqualified rather than pretending to verify anything.
    const meetsThreshold = socials.some(
      s => s.followers >= AFFILIATE_REQUIREMENTS.minFollowers
    )
    if (!meetsThreshold) {
      return res.status(400).json({
        error: `At least one account needs ${AFFILIATE_REQUIREMENTS.minFollowers.toLocaleString()}+ followers`,
      })
    }

       // Ensures a referral code exists before approval, so an approved
    // affiliate always has a link to share. Skipped without a wallet —
    // the code is created when they connect one.
    if (address) await getOrCreateRewards(address)

    const application = await AffiliateApplication.create({
      walletAddress: address,
      name, email, socials,
      audienceDescription, promotionPlan,
    })

        // Fire and forget. The application is already saved — waiting on an
    // email would make the applicant stare at a spinner for a notification
    // that isn't theirs.
    notifyNewApplication(application)

    res.status(201).json({
      success: true,
      message: 'Application received. We review within 3–5 days.',
      application: { id: application._id, status: application.status },
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You already have an application under review' })
    }
    console.error('Affiliate apply error:', err)
    res.status(500).json({ error: 'Failed to submit application' })
  }
})

// ─── GET /api/rewards/affiliate/status/:walletAddress ─────────────────
router.get('/affiliate/status/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params
    if (!isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' })
    }
    const address = walletAddress.toLowerCase()

    const [user, application] = await Promise.all([
      UserRewards.findOne({ walletAddress: address }).select('isAffiliate affiliateApprovedAt').lean(),
      AffiliateApplication.findOne({ walletAddress: address })
        .sort({ createdAt: -1 })
        .select('status reviewNote createdAt reviewedAt')
        .lean(),
    ])

    res.json({
      success: true,
      isAffiliate: !!user?.isAffiliate,
      approvedAt: user?.affiliateApprovedAt || null,
      application: application || null,
    })
  } catch (err) {
    console.error('Affiliate status error:', err)
    res.status(500).json({ error: 'Failed to load status' })
  }
})

// ═══════════════════════════════════════════════════════════════════════
// Admin — review queue. Same shared-secret gate as routes/admin.js.
// ═══════════════════════════════════════════════════════════════════════
function requireAdminKey(req, res, next) {
  const key = req.headers['x-admin-key']
  if (!key || key !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// ─── GET /api/rewards/admin/applications ──────────────────────────────
router.get('/admin/applications', requireAdminKey, async (req, res) => {
  try {
    const status = req.query.status || 'pending'
    const applications = await AffiliateApplication.find({ status })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()

    res.json({ success: true, count: applications.length, applications })
  } catch (err) {
    console.error('Admin applications error:', err)
    res.status(500).json({ error: 'Failed to load applications' })
  }
})

// ─── POST /api/rewards/admin/applications/:id/review ──────────────────
router.post('/admin/applications/:id/review', requireAdminKey, async (req, res) => {
  try {
    const { decision, note, reviewer } = req.body
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: "decision must be 'approved' or 'rejected'" })
    }

    const application = await AffiliateApplication.findById(req.params.id)
    if (!application) return res.status(404).json({ error: 'Application not found' })
    if (application.status !== 'pending') {
      return res.status(409).json({ error: `Already ${application.status}` })
    }

    application.status = decision
    application.reviewedAt = new Date()
    application.reviewedBy = reviewer || 'admin'
    application.reviewNote = note || ''
    await application.save()

      // A walletless application can be approved as a decision, but there's
    // nothing to attach the affiliate flag to until they connect one.
    if (decision === 'approved' && application.walletAddress) {
      await approveAffiliate(application.walletAddress)
    }

    notifyApplicant(application, decision, note)

    res.json({ success: true, application })
  } catch (err) {
    console.error('Review application error:', err)
    res.status(500).json({ error: 'Failed to review application' })
  }
})

// ─── POST /api/rewards/admin/adjust ───────────────────────────────────
// Manual point adjustment, either direction. The escape hatch for when
// farming is found and specific awards need reversing.
router.post('/admin/adjust', requireAdminKey, async (req, res) => {
  try {
    const { walletAddress, points, note } = req.body
    if (!isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' })
    }
    if (typeof points !== 'number' || points === 0) {
      return res.status(400).json({ error: 'points must be a non-zero number' })
    }

    const { default: RewardEvent } = await import('../models/RewardEvent.js')
    const user = await getOrCreateRewards(walletAddress)

    await RewardEvent.create({
      walletAddress: user.walletAddress,
      type: 'manual',
      points,
      note: note || 'Admin adjustment',
    })

    user.totalPoints = Math.max(0, user.totalPoints + points)
    user.points.manual += points
    await user.save()

    res.json({ success: true, totalPoints: user.totalPoints })
  } catch (err) {
    console.error('Adjust points error:', err)
    res.status(500).json({ error: 'Failed to adjust points' })
  }
})


// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — user and points tracking
//
// Append these two routes to src/routes/rewards.js, directly above the
// final `export default router` line.
//
// They need RewardEvent, which the file doesn't import at the top — add
// this alongside the other imports:
//
//   import RewardEvent from '../models/RewardEvent.js'
//
// (The existing /admin/adjust route imports it dynamically; once it's at
// the top you can simplify that too, though leaving it does no harm.)
// ═══════════════════════════════════════════════════════════════════════════


// ─── GET /api/rewards/admin/users ─────────────────────────────────────
// Every wallet with points, for deciding who gets what at distribution.
//
// Filterable by affiliate status and sortable, because the two questions
// you'll actually ask are "who earned most" and "how are my affiliates
// doing" — and those want different orderings.
router.get('/admin/users', requireAdminKey, async (req, res) => {
  try {
    const {
      filter = 'all',        // all | affiliates | referrers
      sort = 'points',       // points | referrals | transactions | recent
      page = 1,
      limit = 50,
    } = req.query

    const query = {}
    if (filter === 'affiliates') query.isAffiliate = true
    if (filter === 'referrers') query.qualifiedReferralCount = { $gt: 0 }

    const sortMap = {
      points: { totalPoints: -1 },
      referrals: { qualifiedReferralCount: -1 },
      transactions: { totalTransactions: -1 },
      recent: { createdAt: -1 },
    }

    const perPage = Math.min(parseInt(limit), 200)
    const skip = (Math.max(1, parseInt(page)) - 1) * perPage

    const [users, total, totals] = await Promise.all([
      UserRewards.find(query)
        .sort(sortMap[sort] || sortMap.points)
        .skip(skip)
        .limit(perPage)
        .lean(),
      UserRewards.countDocuments(query),
      // Distribution totals. Needed before any airdrop, and cheap enough to
      // return on every page rather than behind a separate endpoint.
      UserRewards.aggregate([
        { $group: {
          _id: null,
          totalPoints: { $sum: '$totalPoints' },
          totalWallets: { $sum: 1 },
          totalAffiliates: { $sum: { $cond: ['$isAffiliate', 1, 0] } },
          totalReferrals: { $sum: '$qualifiedReferralCount' },
          totalTransactions: { $sum: '$totalTransactions' },
        }},
      ]),
    ])

    res.json({
      success: true,
      users: users.map(u => ({
        walletAddress: u.walletAddress,
        totalPoints: u.totalPoints,
        points: u.points,
        txCounts: u.txCounts,
        totalTransactions: u.totalTransactions,
        referralCode: u.referralCode,
        referralCount: u.referralCount,
        qualifiedReferralCount: u.qualifiedReferralCount,
        isAffiliate: u.isAffiliate,
        affiliateBonusPaid: u.affiliateBonusPaid,
        activeDays: u.activeDays?.length || 0,
        joinedAt: u.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage),
      },
      summary: totals[0] || {
        totalPoints: 0, totalWallets: 0, totalAffiliates: 0,
        totalReferrals: 0, totalTransactions: 0,
      },
    })
  } catch (err) {
    console.error('Admin users error:', err)
    res.status(500).json({ error: 'Failed to load users' })
  }
})

// ─── GET /api/rewards/admin/users/:walletAddress ──────────────────────
// One wallet in full: their points, who they referred, and every award.
//
// The referral list carries each person's transaction count, because the
// question that brings you here is usually "why hasn't this affiliate been
// paid" — and the answer is nearly always that their referrals haven't
// qualified yet.
router.get('/admin/users/:walletAddress', requireAdminKey, async (req, res) => {
  try {
    const { walletAddress } = req.params
    if (!isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' })
    }
    const address = walletAddress.toLowerCase()

    const user = await UserRewards.findOne({ walletAddress: address }).lean()
    if (!user) return res.status(404).json({ error: 'Wallet not found' })

    const [referred, events, application, referrer] = await Promise.all([
      UserRewards.find({ referredBy: address })
        .select('walletAddress totalTransactions activeDays referralPaid totalPoints createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      RewardEvent.find({ walletAddress: address })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      AffiliateApplication.findOne({ walletAddress: address })
        .sort({ createdAt: -1 })
        .lean(),
      user.referredBy
        ? UserRewards.findOne({ walletAddress: user.referredBy })
            .select('walletAddress isAffiliate')
            .lean()
        : null,
    ])

    res.json({
      success: true,
      user: {
        ...user,
        activeDays: user.activeDays?.length || 0,
        activeDaysList: user.activeDays || [],
      },
      referredBy: referrer,
      referrals: referred.map(r => ({
        walletAddress: r.walletAddress,
        transactions: r.totalTransactions,
        activeDays: r.activeDays?.length || 0,
        qualified: r.referralPaid,
        points: r.totalPoints,
        joinedAt: r.createdAt,
      })),
      events,
      application,
    })
  } catch (err) {
    console.error('Admin user detail error:', err)
    res.status(500).json({ error: 'Failed to load user' })
  }
})

// ─── GET /api/rewards/admin/export ────────────────────────────────────
// Flat CSV of every wallet and its points — what you'll actually hand to
// whoever runs the distribution.
router.get('/admin/export', requireAdminKey, async (req, res) => {
  try {
    const users = await UserRewards.find({ totalPoints: { $gt: 0 } })
      .sort({ totalPoints: -1 })
      .lean()

    const header = 'wallet,points,tx_points,referral_points,signup_points,affiliate_points,transactions,qualified_referrals,is_affiliate,joined'
    const rows = users.map(u => [
      u.walletAddress,
      u.totalPoints,
      u.points?.transactions || 0,
      u.points?.referrals || 0,
      u.points?.signup || 0,
      u.points?.affiliateBonus || 0,
      u.totalTransactions,
      u.qualifiedReferralCount,
      u.isAffiliate ? 'yes' : 'no',
      new Date(u.createdAt).toISOString().slice(0, 10),
    ].join(','))

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="paragon-points.csv"')
    res.send([header, ...rows].join('\n'))
  } catch (err) {
    console.error('Export error:', err)
    res.status(500).json({ error: 'Failed to export' })
  }
})

export default router


