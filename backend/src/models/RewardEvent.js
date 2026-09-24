import mongoose from 'mongoose'

// Append-only ledger of every point ever awarded, with its reason.
//
// Not derivable from the totals on UserRewards, and that is the point: when
// farming appears — and it will — this is what lets you find the pattern and
// reverse specific awards rather than guessing at aggregates.
const rewardEventSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, lowercase: true, index: true },

  type: {
    type: String,
    required: true,
    enum: ['transaction', 'signup', 'referral', 'affiliate_bonus', 'manual'],
    index: true,
  },

  points: { type: Number, required: true },

  txType: { type: String, enum: ['send', 'swap', 'bridge', null], default: null },
  txHash: { type: String, default: null, index: true },

  // On a referral event, the wallet whose activity triggered the payout.
  referredWallet: { type: String, default: null, lowercase: true },

  note: { type: String, maxlength: 500 },

}, { timestamps: true })

// One reward per transaction hash. The single most important constraint in
// this schema — without it, a replayed API call pays out repeatedly, and
// replaying an API call is the first thing anyone tries.
rewardEventSchema.index(
  { txHash: 1, type: 1 },
  { unique: true, partialFilterExpression: { txHash: { $type: 'string' } } }
)

// One referral payout per referred wallet, whatever else happens.
rewardEventSchema.index(
  { referredWallet: 1, type: 1 },
  { unique: true, partialFilterExpression: { referredWallet: { $type: 'string' } } }
)

export default mongoose.models.RewardEvent || mongoose.model('RewardEvent', rewardEventSchema)