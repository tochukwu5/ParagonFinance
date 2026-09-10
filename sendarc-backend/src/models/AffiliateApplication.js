import mongoose from 'mongoose'
import { AFFILIATE_REQUIREMENTS } from '../config/rewardConfig.js'

const affiliateApplicationSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, lowercase: true, index: true },

  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },

  // At least one platform must clear AFFILIATE_REQUIREMENTS.minFollowers.
  //
  // Follower counts are self-reported and checked during review. There is no
  // reliable free API for this across six platforms, and building a check
  // that silently trusts the number would be worse than an honest manual
  // step — it would look like verification without being any.
  socials: [{
    platform: {
      type: String,
      required: true,
      enum: AFFILIATE_REQUIREMENTS.platforms,
    },
    handle: { type: String, required: true, trim: true, maxlength: 100 },
    url: { type: String, required: true, trim: true, maxlength: 500 },
    followers: { type: Number, required: true, min: 0 },
  }],

  audienceDescription: { type: String, maxlength: 1000 },
  promotionPlan: { type: String, maxlength: 1000 },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },

  reviewedBy: { type: String, default: null },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, maxlength: 1000 },

}, { timestamps: true })

// One pending application per wallet. Without this a rejected applicant
// resubmits daily and the review queue becomes unusable.
affiliateApplicationSchema.index(
  { walletAddress: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
)

export default mongoose.models.AffiliateApplication ||
  mongoose.model('AffiliateApplication', affiliateApplicationSchema)