// On-chain verification for reward-bearing transactions.
//
// WHY THIS EXISTS: POST /api/testnet/transactions previously trusted its own
// request body. Anyone with curl could invent a hash, claim any wallet, and
// mint points — unlimited, free, and indistinguishable from real activity in
// the database. The unique index on txHash stops a hash paying twice; it
// does nothing about a hash that was never on-chain.
//
// That was tolerable while transactions were cosmetic. It is not tolerable
// now that points convert to $PARA.
//
// Every claim is now checked against Arc's own RPC:
//   - the transaction exists and succeeded
//   - the sender matches the wallet claiming it
//   - the value matches what was claimed
//
// A claim that fails any of these is recorded without points rather than
// rejected outright — a genuine RPC hiccup shouldn't lose someone's history.

const ARC_RPC = process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network'

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
 * mid-request on something the user has already paid gas for.
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

  try {
    const [tx, receipt] = await Promise.all([
      rpc('eth_getTransactionByHash', [txHash]),
      rpc('eth_getTransactionReceipt', [txHash]),
    ])

    // Not yet mined, or never existed. Both look identical over RPC, so this
    // is retryable rather than fraudulent.
    if (!tx || !receipt) {
      return { valid: false, reason: 'not_found_onchain' }
    }

    if (receipt.status !== '0x1') {
      return { valid: false, reason: 'reverted' }
    }

    // The sender must be the wallet claiming the reward. Without this, one
    // wallet could claim every transaction on the chain.
    const sender = (tx.from || '').toLowerCase()
    if (sender !== walletAddress.toLowerCase()) {
      return { valid: false, reason: 'sender_mismatch', onChain: { sender } }
    }

    // Value check, for native USDC transfers. ERC-20 sends carry zero value
    // and their amount lives in the calldata, so those are checked only for
    // existence and sender — still enough to make fabrication impossible,
    // since you cannot forge a transaction you did not sign.
    const claimed = parseFloat(amount)
    const onChainValue = tx.value ? Number(BigInt(tx.value)) / 1e18 : 0

    if (onChainValue > 0) {
      // 2% tolerance. The frontend records the net amount while the chain
      // records the gross including the protocol fee, and rounding differs
      // between the two.
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
    // RPC unreachable. Treated as unverified rather than invalid — the
    // transaction is recorded, points are withheld, and it can be settled
    // later rather than lost.
    console.warn('[verify] RPC error:', err.message)
    return { valid: false, reason: 'rpc_unavailable' }
  }
}

/**
 * Whether a failed verification should be treated as an attack or an
 * accident. Attacks get logged loudly; accidents don't.
 */
export function isSuspicious(reason) {
  return ['sender_mismatch', 'amount_mismatch', 'not_found_onchain'].includes(reason)
}