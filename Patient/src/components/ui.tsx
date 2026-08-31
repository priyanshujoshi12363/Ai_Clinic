import React from 'react';

export const TricolorBar: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`w-full flex ${className || 'h-1.5'}`} aria-hidden>
    <div className="flex-1 bg-[#FF9933]" />
    <div className="flex-1 bg-white" />
    <div className="flex-1 bg-[#138808]" />
  </div>
);

export const Chakra: React.FC<{ className?: string; strokeWidth?: number }> = ({ className, strokeWidth = 1.5 }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden>
    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth={strokeWidth} />
    <circle cx="50" cy="50" r="4" fill="currentColor" />
    {Array.from({ length: 24 }).map((_, i) => {
      const rad = ((i * 360) / 24) * (Math.PI / 180);
      return (
        <line
          key={i}
          x1="50"
          y1="50"
          x2={50 + 46 * Math.sin(rad)}
          y2={50 - 46 * Math.cos(rad)}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
      );
    })}
  </svg>
);

export const Shell: React.FC<{
  title: string;
  subtitle?: string;
  accent?: 'green' | 'red' | 'slate';
  language?: string;
  online?: boolean;
  onBack?: () => void;
  backLabel?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, accent = 'slate', language, online = true, onBack, backLabel = 'Back', children }) => {
  const accentBar =
    accent === 'red' ? 'bg-red-600' : accent === 'green' ? 'bg-[#138808]' : 'bg-slate-900';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-56 -left-40 w-[620px] h-[620px] rounded-full bg-[#FF9933] opacity-[0.05] blur-3xl" />
        <div className="absolute -bottom-56 -right-40 w-[620px] h-[620px] rounded-full bg-[#138808] opacity-[0.05] blur-3xl" />
      </div>

      <div className={`w-full ${accentBar} text-white`}>
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/10 ring-1 ring-white/25 flex items-center justify-center shrink-0">
              <Chakra className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight truncate">{title}</h1>
              {subtitle && <p className="text-xs text-white/70 truncate">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            {language && (
              <span className="text-sm font-medium bg-white/10 ring-1 ring-white/20 rounded-full px-3 py-1">
                {language}
              </span>
            )}
            <span className="hidden sm:flex items-center gap-2 text-xs text-white/80">
              <span
                className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]' : 'bg-amber-400'}`}
              />
              {online ? 'Online' : 'Offline'}
            </span>
            {onBack && (
              <button
                onClick={onBack}
                className="text-sm text-white/85 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                ← {backLabel}
              </button>
            )}
          </div>
        </div>
      </div>
      <TricolorBar className="h-1" />

      <main className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-4xl">{children}</div>
      </main>

      <TricolorBar className="h-1.5" />
    </div>
  );
};

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_24px_rgba(15,23,42,0.06)] ${className}`}>
    {children}
  </div>
);

export const BigButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'ghost' | 'danger' | 'muted';
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, tone = 'primary', className = '', children }) => {
  const tones = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
    ghost: 'bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-400 focus-visible:ring-slate-400',
    muted: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400'
  } as const;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full min-h-[64px] px-8 rounded-2xl text-lg font-semibold transition-all outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
};

export const VoiceOrb: React.FC<{
  mode: 'ai' | 'user' | 'thinking' | 'idle';
  size?: number;
  level?: number;
}> = ({ mode, size = 132, level = 0 }) => {
  const active = mode !== 'idle';

  const palette =
    mode === 'ai'
      ? { core: '#0F172A', ring: 'rgba(15,23,42,0.16)', glow: 'rgba(15,23,42,0.34)' }
      : mode === 'user'
      ? { core: '#138808', ring: 'rgba(19,136,8,0.18)', glow: 'rgba(19,136,8,0.38)' }
      : mode === 'thinking'
      ? { core: '#FF9933', ring: 'rgba(255,153,51,0.20)', glow: 'rgba(255,153,51,0.40)' }
      : { core: '#CBD5E1', ring: 'rgba(203,213,225,0.2)', glow: 'rgba(203,213,225,0.2)' };

  const boost = 1 + Math.min(0.35, level * 0.5);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size * 2.1, height: size * 2.1 }}>
      <style>{`
        @keyframes orbRing { 0% { transform: scale(0.62); opacity: .5 } 100% { transform: scale(1.85); opacity: 0 } }
        @keyframes orbBreathe { 0%,100% { transform: scale(1) } 50% { transform: scale(1.05) } }
        @keyframes orbBar { 0%,100% { transform: scaleY(.25) } 50% { transform: scaleY(1) } }
        @keyframes orbSpin { to { transform: rotate(360deg) } }
      `}</style>

      {active &&
        [0, 0.6, 1.2].map((delay) => (
          <span
            key={delay}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              background: palette.ring,
              animation: `orbRing 1.9s ease-out infinite ${delay}s`
            }}
          />
        ))}

      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 34% 28%, ${palette.core}, ${palette.core}e0)`,
          boxShadow: active ? `0 0 56px ${palette.glow}` : '0 6px 18px rgba(15,23,42,0.10)',
          animation: active && mode !== 'thinking' ? 'orbBreathe 2.1s ease-in-out infinite' : 'none',
          transform: mode === 'user' ? `scale(${boost})` : undefined,
          transition: 'transform 120ms ease-out'
        }}
      >
        {mode === 'thinking' ? (
          <span
            className="rounded-full border-[3px] border-white/25 border-t-white"
            style={{ width: size * 0.34, height: size * 0.34, animation: 'orbSpin 0.9s linear infinite' }}
          />
        ) : active ? (
          <div className="flex items-end gap-[4px]" style={{ height: size * 0.3 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-[4px] rounded-full bg-white"
                style={{
                  height: '100%',
                  animation: `orbBar ${0.62 + i * 0.11}s ease-in-out infinite`,
                  animationDelay: `${i * 0.07}s`
                }}
              />
            ))}
          </div>
        ) : (
          <svg viewBox="0 0 24 24" style={{ width: size * 0.34, height: size * 0.34 }} className="text-white/70" fill="currentColor">
            <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z" />
            <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 1 0 2 0v-3.08A7 7 0 0 0 19 11z" />
          </svg>
        )}
      </div>
    </div>
  );
};

export const Stepper: React.FC<{ steps: string[]; active: number; tone?: 'green' | 'red' }> = ({
  steps,
  active,
  tone = 'green'
}) => {
  const on = tone === 'red' ? 'bg-red-600' : 'bg-[#138808]';
  const ring = tone === 'red' ? 'ring-red-100' : 'ring-emerald-100';

  return (
    <div className="flex items-center justify-center gap-1.5 mb-8 flex-wrap">
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < active
                  ? `${on} text-white`
                  : i === active
                  ? `${on} text-white ring-4 ${ring}`
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {i < active ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden md:inline ${i <= active ? 'text-slate-900' : 'text-slate-400'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-5 md:w-8 h-0.5 rounded-full ${i < active ? on : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export const ProgressBar: React.FC<{ percent: number; label?: string }> = ({ percent, label }) => (
  <div>
    {label && (
      <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
    )}
    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
      <div
        className="h-full rounded-full bg-[#138808] transition-all duration-500"
        style={{ width: `${Math.max(4, percent)}%` }}
      />
    </div>
  </div>
);

export const Banner: React.FC<{ tone: 'danger' | 'warn' | 'info'; title: string; body?: string }> = ({
  tone,
  title,
  body
}) => {
  const tones = {
    danger: 'bg-red-50 border-red-300 text-red-900',
    warn: 'bg-amber-50 border-amber-300 text-amber-900',
    info: 'bg-slate-50 border-slate-300 text-slate-800'
  } as const;

  return (
    <div className={`rounded-2xl border-2 px-5 py-4 ${tones[tone]}`} role="status">
      <p className="font-bold">{title}</p>
      {body && <p className="text-sm mt-1 opacity-90">{body}</p>}
    </div>
  );
};
