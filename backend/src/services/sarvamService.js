import axios from 'axios';

const SARVAM_BASE = 'https://api.sarvam.ai';
const STT_MODEL = process.env.SARVAM_STT_MODEL || 'saarika:v2.5';
const TTS_MODEL = process.env.SARVAM_TTS_MODEL || 'bulbul:v3';
const TTS_SPEAKER = process.env.SARVAM_TTS_SPEAKER || 'shreya';
const TTS_PACE = Number(process.env.SARVAM_TTS_PACE || 1.15);

const TTS_CHUNK_CHARS = 450;

const apiKey = () => process.env.SARVAM_API_KEY;

export const SARVAM_LANGUAGES = [
  'hi-IN', 'en-IN', 'bn-IN', 'gu-IN', 'kn-IN',
  'ml-IN', 'mr-IN', 'od-IN', 'pa-IN', 'ta-IN', 'te-IN'
];

const VOICE_FALLBACK = {
  'ur-IN': 'hi-IN',
  'as-IN': 'bn-IN',
  'or-IN': 'od-IN'
};

export const normalizeLanguage = (code) => {
  if (!code) return 'hi-IN';

  const raw = String(code).trim().replace('_', '-');
  const full = raw.includes('-') ? raw : `${raw.toLowerCase()}-IN`;
  const [base, region] = full.split('-');
  const candidate = `${base.toLowerCase()}-${(region || 'IN').toUpperCase()}`;

  if (SARVAM_LANGUAGES.includes(candidate)) return candidate;
  if (VOICE_FALLBACK[candidate]) return VOICE_FALLBACK[candidate];
  return 'hi-IN';
};

const stripDataUrl = (value) =>
  value && value.includes('base64,') ? value.split('base64,')[1] : value;

export const speechToText = async (audioBase64, { languageHint = 'unknown', mimeType = 'audio/wav' } = {}) => {
  if (!apiKey()) {
    return { success: false, message: 'SARVAM_API_KEY is not configured' };
  }
  if (!audioBase64) {
    return { success: false, message: 'Audio is required' };
  }

  try {
    const buffer = Buffer.from(stripDataUrl(audioBase64), 'base64');
    const extension = mimeType.includes('webm') ? 'webm'
      : mimeType.includes('ogg') ? 'ogg'
      : mimeType.includes('mp3') || mimeType.includes('mpeg') ? 'mp3'
      : 'wav';

    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mimeType }), `speech.${extension}`);
    form.append('model', STT_MODEL);
    form.append('language_code', languageHint);

    const response = await axios.post(`${SARVAM_BASE}/speech-to-text`, form, {
      headers: { 'api-subscription-key': apiKey() },
      timeout: 60000,
      maxBodyLength: Infinity
    });

    const transcript = (response.data?.transcript || '').trim();

    return {
      success: true,
      transcript,

      detectedLanguage: response.data?.language_code
        ? normalizeLanguage(response.data.language_code)
        : null,
      requestId: response.data?.request_id || null
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data
        ? JSON.stringify(error.response.data).slice(0, 300)
        : error.message
    };
  }
};

const splitForSpeech = (text) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= TTS_CHUNK_CHARS) return [clean];

  const sentences = clean.split(/(?<=[.!?।])\s+/);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if (sentence.length > TTS_CHUNK_CHARS) {
      if (current) { chunks.push(current); current = ''; }
      for (let i = 0; i < sentence.length; i += TTS_CHUNK_CHARS) {
        chunks.push(sentence.slice(i, i + TTS_CHUNK_CHARS));
      }
      continue;
    }

    if ((current + ' ' + sentence).trim().length > TTS_CHUNK_CHARS) {
      chunks.push(current);
      current = sentence;
    } else {
      current = (current + ' ' + sentence).trim();
    }
  }

  if (current) chunks.push(current);
  return chunks;
};

export const textToSpeech = async (text, language = 'hi-IN', options = {}) => {
  if (!apiKey()) {
    return { success: false, message: 'SARVAM_API_KEY is not configured' };
  }

  const chunks = splitForSpeech(text);
  if (chunks.length === 0) {
    return { success: false, message: 'Nothing to speak' };
  }

  const targetLanguage = normalizeLanguage(language);
  const speaker = options.speaker || TTS_SPEAKER;
  const pace = Number(options.pace || TTS_PACE);

  try {
    const audios = [];

    for (const chunk of chunks) {
      const response = await axios.post(
        `${SARVAM_BASE}/text-to-speech`,
        {
          inputs: [chunk],
          target_language_code: targetLanguage,
          speaker,
          pace,
          speech_sample_rate: 22050,
          model: TTS_MODEL
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': apiKey()
          },
          timeout: 60000
        }
      );

      const audio = response.data?.audios?.[0] || response.data?.audio || response.data?.output;
      if (!audio) {
        return { success: false, message: 'Sarvam TTS returned no audio field' };
      }
      audios.push(audio);
    }

    return { success: true, audios, language: targetLanguage, format: 'wav' };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data
        ? JSON.stringify(error.response.data).slice(0, 300)
        : error.message
    };
  }
};

export const textToSpeechBuffer = async (text, language = 'hi-IN') => {
  const result = await textToSpeech(text, language);
  if (!result.success) return result;

  const buffers = result.audios.map((a) => Buffer.from(a, 'base64'));

  if (buffers.length === 1) {
    return { success: true, buffer: buffers[0], language: result.language };
  }

  const header = Buffer.from(buffers[0].subarray(0, 44));
  const bodies = buffers.map((b, i) => (i === 0 ? b.subarray(44) : b.subarray(44)));
  const data = Buffer.concat(bodies);

  header.writeUInt32LE(36 + data.length, 4);
  header.writeUInt32LE(data.length, 40);

  return { success: true, buffer: Buffer.concat([header, data]), language: result.language };
};

export const translate = async (text, from, to) => {
  if (!apiKey() || !text) {
    return { success: false, message: 'Nothing to translate' };
  }

  try {
    const response = await axios.post(
      `${SARVAM_BASE}/translate`,
      {
        input: String(text).slice(0, 950),
        source_language_code: from ? normalizeLanguage(from) : 'auto',
        target_language_code: normalizeLanguage(to),
        model: process.env.SARVAM_TRANSLATE_MODEL || 'mayura:v1'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey()
        },
        timeout: 30000
      }
    );

    return { success: true, text: response.data?.translated_text || '' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
