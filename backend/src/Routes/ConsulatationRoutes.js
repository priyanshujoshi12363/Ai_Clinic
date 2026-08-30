import express from 'express';
import {
  startConsultation,
  saveConsultationSummary,
  generateConsultationAudio
} from '../Controller/consultationController.js';

const router = express.Router();

router.post('/start', startConsultation);
router.post('/:visitId/summary', saveConsultationSummary);
router.post('/:visitId/audio', generateConsultationAudio);

export default router;