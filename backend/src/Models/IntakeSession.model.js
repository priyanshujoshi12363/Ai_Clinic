import mongoose from 'mongoose';

const turnSchema = new mongoose.Schema({
  role: { type: String, enum: ['assistant', 'user'], required: true },
  text: { type: String, required: true },
  language: { type: String },
  section: { type: String },
  at: { type: Date, default: Date.now }
}, { _id: false });

const extractedDocumentSchema = new mongoose.Schema({
  documentId: { type: String, required: true },
  fileUrl: { type: String },
  documentType: { type: String },
  date: { type: String },
  hospital: { type: String },
  doctor: { type: String },
  diagnoses: [String],
  medicines: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  investigations: [{
    name: String,
    value: String,
    unit: String,
    referenceRange: String,
    abnormal: Boolean
  }],
  procedures: [{ name: String, date: String }],
  uncertain: [String],
  rawText: { type: String },
  confidence: { type: Number },
  needsVerification: { type: Boolean, default: false },
  patientConfirmed: { type: Boolean, default: false },
  capturedAt: { type: Date, default: Date.now }
}, { _id: false });

const intakeSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },

  abhaId: { type: String, index: true },
  patientName: { type: String },
  isNewPatient: { type: Boolean, default: false },

  identificationMethod: {
    type: String,
    enum: ['FACE', 'ABHA', 'AADHAAR', 'MANUAL', 'NONE'],
    default: 'NONE'
  },
  faceConfidence: { type: Number },

  consentGiven: { type: Boolean, default: false },
  consentAt: { type: Date },
  consentScope: {
    caseTaking: { type: Boolean, default: false },
    previousRecords: { type: Boolean, default: false },
    shareWithDoctor: { type: Boolean, default: false }
  },

  language: { type: String, default: 'hi-IN' },
  languageSelected: { type: String },
  languageSwitches: [{
    from: String,
    to: String,
    at: { type: Date, default: Date.now }
  }],

  mode: { type: String, enum: ['GENERAL_OPD', 'AYUSH'], default: 'GENERAL_OPD' },

  stage: {
    type: String,
    enum: ['CREATED', 'IDENTIFIED', 'CONSENTED', 'MODE_SELECTED', 'INTERVIEW', 'DOCUMENTS', 'REVIEW', 'COMPLETED', 'ABANDONED'],
    default: 'CREATED'
  },

  turns: [turnSchema],
  understood: { type: mongoose.Schema.Types.Mixed, default: {} },
  currentSection: { type: String },
  turnCount: { type: Number, default: 0 },
  interviewDone: { type: Boolean, default: false },

  documents: [extractedDocumentSchema],
  documentsDeclined: { type: Boolean, default: false },

  redFlags: [String],
  urgency: { type: String, enum: ['EMERGENCY', 'URGENT', 'ROUTINE'], default: 'ROUTINE' },

  summary: { type: String },
  chiefComplaint: { type: String },
  keyPoints: [String],
  clinicalHistory: { type: mongoose.Schema.Types.Mixed },
  ayushHistory: { type: mongoose.Schema.Types.Mixed },
  patientReadBack: { type: String },
  voiceBriefing: { type: String },
  patientConfirmed: { type: Boolean, default: false },

  visitId: { type: String },
  tokenNumber: { type: String },
  hospitalId: { type: String, default: 'HOSP_001' },
  hospitalName: { type: String, default: 'AIIA Demo Hospital' },
  kioskId: { type: String },

  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

intakeSessionSchema.index({ stage: 1, urgency: 1 });

intakeSessionSchema.methods.pushTurn = function (role, text, extra = {}) {
  this.turns.push({ role, text, language: this.language, ...extra });
  return this;
};

const IntakeSession = mongoose.model('IntakeSession', intakeSessionSchema);

export default IntakeSession;
