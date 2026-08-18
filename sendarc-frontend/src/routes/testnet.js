import express from 'express'
import Transaction from '../models/Transaction.js'
import WalletStats from '../models/WalletStats.js'

const router = express.Router()

// ─── POST /api/testnet/wallet/register ───────────────────────────────
// Called the moment a wallet connects — creates WalletStats entry immediately
// so the admin dashboard counts it even before any transaction is sent.
// Safe to call multiple times — upsert with $setOnInsert means it never
// overwrites existing stats.
router.post('/wallet/register', async (req, res) => {
  try {
    const { walletAddress } = req.body
    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' })
    }

    const address = walletAddress.toLowerCase().trim()

    const result = await WalletStats.findOneAndUpdate(
      { walletAddress: address },
      {
        $setOnInsert: {
          walletAddress: address,
          firstActivity: new Date(),
          totalTransactions: 0,
          confirmedTransactions: 0,
          failedTransactions: 0,
          totalVolume: 0,
          totalGasPaid: 0,
          avgSettlementTime: 0,
          uniqueRecipients: 0,
          fastestSettlement: null,
          lastActivity: new Date(),
        }
      },
      { upsert: true, new: true }
    )

    const isNew = result.totalTransactions === 0 && result.totalVolume === 0

    console.log(isNew ? '✅ New wallet registered:' : '🔁 Wallet already known:', address)

    res.json({
      success: true,
      isNew,
      walletAddress: address,
      message: isNew ? 'Wallet registered successfully' : 'Wallet already registered',
    })
  } catch (err) {
    console.error('Wallet register error:', err)
    res.status(500).json({ error: 'Failed to register wallet: ' + err.message })
  }
})

// ─── POST /api/testnet/admin/fix-gas ─────────────────────────────────
// One-time migration: fixes gas values stored with wrong decimal (6 instead of 18)
router.post('/admin/fix-gas', async (req, res) => {
  try {
    const badTxs = await Transaction.find({
      $expr: { $gt: [{ $toDouble: '$gasCost' }, 1] }
    })

    let fixed = 0
    for (const tx of badTxs) {
      const oldGas = parseFloat(tx.gasCost)
      const correctedGas = (oldGas / 1e12).toFixed(9)
      await Transaction.updateOne({ _id: tx._id }, { $set: { gasCost: correctedGas } })
      fixed++
    }

    const wallets = await WalletStats.find({})
    for (const w of wallets) {
      const agg = await Transaction.aggregate([
        { $match: { walletAddress: w.walletAddress } },
        { $group: {
          _id: null,
          totalGasPaid: { $sum: { $toDouble: '$gasCost' } },
          avgSettlement: { $avg: '$settlementTime' },
          minSettlement: { $min: '$settlementTime' },
          confirmedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          totalTransactions: { $sum: 1 },
          totalVolume: { $sum: '$amount' },
        }}
      ])
      if (agg[0]) {
        await WalletStats.updateOne({ _id: w._id }, {
          $set: {
            totalGasPaid: agg[0].totalGasPaid || 0,
            avgSettlementTime: agg[0].avgSettlement || 0,
            fastestSettlement: agg[0].minSettlement || null,
            confirmedTransactions: agg[0].confirmedTransactions || 0,
            totalTransactions: agg[0].totalTransactions || 0,
            totalVolume: agg[0].totalVolume || 0,
          }
        })
      }
    }

    res.json({
      success: true,
      message: 'Gas values corrected and wallet stats recomputed',
      transactionsFixed: fixed,
      walletsUpdated: wallets.length,
    })
  } catch (err) {
    console.error('Fix gas error:', err)
    res.status(500).json({ error: 'Migration failed: ' + err.message })
  }
})

// ─── POST /api/testnet/transactions ──────────────────────────────────
// Record a new testnet transaction.
// Also auto-registers the wallet if not already in WalletStats —
// this is the final safety net so no wallet ever goes unregistered.
router.post('/transactions', async (req, res) => {
  try {
    const {
      id, hash, from, to, amount, gasCost, gasUsed,
      settlementTime, blockNumber, timestamp, status,
      network, chainId, memo, walletAddress,
    } = req.body

    if (!id || !hash || !from || !to || !amount || !walletAddress) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Auto-register wallet if this is their first transaction
    // and they haven't been registered via /wallet/register yet
    await WalletStats.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      {
        $setOnInsert: {
          walletAddress: walletAddress.toLowerCase(),
          firstActivity: new Date(),
          totalTransactions: 0,
          confirmedTransactions: 0,
          failedTransactions: 0,
          totalVolume: 0,
          totalGasPaid: 0,
          avgSettlementTime: 0,
          uniqueRecipients: 0,
          fastestSettlement: null,
        }
      },
      { upsert: true }
    )

    // Check for duplicate
    const existing = await Transaction.findOne({ id })
    if (existing) {
      return res.status(409).json({ error: 'Transaction already recorded', transaction: existing })
    }

    const tx = await Transaction.create({
      id,
      hash,
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amount: parseFloat(amount),
      gasCost: gasCost || '0.000000000',
      gasUsed: gasUsed || 0,
      settlementTime: settlementTime || 0,
      blockNumber,
      timestamp,
      status: status || 'confirmed',
      network: network || 'Arc Testnet',
      chainId: chainId || 5042002,
      memo: memo || '',
      selfTransfer: from.toLowerCase() === to.toLowerCase(),
      walletAddress: walletAddress.toLowerCase(),
    })

    // Update wallet stats with this new transaction
    await updateWalletStats(walletAddress.toLowerCase(), tx)

    res.status(201).json({ success: true, transaction: tx })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate transaction' })
    }
    console.error('Record transaction error:', err)
    res.status(500).json({ error: 'Failed to record transaction' })
  }
})

// ─── GET /api/testnet/transactions/:walletAddress ─────────────────────
router.get('/transactions/:walletAddress', async (req, res) => {
  try {
    const wallet = req.params.walletAddress.toLowerCase()
    const { page = 1, limit = 50, status } = req.query

    const query = { walletAddress: wallet }
    if (status && status !== 'all') query.status = status

    const [transactions, total, stats] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean(),
      Transaction.countDocuments(query),
      WalletStats.findOne({ walletAddress: wallet }).lean(),
    ])

    res.json({
      success: true,
      transactions,
      total,
      page: parseInt(page),
      stats: stats ? {
        totalTransactions: stats.totalTransactions,
        totalVolume: stats.totalVolume,
        totalGasPaid: stats.totalGasPaid,
        avgSettlementTime: stats.avgSettlementTime,
        successRate: stats.totalTransactions
          ? Math.round((stats.confirmedTransactions / stats.totalTransactions) * 100)
          : 100,
        uniqueRecipients: stats.uniqueRecipients,
        lastActivity: stats.lastActivity,
        fastestSettlement: stats.fastestSettlement,
      } : {
        totalTransactions: 0,
        totalVolume: 0,
        totalGasPaid: 0,
        avgSettlementTime: 0,
        successRate: 100,
        uniqueRecipients: 0,
        lastActivity: null,
        fastestSettlement: null,
      },
    })
  } catch (err) {
    console.error('Get transactions error:', err)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

// ─── GET /api/testnet/stats/:walletAddress ────────────────────────────
router.get('/stats/:walletAddress', async (req, res) => {
  try {
    const wallet = req.params.walletAddress.toLowerCase()
    const stats = await WalletStats.findOne({ walletAddress: wallet }).lean()

    if (!stats) {
      return res.json({
        success: true,
        stats: {
          totalTransactions: 0, totalVolume: 0, totalGasPaid: 0,
          avgSettlementTime: 0, successRate: 100, uniqueRecipients: 0,
          lastActivity: null,
        }
      })
    }

    res.json({
      success: true,
      stats: {
        totalTransactions: stats.totalTransactions,
        confirmedTransactions: stats.confirmedTransactions,
        failedTransactions: stats.failedTransactions,
        totalVolume: stats.totalVolume,
        totalGasPaid: stats.totalGasPaid,
        avgSettlementTime: stats.avgSettlementTime,
        fastestSettlement: stats.fastestSettlement,
        successRate: stats.totalTransactions
          ? Math.round((stats.confirmedTransactions / stats.totalTransactions) * 100)
          : 100,
        uniqueRecipients: stats.uniqueRecipients,
        lastActivity: stats.lastActivity,
        firstActivity: stats.firstActivity,
      }
    })
  } catch (err) {
    console.error('Get stats error:', err)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// ─── GET /api/testnet/leaderboard ─────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50 } = req.query

    const leaders = await WalletStats.find({})
      .sort({ totalVolume: -1, totalTransactions: -1 })
      .limit(parseInt(limit))
      .lean()

    const leaderboard = leaders.map((entry, i) => ({
      rank: i + 1,
      address: entry.walletAddress,
      totalTransactions: entry.totalTransactions,
      totalVolume: entry.totalVolume.toFixed(2),
      totalGasPaid: entry.totalGasPaid.toFixed(6),
      avgSettlement: entry.avgSettlementTime
        ? (entry.avgSettlementTime / 1000).toFixed(2) + 's'
        : '—',
      fastestSettlement: entry.fastestSettlement
        ? (entry.fastestSettlement / 1000).toFixed(3) + 's'
        : '—',
      successRate: entry.totalTransactions
        ? Math.round((entry.confirmedTransactions / entry.totalTransactions) * 100)
        : 100,
      lastActivity: entry.lastActivity,
      firstActivity: entry.firstActivity,
    }))

    const globalStats = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalVolume: { $sum: '$amount' },
          totalGasPaid: { $sum: { $toDouble: '$gasCost' } },
          avgSettlement: { $avg: '$settlementTime' },
          uniqueWallets: { $addToSet: '$walletAddress' },
        }
      }
    ])

    const global = globalStats[0] || {}

    res.json({
      success: true,
      leaderboard,
      globalStats: {
        totalTransactions: global.totalTransactions || 0,
        totalVolume: (global.totalVolume || 0).toFixed(2),
        totalGasPaid: (global.totalGasPaid || 0).toFixed(6),
        avgSettlement: global.avgSettlement
          ? (global.avgSettlement / 1000).toFixed(2) + 's'
          : '—',
        activeWallets: global.uniqueWallets?.length || 0,
      }
    })
  } catch (err) {
    console.error('Leaderboard error:', err)
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

// ─── GET /api/testnet/network-stats ───────────────────────────────────
router.get('/network-stats', async (req, res) => {
  try {
    const [volumeByDay, gasStats, settlementStats, totalWallets] = await Promise.all([
      Transaction.aggregate([
        { $match: { status: 'confirmed', createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          volume: { $sum: '$amount' },
          count: { $sum: 1 },
          avgGas: { $avg: { $toDouble: '$gasCost' } },
        }},
        { $sort: { _id: 1 } }
      ]),
      Transaction.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: {
          _id: null,
          avgGas: { $avg: { $toDouble: '$gasCost' } },
          totalGas: { $sum: { $toDouble: '$gasCost' } },
          minGas: { $min: { $toDouble: '$gasCost' } },
          maxGas: { $max: { $toDouble: '$gasCost' } },
        }}
      ]),
      Transaction.aggregate([
        { $match: { status: 'confirmed', settlementTime: { $gt: 0 } } },
        { $group: {
          _id: null,
          avgSettlement: { $avg: '$settlementTime' },
          minSettlement: { $min: '$settlementTime' },
          maxSettlement: { $max: '$settlementTime' },
        }}
      ]),
      WalletStats.countDocuments(),
    ])

    res.json({
      success: true,
      volumeByDay,
      gasStats: gasStats[0] || {},
      settlementStats: settlementStats[0] || {},
      totalWallets,
    })
  } catch (err) {
    console.error('Network stats error:', err)
    res.status(500).json({ error: 'Failed to fetch network stats' })
  }
})

// ─── Helper: recompute and save wallet stats after each transaction ───
async function updateWalletStats(walletAddress, tx) {
  try {
    const uniqueRecipients = await Transaction.distinct('to', {
      walletAddress,
      status: 'confirmed',
    })

    const agg = await Transaction.aggregate([
      { $match: { walletAddress } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          confirmedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          failedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          totalVolume: { $sum: '$amount' },
          totalGasPaid: { $sum: { $toDouble: '$gasCost' } },
          avgSettlement: { $avg: '$settlementTime' },
          minSettlement: { $min: '$settlementTime' },
        }
      }
    ])

    const data = agg[0] || {}

    await WalletStats.findOneAndUpdate(
      { walletAddress },
      {
        $set: {
          totalTransactions: data.totalTransactions || 0,
          confirmedTransactions: data.confirmedTransactions || 0,
          failedTransactions: data.failedTransactions || 0,
          totalVolume: data.totalVolume || 0,
          totalGasPaid: data.totalGasPaid || 0,
          avgSettlementTime: data.avgSettlement || 0,
          fastestSettlement: data.minSettlement || null,
          uniqueRecipients: uniqueRecipients.length,
          lastActivity: new Date(),
        },
        $setOnInsert: { firstActivity: new Date() }
      },
      { upsert: true, new: true }
    )
  } catch (err) {
    console.error('Update wallet stats error:', err)
  }
}

export default router