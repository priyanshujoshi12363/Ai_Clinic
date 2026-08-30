import Patient from '../Models/abha.model.js';
import HIS from '../Models/HIS.model.js';
import cloudinary from '../utils/cloudinary.js';
import axios from 'axios';
import { Readable } from 'stream';


export const startConsultation = async (req, res) => {
  try {
    const { abhaId, consultationType, hospitalId, hospitalName, doctorId, doctorName } = req.body;

    const patient = await Patient.findOne({ abhaId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const visitId = `VISIT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const tokenNumber = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;

    const visit = {
      visitId,
      date: new Date(),
      hospitalId,
      hospitalName,
      consultationType,
      status: 'IN_PROGRESS',
      tokenNumber
    };

    patient.visits.push(visit);
    patient.totalVisits = patient.visits.length;
    patient.lastVisitDate = new Date();
    await patient.save();

    const hisRecord = new HIS({
      hospitalId,
      hospitalName,
      patient: {
        abhaId: patient.abhaId,
        hospitalPatientId: `HP_${Date.now()}`,
        name: patient.name,
        aadhaarNumber: patient.aadhaarNumber,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        mobile: patient.mobile || ''
      },
      doctor: {
        doctorId: doctorId || '',
        doctorName: doctorName || ''
      },
      appointment: {
        appointmentId: `APP_${Date.now()}`,
        tokenNumber,
        date: new Date(),
        status: 'KIOSK_IN_PROGRESS'
      },
      aiCaseTaking: {
        sessionId: `SESSION_${Date.now()}`,
        mode: consultationType,
        startedAt: new Date()
      },
      timing: {
        patientArrivedAt: new Date(),
        kioskStartedAt: new Date()
      }
    });

    await hisRecord.save();

    res.status(201).json({
      success: true,
      data: {
        visitId,
        tokenNumber,
        patientName: patient.name,
        abhaId: patient.abhaId,
        consultationType,
        status: 'IN_PROGRESS'
      }
    });

  } catch (error) {
    console.error('Start consultation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveConsultationSummary = async (req, res) => {
  try {
    const { visitId } = req.params;
    const {
      summary,
      summaryHindi,
      keyPoints,
      redFlags,
      urgency,
      clinicalHistory,
      ayushHistory,
      prescriptions,
      chiefComplaint
    } = req.body;

    const patient = await Patient.findOne({ 'visits.visitId': visitId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    const visit = patient.visits.find(v => v.visitId === visitId);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    visit.aiSummary = summary;
    visit.aiSummaryHindi = summaryHindi || summary;
    visit.aiKeyPoints = keyPoints || [];
    visit.aiRedFlags = redFlags || [];
    visit.urgency = urgency || 'ROUTINE';
    visit.clinicalHistory = clinicalHistory || {};
    visit.chiefComplaint = chiefComplaint || clinicalHistory?.chiefComplaint || '';

    // ✅ Convert ayushHistory strings to objects with assessment field
    if (ayushHistory) {
      visit.ayushHistory = {
        prakriti: ayushHistory.prakriti ? { assessment: ayushHistory.prakriti } : {},
        vikriti: ayushHistory.vikriti ? { assessment: ayushHistory.vikriti } : {},
        sara: ayushHistory.sara ? { assessment: ayushHistory.sara } : {},
        samhanana: ayushHistory.samhanana ? { assessment: ayushHistory.samhanana } : {},
        pramana: ayushHistory.pramana ? { assessment: ayushHistory.pramana } : {},
        satmya: ayushHistory.satmya ? { assessment: ayushHistory.satmya } : {},
        sattva: ayushHistory.sattva ? { assessment: ayushHistory.sattva } : {},
        aharaShakti: ayushHistory.aharaShakti ? { assessment: ayushHistory.aharaShakti } : {},
        vyayamaShakti: ayushHistory.vyayamaShakti ? { assessment: ayushHistory.vyayamaShakti } : {},
        vaya: ayushHistory.vaya ? { assessment: ayushHistory.vaya } : {}
      };
    }

    if (prescriptions && prescriptions.length > 0) {
      visit.prescriptions = prescriptions.map(p => ({
        ...p,
        prescribedAt: new Date()
      }));
    }

    visit.emergencyFlags = {
      triggered: redFlags && redFlags.length > 0,
      symptoms: redFlags || [],
      urgency: urgency || 'ROUTINE',
      triageAlert: redFlags && redFlags.length > 0,
      alertedAt: redFlags && redFlags.length > 0 ? new Date() : null
    };

    if (!patient.medicalHistory) {
      patient.medicalHistory = {
        conditions: [],
        allergies: [],
        surgeries: [],
        familyHistory: [],
        lifestyle: {}
      };
    }

    const history = patient.medicalHistory;

    if (clinicalHistory?.chiefComplaint) {
      const commonConditions = ['fever', 'cough', 'cold', 'diabetes', 'hypertension', 'asthma', 'arthritis', 'heart disease', 'thyroid', 'anemia'];
      const text = clinicalHistory.chiefComplaint.toLowerCase();
      commonConditions.forEach(cond => {
        if (text.includes(cond)) {
          const exists = history.conditions.some(c => c.name.toLowerCase() === cond);
          if (!exists) {
            history.conditions.push({
              name: cond.charAt(0).toUpperCase() + cond.slice(1),
              diagnosedDate: new Date().toISOString().split('T')[0],
              status: 'Active'
            });
          }
        }
      });
    }

    if (clinicalHistory?.allergyHistory) {
      const allergies = Array.isArray(clinicalHistory.allergyHistory) 
        ? clinicalHistory.allergyHistory 
        : [clinicalHistory.allergyHistory];
      allergies.forEach(a => {
        const exists = history.allergies.some(al => al.allergen.toLowerCase() === a.toLowerCase());
        if (!exists && a.toLowerCase() !== 'none') {
          history.allergies.push({ allergen: a, severity: 'Moderate' });
        }
      });
    }

    if (clinicalHistory?.familyHistory) {
      const conditions = clinicalHistory.familyHistory.split(',').map(s => s.trim());
      conditions.forEach(c => {
        const exists = history.familyHistory.some(f => f.condition.toLowerCase() === c.toLowerCase());
        if (!exists) {
          history.familyHistory.push({ condition: c, relation: 'Family' });
        }
      });
    }

    if (clinicalHistory?.personalHistory) {
      history.lifestyle = {
        ...history.lifestyle,
        ...clinicalHistory.personalHistory
      };
    }

    if (ayushHistory) {
      if (!patient.ayushHistory) patient.ayushHistory = {};
      const ayushFields = ['prakriti', 'vikriti', 'sara', 'samhanana', 'pramana', 'satmya', 'sattva', 'aharaShakti', 'vyayamaShakti', 'vaya'];
      ayushFields.forEach(field => {
        if (ayushHistory[field]) {
          patient.ayushHistory[field] = {
            assessment: ayushHistory[field],
            updatedAt: new Date()
          };
        }
      });
    }

    patient.medicalHistory = history;
    
    // ✅ Use only valid enum value: COMPLETED (since KIOSK_COMPLETED doesn't exist in your enum)
    visit.status = 'COMPLETED';
    patient.lastVisitDate = new Date();
    await patient.save();

    const hisRecord = await HIS.findOne({
      'appointment.appointmentId': `APP_${visitId.split('_')[1]}`
    });

    if (hisRecord) {
      hisRecord.aiCaseTaking.completedAt = new Date();
      hisRecord.aiCaseTaking.structuredHistory = clinicalHistory || {};
      hisRecord.aiCaseTaking.ayushHistory = ayushHistory || {};
      hisRecord.aiCaseTaking.aiSummary = {
        summary: summary,
        summaryHindi: summaryHindi || summary,
        keyFindings: keyPoints || [],
        redFlags: redFlags || [],
        urgency: urgency || 'ROUTINE'
      };
      hisRecord.aiCaseTaking.urgency = urgency || 'ROUTINE';
      hisRecord.appointment.status = 'KIOSK_COMPLETED';
      hisRecord.timing.kioskCompletedAt = new Date();
      await hisRecord.save();
    }

    res.json({
      success: true,
      message: 'Summary saved successfully',
      data: {
        visitId,
        tokenNumber: visit.tokenNumber,
        status: visit.status,
        urgency: visit.urgency
      }
    });

  } catch (error) {
    console.error('Save summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const generateConsultationAudio = async (req, res) => {
  try {
    const { visitId } = req.params;
    const { language = 'hi-IN' } = req.body;

    const patient = await Patient.findOne({ 'visits.visitId': visitId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    const visit = patient.visits.find(v => v.visitId === visitId);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    const textToSpeak = visit.aiSummaryHindi || visit.aiSummary || 'No summary available';

    const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
    const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';

    const voiceMap = {
      'hi-IN': 'shubh',
      'en-US': 'shubh',
      'ta-IN': 'shubh',
      'te-IN': 'shubh'
    };
    const voice = voiceMap[language] || 'shubh';

    let response;
    try {
      response = await axios.post(SARVAM_TTS_URL, {
        inputs: [textToSpeak],
        target_language_code: language,
        speaker: voice,
        pace: 1.0,
        speech_sample_rate: 8000,
        model: 'bulbul:v3'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': SARVAM_API_KEY
        },
        responseType: 'json'
      });
    } catch (error) {
      const sarvamError = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      return res.status(502).json({ success: false, message: 'Sarvam TTS failed: ' + sarvamError });
    }

    console.log('Sarvam response keys:', Object.keys(response.data || {}));

    const base64Audio = response.data?.audios?.[0]
      || response.data?.audio
      || response.data?.output;

    if (!base64Audio) {
      console.error('Unrecognized Sarvam response shape:', JSON.stringify(response.data).slice(0, 500));
      return res.status(502).json({ success: false, message: 'Sarvam TTS returned no recognizable audio field' });
    }

    const audioBuffer = Buffer.from(base64Audio, 'base64');

    let uploadResult;
    try {
      uploadResult = await new Promise((resolve, reject) => {
        const stream = Readable.from(audioBuffer);
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: `consultation_audio/${patient.abhaId}`,
            public_id: `summary_${Date.now()}`,
            format: 'wav'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.pipe(uploadStream);
      });
    } catch (error) {
      console.error('Cloudinary raw error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      return res.status(500).json({
        success: false,
        message: 'Audio upload failed: ' + (error?.message || error?.error?.message || JSON.stringify(error))
      });
    }

    if (!uploadResult) {
      return res.status(500).json({ success: false, message: 'Audio upload failed' });
    }

    const audioData = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      duration: Math.round(audioBuffer.length / 16000),
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      language: language,
      generatedAt: new Date(),
      isActive: true
    };

    visit.audioSummary = audioData;

    try {
      const hisRecord = await HIS.findOne({
        'appointment.appointmentId': `APP_${visitId.split('_')[1]}`
      });

      if (hisRecord) {
        hisRecord.aiCaseTaking.audioSummary = audioData;
        await hisRecord.save();
      }
    } catch (error) {
      console.error('HIS sync error:', error);
    }

    await patient.save();

    res.json({
      success: true,
      message: 'Audio generated successfully',
      data: {
        url: audioData.url,
        publicId: audioData.publicId,
        duration: audioData.duration,
        format: audioData.format
      }
    });

  } catch (error) {
    console.error('Generate audio error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};