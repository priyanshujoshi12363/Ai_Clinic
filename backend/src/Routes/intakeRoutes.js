import express from 'express';
import {
  startSession,
  identifyByFace,
  identifyByAbha,
  giveConsent,
  selectMode,
  beginInterview,
  interviewTurn,
  correctUnderstanding,
  addDocument,
  confirmDocument,
  skipDocuments,
  buildReview,
  finalizeSession,
  getSession,
  abandonSession,
  doctorQueue,
  doctorBriefingAudio
} from '../Controller/intakeController.js';

const router = express.Router();

router.post('/start', startSession);
router.get('/queue', doctorQueue);

router.get('/:sessionId', getSession);
router.post('/:sessionId/identify/face', identifyByFace);
router.post('/:sessionId/identify/abha', identifyByAbha);
router.post('/:sessionId/consent', giveConsent);
router.post('/:sessionId/mode', selectMode);
router.post('/:sessionId/interview/begin', beginInterview);
router.post('/:sessionId/interview/turn', interviewTurn);
router.post('/:sessionId/interview/correct', correctUnderstanding);
router.post('/:sessionId/documents', addDocument);
router.post('/:sessionId/documents/skip', skipDocuments);
router.post('/:sessionId/documents/:documentId/confirm', confirmDocument);
router.post('/:sessionId/review', buildReview);
router.post('/:sessionId/finalize', finalizeSession);
router.post('/:sessionId/briefing', doctorBriefingAudio);
router.delete('/:sessionId', abandonSession);

export default router;
