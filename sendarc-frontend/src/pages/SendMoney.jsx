import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { COUNTRIES, CHAINS } from '../data/constants'
import { Card, Badge, LoadingSpinner } from '../components/UI'

const STEPS = ['Connect Wallet', 'Send Details', 'Review & Confirm', 'Transaction Complete']

export default function SendMoney() {
  const { wallet, isConnected } = useWallet()
  const navigate = useNavigate()
  const [step, setStep] = useState(isConnected ? 1 : 0)
  const [selectedChain, setSelectedChain] = useState(CHAINS[0])
  const [amount, setAmount] = useState(100)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [recipientAddress, setRecipientAddress] = useState('')
  const [processing, setProcessing] = useState(false)

  const received = (amount * selectedCountry.rate).toLocaleString()
  const liveCountries = COUNTRIES.filter(c => c.status === 'live')

  // Fake TX hash for the send page (real hash comes from useArcTestnet on testnet)
  const MOCK_TX_HASH = '0x7d4f2a8b3c91e5f6a0d2b4c8e1f3a5b7c9d2e4f6a8b0c2d9e3f5a7b1c4d6e8f'
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleCopyTxId = async () => {
    try {
      await navigator.clipboard.writeText(MOCK_TX_HASH)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = MOCK_TX_HASH
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadPDF = () => {
    setPdfLoading(true)
    const date = new Date().toLocaleString()
    const html = `
      <html>
        <head>
          <title>Paragon Finance Receipt</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; color: #111; padding: 48px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #e5e7eb; padding-bottom: 24px; }
            .brand { font-size: 28px; font-weight: 900; color: #0ea5e9; letter-spacing: -0.5px; }
            .brand span { color: #111; }
            .meta { text-align: right; font-size: 12px; color: #6b7280; line-height: 1.6; }
            .badge { display: inline-block; background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 99px; border: 1px solid #86efac; margin-bottom: 24px; }
            .amount-block { margin-bottom: 32px; }
            .amount-big { font-size: 48px; font-weight: 900; color: #111; line-height: 1; }
            .amount-sub { font-size: 18px; color: #0ea5e9; font-weight: 600; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            tr { border-bottom: 1px solid #f3f4f6; }
            td { padding: 12px 4px; font-size: 13px; }
            td:first-child { color: #6b7280; width: 40%; }
            td:last-child { color: #111; font-weight: 600; text-align: right; word-break: break-all; }
            .hash { font-family: monospace; font-size: 11px; color: #6b7280; }
            .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
            @media print {
              body { padding: 32px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">Paragon<span>Finance</span></div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px;">Transaction Receipt</div>
            </div>
            <div class="meta">
              <div>Arc Network · Chain 5042002</div>
              <div>${date}</div>
              <div>paragonfinance.xyz</div>
            </div>
          </div>
          <div class="badge">✓ CONFIRMED · FINAL</div>
          <div class="amount-block">
            <div class="amount-big">${amount} USDC</div>
            <div class="amount-sub">${selectedCountry.symbol}${received} ${selectedCountry.currency} received</div>
          </div>
          <table>
            <tr><td>You Sent</td><td>${amount} USDC</td></tr>
            <tr><td>They Received</td><td>${selectedCountry.symbol}${received} ${selectedCountry.currency}</td></tr>
            <tr><td>Exchange Rate</td><td>1 USDC = ${selectedCountry.symbol}${selectedCountry.rate}</td></tr>
            <tr><td>Arc Network Fee</td><td>$0.003 USDC</td></tr>
            <tr><td>Settlement Time</td><td>&lt; 1 second</td></tr>
            <tr><td>Network</td><td>Arc Testnet (Chain 5042002)</td></tr>
            <tr><td>Recipient</td><td class="hash">${recipientAddress || '0x0000...0000'}</td></tr>
            <tr><td>TX Hash</td><td class="hash">${MOCK_TX_HASH}</td></tr>
            <tr><td>Date</td><td>${date}</td></tr>
          </table>
          <div class="footer">This is a testnet receipt · Paragon Finance · Powered by Arc Network · Circle USDC</div>
        </body>
      </html>
    `
    const win = window.open('', '_blank', 'width=800,height=900')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      setPdfLoading(false)
    }, 400)
  }

  const handleShareWhatsApp = () => {
    const msg =
      '*Money Sent via Paragon Finance!*\n\n' +
      'Sent: *' + amount + ' USDC*\n' +
      'Received: *' + selectedCountry.symbol + received + ' ' + selectedCountry.currency + '*\n' +
      'Fee: *$0.003 USDC*\n' +
      'Settled in under 1 second\n\n' +
      'TX: ' + MOCK_TX_HASH.slice(0, 20) + '...\n\n' +
      'Powered by Arc Network - paragonfinance.xyz'
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer')
  }

  const handleSend = async () => {
    setProcessing(true)
    await new Promise(r => setTimeout(r, 2000)) // simulate tx
    setProcessing(false)
    setStep(3)
  }

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Top bar */}
      <div className="border-b border-[#1e2530] bg-[#0D1117] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-[#8892a0] hover:text-white text-sm transition-colors">← Back</button>
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Paragon Finance" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-['Space_Grotesk'] font-bold text-lg text-white">Paragon</span>
            <span className="font-['Space_Grotesk'] font-bold text-lg text-[#00D4FF] -ml-1">Finance</span>
          </div>
        </div>
        {wallet && (
          <div className="flex items-center gap-2 bg-[#0f1822] border border-[#1e2530] rounded-lg px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-mono text-white">{wallet.shortAddress}</span>
            <span className="text-xs text-[#00D4FF] font-semibold">{wallet.balance} USDC</span>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left — Steps + Form */}
        <div className="lg:col-span-3">
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] mb-1">Send Money</h1>
          <p className="text-[#8892a0] text-sm mb-8">Fast, cheap, and transparent — powered by Arc Network</p>

          {/* Step indicators */}
          <div className="space-y-3 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                i === step ? 'bg-[#0a2030] border-[#00D4FF]' :
                i < step ? 'border-[#1e2530] bg-[#0f1822]' : 'border-[#1e2530] opacity-40'
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i < step ? 'bg-[#00D4FF] text-[#0D1117]' :
                  i === step ? 'border-2 border-[#00D4FF] text-[#00D4FF]' : 'border border-[#1e2530] text-[#8892a0]'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <div>
                  <p className={`text-sm font-semibold font-['Space_Grotesk'] ${i === step ? 'text-white' : 'text-[#8892a0]'}`}>{s}</p>
                  <p className="text-xs text-[#556]">{['Connect your wallet', 'Amount & recipient', 'Check before sending', 'Receipt generated'][i]}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Step 0 — Connect */}
          {step === 0 && (
            <Card className="p-6 text-center">
              <p className="text-[#8892a0] mb-4">Connect your wallet to continue</p>
              <button onClick={() => navigate('/connect')} className="bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-all">
                Connect Wallet
              </button>
            </Card>
          )}

          {/* Step 1 — Send Details */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Source chain */}
              <Card className="p-5">
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-3">SOURCE CHAIN</p>
                <div className="flex gap-2 flex-wrap">
                  {CHAINS.map(c => (
                    <button key={c.id} onClick={() => setSelectedChain(c)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-['Space_Grotesk'] font-semibold transition-all ${
                        selectedChain.id === c.id ? 'bg-[#0a2030] border-[#00D4FF] text-[#00D4FF]' : 'border-[#1e2530] text-[#8892a0] hover:border-[#00D4FF]'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                {selectedChain.id !== 'arc' && (
                  <p className="text-xs text-amber-400 mt-3">⚠ This chain routes via Circle CCTP bridge — slight delay may apply</p>
                )}

                {/* Amount */}
                <div className="mt-5">
                  <p className="text-[10px] tracking-widest text-[#8892a0] mb-2">AMOUNT</p>
                  <div className="flex items-center gap-3 bg-[#0D1117] border border-[#1e2530] rounded-lg px-4 py-3">
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(Number(e.target.value) || 0)}
                      className="flex-1 bg-transparent text-white text-2xl font-bold outline-none font-['Space_Grotesk']"
                    />
                    <span className="text-sm text-white bg-[#1e2530] px-3 py-1 rounded-md">🇺🇸 USDC ▼</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#8892a0] mt-2">
                    <span>Your Balance</span><span className="text-[#00D4FF]">{wallet?.balance || '0.00'} USDC</span>
                  </div>
                  {wallet && (
                    <div className="flex justify-between text-xs text-[#8892a0] mt-1">
                      <span>After Send</span><span>{(parseFloat(wallet.balance.replace(',','')) - amount).toLocaleString()} USDC</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Recipient */}
              <Card className="p-5">
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-3">RECIPIENT RECEIVES (TO)</p>
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-2">DESTINATION COUNTRY</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {liveCountries.map(c => (
                    <button key={c.code} onClick={() => setSelectedCountry(c)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-['Space_Grotesk'] font-semibold transition-all ${
                        selectedCountry.code === c.code ? 'bg-[#0a2030] border-[#00D4FF] text-[#00D4FF]' : 'border-[#1e2530] text-[#8892a0] hover:border-[#00D4FF]'
                      }`}
                    >
                      {c.flag} {c.name}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] tracking-widest text-[#8892a0] mb-2">THEY RECEIVE</p>
                <div className="flex items-center gap-3 bg-[#0D1117] border border-[#1e2530] rounded-lg px-4 py-3 mb-4">
                  <span className="flex-1 text-2xl font-bold text-[#00D4FF] font-['Space_Grotesk']">{received}</span>
                  <span className="text-sm text-white bg-[#1e2530] px-3 py-1 rounded-md">{selectedCountry.flag} {selectedCountry.currency} ▼</span>
                </div>

                <div className="space-y-2 text-sm text-[#8892a0] mb-4">
                  <div className="flex justify-between"><span>Exchange Rate</span><span className="text-[#00D4FF]">1 USDC = {selectedCountry.symbol}{selectedCountry.rate.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Network Fee (Arc)</span><span className="text-[#00D4FF]">~$0.003</span></div>
                  <div className="flex justify-between"><span>You Save vs. Wire Transfer</span><span className="text-green-400">~$24.97</span></div>
                </div>

                <p className="text-[10px] tracking-widest text-[#8892a0] mb-2">RECIPIENT WALLET ADDRESS</p>
                <input
                  type="text"
                  placeholder="0x... wallet address"
                  value={recipientAddress}
                  onChange={e => setRecipientAddress(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#1e2530] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-[#00D4FF] transition-colors font-mono"
                />
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs text-[#556]">— or —</span>
                  <button className="text-xs text-[#00D4FF] hover:underline">📱 Scan QR Code</button>
                </div>
              </Card>

              <button
                onClick={() => setStep(2)}
                disabled={!recipientAddress || amount <= 0}
                className="w-full bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Review & Send ${amount} USDC →
              </button>
              <p className="text-center text-xs text-[#556]">Secured by Arc Network · $0.003 fee · &lt;1 second settlement</p>
            </div>
          )}

          {/* Step 2 — Review */}
          {step === 2 && (
            <div className="space-y-4">
              <Card className="p-5">
                <p className="text-[10px] tracking-widest text-[#8892a0] mb-4">REVIEW TRANSACTION</p>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'You Send', value: `${amount} USDC`, accent: false },
                    { label: 'They Receive', value: `${selectedCountry.symbol}${received} ${selectedCountry.currency}`, accent: true },
                    { label: 'Exchange Rate', value: `1 USDC = ${selectedCountry.symbol}${selectedCountry.rate}`, accent: true },
                    { label: 'Arc Network Fee', value: '$0.003 USDC', accent: false },
                    { label: 'Settlement Time', value: '< 1 second', accent: true },
                    { label: 'Recipient', value: recipientAddress || '0x8f2a...4e91', accent: false },
                    { label: 'Network', value: selectedChain.name, accent: false },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between border-b border-[#1e2530] pb-2">
                      <span className="text-[#8892a0]">{r.label}</span>
                      <span className={`font-semibold ${r.accent ? 'text-[#00D4FF]' : 'text-white'}`}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-[#1e2530] text-[#8892a0] py-3 rounded-xl hover:border-[#00D4FF] transition-all font-['Space_Grotesk'] font-semibold text-sm">
                  Edit
                </button>
                <button
                  onClick={handleSend}
                  disabled={processing}
                  className="flex-2 flex-grow-[2] bg-[#00D4FF] text-[#0D1117] font-['Space_Grotesk'] font-bold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {processing ? <><LoadingSpinner size="sm" /> Processing…</> : 'Confirm & Sign →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Success */}
          {step === 3 && (
            <Card glow className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center mx-auto mb-5 text-2xl">✓</div>
              <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-1">Money Sent <span className="text-green-400">Successfully!</span></h2>
              <p className="text-[#8892a0] text-sm mb-2">Your transaction was confirmed on Arc Network</p>
              <p className="text-xs text-[#00D4FF] mb-8">Settlement time: <strong>0.78 seconds</strong> · {new Date().toLocaleDateString()}</p>

              <div className="bg-[#0D1117] border border-[#1e2530] rounded-xl p-5 text-left mb-5 space-y-3 text-sm">
                {[
                  { l: 'You Sent', v: `${amount} USDC`, a: false },
                  { l: 'They Received', v: `${selectedCountry.symbol}${received}`, a: true },
                  { l: 'Status', v: 'Confirmed · FINAL', a: true },
                  { l: 'Fee Paid', v: '$0.003 USDC', a: false },
                  { l: 'Network', v: 'Arc Testnet', a: false },
                ].map(r => (
                  <div key={r.l} className="flex justify-between border-b border-[#1e2530] pb-2">
                    <span className="text-[#8892a0]">{r.l}</span>
                    <span className={r.a ? 'text-[#00D4FF] font-bold' : 'text-white'}>{r.v}</span>
                  </div>
                ))}
                <p className="text-[10px] text-[#00D4FF] font-mono break-all">0x7d4f2a8b3c91e5f6a0d2b4c8e1f3a5b7c9d2e4f6a8b0c2d...</p>
              </div>

              <div className="flex gap-3 mb-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  className={"flex-1 border border-[#00D4FF] text-[#00D4FF] py-3 rounded-xl text-sm font-['Space_Grotesk'] font-bold hover:bg-[#0a2030] transition-all disabled:opacity-60"}
                >
                  {pdfLoading ? '⏳ Generating...' : '↓ Download Receipt PDF'}
                </button>
                <button
                  onClick={handleCopyTxId}
                  className={"flex-1 border py-3 rounded-xl text-sm hover:border-[#00D4FF] transition-all " + (copied ? 'border-green-500 text-green-400' : 'border-[#1e2530] text-[#8892a0]')}
                >
                  {copied ? '✓ Copied!' : '📋 Copy TX ID'}
                </button>
              </div>
              <button
                onClick={handleShareWhatsApp}
                className="w-full border border-[#25D366] text-[#25D366] py-3 rounded-xl text-sm hover:bg-[#25D366]/10 transition-all mb-4 font-semibold"
              >
                📱 Share Receipt via WhatsApp
              </button>
              <button onClick={() => { setStep(1); setRecipientAddress(''); }} className="text-sm text-[#00D4FF] hover:underline">
                Send Another Transfer →
              </button>
            </Card>
          )}
        </div>

        {/* Right — Summary sidebar */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <p className="text-[10px] tracking-widest text-[#8892a0] mb-4">TRANSACTION SUMMARY</p>
            <div className="text-4xl font-bold font-['Space_Grotesk'] mb-1">${amount}</div>
            <p className="text-xs text-[#8892a0] mb-5">{amount} USDC → {selectedCountry.symbol}{received} {selectedCountry.currency}</p>
            <div className="space-y-2 text-sm">
              {[
                { l: 'You Send', v: `${amount} USDC` },
                { l: 'Exchange Rate', v: `${selectedCountry.symbol}${selectedCountry.rate}` },
                { l: 'Arc Network Fee', v: '~$0.003' },
                { l: 'Settlement Time', v: '< 1 second', color: 'text-[#00D4FF]' },
                { l: 'They Receive', v: `${selectedCountry.symbol}${received} ${selectedCountry.currency}`, color: 'text-[#00D4FF] font-bold' },
                { l: 'On-Chain Receipt', v: 'Auto Generated', color: 'text-[#00D4FF]' },
              ].map(r => (
                <div key={r.l} className="flex justify-between border-b border-[#1e2530] pb-2">
                  <span className="text-[#8892a0]">{r.l}</span>
                  <span className={r.color || 'text-white'}>{r.v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[10px] tracking-widest text-[#8892a0] mb-4">FEE COMPARISON</p>
            <div className="space-y-2 text-sm">
              {[
                { name: 'Paragon Finance (Arc Network)', fee: '~$0.003', sub: 'Under 1 second · 24/7', best: true },
                { name: 'Western Union', fee: '~$5.00', sub: '1-5 business days' },
                { name: 'Bank Wire', fee: '~$25.00', sub: '2-5 business days' },
                { name: 'PayPal', fee: '~$4.99', sub: '3-5 days to withdraw' },
              ].map(c => (
                <div key={c.name} className={`flex justify-between items-start p-2 rounded-lg ${c.best ? 'bg-[#0a2030]' : ''}`}>
                  <div>
                    <p className={`text-xs font-semibold ${c.best ? 'text-white' : 'text-[#8892a0]'}`}>{c.name}</p>
                    <p className="text-[10px] text-[#556]">{c.sub}</p>
                  </div>
                  <span className={`text-sm font-bold ${c.best ? 'text-[#00D4FF]' : 'text-red-400'}`}>{c.fee}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}