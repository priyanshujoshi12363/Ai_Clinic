import React, { useEffect, useState } from 'react';
import { Chakra, TricolorBar } from './ui';
import { LANGUAGES, getCopy } from '../i18n/strings';
import { api, isRemoteBackend } from '../lib/api';

interface HomepageProps {
  navigateTo: (page: string) => void;
  language: string;
  setLanguage: (code: string) => void;
}

const SplashScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-[#0B0F1D]">
    <TricolorBar className="h-1.5" />
    <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute w-[560px] h-[560px] rounded-full bg-white opacity-[0.04] blur-3xl" />
      <div className="relative flex items-center justify-center">
        <span className="absolute w-44 h-44 rounded-full border border-white/10 animate-ping" style={{ animationDuration: '2.4s' }} />
        <span className="absolute w-36 h-36 rounded-full border border-white/20" />
        <Chakra className="w-28 h-28 text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.4)]" strokeWidth={1.2} />
      </div>
      <h1 className="mt-10 text-4xl font-bold text-white tracking-wide">AI Clinical</h1>
      <p className="mt-3 text-sm text-slate-400 font-medium">Patient speaks · AI organises · Doctor decides</p>
      <p className="text-xs text-slate-500 mt-1">Ministry of Ayush · Government of India</p>
      <div className="mt-10 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#FF9933] animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-[#138808] animate-bounce" />
      </div>
    </div>
    <TricolorBar className="h-1.5" />
  </div>
);

const StethoscopeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3v6a5 5 0 0 0 10 0V3" />
    <path d="M4 3h3M15 3h3" />
    <path d="M11 14v2a5 5 0 0 0 10 0v-2" />
    <circle cx="21" cy="12" r="2" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const Homepage: React.FC<HomepageProps> = ({ navigateTo, language, setLanguage }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [userPicked, setUserPicked] = useState(false);
  const [online, setOnline] = useState(true);
  const [waking, setWaking] = useState(isRemoteBackend);
  const [now, setNow] = useState(new Date());

  const displayLanguage = userPicked ? language : LANGUAGES[cycleIndex].code;
  const copy = getCopy(displayLanguage);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const health = await api.pipelineHealth();
        if (!cancelled) setOnline(health.readyForVoiceIntake);
      } catch {
        if (!cancelled) setOnline(false);
      }
    };

    const boot = async () => {
      if (isRemoteBackend) {
        const awake = await api.wake();
        if (cancelled) return;
        setWaking(false);
        if (!awake) {
          setOnline(false);
          return;
        }
      }
      await check();
    };

    boot();
    const poll = setInterval(check, 60000);

    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    if (showSplash || userPicked) return;
    const rotate = setInterval(() => setCycleIndex((i) => (i + 1) % LANGUAGES.length), 2800);
    return () => clearInterval(rotate);
  }, [showSplash, userPicked]);

  const pick = (code: string) => {
    setUserPicked(true);
    setLanguage(code);
  };

  if (showSplash) return <SplashScreen />;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-52 -left-40 w-[620px] h-[620px] rounded-full bg-[#FF9933] opacity-[0.06] blur-3xl" />
        <div className="absolute -bottom-52 -right-40 w-[620px] h-[620px] rounded-full bg-[#138808] opacity-[0.06] blur-3xl" />
      </div>

      <div className="w-full bg-slate-900 text-white text-xs py-2 relative z-10">
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
          <span className="tracking-wide">{copy.govt}</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  waking ? 'bg-sky-400 animate-pulse' : online ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]' : 'bg-amber-400'
                }`}
              />
              {waking ? 'Connecting to server…' : online ? 'Online' : 'Server unreachable'}
            </span>
            <span className="text-slate-600">|</span>
            <span>{now.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
      <TricolorBar className="h-1" />

      <header className="w-full bg-white/80 backdrop-blur border-b border-slate-200 relative z-10">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-900 ring-4 ring-slate-100 flex items-center justify-center">
              <Chakra className="w-7 h-7 text-white" strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">{copy.appName}</h2>
              <p className="text-xs text-slate-500">{copy.tagline}</p>
            </div>
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-[#138808] bg-emerald-50 ring-1 ring-emerald-100 rounded-full px-3 py-1.5">
            {copy.secure}
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3 leading-tight">{copy.homeHeading}</h1>
            <p className="text-lg text-slate-500">{copy.homeSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            <button
              onClick={() => navigateTo('consultation')}
              className="group text-left bg-white rounded-3xl p-9 border border-slate-200 border-t-[6px] border-t-[#138808] shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-[#138808]/40 focus-visible:ring-offset-2"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 text-[#138808] flex items-center justify-center mb-6 group-hover:ring-emerald-300 transition-all">
                <StethoscopeIcon />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{copy.consultTitle}</h3>
              <p className="text-slate-500 mb-6 leading-relaxed">{copy.consultDesc}</p>
              <span className="inline-flex items-center gap-2 text-base font-bold text-[#138808] group-hover:gap-3 transition-all">
                {copy.consultCta} <span aria-hidden>→</span>
              </span>
            </button>

            <button
              onClick={() => navigateTo('emergency')}
              className="group text-left bg-white rounded-3xl p-9 border border-slate-200 border-t-[6px] border-t-red-600 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-red-500/40 focus-visible:ring-offset-2"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-50 ring-1 ring-red-100 text-red-600 flex items-center justify-center mb-6 group-hover:ring-red-300 transition-all">
                <AlertIcon />
              </div>
              <h3 className="text-2xl font-bold text-red-600 mb-2">{copy.emergencyTitle}</h3>
              <p className="text-slate-500 mb-6 leading-relaxed">{copy.emergencyDesc}</p>
              <span className="inline-flex items-center gap-2 text-base font-bold text-red-600 group-hover:gap-3 transition-all">
                {copy.emergencyCta} <span aria-hidden>→</span>
              </span>
            </button>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[11px] font-semibold text-slate-400 tracking-[0.2em] uppercase mb-4">{copy.langLabel}</p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {LANGUAGES.map((l) => {
                const selected = displayLanguage === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => pick(l.code)}
                    className={`px-5 py-2.5 rounded-full text-base font-medium border-2 transition-all outline-none focus-visible:ring-4 focus-visible:ring-slate-900/20 ${
                      selected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {l.name}
                  </button>
                );
              })}
            </div>
            {!userPicked && (
              <p className="text-xs text-slate-400 mt-4">
                Speak in any language — the system will detect it automatically
              </p>
            )}
          </div>
        </div>
      </main>

      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-slate-500">
          <span>{copy.secure}</span>
          <span>
            {copy.helpline} <b className="text-slate-900">104</b> &nbsp;·&nbsp; {copy.ambulance}{' '}
            <b className="text-red-600">108</b>
          </span>
        </div>
        <TricolorBar className="h-1.5" />
      </div>
    </div>
  );
};

export default Homepage;
