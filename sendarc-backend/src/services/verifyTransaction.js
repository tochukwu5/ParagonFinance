// On-chain verification for reward-bearing transactions.
//
// WHY THIS EXISTS: POST /api/testnet/transactions trusted its own request
// body. Anyone with curl could invent a hash, claim any wallet, and mint
// points — unlimited, free, and indistinguishable from real activity in the
// database. The route already imports and calls this file; until now the
// file didn't exist, so every request to /transactions was throwing on
// import and failing outright.
//
// Every claim is checked against Arc's own RPC before rewardService ever
// runs:
//   - does the transaction exist and did it succeed?
//   - does the sender match the wallet claiming the reward?
//   - does the value roughly match what was claimed?
//
// A claim that fails is still saved to history (routes/testnet.js does that
// before calling this) — it just doesn't get paid. A check that can't
// complete — the RPC is down — also doesn't get paid, but isn't logged as
// an attack, because it probably isn't one.

// QuickNode first: a dedicated endpoint rather than the shared public one,
// and the concrete integration this file exists to point to. Falls back to
// Circle's own RPC if the QuickNode URL isn't configured yet, so
// verification still works before that env var is set.
const ARC_RPC = process.env.QUICKNODE_ARC_RPC || process.env.ARC_RPC_URL || 'https://rpc.mainnet.arc.io'

async function rpc(method, params) {
  const res = await fetch(ARC_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(8000),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error.message || method + ' failed')
  return json.result
}

/**
 * Verify a transaction hash belongs to the claiming wallet and succeeded.
 *
 * Returns { valid, reason, onChain } — never throws, because the caller is
 * mid-request on something the user has already paid gas for, and a network
 * hiccup here shouldn't turn into a 500.
 */
export async function verifyTransaction({ txHash, walletAddress, amount }) {
  if (!txHash || typeof txHash !== 'string') {
    return { valid: false, reason: 'missing_hash' }
  }

  // Solana signatures are base58 and can't be checked against an EVM RPC.
  // Bridges out to Solana are verified by their Arc-side burn instead, which
  // is the transaction this wallet actually signed.
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return { valid: false, reason: 'not_evm_hash' }
  }

  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return { valid: false, reason: 'invalid_wallet' }
  }

  try {
    const [tx, receipt] = await Promise.all([
      rpc('eth_getTransactionByHash', [txHash]),
      rpc('eth_getTransactionReceipt', [txHash]),
    ])

    // Not yet mined, or never existed. Both look identical over RPC, so this
    // is retryable rather than treated as fraud.
    if (!tx || !receipt) {
      return { valid: false, reason: 'not_found_onchain' }
    }

    if (receipt.status !== '0x1') {
      return { valid: false, reason: 'reverted' }
    }

    // The sender must be the wallet claiming the reward. Without this, one
    // wallet could claim every transaction on the chain by resubmitting
    // other people's public hashes.
    const sender = (tx.from || '').toLowerCase()
    if (sender !== walletAddress.toLowerCase()) {
      return { valid: false, reason: 'sender_mismatch', onChain: { sender } }
    }

    // Value check, for native USDC transfers — Arc's gas token, 18 decimals.
    // ERC-20 sends (EURC, cirBTC, swaps) carry zero native value and their
    // amount lives in the calldata instead, so those are checked only for
    // existence and sender — still enough to make fabrication impossible,
    // since a hash can't be forged for a transaction that was never signed.
    const claimed = parseFloat(amount)
    const onChainValue = tx.value ? Number(BigInt(tx.value)) / 1e18 : 0

    if (onChainValue > 0) {
      // 2% tolerance. The frontend records the net amount while the chain
      // records the gross including the protocol fee, and rounding differs
      // slightly between the two representations.
      const drift = Math.abs(onChainValue - claimed) / Math.max(claimed, 0.000001)
      if (drift > 0.02 && onChainValue < claimed) {
        return {
          valid: false,
          reason: 'amount_mismatch',
          onChain: { value: onChainValue, claimed },
        }
      }
    }

    return {
      valid: true,
      onChain: {
        sender,
        to: (tx.to || '').toLowerCase(),
        value: onChainValue,
        blockNumber: parseInt(receipt.blockNumber, 16),
        gasUsed: parseInt(receipt.gasUsed, 16),
      },
    }
  } catch (err) {
    // RPC unreachable or malformed response. Treated as unverified rather
    // than invalid — recorded, unpaid, and safely retryable later rather
    // than lost.
    console.warn('[verify] RPC error:', err.message)
    return { valid: false, reason: 'rpc_unavailable' }
  }
}

/**
 * Whether a failed verification looks like an attack or an accident.
 * Attacks get logged loudly for the admin to see; accidents (an RPC hiccup,
 * a transaction still pending) don't clutter the log.
 */
export function isSuspicious(reason) {
  return ['sender_mismatch', 'amount_mismatch', 'not_found_onchain'].includes(reason)
}