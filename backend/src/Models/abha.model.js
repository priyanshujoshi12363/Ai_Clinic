import mongoose from 'mongoose';

const faceImageSchema = new mongoose.Schema({
  imageId: { type: String, required: true },
  imageUrl: { type: String, required: true },
  embedding: { type: [Number], required: true },
  capturedAt: { type: Date, default: Date.now },
  angle: { type: String, enum: ['FRONT', 'LEFT', 'RIGHT', 'UP', 'DOWN'] },
  quality: { type: Number, min: 0, max: 1 },
  isPrimary: { type: Boolean, default: false }
});

const faceRecognitionSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  modelUsed: { type: String, default: 'FaceNet512' },
  version: { type: String, default: '1.0.0' },
  threshold: { type: Number, default: 0.75 },
  registeredAt: { type: Date },
  lastVerified: { type: Date },
  verificationCount: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 }
});

const livenessCheckSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  status: { type: String, enum: ['PASSED', 'FAILED', 'PENDING'], default: 'PENDING' },
  lastCheck: { type: Date },
  method: { type: String, enum: ['BLINK_DETECTION', 'HEAD_POSE', 'DEPTH'] },
  confidence: { type: Number, min: 0, max: 1 }
});

const faceDataSchema = new mongoose.Schema({
  faceEmbedding: { type: [Number], required: true },
  faceImages: [faceImageSchema],
  recognition: faceRecognitionSchema,
  livenessCheck: livenessCheckSchema
});

const addressSchema = new mongoose.Schema({
  house: { type: String },
  street: { type: String },
  locality: { type: String },
  village: { type: String },
  district: { type: String },
  state: { type: String },
  country: { type: String, default: 'India' },
  pincode: { type: String }
});

const abdmDetailsSchema = new mongoose.Schema({
  abhaAddress: { type: String },
  healthId: { type: String },
  phrAddress: { type: String },
  linkedAt: { type: Date },
  lastSync: { type: Date },
  syncStatus: { type: String, enum: ['SYNCED', 'PENDING', 'FAILED', 'NOT_SYNCED'], default: 'NOT_SYNCED' },
  syncError: { type: String }
});

const conditionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  diagnosedDate: { type: String },
  status: { type: String, enum: ['Active', 'Controlled', 'Resolved'] }
});

const allergySchema = new mongoose.Schema({
  allergen: { type: String, required: true },
  reaction: { type: String },
  severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'] }
});

const surgerySchema = new mongoose.Schema({
  procedure: { type: String, required: true },
  date: { type: String },
  hospital: { type: String }
});

const familyHistorySchema = new mongoose.Schema({
  condition: { type: String, required: true },
  relation: { type: String }
});

const lifestyleSchema = new mongoose.Schema({
  smoking: { type: Boolean, default: false },
  alcohol: { type: Boolean, default: false },
  exercise: { type: String, enum: ['Low', 'Moderate', 'High'] },
  diet: { type: String }
});

const medicalHistorySchema = new mongoose.Schema({
  conditions: [conditionSchema],
  allergies: [allergySchema],
  surgeries: [surgerySchema],
  familyHistory: [familyHistorySchema],
  lifestyle: lifestyleSchema
});

const faceVerificationSchema = new mongoose.Schema({
  verified: { type: Boolean, default: false },
  confidence: { type: Number, min: 0, max: 1 },
  imageUrl: { type: String },
  verifiedAt: { type: Date },
  method: { type: String, enum: ['FACE_MATCH', 'MANUAL'] }
});

const emergencyFlagsSchema = new mongoose.Schema({
  triggered: { type: Boolean, default: false },
  symptoms: [String],
  urgency: { type: String, enum: ['IMMEDIATE', 'URGENT', 'ROUTINE'], default: 'ROUTINE' },
  triageAlert: { type: Boolean, default: false },
  alertedAt: { type: Date },
  acknowledgedBy: { type: String },
  acknowledgedAt: { type: Date }
});

const clinicalHistorySchema = new mongoose.Schema({
  chiefComplaint: { type: String },
  historyOfPresentIllness: { type: String },
  pastMedicalHistory: [String],
  pastSurgicalHistory: [String],
  drugHistory: [String],
  allergyHistory: [String],
  familyHistory: { type: String },
  personalHistory: {
    occupation: { type: String },
    diet: { type: String },
    sleep: { type: String },
    exercise: { type: String }
  },
  reviewOfSystems: { type: String }
});

const prakritiSchema = new mongoose.Schema({
  assessment: { type: String },
  observations: [String],
  doctorConfirmed: { type: Boolean, default: false },
  doctorNotes: { type: String }
});

const vikritiSchema = new mongoose.Schema({
  assessment: { type: String },
  symptoms: [String],
  doctorConfirmed: { type: Boolean, default: false }
});

const saraSchema = new mongoose.Schema({
  assessment: { type: String },
  observations: [String]
});

const samhananaSchema = new mongoose.Schema({
  assessment: { type: String },
  observations: [String],
  measurements: {
    height: { type: Number },
    weight: { type: Number },
    bmi: { type: Number }
  }
});

const pramanaSchema = new mongoose.Schema({
  observations: [String],
  measurements: {
    height: { type: Number },
    weight: { type: Number },
    chest: { type: Number },
    waist: { type: Number }
  }
});

const satmyaSchema = new mongoose.Schema({
  assessment: { type: String },
  compatibleFoods: [String],
  incompatibleFoods: [String],
  doctorConfirmed: { type: Boolean, default: false }
});

const sattvaSchema = new mongoose.Schema({
  assessment: { type: String },
  observations: [String]
});

const aharaShaktiSchema = new mongoose.Schema({
  assessment: { type: String },
  observations: [String],
  digestiveSymptoms: [String]
});

const vyayamaShaktiSchema = new mongoose.Schema({
  assessment: { type: String },
  observations: [String],
  activityLevel: { type: String }
});

const vayaSchema = new mongoose.Schema({
  assessment: { type: String },
  age: { type: Number },
  stage: { type: String }
});

const dietSchema = new mongoose.Schema({
  type: { type: String },
  frequency: { type: String },
  preferences: { type: String },
  timing: { type: String },
  details: { type: String }
});

const lifestyleDetailSchema = new mongoose.Schema({
  routine: { type: String },
  occupation: { type: String },
  stress: { type: String },
  dailyRoutine: [String]
});

const sleepSchema = new mongoose.Schema({
  duration: { type: String },
  quality: { type: String },
  disturbances: { type: String },
  position: { type: String }
});

const physicalActivitySchema = new mongoose.Schema({
  level: { type: String },
  type: { type: String },
  frequency: { type: String }
});

const aharaViharaSchema = new mongoose.Schema({
  diet: dietSchema,
  lifestyle: lifestyleDetailSchema,
  sleep: sleepSchema,
  physicalActivity: physicalActivitySchema
});

const ayurvedicMedicineSchema = new mongoose.Schema({
  name: { type: String },
  dosage: { type: String },
  timing: { type: String },
  duration: { type: String }
});

const ayurvedicDiagnosisSchema = new mongoose.Schema({
  doshaImbalance: { type: String },
  disease: { type: String },
  samprapti: { type: String },
  treatmentGoal: { type: String },
  treatmentPlan: [String],
  medicines: [ayurvedicMedicineSchema],
  pathya: [String],
  apathya: [String]
});

const ayushHistorySchema = new mongoose.Schema({
  prakriti: prakritiSchema,
  vikriti: vikritiSchema,
  sara: saraSchema,
  samhanana: samhananaSchema,
  pramana: pramanaSchema,
  satmya: satmyaSchema,
  sattva: sattvaSchema,
  aharaShakti: aharaShaktiSchema,
  vyayamaShakti: vyayamaShaktiSchema,
  vaya: vayaSchema,
  aharaVihara: aharaViharaSchema,
  ayurvedicDiagnosis: ayurvedicDiagnosisSchema,
  aiSummary: { type: String },
  aiRedFlags: [String],
  urgency: { type: String, enum: ['EMERGENCY', 'URGENT', 'ROUTINE'] }
});

const doctorReviewSchema = new mongoose.Schema({
  doctorId: { type: String },
  doctorName: { type: String },
  verified: { type: Boolean, default: false },
  notes: { type: String },
  verifiedAt: { type: Date }
});

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'EXPIRED'], default: 'ACTIVE' },
  deviceId: { type: String },
  kioskId: { type: String },
  ipAddress: { type: String },
  languageUsed: { type: String }
});

const timelineEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { type: String, enum: ['CONDITION', 'SURGERY', 'LAB', 'PRESCRIPTION', 'DOCUMENT', 'VISIT'] },
  description: { type: String },
  source: { type: String },
  visitId: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
});

const visitSchema = new mongoose.Schema({
  visitId: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  hospitalId: { type: String, required: true },
  hospitalName: { type: String, required: true },
  department: { type: String },
  consultationType: { type: String, enum: ['GENERAL_OPD', 'AYUSH'], required: true },
  status: { type: String, enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' },
  tokenNumber: { type: String },
  appointmentId: { type: String },
  sessionId: { type: String },
  interviewLanguage: { type: String },
  audioTranscripts: [{
    language: { type: String },
    transcript: { type: String },
    timestamp: { type: Date }
  }],
  faceVerification: faceVerificationSchema,
  emergencyFlags: emergencyFlagsSchema,
  clinicalHistory: clinicalHistorySchema,
  ayushHistory: ayushHistorySchema,
  chiefComplaint: { type: String },
  aiSummary: { type: String },
  aiSummaryHindi: { type: String },
  aiKeyPoints: [String],
  aiRedFlags: [String],
  urgency: { type: String, enum: ['EMERGENCY', 'URGENT', 'ROUTINE'] },
  prescriptions: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    prescribedAt: Date
  }],
  audioSummary: {
    url: { type: String },
    publicId: { type: String },
    duration: { type: Number },
    format: { type: String },
    bytes: { type: Number },
    language: { type: String },
    generatedAt: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  doctorReview: doctorReviewSchema
}, { timestamps: true });

const testSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String },
  unit: { type: String },
  normalRange: { type: String },
  abnormal: { type: Boolean, default: false },
  interpretation: { type: String },
  resultDate: { type: String }
});

const labReportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  hospitalId: { type: String },
  labName: { type: String },
  visitId: { type: String },
  status: { type: String, enum: ['PENDING', 'FINAL', 'AMENDED'], default: 'FINAL' },
  tests: [testSchema],
  aiInterpretation: { type: String },
  doctorReviewed: { type: Boolean, default: false },
  doctorNotes: { type: String }
}, { timestamps: true });

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String },
  frequency: { type: String },
  timing: { type: String },
  duration: { type: String },
  quantity: { type: Number },
  refills: { type: Number, default: 0 }
});

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  visitId: { type: String },
  hospitalId: { type: String },
  doctorId: { type: String },
  doctorName: { type: String },
  specialty: { type: String },
  medicines: [medicineSchema],
  diagnosis: { type: String },
  instructions: { type: String },
  validUntil: { type: Date }
}, { timestamps: true });

const documentSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['PRESCRIPTION', 'LAB_REPORT', 'DISCHARGE_SUMMARY', 'AYURVEDA_PRESCRIPTION', 'OTHER'] },
  date: { type: Date },
  sourceHospital: { type: String },
  fileUrl: { type: String, required: true },
  fileType: { type: String },
  ocrStatus: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  ocrText: { type: String },
  ocrConfidence: { type: Number, min: 0, max: 1 },
  extractedInfo: { type: mongoose.Schema.Types.Mixed },
  verifiedByDoctor: { type: Boolean, default: false },
  doctorNotes: { type: String }
}, { timestamps: true });

const dataAccessSchema = new mongoose.Schema({
  medicalHistory: { type: Boolean, default: false },
  labReports: { type: Boolean, default: false },
  prescriptions: { type: Boolean, default: false },
  previousDocuments: { type: Boolean, default: false },
  ayushHistory: { type: Boolean, default: false }
});

const consentSchema = new mongoose.Schema({
  consentId: { type: String, required: true, unique: true },
  hospitalId: { type: String, required: true },
  hospitalName: { type: String, required: true },
  purpose: { type: String },
  status: { type: String, enum: ['GRANTED', 'REVOKED', 'EXPIRED'], default: 'GRANTED' },
  dataAccess: dataAccessSchema,
  grantedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  method: { type: String, enum: ['ELECTRONIC', 'FACE_RECOGNITION', 'MANUAL'] },
  faceVerified: { type: Boolean, default: false },
  faceConfidence: { type: Number, min: 0, max: 1 },
  revokedAt: { type: Date },
  revokeReason: { type: String }
}, { timestamps: true });

const patientSchema = new mongoose.Schema({
  abhaId: { type: String, required: true},
  aadhaarNumber: { type: String, required: true },
  name: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  mobile: { type: String, required: false, default: '' },
  email: { type: String },
  preferredLanguage: { type: String, default: 'Hindi' },
  languages: [String],
  faceData: faceDataSchema,
  address: addressSchema,
  abdmDetails: abdmDetailsSchema,
  medicalHistory: medicalHistorySchema,
  visits: [visitSchema],
  labReports: [labReportSchema],
  prescriptions: [prescriptionSchema],
  documents: [documentSchema],
  consents: [consentSchema],
  sessions: [sessionSchema],
  medicalTimeline: [timelineEntrySchema],
  activeStatus: { type: Boolean, default: true },
  lastVisitDate: { type: Date },
  totalVisits: { type: Number, default: 0 },
  totalPrescriptions: { type: Number, default: 0 },
  totalDocuments: { type: Number, default: 0 }
}, { timestamps: true });

patientSchema.index({ mobile: 1 });
patientSchema.index({ 'visits.hospitalId': 1 });
patientSchema.index({ 'visits.date': -1 });
patientSchema.index({ 'consents.hospitalId': 1 });
patientSchema.index({ 'consents.status': 1 });
patientSchema.index({ name: 'text' });
patientSchema.index({ 'address.district': 1 });
patientSchema.index({ 'address.state': 1 });
patientSchema.index({ 'abdmDetails.abhaAddress': 1 });
patientSchema.index({ 'sessions.status': 1 });
patientSchema.index({ 'medicalTimeline.date': -1 });
patientSchema.index({ 'emergencyFlags.triggered': 1 });

patientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const birthDate = new Date(this.dateOfBirth);
  const ageDiff = Date.now() - birthDate.getTime();
  const age = new Date(ageDiff);
  return Math.abs(age.getUTCFullYear() - 1970);
});

patientSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const parts = [
    this.address.house,
    this.address.street,
    this.address.locality,
    this.address.district,
    this.address.state,
    this.address.pincode
  ].filter(Boolean);
  return parts.join(', ');
});

patientSchema.methods.addVisit = function(visitData) {
  this.visits.push(visitData);
  this.totalVisits = this.visits.length;
  this.lastVisitDate = new Date();
  this.updateMedicalTimeline({
    date: visitData.date,
    type: 'VISIT',
    description: `${visitData.consultationType} visit at ${visitData.hospitalName}`,
    source: visitData.hospitalName,
    visitId: visitData.visitId
  });
  return this;
};

patientSchema.methods.addLabReport = function(reportData) {
  this.labReports.push(reportData);
  this.updateMedicalTimeline({
    date: reportData.date,
    type: 'LAB',
    description: `Lab report ${reportData.reportId}`,
    source: reportData.labName || 'Lab',
    metadata: { tests: reportData.tests }
  });
  return this;
};

patientSchema.methods.addPrescription = function(prescriptionData) {
  this.prescriptions.push(prescriptionData);
  this.totalPrescriptions = this.prescriptions.length;
  this.updateMedicalTimeline({
    date: prescriptionData.date,
    type: 'PRESCRIPTION',
    description: `Prescription ${prescriptionData.prescriptionId}`,
    source: prescriptionData.doctorName || 'Doctor',
    visitId: prescriptionData.visitId
  });
  return this;
};

patientSchema.methods.addDocument = function(documentData) {
  this.documents.push(documentData);
  this.totalDocuments = this.documents.length;
  this.updateMedicalTimeline({
    date: documentData.date || new Date(),
    type: 'DOCUMENT',
    description: `${documentData.type} document`,
    source: documentData.sourceHospital || 'Patient',
    metadata: { documentId: documentData.documentId }
  });
  return this;
};

patientSchema.methods.updateMedicalTimeline = function(entry) {
  if (!this.medicalTimeline) {
    this.medicalTimeline = [];
  }
  this.medicalTimeline.push(entry);
  this.medicalTimeline.sort((a, b) => new Date(a.date) - new Date(b.date));
};

patientSchema.methods.getOPDVisits = function() {
  return this.visits.filter(v => v.consultationType === 'GENERAL_OPD');
};

patientSchema.methods.getAYUSHVisits = function() {
  return this.visits.filter(v => v.consultationType === 'AYUSH');
};

patientSchema.methods.hasConsent = function(hospitalId) {
  const consent = this.consents.find(c => 
    c.hospitalId === hospitalId && 
    c.status === 'GRANTED' &&
    (!c.expiresAt || c.expiresAt > new Date())
  );
  return !!consent;
};

patientSchema.methods.getActiveConsent = function(hospitalId) {
  return this.consents.find(c => 
    c.hospitalId === hospitalId && 
    c.status === 'GRANTED' &&
    (!c.expiresAt || c.expiresAt > new Date())
  );
};

patientSchema.methods.hasEmergencyFlag = function() {
  return this.visits.some(v => v.emergencyFlags && v.emergencyFlags.triggered);
};

patientSchema.methods.getEmergencyVisits = function() {
  return this.visits.filter(v => v.emergencyFlags && v.emergencyFlags.triggered);
};

patientSchema.methods.updateFaceData = function(faceData) {
  if (!this.faceData) {
    this.faceData = {};
  }
  Object.assign(this.faceData, faceData);
  return this;
};

patientSchema.methods.addFaceImage = function(imageData) {
  if (!this.faceData) {
    this.faceData = { faceImages: [] };
  }
  if (!this.faceData.faceImages) {
    this.faceData.faceImages = [];
  }
  this.faceData.faceImages.push(imageData);
  return this;
};

patientSchema.methods.startSession = function(sessionData) {
  if (!this.sessions) {
    this.sessions = [];
  }
  this.sessions.push({
    sessionId: sessionData.sessionId,
    startedAt: new Date(),
    status: 'ACTIVE',
    deviceId: sessionData.deviceId,
    kioskId: sessionData.kioskId,
    ipAddress: sessionData.ipAddress,
    languageUsed: sessionData.languageUsed || this.preferredLanguage
  });
  return this;
};

patientSchema.methods.endSession = function(sessionId) {
  const session = this.sessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.status = 'COMPLETED';
    session.endedAt = new Date();
  }
  return this;
};

patientSchema.methods.getActiveSessions = function() {
  return this.sessions.filter(s => s.status === 'ACTIVE');
};

patientSchema.methods.linkABDM = function(abdmData) {
  this.abdmDetails = {
    abhaAddress: abdmData.abhaAddress,
    healthId: abdmData.healthId,
    phrAddress: abdmData.phrAddress,
    linkedAt: new Date(),
    syncStatus: 'PENDING'
  };
  return this;
};

patientSchema.methods.syncABDM = function() {
  if (this.abdmDetails) {
    this.abdmDetails.lastSync = new Date();
    this.abdmDetails.syncStatus = 'SYNCED';
  }
  return this;
};

patientSchema.statics.findByAadhaar = function(aadhaarNumber) {
  return this.findOne({ aadhaarNumber });
};

patientSchema.statics.findByAbhaId = function(abhaId) {
  return this.findOne({ abhaId });
};

patientSchema.statics.findByMobile = function(mobile) {
  return this.findOne({ mobile });
};

patientSchema.statics.findByABHAAddress = function(abhaAddress) {
  return this.findOne({ 'abdmDetails.abhaAddress': abhaAddress });
};

patientSchema.statics.searchPatients = function(query) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

patientSchema.statics.findByHospital = function(hospitalId) {
  return this.find({
    'visits.hospitalId': hospitalId
  });
};

patientSchema.statics.findByState = function(state) {
  return this.find({
    'address.state': state
  });
};

patientSchema.statics.findWithActiveConsent = function(hospitalId) {
  return this.find({
    'consents': {
      $elemMatch: {
        hospitalId: hospitalId,
        status: 'GRANTED',
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      }
    }
  });
};

patientSchema.statics.findWithEmergencyFlags = function() {
  return this.find({
    'visits.emergencyFlags.triggered': true
  });
};

patientSchema.statics.findBySessionId = function(sessionId) {
  return this.findOne({
    'sessions.sessionId': sessionId
  });
};

patientSchema.statics.findByTimelineRange = function(startDate, endDate) {
  return this.find({
    'medicalTimeline.date': {
      $gte: startDate,
      $lte: endDate
    }
  });
};

patientSchema.statics.getABHASynced = function() {
  return this.find({
    'abdmDetails.syncStatus': 'SYNCED'
  });
};
patientSchema.pre('save', function () {
  this.updatedAt = new Date();
});

patientSchema.pre('save', function () {
  this.totalVisits = this.visits ? this.visits.length : 0;
  this.totalPrescriptions = this.prescriptions ? this.prescriptions.length : 0;
  this.totalDocuments = this.documents ? this.documents.length : 0;
});

patientSchema.pre('save', function () {
  if (this.medicalTimeline && this.medicalTimeline.length > 0) {
    this.medicalTimeline.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
});

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;