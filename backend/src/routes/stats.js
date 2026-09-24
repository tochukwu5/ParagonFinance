import express from 'express'
import Transaction from '../models/Transaction.js'
import WalletStats from '../models/WalletStats.js'

const router = express.Router()

// ─── GET /api/stats/overview ──────────────────────────────────────────
// Public platform stats — read only, no auth required
// Deliberately separate from /api/admin/* which stays protected
router.get('/overview', async (req, res) => {
  try {
    const [
      totalWallets,
      txAgg,
      last24hAgg,
      last7dAgg,
    ] = await Promise.all([
      WalletStats.countDocuments(),
      Transaction.aggregate([
        { $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          confirmedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          failedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          totalVolume: { $sum: '$amount' },
          avgSettlement: { $avg: '$settlementTime' },
        }}
      ]),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
        { $group: { _id: null, count: { $sum: 1 }, volume: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: null, count: { $sum: 1 }, volume: { $sum: '$amount' } } }
      ]),
    ])

    const t = txAgg[0] || {}
    const last24h = last24hAgg[0] || { count: 0, volume: 0 }
    const last7d = last7dAgg[0] || { count: 0, volume: 0 }

    res.json({
      success: true,
      totalWallets,
      totalTransactions: t.totalTransactions || 0,
      confirmedTransactions: t.confirmedTransactions || 0,
      failedTransactions: t.failedTransactions || 0,
      successRate: t.totalTransactions
        ? Math.round((t.confirmedTransactions / t.totalTransactions) * 100)
        : 0,
      totalVolume: t.totalVolume || 0,
      avgSettlementMs: t.avgSettlement || 0,
      last24h,
      last7d,
    })
  } catch (err) {
    console.error('Public stats overview error:', err)
    res.status(500).json({ error: 'Failed to load stats' })
  }
})

// ─── GET /api/stats/leaderboard ───────────────────────────────────────
// Top wallets by volume — public, no individual wallet drill-down
// We show shortened addresses only to respect partial privacy
router.get('/leaderboard', async (req, res) => {
  try {
    const leaders = await WalletStats.find({ totalTransactions: { $gt: 0 } })
      .sort({ totalVolume: -1 })
      .limit(20)
      .lean()

    res.json({
      success: true,
      leaderboard: leaders.map((w, i) => ({
        rank: i + 1,
        // Shorten address for public view — first 6 + last 4 chars only
        address: w.walletAddress.slice(0, 6) + '...' + w.walletAddress.slice(-4),
        totalTransactions: w.totalTransactions,
        totalVolume: parseFloat(w.totalVolume).toFixed(2),
        successRate: w.totalTransactions
          ? Math.round((w.confirmedTransactions / w.totalTransactions) * 100)
          : 100,
        lastActivity: w.lastActivity,
      })),
    })
  } catch (err) {
    console.error('Public leaderboard error:', err)
    res.status(500).json({ error: 'Failed to load leaderboard' })
  }
})

// ─── GET /api/stats/activity ──────────────────────────────────────────
// Daily transaction count and volume for the last 30 days (for chart)
router.get('/activity', async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const daily = await Transaction.aggregate([
      { $match: { status: 'confirmed', createdAt: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        volume: { $sum: '$amount' },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ])

    res.json({ success: true, daily })
  } catch (err) {
    console.error('Public activity error:', err)
    res.status(500).json({ error: 'Failed to load activity' })
  }
})

export default router
