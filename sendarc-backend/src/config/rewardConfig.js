// ParagonFinance $Para rewards — configuration and qualification rules.
//
// Points are tracked off-chain in MongoDB, never minted. Nothing goes
// on-chain until TGE, which matters because testnet activity is free: the
// first serious farming attempt will require changing these rules, and that
// is trivial with a ledger and impossible once tokens are distributed.
//
// The governing principle: rewards attach to ACTIVITY, not REGISTRATION.
// Paying for a wallet connection pays for a for-loop. Paying for sustained
// use costs an attacker real effort per unit earned.

export const TX_REWARDS = {
  send: 3,
  swap: 5,
  // Bridges pay most because they are hardest to fake — real balances on two
  // chains, minutes to settle, and a CCTP attestation in between.
  bridge: 7,
}

// Credited on a wallet's FIRST QUALIFYING TRANSACTION, not on connect.
// Paying at registration means a script earns it a thousand times over.
export const SIGNUP_BONUS = 30

export const REFERRAL_REWARD = {
  standard: 50,
  affiliate: 80,
}

// A referral pays only once the referred wallet is genuinely active.
// Without this, "referral" means "created a wallet", which is free.
export const REFERRAL_QUALIFIES_AT = {
  minTransactions: 3,
  // Across separate days. A script does three transactions in four seconds;
  // a real user rarely does all of theirs in one sitting and never returns.
  minActiveDays: 2,
}

export const AFFILIATE_BONUS = 1000
export const AFFILIATE_BONUS_UNLOCKS_AT = 10 // qualified referrals

export const AFFILIATE_REQUIREMENTS = {
  minFollowers: 5000,
  platforms: ['twitter', 'telegram', 'youtube', 'instagram', 'tiktok', 'discord'],
}

export const LIMITS = {
  // A real user might do a dozen transactions in a day; a script does
  // thousands. Costs honest users nothing, caps an attacker's ceiling.
  maxTxRewardsPerDay: 10,

  // Dust costs nothing to spam. In USDC or equivalent value.
  minTxValue: 1,

  // Blocking self-referral by address is necessary but not sufficient —
  // generating a second wallet is free. The qualification rules above are
  // what actually bite.
  blockSelfReferral: true,
}

// Cosmetic, but they give returning users something to move toward, which
// does more for retention than the point totals themselves.
export const LEVELS = [
  { name: 'Newcomer',   min: 0,    badge: null },
  { name: 'Active',     min: 100,  badge: 'active' },
  { name: 'Builder',    min: 500,  badge: 'builder' },
  { name: 'Advocate',   min: 2000, badge: 'advocate' },
  { name: 'Ambassador', min: 5000, badge: 'ambassador' },
]

/**
 * Whether a referred wallet has done enough to pay its referrer.
 *
 * Runs on every transaction the referred wallet makes, so it has to be
 * cheap — both fields come off the wallet's own rewards document.
 */
export function isReferralQualified(stats) {
  if (!stats) return false
  return (
    (stats.totalTransactions || 0) >= REFERRAL_QUALIFIES_AT.minTransactions &&
    (stats.activeDays?.length || 0) >= REFERRAL_QUALIFIES_AT.minActiveDays
  )
}

export function levelFor(points) {
  let current = LEVELS[0]
  for (const l of LEVELS) if (points >= l.min) current = l
  return current
}

export function nextLevelFor(points) {
  return LEVELS.find(l => l.min > points) || null
}

export default {
  TX_REWARDS,
  SIGNUP_BONUS,
  REFERRAL_REWARD,
  REFERRAL_QUALIFIES_AT,
  AFFILIATE_BONUS,
  AFFILIATE_BONUS_UNLOCKS_AT,
  AFFILIATE_REQUIREMENTS,
  LIMITS,
  LEVELS,
  isReferralQualified,
  levelFor,
  nextLevelFor,
}