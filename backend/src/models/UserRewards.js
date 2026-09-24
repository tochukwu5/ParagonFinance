import mongoose from 'mongoose'

// One document per wallet, created lazily on first transaction rather than
// on connect. That ordering is deliberate — a document created on connect is
// a document a script can create in bulk.
const userRewardsSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true, lowercase: true, index: true },

  // ─── Points ─────────────────────────────────────────────────────────
  totalPoints: { type: Number, default: 0, index: true },

  // Broken out by source so the dashboard can show provenance — and so
  // farming shows up as a lopsided distribution rather than a big number.
  points: {
    transactions: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 },
    signup: { type: Number, default: 0 },
    affiliateBonus: { type: Number, default: 0 },
    manual: { type: Number, default: 0 }, // admin adjustments, either direction
  },

  // ─── Activity ───────────────────────────────────────────────────────
  totalTransactions: { type: Number, default: 0 },
  txCounts: {
    send: { type: Number, default: 0 },
    swap: { type: Number, default: 0 },
    bridge: { type: Number, default: 0 },
  },

  // ISO dates, e.g. "2026-09-04". Drives the referral qualification rule —
  // a wallet active on a single day is indistinguishable from a script.
  activeDays: [{ type: String }],

  // Reset daily. Caps how much a script earns before it has to wait.
  dailyRewardCount: { type: Number, default: 0 },
  dailyRewardDate: { type: String, default: null },

  // ─── Referral ───────────────────────────────────────────────────────
  referralCode: { type: String, unique: true, sparse: true, index: true },
  referredBy: { type: String, default: null, lowercase: true, index: true },

  // Set once this wallet meets REFERRAL_QUALIFIES_AT, so the referrer is
  // paid exactly once however many transactions follow.
  referralPaid: { type: Boolean, default: false },

  referralCount: { type: Number, default: 0 },          // total signups
  qualifiedReferralCount: { type: Number, default: 0 }, // those that counted

  signupBonusPaid: { type: Boolean, default: false },

  // ─── Affiliate ──────────────────────────────────────────────────────
  isAffiliate: { type: Boolean, default: false, index: true },
  affiliateApprovedAt: { type: Date, default: null },
  affiliateBonusPaid: { type: Boolean, default: false },

}, { timestamps: true })

userRewardsSchema.index({ totalPoints: -1 }) // leaderboard

export default mongoose.models.UserRewards || mongoose.model('UserRewards', userRewardsSchema)