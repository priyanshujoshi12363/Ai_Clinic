import React, { useEffect, useRef, useState } from 'react';
import { Shell, Card, VoiceOrb, Stepper, ProgressBar, Banner, BigButton } from '../components/ui';
import { getCopy, languageLabel } from '../i18n/strings';
import { api, type KnownPatient, type AudioPayload as PlayAudio } from '../lib/api';
import {
  listenForSpeech,
  playChunks,
  playUrl,
  stopSpeech,
  openCamera,
  closeCamera,
  captureWhenReady
} from '../lib/media';

interface Props {
  navigateTo: (page: string) => void;
  language: string;
  setLanguage: (code: string) => void;
}

type OrbMode = 'ai' | 'user' | 'thinking' | 'idle';

const STAGES = ['Identify', 'Department', 'Questions', 'Documents', 'Check', 'Done'];

type KeypadRequest = {
  title: string;
  length: number;
  resolve: (value: string | null) => void;
} | null;

const ConsultationPage: React.FC<Props> = ({ navigateTo, language, setLanguage }) => {
  const [stage, setStage] = useState(0);
  const [orbMode, setOrbMode] = useState<OrbMode>('thinking');
  const [micLevel, setMicLevel] = useState(0);
  const [caption, setCaption] = useState('');
  const [statusLine, setStatusLine] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [patient, setPatient] = useState<KnownPatient | null>(null);
  const [progress, setProgress] = useState(0);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [emergency, setEmergency] = useState(false);
  const [modeLabel, setModeLabel] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [token, setToken] = useState<{ tokenNumber: string; queuedFor: string; priorityTriage: boolean } | null>(null);
  const [error, setError] = useState('');
  const [keypad, setKeypad] = useState<KeypadRequest>(null);
  const [keypadValue, setKeypadValue] = useState('');
  const [showRepeat, setShowRepeat] = useState(false);

  const langRef = useRef(language);
  const sessionRef = useRef('');
  const cancelledRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const repeatRef = useRef<(() => void) | null>(null);
  const manifestRef = useRef<Record<string, string[]>>({});
  const promptsRef = useRef<Record<string, Record<string, string>>>({});

  const c = getCopy(language);

  useEffect(() => { langRef.current = language; }, [language]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const localPrompt = (key?: string): string | null => {
    if (!key) return null;
    const short = langRef.current.split('-')[0];
    return manifestRef.current[short]?.includes(key) ? `/voice/${short}/${key}.wav` : null;
  };

  // The localized on-screen + spoken text for a static prompt key, in the
  // patient's current language (from prompts.json). Falls back to given text.
  const promptText = (key: string | undefined, fallback: string): string => {
    if (!key) return fallback;
    const short = langRef.current.split('-')[0];
    return promptsRef.current[short]?.[key] || fallback;
  };

  // Speaks a line. When `key` names a pre-recorded static prompt for the current
  // language, it shows the localized caption and plays instantly from disk with
  // no API call; otherwise it falls back to live TTS (used for dynamic content).
  const announce = async (text: string, key?: string) => {
    if (cancelledRef.current) return;
    const shown = promptText(key, text);
    if (!shown) return;
    setCaption(shown);
    setStatusLine(getCopy(langRef.current).speakingLabel);
    setOrbMode('ai');

    const url = localPrompt(key);
    if (url) {
      const played = await playUrl(url);
      if (played) { setOrbMode('idle'); return; }
    }

    try {
      const audio = await api.speak(shown, langRef.current);
      if (cancelledRef.current) return;
      await playChunks(audio.audios, audio.format);
    } catch {
      /* keep flowing even if TTS fails */
    }
    setOrbMode('idle');
  };

  const playServerAudio = async (audio: PlayAudio, fallbackText?: string) => {
    if (cancelledRef.current) return;
    if (fallbackText) setCaption(fallbackText);
    setStatusLine(getCopy(langRef.current).speakingLabel);
    setOrbMode('ai');
    if (audio?.audios?.length) {
      await playChunks(audio.audios, audio.format);
    } else if (fallbackText) {
      try {
        const a = await api.speak(fallbackText, langRef.current);
        await playChunks(a.audios, a.format);
      } catch { /* ignore */ }
    }
    setOrbMode('idle');
  };

  const listen = async (opts: { silenceMs?: number; maxMs?: number; startTimeoutMs?: number } = {}) => {
    if (cancelledRef.current) return null;
    setLiveTranscript('');
    setStatusLine(getCopy(langRef.current).listeningLabel);
    setOrbMode('user');
    setShowRepeat(true);

    const handle = listenForSpeech({
      onLevel: setMicLevel,
      onSpeechStart: () => setStatusLine(getCopy(langRef.current).listeningLabel),
      silenceMs: opts.silenceMs ?? 1400,
      maxMs: opts.maxMs ?? 22000,
      startTimeoutMs: opts.startTimeoutMs ?? 9000
    });

    repeatRef.current = () => handle.stop();
    const result = await handle.result;

    repeatRef.current = null;
    setShowRepeat(false);
    setMicLevel(0);
    setOrbMode('thinking');
    setStatusLine(getCopy(langRef.current).processingLabel);
    return result;
  };

  const maybeSwitchLanguage = (detected?: string | null, transcript?: string) => {
    if (detected && detected !== langRef.current && (transcript?.length ?? 0) >= 8) {
      langRef.current = detected;
      setLanguage(detected);
    }
  };

  const askYesNo = async (prompt: string, task: 'yesno' | 'haveAbha' = 'yesno', promptKey?: string): Promise<boolean> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt === 0) await announce(prompt, promptKey);
      else await announce(getCopy(langRef.current).sayYesNo, 'yesno');
      const heard = await listen({ silenceMs: 1100, maxMs: 8000 });
      if (cancelledRef.current) return false;
      if (!heard) continue;
      const res = await api.intent(sessionRef.current, { audio: heard.base64, mimeType: heard.mimeType, task });
      if (res.transcript) { setLiveTranscript(res.transcript); maybeSwitchLanguage(res.language, res.transcript); }
      if (res.intent === 'YES') return true;
      if (res.intent === 'NO') return false;
    }
    return false;
  };

  const askDigits = async (prompt: string, expected: number, title: string, promptKey?: string): Promise<string | null> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt === 0) await announce(prompt, promptKey);
      else await announce(getCopy(langRef.current).speakDidNotCatch, 'didNotCatch');
      const heard = await listen({ silenceMs: 1600, maxMs: 15000 });
      if (cancelledRef.current) return null;
      if (!heard) continue;
      const res = await api.transcribeField(sessionRef.current, {
        audio: heard.base64, mimeType: heard.mimeType, field: 'aadhaar', expected
      });
      if (res.transcript) setLiveTranscript(res.transcript);
      maybeSwitchLanguage(res.language, res.transcript);
      const digits = (res.digits || '').slice(0, expected);
      if (digits.length === expected) {
        const spaced = digits.split('').join(' ');
        await announce(spaced);
        const ok = await askYesNo(getCopy(langRef.current).speakConfirmNumber, 'yesno', 'confirmNumber');
        if (ok) return digits;
      }
    }
    return new Promise<string | null>((resolve) => {
      setKeypadValue('');
      setKeypad({ title, length: expected, resolve });
    });
  };

  const startCamera = async (facing: 'user' | 'environment') => {
    setCameraOn(true);
    await sleep(80);
    if (!videoRef.current) return;
    closeCamera(streamRef.current);
    try {
      streamRef.current = await openCamera(videoRef.current, facing);
      await sleep(600);
    } catch {
      setError(getCopy(langRef.current).cameraDenied);
    }
  };

  const stopCamera = () => {
    closeCamera(streamRef.current);
    streamRef.current = null;
    setCameraOn(false);
  };

  const grabFace = async () => (videoRef.current ? captureWhenReady(videoRef.current, 960) : null);
  const grabDoc = async () => (videoRef.current ? captureWhenReady(videoRef.current, 1500) : null);

  const showPatient = (p: KnownPatient) => {
    setPatient(p);
    setStage(0);
  };

  const probeMic = async (): Promise<boolean> => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  };

  const runFlow = async () => {
    try {
      try {
        const [mRes, pRes] = await Promise.all([
          fetch('/voice/manifest.json'),
          fetch('/voice/prompts.json')
        ]);
        if (mRes.ok) manifestRef.current = await mRes.json();
        if (pRes.ok) promptsRef.current = await pRes.json();
      } catch { /* pre-recorded prompts optional */ }

      const micOk = await probeMic();
      if (!micOk) {
        setError('Microphone permission is blocked. Please allow microphone access, then reopen this screen.');
        return;
      }

      const session = await api.startSession(langRef.current);
      sessionRef.current = session.sessionId;

      await announce(getCopy(langRef.current).speakGreeting, 'greeting');
      if (cancelledRef.current) return;

      const consented = await askYesNo(getCopy(langRef.current).speakConsent, 'yesno', 'consent');
      if (cancelledRef.current) return;
      if (!consented) { await announce(getCopy(langRef.current).doneHome); leave(); return; }
      await api.consent(sessionRef.current, { caseTaking: true, previousRecords: true, shareWithDoctor: true });

      let resolved: KnownPatient | null = null;
      let failReason: 'aadhaar' | 'face' | null = null;
      let regError = '';

      const faceReachable = await api.pipelineHealth().then((h) => h.face.reachable).catch(() => false);

      if (faceReachable) {
        await announce(getCopy(langRef.current).speakFaceIntro, 'faceIntro');
        await startCamera('user');
        await announce(getCopy(langRef.current).speakFaceCountdown, 'faceCountdown');
        const frame = await grabFace();
        if (frame) {
          setOrbMode('thinking');
          setStatusLine(getCopy(langRef.current).speakSearching);
          const found = await api.identifyByFace(sessionRef.current, frame).catch(() => null);
          if (found?.found && found.patient) resolved = found.patient;
        }
      }

      if (!resolved) {
        const hasAbha = await askYesNo(getCopy(langRef.current).speakAskAbha, 'haveAbha', 'askAbha');
        if (cancelledRef.current) return;

        if (hasAbha) {
          const digits = await askDigits(getCopy(langRef.current).speakSayAbha, 14, 'ABHA', 'sayAbha');
          if (digits) {
            const candidates = [digits, `ABHA-${digits}`];
            for (const cand of candidates) {
              const r = await api.identifyByAbha(sessionRef.current, cand).catch(() => null);
              if (r?.found && r.patient) { resolved = r.patient; break; }
            }
            if (resolved && !streamRef.current) await startCamera('user');
            if (resolved) {
              await announce(getCopy(langRef.current).speakLinkPhoto, 'linkPhoto');
              const face = await grabFace();
              if (face) await api.identifyByAbha(sessionRef.current, resolved.abhaId, face).catch(() => null);
            }
          }
        }

        if (!resolved) {
          const aadhaar = await askDigits(getCopy(langRef.current).speakSayAadhaar, 12, 'Aadhaar', 'sayAadhaar');
          if (cancelledRef.current) return;

          if (!aadhaar) {
            failReason = 'aadhaar';
          } else {
            const verify = await api.verifyAadhaar(sessionRef.current, aadhaar).catch(() => null);

            if (!verify?.found) {
              failReason = 'aadhaar';
            } else if (verify.alreadyRegistered && verify.abhaId) {
              const r = await api.identifyByAbha(sessionRef.current, verify.abhaId).catch(() => null);
              if (r?.found && r.patient) resolved = r.patient;
            } else if (verify.otp) {
              // New patient: tell them we will register, and ask permission first.
              const proceed = await askYesNo(getCopy(langRef.current).speakRegisterAsk, 'yesno', 'registerAsk');
              if (cancelledRef.current) return;
              if (!proceed) {
                await announce(getCopy(langRef.current).doneHome);
                leave();
                return;
              }

              // Capture a usable face, retrying with clear guidance up to 3 times.
              for (let attempt = 0; attempt < 3 && !resolved; attempt++) {
                if (!streamRef.current) await startCamera('user');
                await announce(
                  attempt === 0 ? getCopy(langRef.current).speakLinkPhoto : getCopy(langRef.current).speakFaceUnclear,
                  attempt === 0 ? 'linkPhoto' : 'faceUnclear'
                );
                await sleep(600);
                const face = await grabFace();
                if (!face) continue;

                setOrbMode('thinking');
                setStatusLine(getCopy(langRef.current).speakRegistering);
                try {
                  const reg = await api.registerByAadhaar(sessionRef.current, aadhaar, verify.otp, face);
                  if (reg?.patient) { resolved = reg.patient; break; }
                } catch (e: any) {
                  regError = e?.message || '';
                }
              }
              if (!resolved) failReason = 'face';
            }
          }
        }
      }

      stopCamera();

      if (!resolved) {
        if (failReason === 'face') {
          setError(regError || 'Face could not be captured.');
          await announce(getCopy(langRef.current).speakFaceUnclear, 'faceUnclear');
        } else {
          await announce(getCopy(langRef.current).speakNotFound, 'notFound');
        }
        leave();
        return;
      }

      showPatient(resolved);

      // Say the name (a proper noun speaks fine in any language), then the
      // localized pre-recorded "is this you?". Conditions show on screen, not recited.
      await announce(`${resolved.name}.`);
      const isYou = await askYesNo(getCopy(langRef.current).speakConfirmYou, 'yesno', 'confirmYou');
      if (cancelledRef.current) return;
      if (!isYou) { await announce(getCopy(langRef.current).doneHome); leave(); return; }

      setStage(1);
      let mode: 'GENERAL_OPD' | 'AYUSH' = 'GENERAL_OPD';
      for (let attempt = 0; attempt < 2; attempt++) {
        await announce(getCopy(langRef.current).speakAskMode, 'askMode');
        const heard = await listen({ silenceMs: 1200, maxMs: 8000 });
        if (cancelledRef.current) return;
        if (!heard) continue;
        const res = await api.intent(sessionRef.current, { audio: heard.base64, mimeType: heard.mimeType, task: 'mode' });
        if (res.transcript) { setLiveTranscript(res.transcript); maybeSwitchLanguage(res.language, res.transcript); }
        if (res.intent === 'AYUSH') { mode = 'AYUSH'; break; }
        if (res.intent === 'GENERAL') { mode = 'GENERAL_OPD'; break; }
      }
      setModeLabel(mode === 'AYUSH' ? c.ayushTitle : c.generalTitle);
      await api.selectMode(sessionRef.current, mode);

      setStage(2);
      const first = await api.beginInterview(sessionRef.current);
      setProgress(first.progress.percent);
      await playServerAudio(first.audio, first.question);

      let done = false;
      let guard = 0;
      while (!done && guard < 30 && !cancelledRef.current) {
        guard++;
        const heard = await listen({ silenceMs: 1500, maxMs: 22000 });
        if (cancelledRef.current) return;
        if (!heard) { await announce(getCopy(langRef.current).speakDidNotCatch); continue; }

        const turn = await api.interviewTurn(sessionRef.current, { audio: heard.base64, mimeType: heard.mimeType });
        if (turn.heardNothing) { await announce(getCopy(langRef.current).speakDidNotCatch); continue; }

        setLiveTranscript(turn.transcript || '');
        setProgress(turn.progress.percent);
        setRedFlags(turn.redFlags || []);
        if (turn.urgency === 'EMERGENCY') setEmergency(true);
        maybeSwitchLanguage(turn.language, turn.transcript);

        const speak = [turn.confirmation, turn.question].filter(Boolean).join(' ');
        await playServerAudio(turn.audio, speak);
        done = turn.done;
      }

      setStage(3);
      let addMore = await askYesNo(getCopy(langRef.current).speakAskDocuments, 'yesno', 'askDocuments');
      let docCount = 0;
      while (addMore && !cancelledRef.current && docCount < 5) {
        await announce(getCopy(langRef.current).speakShowDocument, 'showDocument');
        await startCamera('environment');
        await sleep(1200);
        const docFrame = await grabDoc();
        stopCamera();
        if (docFrame) {
          setOrbMode('thinking');
          setStatusLine(getCopy(langRef.current).speakReadingDoc);
          const doc = await api.addDocument(sessionRef.current, docFrame).catch(() => null);
          if (doc) {
            docCount++;
            await api.confirmDocument(sessionRef.current, doc.documentId, true).catch(() => null);
          }
        }
        addMore = await askYesNo(getCopy(langRef.current).speakMoreDocuments, 'yesno', 'moreDocuments');
      }
      if (docCount === 0) await api.skipDocuments(sessionRef.current).catch(() => null);

      setStage(4);
      await announce(getCopy(langRef.current).speakReviewIntro, 'reviewIntro');
      let review = await api.review(sessionRef.current);
      setReviewText(review.summary);
      setKeyPoints(review.keyPoints || []);
      setRedFlags(review.redFlags || []);
      if (review.urgency === 'EMERGENCY') setEmergency(true);
      await playServerAudio(review.audio, review.patientReadBack);

      let confirmed = false;
      for (let attempt = 0; attempt < 3 && !cancelledRef.current; attempt++) {
        await announce(getCopy(langRef.current).speakAllCorrect, 'allCorrect');
        const heard = await listen({ silenceMs: 1400, maxMs: 12000 });
        if (cancelledRef.current) return;
        if (!heard) continue;
        const res = await api.intent(sessionRef.current, { audio: heard.base64, mimeType: heard.mimeType, task: 'yesno' });
        maybeSwitchLanguage(res.language, res.transcript);
        if (res.intent === 'YES') { confirmed = true; break; }
        // treat anything that is not a clear yes as a correction
        await announce(getCopy(langRef.current).speakWhatWrong, 'whatWrong');
        const corr = await listen({ silenceMs: 1600, maxMs: 18000 });
        if (corr) {
          const applied = await api.correct(sessionRef.current, { audio: corr.base64, mimeType: corr.mimeType }).catch(() => null);
          if (applied?.audio) await playServerAudio(applied.audio, applied.acknowledgement);
          review = await api.review(sessionRef.current);
          setReviewText(review.summary);
          setKeyPoints(review.keyPoints || []);
          await playServerAudio(review.audio, review.patientReadBack);
        }
      }

      if (!confirmed) confirmed = true;

      setOrbMode('thinking');
      setStatusLine(getCopy(langRef.current).processingLabel);
      const done2 = await api.finalize(sessionRef.current);
      setToken({ tokenNumber: done2.tokenNumber, queuedFor: done2.queuedFor, priorityTriage: done2.priorityTriage });
      setStage(5);
      await playServerAudio(done2.audio, `${getCopy(langRef.current).speakTokenIs} ${done2.tokenNumber}.`);
      setOrbMode('idle');
      setStatusLine('');
    } catch (e: any) {
      if (!cancelledRef.current) {
        setError(e?.message || 'Something went wrong');
        setOrbMode('idle');
      }
    }
  };

  const leave = () => {
    cancelledRef.current = true;
    stopSpeech();
    stopCamera();
    if (repeatRef.current) repeatRef.current();
    if (sessionRef.current) api.abandon(sessionRef.current);
    navigateTo('home');
  };

  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    cancelledRef.current = false;
    runFlow();
    return () => {
      cancelledRef.current = true;
      stopSpeech();
      closeCamera(streamRef.current);
      if (repeatRef.current) repeatRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitKeypad = () => {
    if (!keypad) return;
    const value = keypadValue;
    const resolve = keypad.resolve;
    setKeypad(null);
    setKeypadValue('');
    resolve(value.length === keypad.length ? value : null);
  };

  const showThinking = orbMode === 'thinking';

  return (
    <Shell
      title={c.consultTitle}
      subtitle={c.govt}
      accent="green"
      language={languageLabel(language)}
      onBack={leave}
      backLabel={c.back}
    >
      <Stepper steps={STAGES} active={stage} tone="green" />

      {error && (
        <div className="mb-6">
          <Banner tone="danger" title={c.errorTitle} body={error} />
          <div className="mt-3">
            <BigButton tone="ghost" onClick={leave}>{c.doneHome}</BigButton>
          </div>
        </div>
      )}

      {emergency && !token && (
        <div className="mb-6">
          <Banner tone="danger" title={c.redFlagNotice} body={redFlags.join(' · ')} />
        </div>
      )}

      <Card className="p-8">
        {token ? (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-emerald-50 text-[#138808] flex items-center justify-center mx-auto mb-7 text-5xl">✓</div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{c.doneTitle}</h2>
            <p className="text-lg text-slate-500 mb-8">{c.doneSub}</p>
            <div className="inline-block px-14 py-8 rounded-3xl bg-slate-900 text-white mb-8">
              <p className="text-sm text-white/60 uppercase tracking-widest mb-2">{c.tokenLabel}</p>
              <p className="text-6xl font-bold tracking-tight">{token.tokenNumber}</p>
              <p className="text-sm text-white/70 mt-3">{c.deptLabel}: {token.queuedFor}</p>
            </div>
            {token.priorityTriage && (
              <div className="mb-8"><Banner tone="danger" title={c.donePriority} body={redFlags.join(' · ')} /></div>
            )}
            <BigButton onClick={() => navigateTo('home')}>{c.doneHome}</BigButton>
          </div>
        ) : (
          <div className="text-center">
            <div className={`relative mx-auto mb-6 rounded-3xl overflow-hidden bg-slate-900 transition-all ${cameraOn ? 'aspect-video max-w-xl' : 'h-0'}`}>
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              {cameraOn && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-60 rounded-[50%] border-4 border-white/70 shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]" />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center mb-6">
              <VoiceOrb mode={orbMode} size={132} level={micLevel} />
              <p className="text-sm font-semibold text-slate-500 mt-4">
                {showThinking ? (statusLine || c.processingLabel) : statusLine}
              </p>

              {showRepeat && (
                <>
                  <div className="mt-4 w-56 h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#138808] transition-[width] duration-75"
                      style={{ width: `${Math.min(100, Math.round(micLevel * 140))}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {micLevel > 0.05 ? '🎙️ ' + c.heardYou + '…' : 'Speak — I am listening'}
                  </p>
                  <button
                    onClick={() => repeatRef.current?.()}
                    className="mt-4 px-8 py-3 rounded-2xl bg-[#138808] text-white font-bold text-base shadow-sm hover:bg-[#0f6e06] active:scale-[0.98] transition"
                  >
                    ✓ {c.tapRepeat === 'दोहराएँ' ? 'हो गया' : 'Done'}
                  </button>
                </>
              )}
            </div>

            {caption && (
              <p className="text-xl md:text-2xl font-semibold text-slate-900 leading-relaxed max-w-2xl mx-auto min-h-[4rem]">
                {caption}
              </p>
            )}

            {liveTranscript && (
              <p className="mt-4 text-base text-slate-400">“{liveTranscript}”</p>
            )}

            {patient && (
              <div className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-50 ring-1 ring-slate-200">
                <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                  {patient.name?.[0] || '?'}
                </span>
                <span className="text-sm font-semibold text-slate-700">{patient.name}</span>
                {modeLabel && <span className="text-xs text-slate-400">· {modeLabel}</span>}
              </div>
            )}

            {stage === 2 && (
              <div className="mt-7 max-w-md mx-auto">
                <ProgressBar percent={progress} label={c.progressLabel} />
              </div>
            )}

            {stage === 4 && keyPoints.length > 0 && (
              <div className="mt-7 text-left max-w-lg mx-auto rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{c.reviewKeyPoints}</p>
                <ul className="space-y-2">
                  {keyPoints.map((k, i) => (
                    <li key={i} className="flex gap-2 text-slate-800 text-sm"><span className="text-[#138808] font-bold">•</span>{k}</li>
                  ))}
                </ul>
                {reviewText && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-600">{c.reviewSummary}</summary>
                    <pre className="mt-3 whitespace-pre-wrap text-xs text-slate-600 font-sans">{reviewText}</pre>
                  </details>
                )}
              </div>
            )}

          </div>
        )}
      </Card>

      {keypad && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-7 w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-1">{keypad.title}</h3>
            <p className="text-sm text-slate-500 mb-4">Enter {keypad.length} digits</p>
            <div className="h-14 rounded-xl border-2 border-slate-200 flex items-center justify-center text-2xl tracking-[0.3em] font-mono mb-4">
              {keypadValue || '—'}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['1','2','3','4','5','6','7','8','9'].map((d) => (
                <button key={d} onClick={() => setKeypadValue((v) => (v.length < keypad.length ? v + d : v))}
                  className="h-14 rounded-xl bg-slate-100 hover:bg-slate-200 text-xl font-bold text-slate-800">{d}</button>
              ))}
              <button onClick={() => setKeypadValue((v) => v.slice(0, -1))} className="h-14 rounded-xl bg-slate-100 hover:bg-slate-200 text-lg">⌫</button>
              <button onClick={() => setKeypadValue((v) => (v.length < keypad.length ? v + '0' : v))} className="h-14 rounded-xl bg-slate-100 hover:bg-slate-200 text-xl font-bold text-slate-800">0</button>
              <button onClick={submitKeypad} disabled={keypadValue.length !== keypad.length}
                className="h-14 rounded-xl bg-[#138808] text-white font-bold disabled:opacity-40">✓</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
};

export default ConsultationPage;
