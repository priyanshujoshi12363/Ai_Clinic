import express from 'express';
import {
  verifyABHA,
  checkFaceLinked,
  linkFace,
  getABHAPatientDetails
} from '../Controller/AbhaController.js';

const router = express.Router();

router.post('/verify', verifyABHA);
router.get('/:abhaId/face-check', checkFaceLinked);
router.post('/link-face', linkFace);
router.get('/:abhaId', getABHAPatientDetails);

export default router;