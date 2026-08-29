// Shared reusable components

export function Badge({ children, variant = 'cyan' }) {
  const styles = {
    cyan: 'bg-[rgba(0,212,255,0.1)] border-[#00D4FF] text-[#00D4FF]',
    green: 'bg-[rgba(34,197,94,0.1)] border-green-500 text-green-400',
    red: 'bg-[rgba(239,68,68,0.1)] border-red-500 text-red-400',
    amber: 'bg-[rgba(245,158,11,0.1)] border-amber-500 text-amber-400',
    muted: 'bg-[#0f1822] border-[#1e2530] text-[#8892a0]',
  }
  return (
    <span className={`inline-block border text-[11px] font-semibold tracking-widest px-3 py-1 rounded-full font-['Space_Grotesk'] ${styles[variant]}`}>
      {children}
    </span>
  )
}

export function Card({ children, className = '', glow = false }) {
  return (
    <div className={`bg-[#0f1822] border border-[#1e2530] rounded-xl ${glow ? 'border-[#00D4FF] shadow-[0_0_24px_rgba(0,212,255,0.08)]' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-semibold tracking-[2px] text-[#00D4FF] font-['Space_Grotesk'] mb-3">
      {children}
    </p>
  )
}

export function StatCard({ value, label }) {
  return (
    <div className="bg-[#0f1822] border border-[#1e2530] rounded-xl p-5 text-center">
      <div className="text-3xl font-bold text-[#00D4FF] font-['Space_Grotesk'] mb-1">{value}</div>
      <div className="text-[11px] tracking-widest text-[#8892a0] font-['Space_Grotesk']">{label}</div>
    </div>
  )
}

export function StatusBadge({ status }) {
  if (status === 'confirmed') return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.1)] border border-green-500 text-green-400">Confirmed</span>
  )
  if (status === 'pending') return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.1)] border border-amber-500 text-amber-400">Pending</span>
  )
  if (status === 'failed') return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.1)] border border-red-500 text-red-400">Failed</span>
  )
  return null
}

export function LiveBadge({ text = 'Live' }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.1)] border border-green-500 text-green-400">
      {/* <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> */}
      {text}
    </span>
  )
}

export function Divider() {
  return <div className="border-t border-[#1e2530]" />
}

export function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${sizes[size]} border-2 border-[#1e2530] border-t-[#00D4FF] rounded-full animate-spin`} />
  )
}
