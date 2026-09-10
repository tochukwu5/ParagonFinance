import UserRewards from '../models/UserRewards.js'
import RewardEvent from '../models/RewardEvent.js'
import {
  TX_REWARDS, SIGNUP_BONUS, REFERRAL_REWARD, AFFILIATE_BONUS,
  AFFILIATE_BONUS_UNLOCKS_AT, LIMITS,
  isReferralQualified, levelFor, nextLevelFor,
} from '../config/rewardConfig.js'

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Six characters, no ambiguous glyphs.
 *
 * 0/O and 1/I/L are excluded because referral codes get read aloud, typed
 * from screenshots, and shared in voice notes — the places where those pairs
 * cost you a signup.
 */
function generateCode() {
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

/**
 * Fetch or create a wallet's rewards document.
 *
 * Creating on read is safe here — a document with zero points costs nothing
 * and grants nothing. What must never happen on read is a PAYOUT, which is
 * why the signup bonus lives in awardTransaction rather than here.
 */
export async function getOrCreateRewards(walletAddress) {
  const address = walletAddress.toLowerCase()
  let doc = await UserRewards.findOne({ walletAddress: address })
  if (doc) return doc

  // Retry on collision — six characters from 31 gives ~887 million
  // combinations, so this effectively never loops, but "effectively never"
  // is not "never" and a duplicate key would 500 the whole request.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await UserRewards.create({
        walletAddress: address,
        referralCode: generateCode(),
      })
    } catch (err) {
      if (err.code === 11000 && attempt < 4) continue
      // Another request created it between our find and our create.
      if (err.code === 11000) {
        const existing = await UserRewards.findOne({ walletAddress: address })
        if (existing) return existing
      }
      throw err
    }
  }
}

/**
 * Record a referral relationship. Pays nothing.
 *
 * The payout happens later, in awardTransaction, once the referred wallet
 * has proved it is a person. Paying here would pay for wallet creation,
 * which is free and scriptable.
 */
export async function linkReferral(walletAddress, referralCode) {
  const address = walletAddress.toLowerCase()
  if (!referralCode) return { linked: false, reason: 'no_code' }

  const referrer = await UserRewards.findOne({
    referralCode: referralCode.toUpperCase().trim(),
  })
  if (!referrer) return { linked: false, reason: 'invalid_code' }

  if (LIMITS.blockSelfReferral && referrer.walletAddress === address) {
    return { linked: false, reason: 'self_referral' }
  }

  const user = await getOrCreateRewards(address)

  // First referrer wins, permanently. Without this, someone re-clicks a
  // different link and the original referrer silently loses the credit.
  if (user.referredBy) return { linked: false, reason: 'already_referred' }

  // A wallet that has already been active wasn't referred by anyone — it
  // found the site on its own and is now being retro-attributed.
  if (user.totalTransactions > 0) {
    return { linked: false, reason: 'already_active' }
  }

  user.referredBy = referrer.walletAddress
  await user.save()

  await UserRewards.updateOne(
    { walletAddress: referrer.walletAddress },
    { $inc: { referralCount: 1 } }
  )

  return { linked: true, referrer: referrer.walletAddress }
}

/**
 * Award points for a completed transaction, and settle anything that
 * transaction unlocks — the signup bonus, a pending referral, an affiliate
 * bonus.
 *
 * Called after the transaction is persisted, so a failed save never pays.
 * Every guard here exists because its absence is exploitable:
 *
 *   value floor      — dust transactions cost nothing to spam
 *   daily cap        — bounds what a script earns before it has to wait
 *   txHash unique    — a replayed API call would otherwise pay repeatedly
 *
 * Returns a summary the route can hand to the frontend so the UI can show
 * what was earned without a second round trip.
 */
export async function awardTransaction({ walletAddress, txType, txHash, amount }) {
  const address = walletAddress.toLowerCase()
  const awarded = { transaction: 0, signup: 0, referral: 0, affiliateBonus: 0 }

  const basePoints = TX_REWARDS[txType]
  if (!basePoints) return { awarded, skipped: 'unknown_tx_type' }

  if (parseFloat(amount) < LIMITS.minTxValue) {
    return { awarded, skipped: 'below_minimum_value' }
  }

  const user = await getOrCreateRewards(address)
  const day = today()

  // Daily cap. Resets when the date rolls over.
  if (user.dailyRewardDate !== day) {
    user.dailyRewardDate = day
    user.dailyRewardCount = 0
  }
  if (user.dailyRewardCount >= LIMITS.maxTxRewardsPerDay) {
    // Activity still counts toward referral qualification — the cap limits
    // points, not proof of use. Otherwise a genuine heavy user would fail
    // to qualify their own referrer.
    await recordActivity(user, txType, day)
    await user.save()
    return { awarded, skipped: 'daily_cap_reached' }
  }

  // The unique index on txHash is the real guard; this check just avoids a
  // pointless write and a caught exception on the common path.
  const already = await RewardEvent.findOne({ txHash, type: 'transaction' })
  if (already) return { awarded, skipped: 'already_rewarded' }

  try {
    await RewardEvent.create({
      walletAddress: address,
      type: 'transaction',
      points: basePoints,
      txType,
      txHash,
    })
  } catch (err) {
    if (err.code === 11000) return { awarded, skipped: 'already_rewarded' }
    throw err
  }

  user.totalPoints += basePoints
  user.points.transactions += basePoints
  user.dailyRewardCount += 1
  awarded.transaction = basePoints

  recordActivity(user, txType, day)

  // ─── Signup bonus ─────────────────────────────────────────────────
  // Paid here rather than on registration. This is the wallet's first
  // transaction of real value, which is the earliest point at which paying
  // is defensible.
  if (!user.signupBonusPaid) {
    try {
      await RewardEvent.create({
        walletAddress: address,
        type: 'signup',
        points: SIGNUP_BONUS,
        txHash: null,
        note: 'First qualifying transaction',
      })
      user.totalPoints += SIGNUP_BONUS
      user.points.signup += SIGNUP_BONUS
      user.signupBonusPaid = true
      awarded.signup = SIGNUP_BONUS
    } catch (err) {
      if (err.code !== 11000) throw err
    }
  }

  await user.save()

  // ─── Referral payout ──────────────────────────────────────────────
  if (user.referredBy && !user.referralPaid && isReferralQualified(user)) {
    awarded.referral = await payReferrer(user)
  }

  return {
    awarded,
    totalPoints: user.totalPoints,
    level: levelFor(user.totalPoints),
    nextLevel: nextLevelFor(user.totalPoints),
  }
}

/** Mutates in place; the caller saves. */
function recordActivity(user, txType, day) {
  user.totalTransactions += 1
  if (user.txCounts[txType] !== undefined) user.txCounts[txType] += 1
  if (!user.activeDays.includes(day)) user.activeDays.push(day)
}

/**
 * Pay a referrer for a referred wallet that has now qualified.
 *
 * The rate depends on whether the referrer is an approved affiliate at the
 * moment of payout, not at the moment of referral — so someone approved
 * later is paid the affiliate rate on referrals already pending.
 */
async function payReferrer(referredUser) {
  const referrer = await UserRewards.findOne({ walletAddress: referredUser.referredBy })
  if (!referrer) return 0

  const reward = referrer.isAffiliate
    ? REFERRAL_REWARD.affiliate
    : REFERRAL_REWARD.standard

  try {
    await RewardEvent.create({
      walletAddress: referrer.walletAddress,
      type: 'referral',
      points: reward,
      referredWallet: referredUser.walletAddress,
      note: referrer.isAffiliate ? 'Affiliate referral' : 'Standard referral',
    })
  } catch (err) {
    // The unique index on referredWallet caught a double payout.
    if (err.code === 11000) return 0
    throw err
  }

  referrer.totalPoints += reward
  referrer.points.referrals += reward
  referrer.qualifiedReferralCount += 1

  // ─── Affiliate bonus ──────────────────────────────────────────────
  // Unlocked by QUALIFIED referrals only. Ten wallet creations is an
  // afternoon's scripting; ten wallets each active across two days is not.
  if (
    referrer.isAffiliate &&
    !referrer.affiliateBonusPaid &&
    referrer.qualifiedReferralCount >= AFFILIATE_BONUS_UNLOCKS_AT
  ) {
    try {
      await RewardEvent.create({
        walletAddress: referrer.walletAddress,
        type: 'affiliate_bonus',
        points: AFFILIATE_BONUS,
        note: `Unlocked at ${AFFILIATE_BONUS_UNLOCKS_AT} qualified referrals`,
      })
      referrer.totalPoints += AFFILIATE_BONUS
      referrer.points.affiliateBonus += AFFILIATE_BONUS
      referrer.affiliateBonusPaid = true
    } catch (err) {
      if (err.code !== 11000) throw err
    }
  }

  // Mark before saving the referrer, so a crash between the two leaves the
  // referrer unpaid rather than payable twice.
  referredUser.referralPaid = true
  await referredUser.save()
  await referrer.save()

  return reward
}

/**
 * Approve an affiliate.
 *
 * Any referrals already pending will pay at the affiliate rate when they
 * qualify, since payReferrer reads isAffiliate at payout time.
 */
export async function approveAffiliate(walletAddress) {
  const user = await getOrCreateRewards(walletAddress)
  if (user.isAffiliate) return user

  user.isAffiliate = true
  user.affiliateApprovedAt = new Date()
  await user.save()
  return user
}

/** Everything the dashboard needs, in one query set. */
export async function getRewardsSummary(walletAddress) {
  const address = walletAddress.toLowerCase()
  const user = await getOrCreateRewards(address)

  const [referred, recentEvents] = await Promise.all([
    UserRewards.find({ referredBy: address })
      .select('walletAddress totalTransactions referralPaid createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    RewardEvent.find({ walletAddress: address })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ])

  return {
    walletAddress: address,
    totalPoints: user.totalPoints,
    points: user.points,
    level: levelFor(user.totalPoints),
    nextLevel: nextLevelFor(user.totalPoints),
    referralCode: user.referralCode,
    referralCount: user.referralCount,
    qualifiedReferralCount: user.qualifiedReferralCount,
    isAffiliate: user.isAffiliate,
    affiliateBonusPaid: user.affiliateBonusPaid,
    affiliateBonusProgress: user.isAffiliate
      ? { current: user.qualifiedReferralCount, required: AFFILIATE_BONUS_UNLOCKS_AT }
      : null,
    txCounts: user.txCounts,
    totalTransactions: user.totalTransactions,
    activeDays: user.activeDays?.length || 0,
    // Pending vs qualified, so the dashboard can explain why a referral
    // hasn't paid yet rather than looking broken.
    referrals: referred.map(r => ({
      wallet: r.walletAddress.slice(0, 6) + '…' + r.walletAddress.slice(-4),
      transactions: r.totalTransactions,
      qualified: r.referralPaid,
      joinedAt: r.createdAt,
    })),
    recentEvents,
  }
}