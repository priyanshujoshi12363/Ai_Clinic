import { speechToText, textToSpeech, translate, normalizeLanguage, SARVAM_LANGUAGES } from '../services/sarvamService.js';
import { healthCheck as llmHealth, activeModel } from '../services/llmService.js';
import { healthCheck as faceHealth } from '../services/faceService.js';

export const transcribe = async (req, res) => {
  try {
    const { audio, mimeType = 'audio/webm', languageHint = 'unknown' } = req.body;

    if (!audio) {
      return res.status(400).json({ success: false, message: 'Audio is required' });
    }

    const result = await speechToText(audio, { languageHint, mimeType });

    if (!result.success) {
      return res.status(502).json({ success: false, message: result.message });
    }

    return res.json({
      success: true,
      data: {
        transcript: result.transcript,
        detectedLanguage: result.detectedLanguage,
        requestId: result.requestId
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const synthesize = async (req, res) => {
  try {
    const { text, language = 'hi-IN' } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const result = await textToSpeech(text, language);

    if (!result.success) {
      return res.status(502).json({ success: false, message: result.message });
    }

    return res.json({
      success: true,
      data: {
        audios: result.audios,
        format: result.format,
        language: result.language
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const translateText = async (req, res) => {
  try {
    const { text, from, to = 'en-IN' } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const result = await translate(text, from, to);

    if (!result.success) {
      return res.status(502).json({ success: false, message: result.message });
    }

    return res.json({ success: true, data: { text: result.text, language: normalizeLanguage(to) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const languages = async (req, res) => {
  const names = {
    'hi-IN': 'हिन्दी',
    'en-IN': 'English',
    'bn-IN': 'বাংলা',
    'gu-IN': 'ગુજરાતી',
    'kn-IN': 'ಕನ್ನಡ',
    'ml-IN': 'മലയാളം',
    'mr-IN': 'मराठी',
    'od-IN': 'ଓଡ଼ିଆ',
    'pa-IN': 'ਪੰਜਾਬੀ',
    'ta-IN': 'தமிழ்',
    'te-IN': 'తెలుగు'
  };

  return res.json({
    success: true,
    data: SARVAM_LANGUAGES.map((code) => ({ code, name: names[code] || code }))
  });
};

export const pipelineHealth = async (req, res) => {
  const [llm, face] = await Promise.all([llmHealth(), faceHealth()]);

  const sarvamConfigured = Boolean(process.env.SARVAM_API_KEY);

  return res.json({
    success: true,
    data: {
      llm: { ...llm, model: activeModel() },
      speech: { configured: sarvamConfigured, provider: 'sarvam' },
      face: { reachable: face.success !== false, ...face },
      readyForVoiceIntake: Boolean(llm.success && sarvamConfigured)
    }
  });
};
