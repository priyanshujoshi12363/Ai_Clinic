import mongoose from "mongoose";

const hisSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: String,
      required: true
    },
    hospitalName: {
      type: String,
      required: true
    },
    department: {
      departmentId: String,
      departmentName: String,
      type: {
        type: String,
        enum: ["GENERAL_OPD", "AYUSH"]
      }
    },
    patient: {
      abhaId: {
        type: String,
        required: true
      },
      hospitalPatientId: String,
      name: String,
      aadhaarNumber: String,
      dateOfBirth: String,
      gender: String,
      mobile: String
    },
    appointment: {
      appointmentId: String,
      date: Date,
      tokenNumber: String,
      scheduledStartTime: String,
      scheduledEndTime: String,
      status: {
        type: String,
        enum: [
          "SCHEDULED",
          "ARRIVED",
          "KIOSK_IN_PROGRESS",
          "KIOSK_COMPLETED",
          "WAITING",
          "IN_CONSULTATION",
          "COMPLETED",
          "CANCELLED"
        ]
      }
    },
    doctor: {
      doctorId: {
        type: String,
        required: true
      },
      doctorName: String,
      specialization: String
    },
    aiCaseTaking: {
      sessionId: {
        type: String,
        required: true
      },
      mode: {
        type: String,
        enum: ["GENERAL_OPD", "AYUSH"],
        required: true
      },
      language: String,
      startedAt: Date,
      completedAt: Date,
      conversation: [
        {
          questionId: String,
          question: String,
          answer: String,
          inputMethod: {
            type: String,
            enum: ["VOICE", "TOUCH"]
          },
          category: String,
          timestamp: Date
        }
      ],
      transcript: String,
      structuredHistory: {
        chiefComplaint: [
          {
            complaint: String,
            duration: String,
            severity: String
          }
        ],
        historyOfPresentIllness: String,
        pastMedicalHistory: [String],
        pastSurgicalHistory: [String],
        drugHistory: [String],
        allergyHistory: [String],
        familyHistory: String,
        personalHistory: String,
        reviewOfSystems: String
      },
      ayushHistory: {
        dashavidhaPariksha: {
          prakriti: String,
          vikriti: String,
          sara: String,
          samhanana: String,
          pramana: String,
          satmya: String,
          sattva: String,
          aharaShakti: String,
          vyayamaShakti: String,
          vaya: String
        },
        aharaVihara: {
          diet: String,
          lifestyle: String,
          sleep: String,
          physicalActivity: String
        }
      },
      aiSummary: {
        summary: String,
        keyFindings: [String],
        riskFactors: [String],
        redFlags: [String],
        urgency: {
          type: String,
          enum: ["EMERGENCY", "URGENT", "ROUTINE"]
        }
      }
    },
     audioSummary: {
        url: { type: String },
        publicId: { type: String },
        duration: { type: Number },
        format: { type: String },
        bytes: { type: Number },
        language: { type: String },
        generatedAt: { type: Date },
        isActive: { type: Boolean, default: true }
      }
    ,
    abhaHistoryAccess: {
      requested: Boolean,
      consentId: String,
      status: {
        type: String,
        enum: [
          "NOT_REQUESTED",
          "PENDING",
          "GRANTED",
          "DENIED"
        ]
      },
      accessedAt: Date,
      recordsAccessed: [
        {
          type: String,
          referenceId: String
        }
      ]
    },
    doctorReview: {
      status: {
        type: String,
        enum: [
          "PENDING",
          "IN_REVIEW",
          "CONFIRMED"
        ],
        default: "PENDING"
      },
      editedSummary: String,
      doctorNotes: String,
      reviewedAt: Date
    },
    consultation: {
      examination: String,
      diagnosis: [String],
      treatmentPlan: String,
      followUpRequired: Boolean,
      followUpDate: Date
    },
    investigations: [
      {
        investigationId: String,
        name: String,
        status: {
          type: String,
          enum: ["ORDERED", "IN_PROGRESS", "COMPLETED"]
        },
        result: String,
        orderedAt: Date,
        completedAt: Date
      }
    ],
    prescriptions: [
      {
        prescriptionId: String,
        medicine: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String,
        prescribedAt: Date
      }
    ],
    timing: {
      patientArrivedAt: Date,
      kioskStartedAt: Date,
      kioskCompletedAt: Date,
      consultationStartedAt: Date,
      consultationCompletedAt: Date
    }
  },
  {
    timestamps: true
  }
);

hisSchema.index({ "patient.abhaId": 1 });
hisSchema.index({ hospitalId: 1 });
hisSchema.index({ "doctor.doctorId": 1 });
hisSchema.index({ "appointment.date": 1 });
hisSchema.index({ "appointment.status": 1 });
hisSchema.index({ "aiCaseTaking.sessionId": 1 });
hisSchema.index({ "patient.hospitalPatientId": 1 });
hisSchema.index({ "appointment.appointmentId": 1 });
hisSchema.index({ "doctor.specialization": 1 });
hisSchema.index({ "consultation.diagnosis": 1 });

const HIS = mongoose.model("HIS", hisSchema);

export default HIS;