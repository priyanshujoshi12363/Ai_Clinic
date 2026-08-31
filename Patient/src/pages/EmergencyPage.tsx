import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Shell, Card, BigButton, VoiceOrb, Banner } from '../components/ui';
import { getCopy, languageLabel } from '../i18n/strings';
import { api, type EmergencyIntake, type EssentialQuestion } from '../lib/api';
import { Recorder, LevelMeter, playChunks, stopSpeech } from '../lib/media';

type Step = 'ask' | 'creating' | 'token' | 'questions' | 'complete';

interface Props {
  navigateTo: (page: string) => void;
  language: string;
  setLanguage: (code: string) => void;
}

const TRIAGE_STYLE = {
  RED: { bg: 'bg-red-600', ring: 'ring-red-200', text: 'text-red-600', chip: 'bg-red-50 text-red-800 ring-red-200' },
  ORANGE: { bg: 'bg-orange-500', ring: 'ring-orange-200', text: 'text-orange-600', chip: 'bg-orange-50 text-orange-800 ring-orange-200' },
  YELLOW: { bg: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-amber-600', chip: 'bg-amber-50 text-amber-900 ring-amber-200' },
  GREEN: { bg: 'bg-[#138808]', ring: 'ring-emerald-200', text: 'text-[#138808]', chip: 'bg-emerald-50 text-emerald-900 ring-emerald-200' }
} as const;

const EmergencyPage: React.FC<Props> = ({ navigateTo, language, setLanguage }) => {
  const [step, setStep] = useState<Step>('ask');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [recording, setRecording] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [orb, setOrb] = useState<'ai' | 'user' | 'thinking' | 'idle'>('idle');

  const [intake, setIntake] = useState<EmergencyIntake | null>(null);
  const [triageLevel, setTriageLevel] = useState<'RED' | 'ORANGE' | 'YELLOW' | 'GREEN'>('YELLOW');
  const [triageLabel, setTriageLabel] = useState('');
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [queuePosition, setQueuePosition] = useState(0);

  const [question, setQuestion] = useState<EssentialQuestion | null>(null);
  const [answered, setAnswered] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [triageNotice, setTriageNotice] = useState('');

  const recorderRef = useRef<Recorder | null>(null);
  const meterStopRef = useRef<(() => void) | null>(null);

  const copy = getCopy(language);
  const prompt = language === 'en-IN' ? 'Please tell me what happened.' : 'कृपया बताइए क्या हुआ है।';
  const style = TRIAGE_STYLE[triageLevel];

  useEffect(() => {
    return () => {
      stopSpeech();
      meterStopRef.current?.();
      recorderRef.current?.release();
    };
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text) return;
    try {
      setOrb('ai');
      const audio = await api.speak(text, language);
      await playChunks(audio.audios, audio.format);
    } catch {
      return;
    } finally {
      setOrb('idle');
    }
  }, [language]);

  const play = useCallback(async (audio: { audios: string[]; format: string } | null | undefined) => {
    if (!audio?.audios?.length) return;
    setOrb('ai');
    await playChunks(audio.audios, audio.format);
    setOrb('idle');
  }, []);

  useEffect(() => {
    speak(prompt);
  }, []);

  const beginRecording = async () => {
    stopSpeech();
    setError('');
    try {
      const recorder = new Recorder();
      await recorder.start();
      recorderRef.current = recorder;
      meterStopRef.current = await new LevelMeter().attach(setMicLevel);
      setRecording(true);
      setOrb('user');
    } catch {
      setError('Microphone not available. Please tell the staff at the desk.');
    }
  };

  const endRecording = async () => {
    if (!recorderRef.current) return null;
    setRecording(false);
    meterStopRef.current?.();
    meterStopRef.current = null;
    setMicLevel(0);
    const audio = await recorderRef.current.stop();
    recorderRef.current = null;
    return audio.durationOk ? audio : null;
  };

  const applyTriage = (level: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN', label: string, flags: string[], position: number) => {
    setTriageLevel(level);
    setTriageLabel(label);
    setRedFlags(flags);
    setQueuePosition(position);
  };

  const submitComplaint = async () => {
    const audio = await endRecording();
    if (!audio) {
      setError(copy.didNotHear);
      setOrb('idle');
      return;
    }

    setOrb('thinking');
    setStep('creating');
    setBusy(true);

    try {
      const created = await api.emergencyIntake({
        audio: audio.base64,
        mimeType: audio.mimeType,
        language
      });

      if (created.heardNothing) {
        setError(copy.didNotHear);
        setStep('ask');
        setBusy(false);
        setOrb('idle');
        return;
      }

      if (created.language && created.language !== language) setLanguage(created.language);

      setIntake(created);
      applyTriage(created.triageLevel, created.triageLabel, created.redFlags, created.queuePosition);
      setQuestion(created.essentialQuestions[0] || null);
      setTotalQuestions(created.essentialQuestions.length);
      setStep('token');
      await play(created.audio);
    } catch (e: any) {
      setError(e.message);
      setStep('ask');
    }

    setBusy(false);
    setOrb('idle');
  };

  const submitAnswer = async () => {
    if (!intake || !question) return;

    const audio = await endRecording();
    if (!audio) {
      setOrb('idle');
      return;
    }

    setOrb('thinking');
    setBusy(true);

    try {
      const result = await api.emergencyAnswer(intake.tokenNumber, {
        audio: audio.base64,
        mimeType: audio.mimeType,
        key: question.key,
        question: question.question
      });

      if (result.heardNothing) {
        setBusy(false);
        setOrb('idle');
        return;
      }

      setAnswers((prev) => [...prev, { question: question.question, answer: result.transcript }]);
      setAnswered(result.answered);
      setTotalQuestions(result.totalQuestions);
      applyTriage(result.triageLevel, result.triageLabel, result.redFlags, result.queuePosition);

      if (result.language && result.language !== language) setLanguage(result.language);

      if (result.triageChanged) {
        setTriageNotice(`Priority updated to ${result.triageLabel}${result.triageReason ? ` — ${result.triageReason}` : ''}`);
        setTimeout(() => setTriageNotice(''), 8000);
      }

      if (result.done || !result.nextQuestion) {
        setQuestion(null);
        setStep('complete');
      } else {
        setQuestion(result.nextQuestion);
        await play(result.audio);
      }
    } catch (e: any) {
      setError(e.message);
    }

    setBusy(false);
    setOrb('idle');
  };

  const skipQuestion = async () => {
    if (!intake || !question) return;
    const remaining = intake.essentialQuestions.filter(
      (q) => q.key !== question.key && !answers.some((a) => a.question === q.question)
    );
    const next = remaining[0] || null;
    setQuestion(next);
    if (!next) {
      setStep('complete');
      return;
    }
    await speak(next.question);
  };

  return (
    <Shell
      title={copy.emergencyTitle}
      subtitle={copy.govt}
      accent="red"
      language={languageLabel(language)}
      onBack={() => { stopSpeech(); navigateTo('home'); }}
      backLabel={copy.back}
    >
      {error && (
        <div className="mb-6">
          <Banner tone="danger" title={copy.errorTitle} body={error} />
        </div>
      )}

      {triageNotice && (
        <div className="mb-6">
          <Banner tone="warn" title={triageNotice} />
        </div>
      )}

      {intake && step !== 'token' && (
        <div className={`mb-6 rounded-2xl ${style.bg} text-white px-6 py-4 flex items-center justify-between gap-4`}>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70">{copy.tokenLabel}</p>
            <p className="text-2xl font-bold">{intake.tokenNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{triageLabel}</p>
            <p className="text-xs text-white/80">Queue #{queuePosition}</p>
          </div>
        </div>
      )}

      <Card className="p-9">
        {step === 'ask' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-slate-900 mb-3">{prompt}</h2>
            <p className="text-lg text-slate-500 mb-9">No ID, no registration, no form. Just speak.</p>

            <div className="flex flex-col items-center mb-9">
              <VoiceOrb mode={recording ? 'user' : orb} size={140} level={micLevel} />
              <p className="text-base text-slate-500 mt-4">{recording ? copy.listening : copy.tapToSpeak}</p>
            </div>

            <BigButton tone="danger" onClick={recording ? submitComplaint : beginRecording}>
              {recording ? `⏹ ${copy.tapToStop}` : `🎤 ${copy.tapToSpeak}`}
            </BigButton>

            <p className="mt-7 text-sm text-slate-400">
              Ambulance <b className="text-red-600">108</b> · Health Helpline <b className="text-slate-700">104</b>
            </p>
          </div>
        )}

        {step === 'creating' && (
          <div className="text-center py-16">
            <VoiceOrb mode="thinking" size={110} />
            <p className="mt-7 text-xl text-slate-700 font-semibold">Alerting the emergency team…</p>
          </div>
        )}

        {step === 'token' && intake && (
          <div className="text-center">
            <div className={`inline-block px-16 py-10 rounded-3xl ${style.bg} text-white mb-7`}>
              <p className="text-sm text-white/70 uppercase tracking-widest mb-2">{copy.tokenLabel}</p>
              <p className="text-7xl font-bold tracking-tight">{intake.tokenNumber}</p>
              <p className="text-white/85 mt-4 text-lg font-semibold">
                {triageLabel} · Queue #{queuePosition}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-7">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ring-1 ${style.chip}`}>
                {triageLevel} · seen within {intake.targetMinutes} min
              </span>
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                {intake.suspectedCategory}
              </span>
            </div>

            <div className="mb-7">
              <Banner
                tone={triageLevel === 'RED' || triageLevel === 'ORANGE' ? 'danger' : 'info'}
                title={intake.patientReassurance || 'The emergency team has your case.'}
                body="Please stay here. Staff will come to you. Identification can be done later."
              />
            </div>

            {redFlags.length > 0 && (
              <div className="text-left mb-7 p-5 rounded-2xl bg-red-50 ring-1 ring-red-200">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Flagged for the team</p>
                <ul className="space-y-1">
                  {redFlags.map((flag, i) => (
                    <li key={i} className="text-sm text-red-900">• {flag}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-slate-600 mb-6 text-lg">
              While you wait, {totalQuestions} quick questions will help the doctor.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BigButton tone="ghost" onClick={() => navigateTo('home')}>{copy.doneHome}</BigButton>
              <BigButton
                tone="danger"
                onClick={async () => {
                  setStep('questions');
                  if (question) await speak(question.question);
                }}
                disabled={!question}
              >
                Answer them now
              </BigButton>
            </div>
          </div>
        )}

        {step === 'questions' && question && (
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Question {answered + 1} of {totalQuestions}
            </p>
            <h2 className="text-3xl font-bold text-slate-900 mb-8 leading-relaxed min-h-[5rem]">
              {question.question}
            </h2>

            <div className="flex flex-col items-center mb-8">
              <VoiceOrb mode={recording ? 'user' : orb} size={120} level={micLevel} />
              <p className="text-base text-slate-500 mt-3">{recording ? copy.listening : copy.tapToSpeak}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <BigButton tone="ghost" onClick={skipQuestion} disabled={busy}>Skip</BigButton>
              <BigButton
                tone="danger"
                onClick={recording ? submitAnswer : beginRecording}
                disabled={busy && !recording}
                className="sm:col-span-2"
              >
                {recording ? `⏹ ${copy.tapToStop}` : `🎤 ${copy.tapToSpeak}`}
              </BigButton>
            </div>

            {answers.length > 0 && (
              <ul className="mt-8 text-left space-y-2">
                {answers.map((qa, i) => (
                  <li key={i} className="text-sm text-slate-500">
                    ✓ {qa.question} — <span className="text-slate-800">{qa.answer}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 'complete' && intake && (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-emerald-50 text-[#138808] flex items-center justify-center mx-auto mb-7 text-5xl">
              ✓
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything is with the emergency doctor</h2>
            <p className="text-lg text-slate-500 mb-8">Please stay near the emergency desk.</p>

            <div className="text-left mb-8 rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Sent to the team</p>
              <p className="mb-4">
                <b className="text-slate-500">What happened:</b> {intake.transcript}
              </p>
              {answers.length > 0 && (
                <ul className="space-y-3">
                  {answers.map((qa, i) => (
                    <li key={i}>
                      <p className="text-sm text-slate-500">{qa.question}</p>
                      <p className="text-slate-800">{qa.answer}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <BigButton onClick={() => navigateTo('home')}>{copy.doneHome}</BigButton>
          </div>
        )}
      </Card>
    </Shell>
  );
};

export default EmergencyPage;
