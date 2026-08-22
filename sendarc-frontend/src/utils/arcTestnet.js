// Paragon Finance — Arc Network + Circle App Kit CCTP Integration
// Cross-chain transfers powered by Circle's official App Kit SDK

// ─────────────────────────────────────────────────────────────────────────
// ParagonFinance contract suite (ParagonFinancePaymentRouter,
// ParagonFinanceBridgeRouter, ParagonFinanceFeeManager,
// ParagonFinanceTreasury, ParagonFinanceBridgeRegistry) — replaces the old
// two-step SendArcRouter.
//
// IMPORTANT: the object/constant names below are for code readability only
// — they have ZERO effect on what the block explorer displays. What arcscan
// shows for a given address comes entirely from which Solidity source that
// address was verified against on-chain. Renaming a JS constant here
// doesn't touch that.
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

// Old, unbranded names — kept as aliases only in case another file in the
// app still imports these directly. Same objects, same addresses.
export const BRIDGE_ROUTER = PARAGON_FINANCE_BRIDGE_ROUTER
export const FEE_MANAGER_ADDRESS = PARAGON_FINANCE_FEE_MANAGER_ADDRESS
export const TREASURY_ADDRESS = PARAGON_FINANCE_TREASURY_ADDRESS
export const BRIDGE_REGISTRY_ADDRESS = PARAGON_FINANCE_BRIDGE_REGISTRY_ADDRESS

// FeeManager.calculateBridgeFee(uint256) — used by getBridgeFeeQuote() below
const CALCULATE_BRIDGE_FEE_SELECTOR = 'ade1af12'

// Deprecated — kept ONLY so old transaction history / explorer links still
// resolve to something. The frontend no longer routes new Sends through this.
export const SENDARC_ROUTER = {
  address: import.meta.env.VITE_ROUTER_ADDRESS || null,
  // recordTransfer(address,uint256)
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

// Plain JSON-RPC POST to a chain's own public endpoint, with retries — public
// endpoints are shared/free and occasionally flaky or rate-limited, so a
// single failed attempt shouldn't read as "zero balance."
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
    // tell "couldn't check" apart from "confirmed empty."
    return null
  }
}

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
  while (dataHex.length % 64 !== 0) dataHex += '0' // right-pad to a multiple of 32 bytes
  return lengthHex + dataHex
}

// Circle App Kit CCTP bridge — official SDK, handles approve/burn/attest/mint.
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
      throw new Error('Circle App Kit not installed. Run: npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2 viem')
    }
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
// — one transaction that atomically splits ParagonFinance's fee to Treasury
// and forwards the remainder to the recipient.
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

// ─── Live gas estimate for the Send form's "NETWORK FEE" row ───────────────
//
// There is deliberately NO path here that returns null. Every failure mode
// falls through to a real figure, and logs why it fell through — so a "—"
// in the UI can only mean the caller never invoked this, never a silent
// dead end inside it.
//
// Layers, in order:
//   1. gasPrice from the wallet
//   2. gasPrice from Arc's public RPC (works even if the wallet is sitting
//      on another network)
//   3. hardcoded 21 gwei — the rate observed on real confirmed Arc
//      transactions
//   Then: eth_estimateGas for the exact call, or PaymentRouter's known
//   200k budget if simulation reverts (which it does constantly while
//   someone is mid-typing an amount above their balance).
//
// Reference from a real confirmed transaction: 146,859 gas at ~21 gwei
// ≈ 0.00308 USDC.
export async function estimateSendPaymentGasCost({ from, to, amount }) {
  const ROUTER_GAS_BUDGET = 200000n
  const FALLBACK_GAS_PRICE = 21000000000n // 21 gwei — observed on Arc Testnet

  const router = PARAGON_FINANCE_PAYMENT_ROUTER.address

  // ── gasPrice: wallet → Arc public RPC → hardcoded ───────────────────
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
      gasPrice = BigInt(await rpcRequest(ARC_TESTNET.rpcUrl, 'eth_gasPrice', []))
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

  // ── Exact simulation, when there's enough filled in to simulate ──────
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
    // Gas cost doesn't scale with transfer size on Arc, so the budget
    // figure is the same number a successful simulation would produce.
    console.warn('[gas estimate] eth_estimateGas reverted, using budget:', err?.message)
    return priceBudget()
  }
}

// Deprecated — the old two-step SendArcRouter path. No longer called by
// sendUsdcOnChain(), kept only for historical reference.
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
      gas: '0x186A0',
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

// Real cirBTC transfer — standard ERC-20, decimals read from the contract.
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

// Every Arc-network Send goes through ParagonFinancePaymentRouter — no
// silent fallback to a raw wallet-to-wallet transfer. An unset env var now
// throws immediately instead of quietly downgrading the Send and generating
// no ParagonFinance volume or fee.
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

// ─── Bridge fee capture (percentage-based, via BridgeRouter) ───────────────
// Circle's CCTP burns/mints USDC straight to the user's wallet — it never
// hands custody to a ParagonFinance contract, so there's nothing for an
// on-chain router to intercept. These helpers let the Bridge tab still
// capture revenue: quote the fee from FeeManager, then pay it to
// BridgeRouter. Currently unused — the flat-fee version below is what's
// actually wired into the Bridge tab.
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

  // head: [bridgeAmount][offset to string, always 0x40 for a 2-slot head]
  // tail: [len][utf8 bytes]
  const data = '0x' + PARAGON_FINANCE_BRIDGE_ROUTER.recordBridgeFeeSelector
    + encodeUint256(rawBridgeAmount) + encodeUint256(64)
    + encodeDynamicString(destinationChain)

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: PARAGON_FINANCE_BRIDGE_ROUTER.address, value: feeHex, data, gas: '0x30D40' }],
  })

  const receipt = await waitForReceipt(txHash, 30, 1000)
  if (receipt && receipt.status === '0x0') {
    throw new Error('Bridge fee recording failed.')
  }

  return { hash: txHash, fee: rawFee, receipt }
}

// ─── Flat bridge fee — what the Bridge tab actually uses ──────────────────
// A flat 0.25 USDC per bridge, paid to Treasury on Arc as a native value
// transfer. Treasury's receive() accepts the deposit and counts it toward
// totalFeesCollected.
export const BRIDGE_FLAT_FEE_USDC = 0.25

// Guarantees the wallet is on Arc Testnet before a value transfer.
//
// This is not optional for the fee: `value` in eth_sendTransaction is always
// denominated in whatever the ACTIVE chain's native token is. USDC is native
// only on Arc — on Ethereum Sepolia the same call spends ETH, on Avalanche
// AVAX, and so on. CCTP leaves the wallet on the bridge's destination chain
// when it finishes, so without this check a bridge to Sepolia would charge
// 0.25 ETH to an address that doesn't hold the Treasury contract at all.
async function ensureWalletOnArc() {
  if (!window.ethereum) throw new Error('MetaMask not found')

  const arcHex = EVM_CHAINS.arc.chainIdHex
  const current = await window.ethereum.request({ method: 'eth_chainId' })
  if (current?.toLowerCase() === arcHex.toLowerCase()) return

  await switchToChain('arc')

  // Verify rather than trust — a rejected or silently-ignored switch would
  // otherwise send the fee on the wrong chain in the wrong token.
  const after = await window.ethereum.request({ method: 'eth_chainId' })
  if (after?.toLowerCase() !== arcHex.toLowerCase()) {
    throw new Error('Wallet must be on Arc Testnet to pay the ParagonFinance fee. Please switch networks and try again.')
  }
}

export async function payBridgeFeeToTreasury({ from }) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  if (!PARAGON_FINANCE_TREASURY_ADDRESS) {
    throw new Error('ParagonFinanceTreasury address is not configured (VITE_TREASURY_ADDRESS is empty)')
  }

  const start = Date.now()

  // Arc first — see ensureWalletOnArc above for why this is load-bearing.
  await ensureWalletOnArc()

  // Arc's native USDC carries 18 decimals in the value field, same
  // conversion every other send in this file uses.
  const rawFee = BigInt(Math.round(BRIDGE_FLAT_FEE_USDC * 1e6)) * BigInt(1e12)

  // Check the balance up front so an underfunded wallet gets a clear message
  // instead of an opaque MetaMask rejection.
  let balance
  try {
    balance = BigInt(await window.ethereum.request({
      method: 'eth_getBalance',
      params: [from, 'latest'],
    }))
  } catch {
    balance = null
  }
  if (balance !== null && balance < rawFee) {
    const have = (Number(balance) / 1e18).toFixed(6)
    throw new Error(
      'Not enough USDC on Arc Testnet for the ' + BRIDGE_FLAT_FEE_USDC +
      ' USDC ParagonFinance fee (you have ' + have + '). Top up from faucet.circle.com and try again.'
    )
  }

  const feeHex = '0x' + rawFee.toString(16)

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: PARAGON_FINANCE_TREASURY_ADDRESS,
      value: feeHex,
      // 60000 — Treasury's receive() does an SSTORE (totalFeesCollected)
      // plus a FeeReceived event, so 21000 (a bare EOA transfer) runs out.
      gas: '0xEA60',
    }],
  })

  const receipt = await waitForReceipt(txHash, 30, 1000)
  if (receipt && receipt.status === '0x0') {
    throw new Error('ParagonFinance fee transaction reverted. Nothing was bridged.')
  }

  const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : 45000
  let gasCost = '0'
  try {
    const gasPrice = await window.ethereum.request({ method: 'eth_gasPrice' })
    gasCost = (Number(BigInt(gasUsed) * BigInt(gasPrice)) / 1e18).toFixed(9)
  } catch { /* cosmetic only */ }

  return {
    hash: txHash,
    fee: BRIDGE_FLAT_FEE_USDC,
    treasury: PARAGON_FINANCE_TREASURY_ADDRESS,
    gasUsed,
    gasCost,
    blockNumber: receipt ? parseInt(receipt.blockNumber, 16) : 0,
    settlementTime: Date.now() - start,
    receipt,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────
export function shortAddr(addr) { return !addr ? '—' : addr.slice(0, 6) + '...' + addr.slice(-4) }
export function arcScanTx(hash) { return ARC_TESTNET.explorerUrl + '/tx/' + hash }
export function arcScanAddr(addr) { return ARC_TESTNET.explorerUrl + '/address/' + addr }
export function switchToArcTestnet() { return switchToChain('arc') }
export function formatUsdc(raw, decimals = 6) { return (Number(raw) / Math.pow(10, decimals)).toFixed(6) }
export function parseUsdc(amount, decimals = 6) { return BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals))) }
export function formatSettlement(ms) { if (!ms || ms < 0) return '—'; return ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(2) + 's' }
export function addArcTestnetToWallet() { return switchToChain('arc') }