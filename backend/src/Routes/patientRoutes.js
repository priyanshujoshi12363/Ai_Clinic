import express from 'express';
import {
  verifyAadhaar,
  sendOTP,
  registerPatient,
  getPatientByABHA,
  getPatientByAadhaar,
  getAllPatients,
  verifyPatientByFace
} from '../Controller/patientController.js';

const router = express.Router();

router.post('/verify-aadhaar', verifyAadhaar);
router.post('/send-otp', sendOTP);
router.post('/register', registerPatient);
router.get('/abha/:abhaId', getPatientByABHA);
router.get('/aadhaar/:aadhaarNumber', getPatientByAadhaar);
router.get('/', getAllPatients);
router.post('/:abhaId/verify-face', verifyPatientByFace);

export default router;