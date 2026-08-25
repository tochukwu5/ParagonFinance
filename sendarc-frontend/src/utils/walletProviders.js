// EIP-6963 multi-wallet discovery.
//
// The old model — every extension writing itself to window.ethereum — breaks
// when more than one is installed: they overwrite each other, and whichever
// loaded last wins. That's the source of the "MetaMask encountered an error
// setting the global Ethereum provider" warning in your console.
//
// EIP-6963 replaces the scramble with an announcement protocol. The page asks
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
// true for compatibility and which therefore can't reliably tell them apart.
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

// Resolve a wallet id to its injected provider.
export async function getProviderFor(walletId) {
  const rdns = WALLET_RDNS[walletId]
  if (!rdns) return null

  ensureListening()
  let hit = discovered.get(rdns)
  if (!hit) {
    await discoverProviders()
    hit = discovered.get(rdns)
  }
  if (hit) return hit.provider

  // Fallbacks for wallets that don't announce. Coinbase exposes itself under
  // a dedicated key; the rest we check via legacy flags, accepting that these
  // are less reliable than rdns.
  if (typeof window === 'undefined') return null

  if (walletId === 'coinbase') {
    if (window.coinbaseWalletExtension) return window.coinbaseWalletExtension
    const fromList = window.ethereum?.providers?.find(p => p.isCoinbaseWallet)
    if (fromList) return fromList
    if (window.ethereum?.isCoinbaseWallet) return window.ethereum
  }

  if (walletId === 'rabby') {
    const fromList = window.ethereum?.providers?.find(p => p.isRabby)
    if (fromList) return fromList
    if (window.ethereum?.isRabby) return window.ethereum
  }

  if (walletId === 'metamask') {
    // isMetaMask alone isn't proof — Rabby and others set it too. Prefer a
    // provider that claims MetaMask and NOT the others.
    const fromList = window.ethereum?.providers?.find(p => p.isMetaMask && !p.isRabby && !p.isCoinbaseWallet)
    if (fromList) return fromList
    if (window.ethereum?.isMetaMask) return window.ethereum
  }

  return null
}

export async function isWalletAvailable(walletId) {
  return !!(await getProviderFor(walletId))
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