// Solana support for the bridge.
//
// Every EVM bridge uses one adapter built from window.ethereum for both
// sides. Solana can't share it — different signing scheme, different address
// format — so a Solana bridge needs a second adapter from window.solana and
// a second wallet connection. The user connects Phantom alongside MetaMask.

export const SOLANA_DEVNET = {
  key: 'solana',
  appKitChain: 'Solana_Devnet',
  name: 'Solana',
  symbol: 'SOL',
  explorerUrl: 'https://solscan.io',
  rpcUrl: 'https://api.devnet.solana.com',
  faucetUrl: 'https://faucet.circle.com',
  icon: '/dex/phantom.png',
  color: '#14F195',
  isSolana: true,
  live: true,
  useCCTP: true,
  // Not an EVM chain, so no chainIdHex, no wallet_switchEthereumChain, and
  // eth_call-based balance reads don't apply.
  nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
}

export function hasSolanaWallet() {
  return typeof window !== 'undefined' && !!window.solana
}

/**
 * Connect a Solana browser wallet.
 *
 * Kept separate from the bridge call on purpose — Circle's docs are explicit
 * that connection and bridging should be distinct user actions, so a pending
 * wallet prompt never overlaps another.
 */
export async function connectSolanaWallet() {
  if (!window.solana) {
    throw new Error(
      'No Solana wallet found. Install Phantom or Solflare to bridge from Solana.'
    )
  }

  const connection = await window.solana.connect()
  const address =
    connection?.publicKey?.toString() ||
    window.solana.publicKey?.toString() ||
    null

  if (!address) throw new Error('Solana wallet connected but returned no address.')
  return address
}

/**
 * Build the App Kit adapter for Solana.
 *
 * Dynamically imported so the Solana SDK isn't in the bundle for users who
 * only ever bridge between EVM chains.
 */
export async function createSolanaAdapter() {
  if (!window.solana) throw new Error('No Solana wallet connected')

  try {
     const { createSolanaAdapterFromProvider } = await import('@circle-fin/adapter-solana')
    return await createSolanaAdapterFromProvider({ provider: window.solana })
  } catch (err) {
    if (err.message?.includes('Cannot find module')) {
      throw new Error(
        'Solana adapter not installed. Run: npm install @circle-fin/adapter-solana'
      )
    }
    throw err
  }
}

/** SPL token balance — eth_call doesn't reach Solana. */
export async function getSolanaUsdcBalance(address) {
  if (!address) return null
  try {
    const res = await fetch(SOLANA_DEVNET.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          address,
          { mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' }, // Devnet USDC
          { encoding: 'jsonParsed' },
        ],
      }),
    })
    const json = await res.json()
    const amount = json?.result?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount
    return amount != null ? Number(amount).toFixed(6) : '0.000000'
  } catch {
    return null
  }
}