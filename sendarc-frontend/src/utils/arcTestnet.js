// Paragon Finance — Arc Network + Circle App Kit CCTP Integration
// Cross-chain transfers powered by Circle's official App Kit SDK

// ─────────────────────────────────────────────────────────────────────────
// ParagonFinance contract suite (PaymentRouter, BridgeRouter, FeeManager,
// Treasury, BridgeRegistry) — replaces the old two-step SendArcRouter.
//
// Selectors below were computed locally with a from-scratch Keccak-256
// implementation and cross-checked against the four selectors that were
// already hard-coded elsewhere in this file (transfer(address,uint256) =
// a9059cbb, balanceOf(address) = 70a08231, decimals() = 313ce567,
// recordTransfer(address,uint256) = 73ac83ef) — all four matched exactly
// before these new ones were trusted.
// ─────────────────────────────────────────────────────────────────────────
export const PARAGON_FINANCE_PAYMENT_ROUTER = {
  address: import.meta.env.VITE_PAYMENT_ROUTER_ADDRESS || null,
  // sendPayment(address)
  sendPaymentSelector: '8a7644a8',
}

export const BRIDGE_ROUTER = {
  address: import.meta.env.VITE_BRIDGE_ROUTER_ADDRESS || null,
  // recordBridgeFee(uint256,string)
  recordBridgeFeeSelector: '292c5e39',
}

export const FEE_MANAGER_ADDRESS = import.meta.env.VITE_FEE_MANAGER_ADDRESS || null
export const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS || null
export const BRIDGE_REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS || null

// FeeManager.calculateBridgeFee(uint256) — used by getBridgeFeeQuote() below
const CALCULATE_BRIDGE_FEE_SELECTOR = 'ade1af12'

// Deprecated — kept ONLY so old transaction history / explorer links still
// resolve to something. The frontend no longer routes new Sends through
// this contract; sendUsdcOnChain() below now prefers PAYMENT_ROUTER.
export const SENDARC_ROUTER = {
  address: import.meta.env.VITE_ROUTER_ADDRESS || null,
  // recordTransfer(address,uint256) — verified via `cast sig`
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
  // Confirmed via https://docs.arc.io/arc/references/contract-addresses
  cctpDomain: 26,
  eurcAddress: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
  eurcDecimals: 6,
  // Verified via developers.circle.com/assets/cirbtc-contract-addresses
  // and circlefin/arc-defi-lend-borrow on GitHub — same address both places.
  cirbtcAddress: '0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF',
}

// USDC addresses verified against developers.circle.com/stablecoins/usdc-contract-addresses
// Chain IDs/RPCs verified against chainlist.org and each chain's own docs.
export const EVM_CHAINS = {
  arc: {
    id: 5042002,
    chainIdHex: '0x4CEF52',
    name: 'Arc Testnet',
    appKitChain: 'Arc_Testnet',
    symbol: 'ARC',
    rpcUrl: 'https://rpc.testnet.arc.network',
    explorerUrl: 'https://testnet.arcscan.app',
    usdcAddress: '0x3600000000000000000000000000000000000000',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '⬡',
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
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '⟠',
    color: '#627EEA',
    live: true,
    useCCTP: true,
    note: 'CCTP Bridge via Circle App Kit',
  },
  base: {
    id: 84532,
    chainIdHex: '0x14A34',
    name: 'Base Sepolia',
    appKitChain: 'Base_Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '🔵',
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
    explorerUrl: 'https://sepolia.arbiscan.io',
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '🔷',
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
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '🔴',
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
    explorerUrl: 'https://testnet.snowtrace.io',
    usdcAddress: '0x5425890298aed601595a70AB815c96711a31Bc65',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '🔺',
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
    explorerUrl: 'https://sepolia.lineascan.build',
    usdcAddress: '0xFEce4462D57bD51A6A552365A011b95f0E16d9B7',
    nativeCurrency: { name: 'Linea Ether', symbol: 'ETH', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '🌀',
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
    explorerUrl: 'https://amoy.polygonscan.com',
    usdcAddress: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '🟣',
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
    explorerUrl: 'https://testnet.sonicscan.org',
    usdcAddress: '0x0BA304580ee7c9a980CF72e55f5Ed2E9fd30Bc51',
    nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '💨',
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
    explorerUrl: 'https://sepolia.uniscan.xyz',
    usdcAddress: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    faucetUrl: 'https://faucet.circle.com',
    icon: '🦄',
    color: '#FF37C7',
    live: true,
    useCCTP: true,
    note: 'CCTP Bridge via Circle App Kit',
  },
}

export async function switchToChain(chainKey) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  const chain = EVM_CHAINS[chainKey]
  if (!chain) throw new Error('Unknown chain: ' + chainKey)
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{ chainId: chain.chainIdHex, chainName: chain.name, nativeCurrency: chain.nativeCurrency, rpcUrls: [chain.rpcUrl], blockExplorerUrls: [chain.explorerUrl] }],
    })
  } catch (addErr) {
    if (addErr.code === 4001) throw new Error('User rejected adding the network.')
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chain.chainIdHex }] })
    } catch (switchErr) {
      if (switchErr.code === 4001) throw new Error('User rejected the network switch.')
      throw switchErr
    }
  }
}

// Plain JSON-RPC POST to a chain's own public endpoint — deliberately NOT
// routed through window.ethereum. MetaMask's eth_call/eth_getBalance always
// query whichever network the wallet is CURRENTLY connected to, regardless
// of the `to` address you pass in — so asking for Ethereum Sepolia's USDC
// balance while the wallet is sitting on Arc silently queries Arc instead
// and returns 0. Hitting each chain's real RPC directly sidesteps that
// entirely: balance reads are correct no matter what network is active.
// Plain JSON-RPC POST to a chain's own public endpoint, with retries — public
// endpoints (sepolia.org etc.) are shared/free and occasionally flaky or
// rate-limited, so a single failed attempt shouldn't read as "zero balance."
async function rpcRequest(rpcUrl, method, params, attempts = 3) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message || 'RPC error')
      return json.result
    } catch (err) {
      lastErr = err
      if (i < attempts - 1) await new Promise(r => setTimeout(r, 400 * (i + 1)))
    }
  }
  throw lastErr
}

// Same request, routed through window.ethereum instead of a public endpoint —
// used only when the wallet is confirmed to already be on the target chain,
// since MetaMask's own RPC connection is generally more reliable than a free
// public one, and going through it avoids the flakiness entirely when we can.
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
      // Wallet call failed even though it's on the right chain (rare) —
      // fall through to the public RPC instead of giving up.
    }
  }
  return rpcRequest(chain.rpcUrl, method, params)
}

export async function getUsdcBalance(chainKey, address) {
  const chain = EVM_CHAINS[chainKey]
  if (!chain) return '0'
  try {
    if (chainKey === 'arc') {
      const raw = await readChain(chain, 'eth_getBalance', [address, 'latest'])
      return (parseInt(raw, 16) / 1e18).toFixed(6)
    } else {
      const paddedAddr = address.slice(2).toLowerCase().padStart(64, '0')
      const result = await readChain(chain, 'eth_call', [{ to: chain.usdcAddress, data: '0x70a08231' + paddedAddr }, 'latest'])
      if (!result || result === '0x') return '0.000000'
      return (parseInt(result, 16) / 1_000_000).toFixed(6)
    }
  } catch {
    // Genuine failure after retries — return null (not '0') so callers can
    // tell "couldn't check" apart from "confirmed empty," instead of both
    // looking identical on screen.
    return null
  }
}

// Generic ERC-20 balanceOf(address) reader — used for EURC and any future
// standard ERC-20 token on Arc (not the native-USDC special case above).
export async function getErc20Balance(tokenAddress, address, decimals = 6) {
  try {
    const paddedAddr = address.slice(2).toLowerCase().padStart(64, '0')
    const result = await readChain(EVM_CHAINS.arc, 'eth_call', [{ to: tokenAddress, data: '0x70a08231' + paddedAddr }, 'latest'])
    if (!result || result === '0x') return '0.000000'
    return (parseInt(result, 16) / Math.pow(10, decimals)).toFixed(6)
  } catch { return null }
}

export function getEurcBalance(address) {
  return getErc20Balance(ARC_TESTNET.eurcAddress, address, ARC_TESTNET.eurcDecimals)
}

// Reads decimals() directly from the token contract instead of assuming a
// value — cirBTC likely follows Bitcoin's 8-decimal convention but that's
// a guess, not a fact, so we verify on-chain and cache the result.
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
// Used for calling PaymentRouter/BridgeRouter/FeeManager directly via
// eth_sendTransaction / eth_call, same hand-rolled-calldata style already
// used elsewhere in this file (e.g. the ERC-20 transfer() calls below),
// extended to cover a dynamic `string` argument for recordBridgeFee().
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
  while (dataHex.length % 64 !== 0) dataHex += '0' // right-pad to a multiple of 32 bytes
  return lengthHex + dataHex
}

// Circle App Kit CCTP bridge — official SDK, handles approve/burn/attest/mint.
// Generalized to any (fromChainKey -> toChainKey) pair, including Arc as a
// source: Circle's own docs demonstrate `from: { chain: "Arc_Testnet" }` in
// the App Kit Circle-Wallets example, so outbound-from-Arc is a genuinely
// supported direction, not just an inbound-to-Arc special case.
export async function bridgeUsdcViaAppKit({ fromChainKey, toChainKey, from, to, amount }, onStatusUpdate = () => {}) {
  const fromChain = EVM_CHAINS[fromChainKey]
  const toChain = EVM_CHAINS[toChainKey]
  if (!fromChain) throw new Error('Unknown source chain: ' + fromChainKey)
  if (!toChain) throw new Error('Unknown destination chain: ' + toChainKey)
  if (fromChainKey === toChainKey) throw new Error('Source and destination can\'t be the same chain.')

  try {
    const { AppKit } = await import('@circle-fin/app-kit')
    const { createViemAdapterFromProvider } = await import('@circle-fin/adapter-viem-v2')

    const kit = new AppKit()
    const start = Date.now()

    kit.on('*', (payload) => {
      const step = payload?.values?.name || payload?.method || ''
      const state = payload?.values?.state || ''
      if (step === 'approve' && state !== 'success') onStatusUpdate('Step 1/3: Approving USDC spend...')
      else if (step === 'approve') onStatusUpdate('Step 1/3: USDC approved ✓')
      else if (step === 'burn' && state !== 'success') onStatusUpdate('Step 2/3: Burning USDC on ' + fromChain.name + '...')
      else if (step === 'burn') onStatusUpdate('Step 2/3: USDC burned ✓')
      else if (step === 'attestation' || step === 'attest') onStatusUpdate('Step 3/3: Circle attestation... (1-3 min)')
      else if (step === 'mint' && state !== 'success') onStatusUpdate('Minting USDC on ' + toChain.name + '...')
      else if (step === 'mint') onStatusUpdate('✓ USDC minted on ' + toChain.name + '!')
    })

    const adapter = await createViemAdapterFromProvider({ provider: window.ethereum })
    onStatusUpdate('Starting Circle CCTP bridge...')

    let result = await kit.bridge({
      from: { adapter, chain: fromChain.appKitChain },
      to: { adapter, chain: toChain.appKitChain },
      amount: parseFloat(amount).toFixed(2),
    })

    if (result.state === 'error') {
      onStatusUpdate('Retrying bridge...')
      result = await kit.retryBridge(result, { from: adapter, to: adapter })
    }

    if (result.state === 'error') throw new Error('Bridge failed: ' + JSON.stringify(result))

    const steps = result.steps || []
    const burnStep = steps.find(s => s.name === 'burn')
    const mintStep = steps.find(s => s.name === 'mint')
    const approveStep = steps.find(s => s.name === 'approve')

    return {
      hash: burnStep?.txHash || burnStep?.data?.txHash || '',
      mintTxHash: mintStep?.txHash || mintStep?.data?.txHash || '',
      approvalHash: approveStep?.txHash || '',
      from,
      to,
      amount: parseFloat(amount),
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
      appKitBridge: true,
      simulated: false,
    }
  } catch (err) {
    if (err.message && err.message.includes('Cannot find module')) {
      throw new Error('Circle App Kit not installed. Run in paragon-frontend: npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2 viem')
    }
    throw err
  }
}

// Backward-compatible wrapper — always bridges INTO Arc. Still used by the
// Send tab's sendUsdcOnChain() below for the historical inbound-only path.
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

// Routes the native Arc send through PaymentRouter.sendPayment() — one
// transaction that atomically splits ParagonFinance's fee to Treasury and
// forwards the remainder to the recipient. Replaces the old two-step
// SendArcRouter.recordTransfer() + separate transfer pattern below: that
// approach existed only because a router couldn't safely take custody of
// native USDC and split it — PaymentRouter can, so it does both in one call.
export async function sendUsdcViaPaymentRouter({ from, to, amount }) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  if (!PARAGON_FINANCE_PAYMENT_ROUTER.address) throw new Error('PaymentRouter not deployed yet')

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
      // 200000 — covers fee-split accounting, the Treasury deposit call,
      // and the payout to the recipient, all inside one transaction.
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

// Deprecated — the old two-step SendArcRouter path. No longer called by
// sendUsdcOnChain() below, kept only for historical reference / in case any
// other file still imports it directly.
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
    params: [{
      from,
      to: SENDARC_ROUTER.address,
      value: '0x0',
      data: recordData,
      gas: '0x186A0', // 100000 — covers cold SSTORE on first writes + event
    }],
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

// Real EURC transfer — EURC is a standard ERC-20 on Arc (not the native gas
// token like USDC), so this calls transfer(address,uint256) directly.
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
  const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : 60000
  const gasPrice = await window.ethereum.request({ method: 'eth_gasPrice' })
  const gasCostRaw = BigInt(gasUsed) * BigInt(parseInt(gasPrice, 16))

  return {
    hash: txHash, from, to,
    token: 'EURC',
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

// Real cirBTC transfer — standard ERC-20, decimals read from the contract
// itself rather than assumed, since that number is never worth guessing.
export async function sendCirbtcOnArc({ from, to, amount }) {
  if (!window.ethereum) throw new Error('MetaMask not found')
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
  const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : 60000
  const gasPrice = await window.ethereum.request({ method: 'eth_gasPrice' })
  const gasCostRaw = BigInt(gasUsed) * BigInt(parseInt(gasPrice, 16))

  return {
    hash: txHash, from, to,
    token: 'cirBTC',
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

export async function sendUsdcOnChain(chainKey, { to, amount }, onStatusUpdate = () => {}) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  const from = accounts[0]
  if (!from) throw new Error('No account connected')

  if (chainKey === 'arc') {
    if (PARAGON_FINANCE_PAYMENT_ROUTER.address) {
      onStatusUpdate('Routing through ParagonFinance PaymentRouter...')
      return sendUsdcViaPaymentRouter({ from, to, amount })
    }
    onStatusUpdate('Sending USDC on Arc Testnet...')
    return sendUsdcNativeArc({ from, to, amount })
  }
  return sendUsdcViaCCTP(chainKey, { from, to, amount }, onStatusUpdate)
}

// ─── Bridge fee capture (BridgeRouter.recordBridgeFee) ─────────────────────
// Circle's CCTP (via bridgeUsdcViaAppKit above) burns/mints USDC straight to
// the user's wallet — it never hands custody to a ParagonFinance contract,
// so there's nothing for an on-chain router to intercept. These two helpers
// let the Bridge tab still capture and record revenue on that volume: quote
// the fee from FeeManager, then pay exactly that amount to BridgeRouter
// alongside the CCTP transfer.
//
// Not wired into bridgeUsdcViaAppKit()/sendUsdcViaCCTP() automatically —
// call getBridgeFeeQuote() + recordBridgeFeeOnArc() from wherever the Bridge
// tab component currently calls bridgeUsdcViaAppKit(), e.g.:
//
//   const { fee } = await getBridgeFeeQuote(amount)
//   await recordBridgeFeeOnArc({ from, bridgeAmount: amount, destinationChain: toChain.name })
//   await bridgeUsdcViaAppKit({ fromChainKey, toChainKey, from, to, amount }, onStatusUpdate)

export async function getBridgeFeeQuote(bridgeAmount) {
  if (!FEE_MANAGER_ADDRESS) throw new Error('FeeManager not deployed yet')
  const rawAmount = BigInt(Math.round(parseFloat(bridgeAmount) * 1e6)) * BigInt(1e12)
  const data = '0x' + CALCULATE_BRIDGE_FEE_SELECTOR + encodeUint256(rawAmount)
  const result = await readChain(EVM_CHAINS.arc, 'eth_call', [{ to: FEE_MANAGER_ADDRESS, data }, 'latest'])
  if (!result || result === '0x') return { fee: 0n, netAmount: rawAmount }
  const feeHex = result.slice(2, 66)
  const netHex = result.slice(66, 130)
  return { fee: BigInt('0x' + feeHex), netAmount: BigInt('0x' + netHex) }
}

export async function recordBridgeFeeOnArc({ from, bridgeAmount, destinationChain }) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  if (!BRIDGE_ROUTER.address) throw new Error('BridgeRouter not deployed yet')

  const rawBridgeAmount = BigInt(Math.round(parseFloat(bridgeAmount) * 1e6)) * BigInt(1e12)
  const { fee: rawFee } = await getBridgeFeeQuote(bridgeAmount)
  const feeHex = '0x' + rawFee.toString(16)

  // head: [bridgeAmount][offset to string, always 0x40 for a 2-slot head] + tail: [len][utf8 bytes]
  const data = '0x' + BRIDGE_ROUTER.recordBridgeFeeSelector
    + encodeUint256(rawBridgeAmount) + encodeUint256(64)
    + encodeDynamicString(destinationChain)

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: BRIDGE_ROUTER.address, value: feeHex, data, gas: '0x30D40' }],
  })

  const receipt = await waitForReceipt(txHash, 30, 1000)
  if (receipt && receipt.status === '0x0') {
    throw new Error('Bridge fee recording failed.')
  }

  return { hash: txHash, fee: rawFee, receipt }
}

export function shortAddr(addr) { return !addr ? '—' : addr.slice(0, 6) + '...' + addr.slice(-4) }
export function arcScanTx(hash) { return ARC_TESTNET.explorerUrl + '/tx/' + hash }
export function arcScanAddr(addr) { return ARC_TESTNET.explorerUrl + '/address/' + addr }
export function switchToArcTestnet() { return switchToChain('arc') }
export function formatUsdc(raw, decimals = 6) { return (Number(raw) / Math.pow(10, decimals)).toFixed(6) }
export function parseUsdc(amount, decimals = 6) { return BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals))) }
export function formatSettlement(ms) { if (!ms || ms < 0) return '—'; return ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(2) + 's' }
export function addArcTestnetToWallet() { return switchToChain('arc') }