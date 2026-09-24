import express from 'express'
import Transaction from '../models/Transaction.js'
import WalletStats from '../models/WalletStats.js'

const router = express.Router()

// Simple shared-secret middleware — checks header against env var
// This is a basic gate, not full auth. Good enough for a solo-owned admin panel.
function requireAdminKey(req, res, next) {
  const key = req.headers['x-admin-key']
  if (!key || key !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

router.use(requireAdminKey)

// ─── GET /api/admin/overview ───────────────────────────────────────────
// Top-level platform numbers for the admin dashboard header cards
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
          totalGasPaid: { $sum: { $toDouble: '$gasCost' } },
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
      successRate: t.totalTransactions ? Math.round((t.confirmedTransactions / t.totalTransactions) * 100) : 0,
      totalVolume: t.totalVolume || 0,
      totalGasPaid: t.totalGasPaid || 0,
      avgSettlementMs: t.avgSettlement || 0,
      last24h,
      last7d,
    })
  } catch (err) {
    console.error('Admin overview error:', err)
    res.status(500).json({ error: 'Failed to load overview' })
  }
})

// ─── GET /api/admin/wallets ─────────────────────────────────────────────
// Paginated list of all wallets with their stats — supports search
router.get('/wallets', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 25
    const search = (req.query.search || '').toLowerCase().trim()
    const sortBy = req.query.sortBy || 'totalVolume'

    const filter = search ? { walletAddress: { $regex: search, $options: 'i' } } : {}

    const [wallets, total] = await Promise.all([
      WalletStats.find(filter)
        .sort({ [sortBy]: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      WalletStats.countDocuments(filter),
    ])

    res.json({
      success: true,
      wallets,
      page,
      totalPages: Math.ceil(total / limit),
      totalWallets: total,
    })
  } catch (err) {
    console.error('Admin wallets error:', err)
    res.status(500).json({ error: 'Failed to load wallets' })
  }
})

// ─── GET /api/admin/wallets/:address ────────────────────────────────────
// Full detail for a single wallet — stats + full transaction history
router.get('/wallets/:address', async (req, res) => {
  try {
    const address = req.params.address.toLowerCase()
    const [stats, transactions] = await Promise.all([
      WalletStats.findOne({ walletAddress: address }).lean(),
      Transaction.find({ walletAddress: address }).sort({ createdAt: -1 }).limit(100).lean(),
    ])

    if (!stats) return res.status(404).json({ error: 'Wallet not found' })

    res.json({ success: true, stats, transactions })
  } catch (err) {
    console.error('Admin wallet detail error:', err)
    res.status(500).json({ error: 'Failed to load wallet detail' })
  }
})

// ─── GET /api/admin/transactions ────────────────────────────────────────
// Paginated list of all transactions platform-wide
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 25
    const status = req.query.status // optional filter: confirmed | pending | failed

    const filter = status ? { status } : {}

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ])

    res.json({
      success: true,
      transactions,
      page,
      totalPages: Math.ceil(total / limit),
      totalTransactions: total,
    })
  } catch (err) {
    console.error('Admin transactions error:', err)
    res.status(500).json({ error: 'Failed to load transactions' })
  }
})

// ─── GET /api/admin/growth ───────────────────────────────────────────────
// Daily new-wallet and volume growth for the last 30 days (for charts)
router.get('/growth', async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [newWallets, dailyVolume] = await Promise.all([
      WalletStats.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } }
      ]),
      Transaction.aggregate([
        { $match: { status: 'confirmed', createdAt: { $gte: since } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          volume: { $sum: '$amount' },
          count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } }
      ]),
    ])

    res.json({ success: true, newWallets, dailyVolume })
  } catch (err) {
    console.error('Admin growth error:', err)
    res.status(500).json({ error: 'Failed to load growth data' })
  }
})

export default router