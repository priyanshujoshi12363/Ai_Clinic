import axios from 'axios'

const BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000'
export const http = axios.create({ baseURL: BASE, timeout: 120000 })

export interface QueuePatient {
  abhaId: string; name: string; age: number | null; gender: string; mobile?: string
  faceUrl?: string | null; lastVisitDate?: string | null; totalVisits: number
  chiefComplaint: string; urgency: 'EMERGENCY' | 'URGENT' | 'ROUTINE'; tokenNumber?: string | null
  conditions: string[]; allergies: string[]
}

export interface Medicine {
  _id: string; name: string; generic?: string; form?: string; strength?: string
  category?: string; defaultFrequency?: string; defaultTiming?: string; defaultDuration?: string; system?: string
}

export interface RxMedicine {
  name: string; dosage?: string; frequency?: string; timing?: string; duration?: string; quantity?: number
}
export interface Prescription {
  prescriptionId: string; date: string; doctorName?: string; specialty?: string
  medicines: RxMedicine[]; diagnosis?: string; instructions?: string
}
export interface LabTest { name: string; value?: string; unit?: string; normalRange?: string; abnormal?: boolean }
export interface Doc { documentId: string; type: string; date: string; sourceHospital?: string; fileUrl: string; extractedInfo?: { tests?: LabTest[] }; doctorNotes?: string; ocrStatus?: string }
export interface TimelineItem { type: string; date: string; description: string; source?: string }

export interface PatientDetail {
  abhaId: string; name: string; age: number | null; gender: string; dateOfBirth?: string
  mobile?: string; preferredLanguage?: string; faceUrl?: string | null
  conditions: string[]; allergies: string[]; medicalHistory: any
  latestVisit?: {
    visitId: string; date: string; chiefComplaint?: string; consultationType?: string
    urgency?: string; aiSummary?: string; aiKeyPoints?: string[]; aiRedFlags?: string[]
  } | null
  prescriptions: Prescription[]; labReports: any[]; documents: Doc[]; timeline: TimelineItem[]
  totalVisits: number; totalPrescriptions: number
}

const unwrap = (r: any) => { if (!r.data?.success) throw new Error(r.data?.message || 'Request failed'); return r.data.data }

export const api = {
  queue: async (): Promise<QueuePatient[]> => unwrap(await http.get('/clinical/queue')),
  patient: async (abhaId: string): Promise<PatientDetail> => unwrap(await http.get(`/clinical/patient/${abhaId}`)),
  searchMedicines: async (q: string): Promise<Medicine[]> => unwrap(await http.get('/clinical/medicines', { params: { q } })),
  prescribe: async (abhaId: string, body: any) => unwrap(await http.post(`/clinical/patient/${abhaId}/prescription`, body)),
  uploadLab: async (abhaId: string, body: any) => unwrap(await http.post(`/clinical/patient/${abhaId}/lab-report`, body)),
}
