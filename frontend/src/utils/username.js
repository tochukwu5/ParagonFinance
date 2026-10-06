// @username helpers: lookup, claim (signed), and pay-link building.
//
// The rules here mirror the server's (backend/src/services/usernameService.js).
// They exist so the UI can say "too short" instantly — the server re-checks
// everything and is the only thing that counts.

import { getProviderFor } from './walletProviders'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

export const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

// ─── Input handling ────────────────────────────────────────────────────

// "@Alice " -> "alice"
export function normalizeHandle(raw) {
  return String(raw || '').trim().toLowerCase().replace(/^@/, '')
}

// True when what was typed is meant as a @username rather than an address.
export function looksLikeHandle(raw) {
  return /^@/.test(String(raw || '').trim())
}

export function validateUsernameLocal(raw) {
  const name = normalizeHandle(raw)
  if (!name) return { ok: false, name, reason: null }
  if (name.length < 3) return { ok: false, name, reason: 'At least 3 characters.' }
  if (name.length > 20) return { ok: false, name, reason: '20 characters or fewer.' }
  if (!/^[a-z]/.test(name)) return { ok: false, name, reason: 'Must start with a letter.' }
  if (!USERNAME_RE.test(name)) return { ok: false, name, reason: 'Letters, numbers and underscores only.' }
  return { ok: true, name, reason: null }
}

// ─── API ───────────────────────────────────────────────────────────────

async function getJson(path) {
  const res = await fetch(API_BASE + path)
  const data = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok, data }
}

export async function checkUsername(name) {
  const { data } = await getJson('/username/check/' + encodeURIComponent(name))
  return data // { available, valid, reason }
}

// Returns { username, walletAddress }, or null when no such @name exists.
// Throws only when the server can't be reached, so callers can tell "this
// name doesn't exist" apart from "couldn't check".
export async function resolveUsername(raw) {
  const name = normalizeHandle(raw)
  if (!USERNAME_RE.test(name)) return null
  const { status, ok, data } = await getJson('/username/resolve/' + encodeURIComponent(name))
  if (status === 404) return null
  if (!ok) throw new Error(data?.error || 'Could not look up username')
  return data
}

// { username: string | null, canChangeAt: ISO string | null }
export async function getUsernameForWallet(address) {
  if (!ADDRESS_RE.test(address || '')) return { username: null, canChangeAt: null }
  const { ok, data } = await getJson('/username/wallet/' + address)
  if (!ok) throw new Error(data?.error || 'Could not load your username')
  return data
}

// ─── Claiming (requires a wallet signature) ────────────────────────────

// Must match claimMessage() on the server character for character.
export function claimMessage(username, walletAddress, issuedAt) {
  return (
    'Claim @' + username + ' on Paragon Finance\n' +
    'Wallet: ' + String(walletAddress).toLowerCase() + '\n' +
    'Issued: ' + issuedAt
  )
}

function toHex(str) {
  return '0x' + Array.from(new TextEncoder().encode(str))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Signs with the wallet the user actually connected with — not whichever
// extension won window.ethereum — so Rabby/Bitget/Coinbase sessions prompt
// the right wallet.
async function signWith(walletId, account, message) {
  const provider = (walletId && await getProviderFor(walletId)) || window.ethereum
  if (!provider) throw new Error('No wallet found. Connect your wallet first.')

  try {
    return await provider.request({
      method: 'personal_sign',
      params: [toHex(message), account],
    })
  } catch (err) {
    if (err?.code === 4001) throw new Error('Signature cancelled.')
    throw err
  }
}

// Signing costs no gas and moves no money — it only proves the wallet owner
// asked for this name.
export async function claimUsername({ username, account, walletId }) {
  const name = normalizeHandle(username)
  const issuedAt = Date.now()
  const signature = await signWith(walletId, account, claimMessage(name, account, issuedAt))

  const res = await fetch(API_BASE + '/username/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: name, walletAddress: account, signature, issuedAt }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Could not save username')
  return data // { success, username }
}

// ─── Pay links ─────────────────────────────────────────────────────────

// https://paragonfinance.xyz/pay/alice?amount=5
export function buildPayLink(username, { amount } = {}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const base = origin + '/pay/' + normalizeHandle(username)
  const amt = sanitizeAmount(amount)
  return amt ? base + '?amount=' + amt : base
}

// Digits with up to 6 decimals, and above zero. Anything else is ignored
// rather than passed through — an amount in a URL is untrusted input.
export function sanitizeAmount(raw) {
  const s = String(raw ?? '').trim()
  if (!/^\d{1,9}(\.\d{1,6})?$/.test(s)) return ''
  return parseFloat(s) > 0 ? s : ''
}

// Reads ?to=...&amount=... when the Send tab is opened from a pay link.
// `to` may be an address or a @handle; the Send tab resolves handles itself
// so the name shown on the review screen always comes from the server, never
// from the URL — otherwise a crafted link could show "@ceo" over an
// attacker's address.
export function readPayPrefill(search) {
  try {
    const p = new URLSearchParams(search || '')
    const to = (p.get('to') || '').trim()
    const valid = ADDRESS_RE.test(to) || /^@[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(to)
    if (!valid) return null
    return { to, amount: sanitizeAmount(p.get('amount')) }
  } catch {
    return null
  }
}