import axios from 'axios';

const KIOSK_API = 'http://localhost:4000';

const normalizeBase = (value: string) => value.trim().replace(/\/+$/, '');

const resolveBaseUrl = (): string => {
  const runtime = (globalThis as any).__API_BASE__;
  if (typeof runtime === 'string' && runtime.trim()) return normalizeBase(runtime);

  const build = (import.meta as any).env?.VITE_API_URL;
  if (typeof build === 'string' && build.trim()) return normalizeBase(build);

  return KIOSK_API;
};

export const BASE_URL = resolveBaseUrl();

export const isRemoteBackend = /^https?:\/\/(?!localhost|127\.0\.0\.1|\[::1\])/i.test(BASE_URL);

export const http = axios.create({
  baseURL: BASE_URL,
  timeout: 300000,
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

export interface EssentialQuestion {
  key: string;
  question: string;
}

export interface EmergencyIntake {
  tokenNumber: string;
  transcript: string;
  language: string;
  detectedLanguage: string | null;
  chiefComplaint: string;
  triageLevel: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
  triageLabel: string;
  targetMinutes: number;
  urgency: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  suspectedCategory: string;
  routedSpecialization?: string;
  redFlags: string[];
  aiSummary: string;
  keyPoints: string[];
  essentialQuestions: EssentialQuestion[];
  patientReassurance: string;
  queuePosition: number;
  audio: AudioPayload;
  heardNothing?: boolean;
}

export interface EmergencyAnswer {
  tokenNumber: string;
  transcript: string;
  answered: number;
  totalQuestions: number;
  nextQuestion: EssentialQuestion | null;
  triageLevel: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
  triageLabel: string;
  triageChanged: boolean;
  triageReason: string;
  urgency: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  redFlags: string[];
  queuePosition: number;
  language: string;
  done: boolean;
  audio: AudioPayload;
  heardNothing?: boolean;
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
  wake: async (attempts = 3): Promise<boolean> => {
    for (let i = 0; i < attempts; i++) {
      try {
        await http.get('/', { timeout: 90000 });
        return true;
      } catch {
        if (i === attempts - 1) return false;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    return false;
  },

  pipelineHealth: async () => {
    const response = await http.get('/voice/health', { timeout: 90000 });
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

  identifyByAbha: (sessionId: string, abhaId: string, faceImage?: string) =>
    post<{ found: boolean; faceLinked?: boolean; reason?: string; patient?: KnownPatient }>(
      `/intake/${sessionId}/identify/abha`,
      { abhaId, ...(faceImage ? { faceImage } : {}) }
    ),

  verifyAadhaar: (sessionId: string, aadhaarNumber: string) =>
    post<{
      found: boolean;
      reason?: string;
      name?: string;
      dateOfBirth?: string;
      gender?: string;
      alreadyRegistered?: boolean;
      abhaId?: string | null;
      otp?: string | null;
      mobile?: string | null;
    }>(`/intake/${sessionId}/identify/aadhaar/verify`, { aadhaarNumber }),

  registerByAadhaar: (sessionId: string, aadhaarNumber: string, otp: string, faceImage: string) =>
    post<{ registered: boolean; alreadyRegistered?: boolean; newAbhaId?: string; patient?: KnownPatient }>(
      `/intake/${sessionId}/identify/aadhaar/register`,
      { aadhaarNumber, otp, faceImage }
    ),

  intent: (sessionId: string, payload: { audio?: string; mimeType?: string; text?: string; task: 'yesno' | 'mode' | 'haveAbha' | 'ready' }) =>
    post<{ transcript?: string; intent?: string; language?: string; heardNothing?: boolean }>(
      `/intake/${sessionId}/intent`,
      payload
    ),

  transcribeField: (sessionId: string, payload: { audio: string; mimeType?: string; field: 'digits' | 'aadhaar' | 'text'; expected?: number }) =>
    post<{ transcript?: string; digits?: string; language?: string; heardNothing?: boolean }>(
      `/intake/${sessionId}/transcribe`,
      payload
    ),

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

  emergencyIntake: (payload: { audio?: string; mimeType?: string; text?: string; language: string }) =>
    post<EmergencyIntake>('/emergency/intake', payload),

  emergencyAnswer: (
    tokenNumber: string,
    payload: { audio?: string; mimeType?: string; text?: string; key?: string; question?: string }
  ) => post<EmergencyAnswer>(`/emergency/${tokenNumber}/answer`, payload),

  emergencyIdentify: (tokenNumber: string, payload: { faceImage?: string; abhaId?: string; patientName?: string }) =>
    post<{ found: boolean; reason?: string; patient?: KnownPatient; knownHistory?: Record<string, unknown> }>(
      `/emergency/${tokenNumber}/identify`,
      payload
    ),

  transcribe: (audio: string, mimeType: string) =>
    post<{ transcript: string; detectedLanguage: string | null }>('/voice/stt', { audio, mimeType })
};
