import express from 'express';
import {
  seedMedicineDb, searchMedicines, getQueue, getPatientDetail,
  createPrescription, uploadLabReport
} from '../Controller/clinicalController.js';

const router = express.Router();

// Medicine master
router.post('/medicines/seed', seedMedicineDb);
router.get('/medicines', searchMedicines);

// Doctor dashboard
router.get('/queue', getQueue);
router.get('/patient/:abhaId', getPatientDetail);
router.post('/patient/:abhaId/prescription', createPrescription);
router.post('/patient/:abhaId/lab-report', uploadLabReport);

export default router;
