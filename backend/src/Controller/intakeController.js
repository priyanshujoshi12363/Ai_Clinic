import { v4 as uuidv4 } from 'uuid';
import IntakeSession from '../Models/IntakeSession.model.js';
import Patient from '../Models/abha.model.js';
import HIS from '../Models/HIS.model.js';
import cloudinary from '../utils/cloudinary.js';
import { findPatientByFace } from '../services/faceSearchService.js';
import { speechToText, textToSpeech, normalizeLanguage } from '../services/sarvamService.js';
import {
  runInterviewTurn,
  generateSummary,
  applyCorrection,
  extractDocument,
  sectionsForMode,
  detectRedFlags,
  highestUrgency,
  classifyIntent,
  extractDigits
} from '../services/intakeEngine.js';
import { linkFaceToABHA, getPatientByABHA as getAbhaSummary } from '../services/abhaLinkService.js';
import {
  findAadhaarByNumber,
  generateOTP,
  registerPatientWithAadhaarAndFace
} from '../services/registrationService.js';

const MIN_CHARS_FOR_LANGUAGE_SWITCH = 8;

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

const patientAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

const patientContext = async (abhaId) => {
  if (!abhaId) return null;
  const patient = await Patient.findOne({ abhaId });
  if (!patient) return null;

  return {
    doc: patient,
    name: patient.name,
    age: patientAge(patient.dateOfBirth),
    gender: patient.gender,
    conditions: (patient.medicalHistory?.conditions || []).map((c) => `${c.name}${c.diagnosedDate ? ` (since ${c.diagnosedDate})` : ''}`),
    allergies: (patient.medicalHistory?.allergies || []).map((a) => a.allergen),
    medicines: (patient.prescriptions || []).flatMap((p) => (p.medicines || []).map((m) => `${m.name} ${m.dosage || ''}`.trim()))
  };
};

const speak = async (text, language) => {
  if (!text) return null;
  const result = await textToSpeech(text, language);
  return result.success ? { audios: result.audios, format: result.format, language: result.language } : null;
};

const loadSession = async (sessionId) => IntakeSession.findOne({ sessionId });

export const startSession = async (req, res) => {
  try {
    const { language = 'hi-IN', kioskId = 'KIOSK_01', hospitalId, hospitalName } = req.body;

    const session = new IntakeSession({
      sessionId: `INTAKE_${Date.now()}_${uuidv4().slice(0, 6)}`,
      language: normalizeLanguage(language),
      languageSelected: normalizeLanguage(language),
      kioskId,
      ...(hospitalId ? { hospitalId } : {}),
      ...(hospitalName ? { hospitalName } : {}),
      stage: 'CREATED'
    });

    await session.save();

    return ok(res, {
      sessionId: session.sessionId,
      language: session.language,
      stage: session.stage
    }, 201);
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const identifyByFace = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { faceImage, threshold } = req.body;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);
    if (!faceImage) return fail(res, 'Face image is required');

    const result = await findPatientByFace(faceImage, threshold || 0.75);

    if (!result.success) {
      return res.status(200).json({
        success: true,
        data: { found: false, reason: result.message, canRetry: true }
      });
    }

    if (!result.found) {
      return ok(res, {
        found: false,
        confidence: result.confidence,
        threshold: result.threshold,
        reason: 'No matching patient. Use ABHA ID, Aadhaar, or register.',
        canRetry: true
      });
    }

    session.abhaId = result.data.abhaId;
    session.patientName = result.data.name;
    session.identificationMethod = 'FACE';
    session.faceConfidence = result.confidence;
    session.stage = 'IDENTIFIED';
    await session.save();

    const context = await patientContext(result.data.abhaId);

    return ok(res, {
      found: true,
      confidence: result.confidence,
      patient: {
        abhaId: result.data.abhaId,
        name: result.data.name,
        age: patientAge(result.data.dateOfBirth),
        gender: result.data.gender,
        mobile: result.data.mobile,
        faceUrl: result.data.faceData?.faceUrl || null,
        conditions: context?.conditions || [],
        allergies: context?.allergies || [],
        medicines: context?.medicines || [],
        totalVisits: result.data.totalVisits,
        lastVisitDate: result.data.lastVisitDate,
        hasDigitisedRecords: (context?.doc?.documents?.length || 0) > 0
      },
      stage: session.stage
    });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

const patientCard = (context, extra = {}) => ({
  abhaId: context.doc.abhaId,
  name: context.name,
  age: context.age,
  gender: context.gender,
  mobile: context.doc.mobile,
  conditions: context.conditions,
  allergies: context.allergies,
  medicines: context.medicines,
  totalVisits: context.doc.totalVisits,
  lastVisitDate: context.doc.lastVisitDate,
  hasDigitisedRecords: (context.doc.documents?.length || 0) > 0,
  ...extra
});

const cleanDigits = (value) => String(value || '').replace(/\D/g, '');

const safeDate = (value, fallback = null) => {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
};

export const transcribeField = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { audio, mimeType = 'audio/webm', field = 'digits', expected } = req.body;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);
    if (!audio) return fail(res, 'Audio is required');

    const heard = await speechToText(audio, { languageHint: 'unknown', mimeType });
    if (!heard.success) return fail(res, `Speech recognition failed: ${heard.message}`, 502);
    if (!heard.transcript) return ok(res, { heardNothing: true, language: session.language });

    if (heard.detectedLanguage && heard.transcript.length >= 8 && heard.detectedLanguage !== session.language) {
      session.language = heard.detectedLanguage;
      await session.save();
    }

    if (field === 'aadhaar' || field === 'digits') {
      const { digits } = await extractDigits({ transcript: heard.transcript, expected: expected || 12 });
      return ok(res, { transcript: heard.transcript, digits, language: session.language });
    }

    return ok(res, { transcript: heard.transcript, language: session.language });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const voiceIntent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { audio, mimeType = 'audio/webm', text, task = 'yesno' } = req.body;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);

    let transcript = (text || '').trim();

    if (!transcript) {
      if (!audio) return fail(res, 'Provide audio or text');
      const heard = await speechToText(audio, { languageHint: 'unknown', mimeType });
      if (!heard.success) return fail(res, `Speech recognition failed: ${heard.message}`, 502);
      transcript = (heard.transcript || '').trim();

      if (heard.detectedLanguage && transcript.length >= 8 && heard.detectedLanguage !== session.language) {
        session.language = heard.detectedLanguage;
        await session.save();
      }
    }

    if (!transcript) return ok(res, { heardNothing: true, language: session.language });

    const intent = await classifyIntent({ transcript, task, language: session.language });

    return ok(res, { transcript, intent, task, language: session.language });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const identifyByAbha = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { abhaId, method = 'ABHA', faceImage } = req.body;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);
    if (!abhaId) return fail(res, 'ABHA ID is required');

    const context = await patientContext(abhaId);
    if (!context) {
      return ok(res, { found: false, reason: 'No patient found for this ABHA ID' });
    }

    let faceLinked = false;
    const alreadyHasFace = Boolean(context.doc.faceData?.faceEmbedding?.length);

    if (faceImage && !alreadyHasFace) {
      const link = await linkFaceToABHA(abhaId, faceImage);
      faceLinked = link.success;
    }

    session.abhaId = context.doc.abhaId;
    session.patientName = context.name;
    session.identificationMethod = faceImage ? 'FACE' : method;
    session.stage = 'IDENTIFIED';
    await session.save();

    return ok(res, {
      found: true,
      faceLinked,
      patient: patientCard(context),
      stage: session.stage
    });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const verifyAadhaarForIntake = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { aadhaarNumber } = req.body;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);

    const digits = cleanDigits(aadhaarNumber);
    if (digits.length !== 12) return fail(res, 'Aadhaar must be 12 digits');

    const found = findAadhaarByNumber(digits);
    if (!found.success) return ok(res, { found: false, reason: 'Aadhaar not found in records' });

    const existing = await Patient.findOne({ aadhaarNumber: digits });
    const otpResult = generateOTP(digits);

    return ok(res, {
      found: true,
      name: found.data.name,
      dateOfBirth: found.data.dateOfBirth,
      gender: found.data.gender === 'M' ? 'Male' : found.data.gender === 'F' ? 'Female' : found.data.gender,
      alreadyRegistered: Boolean(existing),
      abhaId: existing?.abhaId || null,
      otp: otpResult.data?.otp || null,
      mobile: otpResult.data?.mobile || found.data.mobile || null
    });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const registerByAadhaar = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { aadhaarNumber, otp, faceImage } = req.body;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);

    const digits = cleanDigits(aadhaarNumber);
    if (digits.length !== 12) return fail(res, 'Aadhaar must be 12 digits');
    if (!otp) return fail(res, 'OTP is required');
    if (!faceImage) return fail(res, 'Face image is required to complete registration');

    const result = await registerPatientWithAadhaarAndFace(digits, otp, faceImage);
    if (!result.success) {
      if (result.data?.alreadyRegistered && result.data?.abhaId) {
        const context = await patientContext(result.data.abhaId);
        session.abhaId = result.data.abhaId;
        session.patientName = context?.name || result.data.name;
        session.identificationMethod = 'FACE';
        session.stage = 'IDENTIFIED';
        await session.save();
        return ok(res, { registered: false, alreadyRegistered: true, patient: context ? patientCard(context) : { abhaId: result.data.abhaId, name: result.data.name } });
      }
      return fail(res, result.message);
    }

    const context = await patientContext(result.data.abhaId);

    session.abhaId = result.data.abhaId;
    session.patientName = result.data.name;
    session.identificationMethod = 'FACE';
    session.isNewPatient = true;
    session.stage = 'IDENTIFIED';
    await session.save();

    return ok(res, {
      registered: true,
      newAbhaId: result.data.abhaId,
      patient: context ? patientCard(context, { isNewPatient: true }) : {
        abhaId: result.data.abhaId,
        name: result.data.name,
        gender: result.data.gender,
        isNewPatient: true,
        conditions: [],
        allergies: [],
        medicines: []
      },
      stage: session.stage
    });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const giveConsent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { caseTaking = true, previousRecords = true, shareWithDoctor = true } = req.body;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);

    session.consentGiven = Boolean(caseTaking && shareWithDoctor);
    session.consentAt = new Date();
    session.consentScope = { caseTaking, previousRecords, shareWithDoctor };
    if (session.consentGiven) session.stage = 'CONSENTED';
    await session.save();

    if (session.abhaId && session.consentGiven) {
      const patient = await Patient.findOne({ abhaId: session.abhaId });
      if (patient) {
        patient.consents.push({
          consentId: `CONSENT_${Date.now()}`,
          hospitalId: session.hospitalId,
          hospitalName: session.hospitalName,
          purpose: 'Pre-consultation AI clinical intake',
          status: 'GRANTED',
          dataAccess: {
            medicalHistory: previousRecords,
            labReports: previousRecords,
            prescriptions: previousRecords,
            previousDocuments: previousRecords,
            ayushHistory: previousRecords
          },
          grantedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          method: session.identificationMethod === 'FACE' ? 'FACE_RECOGNITION' : 'ELECTRONIC',
          faceVerified: session.identificationMethod === 'FACE',
          faceConfidence: session.faceConfidence || 0
        });
        await patient.save();
      }
    }

    return ok(res, { consentGiven: session.consentGiven, stage: session.stage });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const selectMode = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { mode } = req.body;

    if (!['GENERAL_OPD', 'AYUSH'].includes(mode)) {
      return fail(res, 'mode must be GENERAL_OPD or AYUSH');
    }

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);

    session.mode = mode;
    session.stage = 'MODE_SELECTED';
    await session.save();

    return ok(res, {
      mode,
      stage: session.stage,
      sections: sectionsForMode(mode).map((s) => ({ key: s.key, label: s.label }))
    });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const beginInterview = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);
    if (!session.consentGiven) return fail(res, 'Consent is required before the interview');

    const context = await patientContext(session.abhaId);

    const turn = await runInterviewTurn({
      mode: session.mode,
      language: session.language,
      patient: context,
      turns: [],
      understood: {},
      utterance: null,
      turnCount: 0
    });

    session.stage = 'INTERVIEW';
    session.understood = turn.understood;
    session.currentSection = turn.currentSection;
    session.pushTurn('assistant', turn.nextQuestion, { section: turn.currentSection });
    await session.save();

    const audio = await speak(turn.nextQuestion, session.language);

    return ok(res, {
      question: turn.nextQuestion,
      section: turn.currentSection,
      language: session.language,
      audio,
      progress: interviewProgress(session, turn),
      done: false
    });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

const interviewProgress = (session, turn) => {
  const sections = sectionsForMode(session.mode);
  const outstanding = turn?.outstanding || [];
  const covered = sections.length - outstanding.length;
  return {
    covered: Math.max(0, covered),
    total: sections.length,
    percent: Math.min(100, Math.round((Math.max(0, covered) / sections.length) * 100))
  };
};

export const interviewTurn = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { audio, mimeType = 'audio/webm', text } = req.body;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);
    if (session.interviewDone) return fail(res, 'Interview already finished');

    let utterance = (text || '').trim();
    let detectedLanguage = null;
    let languageSwitched = false;

    if (!utterance) {
      if (!audio) return fail(res, 'Provide either audio or text');

      const stt = await speechToText(audio, { languageHint: 'unknown', mimeType });
      if (!stt.success) return fail(res, `Speech recognition failed: ${stt.message}`, 502);
      if (!stt.transcript) {
        const retryPrompt = await speak('', session.language);
        return ok(res, {
          heardNothing: true,
          question: session.turns.filter((t) => t.role === 'assistant').slice(-1)[0]?.text || '',
          language: session.language,
          audio: retryPrompt
        });
      }

      utterance = stt.transcript;
      detectedLanguage = stt.detectedLanguage;
    }

    if (
      detectedLanguage &&
      detectedLanguage !== session.language &&
      utterance.length >= MIN_CHARS_FOR_LANGUAGE_SWITCH
    ) {
      session.languageSwitches.push({ from: session.language, to: detectedLanguage });
      session.language = detectedLanguage;
      languageSwitched = true;
    }

    session.pushTurn('user', utterance);
    session.turnCount += 1;

    const context = await patientContext(session.abhaId);

    const turn = await runInterviewTurn({
      mode: session.mode,
      language: session.language,
      patient: context,
      turns: session.turns.map((t) => ({ role: t.role, text: t.text })),
      understood: session.understood || {},
      utterance,
      turnCount: session.turnCount
    });

    session.understood = turn.understood;
    session.currentSection = turn.currentSection;
    session.redFlags = turn.redFlags;
    session.urgency = turn.urgency;
    session.interviewDone = turn.done;

    if (turn.nextQuestion) {
      session.pushTurn('assistant', turn.nextQuestion, { section: turn.currentSection });
    }
    if (turn.done) session.stage = 'DOCUMENTS';

    await session.save();

    const toSpeak = [turn.patientFacingConfirmation, turn.nextQuestion].filter(Boolean).join(' ');
    const audioOut = await speak(toSpeak, session.language);

    return ok(res, {
      transcript: utterance,
      understood: turn.understood,
      confirmation: turn.patientFacingConfirmation,
      question: turn.nextQuestion,
      section: turn.currentSection,
      redFlags: turn.redFlags,
      urgency: turn.urgency,
      language: session.language,
      languageSwitched,
      detectedLanguage,
      audio: audioOut,
      progress: interviewProgress(session, turn),
      done: turn.done
    });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const correctUnderstanding = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { audio, mimeType = 'audio/webm', text } = req.body;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);

    let correction = (text || '').trim();

    if (!correction) {
      if (!audio) return fail(res, 'Provide either audio or text');
      const stt = await speechToText(audio, { languageHint: 'unknown', mimeType });
      if (!stt.success) return fail(res, `Speech recognition failed: ${stt.message}`, 502);
      correction = stt.transcript;
      if (stt.detectedLanguage && stt.detectedLanguage !== session.language && correction.length >= MIN_CHARS_FOR_LANGUAGE_SWITCH) {
        session.languageSwitches.push({ from: session.language, to: stt.detectedLanguage });
        session.language = stt.detectedLanguage;
      }
    }

    if (!correction) return fail(res, 'Could not hear the correction');

    const result = await applyCorrection({
      language: session.language,
      understood: session.understood || {},
      correction
    });

    session.understood = result.understood;
    session.pushTurn('user', correction);
    if (result.acknowledgement) session.pushTurn('assistant', result.acknowledgement);
    await session.save();

    const audioOut = await speak(result.acknowledgement, session.language);

    return ok(res, {
      transcript: correction,
      understood: result.understood,
      acknowledgement: result.acknowledgement,
      language: session.language,
      audio: audioOut
    });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const addDocument = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { image } = req.body;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);
    if (!image) return fail(res, 'Document image is required');

    const extracted = await extractDocument(image);

    const documentId = `DOC_${Date.now()}_${uuidv4().slice(0, 6)}`;
    let fileUrl = null;

    try {
      const payload = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
      const upload = await cloudinary.uploader.upload(payload, {
        folder: `patient_documents/${session.abhaId || session.sessionId}`,
        public_id: documentId,
        overwrite: true,
        format: 'jpg',
        quality: 'auto:good',
        transformation: [{ width: 1600, height: 1600, crop: 'limit' }]
      });
      fileUrl = upload.secure_url;
    } catch (error) {
      console.error('Document upload failed, keeping extraction only:', error.message);
    }

    session.documents.push({ documentId, fileUrl, ...extracted });
    session.stage = 'DOCUMENTS';
    await session.save();

    return ok(res, {
      documentId,
      fileUrl,
      ...extracted,
      totalDocuments: session.documents.length
    }, 201);
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const confirmDocument = async (req, res) => {
  try {
    const { sessionId, documentId } = req.params;
    const { confirmed = true, corrections } = req.body;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);

    const document = session.documents.find((d) => d.documentId === documentId);
    if (!document) return fail(res, 'Document not found in this session', 404);

    document.patientConfirmed = Boolean(confirmed);

    if (corrections && typeof corrections === 'object') {
      for (const [key, value] of Object.entries(corrections)) {
        if (value !== undefined) document[key] = value;
      }
      document.needsVerification = true;
    }

    await session.save();

    return ok(res, { documentId, patientConfirmed: document.patientConfirmed });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const skipDocuments = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);

    session.documentsDeclined = true;
    session.stage = 'REVIEW';
    await session.save();

    return ok(res, { stage: session.stage });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const buildReview = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);
    if (!session.turns.length) return fail(res, 'No interview to summarise');

    const context = await patientContext(session.abhaId);

    const summary = await generateSummary({
      mode: session.mode,
      language: session.language,
      patient: context,
      turns: session.turns.map((t) => ({ role: t.role, text: t.text })),
      understood: session.understood || {},
      documents: session.documents,
      redFlags: session.redFlags
    });

    session.summary = summary.summary;
    session.chiefComplaint = summary.chiefComplaint;
    session.keyPoints = summary.keyPoints;
    session.clinicalHistory = summary.clinicalHistory;
    session.ayushHistory = summary.ayushHistory;
    session.patientReadBack = summary.patientReadBack;
    session.voiceBriefing = summary.voiceBriefing;
    session.redFlags = summary.redFlags;
    session.urgency = summary.urgency;
    session.stage = 'REVIEW';
    await session.save();

    const audio = await speak(summary.patientReadBack, session.language);

    return ok(res, {
      summary: summary.summary,
      chiefComplaint: summary.chiefComplaint,
      keyPoints: summary.keyPoints,
      redFlags: summary.redFlags,
      urgency: summary.urgency,
      understood: session.understood,
      documents: session.documents.map((d) => ({
        documentId: d.documentId,
        documentType: d.documentType,
        date: d.date,
        fileUrl: d.fileUrl,
        diagnoses: d.diagnoses,
        medicines: d.medicines,
        investigations: d.investigations,
        confidence: d.confidence,
        needsVerification: d.needsVerification
      })),
      patientReadBack: summary.patientReadBack,
      language: session.language,
      audio
    });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

const timelineFromDocuments = (documents) => {
  const entries = [];

  for (const doc of documents) {
    const date = safeDate(doc.date);
    if (!date || Number.isNaN(date.getTime())) continue;

    for (const dx of doc.diagnoses || []) {
      entries.push({ date, type: 'CONDITION', description: dx, source: doc.hospital || 'Patient document' });
    }
    if ((doc.medicines || []).length) {
      entries.push({
        date,
        type: 'PRESCRIPTION',
        description: doc.medicines.map((m) => `${m.name} ${m.dosage || ''}`.trim()).join(', '),
        source: doc.hospital || 'Patient document'
      });
    }
    if ((doc.investigations || []).length) {
      entries.push({
        date,
        type: 'LAB',
        description: doc.investigations.map((t) => `${t.name} ${t.value}${t.unit || ''}`).join(', '),
        source: doc.hospital || 'Patient document'
      });
    }
    for (const proc of doc.procedures || []) {
      entries.push({ date, type: 'SURGERY', description: proc.name, source: doc.hospital || 'Patient document' });
    }
  }

  return entries;
};

export const finalizeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { confirmed = true, doctorId = '', doctorName = '' } = req.body;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);
    if (!confirmed) return fail(res, 'Patient has not confirmed the summary');
    if (!session.summary) return fail(res, 'Build the review summary before finalising');

    const patient = session.abhaId ? await Patient.findOne({ abhaId: session.abhaId }) : null;

    const stamp = Date.now();
    const visitId = `VISIT_${stamp}_${uuidv4().slice(0, 6)}`;
    const tokenNumber = `${session.mode === 'AYUSH' ? 'AY' : 'GN'}-${String(stamp).slice(-6)}`;
    const appointmentId = `APP_${stamp}`;

    if (patient) {
      patient.visits.push({
        visitId,
        date: new Date(),
        hospitalId: session.hospitalId,
        hospitalName: session.hospitalName,
        consultationType: session.mode,
        status: 'COMPLETED',
        tokenNumber,
        appointmentId,
        interviewLanguage: session.language,
        sessionId: session.sessionId,
        chiefComplaint: session.chiefComplaint,
        clinicalHistory: toPatientClinicalHistory(session.clinicalHistory),
        ayushHistory: session.mode === 'AYUSH' ? normaliseAyush(session.ayushHistory) : undefined,
        aiSummary: session.summary,
        aiKeyPoints: session.keyPoints,
        aiRedFlags: session.redFlags,
        urgency: session.urgency,
        emergencyFlags: {
          triggered: session.redFlags.length > 0,
          symptoms: session.redFlags,
          urgency: session.urgency,
          triageAlert: session.urgency === 'EMERGENCY',
          alertedAt: session.redFlags.length > 0 ? new Date() : undefined
        },
        faceVerification: session.identificationMethod === 'FACE'
          ? { verified: true, confidence: session.faceConfidence, method: 'FACE_MATCH', verifiedAt: new Date() }
          : undefined
      });

      for (const doc of session.documents) {
        patient.documents.push({
          documentId: doc.documentId,
          type: ['PRESCRIPTION','LAB_REPORT','DISCHARGE_SUMMARY','AYURVEDA_PRESCRIPTION','OTHER'].includes(doc.documentType) ? doc.documentType : 'OTHER',
          date: safeDate(doc.date, undefined) || undefined,
          sourceHospital: doc.hospital,
          fileUrl: doc.fileUrl || 'kiosk-capture-not-stored',
          fileType: 'image/jpeg',
          ocrStatus: 'COMPLETED',
          ocrText: doc.rawText,
          ocrConfidence: doc.confidence,
          extractedInfo: {
            diagnoses: doc.diagnoses,
            medicines: doc.medicines,
            investigations: doc.investigations,
            procedures: doc.procedures,
            uncertain: doc.uncertain
          },
          verifiedByDoctor: false
        });

        if ((doc.investigations || []).length) {
          patient.labReports.push({
            reportId: `LAB_${doc.documentId}`,
            date: safeDate(doc.date, new Date()),
            labName: doc.hospital || 'Patient-supplied report',
            visitId,
            status: 'FINAL',
            tests: doc.investigations.map((t) => ({
              name: t.name,
              value: String(t.value ?? ''),
              unit: t.unit || '',
              normalRange: t.referenceRange || '',
              abnormal: Boolean(t.abnormal)
            })),
            doctorReviewed: false
          });
        }
      }

      patient.medicalTimeline.push(
        ...timelineFromDocuments(session.documents),
        {
          date: new Date(),
          type: 'VISIT',
          description: `${session.mode === 'AYUSH' ? 'AYUSH' : 'General OPD'} consultation - ${session.chiefComplaint || 'intake completed'}`,
          source: session.hospitalName,
          visitId
        }
      );

      mergeMedicalHistory(patient, session);

      patient.sessions.push({
        sessionId: session.sessionId,
        startedAt: session.startedAt,
        endedAt: new Date(),
        status: 'COMPLETED',
        kioskId: session.kioskId,
        languageUsed: session.language
      });

      patient.lastVisitDate = new Date();
      await patient.save();
    }

    const hisRecord = new HIS({
      hospitalId: session.hospitalId,
      hospitalName: session.hospitalName,
      department: { departmentName: session.mode === 'AYUSH' ? 'AYUSH OPD' : 'General Medicine', type: session.mode },
      patient: {
        abhaId: session.abhaId || `TEMP_${session.sessionId}`,
        hospitalPatientId: `HP_${stamp}`,
        name: session.patientName || patient?.name || 'Unknown',
        aadhaarNumber: patient?.aadhaarNumber || '',
        dateOfBirth: patient?.dateOfBirth || '',
        gender: patient?.gender || '',
        mobile: patient?.mobile || ''
      },
      appointment: {
        appointmentId,
        tokenNumber,
        date: new Date(),
        status: 'KIOSK_COMPLETED'
      },
      doctor: { doctorId: doctorId || 'UNASSIGNED', doctorName: doctorName || 'Awaiting assignment' },
      aiCaseTaking: {
        sessionId: session.sessionId,
        mode: session.mode,
        language: session.language,
        startedAt: session.startedAt,
        completedAt: new Date(),
        conversation: session.turns.map((t, i) => ({
          questionId: `Q${i}`,
          question: t.role === 'assistant' ? t.text : '',
          answer: t.role === 'user' ? t.text : '',
          inputMethod: 'VOICE',
          category: t.section || '',
          timestamp: t.at
        })),
        transcript: session.turns.map((t) => `${t.role === 'assistant' ? 'KIOSK' : 'PATIENT'}: ${t.text}`).join('\n'),
        structuredHistory: toHisStructuredHistory(session.clinicalHistory, session.chiefComplaint),
        ayushHistory: session.mode === 'AYUSH' ? toHisAyushHistory(session.ayushHistory) : undefined,
        aiSummary: {
          summary: session.summary,
          keyFindings: session.keyPoints,
          redFlags: session.redFlags,
          urgency: session.urgency
        }
      },
      abhaHistoryAccess: {
        requested: session.consentScope?.previousRecords || false,
        status: session.consentScope?.previousRecords ? 'GRANTED' : 'NOT_REQUESTED',
        accessedAt: new Date()
      },
      doctorReview: { status: 'PENDING' },
      timing: {
        patientArrivedAt: session.startedAt,
        kioskStartedAt: session.startedAt,
        kioskCompletedAt: new Date()
      }
    });

    await hisRecord.save();

    session.visitId = visitId;
    session.tokenNumber = tokenNumber;
    session.patientConfirmed = true;
    session.stage = 'COMPLETED';
    session.completedAt = new Date();
    await session.save();

    const closing = session.urgency === 'EMERGENCY'
      ? session.patientReadBack
      : session.patientReadBack;

    const audio = await speak(closing, session.language);

    return ok(res, {
      visitId,
      tokenNumber,
      urgency: session.urgency,
      redFlags: session.redFlags,
      priorityTriage: session.urgency === 'EMERGENCY',
      queuedFor: session.mode === 'AYUSH' ? 'AYUSH OPD' : 'General Medicine',
      language: session.language,
      audio
    }, 201);
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

const toPatientClinicalHistory = (clinical = {}) => {
  const asArray = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (value === undefined || value === null || value === '') return [];
    return [String(value)];
  };
  const asText = (value) => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.filter(Boolean).join(', ');
    return Object.entries(value).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('; ');
  };
  const personal = typeof clinical.personalHistory === 'object' && clinical.personalHistory !== null
    ? clinical.personalHistory
    : {};

  return {
    chiefComplaint: asText(clinical.chiefComplaint),
    historyOfPresentIllness: asText(clinical.historyOfPresentIllness),
    pastMedicalHistory: asArray(clinical.pastMedicalHistory),
    pastSurgicalHistory: asArray(clinical.pastSurgicalHistory),
    drugHistory: asArray(clinical.drugHistory),
    allergyHistory: asArray(clinical.allergyHistory),
    familyHistory: asText(clinical.familyHistory),
    personalHistory: {
      occupation: asText(personal.occupation),
      diet: asText(personal.diet),
      sleep: asText(personal.sleep),
      exercise: asText(personal.exercise)
    },
    reviewOfSystems: asText(clinical.reviewOfSystems)
  };
};

const toHisStructuredHistory = (clinical = {}, chiefComplaint = '') => {
  const asArray = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (value === undefined || value === null || value === '') return [];
    return [String(value)];
  };

  const asText = (value) => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.filter(Boolean).join(', ');
    return Object.entries(value)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
  };

  const complaint = chiefComplaint || asText(clinical.chiefComplaint);

  return {
    chiefComplaint: complaint ? [{ complaint, duration: '', severity: '' }] : [],
    historyOfPresentIllness: asText(clinical.historyOfPresentIllness),
    pastMedicalHistory: asArray(clinical.pastMedicalHistory),
    pastSurgicalHistory: asArray(clinical.pastSurgicalHistory),
    drugHistory: asArray(clinical.drugHistory),
    allergyHistory: asArray(clinical.allergyHistory),
    familyHistory: asText(clinical.familyHistory),
    personalHistory: asText(clinical.personalHistory),
    reviewOfSystems: asText(clinical.reviewOfSystems)
  };
};

const toHisAyushHistory = (ayush) => {
  if (!ayush) return undefined;
  const text = (value) => (value === undefined || value === null ? '' : String(value));

  return {
    dashavidhaPariksha: {
      prakriti: text(ayush.prakriti),
      vikriti: text(ayush.vikriti),
      sara: text(ayush.sara),
      samhanana: text(ayush.samhanana),
      pramana: text(ayush.pramana),
      satmya: text(ayush.satmya),
      sattva: text(ayush.sattva),
      aharaShakti: text(ayush.aharaShakti),
      vyayamaShakti: text(ayush.vyayamaShakti),
      vaya: text(ayush.vaya)
    },
    aharaVihara: {
      diet: text(ayush.aharaVihara?.diet),
      lifestyle: text(ayush.aharaVihara?.lifestyle),
      sleep: text(ayush.aharaVihara?.sleep),
      physicalActivity: text(ayush.aharaVihara?.physicalActivity)
    }
  };
};

const normaliseAyush = (ayush) => {
  if (!ayush) return undefined;
  const wrap = (value) => (value ? { assessment: String(value) } : undefined);

  return {
    prakriti: wrap(ayush.prakriti),
    vikriti: wrap(ayush.vikriti),
    sara: wrap(ayush.sara),
    samhanana: wrap(ayush.samhanana),
    pramana: ayush.pramana ? { observations: [String(ayush.pramana)] } : undefined,
    satmya: wrap(ayush.satmya),
    sattva: wrap(ayush.sattva),
    aharaShakti: wrap(ayush.aharaShakti),
    vyayamaShakti: wrap(ayush.vyayamaShakti),
    vaya: wrap(ayush.vaya),
    aharaVihara: ayush.aharaVihara
      ? {
          diet: { details: ayush.aharaVihara.diet || '' },
          lifestyle: { routine: ayush.aharaVihara.lifestyle || '' },
          sleep: { duration: ayush.aharaVihara.sleep || '' },
          physicalActivity: { level: ayush.aharaVihara.physicalActivity || '' }
        }
      : undefined,
    aiSummary: ayush.nidana ? `Nidana: ${ayush.nidana}${ayush.koshtha ? ` | Koshtha: ${ayush.koshtha}` : ''}` : undefined
  };
};

const mergeMedicalHistory = (patient, session) => {
  if (!patient.medicalHistory) {
    patient.medicalHistory = { conditions: [], allergies: [], surgeries: [], familyHistory: [], lifestyle: {} };
  }

  const history = patient.medicalHistory;
  const clinical = session.clinicalHistory || {};

  const exists = (list, key, value) =>
    list.some((item) => String(item[key] || '').toLowerCase() === String(value).toLowerCase());

  for (const condition of clinical.pastMedicalHistory || []) {
    if (condition && !exists(history.conditions, 'name', condition)) {
      history.conditions.push({ name: condition, diagnosedDate: new Date().toISOString().split('T')[0], status: 'Active' });
    }
  }

  for (const allergen of clinical.allergyHistory || []) {
    if (allergen && allergen.toLowerCase() !== 'none' && !exists(history.allergies, 'allergen', allergen)) {
      history.allergies.push({ allergen, severity: 'Moderate' });
    }
  }

  for (const surgery of clinical.pastSurgicalHistory || []) {
    if (surgery && !exists(history.surgeries, 'procedure', surgery)) {
      history.surgeries.push({ procedure: surgery });
    }
  }

  if (clinical.familyHistory) {
    for (const condition of String(clinical.familyHistory).split(',').map((s) => s.trim()).filter(Boolean)) {
      if (!exists(history.familyHistory, 'condition', condition)) {
        history.familyHistory.push({ condition, relation: 'Family' });
      }
    }
  }

  const personal = clinical.personalHistory || {};
  history.lifestyle = {
    ...(history.lifestyle || {}),
    ...(personal.diet ? { diet: personal.diet } : {}),
    ...(personal.exercise ? { exercise: mapExercise(personal.exercise) } : {})
  };

  for (const doc of session.documents) {
    for (const dx of doc.diagnoses || []) {
      if (dx && !exists(history.conditions, 'name', dx)) {
        history.conditions.push({ name: dx, diagnosedDate: doc.date || undefined, status: 'Active' });
      }
    }
  }
};

const mapExercise = (value) => {
  const text = String(value).toLowerCase();
  if (/high|daily|regular|gym|रोज/.test(text)) return 'High';
  if (/moderate|sometimes|weekly|कभी/.test(text)) return 'Moderate';
  return 'Low';
};

export const getSession = async (req, res) => {
  try {
    const session = await loadSession(req.params.sessionId);
    if (!session) return fail(res, 'Session not found', 404);
    return ok(res, session);
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const abandonSession = async (req, res) => {
  try {
    const session = await loadSession(req.params.sessionId);
    if (!session) return fail(res, 'Session not found', 404);

    session.stage = 'ABANDONED';
    session.turns = [];
    session.understood = {};
    await session.save();

    return ok(res, { stage: session.stage, cleared: true });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const doctorQueue = async (req, res) => {
  try {
    const { mode, status = 'KIOSK_COMPLETED' } = req.query;

    const query = { 'appointment.status': status };
    if (mode) query['aiCaseTaking.mode'] = mode;

    const records = await HIS.find(query).sort({ 'timing.kioskCompletedAt': -1 }).limit(100);

    const urgencyRank = { EMERGENCY: 0, URGENT: 1, ROUTINE: 2 };

    const queue = records
      .map((record) => ({
        appointmentId: record.appointment?.appointmentId,
        tokenNumber: record.appointment?.tokenNumber,
        sessionId: record.aiCaseTaking?.sessionId,
        abhaId: record.patient?.abhaId,
        name: record.patient?.name,
        gender: record.patient?.gender,
        dateOfBirth: record.patient?.dateOfBirth,
        mode: record.aiCaseTaking?.mode,
        language: record.aiCaseTaking?.language,
        chiefComplaint: (record.aiCaseTaking?.structuredHistory?.chiefComplaint || [])
          .map((c) => c.complaint)
          .filter(Boolean)
          .join('; '),
        summary: record.aiCaseTaking?.aiSummary?.summary || '',
        keyPoints: record.aiCaseTaking?.aiSummary?.keyFindings || [],
        redFlags: record.aiCaseTaking?.aiSummary?.redFlags || [],
        urgency: record.aiCaseTaking?.aiSummary?.urgency || 'ROUTINE',
        reviewStatus: record.doctorReview?.status,
        completedAt: record.timing?.kioskCompletedAt
      }))
      .sort((a, b) => (urgencyRank[a.urgency] ?? 2) - (urgencyRank[b.urgency] ?? 2));

    return res.json({ success: true, count: queue.length, data: queue });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const doctorBriefingAudio = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { language = 'en-IN' } = req.body;

    const session = await loadSession(sessionId);
    if (!session) return fail(res, 'Session not found', 404);

    const text = session.voiceBriefing || session.summary || 'No summary available for this patient yet.';
    const audio = await speak(text, language);

    // Never 502: hand back the text so the doctor app can show it even if TTS is unavailable.
    return ok(res, { text, audios: audio?.audios || [], format: audio?.format || 'wav', language });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};
