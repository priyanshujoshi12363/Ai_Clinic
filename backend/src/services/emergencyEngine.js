import { chatJSON } from './llmService.js';
import { detectRedFlags, highestUrgency, languageName } from './intakeEngine.js';

export const TRIAGE_LEVELS = {
  RED: { rank: 0, urgency: 'EMERGENCY', targetMinutes: 0, label: 'Immediate' },
  ORANGE: { rank: 1, urgency: 'EMERGENCY', targetMinutes: 10, label: 'Very urgent' },
  YELLOW: { rank: 2, urgency: 'URGENT', targetMinutes: 60, label: 'Urgent' },
  GREEN: { rank: 3, urgency: 'ROUTINE', targetMinutes: 120, label: 'Standard' }
};

export const triageRank = (level) => TRIAGE_LEVELS[level]?.rank ?? 3;

const CRITICAL_PATTERNS = [
  /unconscious|not responding|behosh|बेहोश|no pulse|not breathing|saans nahi|साँस नहीं|सांस नहीं/i,
  /heavy bleeding|bleeding a lot|khoon beh|खून बह|रक्तस्राव|spurting/i,
  /accident|crash|bike accident|road accident|durghatna|दुर्घटना|एक्सीडेंट|fell from|गिर गया/i,
  /chest pain|seene mein dard|सीने में दर्द|छाती में दर्द|heart attack|दिल का दौरा/i,
  /stroke|paralysis|lakwa|लकवा|face droop|slurred|मुंह टेढ़ा/i,
  /poison|zeher|ज़हर|जहर|overdose|snake bite|saap|सांप ने काटा/i,
  /burn|jal gaya|जल गया|जल गयी|scald/i,
  /seizure|fit|convulsion|मिर्गी|दौरा पड़/i,
  /labour pain|delivery|prasav|प्रसव|बच्चा होने वाला/i
];

const looksCritical = (text) => CRITICAL_PATTERNS.some((re) => re.test(String(text || '')));

const SAFETY_QUESTIONS = {
  'en-IN': [
    { key: 'conscious', question: 'Is the patient awake and able to talk?' },
    { key: 'breathing', question: 'Is there any difficulty in breathing?' },
    { key: 'bleeding', question: 'Is there any bleeding? From where?' }
  ],
  'hi-IN': [
    { key: 'conscious', question: 'क्या मरीज़ होश में है और बात कर पा रहा है?' },
    { key: 'breathing', question: 'क्या साँस लेने में तकलीफ़ हो रही है?' },
    { key: 'bleeding', question: 'कहीं से खून बह रहा है? कहाँ से?' }
  ]
};

const fallbackQuestions = (language) =>
  SAFETY_QUESTIONS[language] || SAFETY_QUESTIONS['hi-IN'];

const buildTriagePrompt = (language) => `You are the triage assistant at the emergency entrance of an Indian hospital.
An attendant or the patient has just said what happened. You have seconds, not minutes.

WHAT YOU DO:
- Assign a triage level so the emergency team knows how fast to move.
- Write a one-line handover for the emergency doctor.
- Choose the few questions that matter MOST for this specific complaint.

WHAT YOU NEVER DO:
- Never diagnose. Never name a treatment, drug or dose.
- Never tell anyone the patient is fine or can wait at home.
- Never delay care to gather information.
When unsure between two levels, always choose the more urgent one.

TRIAGE LEVELS:
RED    - life threat now: not breathing, no response, severe bleeding, major trauma, choking, seizure in progress, suspected heart attack or stroke
ORANGE - could deteriorate fast: chest pain, breathlessness, severe pain, poisoning, snake bite, major burn, head injury, active labour, high fever in an infant
YELLOW - needs a doctor soon but stable: moderate pain, vomiting, fracture without deformity, moderate injury
GREEN  - stable minor problem

RED FLAGS - read this carefully:
"redFlags" lists ONLY danger signs the person ACTUALLY described as already present.
It is not a watch list, not a list of complications to look out for, and not advice.
If they described a minor problem with no danger sign present, return an empty array.
Writing "uncontrolled bleeding" for someone who said the bleeding stopped is a serious error.

ESSENTIAL QUESTIONS:
Give 3 to 5 questions, written in ${languageName(language)} in its own script.
They must be short, answerable by a frightened relative, and specific to what was described
(a road accident needs different questions from chest pain).
Never ask for name, ID, ABHA, Aadhaar, address or payment. Identification happens later.

Reply with this JSON object only:
{
  "triageLevel": "RED" | "ORANGE" | "YELLOW" | "GREEN",
  "chiefComplaint": "<short English phrase for the board>",
  "redFlags": ["<danger sign in English>"],
  "aiSummary": "<2 to 3 sentence English handover for the emergency doctor>",
  "keyPoints": ["<3 to 5 short English facts>"],
  "suspectedCategory": "<TRAUMA | CARDIAC | RESPIRATORY | NEUROLOGICAL | OBSTETRIC | POISONING | BURNS | PAEDIATRIC | OTHER>",
  "essentialQuestions": [{ "key": "<short_slug>", "question": "<in ${languageName(language)}>" }],
  "patientReassurance": "<one calm sentence in ${languageName(language)} telling them the team has been alerted and to stay here>"
}`;

export const triage = async ({ text, language }) => {
  const ruleFlags = detectRedFlags(text);
  const critical = looksCritical(text);

  let ai = null;
  try {
    ai = await chatJSON(
      [
        { role: 'system', content: buildTriagePrompt(language) },
        { role: 'user', content: `The person at the emergency desk said:\n"${text}"\n\nTriage now.` }
      ],
      { temperature: 0.1 }
    );
  } catch {
    ai = null;
  }

  const aiLevel = TRIAGE_LEVELS[ai?.triageLevel] ? ai.triageLevel : null;

  const floorLevel = ruleFlags.some((f) => f.urgency === 'EMERGENCY')
    ? 'ORANGE'
    : critical
    ? 'ORANGE'
    : ruleFlags.length
    ? 'YELLOW'
    : null;

  let triageLevel = aiLevel || floorLevel || 'YELLOW';

  if (floorLevel && triageRank(floorLevel) < triageRank(triageLevel)) {
    triageLevel = floorLevel;
  }

  const modelFlags = triageLevel === 'GREEN' ? [] : (Array.isArray(ai?.redFlags) ? ai.redFlags.filter(Boolean) : []);

  const redFlags = [...new Set([...modelFlags, ...ruleFlags.map((f) => f.flag)])];

  const questions =
    Array.isArray(ai?.essentialQuestions) && ai.essentialQuestions.length
      ? ai.essentialQuestions
          .filter((q) => q?.question)
          .slice(0, 5)
          .map((q, i) => ({ key: q.key || `q${i + 1}`, question: q.question }))
      : fallbackQuestions(language);

  const rankUrgency = { EMERGENCY: 3, URGENT: 2, ROUTINE: 1 };
  const levelUrgency = TRIAGE_LEVELS[triageLevel].urgency;
  const flagUrgency = highestUrgency(ruleFlags);

  return {
    triageLevel,
    triageLabel: TRIAGE_LEVELS[triageLevel].label,
    targetMinutes: TRIAGE_LEVELS[triageLevel].targetMinutes,
    urgency: rankUrgency[flagUrgency] > rankUrgency[levelUrgency] ? flagUrgency : levelUrgency,
    chiefComplaint: ai?.chiefComplaint || String(text).slice(0, 120),
    redFlags,
    aiSummary: ai?.aiSummary || `Presented at emergency with: ${text}`,
    keyPoints: Array.isArray(ai?.keyPoints) ? ai.keyPoints.filter(Boolean) : [],
    suspectedCategory: ai?.suspectedCategory || 'OTHER',
    essentialQuestions: questions,
    patientReassurance: ai?.patientReassurance || '',
    aiAvailable: Boolean(ai)
  };
};

export const retriageWithAnswers = async ({ complaint, answers, language, currentLevel }) => {
  const transcript = answers
    .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
    .join('\n');

  const combined = `${complaint}\n${answers.map((a) => a.answer).join(' ')}`;
  const ruleFlags = detectRedFlags(combined);

  let ai = null;
  try {
    ai = await chatJSON(
      [
        {
          role: 'system',
          content: `You are updating an emergency triage as answers come in at an Indian hospital.
A triage level of ${currentLevel} was already assigned. New answers have arrived.

Raise the level if the answers reveal something worse. NEVER lower a RED. Only lower a level
if the answers clearly show the situation is less severe than first thought, and even then move
by one step at most. When unsure, keep the current level.

Never diagnose, never suggest treatment.

Reply with JSON only:
{
  "triageLevel": "RED" | "ORANGE" | "YELLOW" | "GREEN",
  "changed": true,
  "reason": "<short English reason if changed>",
  "redFlags": ["<English>"],
  "aiSummary": "<updated 2 to 3 sentence English handover>",
  "keyPoints": ["<3 to 6 short English facts>"],
  "doctorBriefing": "<spoken-style English briefing, about 20 seconds, for the emergency doctor>"
}`
        },
        {
          role: 'user',
          content: `WHAT HAPPENED:\n"${complaint}"\n\nANSWERS SO FAR:\n${transcript || '(none yet)'}\n\nUpdate the triage.`
        }
      ],
      { temperature: 0.1 }
    );
  } catch {
    ai = null;
  }

  let triageLevel = TRIAGE_LEVELS[ai?.triageLevel] ? ai.triageLevel : currentLevel;

  if (currentLevel === 'RED') triageLevel = 'RED';

  if (triageRank(triageLevel) > triageRank(currentLevel) + 1) {
    triageLevel = Object.keys(TRIAGE_LEVELS).find(
      (key) => triageRank(key) === triageRank(currentLevel) + 1
    );
  }

  if (ruleFlags.some((f) => f.urgency === 'EMERGENCY') && triageRank(triageLevel) > triageRank('ORANGE')) {
    triageLevel = 'ORANGE';
  }

  return {
    triageLevel,
    triageLabel: TRIAGE_LEVELS[triageLevel].label,
    targetMinutes: TRIAGE_LEVELS[triageLevel].targetMinutes,
    urgency: TRIAGE_LEVELS[triageLevel].urgency,
    changed: triageLevel !== currentLevel,
    reason: ai?.reason || '',
    redFlags: [
      ...new Set([
        ...(Array.isArray(ai?.redFlags) ? ai.redFlags.filter(Boolean) : []),
        ...ruleFlags.map((f) => f.flag)
      ])
    ],
    aiSummary: ai?.aiSummary || '',
    keyPoints: Array.isArray(ai?.keyPoints) ? ai.keyPoints.filter(Boolean) : [],
    doctorBriefing: ai?.doctorBriefing || ai?.aiSummary || ''
  };
};
