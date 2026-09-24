import { useEffect, useRef } from 'react'

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const STORAGE_KEY = 'paragonfinance_ref'

/**
 * Captures ?ref=CODE from the URL and links it once a wallet connects.
 *
 * Two steps, deliberately separated. Someone arriving on a referral link
 * rarely connects a wallet in the same breath — they read the site first,
 * maybe leave and come back. Storing the code and redeeming it later is what
 * makes the referral survive that gap; linking only on immediate connection
 * would lose most of them.
 *
 * The code is stripped from the URL after capture so it doesn't propagate
 * into shared links, which would silently reassign someone else's referrals.
 */
export function useReferralCapture(account) {
  const linked = useRef(false)

  // Capture, once, on load.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('ref')
    if (!code) return

    // First code wins. Overwriting means a second link seen weeks later
    // steals a referral that the first person earned.
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, code.toUpperCase().trim())
    }

    params.delete('ref')
    const clean = window.location.pathname +
      (params.toString() ? '?' + params.toString() : '')
    window.history.replaceState({}, '', clean)
  }, [])

  // Redeem, once a wallet is available.
  useEffect(() => {
    if (!account || linked.current) return

    const code = localStorage.getItem(STORAGE_KEY)
    if (!code) return

    linked.current = true

    fetch(API_BASE + '/rewards/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: account, referralCode: code }),
    })
      .then(r => r.json())
      .then(result => {
        // Clear on any settled outcome, success or not. A code that was
        // rejected for being self-referral or already-used will be rejected
        // every time, and retrying it on each page load is pointless noise.
        if (result.success || result.reason) {
          localStorage.removeItem(STORAGE_KEY)
        }
      })
      .catch(() => {
        // Network failure — keep the code and try again next load.
        linked.current = false
      })
  }, [account])
}