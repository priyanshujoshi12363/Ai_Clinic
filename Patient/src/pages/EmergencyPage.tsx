import React, { useEffect, useRef, useState } from 'react';
import { Shell, Card, VoiceOrb, Banner, BigButton } from '../components/ui';
import { getCopy, languageLabel } from '../i18n/strings';
import { api, type EmergencyIntake } from '../lib/api';
import { listenForSpeech, playChunks, playUrl, playKokoro, stopSpeech } from '../lib/media';

interface Props {
  navigateTo: (page: string) => void;
  language: string;
  setLanguage: (code: string) => void;
}

type OrbMode = 'ai' | 'user' | 'thinking' | 'idle';

const TRIAGE_STYLE = {
  RED: { bg: 'bg-red-600', text: 'text-red-600', chip: 'bg-red-50 text-red-800 ring-red-200' },
  ORANGE: { bg: 'bg-orange-500', text: 'text-orange-600', chip: 'bg-orange-50 text-orange-800 ring-orange-200' },
  YELLOW: { bg: 'bg-amber-500', text: 'text-amber-600', chip: 'bg-amber-50 text-amber-900 ring-amber-200' },
  GREEN: { bg: 'bg-[#138808]', text: 'text-[#138808]', chip: 'bg-emerald-50 text-emerald-900 ring-emerald-200' }
} as const;

const EmergencyPage: React.FC<Props> = ({ navigateTo, language, setLanguage }) => {
  const [orbMode, setOrbMode] = useState<OrbMode>('thinking');
  const [micLevel, setMicLevel] = useState(0);
  const [caption, setCaption] = useState('');
  const [statusLine, setStatusLine] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [intake, setIntake] = useState<EmergencyIntake | null>(null);
  const [patientName, setPatientName] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [showDone, setShowDone] = useState(false);

  const langRef = useRef(language);
  const cancelledRef = useRef(false);
  const startedRef = useRef(false);
  const manifestRef = useRef<Record<string, string[]>>({});
  const promptsRef = useRef<Record<string, Record<string, string>>>({});
  const repeatRef = useRef<(() => void) | null>(null);

  const c = getCopy(language);

  useEffect(() => { langRef.current = language; }, [language]);

  const localPrompt = (key?: string) => {
    if (!key) return null;
    const short = langRef.current.split('-')[0];
    return manifestRef.current[short]?.includes(key) ? `/voice/${short}/${key}.wav` : null;
  };
  const promptText = (key: string | undefined, fallback: string) => {
    if (!key) return fallback;
    const short = langRef.current.split('-')[0];
    return promptsRef.current[short]?.[key] || fallback;
  };

  const announce = async (text: string, key?: string) => {
    if (cancelledRef.current) return;
    const shown = promptText(key, text);
    setCaption(shown);
    setStatusLine(getCopy(langRef.current).speakingLabel);
    setOrbMode('ai');
    const url = localPrompt(key);
    if (url) { if (await playUrl(url)) { setOrbMode('idle'); return; } }
    try {
      const a = await api.speak(shown, langRef.current);
      await playChunks(a.audios, a.format);
    } catch {
      // Online voice down → offline Kokoro so emergency intake still talks.
      if (!cancelledRef.current) await playKokoro(shown, langRef.current);
    }
    setOrbMode('idle');
  };

  const playServer = async (audio: { audios: string[]; format: string } | null) => {
    if (!audio?.audios?.length) return;
    setOrbMode('ai');
    await playChunks(audio.audios, audio.format);
    setOrbMode('idle');
  };

  const listen = async (opts: { silenceMs?: number; maxMs?: number } = {}) => {
    if (cancelledRef.current) return null;
    setLiveTranscript('');
    setStatusLine(getCopy(langRef.current).listeningLabel);
    setOrbMode('user');
    setShowDone(true);
    const handle = listenForSpeech({
      onLevel: setMicLevel,
      silenceMs: opts.silenceMs ?? 1500,
      maxMs: opts.maxMs ?? 20000,
      startTimeoutMs: 12000
    });
    repeatRef.current = () => handle.stop();
    const res = await handle.result;
    repeatRef.current = null;
    setShowDone(false);
    setMicLevel(0);
    setOrbMode('thinking');
    setStatusLine(getCopy(langRef.current).processingLabel);
    return res;
  };

  const run = async () => {
    try {
      try {
        const [m, p] = await Promise.all([fetch('/voice/manifest.json'), fetch('/voice/prompts.json')]);
        if (m.ok) manifestRef.current = await m.json();
        if (p.ok) promptsRef.current = await p.json();
      } catch { /* optional */ }

      // Step 1 — what happened
      let created: EmergencyIntake | null = null;
      for (let attempt = 0; attempt < 3 && !created; attempt++) {
        await announce(getCopy(langRef.current).emWhat, attempt === 0 ? 'emWhat' : 'emDidNot');
        const heard = await listen({ silenceMs: 1600, maxMs: 20000 });
        if (cancelledRef.current) return;
        if (!heard) continue;
        setOrbMode('thinking');
        setStatusLine(getCopy(langRef.current).processingLabel);
        const res = await api.emergencyIntake({ audio: heard.base64, mimeType: heard.mimeType, language: langRef.current });
        if (res.heardNothing) continue;
        if ((res as any).language && (res as any).language !== langRef.current) {
          langRef.current = (res as any).language;
          setLanguage(langRef.current);
        }
        created = res;
      }

      if (!created) { leave(); return; }
      setIntake(created);
      setLiveTranscript(created.transcript || '');
      await playServer(created.audio); // spoken reassurance in their language

      // Step 2 — patient name
      let name = '';
      for (let attempt = 0; attempt < 2 && !name; attempt++) {
        await announce(getCopy(langRef.current).emName, 'emName');
        const heard = await listen({ silenceMs: 1300, maxMs: 9000 });
        if (cancelledRef.current) return;
        if (!heard) continue;
        const t = await api.transcribe(heard.base64, heard.mimeType).catch(() => null);
        name = (t?.transcript || '').trim();
      }

      if (name) {
        setPatientName(name);
        await api.emergencyIdentify(created.tokenNumber, { patientName: name }).catch(() => null);
      }

      // Step 3 — done, alert the doctor
      await announce(getCopy(langRef.current).emSent, 'emSent');
      setDone(true);
      setOrbMode('idle');
      setStatusLine('');
    } catch (e: any) {
      if (!cancelledRef.current) { setError(e?.message || 'Something went wrong'); setOrbMode('idle'); }
    }
  };

  const leave = () => {
    cancelledRef.current = true;
    stopSpeech();
    if (repeatRef.current) repeatRef.current();
    navigateTo('home');
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    cancelledRef.current = false;
    run();
    return () => { cancelledRef.current = true; stopSpeech(); if (repeatRef.current) repeatRef.current(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = intake ? TRIAGE_STYLE[intake.triageLevel] : TRIAGE_STYLE.RED;

  return (
    <Shell
      title={c.emergencyTitle}
      subtitle={c.govt}
      accent="red"
      language={languageLabel(language)}
      onBack={leave}
      backLabel={c.back}
    >
      {error && <div className="mb-6"><Banner tone="danger" title={c.errorTitle} body={error} /></div>}

      {intake && (
        <div className={`mb-6 rounded-2xl ${style.bg} text-white px-6 py-4 flex items-center justify-between`}>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70">{c.tokenLabel}</p>
            <p className="text-2xl font-bold">{intake.tokenNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{intake.triageLabel}</p>
            <p className="text-xs text-white/80">{intake.routedSpecialization || 'Emergency'}</p>
          </div>
        </div>
      )}

      <Card className="p-8">
        {!done ? (
          <div className="text-center">
            <div className="flex flex-col items-center mb-6">
              <VoiceOrb mode={orbMode} size={140} level={micLevel} />
              <p className="text-sm font-semibold text-slate-500 mt-4">{statusLine}</p>

              {showDone && (
                <>
                  <div className="mt-4 w-56 h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-red-600 transition-[width] duration-75"
                      style={{ width: `${Math.min(100, Math.round(micLevel * 140))}%` }} />
                  </div>
                  <button
                    onClick={() => repeatRef.current?.()}
                    className="mt-4 px-8 py-3 rounded-2xl bg-red-600 text-white font-bold text-base hover:bg-red-700 active:scale-[0.98] transition"
                  >
                    ✓ {c.tapRepeat === 'दोहराएँ' ? 'हो गया' : 'Done'}
                  </button>
                </>
              )}
            </div>

            {caption && (
              <p className="text-2xl md:text-3xl font-bold text-slate-900 leading-relaxed max-w-2xl mx-auto min-h-[4rem]">
                {caption}
              </p>
            )}
            {liveTranscript && <p className="mt-4 text-base text-slate-400">“{liveTranscript}”</p>}

            <p className="mt-8 text-sm text-slate-400">
              Ambulance <b className="text-red-600">108</b> · No ID or registration needed
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-emerald-50 text-[#138808] flex items-center justify-center mx-auto mb-7 text-5xl">✓</div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Sent to the emergency doctor</h2>
            <p className="text-lg text-slate-500 mb-8">Please stay here. The team is coming to you.</p>

            {intake && (
              <div className={`inline-block px-14 py-8 rounded-3xl ${style.bg} text-white mb-8`}>
                <p className="text-sm text-white/70 uppercase tracking-widest mb-2">{c.tokenLabel}</p>
                <p className="text-6xl font-bold tracking-tight">{intake.tokenNumber}</p>
                <p className="text-sm text-white/80 mt-3">{intake.triageLabel} · {intake.routedSpecialization}</p>
              </div>
            )}

            <div className="text-left max-w-lg mx-auto mb-8 rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Sent to the doctor</p>
              {patientName && <p className="mb-2"><b className="text-slate-500">Name:</b> {patientName}</p>}
              <p className="mb-2"><b className="text-slate-500">What happened:</b> {intake?.transcript}</p>
              {intake?.redFlags?.length ? (
                <p className="text-red-700 text-sm mt-2">⚠ {intake.redFlags.join(' · ')}</p>
              ) : null}
            </div>

            <BigButton onClick={() => navigateTo('home')}>{c.doneHome}</BigButton>
          </div>
        )}
      </Card>
    </Shell>
  );
};

export default EmergencyPage;
