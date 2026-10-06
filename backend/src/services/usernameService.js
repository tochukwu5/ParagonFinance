import { verifyMessage } from 'ethers'

// ─── Rules ─────────────────────────────────────────────────────────────

export const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/
export const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

// How long a signed claim stays valid. A signature is proof the wallet owner
// agreed to claim THIS name at THIS moment — without an expiry, anyone who
// ever saw one could replay it later.
export const CLAIM_MAX_AGE_MS = 10 * 60 * 1000

// Minimum gap between changes to the same wallet's name. Stops someone
// collecting payments under one name and swapping it the next minute, and
// stops name-hopping to squat several handles.
export const RENAME_COOLDOWN_MS = 24 * 60 * 60 * 1000

// Names that would read as official, or collide with routes and roles.
// Anyone paying "@support" or "@admin" is almost certainly being phished.
const RESERVED = new Set([
  'admin', 'administrator', 'root', 'support', 'help', 'security', 'staff',
  'team', 'official', 'mod', 'moderator', 'system', 'null', 'undefined',
  'paragon', 'paragonfinance', 'paragon_finance', 'sendarc', 'arc', 'circle',
  'usdc', 'eurc', 'treasury', 'bridge', 'swap', 'send', 'pay', 'app', 'api',
  'dashboard', 'wallet', 'rewards', 'affiliate', 'docs', 'about', 'legal',
  'login', 'connect', 'settings', 'www', 'mail', 'billing', 'airdrop',
])

export function validateUsername(raw) {
  const name = String(raw || '').trim().toLowerCase().replace(/^@/, '')

  if (name.length < 3) return { ok: false, reason: 'Must be at least 3 characters.' }
  if (name.length > 20) return { ok: false, reason: 'Must be 20 characters or fewer.' }
  if (!/^[a-z]/.test(name)) return { ok: false, reason: 'Must start with a letter.' }
  if (!USERNAME_RE.test(name)) {
    return { ok: false, reason: 'Use only letters, numbers and underscores.' }
  }
  if (RESERVED.has(name)) return { ok: false, reason: 'That name is reserved.' }

  return { ok: true, name }
}

// ─── Signed claim ──────────────────────────────────────────────────────

// The message the wallet signs. Built identically in the frontend
// (src/utils/username.js) — if the two ever drift apart, every claim fails
// signature verification. The server rebuilds it from the fields rather
// than accepting a client-supplied string, so the client can't get a
// signature for one thing and present it as consent to another.
export function claimMessage(username, walletAddress, issuedAt) {
  return (
    'Claim @' + username + ' on Paragon Finance\n' +
    'Wallet: ' + String(walletAddress).toLowerCase() + '\n' +
    'Issued: ' + issuedAt
  )
}

export function verifyClaim({ username, walletAddress, signature, issuedAt, now = Date.now() }) {
  if (!ADDRESS_RE.test(walletAddress || '')) {
    return { ok: false, reason: 'Invalid wallet address.' }
  }
  if (typeof signature !== 'string' || !/^0x[a-fA-F0-9]{130}$/.test(signature)) {
    return { ok: false, reason: 'Missing or malformed signature.' }
  }

  const issued = Number(issuedAt)
  if (!Number.isFinite(issued)) return { ok: false, reason: 'Invalid timestamp.' }
  // Reject both stale claims and ones dated in the future.
  if (now - issued > CLAIM_MAX_AGE_MS) {
    return { ok: false, reason: 'Signature expired. Please try again.' }
  }
  if (issued - now > 60 * 1000) {
    return { ok: false, reason: 'Invalid timestamp.' }
  }

  let recovered
  try {
    recovered = verifyMessage(claimMessage(username, walletAddress, issued), signature)
  } catch {
    return { ok: false, reason: 'Signature could not be verified.' }
  }

  if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
    return { ok: false, reason: 'Signature does not match this wallet.' }
  }
  return { ok: true }
}