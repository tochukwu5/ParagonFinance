// Paragon Finance — Arc Network + Circle App Kit CCTP Integration
// Cross-chain transfers powered by Circle's official App Kit SDK

// ─── Paragon Finance Contract Addresses ──────────────────────────────
export const PARAGON_CONTRACTS = {
  paymentRouter: import.meta.env.VITE_PAYMENT_ROUTER_ADDRESS || null,
  bridgeRouter:  import.meta.env.VITE_BRIDGE_ROUTER_ADDRESS  || null,
  feeManager:    import.meta.env.VITE_FEE_MANAGER_ADDRESS    || null,
  treasury:      import.meta.env.VITE_TREASURY_ADDRESS       || null,
  registry:      import.meta.env.VITE_REGISTRY_ADDRESS       || null,
}

// routePayment(address) function selector
// keccak256("routePayment(address)") first 4 bytes
const ROUTE_PAYMENT_SELECTOR = '0x8c0d4f68'

export const ARC_TESTNET = {
  id: 5042002,
  name: 'Arc Testnet',
  rpcUrl: 'https://rpc.testnet.arc.network',
  explorerUrl: 'https://testnet.arcscan.app',
  faucetUrl: 'https://faucet.circle.com',
  usdcAddress: '0x3600000000000000000000000000000000000000',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  cctpDomain: 7,
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
    note: 'Native Arc — routed through ParagonPaymentRouter',
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
}

export async function switchToChain(chainKey) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  const chain = EVM_CHAINS[chainKey]
  if (!chain) throw new Error('Unknown chain: ' + chainKey)
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: chain.chainIdHex,
        chainName: chain.name,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: [chain.rpcUrl],
        blockExplorerUrls: [chain.explorerUrl],
      }],
    })
  } catch (addErr) {
    if (addErr.code === 4001) throw new Error('User rejected adding the network.')
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chain.chainIdHex }],
      })
    } catch (switchErr) {
      if (switchErr.code === 4001) throw new Error('User rejected the network switch.')
      throw switchErr
    }
  }
}

export async function getUsdcBalance(chainKey, address) {
  if (!window.ethereum) return '0'
  const chain = EVM_CHAINS[chainKey]
  if (!chain) return '0'
  try {
    if (chainKey === 'arc') {
      const raw = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })
      return (parseInt(raw, 16) / 1e18).toFixed(6)
    } else {
      const paddedAddr = address.slice(2).toLowerCase().padStart(64, '0')
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: chain.usdcAddress, data: '0x70a08231' + paddedAddr }, 'latest'],
      })
      if (!result || result === '0x') return '0.000000'
      return (parseInt(result, 16) / 1_000_000).toFixed(6)
    }
  } catch { return '0' }
}

async function waitForReceipt(txHash, maxAttempts = 60, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, delayMs))
    const receipt = await window.ethereum.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    })
    if (receipt) return receipt
  }
  return null
}

// ─── Circle App Kit CCTP bridge ───────────────────────────────────────
export async function sendUsdcViaCCTP(chainKey, { from, to, amount }, onStatusUpdate = () => {}) {
  const chain = EVM_CHAINS[chainKey]
  if (!chain || !chain.useCCTP) throw new Error('Chain does not support CCTP: ' + chainKey)

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
      else if (step === 'burn' && state !== 'success') onStatusUpdate('Step 2/3: Burning USDC on ' + chain.name + '...')
      else if (step === 'burn') onStatusUpdate('Step 2/3: USDC burned ✓')
      else if (step === 'attestation' || step === 'attest') onStatusUpdate('Step 3/3: Circle attestation... (1-3 min)')
      else if (step === 'mint' && state !== 'success') onStatusUpdate('Minting USDC on Arc Testnet...')
      else if (step === 'mint') onStatusUpdate('✓ USDC minted on Arc Testnet!')
    })

    const adapter = await createViemAdapterFromProvider({ provider: window.ethereum })
    onStatusUpdate('Starting Circle CCTP bridge...')

    let result = await kit.bridge({
      from: { adapter, chain: chain.appKitChain },
      to: { adapter, chain: 'Arc_Testnet' },
      amount: parseFloat(amount).toFixed(2),
    })

    if (result.state === 'error') {
      onStatusUpdate('Retrying bridge...')
      result = await kit.retryBridge(result, { from: adapter, to: adapter })
    }

    if (result.state === 'error') throw new Error('Bridge failed: ' + JSON.stringify(result))

    const steps = result.steps || []
    const burnStep    = steps.find(s => s.name === 'burn')
    const mintStep    = steps.find(s => s.name === 'mint')
    const approveStep = steps.find(s => s.name === 'approve')

    return {
      hash: burnStep?.txHash || burnStep?.data?.txHash || '',
      mintTxHash: mintStep?.txHash || mintStep?.data?.txHash || '',
      approvalHash: approveStep?.txHash || '',
      from, to,
      amount: parseFloat(amount),
      gasCost: '0',
      gasUsed: 0,
      blockNumber: mintStep?.data?.blockNumber ? Number(mintStep.data.blockNumber) : 0,
      settlementTime: Date.now() - start,
      status: 'confirmed',
      sourceChain: chain.name,
      destinationChain: 'Arc Testnet',
      network: chain.name + ' → Arc Testnet (CCTP v2)',
      chainId: chain.id,
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

// ─── Native Arc send — routed through ParagonPaymentRouter ────────────
export async function sendUsdcNativeArc({ from, to, amount }) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  const start = Date.now()

  // Convert amount to 18-decimal hex value
  const rawAmount = BigInt(Math.round(parseFloat(amount) * 1e6)) * BigInt(1e12)
  const amountHex = '0x' + rawAmount.toString(16)

  const gasPrice = await window.ethereum.request({ method: 'eth_gasPrice' })

  let txHash
  let routedViaRouter = false

  if (PARAGON_CONTRACTS.paymentRouter) {
    // ── Route through ParagonPaymentRouter ───────────────────────────
    // Contract splits: 0.30% fee → Treasury, 99.70% net → recipient
    // ArcScan shows: "ParagonPaymentRouter" instead of "SendArcRouter"
    const recipientPadded = to.slice(2).toLowerCase().padStart(64, '0')
    const data = ROUTE_PAYMENT_SELECTOR + recipientPadded

    console.log('Routing through ParagonPaymentRouter:', PARAGON_CONTRACTS.paymentRouter)

    txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to: PARAGON_CONTRACTS.paymentRouter,  // → PaymentRouter contract
        value: amountHex,                      // gross amount — router splits internally
        data: data,                            // routePayment(address recipient)
        gasPrice,
        gas: '0x927C0',                       // 600_000 gas limit
      }],
    })
    routedViaRouter = true
  } else {
    // ── Fallback: plain native transfer ──────────────────────────────
    // Only used if VITE_PAYMENT_ROUTER_ADDRESS is not set on Vercel
    console.warn('ParagonPaymentRouter address not set — using plain transfer. Add VITE_PAYMENT_ROUTER_ADDRESS to Vercel env vars.')

    txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to,
        value: amountHex,
        gasPrice,
        gas: '0x5208',
      }],
    })
  }

  const receipt = await waitForReceipt(txHash, 30, 1000)
  const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : 21000
  const gasPriceNum = parseInt(gasPrice, 16)
  const gasCostRaw = BigInt(gasUsed) * BigInt(gasPriceNum)

  return {
    hash: txHash,
    from,
    to,
    amount: parseFloat(amount),
    gasCost: (Number(gasCostRaw) / 1e18).toFixed(9),
    gasUsed,
    blockNumber: receipt ? parseInt(receipt.blockNumber, 16) : 0,
    settlementTime: Date.now() - start,
    status: receipt?.status === '0x1' ? 'confirmed' : 'failed',
    sourceChain: 'Arc Testnet',
    destinationChain: 'Arc Testnet',
    network: routedViaRouter ? 'Arc Testnet (via ParagonPaymentRouter)' : 'Arc Testnet',
    chainId: ARC_TESTNET.id,
    cctpBridge: false,
    simulated: false,
    routedVia: routedViaRouter ? 'ParagonPaymentRouter' : 'direct',
  }
}

// ─── Main entry point called by frontend ─────────────────────────────
export async function sendUsdcOnChain(chainKey, { to, amount }, onStatusUpdate = () => {}) {
  if (!window.ethereum) throw new Error('MetaMask not found')
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  const from = accounts[0]
  if (!from) throw new Error('No account connected')

  if (chainKey === 'arc') {
    onStatusUpdate('Sending USDC via Paragon Finance...')
    return sendUsdcNativeArc({ from, to, amount })
  }
  return sendUsdcViaCCTP(chainKey, { from, to, amount }, onStatusUpdate)
}

// ─── Helpers ──────────────────────────────────────────────────────────
export function shortAddr(addr) {
  return !addr ? '—' : addr.slice(0, 6) + '...' + addr.slice(-4)
}
export function arcScanTx(hash) {
  return ARC_TESTNET.explorerUrl + '/tx/' + hash
}
export function arcScanAddr(addr) {
  return ARC_TESTNET.explorerUrl + '/address/' + addr
}
export function switchToArcTestnet() {
  return switchToChain('arc')
}
export function formatUsdc(raw, decimals = 6) {
  return (Number(raw) / Math.pow(10, decimals)).toFixed(6)
}
export function parseUsdc(amount, decimals = 6) {
  return BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals)))
}
export function formatSettlement(ms) {
  if (!ms || ms < 0) return '—'
  return ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(2) + 's'
}
export function addArcTestnetToWallet() {
  return switchToChain('arc')
}