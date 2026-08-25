import { useState, useEffect, useCallback, useRef } from 'react'
import { ARC_TESTNET, switchToArcTestnet } from '../utils/arcTestnet'
import { getProviderFor, WALLET_LABELS, WALLET_INSTALL_URLS } from '../utils/walletProviders'

// ─── Session policy ────────────────────────────────────────────────────────
// Two independent limits, both enforced:
//
//   IDLE_TIMEOUT — no interaction for this long and the wallet disconnects.
//     15 minutes matches what retail banks use. Long enough that filling in
//     a transfer or reading the docs page won't drop you; short enough that
//     an unattended machine isn't left holding an open session.
//
//   MAX_SESSION — hard ceiling from the moment of connect, activity or not.
//     Without this, someone who keeps a tab open indefinitely never
//     re-authenticates at all.
//
// Both live in localStorage rather than sessionStorage on purpose.
// sessionStorage is wiped when the tab closes — but the wallet's site
// permission is NOT, so eth_accounts silently restores the session on the
// next visit with no timer to stop it. localStorage keeps the clock running
// across tab closes and browser restarts.
const IDLE_TIMEOUT_MS = 15 * 60 * 1000       // 15 minutes
const MAX_SESSION_MS   = 12 * 60 * 60 * 1000 // 12 hours
const WARN_BEFORE_MS   = 60 * 1000           // warn 60s before idle expiry

const DISCONNECTED_KEY  = 'paragonfinance_disconnected'
const LAST_ACTIVITY_KEY = 'paragonfinance_last_activity'
const SESSION_START_KEY = 'paragonfinance_session_start'
const WALLET_ID_KEY     = 'paragonfinance_wallet_id'

// Writing on every mousemove would hammer localStorage; once every 30s of
// continuous activity is plenty of resolution for a 15-minute timeout.
const ACTIVITY_WRITE_THROTTLE_MS = 30 * 1000

const now = () => Date.now()
const readTs = (key) => {
  const v = localStorage.getItem(key)
  const n = v ? parseInt(v, 10) : NaN
  return Number.isFinite(n) ? n : null
}

export function useArcTestnet() {
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState('0.000000')
  const [network, setNetwork] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoConnecting, setIsAutoConnecting] = useState(true)
  const [error, setError] = useState(null)

  // Session state the UI can surface: why the last disconnect happened, and
  // how long until the next one.
  const [sessionExpiredReason, setSessionExpiredReason] = useState(null) // 'idle' | 'max' | null
  const [secondsUntilTimeout, setSecondsUntilTimeout] = useState(null)

  const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum

  // Which injected provider we're actually talking to.
  //
  // Reaching for window.ethereum directly means talking to whichever
  // extension won the global — not necessarily the one the user picked on the
  // connect screen. With MetaMask and Rabby both installed, they overwrite
  // each other, and a Rabby user would get MetaMask prompts. eth() resolves
  // that: it returns the chosen provider, falling back to the global only
  // when nothing has been selected yet.
  const providerRef = useRef(null)
  const [walletId, setWalletId] = useState(() => localStorage.getItem(WALLET_ID_KEY) || null)
  const eth = useCallback(() => providerRef.current || window.ethereum, [])

  // Read inside interval callbacks without making them dependencies.
  const isConnectedRef = useRef(false)
  useEffect(() => { isConnectedRef.current = isConnected }, [isConnected])

  const lastWriteRef = useRef(0)

  // ── Balance ──────────────────────────────────────────────────────────
  const fetchBalance = useCallback(async (address) => {
    if (!address) return
    try {
      const response = await fetch(ARC_TESTNET.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        }),
      })
      const json = await response.json()
      if (json.result && json.result !== '0x0' && json.result !== '0x') {
        setBalance((Number(BigInt(json.result)) / 1e18).toFixed(6))
      } else {
        setBalance('0.000000')
      }
    } catch (err) {
      console.error('Balance fetch error:', err)
      setBalance('0.000000')
    }
  }, [])

  const setWalletState = useCallback(async (address) => {
    const chainIdHex = await eth().request({ method: 'eth_chainId' })
    const chainId = parseInt(chainIdHex, 16)
    setAccount(address)
    setNetwork(chainId)
    setIsConnected(true)
    setIsCorrectNetwork(chainId === ARC_TESTNET.id)
    await fetchBalance(address)
  }, [fetchBalance, eth])

  const clearWalletState = useCallback(() => {
    setAccount(null)
    setIsConnected(false)
    setIsCorrectNetwork(false)
    setBalance('0.000000')
    setNetwork(null)
    setError(null)
    setSecondsUntilTimeout(null)
  }, [])

  // ── Session bookkeeping ──────────────────────────────────────────────
  const startSession = useCallback(() => {
    const t = now()
    localStorage.setItem(SESSION_START_KEY, String(t))
    localStorage.setItem(LAST_ACTIVITY_KEY, String(t))
    lastWriteRef.current = t
    setSessionExpiredReason(null)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_START_KEY)
    localStorage.removeItem(LAST_ACTIVITY_KEY)
  }, [])

  const touchActivity = useCallback(() => {
    const t = now()
    if (t - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return
    lastWriteRef.current = t
    localStorage.setItem(LAST_ACTIVITY_KEY, String(t))
  }, [])

  // Returns 'idle' | 'max' | null. Pure check — no side effects, so it can be
  // called from the auto-reconnect path before any state is set.
  const checkSessionExpiry = useCallback(() => {
    const start = readTs(SESSION_START_KEY)
    const last  = readTs(LAST_ACTIVITY_KEY)
    if (start === null || last === null) return null
    const t = now()
    if (t - start > MAX_SESSION_MS) return 'max'
    if (t - last > IDLE_TIMEOUT_MS) return 'idle'
    return null
  }, [])

  // ── Disconnect ───────────────────────────────────────────────────────
  const performDisconnect = useCallback(async (reason = null) => {
    try {
      const provider = eth()
      if (provider) {
        // Revoking the site permission is what makes the disconnect real.
        // Clearing React state alone leaves the wallet still authorised, so
        // the next eth_accounts call would silently reconnect.
        await provider.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        })
      }
    } catch (err) {
      // Not every wallet implements this. The session flag and cleared state
      // below still hold, so the disconnect stands.
      console.warn('wallet_revokePermissions failed:', err?.message)
    } finally {
      sessionStorage.setItem(DISCONNECTED_KEY, 'true')
      providerRef.current = null
      localStorage.removeItem(WALLET_ID_KEY)
      setWalletId(null)
      clearSession()
      clearWalletState()
      if (reason) setSessionExpiredReason(reason)
    }
  }, [clearSession, clearWalletState, eth])

  const disconnect = useCallback(() => performDisconnect(null), [performDisconnect])

  // ── Auto-reconnect on load ───────────────────────────────────────────
  // Order matters: the expiry check runs BEFORE eth_accounts, so an expired
  // session never briefly appears connected.
  useEffect(() => {
    const autoReconnect = async () => {
      if (typeof window === 'undefined' || !window.ethereum) {
        setIsAutoConnecting(false)
        return
      }

      if (sessionStorage.getItem(DISCONNECTED_KEY) === 'true') {
        setIsAutoConnecting(false)
        return
      }

      const expired = checkSessionExpiry()
      if (expired) {
        // Revoke rather than merely skip — otherwise the permission sits
        // there and the next page load reconnects again.
        await performDisconnect(expired)
        setIsAutoConnecting(false)
        return
      }

      // Restore the provider the user actually chose. Without this a reload
      // falls back to window.ethereum, so someone who connected with Rabby
      // would silently resume against whichever extension won the global.
      const savedId = localStorage.getItem(WALLET_ID_KEY)
      if (savedId) {
        const provider = await getProviderFor(savedId)
        if (provider) {
          providerRef.current = provider
          setWalletId(savedId)
        }
      }

      try {
        // eth_accounts does not prompt — it only reports an existing grant.
        const accounts = await eth().request({ method: 'eth_accounts' })
        if (accounts && accounts.length > 0) {
          // A live permission with no timestamps means the session predates
          // this timeout logic. Start the clock now rather than trusting it.
          if (readTs(SESSION_START_KEY) === null) startSession()
          else localStorage.setItem(LAST_ACTIVITY_KEY, String(now()))
          await setWalletState(accounts[0])
        }
      } catch (err) {
        console.warn('Auto-reconnect failed:', err?.message)
      } finally {
        setIsAutoConnecting(false)
      }
    }
    autoReconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Connect ──────────────────────────────────────────────────────────
  const connect = useCallback(async (requestedWalletId = 'metamask') => {
    setIsLoading(true)
    setError(null)
    setSessionExpiredReason(null)

    try {
      const provider = await getProviderFor(requestedWalletId)
      if (!provider) {
        const label = WALLET_LABELS[requestedWalletId] || requestedWalletId
        const err = new Error(label + ' is not installed.')
        err.installUrl = WALLET_INSTALL_URLS[requestedWalletId]
        err.walletId = requestedWalletId
        throw err
      }

      providerRef.current = provider

      // Revoke first so the account picker always appears — the user should
      // see what they're authorising, not have a prior grant silently reused.
      try {
        await provider.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        })
      } catch { /* not supported on every wallet — continue */ }

      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      if (!accounts.length) throw new Error('No accounts selected')

      await switchToArcTestnet(provider)

      sessionStorage.removeItem(DISCONNECTED_KEY)
      localStorage.setItem(WALLET_ID_KEY, requestedWalletId)
      setWalletId(requestedWalletId)
      startSession()

      await setWalletState(accounts[0])
      return accounts[0]
    } catch (err) {
      if (err.code === 4001) setError('Connection rejected. Please approve the prompt in your wallet.')
      else setError(err.message || 'Failed to connect wallet')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [setWalletState, startSession])

  // ── Activity listeners ───────────────────────────────────────────────
  // Only mounted while connected, so an idle logged-out page costs nothing.
  useEffect(() => {
    if (!isConnected) return

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, touchActivity, { passive: true }))

    // Returning to a backgrounded tab counts as activity — but only if the
    // session is still valid. The expiry sweep below handles the other case.
    const onVisible = () => { if (!document.hidden) touchActivity() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      events.forEach(e => window.removeEventListener(e, touchActivity))
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [isConnected, touchActivity])

  // ── Expiry sweep ─────────────────────────────────────────────────────
  // Runs every 10s while connected. Also drives the countdown the UI uses to
  // warn before the cut-off.
  useEffect(() => {
    if (!isConnected) {
      setSecondsUntilTimeout(null)
      return
    }

    const tick = async () => {
      if (!isConnectedRef.current) return
      const expired = checkSessionExpiry()
      if (expired) {
        await performDisconnect(expired)
        return
      }
      const last = readTs(LAST_ACTIVITY_KEY)
      if (last !== null) {
        const remaining = Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - (now() - last)) / 1000))
        setSecondsUntilTimeout(remaining)
      }
    }

    tick()
    const id = setInterval(tick, 10 * 1000)
    return () => clearInterval(id)
  }, [isConnected, checkSessionExpiry, performDisconnect])

  // Another tab disconnecting must disconnect this one too — otherwise a
  // second tab keeps the session alive after the first has ended it.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === SESSION_START_KEY && e.newValue === null && isConnectedRef.current) {
        clearWalletState()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [clearWalletState])

  // ── Send ─────────────────────────────────────────────────────────────
  const sendUsdc = useCallback(async ({ to, amount }) => {
    if (!account || !isCorrectNetwork) throw new Error('Not connected to Arc Testnet')

    // Signing is the most sensitive action in the app — re-check expiry
    // rather than relying on the 10s sweep having already fired.
    const expired = checkSessionExpiry()
    if (expired) {
      await performDisconnect(expired)
      throw new Error('Your session expired. Please reconnect your wallet and try again.')
    }
    touchActivity()

    setIsLoading(true)
    setError(null)

    try {
      const provider = eth()
      const start = Date.now()
      const rawAmount = BigInt(Math.round(parseFloat(amount) * 1e6)) * BigInt(1e12)
      const amountHex = '0x' + rawAmount.toString(16)
      const gasPrice = await provider.request({ method: 'eth_gasPrice' })

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: account, to, value: amountHex, gasPrice, gas: '0x5208' }],
      })

      let receipt = null
      let attempts = 0
      while (!receipt && attempts < 30) {
        await new Promise(r => setTimeout(r, 500))
        const res = await fetch(ARC_TESTNET.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionReceipt',
            params: [txHash],
            id: 1,
          }),
        })
        const data = await res.json()
        if (data.result) receipt = data.result
        attempts++
      }

      const settlementTime = Date.now() - start
      const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : 21000
      const gasCostRaw = BigInt(gasUsed) * BigInt(parseInt(gasPrice, 16))

      await fetchBalance(account)

      return {
        hash: txHash,
        from: account,
        to,
        amount: parseFloat(amount),
        gasCost: (Number(gasCostRaw) / 1e18).toFixed(9),
        gasUsed,
        settlementTime,
        blockNumber: receipt ? parseInt(receipt.blockNumber, 16) : null,
        status: receipt?.status === '0x1' ? 'confirmed' : 'failed',
        timestamp: new Date().toISOString(),
        network: 'Arc Testnet',
        chainId: ARC_TESTNET.id,
      }
    } catch (err) {
      setError(err.message || 'Transaction failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [account, isCorrectNetwork, fetchBalance, checkSessionExpiry, performDisconnect, touchActivity, eth])

  const refreshBalance = useCallback(() => {
    if (account) fetchBalance(account)
  }, [account, fetchBalance])

  // ── Wallet events ────────────────────────────────────────────────────
  // Bound to the ACTIVE provider, not window.ethereum — otherwise a Rabby
  // session would listen for MetaMask's account changes and miss its own.
  useEffect(() => {
    const provider = eth()
    if (!provider?.on) return

    const onAccountsChanged = async (accounts) => {
      if (accounts.length) {
        if (sessionStorage.getItem(DISCONNECTED_KEY) === 'true') return
        // Switching accounts is a new session — the previous account's clock
        // shouldn't carry over to a different address.
        startSession()
        await setWalletState(accounts[0])
      } else {
        clearSession()
        clearWalletState()
      }
    }

    const onChainChanged = (chainIdHex) => {
      const chainId = parseInt(chainIdHex, 16)
      setNetwork(chainId)
      setIsCorrectNetwork(chainId === ARC_TESTNET.id)
      if (account) fetchBalance(account)
    }

    provider.on('accountsChanged', onAccountsChanged)
    provider.on('chainChanged', onChainChanged)

    return () => {
      provider.removeListener?.('accountsChanged', onAccountsChanged)
      provider.removeListener?.('chainChanged', onChainChanged)
    }
    // walletId is a dependency so listeners rebind when the provider changes.
  }, [account, walletId, fetchBalance, setWalletState, clearWalletState, clearSession, startSession, eth])

  return {
    account,
    balance,
    network,
    isConnected,
    isCorrectNetwork,
    isLoading,
    isAutoConnecting,
    error,
    hasMetaMask,
    walletId,
    connect,
    disconnect,
    sendUsdc,
    refreshBalance,
    arcTestnet: ARC_TESTNET,

    // Session
    sessionExpiredReason,           // 'idle' | 'max' | null
    secondsUntilTimeout,            // number | null
    showTimeoutWarning: secondsUntilTimeout !== null && secondsUntilTimeout <= WARN_BEFORE_MS / 1000,
    extendSession: touchActivity,   // call from a "Stay connected" button
    idleTimeoutMinutes: IDLE_TIMEOUT_MS / 60000,
    maxSessionHours: MAX_SESSION_MS / 3600000,
  }
}