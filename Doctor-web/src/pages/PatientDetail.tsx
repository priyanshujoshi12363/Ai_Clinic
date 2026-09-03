import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, type PatientDetail as PD } from '../lib/api'
import { TopBar, Card, Avatar, UrgencyBadge, Chip } from '../components/ui'
import PrescriptionBuilder, { type RxDraft } from '../components/PrescriptionBuilder'
import PrintSheet from '../components/PrintSheet'
import LabUpload from '../components/LabUpload'

type Tab = 'prescribe' | 'labs' | 'history'

export default function PatientDetail() {
  const { abhaId = '' } = useParams()
  const [p, setP] = useState<PD | null>(null)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState<Tab>('prescribe')
  const [draft, setDraft] = useState<RxDraft>({ meds: [], diagnosis: '', advice: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = () => api.patient(abhaId).then(setP).catch(e => setErr(e.message))
  useEffect(() => { load() }, [abhaId])

  const save = async () => {
    setSaving(true); setSaved(false)
    try {
      await api.prescribe(abhaId, {
        doctorName: 'Dr. A. Verma', specialty: 'General Medicine',
        diagnosis: draft.diagnosis, instructions: draft.advice, medicines: draft.meds,
      })
      setSaved(true); await load()
    } catch (e: any) { setErr(e.message) }
    finally { setSaving(false) }
  }

  const kp = p?.latestVisit?.aiKeyPoints || []
  const rf = p?.latestVisit?.aiRedFlags || []

  if (err) return <div><TopBar /><div className="max-w-3xl mx-auto p-8 text-red-600">{err}</div></div>
  if (!p) return <div><TopBar /><div className="max-w-3xl mx-auto p-8 text-slate-400">Loading patient…</div></div>

  return (
    <div className="min-h-full">
      <TopBar right={<Link to="/" className="text-sm text-slate-500 hover:text-teal-600 font-medium">← Queue</Link>} />
      <main className="max-w-7xl mx-auto px-6 py-6 grid lg:grid-cols-[340px,1fr] gap-6 items-start">

        {/* LEFT — patient card + AI summary (no full conversation) */}
        <div className="space-y-5 lg:sticky lg:top-20">
          <Card className="p-5">
            <div className="flex items-center gap-3.5">
              <Avatar name={p.name} url={p.faceUrl} size={56} />
              <div className="min-w-0">
                <div className="font-extrabold text-slate-800 text-lg leading-tight">{p.name}</div>
                <div className="text-sm text-slate-500">{p.age ?? '—'} yrs · {p.gender}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.abhaId}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <UrgencyBadge level={p.latestVisit?.urgency} />
              {p.latestVisit?.consultationType && <Chip tone="teal">{p.latestVisit.consultationType}</Chip>}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 rounded-xl py-2"><div className="text-lg font-bold text-slate-800">{p.totalVisits}</div><div className="text-[11px] text-slate-400">Visits</div></div>
              <div className="bg-slate-50 rounded-xl py-2"><div className="text-lg font-bold text-slate-800">{p.totalPrescriptions}</div><div className="text-[11px] text-slate-400">Prescriptions</div></div>
            </div>
            {(p.allergies.length > 0 || p.conditions.length > 0) && (
              <div className="mt-4 space-y-2">
                {p.allergies.length > 0 && <div className="flex flex-wrap gap-1.5">{p.allergies.map(a => <Chip key={a} tone="red">⚠ {a}</Chip>)}</div>}
                {p.conditions.length > 0 && <div className="flex flex-wrap gap-1.5">{p.conditions.map(c => <Chip key={c}>{c}</Chip>)}</div>}
              </div>
            )}
          </Card>

          {/* AI intake summary — concise, not the raw transcript */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">AI INTAKE SUMMARY</span>
            </div>
            {p.latestVisit?.chiefComplaint && <div className="text-sm text-slate-700 mb-2"><b>CC:</b> {p.latestVisit.chiefComplaint}</div>}
            {p.latestVisit?.aiSummary
              ? <pre className="text-[13px] text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">{p.latestVisit.aiSummary}</pre>
              : <div className="text-sm text-slate-400">No AI summary on file.</div>}
            {rf.length > 0 && (
              <div className="mt-3 bg-red-50 ring-1 ring-red-200 rounded-lg px-3 py-2">
                <div className="text-[11px] font-bold text-red-600 mb-1">RED FLAGS</div>
                <ul className="text-xs text-red-700 list-disc pl-4 space-y-0.5">{rf.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            )}
            {kp.length > 0 && (
              <ul className="mt-3 text-xs text-slate-500 space-y-1">
                {kp.slice(0, 5).map((k, i) => <li key={i} className="flex gap-1.5"><span className="text-teal-400">▸</span>{k}</li>)}
              </ul>
            )}
          </Card>
        </div>

        {/* RIGHT — tabs */}
        <Card className="p-0 overflow-hidden">
          <div className="flex border-b border-slate-200 px-2">
            {([['prescribe', '℞  Prescribe'], ['labs', '🧪  Lab reports'], ['history', '🕑  History']] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-3.5 text-sm font-semibold border-b-2 -mb-px transition ${tab === t ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'prescribe' && (
              <PrescriptionBuilder draft={draft} setDraft={d => { setDraft(d); setSaved(false) }}
                onSave={save} onPrint={() => window.print()} saving={saving} saved={saved} />
            )}

            {tab === 'labs' && (
              <div className="space-y-6">
                <LabUpload abhaId={abhaId} onDone={load} />
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2">Reports on file ({p.documents.filter(d => d.type === 'LAB_REPORT').length})</div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {p.documents.filter(d => d.type === 'LAB_REPORT').map(d => (
                      <a key={d.documentId} href={d.fileUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl ring-1 ring-slate-200 hover:ring-teal-300 hover:bg-teal-50/40 transition">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">🧪</div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-700 truncate">{d.sourceHospital || 'Lab report'}</div>
                          <div className="text-[11px] text-slate-400">{new Date(d.date).toLocaleDateString()} · {d.extractedInfo?.tests?.length || 0} results</div>
                        </div>
                      </a>
                    ))}
                    {p.documents.filter(d => d.type === 'LAB_REPORT').length === 0 && <div className="text-sm text-slate-400">No lab reports yet.</div>}
                  </div>
                </div>
              </div>
            )}

            {tab === 'history' && (
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-3">Prescription history</div>
                  <div className="space-y-3">
                    {p.prescriptions.length === 0 && <div className="text-sm text-slate-400">No prescriptions yet.</div>}
                    {p.prescriptions.map(rx => (
                      <div key={rx.prescriptionId} className="rounded-xl ring-1 ring-slate-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold text-slate-700">{rx.diagnosis || 'Prescription'}</div>
                          <div className="text-[11px] text-slate-400">{new Date(rx.date).toLocaleString()} · {rx.doctorName}</div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {rx.medicines.map((m, i) => (
                            <span key={i} className="text-xs bg-slate-100 text-slate-600 rounded-md px-2 py-1">
                              <b>{m.name}</b> {m.dosage} · {m.frequency} · {m.timing} · {m.duration}
                            </span>
                          ))}
                        </div>
                        {rx.instructions && <div className="text-xs text-slate-500 mt-2">Advice: {rx.instructions}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-3">Timeline</div>
                  <ol className="relative border-l-2 border-slate-100 ml-1.5 space-y-4">
                    {p.timeline.map((t, i) => (
                      <li key={i} className="ml-4">
                        <div className="absolute -left-[7px] w-3 h-3 rounded-full bg-teal-400 ring-2 ring-white" />
                        <div className="text-[11px] text-slate-400">{new Date(t.date).toLocaleDateString()} · {t.type}</div>
                        <div className="text-sm text-slate-600">{t.description}</div>
                      </li>
                    ))}
                    {p.timeline.length === 0 && <li className="ml-4 text-sm text-slate-400">No history yet.</li>}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </Card>
      </main>

      {/* hidden print sheet */}
      <PrintSheet patient={p} draft={draft} />
    </div>
  )
}
