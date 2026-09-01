import axios from 'axios';
import { offlineChat } from './offlineAI.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'https://ollama.com';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:31b';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

const client = axios.create({
  baseURL: OLLAMA_URL,
  timeout: 180000,
  headers: { 'Content-Type': 'application/json' }
});

const authHeader = () =>
  OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {};

export const parseJsonLoose = (text) => {
  if (!text) return null;

  let body = String(text).trim();

  const fenced = body.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) body = fenced[1].trim();

  try {
    return JSON.parse(body);
  } catch {
  }

  const start = body.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < body.length; i++) {
    const ch = body[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch.charCodeAt(0) === 92) escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(body.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }

  return null;
};

export const chat = async (messages, options = {}) => {
  const { json = false, temperature = 0.3, model = OLLAMA_MODEL } = options;

  try {
    const response = await client.post(
      '/api/chat',
      {
        model,
        messages,
        stream: false,
        ...(json ? { format: 'json' } : {}),
        options: { temperature }
      },
      { headers: authHeader() }
    );

    if (response.data?.error) {
      throw new Error(`Ollama error: ${response.data.error}`);
    }

    return response.data?.message?.content ?? '';
  } catch (error) {
    // Auto offline fallback: run local Gemma when the cloud LLM is unreachable.
    try {
      const content = await offlineChat(messages, { json, temperature });
      console.warn(`[hybrid] LLM online failed (${error.message}); used offline Gemma.`);
      return content;
    } catch (offlineError) {
      throw new Error(`Cloud LLM failed (${error.message}); offline Gemma also failed: ${offlineError.message}`);
    }
  }
};

export const chatJSON = async (messages, options = {}) => {
  const raw = await chat(messages, { ...options, json: true });
  const parsed = parseJsonLoose(raw);
  if (parsed) return parsed;

  const retry = await chat(
    [...messages, {
      role: 'user',
      content: 'Your previous reply was not valid JSON. Reply again with the JSON object ONLY. No prose, no markdown fences.'
    }],
    { ...options, json: true, temperature: 0 }
  );

  const reparsed = parseJsonLoose(retry);
  if (reparsed) return reparsed;

  throw new Error('LLM did not return parsable JSON');
};

export const chatVisionJSON = async (systemPrompt, userPrompt, images, options = {}) => {
  const clean = (images || []).map((img) =>
    img.includes('base64,') ? img.split('base64,')[1] : img
  );

  return chatJSON(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt, images: clean }
    ],
    { temperature: 0, ...options }
  );
};

export const healthCheck = async () => {
  try {
    const response = await client.get('/api/tags', { headers: authHeader(), timeout: 15000 });
    const models = (response.data?.models || []).map((m) => m.name);
    return {
      success: true,
      configuredModel: OLLAMA_MODEL,
      modelAvailable: models.includes(OLLAMA_MODEL),
      totalModels: models.length
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const activeModel = () => OLLAMA_MODEL;
