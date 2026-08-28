import express from 'express';
import { searchPatientByFace, getPatientFaceStatusController } from '../Controller/faceSearchController.js';

const router = express.Router();

router.post('/search', searchPatientByFace);
router.get('/:abhaId/face-status', getPatientFaceStatusController);

export default router;