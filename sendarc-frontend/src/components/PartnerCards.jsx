import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// Announcement cards shown beside the testnet app. Content is deliberately
// short — this sits in peripheral vision next to a form someone is filling
// in, so anything longer than a couple of lines goes unread.
const CARDS = [
  {
    id: 'unitflow',
    accent: '#00D4FF',
    logo: '/dex/unitflow.webp',
    title: 'UnitFlow liquidity, integrated',
    body:
      'Paragon Finance routes swaps through UnitFlow, one of the deepest liquidity venues on Arc. ' +
      'Every quote is checked against their pools so you get the fill they can actually deliver.',
    cta: { label: 'Try a swap', to: '/testnet/send' },
  },
  {
    id: 'synthra',
    accent: '#8B5CF6',
    logo: '/dex/synthra11.svg',
    title: 'Synthra joins the routing layer',
    body:
      'Synthra brings chain-abstracted execution to Paragon. We now quote both venues on every ' +
      'swap and route to whichever returns more — you keep the difference.',
    cta: { label: 'See live quotes', to: '/testnet/send' },
  },
    {
    id: 'tower',
    accent: '#8B5CF6',
    logo: '/dex/tower11.svg',
    title: 'Tower Exchange routing, integrated',
    body:
      'Paragon Finance routes swaps through TowerExchange to access deep liquidity and competitive execution across Arc ' +
      'More liquidity. Better routes. Better swaps.',
    cta: { label: 'See live quotes', to: '/testnet/send' },
  },
  {
    id: 'aggregation',
    accent: '#00FFCC',
    logo: null,
    emoji: '🔀',
    title: 'One quote from every venue',
    body:
      'Rather than picking a single pool and hoping, Paragon queries each connected source in ' +
      'parallel and shows you what each one offers. The best route is highlighted, and it is the ' +
      'one that executes.',
    cta: { label: 'How routing works', to: '/how-it-works' },
  },
  {
    id: 'arc',
    accent: '#00D4FF',
    logo: null,
    emoji: '⚡',
    title: 'Settled on Arc in under a second',
    body:
      'Gas is paid in USDC, so what you are quoted is what you pay — no separate token to acquire ' +
      'first, and no volatile fee between quote and confirmation.',
    cta: { label: 'Read the docs', to: '/docs' },
  },
]

const INTERVAL_MS = 3000

export default function PartnerCards() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const touchStartX = useRef(null)

  // Auto-advance, paused on hover. Reading a card while it slides away is
  // the fastest way to make a carousel annoying rather than useful.
  useEffect(() => {
    if (paused || dismissed) return

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const t = setInterval(() => {
      setIndex(i => (i + 1) % CARDS.length)
    }, INTERVAL_MS)

    return () => clearInterval(t)
  }, [paused, dismissed])

  if (dismissed) return null

  const card = CARDS[index]

  const go = (dir) => {
    setIndex(i => (i + dir + CARDS.length) % CARDS.length)
  }

  // Swipe support. The cards are desktop-only, but trackpad and touchscreen
  // laptops both send touch events, so it costs little to handle them.
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1)
    touchStartX.current = null
  }

  return (
    // hidden below lg: this sits in the right margin, and there is no right
    // margin on a phone. Stacking it above the swap form would push the
    // actual task below the fold.
    <aside
      className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 w-[320px] z-30"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label="Partner announcements"
    >
      <div
        className="relative bg-[#0f1822] border border-[#1e2530] rounded-2xl p-5 overflow-hidden transition-all duration-300"
        style={{ boxShadow: '0 0 40px -12px ' + card.accent + '25' }}
      >
        {/* Accent wash, tinted per card so each partner reads distinctly
            without needing a different layout. */}
        <div
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
          style={{ background: card.accent }}
        />

        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#161d28] flex items-center justify-center text-[#5b6573] hover:text-white hover:bg-[#1c232e] transition-all text-xs z-10"
        >
          ✕
        </button>

        <div className="relative">
          {/* Fixed height so the card doesn't resize as content changes —
              a box that jumps between heights every six seconds is worse
              than one that occasionally has whitespace. */}
          <div className="min-h-[188px] flex flex-col">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
              style={{ background: card.accent + '15', border: '1px solid ' + card.accent + '35' }}
            >
              {card.logo ? (
                <img src={card.logo} alt="" className="w-6 h-6 object-contain" />
              ) : (
                <span className="text-xl">{card.emoji}</span>
              )}
            </div>

            <h3 className="font-bold font-['Space_Grotesk'] text-white text-[15px] mb-2 leading-snug">
              {card.title}
            </h3>
            <p className="text-xs text-[#8892a0] leading-relaxed flex-1">
              {card.body}
            </p>

            <Link
              to={card.cta.to}
              className="inline-flex items-center gap-1.5 text-xs font-semibold mt-4 hover:gap-2.5 transition-all w-fit"
              style={{ color: card.accent }}
            >
              {card.cta.label} →
            </Link>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1e2530]">
            <div className="flex gap-1.5">
              {CARDS.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setIndex(i)}
                  aria-label={'Show ' + c.title}
                  className={
                    'h-1 rounded-full transition-all duration-300 ' +
                    (i === index ? 'w-5' : 'w-1.5 bg-[#2a3340] hover:bg-[#3a4350]')
                  }
                  style={i === index ? { background: card.accent } : undefined}
                />
              ))}
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => go(-1)}
                aria-label="Previous"
                className="w-6 h-6 rounded-lg border border-[#1e2530] flex items-center justify-center text-[#5b6573] hover:text-white hover:border-[#2a3340] transition-all text-xs"
              >
                ←
              </button>
              <button
                onClick={() => go(1)}
                aria-label="Next"
                className="w-6 h-6 rounded-lg border border-[#1e2530] flex items-center justify-center text-[#5b6573] hover:text-white hover:border-[#2a3340] transition-all text-xs"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}