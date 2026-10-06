import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Card } from '../components/UI'
import QrCode from '../components/QrCode'
import { resolveUsername, normalizeHandle, sanitizeAmount, buildPayLink } from '../utils/username'
import { shortAddr } from '../utils/arcTestnet'

// /pay/:username?amount=5 — the public page a payment link or QR code opens.
//
// It doesn't move money itself. It confirms who the @name belongs to, then
// hands off to the Send tab with the recipient and amount filled in, where
// the normal review-and-sign flow takes over.
export default function PayPage() {
  const { username: rawName } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()

  const name = normalizeHandle(rawName)
  const presetAmount = sanitizeAmount(search.get('amount'))

  const [state, setState] = useState('loading') // loading | found | notfound | error
  const [owner, setOwner] = useState(null)
  const [amount, setAmount] = useState(presetAmount)

  useEffect(() => {
    let cancelled = false
    setState('loading')
    resolveUsername(name)
      .then(r => {
        if (cancelled) return
        if (r) { setOwner(r); setState('found') } else setState('notfound')
      })
      .catch(() => { if (!cancelled) setState('error') })
    return () => { cancelled = true }
  }, [name])

  const validAmount = !!sanitizeAmount(amount)

  const goPay = () => {
    // `to` carries the @name, not the address: the Send tab resolves it again
    // from the server, so what the payer sees on the review screen can't be
    // spoofed by editing this URL.
    const q = new URLSearchParams({ to: '@' + owner.username })
    if (validAmount) q.set('amount', sanitizeAmount(amount))
    navigate('/app?' + q.toString())
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {state === 'loading' && (
          <Card className="p-8 text-center">
            <p className="text-sm text-[#8892a0]">Looking up @{name}…</p>
          </Card>
        )}

        {state === 'notfound' && (
          <Card className="p-8 text-center">
            <p className="text-xl font-bold font-['Space_Grotesk'] mb-2">@{name} doesn't exist</p>
            <p className="text-sm text-[#8892a0] mb-6">
              This username hasn't been claimed. Check the link with whoever sent it.
            </p>
            <Link to="/" className="text-[#00D4FF] text-sm hover:underline">Back to Paragon Finance</Link>
          </Card>
        )}

        {state === 'error' && (
          <Card className="p-8 text-center">
            <p className="text-xl font-bold font-['Space_Grotesk'] mb-2">Couldn't load this page</p>
            <p className="text-sm text-[#8892a0] mb-6">Please check your connection and try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[#00D4FF] text-sm hover:underline"
            >
              Retry
            </button>
          </Card>
        )}

        {state === 'found' && owner && (
          <Card className="p-6" glow>
            <p className="text-[10px] tracking-widest text-[#8892a0] text-center mb-2">PAY</p>
            <p className="text-3xl font-bold font-['Space_Grotesk'] text-[#00D4FF] text-center">
              @{owner.username}
            </p>
            <p className="text-xs font-mono text-[#8892a0] text-center mt-1 mb-6">
              {shortAddr(owner.walletAddress)}
            </p>

            <label className="text-[10px] tracking-widest text-[#8892a0] block mb-2">AMOUNT</label>
            <div className="flex items-center bg-[#0D1117] border border-[#1e2530] focus-within:border-[#00D4FF] rounded-xl px-4 py-3 transition-colors">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder="0.00"
                className="flex-1 bg-transparent text-white text-xl font-['Space_Grotesk'] outline-none"
              />
              <span className="text-sm text-[#8892a0]">USDC</span>
            </div>
            {presetAmount && amount === presetAmount && (
              <p className="text-[11px] text-[#8892a0] mt-1.5">Requested by @{owner.username}. You can change it.</p>
            )}

            <button
              onClick={goPay}
              disabled={!validAmount}
              className="mt-5 w-full bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue to pay →
            </button>
            <p className="text-[11px] text-[#8892a0] text-center mt-3">
              You'll connect your wallet and review everything before anything is sent.
            </p>

            <div className="mt-6 pt-6 border-t border-[#1e2530] flex justify-center">
              <QrCode
                value={buildPayLink(owner.username, { amount: validAmount ? amount : '' })}
                size={160}
                filename={'paragon-pay-' + owner.username}
                showDownload={false}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}