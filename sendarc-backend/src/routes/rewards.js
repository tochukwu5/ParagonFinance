import express from 'express'
import rateLimit from 'express-rate-limit'
import UserRewards from '../models/UserRewards.js'
import AffiliateApplication from '../models/AffiliateApplication.js'
import {
  getOrCreateRewards, linkReferral, getRewardsSummary, approveAffiliate,
} from '../services/rewardService.js'
import { AFFILIATE_REQUIREMENTS, levelFor } from '../config/rewardConfig.js'

const router = express.Router()

// Applications are cheap to submit and expensive to review, so they get a
// tighter limit than the read endpoints around them.
const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
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

    const address = walletAddress.toLowerCase()

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
    // affiliate always has a link to share.
    await getOrCreateRewards(address)

    const application = await AffiliateApplication.create({
      walletAddress: address,
      name, email, socials,
      audienceDescription, promotionPlan,
    })

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

    // Approving flips the flag on UserRewards. Any referrals already pending
    // will pay at the affiliate rate when they qualify, because payReferrer
    // reads isAffiliate at payout time rather than at referral time.
    if (decision === 'approved') {
      await approveAffiliate(application.walletAddress)
    }

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

export default router