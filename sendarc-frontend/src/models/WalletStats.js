import mongoose from 'mongoose'

const walletStatsSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true, lowercase: true },

  // Counts
  totalTransactions: { type: Number, default: 0 },
  confirmedTransactions: { type: Number, default: 0 },
  failedTransactions: { type: Number, default: 0 },

  // Volume
  totalVolume: { type: Number, default: 0 },       // USDC sent
  totalGasPaid: { type: Number, default: 0 },       // USDC gas

  // Performance
  totalSettlementTime: { type: Number, default: 0 }, // sum of all ms
  avgSettlementTime: { type: Number, default: 0 },
  fastestSettlement: { type: Number, default: null },

  // Unique recipients
  uniqueRecipients: { type: Number, default: 0 },

  // Streak & activity
  lastActivity: { type: Date },
  firstActivity: { type: Date },

  // Leaderboard rank (computed)
  rank: { type: Number, default: null },

}, { timestamps: true })

walletStatsSchema.virtual('successRate').get(function () {
  if (!this.totalTransactions) return 100
  return Math.round((this.confirmedTransactions / this.totalTransactions) * 100)
})

walletStatsSchema.set('toJSON', { virtuals: true })

export default mongoose.model('WalletStats', walletStatsSchema)
