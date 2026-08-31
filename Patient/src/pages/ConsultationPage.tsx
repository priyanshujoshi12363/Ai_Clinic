import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Shell, Card, BigButton, VoiceOrb, Stepper, ProgressBar, Banner } from '../components/ui';
import { getCopy, languageLabel } from '../i18n/strings';
import { api, type KnownPatient, type ExtractedDocument, type ReviewResult } from '../lib/api';
import { Recorder, LevelMeter, playChunks, stopSpeech, openCamera, closeCamera, captureFrame } from '../lib/media';

type Step =
  | 'boot'
  | 'consent'
  | 'face'
  | 'abha'
  | 'identified'
  | 'mode'
  | 'interview'
  | 'documents'
  | 'docCapture'
  | 'docReview'
  | 'review'
  | 'correcting'
  | 'done';

interface Props {
  navigateTo: (page: string) => void;
  language: string;
  setLanguage: (code: string) => void;
}

const STEP_STAGE: Record<Step, number> = {
  boot: 0, consent: 0, face: 0, abha: 0, identified: 0,
  mode: 1, interview: 2, documents: 3, docCapture: 3, docReview: 3,
  review: 4, correcting: 4, done: 5
};

const ConsultationPage: React.FC<Props> = ({ navigateTo, language, setLanguage }) => {
  const [step, setStep] = useState<Step>('boot');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [sessionId, setSessionId] = useState('');
  const [patient, setPatient] = useState<KnownPatient | null>(null);
  const [abhaInput, setAbhaInput] = useState('');
  const [faceMessage, setFaceMessage] = useState('');
  const [faceAvailable, setFaceAvailable] = useState(true);

  const [mode, setMode] = useState<'GENERAL_OPD' | 'AYUSH'>('GENERAL_OPD');

  const [question, setQuestion] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [understood, setUnderstood] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<'EMERGENCY' | 'URGENT' | 'ROUTINE'>('ROUTINE');
  const [lastTranscript, setLastTranscript] = useState('');
  const [langNotice, setLangNotice] = useState('');

  const [documents, setDocuments] = useState<ExtractedDocument[]>([]);
  const [pendingDoc, setPendingDoc] = useState<ExtractedDocument | null>(null);

  const [review, setReview] = useState<ReviewResult | null>(null);
  const [result, setResult] = useState<{ tokenNumber: string; queuedFor: string; priorityTriage: boolean } | null>(null);

  const [recording, setRecording] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [orb, setOrb] = useState<'ai' | 'user' | 'thinking' | 'idle'>('idle');

  const recorderRef = useRef<Recorder | null>(null);
  const meterStopRef = useRef<(() => void) | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef('');

  const copy = getCopy(language);

  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await api.startSession(language);
        if (cancelled) return;
        setSessionId(session.sessionId);
        setStep('consent');

        try {
          const health = await api.pipelineHealth();
          if (!cancelled) setFaceAvailable(health.face.reachable);
        } catch {
          if (!cancelled) setFaceAvailable(false);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      }
    })();

    return () => {
      cancelled = true;
      stopSpeech();
      closeCamera(streamRef.current);
      meterStopRef.current?.();
      recorderRef.current?.release();
    };
  }, []);

  const say = useCallback(async (audio: { audios: string[]; format: string } | null | undefined) => {
    if (!audio?.audios?.length) return;
    setOrb('ai');
    await playChunks(audio.audios, audio.format);
    setOrb('idle');
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (!text) return;
    try {
      const audio = await api.speak(text, language);
      await say(audio);
    } catch {
      return;
    }
  }, [language, say]);

  const leave = async () => {
    stopSpeech();
    closeCamera(streamRef.current);
    if (sessionRef.current && step !== 'done') await api.abandon(sessionRef.current);
    navigateTo('home');
  };

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    setFaceMessage('');
    try {
      await new Promise((r) => setTimeout(r, 60));
      if (!videoRef.current) return;
      closeCamera(streamRef.current);
      streamRef.current = await openCamera(videoRef.current, facing);
    } catch {
      setFaceMessage(copy.cameraDenied);
    }
  }, [copy.cameraDenied]);

  useEffect(() => {
    if (step === 'face') startCamera('user');
    if (step === 'docCapture') startCamera('environment');
    if (step !== 'face' && step !== 'docCapture') {
      closeCamera(streamRef.current);
      streamRef.current = null;
    }
  }, [step, startCamera]);

  const acceptConsent = async () => {
    setBusy(true);
    try {
      await api.consent(sessionId, { caseTaking: true, previousRecords: true, shareWithDoctor: true });
      setStep(faceAvailable ? 'face' : 'abha');
    } catch (e: any) {
      setError(e.message);
    }
    setBusy(false);
  };

  const takeFace = async () => {
    if (!videoRef.current) return;
    const frame = captureFrame(videoRef.current, 800);
    if (!frame) {
      setFaceMessage(copy.cameraDenied);
      return;
    }

    setBusy(true);
    setOrb('thinking');
    try {
      const found = await api.identifyByFace(sessionId, frame);
      if (found.found && found.patient) {
        setPatient(found.patient);
        setStep('identified');
      } else {
        setFaceMessage(copy.faceNotFound);
        setStep('abha');
      }
    } catch (e: any) {
      setFaceMessage(e.message);
      setStep('abha');
    }
    setOrb('idle');
    setBusy(false);
  };

  const submitAbha = async () => {
    if (!abhaInput.trim()) return;
    setBusy(true);
    try {
      const found = await api.identifyByAbha(sessionId, abhaInput.trim());
      setPatient(found.patient);
      setStep('identified');
    } catch (e: any) {
      setFaceMessage(e.message);
    }
    setBusy(false);
  };

  const chooseMode = async (picked: 'GENERAL_OPD' | 'AYUSH') => {
    setMode(picked);
    setBusy(true);
    setOrb('thinking');
    try {
      await api.selectMode(sessionId, picked);
      const first = await api.beginInterview(sessionId);
      setQuestion(first.question);
      setProgress(first.progress.percent);
      setStep('interview');
      await say(first.audio);
    } catch (e: any) {
      setError(e.message);
    }
    setOrb('idle');
    setBusy(false);
  };

  const beginRecording = async () => {
    stopSpeech();
    setConfirmation('');
    try {
      const recorder = new Recorder();
      await recorder.start();
      recorderRef.current = recorder;
      meterStopRef.current = await new LevelMeter().attach(setMicLevel);
      setRecording(true);
      setOrb('user');
    } catch {
      setError('Microphone not available. Please allow microphone access.');
    }
  };

  const endRecording = async (): Promise<{ base64: string; mimeType: string } | null> => {
    if (!recorderRef.current) return null;
    setRecording(false);
    meterStopRef.current?.();
    meterStopRef.current = null;
    setMicLevel(0);

    const audio = await recorderRef.current.stop();
    recorderRef.current = null;
    if (!audio.durationOk) return null;
    return { base64: audio.base64, mimeType: audio.mimeType };
  };

  const submitAnswer = async () => {
    const audio = await endRecording();
    if (!audio) {
      setConfirmation(copy.didNotHear);
      setOrb('idle');
      return;
    }

    setOrb('thinking');
    setBusy(true);
    try {
      const turn = await api.interviewTurn(sessionId, { audio: audio.base64, mimeType: audio.mimeType });

      if (turn.heardNothing) {
        setConfirmation(copy.didNotHear);
        setOrb('idle');
        setBusy(false);
        return;
      }

      setLastTranscript(turn.transcript || '');
      setUnderstood(turn.understood || {});
      setConfirmation(turn.confirmation || '');
      setQuestion(turn.question);
      setProgress(turn.progress.percent);
      setRedFlags(turn.redFlags || []);
      setUrgency(turn.urgency);

      if (turn.languageSwitched && turn.language) {
        setLanguage(turn.language);
        setLangNotice(`${copy.langSwitched}: ${languageLabel(turn.language)}`);
        setTimeout(() => setLangNotice(''), 6000);
      }

      await say(turn.audio);

      if (turn.done) setStep('documents');
    } catch (e: any) {
      setError(e.message);
    }
    setOrb('idle');
    setBusy(false);
  };

  const captureDocument = async () => {
    if (!videoRef.current) return;
    const frame = captureFrame(videoRef.current, 1400);
    if (!frame) return;

    setBusy(true);
    setOrb('thinking');
    try {
      const extracted = await api.addDocument(sessionId, frame);
      setPendingDoc(extracted);
      setStep('docReview');
    } catch (e: any) {
      setError(e.message);
    }
    setOrb('idle');
    setBusy(false);
  };

  const keepDocument = async () => {
    if (!pendingDoc) return;
    setBusy(true);
    try {
      await api.confirmDocument(sessionId, pendingDoc.documentId, true);
      setDocuments((prev) => [...prev, pendingDoc]);
      setPendingDoc(null);
      setStep('documents');
    } catch (e: any) {
      setError(e.message);
    }
    setBusy(false);
  };

  const buildReview = async () => {
    setBusy(true);
    setOrb('thinking');
    try {
      if (documents.length === 0) await api.skipDocuments(sessionId);
      const built = await api.review(sessionId);
      setReview(built);
      setRedFlags(built.redFlags);
      setUrgency(built.urgency);
      setStep('review');
      await say(built.audio);
    } catch (e: any) {
      setError(e.message);
    }
    setOrb('idle');
    setBusy(false);
  };

  const submitCorrection = async () => {
    const audio = await endRecording();
    if (!audio) {
      setStep('review');
      setOrb('idle');
      return;
    }

    setOrb('thinking');
    setBusy(true);
    try {
      const corrected = await api.correct(sessionId, { audio: audio.base64, mimeType: audio.mimeType });
      setUnderstood(corrected.understood);
      await say(corrected.audio);
      const rebuilt = await api.review(sessionId);
      setReview(rebuilt);
      setStep('review');
      await say(rebuilt.audio);
    } catch (e: any) {
      setError(e.message);
      setStep('review');
    }
    setOrb('idle');
    setBusy(false);
  };

  const finish = async () => {
    setBusy(true);
    setOrb('thinking');
    try {
      const done = await api.finalize(sessionId);
      setResult({ tokenNumber: done.tokenNumber, queuedFor: done.queuedFor, priorityTriage: done.priorityTriage });
      setStep('done');
      await say(done.audio);
    } catch (e: any) {
      setError(e.message);
    }
    setOrb('idle');
    setBusy(false);
  };

  const steps = ['Identify', 'Department', 'Questions', 'Documents', 'Check', 'Done'];

  return (
    <Shell
      title={copy.consultTitle}
      subtitle={copy.govt}
      accent="green"
      language={languageLabel(language)}
      onBack={leave}
      backLabel={copy.back}
    >
      <Stepper steps={steps} active={STEP_STAGE[step]} tone="green" />

      {error && (
        <div className="mb-6">
          <Banner tone="danger" title={copy.errorTitle} body={error} />
          <div className="mt-3">
            <BigButton tone="ghost" onClick={() => setError('')}>{copy.retry}</BigButton>
          </div>
        </div>
      )}

      {urgency === 'EMERGENCY' && step !== 'done' && (
        <div className="mb-6">
          <Banner tone="danger" title={copy.redFlagNotice} body={redFlags.join(' · ')} />
        </div>
      )}

      {langNotice && (
        <div className="mb-6">
          <Banner tone="info" title={langNotice} />
        </div>
      )}

      <Card className="p-9">
        {step === 'boot' && (
          <div className="text-center py-16">
            <VoiceOrb mode="thinking" size={100} />
            <p className="mt-6 text-lg text-slate-500">{copy.starting}</p>
          </div>
        )}

        {step === 'consent' && (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{copy.consentTitle}</h2>
            <p className="text-lg text-slate-500 mb-7">{copy.consentBody}</p>

            <ul className="space-y-4 mb-9">
              {[copy.consentPoint1, copy.consentPoint2, copy.consentPoint3].map((point, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="w-8 h-8 rounded-full bg-emerald-50 text-[#138808] font-bold flex items-center justify-center shrink-0 text-sm">
                    {i + 1}
                  </span>
                  <span className="text-lg text-slate-700 leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <BigButton
                tone="ghost"
                onClick={() => speakText(`${copy.consentBody} ${copy.consentPoint1} ${copy.consentPoint2} ${copy.consentPoint3}`)}
              >
                🔊 {copy.consentListen}
              </BigButton>
              <BigButton onClick={acceptConsent} disabled={busy} className="sm:col-span-2">
                {copy.consentAgree}
              </BigButton>
            </div>
          </div>
        )}

        {(step === 'face' || step === 'docCapture') && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {step === 'face' ? copy.faceTitle : copy.docsCapture}
            </h2>
            <p className="text-lg text-slate-500 mb-7">{step === 'face' ? copy.faceSub : copy.docsSub}</p>

            <div className="relative mx-auto mb-7 rounded-3xl overflow-hidden bg-slate-900 aspect-video max-w-2xl ring-1 ring-slate-200">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              {step === 'face' && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-56 h-72 rounded-[50%] border-4 border-white/70 shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]" />
                </div>
              )}
              {step === 'docCapture' && (
                <div className="pointer-events-none absolute inset-6 border-4 border-dashed border-white/70 rounded-2xl" />
              )}
              {busy && (
                <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center">
                  <VoiceOrb mode="thinking" size={72} />
                  <p className="text-white mt-4 text-lg">
                    {step === 'face' ? copy.faceScanning : copy.docsScanning}
                  </p>
                </div>
              )}
            </div>

            {faceMessage && <p className="text-base text-red-600 mb-5">{faceMessage}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BigButton tone="ghost" onClick={() => setStep(step === 'face' ? 'abha' : 'documents')}>
                {step === 'face' ? copy.faceUseAbha : copy.back}
              </BigButton>
              <BigButton onClick={step === 'face' ? takeFace : captureDocument} disabled={busy}>
                📷 {step === 'face' ? copy.faceCapture : copy.docsCapture}
              </BigButton>
            </div>
          </div>
        )}

        {step === 'abha' && (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{copy.faceUseAbha}</h2>
            <p className="text-lg text-slate-500 mb-7">
              {faceMessage || (faceAvailable ? copy.faceNotFound : copy.cameraDenied)}
            </p>

            <input
              value={abhaInput}
              onChange={(e) => setAbhaInput(e.target.value)}
              placeholder={copy.abhaPlaceholder}
              className="w-full text-center text-2xl tracking-wide p-6 border-2 border-slate-300 rounded-2xl focus:border-[#138808] focus:outline-none mb-5"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {faceAvailable ? (
                <BigButton tone="ghost" onClick={() => setStep('face')}>📷 {copy.faceCapture}</BigButton>
              ) : (
                <BigButton tone="ghost" onClick={leave}>{copy.back}</BigButton>
              )}
              <BigButton onClick={submitAbha} disabled={busy || !abhaInput.trim()}>{copy.abhaContinue}</BigButton>
            </div>
          </div>
        )}

        {step === 'identified' && patient && (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">{copy.foundTitle}</h2>

            <div className="flex items-center gap-5 mb-7 p-5 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
              {patient.faceUrl ? (
                <img src={patient.faceUrl} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-white" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center text-2xl font-bold">
                  {patient.name?.[0] || '?'}
                </div>
              )}
              <div>
                <p className="text-2xl font-bold text-slate-900">{patient.name}</p>
                <p className="text-slate-500 text-lg">
                  {patient.age ?? '—'} · {patient.gender}
                </p>
                <p className="text-sm text-slate-400 font-mono">{patient.abhaId}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: copy.foundConditions, items: patient.conditions },
                { label: copy.foundAllergies, items: patient.allergies },
                { label: copy.foundMedicines, items: patient.medicines }
              ].map(({ label, items }) => (
                <div key={label} className="p-4 rounded-2xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{label}</p>
                  {items?.length ? (
                    <ul className="space-y-1">
                      {items.slice(0, 4).map((item, i) => (
                        <li key={i} className="text-sm text-slate-700">• {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400">{copy.foundNone}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <BigButton tone="ghost" onClick={() => setStep(faceAvailable ? 'face' : 'abha')}>{copy.notYou}</BigButton>
              <BigButton onClick={() => setStep('mode')} className="sm:col-span-2">{copy.continueBtn}</BigButton>
            </div>
          </div>
        )}

        {step === 'mode' && (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{copy.modeTitle}</h2>
            <p className="text-lg text-slate-500 mb-8">{copy.modeSub}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'GENERAL_OPD' as const, title: copy.generalTitle, desc: copy.generalDesc, tint: 'border-t-slate-900' },
                { key: 'AYUSH' as const, title: copy.ayushTitle, desc: copy.ayushDesc, tint: 'border-t-[#FF9933]' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => chooseMode(option.key)}
                  disabled={busy}
                  className={`text-left p-8 rounded-3xl border-2 border-slate-200 border-t-[6px] ${option.tint} hover:shadow-xl hover:-translate-y-1 transition-all outline-none focus-visible:ring-4 focus-visible:ring-slate-900/20 disabled:opacity-50`}
                >
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{option.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'interview' && (
          <div>
            <div className="mb-7">
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${
                    mode === 'AYUSH'
                      ? 'bg-orange-50 text-[#B45309] ring-1 ring-orange-200'
                      : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                  }`}
                >
                  {mode === 'AYUSH' ? copy.ayushTitle : copy.generalTitle}
                </span>
                {patient?.name && <span className="text-sm text-slate-400">{patient.name}</span>}
              </div>
              <ProgressBar percent={progress} label={copy.progressLabel} />
            </div>

            <div className="text-center mb-8">
              <p className="text-2xl md:text-3xl font-semibold text-slate-900 leading-relaxed min-h-[5rem]">
                {question || copy.thinking}
              </p>
              {confirmation && <p className="mt-4 text-lg text-[#138808] font-medium">✓ {confirmation}</p>}
            </div>

            <div className="flex flex-col items-center mb-8">
              <VoiceOrb mode={recording ? 'user' : orb} size={120} level={micLevel} />
              <p className="text-base text-slate-500 mt-3">
                {recording ? copy.listening : orb === 'thinking' ? copy.thinking : copy.tapToSpeak}
              </p>
            </div>

            <BigButton
              tone={recording ? 'danger' : 'primary'}
              onClick={recording ? submitAnswer : beginRecording}
              disabled={busy && !recording}
            >
              {recording ? `⏹ ${copy.tapToStop}` : `🎤 ${copy.tapToSpeak}`}
            </BigButton>

            {lastTranscript && (
              <p className="mt-5 text-center text-sm text-slate-400">“{lastTranscript}”</p>
            )}

            {Object.keys(understood).length > 0 && (
              <details className="mt-7 rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-5">
                <summary className="cursor-pointer font-semibold text-slate-700">{copy.understoodTitle}</summary>
                <dl className="mt-4 space-y-3">
                  {Object.entries(understood)
                    .filter(([, value]) => value)
                    .map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{key}</dt>
                        <dd className="text-slate-800">{value}</dd>
                      </div>
                    ))}
                </dl>
              </details>
            )}
          </div>
        )}

        {step === 'documents' && (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{copy.docsTitle}</h2>
            <p className="text-lg text-slate-500 mb-8">{copy.docsSub}</p>

            {documents.length > 0 && (
              <div className="mb-7 p-5 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200">
                <p className="font-bold text-[#138808] mb-3">
                  ✓ {documents.length} {copy.docsAdded}
                </p>
                <ul className="space-y-1.5">
                  {documents.map((doc) => (
                    <li key={doc.documentId} className="text-sm text-slate-700">
                      • {doc.documentType.replace('_', ' ')} {doc.date ? `— ${doc.date}` : ''}{' '}
                      {doc.diagnoses?.length ? `(${doc.diagnoses.join(', ')})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BigButton onClick={() => setStep('docCapture')} disabled={busy}>
                📄 {documents.length ? copy.docsAnother : copy.docsHave}
              </BigButton>
              <BigButton tone="ghost" onClick={buildReview} disabled={busy}>
                {documents.length ? copy.docsDone : copy.docsNone}
              </BigButton>
            </div>
          </div>
        )}

        {step === 'docReview' && pendingDoc && (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{copy.docsExtracted}</h2>
            <p className="text-lg text-slate-500 mb-6">{copy.docsCheck}</p>

            {pendingDoc.needsVerification && (
              <div className="mb-6">
                <Banner
                  tone="warn"
                  title={`Reading confidence ${Math.round(pendingDoc.confidence * 100)}%`}
                  body={pendingDoc.uncertain?.length ? `Unclear: ${pendingDoc.uncertain.join(', ')}` : undefined}
                />
              </div>
            )}

            <div className="space-y-5 mb-8">
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <span><b className="text-slate-400">Type</b> {pendingDoc.documentType.replace('_', ' ')}</span>
                {pendingDoc.date && <span><b className="text-slate-400">Date</b> {pendingDoc.date}</span>}
                {pendingDoc.hospital && <span><b className="text-slate-400">From</b> {pendingDoc.hospital}</span>}
              </div>

              {pendingDoc.diagnoses?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Diagnoses</p>
                  <div className="flex flex-wrap gap-2">
                    {pendingDoc.diagnoses.map((d, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 ring-1 ring-amber-200 text-sm">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {pendingDoc.medicines?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Medicines</p>
                  <ul className="space-y-1.5">
                    {pendingDoc.medicines.map((m, i) => (
                      <li key={i} className="text-slate-800">
                        <b>{m.name}</b> {m.dosage} · {m.frequency} {m.duration ? `· ${m.duration}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pendingDoc.investigations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Test results</p>
                  <ul className="space-y-1.5">
                    {pendingDoc.investigations.map((t, i) => (
                      <li key={i} className={t.abnormal ? 'text-red-700 font-semibold' : 'text-slate-800'}>
                        {t.name}: {t.value} {t.unit} {t.referenceRange ? `(normal ${t.referenceRange})` : ''}
                        {t.abnormal ? ' ⚠' : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BigButton tone="ghost" onClick={() => { setPendingDoc(null); setStep('docCapture'); }}>
                {copy.retry}
              </BigButton>
              <BigButton onClick={keepDocument} disabled={busy}>{copy.docsConfirm}</BigButton>
            </div>
          </div>
        )}

        {step === 'review' && review && (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{copy.reviewTitle}</h2>
            <p className="text-lg text-slate-500 mb-7">{copy.reviewSub}</p>

            <div className="p-6 rounded-2xl bg-slate-900 text-white mb-7">
              <p className="text-lg leading-relaxed">{review.patientReadBack}</p>
              <button
                onClick={() => say(review.audio)}
                className="mt-4 text-sm font-semibold bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 transition-colors"
              >
                🔊 {copy.reviewListen}
              </button>
            </div>

            {review.keyPoints.length > 0 && (
              <div className="mb-7">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{copy.reviewKeyPoints}</p>
                <ul className="space-y-2">
                  {review.keyPoints.map((point, i) => (
                    <li key={i} className="flex gap-3 text-slate-800">
                      <span className="text-[#138808] font-bold">•</span> {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <details className="mb-8 rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-5">
              <summary className="cursor-pointer font-semibold text-slate-700">{copy.reviewSummary}</summary>
              <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">{review.summary}</pre>
            </details>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BigButton tone="ghost" onClick={async () => { setStep('correcting'); await beginRecording(); }}>
                ✏️ {copy.reviewCorrect}
              </BigButton>
              <BigButton onClick={finish} disabled={busy}>✓ {copy.reviewConfirm}</BigButton>
            </div>
          </div>
        )}

        {step === 'correcting' && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">{copy.correctPrompt}</h2>
            <p className="text-lg text-slate-500 mb-8">{copy.tapToStop}</p>

            <div className="flex flex-col items-center mb-8">
              <VoiceOrb mode={recording ? 'user' : orb} size={120} level={micLevel} />
              <p className="text-base text-slate-500 mt-3">{recording ? copy.listening : copy.thinking}</p>
            </div>

            <BigButton tone="danger" onClick={submitCorrection} disabled={!recording && busy}>
              ⏹ {copy.tapToStop}
            </BigButton>
          </div>
        )}

        {step === 'done' && result && (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-emerald-50 text-[#138808] flex items-center justify-center mx-auto mb-7 text-5xl">
              ✓
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{copy.doneTitle}</h2>
            <p className="text-lg text-slate-500 mb-9">{copy.doneSub}</p>

            <div className="inline-block px-14 py-8 rounded-3xl bg-slate-900 text-white mb-8">
              <p className="text-sm text-white/60 uppercase tracking-widest mb-2">{copy.tokenLabel}</p>
              <p className="text-6xl font-bold tracking-tight">{result.tokenNumber}</p>
              <p className="text-sm text-white/70 mt-3">
                {copy.deptLabel}: {result.queuedFor}
              </p>
            </div>

            {result.priorityTriage && (
              <div className="mb-8">
                <Banner tone="danger" title={copy.donePriority} body={redFlags.join(' · ')} />
              </div>
            )}

            <BigButton onClick={() => navigateTo('home')}>{copy.doneHome}</BigButton>
          </div>
        )}
      </Card>
    </Shell>
  );
};

export default ConsultationPage;
