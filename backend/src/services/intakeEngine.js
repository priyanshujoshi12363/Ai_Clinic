import { chatJSON, chatVisionJSON } from './llmService.js';

export const GENERAL_SECTIONS = [
  {
    key: 'chiefComplaint',
    label: 'Chief complaint',
    ask: 'What is the main problem that brought them to the hospital today, and how long has it been going on.'
  },
  {
    key: 'historyOfPresentIllness',
    label: 'History of present illness',
    ask: 'Probe the main complaint properly using SOCRATES: exact site, when and how it started, what it feels like, whether it spreads anywhere, what else happens along with it, whether it comes and goes or stays, what makes it worse or better, and how severe it is out of ten. Ask these ONE at a time across several turns, choosing the next most useful one.'
  },
  {
    key: 'pastMedicalHistory',
    label: 'Past medical history',
    ask: 'Any long-standing illnesses such as diabetes, blood pressure, asthma, thyroid, TB, heart problems — and for how many years.'
  },
  {
    key: 'pastSurgicalHistory',
    label: 'Past surgical history',
    ask: 'Any operation or surgery in the past, and roughly which year.'
  },
  {
    key: 'drugHistory',
    label: 'Drug history',
    ask: 'Which medicines they take regularly, with dose and how many times a day if they know it.'
  },
  {
    key: 'allergyHistory',
    label: 'Allergy history',
    ask: 'Any medicine or food that has ever caused a rash, swelling or breathing difficulty.'
  },
  {
    key: 'familyHistory',
    label: 'Family history',
    ask: 'Any illness that runs in the family — parents, brothers, sisters.'
  },
  {
    key: 'personalHistory',
    label: 'Personal history',
    ask: 'Their work, what they usually eat, how they sleep, tobacco or alcohol use, and physical activity. Ask gently and without judgement.'
  },
  {
    key: 'reviewOfSystems',
    label: 'Review of systems',
    ask: 'A quick sweep for anything else: fever, weight loss, appetite, bowel and urine, breathlessness, giddiness.'
  }
];

export const AYUSH_SECTIONS = [
  {
    key: 'chiefComplaint',
    label: 'Chief complaint',
    maps: 'Rogi pariksha - presenting complaint',
    ask: 'What is troubling them the most right now, and since when.'
  },
  {
    key: 'nidana',
    label: 'Nidana (causative factors)',
    maps: 'Nidana',
    ask: 'What do they themselves think brought this on — a particular food, weather, stress, travel, staying awake at night, or lifting something heavy.'
  },
  {
    key: 'prakriti',
    label: 'Prakriti (natural constitution)',
    maps: 'Dashavidha - Prakriti',
    ask: 'Ask about their usual nature since childhood in plain words: do they normally feel more cold or more hot than others, is their skin usually dry or oily, is their body usually thin or heavy, do they get restless quickly or stay calm, do they sleep lightly or deeply. Ask two or three of these, never the word Prakriti.'
  },
  {
    key: 'vikriti',
    label: 'Vikriti (current imbalance)',
    maps: 'Dashavidha - Vikriti',
    ask: 'What has CHANGED in the body recently compared to their normal self — sleep, digestion, energy, mood, body temperature.'
  },
  {
    key: 'agniKoshtha',
    label: 'Agni and Koshtha (digestion and bowel)',
    maps: 'Dashavidha - Ahara Shakti / Koshtha',
    ask: 'How is their hunger and digestion — do they feel real hunger at meal times, does food feel heavy afterwards, is there gas, acidity or belching. And how are their bowels — do they pass stool easily every day, is it hard, loose, or do they need to strain.'
  },
  {
    key: 'aharaVihara',
    label: 'Ahara-Vihara (diet and daily routine)',
    maps: 'Ahara-Vihara',
    ask: 'What do they usually eat, veg or non-veg, at what times, do they eat outside food often, do they drink enough water, what time do they wake and sleep, and what does a normal day look like.'
  },
  {
    key: 'nidraSleep',
    label: 'Nidra (sleep)',
    maps: 'Ahara-Vihara - Nidra',
    ask: 'How many hours they sleep, whether sleep comes easily, whether they wake in the night, and whether they feel fresh in the morning.'
  },
  {
    key: 'balaVyayama',
    label: 'Bala and Vyayama Shakti (strength and stamina)',
    maps: 'Dashavidha - Vyayama Shakti / Sara',
    ask: 'How much physical work or walking they can do before getting tired, compared to a year ago.'
  },
  {
    key: 'satmyaSattva',
    label: 'Satmya and Sattva (tolerance and mental state)',
    maps: 'Dashavidha - Satmya / Sattva',
    ask: 'Which foods or weather do not suit them and upset the body, and how they generally cope with stress, worry or bad news.'
  },
  {
    key: 'pastMedicalHistory',
    label: 'Past medical history',
    ask: 'Any long-standing illness such as diabetes, blood pressure, thyroid, asthma, and for how long.'
  },
  {
    key: 'drugHistory',
    label: 'Current medicines',
    ask: 'Any medicines they take now — allopathic, ayurvedic or home remedies.'
  },
  {
    key: 'allergyHistory',
    label: 'Allergy history',
    ask: 'Any medicine or food that has ever caused a rash, swelling or breathing trouble.'
  },
  {
    key: 'familyHistory',
    label: 'Family history',
    ask: 'Any illness that runs in the family.'
  }
];

export const sectionsForMode = (mode) =>
  mode === 'AYUSH' ? AYUSH_SECTIONS : GENERAL_SECTIONS;

const RED_FLAG_RULES = [
  { flag: 'Chest pain with breathlessness — possible acute coronary syndrome', urgency: 'EMERGENCY',
    all: [/chest|seene|सीने|छाती|நெஞ்சு|ఛాతీ|છાતી/i, /breath|saans|साँस|सांस|dyspn|மூச்சு|ఊపిరి|શ્વાસ/i] },
  { flag: 'Chest pain radiating to arm or jaw', urgency: 'EMERGENCY',
    all: [/chest|seene|सीने|छाती/i, /arm|jaw|shoulder|baazu|बांह|बाजू|जबड़ा|कंधे/i] },
  { flag: 'Possible stroke — weakness, facial droop or speech difficulty', urgency: 'EMERGENCY',
    any: [/stroke|paralysis|lakwa|लकवा|पक्षाघात|face droop|slurred|बोलने में|मुंह टेढ़ा/i] },
  { flag: 'Severe breathlessness at rest', urgency: 'EMERGENCY',
    any: [/cannot breathe|can't breathe|saans nahi|साँस नहीं|सांस नहीं|gasping|breathless at rest/i] },
  { flag: 'Loss or altered consciousness', urgency: 'EMERGENCY',
    any: [/unconscious|behosh|बेहोश|fainted|blackout|seizure|मिर्गी|दौरा/i] },
  { flag: 'Active or heavy bleeding', urgency: 'EMERGENCY',
    any: [/heavy bleeding|bleeding a lot|khoon beh|खून बह|रक्तस्राव|vomiting blood|khoon ki ulti|खून की उल्टी/i] },
  { flag: 'Suicidal ideation or self-harm', urgency: 'EMERGENCY',
    any: [/suicide|kill myself|end my life|आत्महत्या|खुदकुशी|self harm/i] },
  { flag: 'High fever with neck stiffness — possible meningitis', urgency: 'URGENT',
    all: [/fever|bukhar|बुखार|ज्वर/i, /neck stiff|gardan|गर्दन अकड़|stiff neck/i] },
  { flag: 'Severe abdominal pain', urgency: 'URGENT',
    all: [/abdomen|stomach|pet|पेट|उदर/i, /severe|unbearable|bahut tez|बहुत तेज|असहनीय/i] },
  { flag: 'Sudden severe headache — worst ever', urgency: 'URGENT',
    all: [/headache|sir dard|सिर दर्द|सरदर्द/i, /sudden|worst|severe|अचानक|बहुत तेज/i] },
  { flag: 'Pregnancy with bleeding or severe pain', urgency: 'URGENT',
    all: [/pregnan|garbh|गर्भ|प्रेग्नेंट/i, /bleed|pain|खून|दर्द/i] }
];

export const detectRedFlags = (text) => {
  const haystack = String(text || '');
  const hits = [];

  for (const rule of RED_FLAG_RULES) {
    const matched = rule.all
      ? rule.all.every((re) => re.test(haystack))
      : rule.any.some((re) => re.test(haystack));

    if (matched) hits.push({ flag: rule.flag, urgency: rule.urgency });
  }

  return hits;
};

export const highestUrgency = (flags) => {
  if (flags.some((f) => f.urgency === 'EMERGENCY')) return 'EMERGENCY';
  if (flags.some((f) => f.urgency === 'URGENT')) return 'URGENT';
  return 'ROUTINE';
};

const LANGUAGE_NAMES = {
  'hi-IN': 'Hindi (Devanagari script)',
  'en-IN': 'Indian English',
  'bn-IN': 'Bengali (Bengali script)',
  'gu-IN': 'Gujarati (Gujarati script)',
  'kn-IN': 'Kannada (Kannada script)',
  'ml-IN': 'Malayalam (Malayalam script)',
  'mr-IN': 'Marathi (Devanagari script)',
  'od-IN': 'Odia (Odia script)',
  'pa-IN': 'Punjabi (Gurmukhi script)',
  'ta-IN': 'Tamil (Tamil script)',
  'te-IN': 'Telugu (Telugu script)'
};

export const languageName = (code) => LANGUAGE_NAMES[code] || 'Hindi (Devanagari script)';

export const classifyIntent = async ({ transcript, task, language }) => {
  const tasks = {
    yesno: 'The patient is answering a yes/no question. Decide if they agreed/confirmed (YES), disagreed/declined (NO), or it is unclear (UNCLEAR).',
    mode: 'The patient is choosing which doctor to see. Decide GENERAL if they want a normal/allopathic/regular doctor, AYUSH if they want an ayurvedic/ayurveda/vaidya/herbal doctor, or UNCLEAR.',
    haveAbha: 'Decide if the patient is saying they HAVE an ABHA / health id card (YES), do NOT have one (NO), or UNCLEAR.',
    ready: 'Decide if the patient indicated they are ready/looking at the camera (YES) or not (UNCLEAR).'
  };

  const options = {
    yesno: '"YES" | "NO" | "UNCLEAR"',
    mode: '"GENERAL" | "AYUSH" | "UNCLEAR"',
    haveAbha: '"YES" | "NO" | "UNCLEAR"',
    ready: '"YES" | "UNCLEAR"'
  };

  const result = await chatJSON(
    [
      {
        role: 'system',
        content: `You interpret a short spoken reply from a hospital kiosk user who may speak Hindi, English or a regional Indian language. ${tasks[task] || tasks.yesno}
Understand the MEANING and intent, not exact words. Real people answer casually.
Agreement / YES examples: "haan", "ha", "haan ji", "haan le lo", "le lo", "theek hai", "thik hai", "sahi hai", "chalega", "chal jayega", "kar do", "kar dijiye", "bilkul", "ji", "ok", "okay", "yes", "yeah", "sure", "aage badho", "haan karo".
Refusal / NO examples: "nahi", "na", "nahi chahiye", "mat karo", "rehne do", "galat", "no", "nope", "cancel".
If the reply clearly agrees, return YES. If it clearly refuses, return NO. Only return UNCLEAR when you genuinely cannot tell.
Reply with JSON only: { "intent": ${options[task] || options.yesno} }`
      },
      { role: 'user', content: `The user said: "${transcript}"` }
    ],
    { temperature: 0 }
  );

  return result.intent || 'UNCLEAR';
};

export const extractDigits = async ({ transcript, expected }) => {
  const naive = String(transcript || '').replace(/\D/g, '');
  if (naive.length >= (expected || 0)) {
    return { digits: naive, spoken: transcript };
  }

  const result = await chatJSON(
    [
      {
        role: 'system',
        content: `The user spoke a ${expected ? expected + '-digit ' : ''}number aloud, possibly in Hindi or another Indian language (for example "do teen chaar" = 234, "पाँच" = 5). Convert everything they said into the digit string only.
Reply with JSON only: { "digits": "<digits with no spaces or other characters>" }`
      },
      { role: 'user', content: `The user said: "${transcript}"` }
    ],
    { temperature: 0 }
  );

  return { digits: String(result.digits || naive).replace(/\D/g, ''), spoken: transcript };
};

const buildSystemPrompt = (mode, language, patient) => {
  const sections = sectionsForMode(mode);
  const plan = sections
    .map((s, i) => `${i + 1}. ${s.key} — ${s.label}${s.maps ? ` [files under: ${s.maps}]` : ''}\n   Ask about: ${s.ask}`)
    .join('\n');

  const ayushNote = mode === 'AYUSH'
    ? `
THIS IS AN AYURVEDA (AYUSH) OPD INTERVIEW.
Critical rule: the patient is an ordinary person who has never heard the words
Prakriti, Vikriti, Dashavidha, Agni, Koshtha, Sara or Samprapti. NEVER use those
words when speaking to the patient. Ask plain everyday questions about their body,
food, sleep, digestion and daily routine — the kind of question a kind family
vaidya would ask. You silently file the answers under the correct classical
parameter in the "understood" object. If you ever catch yourself about to use a
Sanskrit term in the question, rewrite it as a simple sentence.`
    : `
THIS IS A GENERAL OPD (allopathic) INTERVIEW.
Follow standard clinical history-taking order and use SOCRATES to characterise
any pain. Ask like an unhurried junior doctor, not like a form.`;

  const known = patient
    ? `
WHO YOU ARE SPEAKING TO (already on file — do NOT ask these again):
Name: ${patient.name || 'unknown'}
Age/Sex: ${patient.age ?? 'unknown'} / ${patient.gender || 'unknown'}
Known conditions: ${(patient.conditions || []).join(', ') || 'none recorded'}
Known allergies: ${(patient.allergies || []).join(', ') || 'none recorded'}
Current medicines: ${(patient.medicines || []).join(', ') || 'none recorded'}
You may confirm these briefly but never ask for them from scratch.`
    : '';

  return `You are the history-taking assistant of a hospital self-service kiosk in India.
A patient is standing in front of the screen before meeting the doctor. You take
their medical history by voice so the doctor can spend the consultation examining
and treating instead of asking questions.
${ayushNote}
${known}

LANGUAGE — this matters more than anything else:
The patient is speaking ${languageName(language)} (code ${language}).
Write EVERY question in ${languageName(language)}, in its own script.
Do not mix in English words unless the patient used them first.
Do not translate the question. Do not add a transliteration.

HOW TO SPEAK:
- Exactly ONE question per turn. Never stack two questions together.
- Short sentences. Simple words. No medical jargon.
- Assume the patient may be elderly, anxious, or unable to read.
- Never greet again after the first turn. Never say "thank you for sharing".
- Never explain what you are doing. Just ask the next thing.

WHAT YOU MUST NOT DO:
- Never give a diagnosis, even a guess.
- Never suggest, name, or comment on any treatment or medicine.
- Never reassure the patient that something is harmless.
- Never tell the patient to go home or that they do not need a doctor.
You collect information. The doctor decides.

INTERVIEW PLAN — fill every section before finishing:
${plan}

HOW TO CHOOSE THE NEXT QUESTION — this is what makes you feel like a real doctor:
- The plan is a checklist, NOT a script. Never read it out mechanically.
- Let the chief complaint drive everything. Ask the follow-ups that a doctor would
  actually ask for THIS complaint. Chest pain → onset, character, radiation, exertion,
  breathlessness, sweating. Cough → duration, dry or with phlegm, blood, fever, weight
  loss, night sweats. Headache → onset, side, throbbing, vision, vomiting. Abdominal pain
  → site, relation to food, vomiting, bowel change. Fever → duration, pattern, chills,
  travel, urinary symptoms. Joint pain → which joints, morning stiffness, swelling.
  Pick the single most useful next question for what they just said.
- USE WHAT YOU ALREADY KNOW about this patient. If their record shows diabetes or
  hypertension and they have a relevant complaint, probe the link (e.g. chest pain in a
  known diabetic → ask harder about cardiac features). Never re-ask something already on
  file — confirm it in one clause instead.
- Tailor to the person: an elderly patient, a child's attendant, or a young adult get
  different emphasis. Ask about pregnancy only where relevant. Match their words.
- If an answer opens something important, follow it up before moving on. If the patient
  already answered a later section spontaneously, record it and skip that question.
- Do not ask two things at once, and do not interrogate — one natural question per turn.

CORRECTIONS:
If the patient says you got something wrong ("no, five years not three",
"that is not right"), overwrite the affected field in "understood" with their
correction and acknowledge it inside your next question in one short clause.

RED FLAGS:
If the patient describes a danger sign — chest pain with breathlessness, stroke
symptoms, severe bleeding, loss of consciousness, suicidal thoughts — list it in
"redFlags" in English and set "urgency". Keep asking calmly; do not alarm them.

OUTPUT — reply with this JSON object and nothing else:
{
  "understood": { "<sectionKey>": "<what the patient has told you so far, in English, for the doctor>" },
  "patientFacingConfirmation": "<one short sentence in ${languageName(language)} restating the single most important new fact you just recorded, so the patient can confirm or correct it. Empty string if nothing new.>",
  "nextQuestion": "<the single next question, in ${languageName(language)}>",
  "currentSection": "<sectionKey you are working on>",
  "redFlags": ["<danger sign in English>"],
  "urgency": "EMERGENCY" | "URGENT" | "ROUTINE",
  "sectionsCovered": ["<sectionKey>"],
  "done": false
}

"understood" is cumulative — always repeat everything gathered so far, updated
with the newest answer. Set "done": true and "nextQuestion": "" only when every
section in the plan has a real answer or the patient has clearly declined it.`;
};

const transcriptToText = (turns) =>
  turns
    .map((t) => (t.role === 'assistant' ? `KIOSK: ${t.text}` : `PATIENT: ${t.text}`))
    .join('\n');

export const runInterviewTurn = async ({ mode, language, patient, turns, understood, utterance, turnCount }) => {
  const system = buildSystemPrompt(mode, language, patient);
  const sections = sectionsForMode(mode);

  const outstanding = sections
    .filter((s) => {
      const value = understood?.[s.key];
      return !value || String(value).trim().length === 0;
    })
    .map((s) => s.key);

  const maxTurns = Number(process.env.INTAKE_MAX_TURNS || 28);
  const mustWrapUp = turnCount >= maxTurns - 2;

  const userPrompt = `CONVERSATION SO FAR:
${transcriptToText(turns) || '(nothing yet — this is the first question)'}

${utterance ? `PATIENT JUST SAID:\n"${utterance}"` : 'The interview is starting. Ask the first question.'}

ALREADY RECORDED:
${JSON.stringify(understood || {}, null, 2)}

SECTIONS STILL EMPTY: ${outstanding.length ? outstanding.join(', ') : 'none — you may finish'}
${mustWrapUp ? 'You are near the time limit. Ask only the single most important remaining question, then set done to true.' : ''}

Update "understood", then ask the next question in ${languageName(language)}.`;

  const result = await chatJSON(
    [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt }
    ],
    { temperature: 0.25 }
  );

  const spoken = [...turns.filter((t) => t.role === 'user').map((t) => t.text), utterance || ''].join(' ');
  const ruleFlags = detectRedFlags(spoken);
  const modelFlags = Array.isArray(result.redFlags) ? result.redFlags : [];

  const mergedFlags = [
    ...new Set([...modelFlags.filter(Boolean), ...ruleFlags.map((f) => f.flag)])
  ];

  const ruleUrgency = highestUrgency(ruleFlags);
  const modelUrgency = ['EMERGENCY', 'URGENT', 'ROUTINE'].includes(result.urgency)
    ? result.urgency
    : 'ROUTINE';
  const rank = { EMERGENCY: 3, URGENT: 2, ROUTINE: 1 };
  const urgency = rank[ruleUrgency] >= rank[modelUrgency] ? ruleUrgency : modelUrgency;

  return {
    understood: result.understood && typeof result.understood === 'object' ? result.understood : (understood || {}),
    patientFacingConfirmation: result.patientFacingConfirmation || '',
    nextQuestion: result.nextQuestion || '',
    currentSection: result.currentSection || outstanding[0] || null,
    redFlags: mergedFlags,
    urgency,
    done: Boolean(result.done) || turnCount >= maxTurns || (!result.nextQuestion && outstanding.length === 0),
    outstanding
  };
};

const OCR_SYSTEM = `You are a medical document OCR and extraction engine for an Indian hospital.
You are given a photograph of a real medical document — a prescription, a laboratory
report, or a discharge summary. It may be handwritten, printed, in Hindi or a regional
language, faded, or photographed at an angle.

RULES:
- Transcribe what is actually written. Never invent a medicine, value or date.
- If a word is unreadable, put it in "uncertain" instead of guessing.
- Expand Indian prescription shorthand in "frequency": 1-0-1 means morning and night,
  OD once daily, BD twice daily, TDS three times daily, HS at bedtime, SOS as needed.
- Mark an investigation "abnormal": true only when the value is genuinely outside the
  printed reference range.
- "confidence" is your honest overall read quality from 0 to 1. Use below 0.6 for
  handwriting you struggled with.

Reply with this JSON object only:
{
  "documentType": "PRESCRIPTION" | "LAB_REPORT" | "DISCHARGE_SUMMARY" | "AYURVEDA_PRESCRIPTION" | "OTHER",
  "date": "YYYY-MM-DD or null",
  "hospital": "",
  "doctor": "",
  "diagnoses": [],
  "medicines": [{ "name": "", "dosage": "", "frequency": "", "duration": "" }],
  "investigations": [{ "name": "", "value": "", "unit": "", "referenceRange": "", "abnormal": false }],
  "procedures": [{ "name": "", "date": "" }],
  "uncertain": ["<anything you could not read confidently>"],
  "rawText": "<full transcription, line by line>",
  "confidence": 0.0
}`;

export const extractDocument = async (imageBase64) => {
  const result = await chatVisionJSON(
    OCR_SYSTEM,
    'Read this medical document and extract it. Transcribe only what is printed or written.',
    [imageBase64]
  );

  const confidence = typeof result.confidence === 'number' ? result.confidence : 0.5;

  return {
    documentType: result.documentType || 'OTHER',
    date: result.date || null,
    hospital: result.hospital || '',
    doctor: result.doctor || '',
    diagnoses: Array.isArray(result.diagnoses) ? result.diagnoses.filter(Boolean) : [],
    medicines: Array.isArray(result.medicines) ? result.medicines.filter((m) => m?.name) : [],
    investigations: Array.isArray(result.investigations) ? result.investigations.filter((i) => i?.name) : [],
    procedures: Array.isArray(result.procedures) ? result.procedures.filter((p) => p?.name) : [],
    uncertain: Array.isArray(result.uncertain) ? result.uncertain.filter(Boolean) : [],
    rawText: result.rawText || '',
    confidence,

    needsVerification: confidence < 0.75 || (result.uncertain?.length || 0) > 0
  };
};

export const generateSummary = async ({ mode, language, patient, turns, understood, documents, redFlags }) => {
  const documentDigest = (documents || []).length
    ? documents.map((d, i) => `Document ${i + 1} (${d.documentType}${d.date ? `, ${d.date}` : ''}):
  Diagnoses: ${(d.diagnoses || []).join('; ') || 'none'}
  Medicines: ${(d.medicines || []).map((m) => `${m.name} ${m.dosage || ''} ${m.frequency || ''}`.trim()).join('; ') || 'none'}
  Investigations: ${(d.investigations || []).map((t) => `${t.name} ${t.value}${t.unit || ''}${t.abnormal ? ' (ABNORMAL)' : ''}`).join('; ') || 'none'}
  Extraction confidence: ${d.confidence}`).join('\n')
    : 'No previous documents were provided.';

  const system = `You write the pre-consultation clinical summary that appears on an Indian
hospital doctor's screen the moment the patient walks in. The doctor has roughly
thirty seconds to read it.

${mode === 'AYUSH'
    ? `This is an AYURVEDA OPD case. Present the classical assessment using the proper
Sanskrit parameter names (Prakriti, Vikriti, Agni, Koshtha, Ahara-Vihara, Nidana)
— the DOCTOR knows these terms even though the patient was never asked them.
Also include the standard clinical history alongside.`
    : 'This is a General OPD case. Use standard clinical documentation order.'}

RULES:
- "summary" must be SHORT and scannable — NOT a long paragraph. Use these exact one-line
  headings, each on its own line, and write a terse phrase after each (not full sentences).
  Omit a line entirely if there is nothing for it. Aim for 5 to 8 lines total:
    CC: <chief complaint with duration>
    HPI: <key features in a few words>
    PMH: <past illnesses or "none">
    Meds: <current medicines or "none">
    Allergies: <or "none">
    O/E prior records: <abnormal labs / key document findings, if any>
    Red flags: <if any>
  Keep the whole thing tight — a doctor should read it in ten seconds.
- Report only what the patient actually said or what the documents showed.
- If something was not asked or not answered, leave that line out — never invent.
- Do NOT diagnose. Do NOT suggest investigations or treatment. Describe, do not decide.
- "patientReadBack" is for the PATIENT, spoken aloud in ${languageName(language)}, plain and
  warm, 3 to 4 short sentences restating what was recorded. No medical terms. End by asking
  whether everything is correct.
- "voiceBriefing" is for the DOCTOR, read aloud: 2 to 3 short spoken sentences only — age,
  sex, main complaint with duration, the one or two facts that change management, then red
  flags. Flowing speech, no abbreviations the ear cannot parse. Keep it under 20 seconds.

Reply with this JSON only:
{
  "summary": "<short line-per-heading summary as specified, using \\n between lines>",
  "chiefComplaint": "",
  "keyPoints": ["<4 to 6 very short factual bullets the doctor must not miss>"],
  "redFlags": ["<danger signs, English>"],
  "urgency": "EMERGENCY" | "URGENT" | "ROUTINE",
  "clinicalHistory": {
    "chiefComplaint": "", "historyOfPresentIllness": "",
    "pastMedicalHistory": [], "pastSurgicalHistory": [],
    "drugHistory": [], "allergyHistory": [],
    "familyHistory": "",
    "personalHistory": { "occupation": "", "diet": "", "sleep": "", "exercise": "" },
    "reviewOfSystems": ""
  },
  "ayushHistory": {
    "prakriti": "", "vikriti": "", "sara": "", "samhanana": "", "pramana": "",
    "satmya": "", "sattva": "", "aharaShakti": "", "vyayamaShakti": "", "vaya": "",
    "aharaVihara": { "diet": "", "lifestyle": "", "sleep": "", "physicalActivity": "" },
    "nidana": "", "koshtha": ""
  },
  "patientReadBack": "<in ${languageName(language)}>",
  "voiceBriefing": "<English, spoken style>"
}
${mode === 'AYUSH' ? 'Fill ayushHistory properly.' : 'Leave ayushHistory fields as empty strings for a General OPD case.'}`;

  const user = `PATIENT ON FILE:
Name: ${patient?.name || 'unknown'}, Age: ${patient?.age ?? 'unknown'}, Sex: ${patient?.gender || 'unknown'}
Known conditions: ${(patient?.conditions || []).join(', ') || 'none recorded'}
Known allergies: ${(patient?.allergies || []).join(', ') || 'none recorded'}

FULL INTERVIEW TRANSCRIPT:
${transcriptToText(turns)}

STRUCTURED FIELDS GATHERED DURING THE INTERVIEW:
${JSON.stringify(understood || {}, null, 2)}

PREVIOUS MEDICAL DOCUMENTS (OCR extracted at the kiosk):
${documentDigest}

RED FLAGS ALREADY DETECTED BY THE SYSTEM: ${(redFlags || []).join('; ') || 'none'}

Write the summary.`;

  const result = await chatJSON(
    [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    { temperature: 0.2 }
  );

  const allFlags = [...new Set([...(redFlags || []), ...(Array.isArray(result.redFlags) ? result.redFlags : [])])].filter(Boolean);
  const rank = { EMERGENCY: 3, URGENT: 2, ROUTINE: 1 };
  const modelUrgency = ['EMERGENCY', 'URGENT', 'ROUTINE'].includes(result.urgency) ? result.urgency : 'ROUTINE';
  const priorUrgency = highestUrgency(detectRedFlags(transcriptToText(turns)));

  return {
    summary: result.summary || '',
    chiefComplaint: result.chiefComplaint || '',
    keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints.filter(Boolean) : [],
    redFlags: allFlags,
    urgency: rank[priorUrgency] >= rank[modelUrgency] ? priorUrgency : modelUrgency,
    clinicalHistory: result.clinicalHistory || {},
    ayushHistory: result.ayushHistory || {},
    patientReadBack: result.patientReadBack || '',
    voiceBriefing: result.voiceBriefing || result.summary || ''
  };
};

export const applyCorrection = async ({ language, understood, correction }) => {
  const result = await chatJSON(
    [
      {
        role: 'system',
        content: `The patient is reviewing what the kiosk recorded and has pointed out a mistake.
Apply their correction to the recorded fields. Change ONLY what they corrected; leave
every other field exactly as it was. Then restate the corrected fact back to them in
${languageName(language)} in one short sentence.

Reply with JSON only:
{ "understood": { ...all fields, corrected... }, "acknowledgement": "<one sentence in ${languageName(language)}>" }`
      },
      {
        role: 'user',
        content: `CURRENTLY RECORDED:\n${JSON.stringify(understood, null, 2)}\n\nPATIENT SAID:\n"${correction}"`
      }
    ],
    { temperature: 0.1 }
  );

  return {
    understood: result.understood && typeof result.understood === 'object' ? result.understood : understood,
    acknowledgement: result.acknowledgement || ''
  };
};
