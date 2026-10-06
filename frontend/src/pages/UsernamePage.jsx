import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useArcTestnet } from '../hooks/useArcTestnet'
import { Card } from '../components/UI'
import QrCode from '../components/QrCode'
import {
  validateUsernameLocal, checkUsername, getUsernameForWallet, claimUsername,
  buildPayLink, sanitizeAmount,
} from '../utils/username'

// /dashboard/payment-link — claim a @username, then share the link / QR that
// lets anyone pay it.
export default function UsernamePage() {
  const { account, isConnected, walletId } = useArcTestnet()

  const [current, setCurrent] = useState(null)       // the wallet's @name, if any
  const [canChangeAt, setCanChangeAt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)

  const [input, setInput] = useState('')
  const [availability, setAvailability] = useState({ status: 'idle', reason: null })
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState(null)
  const [justClaimed, setJustClaimed] = useState(false)

  const [amount, setAmount] = useState('')
  const [copied, setCopied] = useState(false)

  const loadCurrent = useCallback(async () => {
    if (!account) return
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getUsernameForWallet(account)
      setCurrent(data.username)
      setCanChangeAt(data.canChangeAt ? new Date(data.canChangeAt) : null)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }, [account])

  useEffect(() => {
    setCurrent(null)
    setCanChangeAt(null)
    setJustClaimed(false)
    loadCurrent()
  }, [loadCurrent])

  // Live availability, debounced so typing doesn't fire a request per key.
  useEffect(() => {
    setClaimError(null)
    setJustClaimed(false)

    const v = validateUsernameLocal(input)
    if (!input.trim()) { setAvailability({ status: 'idle', reason: null }); return }
    if (!v.ok) { setAvailability({ status: 'invalid', reason: v.reason }); return }
    if (v.name === current) { setAvailability({ status: 'yours', reason: null }); return }

    let cancelled = false
    setAvailability({ status: 'checking', reason: null })
    const timer = setTimeout(async () => {
      try {
        const r = await checkUsername(v.name)
        if (cancelled) return
        if (!r.valid) setAvailability({ status: 'invalid', reason: r.reason })
        else if (r.available) setAvailability({ status: 'ok', reason: null })
        else setAvailability({ status: 'taken', reason: r.reason || 'Already taken.' })
      } catch {
        if (!cancelled) setAvailability({ status: 'error', reason: "Couldn't check availability." })
      }
    }, 400)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [input, current])

  const coolingDown = !!canChangeAt && canChangeAt.getTime() > Date.now()
  const cooldownText = coolingDown
    ? 'You can change your username again ' + canChangeAt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) + '.'
    : null

  const canClaim =
    availability.status === 'ok' && !claiming && !(current && coolingDown)

  const handleClaim = async () => {
    setClaiming(true)
    setClaimError(null)
    try {
      const { username } = await claimUsername({ username: input, account, walletId })
      setCurrent(username)
      setInput('')
      setJustClaimed(true)
      await loadCurrent()
    } catch (err) {
      setClaimError(err.message || 'Could not claim username')
    } finally {
      setClaiming(false)
    }
  }

  const link = current ? buildPayLink(current, { amount }) : ''

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard can be blocked (insecure origin, permissions). The link is
      // selectable on screen, so this isn't fatal.
    }
  }

  const shareLink = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Pay @' + current + ' on Paragon Finance', url: link }) } catch { /* dismissed */ }
    } else {
      copyLink()
    }
  }

  const hint = {
    checking: { text: 'Checking…', cls: 'text-[#8892a0]' },
    ok: { text: '✓ Available', cls: 'text-green-400' },
    taken: { text: availability.reason, cls: 'text-red-400' },
    invalid: { text: availability.reason, cls: 'text-red-400' },
    error: { text: availability.reason, cls: 'text-amber-400' },
    yours: { text: "That's already your username.", cls: 'text-[#8892a0]' },
  }[availability.status]

  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      <main className="flex-1 p-4 sm:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] mb-1">Username &amp; Payment Link</h1>
        <p className="text-[#8892a0] text-sm mb-8">
          Claim a @username so people can pay you without copying a wallet address.
        </p>

        {!isConnected || !account ? (
          <Card className="p-8 text-center">
            <p className="font-semibold mb-1">No wallet connected</p>
            <p className="text-sm text-[#8892a0] mb-5">Connect the wallet you want to receive payments with.</p>
            <Link
              to="/connect"
              className="inline-block bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all"
            >
              Connect Wallet
            </Link>
          </Card>
        ) : (
          <>
            {/* ── Username ─────────────────────────────────────────── */}
            <Card className="p-5 mb-4">
              <p className="text-[10px] tracking-widest text-[#8892a0] mb-4">YOUR USERNAME</p>

              {loading ? (
                <p className="text-sm text-[#8892a0]">Loading…</p>
              ) : loadError ? (
                <p className="text-sm text-red-400">{loadError}</p>
              ) : (
                <>
                  {current ? (
                    <div className="mb-5">
                      <p className="text-2xl font-bold font-['Space_Grotesk'] text-[#00D4FF]">@{current}</p>
                      {justClaimed && <p className="text-xs text-green-400 mt-1">✓ Saved — your username is live.</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-[#8892a0] mb-4">You haven't claimed a username yet.</p>
                  )}

                  <label className="text-[10px] tracking-widest text-[#8892a0] block mb-2">
                    {current ? 'CHANGE USERNAME' : 'CHOOSE A USERNAME'}
                  </label>
                  <div className="flex items-center bg-[#0D1117] border border-[#1e2530] focus-within:border-[#00D4FF] rounded-xl px-4 py-3 transition-colors">
                    <span className="text-[#8892a0] mr-1">@</span>
                    <input
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value.replace(/^@/, ''))}
                      placeholder="yourname"
                      maxLength={20}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      className="flex-1 bg-transparent text-white text-sm outline-none"
                    />
                  </div>

                  <div className="min-h-[20px] mt-1.5">
                    {hint && hint.text && <p className={'text-xs ' + hint.cls}>{hint.text}</p>}
                  </div>
                  <p className="text-[11px] text-[#8892a0] mt-1">
                    3–20 characters: letters, numbers and underscores, starting with a letter.
                  </p>

                  {cooldownText && current && (
                    <p className="text-[11px] text-amber-400 mt-2">{cooldownText}</p>
                  )}
                  {claimError && <p className="text-xs text-red-400 mt-3">{claimError}</p>}

                  <button
                    onClick={handleClaim}
                    disabled={!canClaim}
                    className="mt-4 w-full bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {claiming
                      ? 'Confirm in your wallet…'
                      : current ? 'Change username' : 'Claim username'}
                  </button>
                  <p className="text-[11px] text-[#8892a0] mt-2 text-center">
                    You'll be asked to sign a message. It's free and doesn't move any money.
                  </p>
                </>
              )}
            </Card>

            {/* ── Payment link + QR ────────────────────────────────── */}
            {current && (
              <Card className="p-5 mb-4">
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-4">YOUR PAYMENT LINK</p>

                <label className="text-[10px] tracking-widest text-[#8892a0] block mb-2">
                  REQUEST A SPECIFIC AMOUNT (OPTIONAL)
                </label>
                <div className="flex items-center bg-[#0D1117] border border-[#1e2530] focus-within:border-[#00D4FF] rounded-xl px-4 py-3 mb-1 transition-colors">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                    placeholder="Any amount"
                    className="flex-1 bg-transparent text-white text-sm outline-none"
                  />
                  <span className="text-xs text-[#8892a0]">USDC</span>
                </div>
                {amount && !sanitizeAmount(amount) && (
                  <p className="text-[11px] text-amber-400">Enter a number above 0 (up to 6 decimals), or leave empty.</p>
                )}

                <div className="mt-4 bg-[#0D1117] border border-[#1e2530] rounded-xl px-4 py-3">
                  <p className="text-xs font-mono text-white break-all select-all">{link}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={copyLink}
                    className="bg-[#0f1822] border border-[#1e2530] hover:border-[#00D4FF] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy link'}
                  </button>
                  <button
                    onClick={shareLink}
                    className="bg-[#0f1822] border border-[#1e2530] hover:border-[#00D4FF] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    Share
                  </button>
                </div>

                <div className="mt-6 flex justify-center">
                  <QrCode value={link} filename={'paragon-pay-' + current} />
                </div>
                <p className="text-[11px] text-[#8892a0] text-center mt-3">
                  Anyone who scans this opens a page to pay @{current}.
                </p>
              </Card>
            )}

            <Card className="p-5">
              <p className="text-[10px] tracking-widest text-[#8892a0] mb-3">HOW IT WORKS</p>
              <ul className="space-y-2 text-sm text-[#8892a0] list-disc pl-5">
                <li>Anyone can type <span className="text-white font-mono">@{current || 'yourname'}</span> in the Send tab instead of a long wallet address.</li>
                <li>Your link opens a page that sends USDC straight to your connected wallet.</li>
                <li>Your username points to this wallet address only — funds always go to the wallet you claimed it with.</li>
              </ul>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}