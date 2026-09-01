import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.VOICE_API || 'http://localhost:4000';
const OUT = path.join(__dirname, '..', 'public', 'voice');

// English is the source of truth for every static prompt. Hindi is hand-written
// for best quality; all other languages are machine-translated from English,
// then spoken by Sarvam TTS in that language. Interview questions and the final
// read-back are NOT here — those are generated live by the model in the
// patient's language.
const EN = {
  greeting: 'Hello, I am your health assistant. I will ask you a few questions by voice and prepare everything for the doctor. Just speak naturally, you do not need to touch anything.',
  consent: 'I will ask you a few questions about your health, and I will also look at your previous medical history and any old records you have. All of this stays private and is shared only with your doctor. Shall I go ahead? You can tell me in your own words.',
  yesno: 'You can just tell me yes or no.',
  faceIntro: 'Now I will identify you. Please look straight at the camera.',
  faceCountdown: 'Taking your photo. Please hold still.',
  searching: 'Please wait, I am finding your record.',
  askAbha: 'I could not find you. Do you have an ABHA health card number? You can tell me yes or no.',
  sayAbha: 'Please say your ABHA number slowly.',
  sayAadhaar: 'Please say your twelve digit Aadhaar number slowly.',
  linkPhoto: 'Thank you. Now please look at the camera so I can save your photo.',
  faceUnclear: 'I could not see your face clearly. Please look straight at the camera in good light, and hold still.',
  registerAsk: 'You do not have a health record yet, so I will register you now and create your ABHA health id. Shall I go ahead? You can tell me yes or no.',
  registering: 'Please wait, I am creating your health record.',
  confirmYou: 'Is this you? You can tell me yes or no.',
  confirmNumber: 'Is this number correct?',
  askMode: 'Do you want to see a normal doctor, or an Ayurvedic doctor? You can say normal or Ayurvedic.',
  askDocuments: 'Do you have any old prescriptions or test reports with you? You can tell me yes or no.',
  showDocument: 'Please hold the paper flat in front of the camera.',
  readingDoc: 'Please wait, I am reading your document.',
  moreDocuments: 'Do you have another paper to show? You can tell me yes or no.',
  reviewIntro: 'Here is everything I have noted. Please listen carefully.',
  allCorrect: 'Is all of this correct? You can say yes, or tell me what is wrong.',
  whatWrong: 'Please tell me what is wrong.',
  didNotCatch: 'Sorry, I did not catch that. Please say it again.',
  notFound: 'I could not find your details.',
  emWhat: 'This is emergency help. Please tell me what happened. You can speak now.',
  emName: 'What is the name of the patient?',
  emSent: 'Thank you. The emergency team has been alerted and is coming. Please stay right here.',
  emDidNot: 'Please tell me what happened. You can speak now.'
};

const HI = {
  greeting: 'नमस्ते, मैं आपकी स्वास्थ्य सहायक हूँ। मैं आपसे बोलकर कुछ सवाल पूछूँगी और डॉक्टर के लिए सब कुछ तैयार कर दूँगी। आप बस आराम से बोलिए, आपको कुछ छूने की ज़रूरत नहीं है।',
  consent: 'मैं आपसे आपकी सेहत के बारे में कुछ सवाल पूछूँगी, और अगर आपने पहले कहीं इलाज कराया है तो आपका पुराना मेडिकल रिकॉर्ड भी देखूँगी। यह सारी जानकारी निजी रहेगी और सिर्फ़ आपके डॉक्टर के साथ साझा होगी। क्या मैं आगे बढ़ूँ? आप अपने शब्दों में बता सकते हैं।',
  yesno: 'आप बस हाँ या ना बता सकते हैं।',
  faceIntro: 'अब मैं आपको पहचानूँगी। कृपया सीधे कैमरे की ओर देखिए।',
  faceCountdown: 'आपकी फ़ोटो ले रही हूँ। कृपया स्थिर रहिए।',
  searching: 'कृपया रुकिए, मैं आपका रिकॉर्ड ढूँढ़ रही हूँ।',
  askAbha: 'मुझे आप नहीं मिले। क्या आपके पास आभा हेल्थ कार्ड नंबर है? आप हाँ या ना बता सकते हैं।',
  sayAbha: 'कृपया अपना आभा नंबर धीरे-धीरे बोलिए।',
  sayAadhaar: 'कृपया अपना बारह अंकों का आधार नंबर धीरे-धीरे बोलिए।',
  linkPhoto: 'धन्यवाद। अब कृपया कैमरे की ओर देखिए ताकि मैं आपकी फ़ोटो सुरक्षित कर सकूँ।',
  faceUnclear: 'मैं आपका चेहरा साफ़ नहीं देख पाई। कृपया अच्छी रोशनी में सीधे कैमरे की ओर देखिए और स्थिर रहिए।',
  registerAsk: 'आपका अभी तक कोई रिकॉर्ड नहीं है, इसलिए मैं अभी आपका रजिस्ट्रेशन करके आपकी आभा हेल्थ आईडी बना दूँगी। क्या मैं आगे बढ़ूँ? आप हाँ या ना बता सकते हैं।',
  registering: 'कृपया रुकिए, मैं आपका स्वास्थ्य रिकॉर्ड बना रही हूँ।',
  confirmYou: 'क्या यह आप ही हैं? आप हाँ या ना बता सकते हैं।',
  confirmNumber: 'क्या यह नंबर सही है?',
  askMode: 'आप सामान्य डॉक्टर को दिखाना चाहते हैं या आयुर्वेदिक डॉक्टर को? आप सामान्य या आयुर्वेदिक कह सकते हैं।',
  askDocuments: 'क्या आपके पास कोई पुरानी पर्ची या जाँच रिपोर्ट है? आप हाँ या ना बता सकते हैं।',
  showDocument: 'कृपया काग़ज़ को कैमरे के सामने सीधा रखिए।',
  readingDoc: 'कृपया रुकिए, मैं आपका काग़ज़ पढ़ रही हूँ।',
  moreDocuments: 'क्या आपके पास दिखाने के लिए एक और काग़ज़ है? आप हाँ या ना बता सकते हैं।',
  reviewIntro: 'यह सब कुछ है जो मैंने दर्ज किया है। कृपया ध्यान से सुनिए।',
  allCorrect: 'क्या यह सब सही है? आप हाँ कह सकते हैं, या बताइए क्या ग़लत है।',
  whatWrong: 'कृपया बताइए क्या ग़लत है।',
  didNotCatch: 'माफ़ कीजिए, मैं समझ नहीं पाई। कृपया फिर से कहिए।',
  notFound: 'मुझे आपकी जानकारी नहीं मिली।',
  emWhat: 'यह आपातकालीन सहायता है। कृपया बताइए क्या हुआ है। आप अभी बोल सकते हैं।',
  emName: 'मरीज़ का नाम क्या है?',
  emSent: 'धन्यवाद। आपातकालीन टीम को सूचित कर दिया गया है और वे आ रहे हैं। कृपया यहीं रुकिए।',
  emDidNot: 'कृपया बताइए क्या हुआ है। आप अभी बोल सकते हैं।'
};

const LANGS = ['hi-IN', 'en-IN', 'bn-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'od-IN', 'pa-IN', 'ta-IN', 'te-IN'];

const post = async (path, body) => {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'request failed');
  return json.data;
};

const tts = (text, language, extra = {}) => post('/voice/tts', { text, language, ...extra }).then((d) => d.audios);
const translate = (text, to) => post('/voice/translate', { text, from: 'en-IN', to }).then((d) => d.text);

const writeWav = (dir, key, audios) => {
  fs.mkdirSync(dir, { recursive: true });
  const buffers = audios.map((a) => Buffer.from(a, 'base64'));
  let out;
  if (buffers.length === 1) {
    out = buffers[0];
  } else {
    const header = Buffer.from(buffers[0].subarray(0, 44));
    const data = Buffer.concat(buffers.map((b) => b.subarray(44)));
    header.writeUInt32LE(36 + data.length, 4);
    header.writeUInt32LE(data.length, 40);
    out = Buffer.concat([header, data]);
  }
  fs.writeFileSync(path.join(dir, `${key}.wav`), out);
};

const textsFor = async (lang) => {
  if (lang === 'en-IN') return { ...EN };
  if (lang === 'hi-IN') return { ...HI };
  const map = {};
  for (const [key, en] of Object.entries(EN)) {
    try {
      map[key] = (await translate(en, lang)) || en;
    } catch {
      map[key] = en;
    }
  }
  return map;
};

const readJson = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(path.join(OUT, file), 'utf8')); }
  catch { return fallback; }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  // Resume from whatever was already generated so we never redo finished
  // languages or burn quota. Delete public/voice to start fresh.
  const manifest = readJson('manifest.json', {});
  const prompts = readJson('prompts.json', {});

  for (const lang of LANGS) {
    const short = lang.split('-')[0];
    const dir = path.join(OUT, short);
    manifest[short] = manifest[short] || [];
    prompts[short] = prompts[short] || {};

    const remaining = Object.keys(EN).filter((k) => !fs.existsSync(path.join(dir, `${k}.wav`)));
    if (remaining.length === 0) { console.log(`\n[${lang}] complete, skipping`); continue; }

    console.log(`\n[${lang}] ${remaining.length} to do`);
    const texts = await textsFor(lang);

    for (const key of remaining) {
      const text = texts[key];
      process.stdout.write(`  ${key} … `);
      let done = false;
      for (let attempt = 0; attempt < 3 && !done; attempt++) {
        try {
          const audios = await tts(text, lang);
          writeWav(dir, key, audios);
          if (!manifest[short].includes(key)) manifest[short].push(key);
          prompts[short][key] = text;
          fs.mkdirSync(OUT, { recursive: true });
          fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
          fs.writeFileSync(path.join(OUT, 'prompts.json'), JSON.stringify(prompts, null, 2));
          console.log('ok');
          done = true;
        } catch (e) {
          if (/rate limit/i.test(e.message) && attempt < 2) {
            process.stdout.write('rate-limited, waiting… ');
            await sleep(20000);
          } else {
            prompts[short][key] = text;
            console.log('skip (' + e.message.slice(0, 40) + ')');
            done = true;
          }
        }
      }
      await sleep(500);
    }
  }

  fs.writeFileSync(path.join(OUT, 'prompts.json'), JSON.stringify(prompts, null, 2));

  const sampleDir = path.join(OUT, 'samples');
  for (const spk of ['shreya', 'priya', 'neha', 'pooja', 'kavya', 'ritu']) {
    process.stdout.write(`  sample/${spk} … `);
    try {
      writeWav(sampleDir, spk, await tts('नमस्ते, मैं आपकी स्वास्थ्य सहायक हूँ।', 'hi-IN', { speaker: spk }));
      console.log('ok');
    } catch (e) {
      console.log('skip');
    }
  }

  console.log('\nDone. Prompts, texts + manifest written to public/voice/.');
};

run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
