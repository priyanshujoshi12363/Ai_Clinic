import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type QueuePatient } from '../lib/api'
import { TopBar, Card, Avatar, UrgencyBadge, Chip } from '../components/ui'

const rank = (u: string) => (u === 'EMERGENCY' ? 0 : u === 'URGENT' ? 1 : 2)

export default function Dashboard() {
  const nav = useNavigate()
  const [patients, setPatients] = useState<QueuePatient[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    api.queue().then(setPatients).catch(e => setErr(e.message)).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const list = patients.filter(p =>
      !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.abhaId.toLowerCase().includes(q.toLowerCase()))
    return [...list].sort((a, b) => rank(a.urgency) - rank(b.urgency) ||
      (new Date(b.lastVisitDate || 0).getTime() - new Date(a.lastVisitDate || 0).getTime()))
  }, [patients, q])

  const stats = useMemo(() => ({
    total: patients.length,
    emergency: patients.filter(p => p.urgency === 'EMERGENCY').length,
    urgent: patients.filter(p => p.urgency === 'URGENT').length,
  }), [patients])

  return (
    <div className="min-h-full">
      <TopBar />
      <main className="max-w-7xl mx-auto px-6 py-7">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Patient queue</h1>
            <p className="text-sm text-slate-500 mt-0.5">Intake completed by SwasthAI — ready for consult</p>
          </div>
          <div className="relative">
            <input
              value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search name or ABHA ID…"
              className="w-72 pl-10 pr-3 py-2.5 rounded-xl bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-400 outline-none text-sm"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          </div>
        </div>

        {/* stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          {[
            ['Waiting', stats.total, 'text-slate-800', 'bg-slate-100'],
            ['Emergency', stats.emergency, 'text-red-600', 'bg-red-50'],
            ['Urgent', stats.urgent, 'text-amber-600', 'bg-amber-50'],
            ['Avg. intake', '3m', 'text-teal-600', 'bg-teal-50'],
          ].map(([label, val, tc, bg]) => (
            <Card key={label as string} className="p-4">
              <div className={`w-9 h-9 rounded-lg ${bg} mb-3`} />
              <div className={`text-2xl font-extrabold ${tc}`}>{val as any}</div>
              <div className="text-xs text-slate-500 font-medium">{label as string}</div>
            </Card>
          ))}
        </div>

        {loading && <div className="text-slate-400 text-sm py-16 text-center">Loading queue…</div>}
        {err && <Card className="p-4 text-red-600 text-sm">{err}</Card>}

        <div className="grid gap-3">
          {filtered.map(p => (
            <button key={p.abhaId} onClick={() => nav(`/patient/${p.abhaId}`)}
              className="group text-left">
              <Card className="p-4 flex items-center gap-4 hover:ring-teal-300 hover:shadow-md transition">
                <Avatar name={p.name} url={p.faceUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-800">{p.name}</span>
                    <span className="text-xs text-slate-400">{p.age ?? '—'}{p.gender ? ` · ${p.gender}` : ''}</span>
                    <UrgencyBadge level={p.urgency} />
                  </div>
                  <div className="text-sm text-slate-500 truncate mt-0.5">{p.chiefComplaint || 'No complaint recorded'}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {p.allergies.slice(0, 2).map(a => <Chip key={a} tone="red">Allergy: {a}</Chip>)}
                    {p.conditions.slice(0, 3).map(c => <Chip key={c}>{c}</Chip>)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {p.tokenNumber && <div className="text-xs font-mono text-slate-400">{p.tokenNumber}</div>}
                  <div className="text-[11px] text-slate-400 mt-1">{p.abhaId}</div>
                  <div className="mt-2 inline-flex items-center gap-1 text-teal-600 text-sm font-semibold group-hover:gap-2 transition-all">
                    Open <span>→</span>
                  </div>
                </div>
              </Card>
            </button>
          ))}
          {!loading && filtered.length === 0 && !err && (
            <div className="text-center text-slate-400 text-sm py-16">No patients match “{q}”.</div>
          )}
        </div>
      </main>
    </div>
  )
}
