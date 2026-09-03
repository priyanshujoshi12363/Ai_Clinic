import React, { useEffect, useRef, useState } from 'react'
import { api, type Medicine, type RxMedicine } from '../lib/api'

export interface RxDraft { meds: RxMedicine[]; diagnosis: string; advice: string }

const TIMINGS = ['After food', 'Before food', 'Empty stomach', 'With food', 'At bedtime', 'As needed']
const FREQS = ['1-0-1', '1-1-1', '1-0-0', '0-0-1', '0-1-0', 'SOS', 'Once weekly']

const field = 'w-full px-2.5 py-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-400 outline-none text-sm'

const MedicineSearch: React.FC<{ onPick: (m: Medicine) => void }> = ({ onPick }) => {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Medicine[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<any>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try { setResults(await api.searchMedicines(q)); setOpen(true) } catch { /* noop */ }
    }, 180)
    return () => clearTimeout(timer.current)
  }, [q])

  return (
    <div className="relative">
      <div className="relative">
        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
        <input
          value={q} onChange={e => setQ(e.target.value)} onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search a medicine to add — name or generic…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-400 outline-none text-sm"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1.5 w-full max-h-72 overflow-auto bg-white rounded-xl ring-1 ring-slate-200 shadow-xl">
          {results.map(m => (
            <button key={m._id} onMouseDown={() => { onPick(m); setQ('') }}
              className="w-full text-left px-3.5 py-2.5 hover:bg-teal-50 border-b border-slate-100 last:border-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800 text-sm">{m.name} <span className="text-slate-400 font-normal">{m.strength}</span></span>
                {m.system === 'AYUSH' && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">AYUSH</span>}
              </div>
              <div className="text-[11px] text-slate-400">{m.generic} · {m.form} · {m.category}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const PrescriptionBuilder: React.FC<{
  draft: RxDraft; setDraft: (d: RxDraft) => void
  onSave: () => Promise<void>; onPrint: () => void; saving: boolean; saved: boolean
}> = ({ draft, setDraft, onSave, onPrint, saving, saved }) => {
  const add = (m: Medicine) => setDraft({
    ...draft,
    meds: [...draft.meds, {
      name: m.name, dosage: m.strength || '', frequency: m.defaultFrequency || '1-0-1',
      timing: m.defaultTiming || 'After food', duration: m.defaultDuration || '5 days', quantity: undefined
    }]
  })
  const upd = (i: number, patch: Partial<RxMedicine>) =>
    setDraft({ ...draft, meds: draft.meds.map((r, k) => k === i ? { ...r, ...patch } : r) })
  const del = (i: number) => setDraft({ ...draft, meds: draft.meds.filter((_, k) => k !== i) })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Diagnosis</label>
        <input value={draft.diagnosis} onChange={e => setDraft({ ...draft, diagnosis: e.target.value })}
          placeholder="e.g. Acute pharyngitis" className={field} />
      </div>

      <MedicineSearch onPick={add} />

      {draft.meds.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-8 border-2 border-dashed border-slate-200 rounded-xl">
          Search above and click a medicine to build the prescription.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-2 font-semibold">Medicine</th>
                <th className="py-2 px-2 font-semibold w-24">Strength</th>
                <th className="py-2 px-2 font-semibold w-32">Frequency</th>
                <th className="py-2 px-2 font-semibold w-40">When / food</th>
                <th className="py-2 px-2 font-semibold w-24">Duration</th>
                <th className="py-2 px-2 font-semibold w-16">Qty</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {draft.meds.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 align-top">
                  <td className="py-2 pr-2"><input value={r.name} onChange={e => upd(i, { name: e.target.value })} className={field} /></td>
                  <td className="py-2 px-2"><input value={r.dosage} onChange={e => upd(i, { dosage: e.target.value })} className={field} /></td>
                  <td className="py-2 px-2">
                    <input list={`freq${i}`} value={r.frequency} onChange={e => upd(i, { frequency: e.target.value })} className={field} />
                    <datalist id={`freq${i}`}>{FREQS.map(f => <option key={f} value={f} />)}</datalist>
                  </td>
                  <td className="py-2 px-2">
                    <select value={r.timing} onChange={e => upd(i, { timing: e.target.value })} className={field}>
                      {TIMINGS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="py-2 px-2"><input value={r.duration} onChange={e => upd(i, { duration: e.target.value })} className={field} /></td>
                  <td className="py-2 px-2"><input value={r.quantity ?? ''} onChange={e => upd(i, { quantity: Number(e.target.value) || undefined })} className={field} /></td>
                  <td className="py-2 text-right">
                    <button onClick={() => del(i)} className="text-slate-300 hover:text-red-500 text-lg leading-none">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Advice / instructions</label>
        <textarea value={draft.advice} onChange={e => setDraft({ ...draft, advice: e.target.value })} rows={2}
          placeholder="e.g. Warm saline gargle, plenty of fluids, review in 3 days." className={field} />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button onClick={onSave} disabled={saving || draft.meds.length === 0}
          className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
          {saving ? 'Saving…' : saved ? '✓ Saved to record' : 'Save prescription'}
        </button>
        <button onClick={onPrint} disabled={draft.meds.length === 0}
          className="px-5 py-2.5 rounded-xl bg-white ring-1 ring-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-40 transition">
          🖨 Print prescription
        </button>
        <span className="text-xs text-slate-400">Saves to the patient's ABHA record & history.</span>
      </div>
    </div>
  )
}

export default PrescriptionBuilder
