import React, { useState } from 'react'
import { api, type LabTest } from '../lib/api'

const field = 'w-full px-2.5 py-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-400 outline-none text-sm'

const LabUpload: React.FC<{ abhaId: string; onDone: () => void }> = ({ abhaId, onDone }) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [fileType, setFileType] = useState('image/jpeg')
  const [labName, setLabName] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState('')
  const [tests, setTests] = useState<LabTest[] | null>(null)
  const [err, setErr] = useState('')

  const onFile = (f?: File) => {
    if (!f) return
    setFileType(f.type); setTests(null); setErr('')
    const r = new FileReader()
    r.onload = () => { const url = r.result as string; setDataUrl(url); setPreview(f.type.startsWith('image/') ? url : null) }
    r.readAsDataURL(f)
  }

  const upload = async () => {
    if (!dataUrl) return
    setBusy(true); setErr(''); setStage('Uploading & running OCR…')
    try {
      const res = await api.uploadLab(abhaId, { file: dataUrl, fileType, labName, notes })
      setTests(res.tests || [])
      setStage(res.ocr?.status === 'FAILED' ? 'Saved (OCR unavailable)' : `Saved · ${res.tests?.length || 0} results extracted`)
      onDone()
    } catch (e: any) { setErr(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="relative flex flex-col items-center justify-center h-44 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-teal-50/50 hover:border-teal-300 cursor-pointer transition overflow-hidden">
          {preview
            ? <img src={preview} alt="report" className="absolute inset-0 w-full h-full object-contain p-2" />
            : <div className="text-center text-slate-400">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
                <div className="text-sm font-semibold text-slate-600">Upload lab report image</div>
                <div className="text-xs">JPG / PNG · OCR will extract the values</div>
              </div>}
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
        </label>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Lab / source (optional — OCR can auto-detect)</label>
            <input value={labName} onChange={e => setLabName(e.target.value)} placeholder="e.g. City Diagnostics" className={field} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Fasting sample" className={field} />
          </div>
          <button onClick={upload} disabled={!dataUrl || busy}
            className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 disabled:opacity-40 transition">
            {busy ? stage : 'Upload & extract with OCR'}
          </button>
          {stage && !busy && <div className="text-xs text-emerald-600 font-medium text-center">{stage}</div>}
          {err && <div className="text-xs text-red-600 text-center">{err}</div>}
        </div>
      </div>

      {tests && tests.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-2">Extracted results (OCR)</div>
          <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-400">
                <tr><th className="text-left py-2 px-3 font-semibold">Test</th><th className="text-left py-2 px-3 font-semibold">Value</th><th className="text-left py-2 px-3 font-semibold">Unit</th><th className="text-left py-2 px-3 font-semibold">Reference</th><th className="text-left py-2 px-3 font-semibold">Flag</th></tr>
              </thead>
              <tbody>
                {tests.map((t, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-2 px-3 font-medium text-slate-700">{t.name}</td>
                    <td className={`py-2 px-3 font-semibold ${t.abnormal ? 'text-red-600' : 'text-slate-700'}`}>{t.value}</td>
                    <td className="py-2 px-3 text-slate-500">{t.unit}</td>
                    <td className="py-2 px-3 text-slate-500">{t.normalRange}</td>
                    <td className="py-2 px-3">{t.abnormal ? <span className="text-[11px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">ABNORMAL</span> : <span className="text-[11px] text-emerald-600">Normal</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tests && tests.length === 0 && (
        <div className="text-sm text-slate-500 bg-amber-50 ring-1 ring-amber-200 rounded-xl px-4 py-3">
          Report saved, but OCR couldn't read structured values from this image. The file is stored on the patient's record.
        </div>
      )}
    </div>
  )
}

export default LabUpload
