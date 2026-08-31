import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  key: { type: String },
  question: { type: String },
  answer: { type: String },
  language: { type: String },
  at: { type: Date, default: Date.now }
}, { _id: false });

const emergencySchema = new mongoose.Schema({
  tokenNumber: { type: String, required: true, unique: true },

  patientName: { type: String, default: 'Unknown' },
  abhaId: { type: String, default: null },
  identificationStatus: {
    type: String,
    enum: ['UNIDENTIFIED', 'IDENTIFIED', 'PENDING'],
    default: 'UNIDENTIFIED'
  },
  identificationMethod: {
    type: String,
    enum: ['NONE', 'FACE', 'ABHA', 'AADHAAR', 'MANUAL'],
    default: 'NONE'
  },

  symptoms: { type: String, required: true },
  chiefComplaint: { type: String },
  language: { type: String, default: 'hi-IN' },

  triageLevel: { type: String, enum: ['RED', 'ORANGE', 'YELLOW', 'GREEN'], default: 'YELLOW' },
  triageLabel: { type: String },
  targetMinutes: { type: Number },
  urgency: { type: String, enum: ['EMERGENCY', 'URGENT', 'ROUTINE'], default: 'URGENT' },
  suspectedCategory: { type: String },
  redFlags: [String],
  triageHistory: [{
    from: String,
    to: String,
    reason: String,
    at: { type: Date, default: Date.now }
  }],

  essentialQuestions: [{ key: String, question: String }],
  answers: [answerSchema],

  aiSummary: { type: String },
  keyPoints: [String],
  doctorBriefing: { type: String },

  knownHistory: {
    conditions: [String],
    allergies: [String],
    medicines: [String],
    lastVisitDate: { type: Date }
  },

  status: {
    type: String,
    enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED'],
    default: 'WAITING'
  },
  queuePosition: { type: Number },

  attendedBy: { type: String },
  attendedAt: { type: Date },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

emergencySchema.index({ status: 1, triageLevel: 1, createdAt: 1 });
emergencySchema.index({ abhaId: 1 });

const Emergency = mongoose.model('Emergency', emergencySchema);
export default Emergency;
