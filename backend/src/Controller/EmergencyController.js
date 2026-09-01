import Emergency from '../Models/Emergency.js';
import Patient from '../Models/abha.model.js';
import { createEmergency, getEmergencyQueue, updateEmergencyStatus } from '../services/Emergency.js';
import { triage, retriageWithAnswers, triageRank, TRIAGE_LEVELS } from '../services/emergencyEngine.js';
import { speechToText, textToSpeech, normalizeLanguage } from '../services/sarvamService.js';
import { findPatientByFace } from '../services/faceSearchService.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

// Specialization-based routing. Every emergency is tagged with the specialty it
// would ideally go to; with a single doctor logged in, the queue still shows them
// all, but the routing metadata is preserved for a multi-doctor deployment.
const SPECIALITY_BY_CATEGORY = {
  CARDIAC: 'Cardiology',
  TRAUMA: 'Emergency & Trauma',
  RESPIRATORY: 'Pulmonology',
  NEUROLOGICAL: 'Neurology',
  OBSTETRIC: 'Obstetrics & Gynaecology',
  POISONING: 'Emergency & Toxicology',
  BURNS: 'Burns & Plastic Surgery',
  PAEDIATRIC: 'Paediatrics',
  OTHER: 'General Medicine'
};
const routeFor = (category) => SPECIALITY_BY_CATEGORY[category] || 'General Medicine';

const speak = async (text, language) => {
  if (!text) return null;
  const result = await textToSpeech(text, language);
  return result.success ? { audios: result.audios, format: result.format, language: result.language } : null;
};

const makeToken = () =>
  `EM-${String(Date.now()).slice(-4)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;

const recomputeQueue = async () => {
  const waiting = await Emergency.find({ status: { $in: ['WAITING', 'IN_PROGRESS'] } });

  waiting.sort((a, b) => {
    const rank = triageRank(a.triageLevel) - triageRank(b.triageLevel);
    return rank !== 0 ? rank : new Date(a.createdAt) - new Date(b.createdAt);
  });

  await Promise.all(
    waiting.map((record, index) => {
      if (record.queuePosition === index + 1) return null;
      record.queuePosition = index + 1;
      return record.save();
    })
  );

  return waiting;
};

const patientSnapshot = async (abhaId) => {
  const patient = await Patient.findOne({ abhaId });
  if (!patient) return null;

  return {
    patient,
    knownHistory: {
      conditions: (patient.medicalHistory?.conditions || []).map((c) => c.name),
      allergies: (patient.medicalHistory?.allergies || []).map((a) => a.allergen),
      medicines: (patient.prescriptions || [])
        .flatMap((p) => (p.medicines || []).map((m) => `${m.name} ${m.dosage || ''}`.trim()))
        .slice(0, 10),
      lastVisitDate: patient.lastVisitDate
    }
  };
};

export const emergencyIntake = async (req, res) => {
  try {
    const { audio, mimeType = 'audio/webm', text, language = 'hi-IN', patientName } = req.body;

    let spoken = (text || '').trim();
    let sessionLanguage = normalizeLanguage(language);
    let detectedLanguage = null;

    if (!spoken) {
      if (!audio) return fail(res, 'Provide either audio or text describing what happened');

      const heard = await speechToText(audio, { languageHint: 'unknown', mimeType });
      if (!heard.success) return fail(res, `Speech recognition failed: ${heard.message}`, 502);

      spoken = (heard.transcript || '').trim();
      detectedLanguage = heard.detectedLanguage;

      if (detectedLanguage && spoken.length >= 8) sessionLanguage = detectedLanguage;
    }

    if (!spoken) {
      return ok(res, { heardNothing: true, language: sessionLanguage });
    }

    const assessment = await triage({ text: spoken, language: sessionLanguage });

    const emergency = new Emergency({
      tokenNumber: makeToken(),
      patientName: patientName || 'Unknown',
      symptoms: spoken,
      chiefComplaint: assessment.chiefComplaint,
      language: sessionLanguage,
      triageLevel: assessment.triageLevel,
      triageLabel: assessment.triageLabel,
      targetMinutes: assessment.targetMinutes,
      urgency: assessment.urgency,
      suspectedCategory: assessment.suspectedCategory,
      routedSpecialization: routeFor(assessment.suspectedCategory),
      redFlags: assessment.redFlags,
      essentialQuestions: assessment.essentialQuestions,
      aiSummary: assessment.aiSummary,
      keyPoints: assessment.keyPoints,
      status: 'WAITING'
    });

    await emergency.save();
    const queue = await recomputeQueue();
    const position = queue.findIndex((r) => r.tokenNumber === emergency.tokenNumber) + 1;

    const spokenBack = [assessment.patientReassurance, assessment.essentialQuestions[0]?.question]
      .filter(Boolean)
      .join(' ');

    return ok(res, {
      tokenNumber: emergency.tokenNumber,
      transcript: spoken,
      language: sessionLanguage,
      detectedLanguage,
      chiefComplaint: assessment.chiefComplaint,
      triageLevel: assessment.triageLevel,
      triageLabel: assessment.triageLabel,
      targetMinutes: assessment.targetMinutes,
      urgency: assessment.urgency,
      suspectedCategory: assessment.suspectedCategory,
      routedSpecialization: routeFor(assessment.suspectedCategory),
      redFlags: assessment.redFlags,
      aiSummary: assessment.aiSummary,
      keyPoints: assessment.keyPoints,
      essentialQuestions: assessment.essentialQuestions,
      patientReassurance: assessment.patientReassurance,
      queuePosition: position || emergency.queuePosition,
      aiAvailable: assessment.aiAvailable,
      audio: await speak(spokenBack, sessionLanguage)
    }, 201);
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const answerEssential = async (req, res) => {
  try {
    const { tokenNumber } = req.params;
    const { audio, mimeType = 'audio/webm', text, key, question } = req.body;

    const emergency = await Emergency.findOne({ tokenNumber });
    if (!emergency) return fail(res, 'Emergency case not found', 404);

    let answer = (text || '').trim();

    if (!answer) {
      if (!audio) return fail(res, 'Provide either audio or text');
      const heard = await speechToText(audio, { languageHint: 'unknown', mimeType });
      if (!heard.success) return fail(res, `Speech recognition failed: ${heard.message}`, 502);
      answer = (heard.transcript || '').trim();

      if (heard.detectedLanguage && answer.length >= 8 && heard.detectedLanguage !== emergency.language) {
        emergency.language = heard.detectedLanguage;
      }
    }

    if (!answer) {
      return ok(res, { heardNothing: true, language: emergency.language });
    }

    const currentIndex = emergency.answers.length;
    const target = emergency.essentialQuestions.find((q) => q.key === key)
      || emergency.essentialQuestions[currentIndex]
      || null;

    emergency.answers.push({
      key: key || target?.key || `q${currentIndex + 1}`,
      question: question || target?.question || '',
      answer,
      language: emergency.language
    });

    const previousLevel = emergency.triageLevel;

    const updated = await retriageWithAnswers({
      complaint: emergency.symptoms,
      answers: emergency.answers.map((a) => ({ question: a.question, answer: a.answer })),
      language: emergency.language,
      currentLevel: previousLevel
    });

    if (updated.triageLevel !== previousLevel) {
      emergency.triageHistory.push({
        from: previousLevel,
        to: updated.triageLevel,
        reason: updated.reason
      });
      emergency.triageLevel = updated.triageLevel;
      emergency.triageLabel = updated.triageLabel;
      emergency.targetMinutes = updated.targetMinutes;
      emergency.urgency = updated.urgency;
    }

    if (updated.redFlags.length) emergency.redFlags = updated.redFlags;
    if (updated.aiSummary) emergency.aiSummary = updated.aiSummary;
    if (updated.keyPoints.length) emergency.keyPoints = updated.keyPoints;
    if (updated.doctorBriefing) emergency.doctorBriefing = updated.doctorBriefing;

    await emergency.save();

    const queue = await recomputeQueue();
    const position = queue.findIndex((r) => r.tokenNumber === emergency.tokenNumber) + 1;

    const answeredKeys = new Set(emergency.answers.map((a) => a.key));
    const nextQuestion = emergency.essentialQuestions.find((q) => !answeredKeys.has(q.key))
      || emergency.essentialQuestions[emergency.answers.length]
      || null;

    return ok(res, {
      tokenNumber: emergency.tokenNumber,
      transcript: answer,
      answered: emergency.answers.length,
      totalQuestions: emergency.essentialQuestions.length,
      nextQuestion: nextQuestion || null,
      triageLevel: emergency.triageLevel,
      triageLabel: emergency.triageLabel,
      triageChanged: updated.changed,
      triageReason: updated.reason,
      urgency: emergency.urgency,
      redFlags: emergency.redFlags,
      queuePosition: position || emergency.queuePosition,
      language: emergency.language,
      done: !nextQuestion,
      audio: nextQuestion ? await speak(nextQuestion.question, emergency.language) : null
    });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const identifyEmergencyPatient = async (req, res) => {
  try {
    const { tokenNumber } = req.params;
    const { faceImage, abhaId, patientName, method } = req.body;

    const emergency = await Emergency.findOne({ tokenNumber });
    if (!emergency) return fail(res, 'Emergency case not found', 404);

    let resolvedAbha = abhaId || null;
    let resolvedMethod = method || (abhaId ? 'ABHA' : 'MANUAL');
    let confidence = null;

    if (!resolvedAbha && faceImage) {
      const match = await findPatientByFace(faceImage, 0.75);
      if (match.success && match.found) {
        resolvedAbha = match.data.abhaId;
        resolvedMethod = 'FACE';
        confidence = match.confidence;
      } else {
        return ok(res, {
          found: false,
          reason: match.message || 'No matching patient found',
          tokenNumber,
          identificationStatus: emergency.identificationStatus
        });
      }
    }

    if (!resolvedAbha) {
      if (!patientName) return fail(res, 'Provide faceImage, abhaId, or patientName');
      emergency.patientName = patientName;
      emergency.identificationStatus = 'PENDING';
      emergency.identificationMethod = 'MANUAL';
      await emergency.save();
      return ok(res, { found: false, tokenNumber, patientName, identificationStatus: 'PENDING' });
    }

    const snapshot = await patientSnapshot(resolvedAbha);
    if (!snapshot) return fail(res, 'Patient not found for this identifier', 404);

    emergency.abhaId = resolvedAbha;
    emergency.patientName = snapshot.patient.name;
    emergency.identificationStatus = 'IDENTIFIED';
    emergency.identificationMethod = resolvedMethod;
    emergency.knownHistory = snapshot.knownHistory;
    await emergency.save();

    return ok(res, {
      found: true,
      tokenNumber,
      confidence,
      identificationMethod: resolvedMethod,
      patient: {
        abhaId: resolvedAbha,
        name: snapshot.patient.name,
        gender: snapshot.patient.gender,
        dateOfBirth: snapshot.patient.dateOfBirth,
        mobile: snapshot.patient.mobile
      },
      knownHistory: snapshot.knownHistory
    });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const getEmergencyCase = async (req, res) => {
  try {
    const emergency = await Emergency.findOne({ tokenNumber: req.params.tokenNumber });
    if (!emergency) return fail(res, 'Emergency case not found', 404);
    return ok(res, emergency);
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const emergencyBriefing = async (req, res) => {
  try {
    const { tokenNumber } = req.params;
    const { language = 'en-IN' } = req.body;

    const emergency = await Emergency.findOne({ tokenNumber });
    if (!emergency) return fail(res, 'Emergency case not found', 404);

    const history = emergency.knownHistory;
    const historyLine = emergency.identificationStatus === 'IDENTIFIED' && history
      ? ` Known history: ${(history.conditions || []).join(', ') || 'none recorded'}. Allergies: ${(history.allergies || []).join(', ') || 'none recorded'}.`
      : ' Patient is not yet identified, so no prior history is available.';

    const text = emergency.doctorBriefing
      || `${emergency.triageLabel} priority, token ${emergency.tokenNumber}. ${emergency.aiSummary}${historyLine}`;

    const audio = await speak(text, language);

    return ok(res, { text, audios: audio?.audios || [], format: audio?.format || 'wav', language });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

export const handleEmergency = async (req, res) => {
  try {
    const { symptoms, patientName } = req.body;

    if (!symptoms) {
      return res.status(400).json({ success: false, message: 'Symptoms are required' });
    }

    const emergency = await createEmergency(symptoms, patientName || 'Unknown');

    res.status(201).json({
      success: true,
      message: 'Emergency case created',
      data: {
        tokenNumber: emergency.tokenNumber,
        patientName: emergency.patientName,
        symptoms: emergency.symptoms,
        queuePosition: emergency.queuePosition,
        status: emergency.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmergency = async (req, res) => {
  try {
    const emergencies = await getEmergencyQueue();

    const data = emergencies.map((record) => ({
      tokenNumber: record.tokenNumber,
      patientName: record.patientName,
      abhaId: record.abhaId,
      identificationStatus: record.identificationStatus,
      symptoms: record.symptoms,
      chiefComplaint: record.chiefComplaint,
      language: record.language,
      triageLevel: record.triageLevel,
      triageLabel: record.triageLabel,
      targetMinutes: record.targetMinutes,
      urgency: record.urgency,
      suspectedCategory: record.suspectedCategory,
      routedSpecialization: record.routedSpecialization,
      redFlags: record.redFlags,
      aiSummary: record.aiSummary,
      keyPoints: record.keyPoints,
      answers: record.answers,
      knownHistory: record.knownHistory,
      queuePosition: record.queuePosition,
      status: record.status,
      waitingMinutes: Math.round((Date.now() - new Date(record.createdAt).getTime()) / 60000),
      breachedTarget:
        Math.round((Date.now() - new Date(record.createdAt).getTime()) / 60000) >
        (record.targetMinutes ?? TRIAGE_LEVELS.YELLOW.targetMinutes),
      createdAt: record.createdAt
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmergency = async (req, res) => {
  try {
    const { tokenNumber } = req.params;
    const { status, attendedBy } = req.body;

    const emergency = await updateEmergencyStatus(tokenNumber, status, attendedBy);

    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency not found' });
    }

    await recomputeQueue();

    res.json({ success: true, message: 'Emergency updated', data: emergency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
