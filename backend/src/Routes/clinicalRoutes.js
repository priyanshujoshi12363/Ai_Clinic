import express from 'express';
import {
  seedMedicineDb, searchMedicines, getQueue, getPatientDetail,
  createPrescription, updatePrescription, uploadLabReport
} from '../Controller/clinicalController.js';

const router = express.Router();

// Medicine master
router.post('/medicines/seed', seedMedicineDb);
router.get('/medicines', searchMedicines);

// Doctor dashboard
router.get('/queue', getQueue);
router.get('/patient/:abhaId', getPatientDetail);
router.post('/patient/:abhaId/prescription', createPrescription);
router.put('/patient/:abhaId/prescription/:prescriptionId', updatePrescription);
router.post('/patient/:abhaId/lab-report', uploadLabReport);

export default router;
