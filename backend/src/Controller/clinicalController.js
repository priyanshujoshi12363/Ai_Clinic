import Patient from '../Models/abha.model.js';
import Medicine, { seedMedicines } from '../Models/medicine.model.js';
import cloudinary from '../utils/cloudinary.js';
import { extractDocument } from '../services/intakeEngine.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

const uid = (p) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// ---------------------------------------------------------------------------
// Medicine master
// ---------------------------------------------------------------------------
export const seedMedicineDb = async (_req, res) => {
  try { return ok(res, await seedMedicines()); }
  catch (e) { return fail(res, e.message, 500); }
};

export const searchMedicines = async (req, res) => {
  try {
    await seedMedicines(); // idempotent — makes the DB usable on first run
    const q = (req.query.q || '').trim();
    const filter = q
      ? { $or: [{ name: { $regex: q, $options: 'i' } }, { generic: { $regex: q, $options: 'i' } }] }
      : {};
    const meds = await Medicine.find(filter).limit(20).sort({ name: 1 }).lean();
    return ok(res, meds);
  } catch (e) { return fail(res, e.message, 500); }
};

// ---------------------------------------------------------------------------
// Doctor queue + patient detail
// ---------------------------------------------------------------------------
const patientCard = (p) => {
  const last = p.visits?.[p.visits.length - 1];
  return {
    abhaId: p.abhaId,
    name: p.name,
    age: p.age ?? null,
    gender: p.gender,
    mobile: p.mobile,
    faceUrl: p.faceData?.faceImages?.[0]?.imageUrl || null,
    lastVisitDate: p.lastVisitDate || null,
    totalVisits: p.totalVisits || 0,
    chiefComplaint: last?.chiefComplaint || '',
    urgency: last?.urgency || 'ROUTINE',
    tokenNumber: last?.tokenNumber || null,
    conditions: (p.medicalHistory?.conditions || []).map((c) => c.name),
    allergies: (p.medicalHistory?.allergies || []).map((a) => a.allergen)
  };
};

export const getQueue = async (_req, res) => {
  try {
    const patients = await Patient.find({ activeStatus: true })
      .sort({ lastVisitDate: -1, updatedAt: -1 })
      .limit(50)
      .lean({ virtuals: true });
    return ok(res, patients.map(patientCard));
  } catch (e) { return fail(res, e.message, 500); }
};

export const getPatientDetail = async (req, res) => {
  try {
    const p = await Patient.findOne({ abhaId: req.params.abhaId }).lean({ virtuals: true });
    if (!p) return fail(res, 'Patient not found', 404);
    const last = p.visits?.[p.visits.length - 1] || null;
    return ok(res, {
      abhaId: p.abhaId,
      name: p.name,
      age: p.age ?? null,
      gender: p.gender,
      dateOfBirth: p.dateOfBirth,
      mobile: p.mobile,
      preferredLanguage: p.preferredLanguage,
      faceUrl: p.faceData?.faceImages?.[0]?.imageUrl || null,
      conditions: (p.medicalHistory?.conditions || []).map((c) => c.name),
      allergies: (p.medicalHistory?.allergies || []).map((a) => a.allergen),
      medicalHistory: p.medicalHistory || {},
      latestVisit: last && {
        visitId: last.visitId,
        date: last.date,
        chiefComplaint: last.chiefComplaint,
        consultationType: last.consultationType,
        urgency: last.urgency,
        aiSummary: last.aiSummary,
        aiKeyPoints: last.aiKeyPoints || [],
        aiRedFlags: last.aiRedFlags || []
      },
      prescriptions: (p.prescriptions || []).slice().reverse(),
      labReports: (p.labReports || []).slice().reverse(),
      documents: (p.documents || []).slice().reverse(),
      timeline: (p.medicalTimeline || []).slice().reverse().slice(0, 30),
      totalVisits: p.totalVisits || 0,
      totalPrescriptions: p.totalPrescriptions || 0
    });
  } catch (e) { return fail(res, e.message, 500); }
};

// ---------------------------------------------------------------------------
// Create a prescription  →  saves to patient.prescriptions, latest visit & timeline
// ---------------------------------------------------------------------------
export const createPrescription = async (req, res) => {
  try {
    const { medicines = [], diagnosis = '', instructions = '',
            doctorName = 'Attending Doctor', specialty = '', hospitalName = 'SwasthAI Hospital' } = req.body;

    if (!Array.isArray(medicines) || medicines.length === 0)
      return fail(res, 'Add at least one medicine');

    const patient = await Patient.findOne({ abhaId: req.params.abhaId });
    if (!patient) return fail(res, 'Patient not found', 404);

    const latest = patient.visits?.[patient.visits.length - 1] || null;
    const now = new Date();

    const meds = medicines.map((m) => ({
      name: m.name,
      dosage: m.dosage || m.strength || '',
      frequency: m.frequency || '',
      timing: m.timing || '',            // e.g. "After food"
      duration: m.duration || '',
      quantity: Number(m.quantity) || undefined
    }));

    const prescription = {
      prescriptionId: uid('RX'),
      date: now,
      visitId: latest?.visitId,
      hospitalId: latest?.hospitalId,
      doctorId: req.body.doctorId || 'DOC-DEMO',
      doctorName,
      specialty,
      medicines: meds,
      diagnosis,
      instructions,
      validUntil: new Date(now.getTime() + 30 * 24 * 3600 * 1000)
    };

    patient.prescriptions.push(prescription);

    // also mirror onto the current visit for the visit record & history
    if (latest) {
      latest.prescriptions = latest.prescriptions || [];
      meds.forEach((m) => latest.prescriptions.push({
        name: m.name, dosage: m.dosage, frequency: m.frequency,
        duration: m.duration,
        instructions: [m.timing, instructions].filter(Boolean).join(' · '),
        prescribedAt: now
      }));
    }

    const rxNames = meds.map((m) => m.name).slice(0, 3).join(', ') + (meds.length > 3 ? '…' : '');
    patient.medicalTimeline.push({
      type: 'PRESCRIPTION',
      date: now,
      description: `Prescription — ${rxNames}${diagnosis ? ` (${diagnosis})` : ''}`,
      source: doctorName,
      visitId: latest?.visitId,
      metadata: { referenceId: prescription.prescriptionId, count: meds.length }
    });

    patient.totalPrescriptions = (patient.totalPrescriptions || 0) + 1;
    await patient.save();

    return ok(res, { prescription, totalPrescriptions: patient.totalPrescriptions }, 201);
  } catch (e) { return fail(res, e.message, 500); }
};

// ---------------------------------------------------------------------------
// Edit an existing prescription (doctor can review & change what was prescribed)
// ---------------------------------------------------------------------------
export const updatePrescription = async (req, res) => {
  try {
    const { medicines, diagnosis, instructions, doctorName } = req.body;
    const patient = await Patient.findOne({ abhaId: req.params.abhaId });
    if (!patient) return fail(res, 'Patient not found', 404);

    const rx = patient.prescriptions.find((p) => p.prescriptionId === req.params.prescriptionId);
    if (!rx) return fail(res, 'Prescription not found', 404);

    if (Array.isArray(medicines)) {
      if (medicines.length === 0) return fail(res, 'A prescription needs at least one medicine');
      rx.medicines = medicines.map((m) => ({
        name: m.name, dosage: m.dosage || '', frequency: m.frequency || '',
        timing: m.timing || '', duration: m.duration || '',
        quantity: Number(m.quantity) || undefined
      }));
    }
    if (diagnosis !== undefined) rx.diagnosis = diagnosis;
    if (instructions !== undefined) rx.instructions = instructions;
    if (doctorName) rx.doctorName = doctorName;

    patient.medicalTimeline.push({
      type: 'PRESCRIPTION', date: new Date(),
      description: `Prescription edited — ${rx.medicines.map((m) => m.name).slice(0, 3).join(', ')}`,
      source: rx.doctorName, visitId: rx.visitId,
      metadata: { referenceId: rx.prescriptionId, edited: true }
    });

    await patient.save();
    return ok(res, { prescription: rx });
  } catch (e) { return fail(res, e.message, 500); }
};

// ---------------------------------------------------------------------------
// Upload a lab report  →  Cloudinary + patient.documents / labReports / timeline
// ---------------------------------------------------------------------------
export const uploadLabReport = async (req, res) => {
  try {
    const { file, fileType = 'image/jpeg', labName = 'Lab', notes = '',
            tests: manualTests = [], runOcr = true } = req.body;
    if (!file) return fail(res, 'A report file is required');

    const patient = await Patient.findOne({ abhaId: req.params.abhaId });
    if (!patient) return fail(res, 'Patient not found', 404);

    const dataUri = file.startsWith('data:') ? file : `data:${fileType};base64,${file}`;
    const isImage = /^data:image\//i.test(dataUri) || /image\//i.test(fileType);

    // 1) keep the original file in Cloudinary
    const upload = await cloudinary.uploader.upload(dataUri, {
      folder: 'lab_reports', resource_type: 'auto',
      public_id: `lab_${patient.abhaId}_${Date.now()}`
    });

    // 2) OCR the image into structured tests (reuses the intake vision-OCR engine)
    let tests = Array.isArray(manualTests) ? manualTests : [];
    let ocr = { status: 'SKIPPED', confidence: null, rawText: '', labName: null, date: null };
    if (runOcr && isImage && tests.length === 0) {
      try {
        const extracted = await extractDocument(dataUri);
        tests = (extracted.investigations || []).map((i) => ({
          name: i.name, value: i.value, unit: i.unit,
          normalRange: i.referenceRange, abnormal: !!i.abnormal
        }));
        ocr = {
          status: tests.length ? 'COMPLETED' : 'COMPLETED_EMPTY',
          confidence: extracted.confidence,
          rawText: extracted.rawText || '',
          labName: extracted.hospital || null,
          date: extracted.date || null,
          needsVerification: extracted.needsVerification
        };
      } catch (e) {
        ocr = { status: 'FAILED', message: e.message };
      }
    }

    const now = new Date();
    const latest = patient.visits?.[patient.visits.length - 1] || null;
    const resolvedLab = ocr.labName || labName;

    const doc = {
      documentId: uid('DOC'), type: 'LAB_REPORT', date: now,
      sourceHospital: resolvedLab, fileUrl: upload.secure_url, fileType,
      ocrStatus: ocr.status === 'COMPLETED' ? 'COMPLETED' : (ocr.status === 'FAILED' ? 'FAILED' : 'PENDING'),
      ocrText: ocr.rawText, ocrConfidence: ocr.confidence ?? undefined,
      extractedInfo: { tests }, verifiedByDoctor: true, doctorNotes: notes
    };
    patient.documents.push(doc);

    let labReport = null;
    if (tests.length) {
      labReport = {
        reportId: uid('LAB'), date: now, labName: resolvedLab, visitId: latest?.visitId,
        status: 'FINAL',
        tests: tests.map((t) => ({
          name: t.name, value: t.value, unit: t.unit,
          normalRange: t.normalRange, abnormal: !!t.abnormal
        })),
        doctorReviewed: true, doctorNotes: notes
      };
      patient.labReports.push(labReport);
    }

    patient.medicalTimeline.push({
      type: 'LAB', date: now,
      description: `Lab report — ${resolvedLab}${tests.length ? ` (${tests.length} results)` : ''}`,
      source: resolvedLab, visitId: latest?.visitId,
      metadata: { referenceId: doc.documentId, fileUrl: upload.secure_url }
    });
    patient.totalDocuments = (patient.totalDocuments || 0) + 1;
    await patient.save();

    return ok(res, { document: doc, labReport, tests, ocr, fileUrl: upload.secure_url }, 201);
  } catch (e) { return fail(res, e.message, 500); }
};
