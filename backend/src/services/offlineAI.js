import axios from 'axios';

// Local offline AI service (Whisper STT + Gemma LLM) — the air-gapped fallback.
// Started via ai-service/start_offline.ps1 on port 8010.
const OFFLINE_URL = process.env.OFFLINE_AI_URL || 'http://127.0.0.1:8010';

const client = axios.create({
  baseURL: OFFLINE_URL,
  timeout: 180000,
  headers: { 'Content-Type': 'application/json' }
});

const stripDataUrl = (value) =>
  typeof value === 'string' && value.includes('base64,') ? value.split('base64,')[1] : value;

let lastReachable = null;

export const offlineReachable = async () => {
  try {
    await client.get('/health', { timeout: 4000 });
    lastReachable = true;
  } catch {
    lastReachable = false;
  }
  return lastReachable;
};

export const offlineHealth = async () => {
  try {
    const { data } = await client.get('/health', { timeout: 4000 });
    return { success: true, ...data };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Whisper speech-to-text. Returns the same shape as sarvamService.speechToText.
export const offlineSTT = async (audioBase64, { languageHint } = {}) => {
  const language = languageHint && languageHint !== 'unknown'
    ? String(languageHint).split('-')[0]
    : null;

  const { data } = await client.post('/stt', {
    audio: stripDataUrl(audioBase64),
    language
  });

  return {
    success: true,
    transcript: (data?.transcript || '').trim(),
    detectedLanguage: data?.language ? String(data.language).split('-')[0] : null,
    engine: 'offline-whisper'
  };
};

// Gemma chat. Mirrors llmService.chat(messages, { json, temperature }).
export const offlineChat = async (messages, { json = false, temperature = 0.3, maxTokens = 768 } = {}) => {
  const clean = (messages || [])
    .filter((m) => m && m.content)
    .map((m) => ({ role: m.role, content: String(m.content) }));

  const { data } = await client.post('/llm', {
    messages: clean,
    json_mode: json,
    temperature,
    max_new_tokens: maxTokens
  });

  return data?.content ?? '';
};
