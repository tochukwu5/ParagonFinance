// EIP-6963 multi-wallet discovery.
//
// The old model — every extension writing itself to window.ethereum — breaks
// when more than one is installed: they overwrite each other, and whichever
// loaded last wins. That's the source of the "MetaMask encountered an error
// setting the global Ethereum provider" warning you see with two extensions.
//
// EIP-6963 replaces the scramble with an announcement protocol: the page asks
// who's there, each wallet answers with its own provider object, and the dapp
// picks one. window.ethereum stays as a fallback for wallets that haven't
// adopted it.

const discovered = new Map() // rdns -> { info, provider }
let listening = false

function ensureListening() {
  if (listening || typeof window === 'undefined') return
  listening = true

  window.addEventListener('eip6963:announceProvider', (event) => {
    const { info, provider } = event.detail || {}
    if (info?.rdns && provider) discovered.set(info.rdns, { info, provider })
  })

  window.dispatchEvent(new Event('eip6963:requestProvider'))
}

// Wallets are identified by reverse-DNS, which is stable across versions —
// unlike the legacy isMetaMask / isRabby flags, which several wallets set to
// true for compatibility and which therefore cannot reliably tell them apart.
export const WALLET_RDNS = {
  metamask: 'io.metamask',
  rabby: 'io.rabby',
  coinbase: 'com.coinbase.wallet',
}

// Announcements arrive asynchronously, so a caller on first paint may see an
// empty map. A short wait covers extension startup without a visible delay.
export async function discoverProviders(waitMs = 300) {
  ensureListening()
  window.dispatchEvent(new Event('eip6963:requestProvider'))
  await new Promise(r => setTimeout(r, waitMs))
  return Array.from(discovered.values())
}

export function getDiscoveredProviders() {
  ensureListening()
  return Array.from(discovered.values())
}

// True only for a provider that is genuinely MetaMask.
//
// This is the whole crux of the MetaMask/Rabby problem. Rabby sets
// isMetaMask = true so that dapps checking only that flag keep working — a
// reasonable compatibility choice on their part, but it means the flag alone
// proves nothing. A provider is MetaMask when it claims MetaMask AND does not
// carry another wallet's marker.
function looksLikeMetaMask(p) {
  if (!p?.isMetaMask) return false
  if (p.isRabby) return false
  if (p.isCoinbaseWallet) return false
  if (p.isBraveWallet) return false
  if (p.isTrust || p.isTrustWallet) return false
  if (p.isOkxWallet || p.isOKExWallet) return false
  if (p.isPhantom) return false
  if (p.isFrame) return false
  if (p.isTokenPocket) return false
  if (p.isZerion) return false
  return true
}

/**
 * Resolve a wallet id to its injected provider, or null when that wallet
 * isn't installed.
 *
 * Returning null matters as much as returning a provider: it's what lets the
 * UI say "MetaMask is not installed" instead of silently opening whichever
 * other wallet happens to be there.
 */
export async function getProviderFor(walletId) {
  const rdns = WALLET_RDNS[walletId]
  if (!rdns) return null

  ensureListening()

  // EIP-6963 first — it's the only identification that can't be spoofed by a
  // compatibility flag.
  let hit = discovered.get(rdns)
  if (!hit) {
    await discoverProviders()
    hit = discovered.get(rdns)
  }
  if (hit) return hit.provider

  if (typeof window === 'undefined') return null

  // Legacy fallbacks, for wallets that don't announce themselves.
  const list = window.ethereum?.providers

  if (walletId === 'coinbase') {
    if (window.coinbaseWalletExtension) return window.coinbaseWalletExtension
    const fromList = list?.find(p => p.isCoinbaseWallet)
    if (fromList) return fromList
    if (window.ethereum?.isCoinbaseWallet) return window.ethereum
    return null
  }

  if (walletId === 'rabby') {
    const fromList = list?.find(p => p.isRabby)
    if (fromList) return fromList
    if (window.ethereum?.isRabby) return window.ethereum
    return null
  }

  if (walletId === 'metamask') {
    const fromList = list?.find(looksLikeMetaMask)
    if (fromList) return fromList
    // Same strict test on the global. The previous version fell back to a
    // bare isMetaMask check here, which handed back Rabby whenever Rabby was
    // the only wallet installed — undoing the guard on the line above.
    if (looksLikeMetaMask(window.ethereum)) return window.ethereum
    return null
  }

  return null
}

export async function isWalletAvailable(walletId) {
  return !!(await getProviderFor(walletId))
}

/**
 * Which of the supported wallets are actually installed.
 * Lets the connect screen show real state rather than offering every wallet
 * and only failing once someone clicks.
 */
export async function detectAvailableWallets() {
  ensureListening()
  await discoverProviders()

  const ids = Object.keys(WALLET_RDNS)
  const entries = await Promise.all(
    ids.map(async id => [id, !!(await getProviderFor(id))])
  )
  return Object.fromEntries(entries)
}

export const WALLET_INSTALL_URLS = {
  metamask: 'https://metamask.io/download/',
  rabby: 'https://rabby.io/',
  coinbase: 'https://www.coinbase.com/wallet/downloads',
}

export const WALLET_LABELS = {
  metamask: 'MetaMask',
  rabby: 'Rabby Wallet',
  coinbase: 'Coinbase Wallet',
}