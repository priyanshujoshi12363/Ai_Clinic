import express from 'express';
import {
  emergencyIntake,
  answerEssential,
  identifyEmergencyPatient,
  getEmergencyCase,
  emergencyBriefing,
  handleEmergency,
  getEmergency,
  updateEmergency
} from '../Controller/EmergencyController.js';

const router = express.Router();

router.post('/intake', emergencyIntake);
router.post('/handle', handleEmergency);
router.get('/queue', getEmergency);

router.get('/:tokenNumber', getEmergencyCase);
router.post('/:tokenNumber/answer', answerEssential);
router.post('/:tokenNumber/identify', identifyEmergencyPatient);
router.post('/:tokenNumber/briefing', emergencyBriefing);
router.put('/:tokenNumber/status', updateEmergency);

export default router;
