import React, { useState, useEffect } from 'react';
import { 
  FaAmbulance, 
  FaMicrophone, 
  FaUserMd, 
  FaPrescription, 
  FaClock, 
  FaArrowLeft,
  FaCheckCircle,
  FaSpinner,
  FaSearch,
  FaUserPlus,
  FaExclamationTriangle
} from 'react-icons/fa';

interface EmergencyPageProps {
  navigateTo: (page: string) => void;
}

type Step = 'abha' | 'fetching' | 'aadhaar' | 'manual' | 'listening' | 'processing' | 'summary' | 'queue';

// ── Voice Orb — call-style animated indicator ────────────────────────────
// mode: 'ai' (assistant speaking, slate/blue) | 'user' (patient speaking, red) | 'idle'
const VoiceOrb: React.FC<{ mode: 'ai' | 'user' | 'idle'; size?: number }> = ({ mode, size = 88 }) => {
  const isActive = mode !== 'idle';
  const palette =
    mode === 'ai'
      ? { core: '#0F172A', glow: 'rgba(15,23,42,0.35)', ring: 'rgba(15,23,42,0.15)' }
      : mode === 'user'
      ? { core: '#DC2626', glow: 'rgba(220,38,38,0.35)', ring: 'rgba(220,38,38,0.15)' }
      : { core: '#CBD5E1', glow: 'rgba(203,213,225,0.25)', ring: 'rgba(203,213,225,0.15)' };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size * 2.2, height: size * 2.2 }}>
      <style>{`
        @keyframes orbPulseRing {
          0% { transform: scale(0.6); opacity: 0.55; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes orbBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes voiceBar {
          0%, 100% { transform: scaleY(0.25); }
          50% { transform: scaleY(1); }
        }
      `}</style>

      {isActive && (
        <>
          <span
            className="absolute rounded-full"
            style={{ width: size, height: size, background: palette.ring, animation: 'orbPulseRing 1.8s ease-out infinite' }}
          />
          <span
            className="absolute rounded-full"
            style={{ width: size, height: size, background: palette.ring, animation: 'orbPulseRing 1.8s ease-out infinite 0.6s' }}
          />
          <span
            className="absolute rounded-full"
            style={{ width: size, height: size, background: palette.ring, animation: 'orbPulseRing 1.8s ease-out infinite 1.2s' }}
          />
        </>
      )}

      <div
        className="relative rounded-full flex items-center justify-center shadow-lg"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 35% 30%, ${palette.core}, ${palette.core}dd)`,
          boxShadow: isActive ? `0 0 40px ${palette.glow}` : '0 4px 12px rgba(0,0,0,0.08)',
          animation: isActive ? 'orbBreathe 2s ease-in-out infinite' : 'none',
        }}
      >
        {isActive ? (
          <div className="flex items-end gap-[3px]" style={{ height: size * 0.32 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-white"
                style={{
                  height: '100%',
                  animation: `voiceBar ${0.6 + i * 0.12}s ease-in-out infinite`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <FaMicrophone className="text-white/70" style={{ fontSize: size * 0.32 }} />
        )}
      </div>
    </div>
  );
};

const STEP_ORDER: Step[] = ['abha', 'fetching', 'aadhaar', 'manual', 'listening', 'processing', 'summary', 'queue'];
const STAGE_LABELS = ['Identify', 'Conversation', 'Summary', 'Queue'];
const stageForStep = (step: Step): number => {
  if (['abha', 'fetching', 'aadhaar', 'manual'].includes(step)) return 0;
  if (step === 'listening') return 1;
  if (['processing', 'summary'].includes(step)) return 2;
  return 3;
};

const ProgressStepper: React.FC<{ step: Step }> = ({ step }) => {
  const active = stageForStep(step);
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STAGE_LABELS.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                i < active ? 'bg-red-600 text-white' : i === active ? 'bg-red-600 text-white ring-4 ring-red-100' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i < active ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${i <= active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
          </div>
          {i < STAGE_LABELS.length - 1 && (
            <div className={`w-6 sm:w-10 h-0.5 rounded-full ${i < active ? 'bg-red-600' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const EmergencyPage: React.FC<EmergencyPageProps> = ({ navigateTo }) => {
  const [step, setStep] = useState<Step>('abha');
  const [abhaId, setAbhaId] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [prescription, setPrescription] = useState<any>(null);
  const [queuePosition, setQueuePosition] = useState(0);
  const [conversation, setConversation] = useState<Array<{ speaker: string; text: string }>>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [manualData, setManualData] = useState({ name: '', dob: '', gender: '', mobile: '', address: '' });

  const questions = [
    { id: 1, question: 'Patient ko kya hua hai?', key: 'chiefComplaint' },
    { id: 2, question: 'Kya patient ko saans lene mein takleef hai?', key: 'breathlessness' },
    { id: 3, question: 'Kya pain left arm mein ja raha hai?', key: 'radiation' },
    { id: 4, question: 'Kya patient ko paseena aa raha hai?', key: 'sweating' },
    { id: 5, question: 'Kya patient ko koi aur symptom hai?', key: 'otherSymptoms' },
  ];

  const startABHASearch = () => {
    setStep('abha');
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      const found = Math.random() > 0.3;
      if (found) {
        setAbhaId('ABHA-20260828-00123');
        setStep('fetching');
        fetchPatientData('ABHA-20260828-00123', 'abha');
      } else {
        setStep('aadhaar');
      }
    }, 3000);
  };

  const handleAadhaarSubmit = () => {
    if (aadhaarNumber.replace(/\s/g, '').length === 12) {
      setStep('fetching');
      const found = Math.random() > 0.3;
      if (found) {
        fetchPatientData(aadhaarNumber, 'aadhaar');
      } else {
        setStep('manual');
      }
    }
  };

  const handleManualSubmit = () => {
    if (manualData.name && manualData.dob && manualData.gender) {
      setPatientData({
        name: manualData.name,
        age: calculateAge(manualData.dob),
        dob: manualData.dob,
        gender: manualData.gender,
        mobile: manualData.mobile || 'Not provided',
        address: manualData.address || 'Not provided',
        conditions: [],
        allergies: [],
        medications: [],
        identificationMethod: 'manual',
        isNewPatient: true,
      });
      setStep('listening');
      startConversation();
    }
  };

  const calculateAge = (dob: string) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const fetchPatientData = async (id: string, method: string) => {
    setTimeout(() => {
      setPatientData({
        name: 'Rahul Sharma',
        age: 41,
        gender: 'Male',
        dob: '1985-06-14',
        mobile: '9876543210',
        address: 'Vadodara, Gujarat',
        conditions: ['Diabetes Type 2', 'Hypertension'],
        allergies: ['Penicillin'],
        medications: ['Metformin 500mg', 'Amlodipine 5mg'],
        identificationMethod: method,
        identificationId: id,
        isNewPatient: false,
      });
      setStep('listening');
      startConversation();
    }, 1500);
  };

  const startConversation = () => {
    setConversation([]);
    setQuestionIndex(0);
    askNextQuestion(0);
  };

  const askNextQuestion = (index: number) => {
    if (index < questions.length) {
      setAiSpeaking(true);
      setTimeout(() => {
        setConversation((prev) => [...prev, { speaker: 'AI', text: questions[index].question }]);
        setAiSpeaking(false);
      }, 1100);
    } else {
      generateSummary();
    }
  };

  const handleUserResponse = (response: string) => {
    if (response.trim()) {
      setConversation((prev) => [...prev, { speaker: 'Patient', text: response }]);
      const nextIndex = questionIndex + 1;
      setQuestionIndex(nextIndex);
      askNextQuestion(nextIndex);
    }
  };

  const generateSummary = () => {
    setStep('processing');
    setTimeout(() => {
      const historyInfo = patientData.isNewPatient
        ? 'No prior medical history available. New patient.'
        : `History: ${patientData.conditions.join(', ')}. Allergies: ${patientData.allergies.join(', ')}.`;

      setAiResponse(
        `Patient presents with chest pain radiating to left arm with breathlessness and sweating. ${historyInfo} Suspected cardiac event. Immediate ECG and Troponin test recommended.`
      );

      setPrescription({
        medications: [
          { name: 'Aspirin', dosage: '300mg', instructions: 'Chew and swallow immediately (if no allergy)' },
          { name: 'Nitroglycerin', dosage: '0.4mg', instructions: 'Sublingual every 5 minutes' },
        ],
        tests: ['ECG', 'Troponin I', 'Chest X-Ray'],
        urgency: 'EMERGENCY',
      });
      setQueuePosition(1);
      setStep('summary');
    }, 2000);
  };

  const sendToQueue = () => setStep('queue');

  const formatAadhaar = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})$/);
    if (match) return [match[1], match[2], match[3]].filter(Boolean).join(' ');
    return cleaned;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-red-100 opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-red-50 opacity-60 blur-3xl" />
      </div>

      {/* Header */}
      <div className="w-full bg-red-600 py-4 shadow-lg relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaAmbulance className="text-white text-3xl animate-pulse" />
            <span className="text-white font-bold text-xl tracking-tight">Emergency</span>
          </div>
          <button
            onClick={() => navigateTo('home')}
            className="text-white/80 hover:text-white text-sm transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <FaArrowLeft /> Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="max-w-4xl w-full">
          <ProgressStepper step={step} />

          <div className="bg-white rounded-3xl shadow-2xl shadow-red-900/5 border border-slate-100 p-8">
            {/* Step: ABHA */}
            {step === 'abha' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-black mb-1">Identify Patient</h2>
                <p className="text-slate-500 mb-8">Speak or enter the patient's ABHA ID</p>

                <div className="flex flex-col items-center mb-6">
                  <VoiceOrb mode={isListening ? 'user' : 'idle'} />
                  <p className="text-xs text-slate-400 mt-2">{isListening ? 'Listening…' : 'Tap to speak'}</p>
                </div>

                <div className="flex flex-col gap-4 max-w-md mx-auto">
                  <button
                    onClick={startABHASearch}
                    disabled={isListening}
                    className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-3 disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                  >
                    <FaMicrophone /> Speak ABHA ID
                  </button>

                  <div className="relative">
                    <input
                      type="text"
                      value={abhaId}
                      onChange={(e) => setAbhaId(e.target.value)}
                      placeholder="Or type ABHA ID"
                      className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-50 transition-all"
                    />
                    <button
                      onClick={() => {
                        if (abhaId.trim()) {
                          setStep('fetching');
                          fetchPatientData(abhaId, 'abha');
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                    >
                      Search
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-5">
                  If ABHA ID is not found, the system automatically asks for Aadhaar
                </p>
              </div>
            )}

            {/* Step: Aadhaar */}
            {step === 'aadhaar' && (
              <div>
                <div className="flex items-center gap-3 mb-5 bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <FaExclamationTriangle className="text-amber-600 text-xl shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">ABHA ID Not Found</p>
                    <p className="text-xs text-amber-700">Please enter Aadhaar number to identify the patient</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-black mb-1">Enter Aadhaar Number</h2>
                <p className="text-slate-500 mb-6">Enter the patient's 12-digit Aadhaar number</p>
                <input
                  type="text"
                  value={formatAadhaar(aadhaarNumber)}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  placeholder="XXXX XXXX XXXX"
                  className="w-full text-center text-2xl tracking-widest font-mono p-4 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-50 transition-all"
                  maxLength={14}
                />
                <button
                  onClick={handleAadhaarSubmit}
                  disabled={aadhaarNumber.replace(/\s/g, '').length !== 12}
                  className={`mt-6 w-full py-4 rounded-xl text-white font-bold text-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    aadhaarNumber.replace(/\s/g, '').length === 12
                      ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-600'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Fetch Patient Details
                </button>
                <p className="text-xs text-slate-400 mt-3 text-center">
                  If Aadhaar is not found, you can enter patient details manually
                </p>
              </div>
            )}

            {/* Step: Manual */}
            {step === 'manual' && (
              <div>
                <div className="flex items-center gap-3 mb-5 bg-red-50 p-4 rounded-xl border border-red-200">
                  <FaUserPlus className="text-red-600 text-xl shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Patient Not Found</p>
                    <p className="text-xs text-red-700">Please enter patient details manually</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-black mb-1">Patient Details</h2>
                <p className="text-slate-500 mb-6">Enter the patient's basic information</p>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={manualData.name}
                    onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-50 transition-all"
                  />
                  <input
                    type="date"
                    value={manualData.dob}
                    onChange={(e) => setManualData({ ...manualData, dob: e.target.value })}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-50 transition-all"
                  />
                  <select
                    value={manualData.gender}
                    onChange={(e) => setManualData({ ...manualData, gender: e.target.value })}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-50 transition-all"
                  >
                    <option value="">Select Gender *</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={manualData.mobile}
                    onChange={(e) => setManualData({ ...manualData, mobile: e.target.value })}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-50 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={manualData.address}
                    onChange={(e) => setManualData({ ...manualData, address: e.target.value })}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-50 transition-all"
                  />
                </div>

                <button
                  onClick={handleManualSubmit}
                  disabled={!manualData.name || !manualData.dob || !manualData.gender}
                  className={`mt-6 w-full py-4 rounded-xl text-white font-bold text-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    manualData.name && manualData.dob && manualData.gender
                      ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-600'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Continue with Manual Entry
                </button>
              </div>
            )}

            {/* Step: Fetching */}
            {step === 'fetching' && (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaSpinner className="text-slate-700 text-3xl animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-black mb-2">Searching Patient Records…</h2>
                <p className="text-slate-500">Retrieving medical history from ABHA/Aadhaar records</p>
                <div className="mt-5 w-full bg-slate-100 rounded-full h-1.5 max-w-xs mx-auto overflow-hidden">
                  <div className="bg-slate-800 h-1.5 rounded-full w-3/4 animate-pulse" />
                </div>
              </div>
            )}

            {/* Step: Listening & Conversation */}
            {step === 'listening' && patientData && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center ring-1 ring-red-100">
                      <FaUserMd className="text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-black">{patientData.name}</h3>
                      <p className="text-xs text-slate-500">
                        {patientData.isNewPatient ? 'New Patient' : patientData.identificationId}
                      </p>
                    </div>
                  </div>
                  {patientData.isNewPatient && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium">New Patient</span>
                  )}
                </div>

                {/* Live orb — shows who's "speaking" right now */}
                <div className="flex flex-col items-center py-4 mb-2">
                  <VoiceOrb mode={aiSpeaking ? 'ai' : isListening ? 'user' : 'idle'} />
                  <p className="text-xs font-medium text-slate-400 mt-2 tracking-wide uppercase">
                    {aiSpeaking ? 'AI asking…' : isListening ? 'Patient speaking…' : 'Tap mic to respond'}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 max-h-56 overflow-y-auto mb-5 space-y-2">
                  {conversation.map((msg, idx) => (
                    <div key={idx} className={msg.speaker === 'AI' ? 'text-left' : 'text-right'}>
                      <span
                        className={`inline-block px-4 py-2 rounded-2xl max-w-[80%] text-sm ${
                          msg.speaker === 'AI' ? 'bg-white text-black border border-slate-200' : 'bg-red-600 text-white'
                        }`}
                      >
                        {msg.text}
                      </span>
                    </div>
                  ))}
                  {conversation.length === 0 && !aiSpeaking && (
                    <p className="text-center text-sm text-slate-400 py-6">Conversation will appear here</p>
                  )}
                </div>

                {!isListening && !aiSpeaking && (
                  <button
                    onClick={() => {
                      setIsListening(true);
                      setTimeout(() => {
                        setIsListening(false);
                        const mockResponses = [
                          'Chest pain hai 3 ghante se',
                          'Haan, saans lene mein takleef hai',
                          'Haan, left arm mein ja raha hai',
                          'Haan, paseena aa raha hai',
                          'Nausea bhi hai',
                        ];
                        handleUserResponse(mockResponses[questionIndex] || '');
                      }, 2200);
                    }}
                    className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                  >
                    <FaMicrophone /> Speak Response
                  </button>
                )}
              </div>
            )}

            {/* Step: Processing */}
            {step === 'processing' && (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaSpinner className="text-emerald-600 text-3xl animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-black mb-2">Generating Emergency Summary…</h2>
                <p className="text-slate-500">AI is analyzing patient data and preparing a prescription</p>
              </div>
            )}

            {/* Step: Summary */}
            {step === 'summary' && patientData && (
              <div>
                <h2 className="text-2xl font-bold text-black mb-5 flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-600" /> Emergency Summary
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 mb-0.5">Patient</p>
                    <p className="font-semibold text-black">{patientData.name}</p>
                    <p className="text-sm text-slate-500">
                      {patientData.age} years, {patientData.gender}
                    </p>
                    {patientData.isNewPatient && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                        New Patient
                      </span>
                    )}
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 mb-0.5">Identification</p>
                    <p className="font-semibold text-sm text-black">
                      {patientData.identificationMethod === 'abha'
                        ? 'ABHA'
                        : patientData.identificationMethod === 'aadhaar'
                        ? 'Aadhaar'
                        : 'Manual'}
                    </p>
                    <p className="text-sm text-slate-500">{patientData.identificationId || 'Manual Entry'}</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-5">
                  <p className="text-sm text-red-700 font-semibold">AI Analysis</p>
                  <p className="text-sm text-slate-700 mt-1">{aiResponse}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                    <p className="text-sm text-blue-700 font-semibold">Medical History</p>
                    <div className="mt-2 space-y-1">
                      {patientData.conditions?.length > 0 ? (
                        patientData.conditions.map((c: string, i: number) => (
                          <p key={i} className="text-sm text-slate-600">• {c}</p>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No prior medical history</p>
                      )}
                      {patientData.allergies?.length > 0 && (
                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                          <FaExclamationTriangle className="text-xs" /> Allergy: {patientData.allergies.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                    <p className="text-sm text-emerald-700 font-semibold flex items-center gap-2">
                      <FaPrescription /> Prescription
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {prescription?.medications.map((med: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-700">{med.name}</span>
                          <span className="text-slate-500">{med.dosage}</span>
                        </div>
                      ))}
                      <div className="mt-2 text-xs text-slate-500">Tests: {prescription?.tests.join(', ')}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={sendToQueue}
                  className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                >
                  Send to Emergency Queue
                </button>
              </div>
            )}

            {/* Step: Queue */}
            {step === 'queue' && (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaClock className="text-emerald-600 text-3xl" />
                </div>
                <h2 className="text-2xl font-bold text-black mb-2">Sent to Emergency Queue</h2>
                <p className="text-slate-500 mb-5">Patient case has been sent to the emergency doctor queue</p>
                <div className="bg-slate-50 p-6 rounded-2xl max-w-sm mx-auto">
                  <p className="text-sm text-slate-400">Queue Position</p>
                  <p className="text-4xl font-bold text-red-600">#{queuePosition}</p>
                  <p className="text-xs text-slate-400 mt-2">Priority: HIGH</p>
                  {patientData?.isNewPatient && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center justify-center gap-1">
                      <FaExclamationTriangle /> New Patient — no prior records
                    </p>
                  )}
                </div>
                <button
                  onClick={() => navigateTo('home')}
                  className="mt-6 bg-slate-100 text-slate-700 px-8 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                >
                  ← Back to Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyPage;