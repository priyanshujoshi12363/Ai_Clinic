import {
  findAadhaarByNumber,
  registerPatientWithAadhaarAndFace,
  generateOTP,
  verifyOTPCode
} from '../services/registrationService.js';
import Patient from '../Models/abha.model.js';

export const verifyAadhaar = async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;
    if (!aadhaarNumber) {
      return res.status(400).json({ success: false, message: 'Aadhaar number is required' });
    }
    
    const result = findAadhaarByNumber(aadhaarNumber);
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    const cleanNumber = aadhaarNumber.replace(/[\s-]/g, '');
    const existingPatient = await Patient.findOne({ aadhaarNumber: cleanNumber });
    
    res.json({
      success: true,
      message: 'Aadhaar verified successfully',
      data: {
        ...result.data,
        alreadyRegistered: !!existingPatient,
        abhaId: existingPatient?.abhaId || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendOTP = async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;
    if (!aadhaarNumber) {
      return res.status(400).json({ success: false, message: 'Aadhaar number is required' });
    }
    
    const result = generateOTP(aadhaarNumber);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerPatient = async (req, res) => {
  try {
    const { aadhaarNumber, otp, faceImage } = req.body;
    
    if (!aadhaarNumber) {
      return res.status(400).json({ success: false, message: 'Aadhaar number is required' });
    }
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }
    if (!faceImage) {
      return res.status(400).json({ success: false, message: 'Face image is required' });
    }

    const otpResult = verifyOTPCode(aadhaarNumber, otp);
    if (!otpResult.success) {
      return res.status(400).json(otpResult);
    }

    const result = await registerPatientWithAadhaarAndFace(aadhaarNumber, otp, faceImage);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientByABHA = async (req, res) => {
  try {
    const { abhaId } = req.params;
    const patient = await Patient.findOne({ abhaId });
    
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientByAadhaar = async (req, res) => {
  try {
    const { aadhaarNumber } = req.params;
    const cleanNumber = aadhaarNumber.replace(/[\s-]/g, '');
    const patient = await Patient.findOne({ aadhaarNumber: cleanNumber });
    
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};