import express from 'express';
import { transcribe, synthesize, translateText, languages, pipelineHealth } from '../Controller/voiceController.js';

const router = express.Router();

router.post('/stt', transcribe);
router.post('/tts', synthesize);
router.post('/translate', translateText);
router.get('/languages', languages);
router.get('/health', pipelineHealth);

export default router;
