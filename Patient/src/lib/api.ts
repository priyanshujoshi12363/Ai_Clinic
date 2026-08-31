import axios from 'axios';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

export const http = axios.create({
  baseURL: BASE_URL,
  timeout: 240000,
  headers: { 'Content-Type': 'application/json' }
});

export type AudioPayload = { audios: string[]; format: string; language: string } | null;

export interface KnownPatient {
  abhaId: string;
  name: string;
  age: number | null;
  gender: string;
  mobile?: string;
  faceUrl?: string | null;
  conditions: string[];
  allergies: string[];
  medicines: string[];
  totalVisits?: number;
  lastVisitDate?: string | null;
  hasDigitisedRecords?: boolean;
}

export interface TurnResult {
  transcript?: string;
  understood: Record<string, string>;
  confirmation?: string;
  question: string;
  section: string | null;
  redFlags: string[];
  urgency: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  language: string;
  languageSwitched?: boolean;
  detectedLanguage?: string | null;
  audio: AudioPayload;
  progress: { covered: number; total: number; percent: number };
  done: boolean;
  heardNothing?: boolean;
}

export interface ExtractedDocument {
  documentId: string;
  fileUrl: string | null;
  documentType: string;
  date: string | null;
  hospital: string;
  doctor: string;
  diagnoses: string[];
  medicines: { name: string; dosage?: string; frequency?: string; duration?: string }[];
  investigations: { name: string; value?: string; unit?: string; referenceRange?: string; abnormal?: boolean }[];
  procedures: { name: string; date?: string }[];
  uncertain: string[];
  confidence: number;
  needsVerification: boolean;
  totalDocuments?: number;
}

export interface ReviewResult {
  summary: string;
  chiefComplaint: string;
  keyPoints: string[];
  redFlags: string[];
  urgency: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  understood: Record<string, string>;
  documents: ExtractedDocument[];
  patientReadBack: string;
  language: string;
  audio: AudioPayload;
}

const unwrap = <T,>(response: { data: { success: boolean; data: T; message?: string } }): T => {
  if (!response.data.success) throw new Error(response.data.message || 'Request failed');
  return response.data.data;
};

const post = async <T,>(path: string, body?: unknown): Promise<T> => {
  try {
    return unwrap<T>(await http.post(path, body ?? {}));
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Network error');
  }
};

export const api = {
  pipelineHealth: async () => {
    const response = await http.get('/voice/health');
    return response.data.data as {
      llm: { success: boolean; model: string; modelAvailable: boolean };
      speech: { configured: boolean };
      face: { reachable: boolean };
      readyForVoiceIntake: boolean;
    };
  },

  speak: (text: string, language: string) =>
    post<{ audios: string[]; format: string; language: string }>('/voice/tts', { text, language }),

  startSession: (language: string, kioskId = 'KIOSK_01') =>
    post<{ sessionId: string; language: string; stage: string }>('/intake/start', { language, kioskId }),

  identifyByFace: (sessionId: string, faceImage: string) =>
    post<{ found: boolean; confidence?: number; reason?: string; patient?: KnownPatient }>(
      `/intake/${sessionId}/identify/face`,
      { faceImage }
    ),

  identifyByAbha: (sessionId: string, abhaId: string) =>
    post<{ found: boolean; patient: KnownPatient }>(`/intake/${sessionId}/identify/abha`, { abhaId }),

  consent: (sessionId: string, scope: { caseTaking: boolean; previousRecords: boolean; shareWithDoctor: boolean }) =>
    post<{ consentGiven: boolean }>(`/intake/${sessionId}/consent`, scope),

  selectMode: (sessionId: string, mode: 'GENERAL_OPD' | 'AYUSH') =>
    post<{ mode: string; sections: { key: string; label: string }[] }>(`/intake/${sessionId}/mode`, { mode }),

  beginInterview: (sessionId: string) =>
    post<TurnResult>(`/intake/${sessionId}/interview/begin`),

  interviewTurn: (sessionId: string, payload: { audio?: string; mimeType?: string; text?: string }) =>
    post<TurnResult>(`/intake/${sessionId}/interview/turn`, payload),

  correct: (sessionId: string, payload: { audio?: string; mimeType?: string; text?: string }) =>
    post<{ transcript: string; understood: Record<string, string>; acknowledgement: string; language: string; audio: AudioPayload }>(
      `/intake/${sessionId}/interview/correct`,
      payload
    ),

  addDocument: (sessionId: string, image: string) =>
    post<ExtractedDocument>(`/intake/${sessionId}/documents`, { image }),

  confirmDocument: (sessionId: string, documentId: string, confirmed: boolean) =>
    post<{ documentId: string }>(`/intake/${sessionId}/documents/${documentId}/confirm`, { confirmed }),

  skipDocuments: (sessionId: string) =>
    post<{ stage: string }>(`/intake/${sessionId}/documents/skip`),

  review: (sessionId: string) => post<ReviewResult>(`/intake/${sessionId}/review`),

  finalize: (sessionId: string) =>
    post<{
      visitId: string;
      tokenNumber: string;
      urgency: string;
      redFlags: string[];
      priorityTriage: boolean;
      queuedFor: string;
      audio: AudioPayload;
    }>(`/intake/${sessionId}/finalize`, { confirmed: true }),

  abandon: async (sessionId: string) => {
    try {
      await http.delete(`/intake/${sessionId}`);
    } catch {
      return;
    }
  },

  createEmergency: (symptoms: string, patientName?: string) =>
    post<{ tokenNumber: string; patientName: string; symptoms: string; queuePosition: number; status: string }>(
      '/emergency/handle',
      { symptoms, patientName }
    ),

  transcribe: (audio: string, mimeType: string) =>
    post<{ transcript: string; detectedLanguage: string | null }>('/voice/stt', { audio, mimeType })
};
