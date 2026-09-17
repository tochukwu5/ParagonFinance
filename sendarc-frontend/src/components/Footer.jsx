import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-[#1e2530] bg-[#0D1117] mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/logo.jpg" alt="Paragon Finance" className="h-9 w-9 rounded-lg object-contain" />
              <span className="font-['Space_Grotesk'] text-xl font-bold text-white">Paragon </span>
              <span className="font-['Space_Grotesk'] text-xl font-bold text-[#00D4FF] -ml-1.5">Finance</span>
            </div>
            <p className="text-sm text-[#8892a0] leading-relaxed max-w-xs mb-4">
             Your money should work across borders, not be limited by them.
              Send, receive, swap, and access DeFi with USDC  all through one global financial
               infrastructure, powered by Arc.
            </p>
            <div className="flex items-center gap-2 bg-[#0f1822] border border-[#1e2530] rounded-lg px-3 py-2 w-fit">
              <span className="text-xs text-[#8892a0]">Built on</span>
              <span className="text-xs font-bold text-[#00D4FF]">Arc Network</span>
              <span className="text-xs text-[#8892a0]">by Circle</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs section-label mb-4">PRODUCT</p>
            <div className="flex flex-col gap-3">
              {[
                { to: '/how-it-works', label: 'How it works' },
                { to: '/features', label: 'Features' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="text-sm text-[#8892a0] hover:text-white transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs section-label mb-4">COMPANY</p>
            <div className="flex flex-col gap-3">
              {[
                { to: '/about', label: 'About' },
                { to: '/docs', label: 'Documentation' },
                { href: 'https://twitter.com/ParagonFinance_', label: 'Twitter / X' },
                { href: 'https://www.arc.network', label: 'Arc Network' },
                { href: 'https://www.circle.com', label: 'Circle (USDC)' },
              ].map(l => (
                l.href
                  ? <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="text-sm text-[#8892a0] hover:text-white transition-colors">{l.label}</a>
                  : <Link key={l.to} to={l.to} className="text-sm text-[#8892a0] hover:text-white transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#1e2530] pt-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#556]">
              Paragon Finance © 2026. All rights reserved.
            </p>

            {/* Legal links. Grouped here rather than in the column above
                because they're obligations, not navigation — people look for
                them in exactly this spot. */}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {[
                { to: '/legal/privacy', label: 'Privacy' },
                { to: '/legal/terms', label: 'Terms & Conditions' },
                { to: '/legal/imprint', label: 'Imprint' },
                { to: '/legal', label: 'All Legal Documents' },
              ].map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="text-xs text-[#556] hover:text-[#8892a0] transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Registration details. A registered entity is a trust signal most
              projects at this stage can't show — worth stating plainly rather
              than burying on an About page. */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-center md:text-left">
            <p className="text-[10px] text-[#3a4450] leading-relaxed">
              Paragon Tech Ventures · RC 9834873 · Registered in Nigeria under
              the Companies and Allied Matters Act 2020
            </p>
            <span className="text-[10px] text-[#3a4450]">
              Testnet · Not financial advice
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}