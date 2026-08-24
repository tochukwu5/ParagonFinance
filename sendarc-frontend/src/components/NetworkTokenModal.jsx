import { useState, useEffect } from 'react'
import { CoinIcon } from './CoinLogos'

// Network icons arrive as one of two kinds of string: an emoji ('⬡') or a
// path to an image ('/ethlogo.svg'). React renders both as text unless we
// branch on which it is and wrap image paths in an <img> — printing the raw
// path is what produced "/ethlogo.svg Ethereum Sepolia" in the list.
function isImageIcon(icon) {
  if (typeof icon !== 'string') return false
  return (
    icon.startsWith('/') ||
    icon.startsWith('http') ||
    icon.startsWith('data:') ||
    /\.(svg|png|jpe?g|webp|gif)$/i.test(icon)
  )
}

function NetworkIcon({ icon, name, size = 18, className = '' }) {
  if (!icon) return null

  if (isImageIcon(icon)) {
    return (
      <img
        src={icon}
        alt={name || 'network'}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={'inline-block object-contain rounded-full shrink-0 ' + className}
      />
    )
  }

  return (
    <span
      style={{ fontSize: size, lineHeight: 1 }}
      className={'inline-block shrink-0 ' + className}
      aria-hidden="true"
    >
      {icon}
    </span>
  )
}

// networks: [{ key, name, icon, enabled, usdcAddress }]
export default function NetworkTokenModal({ open, onClose, title, networks, activeKey, onSelect }) {
  const [search, setSearch] = useState('')
  const [paneKey, setPaneKey] = useState(activeKey)

  useEffect(() => { if (open) setPaneKey(activeKey) }, [open, activeKey])

  if (!open) return null

  const filtered = networks.filter(n => n.name.toLowerCase().includes(search.toLowerCase()))
  const paneNetwork = networks.find(n => n.key === paneKey)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#0f1822] border border-[#1e2530] rounded-2xl w-full max-w-2xl flex flex-col sm:flex-row overflow-hidden shadow-2xl h-[85vh] sm:h-[440px] max-h-[600px]"
      >
        {/* Network list — full width row on mobile, side rail on larger screens */}
        <div className="w-full sm:w-56 border-b sm:border-b-0 sm:border-r border-[#1e2530] flex flex-col flex-shrink-0 min-h-0 max-h-[36vh] sm:max-h-none">
          <div className="p-3">
            <input
              type="text"
              placeholder="Search Network"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#1e2530] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00D4FF] transition-colors"
            />
          </div>
          <p className="px-4 text-[9px] tracking-widest text-[#8892a0] mb-1">TOP CHAINS</p>
          <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
            {filtered.length === 0 && (
              <p className="text-center text-[11px] text-[#556] py-6">No networks match "{search}"</p>
            )}
            {filtered.map(n => (
              <button
                key={n.key}
                onClick={() => n.enabled && setPaneKey(n.key)}
                disabled={!n.enabled}
                className={
                  'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs text-left transition-colors mb-0.5 ' +
                  (!n.enabled ? 'opacity-40 cursor-not-allowed text-[#8892a0]' :
                    paneKey === n.key ? 'bg-[#1e2530] text-white font-semibold' : 'text-[#c5cdd6] hover:bg-[#161d27]')
                }
              >
                {/* iconNode is used when the caller pre-built an element;
                    otherwise NetworkIcon works it out from the raw value. */}
                {n.iconNode || <NetworkIcon icon={n.icon} name={n.name} size={18} />}
                <span className="flex-1 truncate">{n.name}</span>
                {!n.enabled && <span className="text-[8px] text-[#556] flex-shrink-0">Soon</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Token for selected network */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1e2530] flex-shrink-0">
            <h3 className="font-bold font-['Space_Grotesk'] text-white text-sm">{title}</h3>
            <button onClick={onClose} className="text-[#8892a0] hover:text-white transition-colors">✕</button>
          </div>

          {/* Which network the token below belongs to — without this the
              right pane gives no indication of what's selected on mobile,
              where the list collapses to a short scrollable strip. */}
          {paneNetwork && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1e2530] flex-shrink-0">
              {paneNetwork.iconNode || <NetworkIcon icon={paneNetwork.icon} name={paneNetwork.name} size={16} />}
              <span className="text-[11px] text-[#8892a0]">{paneNetwork.name}</span>
            </div>
          )}

          <div className="p-3 flex-shrink-0">
            <input
              type="text"
              placeholder="search token name or paste address"
              disabled
              className="w-full bg-[#0D1117] border border-[#1e2530] rounded-lg px-3 py-2 text-xs text-[#556] outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 min-h-0">
            {paneNetwork ? (
              <button
                onClick={() => { onSelect(paneNetwork.key); onClose() }}
                className="w-full flex items-center justify-between gap-2 px-2 sm:px-3 py-3 rounded-xl hover:bg-[#1e2530] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CoinIcon symbol="USDC" size={32} />
                  <div className="text-left min-w-0">
                    <p className="text-white text-sm font-semibold">USDC</p>
                    <p className="text-[#8892a0] text-xs">USD Coin</p>
                  </div>
                </div>
                <span className="text-[#8892a0] text-[10px] font-mono flex-shrink-0">
                  {paneNetwork.usdcAddress ? paneNetwork.usdcAddress.slice(0, 6) + '…' + paneNetwork.usdcAddress.slice(-4) : ''}
                </span>
              </button>
            ) : (
              <p className="text-center text-xs text-[#556] py-10">Select a network above</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}