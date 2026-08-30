import express from 'express';
import {
  handleEmergency,
  getEmergency,
  updateEmergency
} from '../Controller/EmergencyController.js';

const router = express.Router();

router.post('/handle', handleEmergency);
router.get('/queue', getEmergency);
router.put('/:tokenNumber/status', updateEmergency);

export default router;