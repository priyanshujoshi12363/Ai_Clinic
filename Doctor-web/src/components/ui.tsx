import React from 'react'
import { Link } from 'react-router-dom'

export const Logo = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-700 flex items-center justify-center text-white font-extrabold shadow-sm">S</div>
    <div className="leading-tight">
      <div className="font-extrabold text-slate-800 text-[15px] tracking-tight">SwasthAI</div>
      <div className="text-[10px] text-slate-400 font-medium -mt-0.5">Doctor Console</div>
    </div>
  </div>
)

export const TopBar: React.FC<{ right?: React.ReactNode }> = ({ right }) => (
  <header className="no-print sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <Link to="/"><Logo /></Link>
      <div className="flex items-center gap-4">
        {right}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">DR</div>
          <div className="text-sm leading-tight hidden sm:block">
            <div className="font-semibold text-slate-700">Dr. A. Verma</div>
            <div className="text-[11px] text-slate-400">General Medicine</div>
          </div>
        </div>
      </div>
    </div>
  </header>
)

const URGENCY: Record<string, string> = {
  EMERGENCY: 'bg-red-50 text-red-700 ring-red-200',
  URGENT: 'bg-amber-50 text-amber-800 ring-amber-200',
  ROUTINE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}
export const UrgencyBadge: React.FC<{ level?: string }> = ({ level = 'ROUTINE' }) => (
  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ring-1 ${URGENCY[level] || URGENCY.ROUTINE}`}>
    {level === 'EMERGENCY' && '⚠ '}{level}
  </span>
)

export const Chip: React.FC<{ children: React.ReactNode; tone?: 'red' | 'slate' | 'teal' }> = ({ children, tone = 'slate' }) => {
  const t = tone === 'red' ? 'bg-red-50 text-red-700 ring-red-200'
    : tone === 'teal' ? 'bg-teal-50 text-teal-700 ring-teal-200'
    : 'bg-slate-100 text-slate-600 ring-slate-200'
  return <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-md ring-1 ${t}`}>{children}</span>
}

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm ${className}`}>{children}</div>
)

export const Avatar: React.FC<{ name: string; url?: string | null; size?: number }> = ({ name, url, size = 44 }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return url
    ? <img src={url} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover ring-2 ring-white shadow" />
    : <div style={{ width: size, height: size }} className="rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 text-white font-bold flex items-center justify-center shadow">{initials}</div>
}
