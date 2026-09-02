// Paragon Finance — Arc Network + Circle App Kit CCTP Integration
// Cross-chain transfers powered by Circle's official App Kit SDK
// ─────────────────────────────────────────────────────────────────────────
// ParagonFinance contract suite. The constant names below are for code
// readability only — what arcscan displays for an address comes entirely
// from which Solidity source that address was verified against on-chain.
// ─────────────────────────────────────────────────────────────────────────
export const PARAGON_FINANCE_PAYMENT_ROUTER = {
  address: import.meta.env.VITE_PAYMENT_ROUTER_ADDRESS || null,
  // sendPayment(address)
  sendPaymentSelector: '8a7644a8',
}

export const PARAGON_FINANCE_BRIDGE_ROUTER = {
  address: import.meta.env.VITE_BRIDGE_ROUTER_ADDRESS || null,
  // recordBridgeFee(uint256,string)
  recordBridgeFeeSelector: '292c5e39',
}

export const PARAGON_FINANCE_FEE_MANAGER_ADDRESS = import.meta.env.VITE_FEE_MANAGER_ADDRESS || null
export const PARAGON_FINANCE_TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS || null
export const PARAGON_FINANCE_BRIDGE_REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS || null

// Aliases kept in case another file imports the older names.
export const BRIDGE_ROUTER = PARAGON_FINANCE_BRIDGE_ROUTER
export const FEE_MANAGER_ADDRESS = PARAGON_FINANCE_FEE_MANAGER_ADDRESS
export const TREASURY_ADDRESS = PARAGON_FINANCE_TREASURY_ADDRESS
export const BRIDGE_REGISTRY_ADDRESS = PARAGON_FINANCE_BRIDGE_REGISTRY_ADDRESS

const CALCULATE_BRIDGE_FEE_SELECTOR = 'ade1af12'

// Deprecated — kept only so old explorer links still resolve.
export const SENDARC_ROUTER = {
  address: import.meta.env.VITE_ROUTER_ADDRESS || null,
  recordSelector: '73ac83ef',
}

export const ARC_TESTNET = {
  id: 5042002,
  name: 'Arc Testnet',
  rpcUrl: 'https://rpc.testnet.arc.network',
  explorerUrl: 'https://testnet.arcscan.app',
  faucetUrl: 'https://faucet.circle.com',
  usdcAddress: '0x3600000000000000000000000000000000000000',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  cctpDomain: 26,
  eurcAddress: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
  eurcDecimals: 6,
  cirbtcAddress: '0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF',
}

// Each chain carries a LIST of RPC endpoints, not one.
//
// Balance reads for the bridge DESTINATION can never go through the wallet
// — the wallet is on the source chain by definition — so they always hit a
// public endpoint. Several of the "official" testnet endpoints (rpc.sepolia.org
// especially) are shared and aggressively rate-limited, and a single failed
// read is what made a funded chain display 0.000000 the moment it became the
// destination. Ordering here puts the more reliable provider first.
export const EVM_CHAINS = {
  arc: {
    id: 5042002,
    chainIdHex: '0x4CEF52',
    name: 'Arc Testnet',
    appKitChain: 'Arc_Testnet',
    symbol: 'ARC',
    rpcUrl: 'https://rpc.testnet.arc.network',
    rpcUrls: ['https://rpc.testnet.arc.network'],
    explorerUrl: 'https://testnet.arcscan.app',
    usdcAddress: '0x3600000000000000000000000000000000000000',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '/arc.svg',
    color: '#00D4FF',
    live: true,
    useCCTP: false,
    note: 'Native Arc — direct on-chain transfer',
  },
  ethereum: {
    id: 11155111,
    chainIdHex: '0xAA36A7',
    name: 'Ethereum Sepolia',
    appKitChain: 'Ethereum_Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    rpcUrls: [
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://sepolia.drpc.org',
      'https://rpc.sepolia.org',
    ],
    explorerUrl: 'https://sepolia.etherscan.io',
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: "/ethlogo.svg",
    color: '#627EEA',
    live: true,
    useCCTP: true,
    note: 'CCTP Bridge via Circle App Kit',
  },
    solana: {
    id: null,
    chainIdHex: null,
    name: 'Solana',
    appKitChain: 'Solana_Devnet',
    symbol: 'SOL',
    rpcUrl: 'https://api.devnet.solana.com',
    rpcUrls: ['https://api.devnet.solana.com'],
    explorerUrl: 'https://solscan.io',
    usdcAddress: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '/dex/phantom.png',
    color: '#14F195',
    live: true,
    useCCTP: true,
    // Not EVM. wallet_switchEthereumChain, eth_call and eth_getBalance all
    // fail here, so every code path that assumes them needs this guard.
    isSolana: true,
    note: 'CCTP Bridge · needs a Solana wallet',
  },
  base: {
    id: 84532,
    chainIdHex: '0x14A34',
    name: 'Base Sepolia',
    appKitChain: 'Base_Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia.base.org',
    rpcUrls: [
      'https://sepolia.base.org',
      'https://base-sepolia-rpc.publicnode.com',
    ],
    explorerUrl: 'https://sepolia.basescan.org',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '/base.svg',
    color: '#0052FF',
    live: true,
    useCCTP: true,
    note: 'CCTP Bridge via Circle App Kit',
  },
  arbitrum: {
    id: 421614,
    chainIdHex: '0x66EEE',
    name: 'Arbitrum Sepolia',
    appKitChain: 'Arbitrum_Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    rpcUrls: [
      'https://sepolia-rollup.arbitrum.io/rpc',
      'https://arbitrum-sepolia-rpc.publicnode.com',
    ],
    explorerUrl: 'https://sepolia.arbiscan.io',
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '/arbitrum.svg',
    color: '#28A0F0',
    live: true,
    useCCTP: true,
    note: 'CCTP Bridge via Circle App Kit',
  },
  optimism: {
    id: 11155420,
    chainIdHex: '0xAA37DC',
    name: 'Optimism Sepolia',
    appKitChain: 'Optimism_Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia.optimism.io',
    rpcUrls: [
      'https://sepolia.optimism.io',
      'https://optimism-sepolia-rpc.publicnode.com',
    ],
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '/optimism.svg',
    color: '#FF0420',
    live: true,
    useCCTP: true,
    note: 'CCTP Bridge via Circle App Kit',
  },
  avalanche: {
    id: 43113,
    chainIdHex: '0xA869',
    name: 'Avalanche Fuji',
    appKitChain: 'Avalanche_Fuji',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    rpcUrls: [
      'https://api.avax-test.network/ext/bc/C/rpc',
      'https://avalanche-fuji-c-chain-rpc.publicnode.com',
    ],
    explorerUrl: 'https://testnet.snowtrace.io',
    usdcAddress: '0x5425890298aed601595a70AB815c96711a31Bc65',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '/avalanche.svg',
    color: '#E84142',
    live: true,
    useCCTP: true,
    note: 'CCTP Bridge via Circle App Kit',
  },
  linea: {
    id: 59141,
    chainIdHex: '0xE705',
    name: 'Linea Sepolia',
    appKitChain: 'Linea_Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://rpc.sepolia.linea.build',
    rpcUrls: ['https://rpc.sepolia.linea.build'],
    explorerUrl: 'https://sepolia.lineascan.build',
    usdcAddress: '0xFEce4462D57bD51A6A552365A011b95f0E16d9B7',
    nativeCurrency: { name: 'Linea Ether', symbol: 'ETH', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '/linea.svg',
    color: '#61DFFF',
    live: true,
    useCCTP: true,
    note: 'CCTP Bridge via Circle App Kit',
  },
  polygon: {
    id: 80002,
    chainIdHex: '0x13882',
    name: 'Polygon Amoy',
    appKitChain: 'Polygon_Amoy_Testnet',
    symbol: 'POL',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    rpcUrls: [
      'https://rpc-amoy.polygon.technology',
      'https://polygon-amoy-bor-rpc.publicnode.com',
    ],
    explorerUrl: 'https://amoy.polygonscan.com',
    usdcAddress: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '/polygon.svg',
    color: '#8247E5',
    live: true,
    useCCTP: true,
    note: 'CCTP Bridge via Circle App Kit',
  },
  sonic: {
    id: 14601,
    chainIdHex: '0x3909',
    name: 'Sonic Testnet',
    appKitChain: 'Sonic_Testnet',
    symbol: 'S',
    rpcUrl: 'https://rpc.testnet.soniclabs.com',
    rpcUrls: ['https://rpc.testnet.soniclabs.com'],
    explorerUrl: 'https://testnet.sonicscan.org',
    usdcAddress: '0x0BA304580ee7c9a980CF72e55f5Ed2E9fd30Bc51',
    nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '/sonic.svg',
    color: '#00D2FF',
    live: true,
    useCCTP: true,
    note: 'CCTP Bridge via Circle App Kit',
  },
  unichain: {
    id: 1301,
    chainIdHex: '0x515',
    name: 'Unichain Sepolia',
    appKitChain: 'Unichain_Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia.unichain.org',
    rpcUrls: ['https://sepolia.unichain.org'],
    explorerUrl: 'https://sepolia.uniscan.xyz',
    usdcAddress: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '/unichain.svg',
    color: '#FF37C7',
    live: true,
    useCCTP: true,
    note: 'CCTP Bridge via Circle App Kit',
  },
}

// Accepts an explicit provider so a Rabby or Coinbase session prompts the
// wallet the user actually connected with. Falling back to window.ethereum
// meant the connect prompt came from one extension and the network prompt
// from whichever won the global — the source of "Unrecognized chain ID"
// when the two disagreed about what had been added.
export async function switchToChain(chainKey, provider) {
  const eth = provider || (typeof window !== 'undefined' ? window.ethereum : null)
  if (!eth) throw new Error('No wallet found. Please install MetaMask, Rabby, or Coinbase Wallet.')

  const chain = EVM_CHAINS[chainKey]
  if (!chain) throw new Error('Unknown chain: ' + chainKey)

  // Switch FIRST. The old order tried wallet_addEthereumChain every time,
  // which re-prompts to add a chain the wallet already has — and if the user
  // declines that redundant prompt, the catch fired before the switch was
  // ever attempted. Switching first means an already-added chain needs no
  // prompt at all, and 4902 (unrecognised chain) tells us when to add.
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chain.chainIdHex }],
    })
    return
  } catch (switchErr) {
    if (switchErr.code === 4001) {
      throw new Error('Network switch rejected. Approve the prompt in your wallet to continue.')
    }
    // 4902 = chain not added. Some wallets nest it, some report -32603 with
    // the same meaning, so we fall through to add on anything that isn't an
    // outright rejection.
    const notAdded =
      switchErr.code === 4902 ||
      switchErr.code === -32603 ||
      switchErr.data?.originalError?.code === 4902 ||
      /unrecognized chain|not.*added|unknown chain/i.test(switchErr.message || '')

    if (!notAdded) throw switchErr
  }

  try {
    await eth.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: chain.chainIdHex,
        chainName: chain.name,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: chain.rpcUrls || [chain.rpcUrl],
        blockExplorerUrls: [chain.explorerUrl],
      }],
    })
  } catch (addErr) {
    if (addErr.code === 4001) {
      throw new Error('Adding ' + chain.name + ' was rejected. Approve it in your wallet to continue.')
    }
    // A stale entry for the same RPC under a different chain ID blocks the
    // add. The wallet's own message names a chain ID the user has never
    // heard of, so translate it into something actionable.
    if (/same rpc|already exist|duplicate/i.test(addErr.message || '')) {
      throw new Error(
        'Your wallet already has a network using this RPC under a different chain ID. ' +
        'Open your wallet settings, delete the existing "Arc" network, then try again.'
      )
    }
    throw addErr
  }

  // Adding does not always switch — several wallets add silently and stay
  // put. Verify, and switch again if needed.
  try {
    const current = await eth.request({ method: 'eth_chainId' })
    if (current?.toLowerCase() !== chain.chainIdHex.toLowerCase()) {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chain.chainIdHex }],
      })
    }
  } catch (err) {
    if (err.code === 4001) {
      throw new Error('Network switch rejected. Approve the prompt in your wallet to continue.')
    }
    throw err
  }
}

// Tries every endpoint for a chain, with retries per endpoint, before giving
// up. One dead or rate-limited provider no longer reads as "zero balance."
async function rpcRequest(rpcUrls, method, params, attemptsPerUrl = 2) {
  const urls = Array.isArray(rpcUrls) ? rpcUrls : [rpcUrls]
  let lastErr

  for (const url of urls) {
    for (let i = 0; i < attemptsPerUrl; i++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        })
        const json = await res.json()
        if (json.error) throw new Error(json.error.message || 'RPC error')
        return json.result
      } catch (err) {
        lastErr = err
        if (i < attemptsPerUrl - 1) await new Promise(r => setTimeout(r, 300 * (i + 1)))
      }
    }
  }
  throw lastErr
}

async function walletChainMatches(chainIdHex) {
  if (!window.ethereum) return false
  try {
    const current = await window.ethereum.request({ method: 'eth_chainId' })
    return current?.toLowerCase() === chainIdHex.toLowerCase()
  } catch { return false }
}

async function readChain(chain, method, params) {
  if (await walletChainMatches(chain.chainIdHex)) {
    try {
      return await window.ethereum.request({ method, params })
    } catch {
      // On the right chain but the wallet call failed — fall through.
    }
  }
  return rpcRequest(chain.rpcUrls || [chain.rpcUrl], method, params)
}

// Returns a decimal string on success, or null when the balance genuinely
// couldn't be read. Callers must distinguish the two — rendering null as
// "0.000000" is what made a funded destination chain look empty.
export async function getUsdcBalance(chainKey, address) {
  const chain = EVM_CHAINS[chainKey]
  if (!chain || !address) return null
  try {
    if (chainKey === 'arc') {
      const raw = await readChain(chain, 'eth_getBalance', [address, 'latest'])
      if (!raw) return null
      return (Number(BigInt(raw)) / 1e18).toFixed(6)
    }
    const paddedAddr = address.slice(2).toLowerCase().padStart(64, '0')
    const result = await readChain(chain, 'eth_call', [{ to: chain.usdcAddress, data: '0x70a08231' + paddedAddr }, 'latest'])
    if (!result || result === '0x') return '0.000000'
    return (Number(BigInt(result)) / 1_000_000).toFixed(6)
  } catch (err) {
    console.warn('[balance] ' + chainKey + ' read failed:', err?.message)
    return null
  }
}

export async function getErc20Balance(tokenAddress, address, decimals = 6) {
  try {
    const paddedAddr = address.slice(2).toLowerCase().padStart(64, '0')
    const result = await readChain(EVM_CHAINS.arc, 'eth_call', [{ to: tokenAddress, data: '0x70a08231' + paddedAddr }, 'latest'])
    if (!result || result === '0x') return '0.000000'
    return (Number(BigInt(result)) / Math.pow(10, decimals)).toFixed(6)
  } catch { return null }
}

export function getEurcBalance(address) {
  return getErc20Balance(ARC_TESTNET.eurcAddress, address, ARC_TESTNET.eurcDecimals)
}

const decimalsCache = {}
export async function getTokenDecimals(tokenAddress) {
  if (decimalsCache[tokenAddress] !== undefined) return decimalsCache[tokenAddress]
  const result = await readChain(EVM_CHAINS.arc, 'eth_call', [{ to: tokenAddress, data: '0x313ce567' }, 'latest'])
  const decimals = result && result !== '0x' ? parseInt(result, 16) : 18
  decimalsCache[tokenAddress] = decimals
  return decimals
}

export async function getCirbtcBalance(address) {
  const decimals = await getTokenDecimals(ARC_TESTNET.cirbtcAddress)
  return getErc20Balance(ARC_TESTNET.cirbtcAddress, address, decimals)
}

async function waitForReceipt(txHash, maxAttempts = 60, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, delayMs))
    const receipt = await window.ethereum.request({ method: 'eth_getTransactionReceipt', params: [txHash] })
    if (receipt) return receipt
  }
  return null
}

// ─── Minimal ABI-encoding helpers ──────────────────────────────────────────
function encodeUint256(n) {
  return BigInt(n).toString(16).padStart(64, '0')
}

function encodeAddress(addr) {
  return addr.replace('0x', '').toLowerCase().padStart(64, '0')
}

function encodeDynamicString(str) {
  const bytes = new TextEncoder().encode(str)
  const lengthHex = encodeUint256(bytes.length)
  let dataHex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  while (dataHex.length % 64 !== 0) dataHex += '0'
  return lengthHex + dataHex
}

// ─── ParagonFinance bridge fee ─────────────────────────────────────────────
// Collected through App Kit's own customFee parameter rather than as a
// separate transfer. That matters for three reasons:
//
//   1. It's denominated in USDC on the SOURCE chain. The old approach sent
//      `value` on whatever chain the wallet happened to be on, which meant
//      a bridge ending on Sepolia charged 0.25 ETH instead of 0.25 USDC.
//   2. It's atomic with the bridge. Either both happen or neither does —
//      no more "bridge confirmed, fee not collected (retry needed)."
//   3. Arc routes it to the recipient address on-chain, so it's verifiable
//      on the explorer.
//
// Per Arc's docs, Arc retains 10% of any custom fee, so 0.25 collected
// nets ParagonFinance 0.225.
// https://docs.arc.io/app-kit/tutorials/bridge/collect-bridge-fee
export const BRIDGE_FLAT_FEE_USDC = 0.25

// Where the fee lands. Treasury by default; VITE_BRIDGE_FEE_RECIPIENT can
// override it without redeploying anything.
export const BRIDGE_FEE_RECIPIENT =
  import.meta.env.VITE_BRIDGE_FEE_RECIPIENT ||
  PARAGON_FINANCE_TREASURY_ADDRESS ||
  null

  // JSON.stringify throws outright on BigInt values ("Do not know how to
// serialize a BigInt"), and App Kit's result objects are full of them —
// amounts, block numbers, gas figures. That turned every bridge failure into
// a misleading BigInt error thrown from the line meant to REPORT the failure,
// so the actual cause never reached the user.
function safeStringify(value, space) {
  return JSON.stringify(
    value,
    (_key, v) => (typeof v === 'bigint' ? v.toString() : v),
    space
  )
}

// Deep-converts BigInt to Number so a result object can cross any JSON
// boundary — the backend POST in TestnetContext.recordTransaction being the
// one that matters here. Numbers are safe: USDC amounts and testnet block
// heights are far below Number.MAX_SAFE_INTEGER.
function sanitizeBigInts(value) {
  if (typeof value === 'bigint') return Number(value)
  if (Array.isArray(value)) return value.map(sanitizeBigInts)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = sanitizeBigInts(v)
    return out
  }
  return value
}

// Chains where CCTP's mint step is paid in the chain's own native token, so
// bridging INTO them requires a non-zero balance of that token — separate
// from the USDC being bridged. Arc is the exception: gas there is USDC.
const DESTINATION_GAS_TOKEN = {
  ethereum: 'ETH',
  base: 'ETH',
  arbitrum: 'ETH',
  optimism: 'ETH',
  linea: 'ETH',
  unichain: 'ETH',
  avalanche: 'AVAX',
  polygon: 'POL',
  sonic: 'S',
  arc: null, // gas is USDC — nothing extra needed
}

export function destinationGasToken(chainKey) {
  return DESTINATION_GAS_TOKEN[chainKey] ?? null
}

// Native (gas-token) balance on a chain, as a decimal string. Distinct from
// getUsdcBalance — this is what pays for the CCTP mint.
export async function getNativeBalance(chainKey, address) {
  const chain = EVM_CHAINS[chainKey]
  if (!chain || !address) return null
  try {
    const raw = await readChain(chain, 'eth_getBalance', [address, 'latest'])
    if (!raw) return null
    const decimals = chain.nativeCurrency?.decimals ?? 18
    return (Number(BigInt(raw)) / Math.pow(10, decimals)).toFixed(6)
  } catch (err) {
    console.warn('[native balance] ' + chainKey + ' read failed:', err?.message)
    return null
  }
}

// App Kit returns failures as a large result object rather than throwing, so
// a user tapping "reject" arrives as ~4KB of chain metadata with the actual
// reason nested four levels down. Pull out what happened before falling back
// to dumping the whole thing.
function readBridgeError(result) {
  const steps = result?.steps || []
  const failed = steps.find(s => s.state === 'error') || {}
  const msg = failed.errorMessage || ''

  // Walk the nesting App Kit wraps viem's error in.
  const code =
    failed?.error?.cause?.trace?.rawError?.rawError?.cause?.code ??
    failed?.error?.code

  if (code === 4001 || /user (rejected|denied)/i.test(msg)) {
    return 'Rejected in your wallet.'
  }
  if (/insufficient funds/i.test(msg)) {
    return 'Not enough ' + (result?.source?.chain?.nativeCurrency?.symbol || 'gas') +
           ' on ' + (result?.source?.chain?.name || 'the source chain') + ' to cover gas.'
  }
  if (/max fee must be less than amount/i.test(msg)) {
    return 'Amount too small — it must exceed the CCTP transfer fee. Try a larger amount.'
  }
  return null
}

// ─── Bridge via Circle App Kit ─────────────────────────────────────────────
export async function bridgeUsdcViaAppKit(
  { fromChainKey, toChainKey, from, to, amount, feeUsdc, feeRecipient, skipGasCheck = false, useForwarder = true },
  onStatusUpdate = () => {}
) {
  const fromChain = EVM_CHAINS[fromChainKey]
  const toChain = EVM_CHAINS[toChainKey]
  if (!fromChain) throw new Error('Unknown source chain: ' + fromChainKey)
  if (!toChain) throw new Error('Unknown destination chain: ' + toChainKey)
  if (fromChainKey === toChainKey) throw new Error('Source and destination can\'t be the same chain.')

  const fee = feeUsdc !== undefined ? Number(feeUsdc) : BRIDGE_FLAT_FEE_USDC
  const recipient = feeRecipient || BRIDGE_FEE_RECIPIENT
  const collectFee = fee > 0 && !!recipient

  if (fee > 0 && !recipient) {
    console.warn('[bridge] no fee recipient configured (VITE_TREASURY_ADDRESS / VITE_BRIDGE_FEE_RECIPIENT) — bridging without a ParagonFinance fee')
  }

  // The fee is taken OUT of the bridged amount, so to have the recipient
  // receive the full amount they asked for, the fee is added on top of it.
  const netAmount = parseFloat(amount)
  const grossAmount = collectFee ? netAmount + fee : netAmount

  // ── Pre-flight: destination gas ──────────────────────────────────────
  // Runs BEFORE kit.bridge, so a failure here costs nothing. Once the burn
  // fires there is no undo.
  //
  
    const gasToken = destinationGasToken(toChainKey)
  if (gasToken && !skipGasCheck && !useForwarder) {
    onStatusUpdate('Checking ' + gasToken + ' balance on ' + toChain.name + '...')
    const destGas = await getNativeBalance(toChainKey, to || from)
    if (destGas !== null && parseFloat(destGas) === 0) {
      const err = new Error(
        'No ' + gasToken + ' on ' + toChain.name + '. The mint step is paid in ' +
        gasToken + ', not USDC — without it your USDC would burn on ' +
        fromChain.name + ' and never arrive.'
      )
      err.missingGasToken = gasToken
      err.missingGasChain = toChain.name
      err.missingGasChainKey = toChainKey
      err.preflightBlocked = true
      throw err
    }
  }

  try {
    const { AppKit } = await import('@circle-fin/app-kit')
    const { createViemAdapterFromProvider } = await import('@circle-fin/adapter-viem-v2')

    const kit = new AppKit()
    const start = Date.now()

    // Tracked outside the result object so a thrown error can still report
    // the burn hash — that hash is what makes stranded funds recoverable.
    let observedBurnHash = null

    kit.on('*', (payload) => {
      const step = payload?.values?.name || payload?.method || ''
      const state = payload?.values?.state || ''
      const hash = payload?.values?.txHash || payload?.values?.data?.txHash
      if (step === 'burn' && hash) observedBurnHash = hash

      if (step === 'approve' && state !== 'success') onStatusUpdate('Step 1/3: Approving USDC spend...')
      else if (step === 'approve') onStatusUpdate('Step 1/3: USDC approved ✓')
      else if (step === 'burn' && state !== 'success') onStatusUpdate('Step 2/3: Burning USDC on ' + fromChain.name + '...')
      else if (step === 'burn') onStatusUpdate('Step 2/3: USDC burned ✓')
      else if (step === 'attestation' || step === 'attest') onStatusUpdate('Step 3/3: Circle attestation... (1-3 min)')
      else if (step === 'mint' && state !== 'success') onStatusUpdate('Minting USDC on ' + toChain.name + '...')
      else if (step === 'mint') onStatusUpdate('✓ USDC minted on ' + toChain.name + '!')
    })

        // One adapter per side. They're the same object for EVM-to-EVM, but a
    // Solana leg needs its own — different signing scheme entirely.
    const evmAdapter = await createViemAdapterFromProvider({ provider: window.ethereum })

    let fromAdapter = evmAdapter
    let toAdapter = evmAdapter

    if (fromChainKey === 'solana' || toChainKey === 'solana') {
      const { createSolanaAdapter } = await import('./solanaBridge')
      const solanaAdapter = await createSolanaAdapter()
      if (fromChainKey === 'solana') fromAdapter = solanaAdapter
      if (toChainKey === 'solana') toAdapter = solanaAdapter
    }
    onStatusUpdate('Starting Circle CCTP bridge...')

         const bridgeParams = {
      from: { adapter: fromAdapter, chain: fromChain.appKitChain },
      to: {
        adapter: toAdapter,
        chain: toChain.appKitChain,
        // Circle fetches the attestation and submits the mint. Costs a
        // forwarding fee taken from the transfer, which is a far better
        // trade than telling someone to go acquire POL first.
        useForwarder,
      },
      amount: grossAmount.toFixed(2),
    }

    if (collectFee) {
      bridgeParams.config = {
        customFee: {
          value: fee.toFixed(2),
          recipientAddress: recipient,
        },
      }
    }

    let result = await kit.bridge(bridgeParams)

    if (result.state === 'error') {
      onStatusUpdate('Retrying bridge...')
        result = await kit.retryBridge(result, { from: fromAdapter, to: toAdapter })
    }

    if (result.state === 'error') {
      // safeStringify, not JSON.stringify — App Kit results carry BigInt
      // values, and JSON.stringify throws on those. That meant this very
      // line, whose whole job is to report the failure, threw its own
      // "Do not know how to serialize a BigInt" over the real cause.
      const detail = safeStringify(result)

      const steps = result.steps || []
      const burnStep = steps.find(s => s.name === 'burn')
      const burnHash = burnStep?.txHash || burnStep?.data?.txHash || observedBurnHash

      if (burnHash) {
        // Burn landed, mint didn't. Funds are stranded but recoverable —
        // say so explicitly rather than leaving someone to conclude their
        // money vanished.
        const err = new Error(
          'The burn on ' + fromChain.name + ' completed but the mint on ' + toChain.name + ' did not. ' +
          'Your USDC is NOT lost — Circle holds a signed attestation authorising the mint, and it does not expire. ' +
          (gasToken
            ? 'The mint is paid in ' + gasToken + ' on ' + toChain.name + ': fund the wallet with ' + gasToken + ', then run this same bridge again to complete it. '
            : 'Retry this same bridge to complete it. ') +
          'Burn tx: ' + burnHash
        )
        err.recoverable = true
        err.burnHash = burnHash
        err.sourceChainKey = fromChainKey
        err.destinationChainKey = toChainKey
        err.pendingAmount = grossAmount
        throw err
      }

      // Nothing burned — no funds moved, so this is a clean failure.
      const readable = readBridgeError(result)
      const err = new Error(
        readable || 'Bridge failed. No USDC left your wallet.'
      )
      err.recoverable = false
      // Full payload kept off the message but available for debugging.
      err.detail = detail
      throw err
    }

    const steps = result.steps || []
    const burnStep = steps.find(s => s.name === 'burn')
    const mintStep = steps.find(s => s.name === 'mint')
    const approveStep = steps.find(s => s.name === 'approve')

    const mintHash = mintStep?.txHash || mintStep?.data?.txHash || ''
    const burnHash = burnStep?.txHash || burnStep?.data?.txHash || observedBurnHash || ''

    // App Kit can report state 'success' while the mint step is still
    // pending attestation. Treating that as confirmed would tell the user
    // funds arrived when they haven't.
    if (!mintHash && burnHash) {
      const err = new Error(
        'The burn on ' + fromChain.name + ' completed but no mint was recorded on ' + toChain.name + '. ' +
        'Your USDC is held by Circle\'s attestation and is recoverable — retry this bridge to complete the mint. ' +
        'Burn tx: ' + burnHash
      )
      err.recoverable = true
      err.burnHash = burnHash
      throw err
    }

    // sanitizeBigInts so this object survives the JSON.stringify inside
    // recordTransaction's backend POST.
    return sanitizeBigInts({
      hash: burnHash,
      mintTxHash: mintHash,
      approvalHash: approveStep?.txHash || '',
      from,
      to,
      amount: netAmount,
      grossAmount,
      bridgeFeePaid: collectFee ? fee : null,
      bridgeFeeRecipient: collectFee ? recipient : null,
      gasCost: '0',
      gasUsed: 0,
      blockNumber: mintStep?.data?.blockNumber ? Number(mintStep.data.blockNumber) : 0,
      settlementTime: Date.now() - start,
      status: 'confirmed',
      sourceChain: fromChain.name,
      destinationChain: toChain.name,
      sourceChainKey: fromChainKey,
      destinationChainKey: toChainKey,
      network: fromChain.name + ' → ' + toChain.name + ' (CCTP v2)',
      chainId: fromChain.id,
      cctpBridge: true,
      forwarded: useForwarder,
      appKitBridge: true,
      simulated: false,
    })
  } catch (err) {
    if (err.message && err.message.includes('Cannot find module')) {
      throw new Error('Circle App Kit not installed. Run: npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2 viem')
    }
    // Our own errors already carry recoverable / burnHash — pass through
    // untouched so the UI can act on them.
    throw err
  }
}

// Backward-compatible wrapper — always bridges INTO Arc.
export async function sendUsdcViaCCTP(chainKey, { from, to, amount }, onStatusUpdate = () => {}) {
  return bridgeUsdcViaAppKit({ fromChainKey: chainKey, toChainKey: 'arc', from, to, amount }, onStatusUpdate)
}

export async function sendUsdcNativeArc({ from, to, amount }) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  const start = Date.now()
  const rawAmount = BigInt(Math.round(parseFloat(amount) * 1e6)) * BigInt(1e12)
  const amountHex = '0x' + rawAmount.toString(16)

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from, to, value: amountHex, gas: '0x5208' }],
  })

  const receipt = await waitForReceipt(txHash, 30, 1000)
  const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : 21000
  const gasPrice = await window.ethereum.request({ method: 'eth_gasPrice' })
  const gasCostRaw = BigInt(gasUsed) * BigInt(parseInt(gasPrice, 16))

  return {
    hash: txHash, from, to,
    amount: parseFloat(amount),
    gasCost: (Number(gasCostRaw) / 1e18).toFixed(9),
    gasUsed,
    blockNumber: receipt ? parseInt(receipt.blockNumber, 16) : 0,
    settlementTime: Date.now() - start,
    status: 'confirmed',
    sourceChain: 'Arc Testnet',
    destinationChain: 'Arc Testnet',
    sourceChainKey: 'arc',
    destinationChainKey: 'arc',
    network: 'Arc Testnet',
    chainId: ARC_TESTNET.id,
    cctpBridge: false,
    simulated: false,
  }
}

// Routes the native Arc send through ParagonFinancePaymentRouter.sendPayment()
// — one transaction that atomically splits the fee to Treasury and forwards
// the remainder to the recipient.
export async function sendUsdcViaPaymentRouter({ from, to, amount }) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  if (!PARAGON_FINANCE_PAYMENT_ROUTER.address) {
    throw new Error(
      'ParagonFinancePaymentRouter address is not configured (VITE_PAYMENT_ROUTER_ADDRESS is empty). ' +
      'Refusing to send — sending natively instead would bypass the contract entirely and generate no ' +
      'ParagonFinance volume or fee. Check your .env and restart the dev server.'
    )
  }

  const start = Date.now()
  const rawAmount = BigInt(Math.round(parseFloat(amount) * 1e6)) * BigInt(1e12)
  const amountHex = '0x' + rawAmount.toString(16)
  const data = '0x' + PARAGON_FINANCE_PAYMENT_ROUTER.sendPaymentSelector + encodeAddress(to)

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: PARAGON_FINANCE_PAYMENT_ROUTER.address,
      value: amountHex,
      data,
      // 200000 — fee-split accounting, the Treasury deposit, and the payout
      // to the recipient, all inside one transaction.
      gas: '0x30D40',
    }],
  })

  const receipt = await waitForReceipt(txHash, 30, 1000)
  if (receipt && receipt.status === '0x0') {
    throw new Error('Send failed. Check your balance, and that PaymentRouter is not paused.')
  }

  const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : 150000
  const gasPrice = await window.ethereum.request({ method: 'eth_gasPrice' })
  const gasCostRaw = BigInt(gasUsed) * BigInt(parseInt(gasPrice, 16))

  return {
    hash: txHash,
    from, to,
    routerAddress: PARAGON_FINANCE_PAYMENT_ROUTER.address,
    amount: parseFloat(amount),
    gasCost: (Number(gasCostRaw) / 1e18).toFixed(9),
    gasUsed,
    blockNumber: receipt ? parseInt(receipt.blockNumber, 16) : 0,
    settlementTime: Date.now() - start,
    status: 'confirmed',
    sourceChain: 'Arc Testnet',
    destinationChain: 'Arc Testnet',
    sourceChainKey: 'arc',
    destinationChainKey: 'arc',
    network: 'Arc Testnet (via ParagonFinance PaymentRouter)',
    chainId: ARC_TESTNET.id,
    cctpBridge: false,
    routedThroughContract: true,
    simulated: false,
  }
}

// ─── Live gas estimate for the Send form's "NETWORK FEE" row ───────────────
// No path here returns null. Every failure falls through to a real figure
// and logs why, so a "—" in the UI can only mean the caller never invoked
// this — never a silent dead end inside it.
//
// Reference from a confirmed transaction: 146,859 gas at ~21 gwei ≈ 0.00308 USDC.
export async function estimateSendPaymentGasCost({ from, to, amount }) {
  const ROUTER_GAS_BUDGET = 200000n
  const FALLBACK_GAS_PRICE = 21000000000n // 21 gwei — observed on Arc Testnet

  const router = PARAGON_FINANCE_PAYMENT_ROUTER.address

  let gasPrice = null
  try {
    if (window.ethereum) {
      gasPrice = BigInt(await window.ethereum.request({ method: 'eth_gasPrice' }))
    }
  } catch (err) {
    console.warn('[gas estimate] wallet eth_gasPrice failed:', err?.message)
  }

  if (!gasPrice || gasPrice === 0n) {
    try {
      gasPrice = BigInt(await rpcRequest(EVM_CHAINS.arc.rpcUrls, 'eth_gasPrice', []))
    } catch (err) {
      console.warn('[gas estimate] Arc RPC eth_gasPrice failed:', err?.message)
    }
  }

  if (!gasPrice || gasPrice === 0n) {
    console.warn('[gas estimate] no live gasPrice — using 21 gwei fallback')
    gasPrice = FALLBACK_GAS_PRICE
  }

  const priceBudget = () => (Number(ROUTER_GAS_BUDGET * gasPrice) / 1e18).toFixed(6)

  if (!router) {
    console.warn('[gas estimate] VITE_PAYMENT_ROUTER_ADDRESS is not set — check .env and restart the dev server')
    return priceBudget()
  }

  const canSimulate =
    window.ethereum &&
    from &&
    to && to.startsWith('0x') && to.length === 42 &&
    amount && parseFloat(amount) > 0

  if (!canSimulate) return priceBudget()

  try {
    const rawAmount = BigInt(Math.round(parseFloat(amount) * 1e6)) * BigInt(1e12)
    const amountHex = '0x' + rawAmount.toString(16)
    const data = '0x' + PARAGON_FINANCE_PAYMENT_ROUTER.sendPaymentSelector + encodeAddress(to)

    const gasHex = await window.ethereum.request({
      method: 'eth_estimateGas',
      params: [{ from, to: router, value: amountHex, data }],
    })

    // +20% headroom — PaymentRouter branches on whether the fee is zero,
    // and estimateGas can undershoot on conditional paths.
    const costWithBuffer = (BigInt(gasHex) * gasPrice * 120n) / 100n
    return (Number(costWithBuffer) / 1e18).toFixed(6)
  } catch (err) {
    console.warn('[gas estimate] eth_estimateGas reverted, using budget:', err?.message)
    return priceBudget()
  }
}

// Deprecated — the old two-step SendArcRouter path, kept for reference.
export async function sendUsdcViaSendArcRouter({ from, to, amount }) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  if (!SENDARC_ROUTER.address) throw new Error('SendArcRouter not deployed yet')

  const start = Date.now()
  const rawAmount = BigInt(Math.round(parseFloat(amount) * 1e6)) * BigInt(1e12)
  const amountHex = '0x' + rawAmount.toString(16)

  const paddedRecipient = to.replace('0x', '').toLowerCase().padStart(64, '0')
  const paddedAmount = rawAmount.toString(16).padStart(64, '0')
  const recordData = '0x' + SENDARC_ROUTER.recordSelector + paddedRecipient + paddedAmount

  const recordTxHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: SENDARC_ROUTER.address, value: '0x0', data: recordData, gas: '0x186A0' }],
  })

  const recordReceipt = await waitForReceipt(recordTxHash, 30, 1000)
  if (recordReceipt && recordReceipt.status === '0x0') {
    throw new Error('SendArcRouter record failed. Check your wallet is connected to Arc Testnet.')
  }

  const sendTxHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from, to, value: amountHex, gas: '0x5208' }],
  })

  const sendReceipt = await waitForReceipt(sendTxHash, 30, 1000)
  if (sendReceipt && sendReceipt.status === '0x0') {
    throw new Error('USDC transfer failed. Check your balance.')
  }

  const gasUsed = (recordReceipt ? parseInt(recordReceipt.gasUsed, 16) : 0)
                + (sendReceipt ? parseInt(sendReceipt.gasUsed, 16) : 21000)
  const gasPrice = await window.ethereum.request({ method: 'eth_gasPrice' })
  const gasCostRaw = BigInt(gasUsed) * BigInt(parseInt(gasPrice, 16))

  return {
    hash: recordTxHash,
    transferTxHash: sendTxHash,
    from, to,
    routerAddress: SENDARC_ROUTER.address,
    amount: parseFloat(amount),
    gasCost: (Number(gasCostRaw) / 1e18).toFixed(9),
    gasUsed,
    blockNumber: sendReceipt ? parseInt(sendReceipt.blockNumber, 16) : 0,
    settlementTime: Date.now() - start,
    status: 'confirmed',
    sourceChain: 'Arc Testnet',
    destinationChain: 'Arc Testnet',
    sourceChainKey: 'arc',
    destinationChainKey: 'arc',
    network: 'Arc Testnet (via SendArcRouter)',
    chainId: ARC_TESTNET.id,
    cctpBridge: false,
    routedThroughContract: true,
    simulated: false,
  }
}

// ─── ERC-20 send fee ──────────────────────────────────────────────────────
// EURC and cirBTC are ERC-20s, so a transfer() call never touches
// ParagonFinancePaymentRouter and it can't take a cut the way it does with
// native USDC.
//
// The fee is therefore a second transaction paid in native USDC through
// collectSwapFee(). That function takes a flat amount, so the percentage is
// computed here and sent as a fixed value — same 0.5% rate as USDC sends,
// just calculated client-side rather than on-chain.
//
// Two consequences worth knowing. Sending EURC requires a small USDC balance
// for the fee. And because the rate is computed off-chain, the contract
// can't enforce it — a modified client could underpay. Neither is fixable
// without transferFrom on the payment router and a redeploy.
const SEND_FEE_BPS = 50 // 0.50%, matching the USDC send fee

// Approximate USD values, only for converting the fee into USDC. Testnet
// tokens have no market, so these come from what the Arc pools trade at.
const FEE_USD_RATE = {
  EURC: 1.08,
  cirBTC: 422000,
}

async function collectTokenSendFee({ from, tokenAddress, amount, symbol }) {
  const router = import.meta.env.VITE_SWAP_ROUTER_ADDRESS
  if (!router) {
    console.warn('[paragon] VITE_SWAP_ROUTER_ADDRESS not set — no fee collected')
    return { hash: null, fee: 0 }
  }

   // 0.5% of the transfer, valued in USDC — matching what native USDC sends
  // charge, so the rate is consistent across tokens.
  const rate = FEE_USD_RATE[symbol] || 1
  const pct = parseFloat(amount) * rate * (SEND_FEE_BPS / 10000)

  // collectSwapFee enforces a 0.1 USDC minimum on-chain, so a percentage
  // below that reverts with InsufficientValue — which is what was silently
  // failing on small EURC sends. Floor at the contract's minimum rather than
  // sending something it will reject.
  //
  // Crossover is ~18.5 EURC. Below that the floor applies and the effective
  // rate is higher; above it, a straight 0.5%.
  const MIN_FEE_USDC = 0.1
  const feeUsdc = Math.max(pct, MIN_FEE_USDC)

  const feeRaw = BigInt(Math.round(feeUsdc * 1e18))

  try {
    // collectSwapFee(address) = fe7edecc
    const padded = String(tokenAddress || '')
      .replace(/^0x/, '').toLowerCase().padStart(64, '0')

    const hash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to: router,
        data: '0xfe7edecc' + padded,
        value: '0x' + feeRaw.toString(16),
        gas: '0x186A0',
      }],
    })

    return { hash, fee: feeUsdc }
  } catch (err) {
    // The transfer already settled. Throwing here would tell the user their
    // send failed when the recipient already has the tokens.
    console.warn('[paragon] send fee not collected:', err?.message)
    return { hash: null, fee: 0 }
  }
}

// Real EURC transfer — standard ERC-20 on Arc.
export async function sendEurcOnArc({ from, to, amount }) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  const start = Date.now()
  const rawAmount = BigInt(Math.round(parseFloat(amount) * Math.pow(10, ARC_TESTNET.eurcDecimals)))

  const paddedRecipient = to.replace('0x', '').toLowerCase().padStart(64, '0')
  const paddedAmount = rawAmount.toString(16).padStart(64, '0')
  const data = '0xa9059cbb' + paddedRecipient + paddedAmount // transfer(address,uint256)

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: ARC_TESTNET.eurcAddress, value: '0x0', data, gas: '0x186A0' }],
  })

  const receipt = await waitForReceipt(txHash, 30, 1000)
  if (receipt && receipt.status === '0x0') {
    throw new Error('EURC transfer failed. Check your balance.')
  }

    // Fee after the transfer — a reverted transfer should cost nothing.
   const feeResult = await collectTokenSendFee({
    from,
    tokenAddress: ARC_TESTNET.eurcAddress,
    amount,
    symbol: 'EURC',
  })
  const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : 60000
  const gasPrice = await window.ethereum.request({ method: 'eth_gasPrice' })
  const gasCostRaw = BigInt(gasUsed) * BigInt(parseInt(gasPrice, 16))

  return {
    hash: txHash, from, to,
    token: 'EURC',
    feeHash: feeResult.hash,
    paragonFee: feeResult.fee,
    amount: parseFloat(amount),
    gasCost: (Number(gasCostRaw) / 1e18).toFixed(9),
    gasUsed,
    blockNumber: receipt ? parseInt(receipt.blockNumber, 16) : 0,
    settlementTime: Date.now() - start,
    status: 'confirmed',
    sourceChain: 'Arc Testnet',
    destinationChain: 'Arc Testnet',
    sourceChainKey: 'arc',
    destinationChainKey: 'arc',
    network: 'Arc Testnet',
    chainId: ARC_TESTNET.id,
    cctpBridge: false,
    simulated: false,
  }
}

// Real cirBTC transfer — standard ERC-20, decimals read from the contract.
export async function sendCirbtcOnArc({ from, to, amount }) {
  if (!window.ethereum) throw new Error('wallet not found')
  const start = Date.now()
  const decimals = await getTokenDecimals(ARC_TESTNET.cirbtcAddress)
  const rawAmount = BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals)))

  const paddedRecipient = to.replace('0x', '').toLowerCase().padStart(64, '0')
  const paddedAmount = rawAmount.toString(16).padStart(64, '0')
  const data = '0xa9059cbb' + paddedRecipient + paddedAmount // transfer(address,uint256)

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: ARC_TESTNET.cirbtcAddress, value: '0x0', data, gas: '0x186A0' }],
  })

  const receipt = await waitForReceipt(txHash, 30, 1000)
  if (receipt && receipt.status === '0x0') {
    throw new Error('cirBTC transfer failed. Check your balance.')
  }

   const feeResult = await collectTokenSendFee({
    from,
    tokenAddress: ARC_TESTNET.cirbtcAddress,
    amount,
    symbol: 'cirBTC',
  })
  const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : 60000
  const gasPrice = await window.ethereum.request({ method: 'eth_gasPrice' })
  const gasCostRaw = BigInt(gasUsed) * BigInt(parseInt(gasPrice, 16))

  return {
    hash: txHash, from, to,
    token: 'cirBTC',
    feeHash: feeResult.hash,
    paragonFee: feeResult.fee,
    amount: parseFloat(amount),
    gasCost: (Number(gasCostRaw) / 1e18).toFixed(9),
    gasUsed,
    blockNumber: receipt ? parseInt(receipt.blockNumber, 16) : 0,
    settlementTime: Date.now() - start,
    status: 'confirmed',
    sourceChain: 'Arc Testnet',
    destinationChain: 'Arc Testnet',
    sourceChainKey: 'arc',
    destinationChainKey: 'arc',
    network: 'Arc Testnet',
    chainId: ARC_TESTNET.id,
    cctpBridge: false,
    simulated: false,
  }
}

// Every Arc-network Send goes through ParagonFinancePaymentRouter — an unset
// env var throws immediately rather than quietly downgrading to a raw
// wallet-to-wallet transfer that generates no volume or fee.
export async function sendUsdcOnChain(chainKey, { to, amount }, onStatusUpdate = () => {}) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  const from = accounts[0]
  if (!from) throw new Error('No account connected')

  if (chainKey === 'arc') {
    onStatusUpdate('Routing through ParagonFinance PaymentRouter...')
    return sendUsdcViaPaymentRouter({ from, to, amount })
  }
  return sendUsdcViaCCTP(chainKey, { from, to, amount }, onStatusUpdate)
}

// ─── Legacy bridge-fee helpers ─────────────────────────────────────────────
// Superseded by App Kit's customFee (see bridgeUsdcViaAppKit above). Kept so
// nothing that still imports them breaks, but the Bridge tab no longer calls
// either one.
//
// payBridgeFeeToTreasury in particular is the source of an earlier bug worth
// remembering: `value` in eth_sendTransaction is denominated in the ACTIVE
// chain's native token, and CCTP leaves the wallet on the DESTINATION chain,
// so a bridge ending on Sepolia charged 0.25 ETH rather than 0.25 USDC.
export async function getBridgeFeeQuote(bridgeAmount) {
  if (!PARAGON_FINANCE_FEE_MANAGER_ADDRESS) throw new Error('ParagonFinanceFeeManager address is not configured')
  const rawAmount = BigInt(Math.round(parseFloat(bridgeAmount) * 1e6)) * BigInt(1e12)
  const data = '0x' + CALCULATE_BRIDGE_FEE_SELECTOR + encodeUint256(rawAmount)
  const result = await readChain(EVM_CHAINS.arc, 'eth_call', [{ to: PARAGON_FINANCE_FEE_MANAGER_ADDRESS, data }, 'latest'])
  if (!result || result === '0x') return { fee: 0n, netAmount: rawAmount }
  const feeHex = result.slice(2, 66)
  const netHex = result.slice(66, 130)
  return { fee: BigInt('0x' + feeHex), netAmount: BigInt('0x' + netHex) }
}

export async function recordBridgeFeeOnArc({ from, bridgeAmount, destinationChain }) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  if (!PARAGON_FINANCE_BRIDGE_ROUTER.address) throw new Error('ParagonFinanceBridgeRouter address is not configured')

  const rawBridgeAmount = BigInt(Math.round(parseFloat(bridgeAmount) * 1e6)) * BigInt(1e12)
  const { fee: rawFee } = await getBridgeFeeQuote(bridgeAmount)
  const feeHex = '0x' + rawFee.toString(16)

  const data = '0x' + PARAGON_FINANCE_BRIDGE_ROUTER.recordBridgeFeeSelector
    + encodeUint256(rawBridgeAmount) + encodeUint256(64)
    + encodeDynamicString(destinationChain)

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: PARAGON_FINANCE_BRIDGE_ROUTER.address, value: feeHex, data, gas: '0x30D40' }],
  })

  const receipt = await waitForReceipt(txHash, 30, 1000)
  if (receipt && receipt.status === '0x0') throw new Error('Bridge fee recording failed.')

  return { hash: txHash, fee: rawFee, receipt }
}

export async function payBridgeFeeToTreasury({ from }) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  if (!PARAGON_FINANCE_TREASURY_ADDRESS) {
    throw new Error('ParagonFinanceTreasury address is not configured (VITE_TREASURY_ADDRESS is empty)')
  }

  const arcHex = EVM_CHAINS.arc.chainIdHex
  const current = await window.ethereum.request({ method: 'eth_chainId' })
  if (current?.toLowerCase() !== arcHex.toLowerCase()) {
    await switchToChain('arc')
    const after = await window.ethereum.request({ method: 'eth_chainId' })
    if (after?.toLowerCase() !== arcHex.toLowerCase()) {
      throw new Error('Wallet must be on Arc Testnet to pay the ParagonFinance fee.')
    }
  }

  const start = Date.now()
  const rawFee = BigInt(Math.round(BRIDGE_FLAT_FEE_USDC * 1e6)) * BigInt(1e12)
  const feeHex = '0x' + rawFee.toString(16)

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: PARAGON_FINANCE_TREASURY_ADDRESS,
      value: feeHex,
      // 60000 — Treasury's receive() runs an SSTORE plus an event, so the
      // 21000 of a bare EOA transfer isn't enough.
      gas: '0xEA60',
    }],
  })

  const receipt = await waitForReceipt(txHash, 30, 1000)
  if (receipt && receipt.status === '0x0') throw new Error('ParagonFinance fee transaction reverted.')

  return {
    hash: txHash,
    fee: BRIDGE_FLAT_FEE_USDC,
    treasury: PARAGON_FINANCE_TREASURY_ADDRESS,
    settlementTime: Date.now() - start,
    receipt,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────
export function shortAddr(addr) { return !addr ? '--' : addr.slice(0, 6) + '...' + addr.slice(-4) }
export function arcScanTx(hash) { return ARC_TESTNET.explorerUrl + '/tx/' + hash }
export function arcScanAddr(addr) { return ARC_TESTNET.explorerUrl + '/address/' + addr }
export function switchToArcTestnet(provider) { return switchToChain('arc', provider) }
export function formatUsdc(raw, decimals = 6) { return (Number(raw) / Math.pow(10, decimals)).toFixed(6) }
export function parseUsdc(amount, decimals = 6) { return BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals))) }
export function formatSettlement(ms) { if (!ms || ms < 0) return '--'; return ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(2) + 's' }
export function addArcTestnetToWallet(provider) { return switchToChain('arc', provider) }