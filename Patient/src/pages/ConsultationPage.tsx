import React, { useState } from 'react';
import { 
  FaStethoscope, 
  FaUserMd, 
  FaMicrophone, 
  FaFileMedical, 
  FaClock, 
  FaArrowLeft,
  FaCheckCircle,
  FaSpinner,
  FaCalendarAlt,
  FaHospital,
  FaUserCircle,
  FaPrescription,
  FaClipboardList,
  FaNotesMedical
} from 'react-icons/fa';

interface ConsultationPageProps {
  navigateTo: (page: string) => void;
}

const ConsultationPage: React.FC<ConsultationPageProps> = ({ navigateTo }) => {
  const [step, setStep] = useState<'start' | 'abha' | 'symptoms' | 'processing' | 'summary'>('start');
  const [abhaId, setAbhaId] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [patientData, setPatientData] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [aiResponse, setAiResponse] = useState('');

  const commonSymptoms = [
    'Headache', 'Fever', 'Cough', 'Cold', 'Body Pain', 'Fatigue',
    'Chest Pain', 'Shortness of Breath', 'Nausea', 'Vomiting',
    'Diarrhea', 'Constipation', 'Stomach Pain', 'Joint Pain',
    'Sore Throat', 'Runny Nose', 'Sneezing', 'Dizziness',
    'Back Pain', 'Muscle Pain', 'Loss of Appetite'
  ];

  const handleABHASearch = () => {
    if (abhaId.trim()) {
      setStep('symptoms');
      setPatientData({
        name: 'Rahul Sharma',
        age: 41,
        gender: 'Male',
        abhaId: abhaId,
        lastVisit: '2026-06-15',
        conditions: ['Diabetes Type 2', 'Hypertension'],
        allergies: ['Penicillin'],
        medications: ['Metformin 500mg', 'Amlodipine 5mg']
      });
    }
  };

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleVoiceInput = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setSymptoms('I have been having chest pain for the past 3 days');
    }, 3000);
  };

  const handleProceed = () => {
    if (selectedSymptoms.length > 0 || symptoms.trim()) {
      setStep('processing');
      generateAIResponse();
    }
  };

  const generateAIResponse = () => {
    setTimeout(() => {
      const summary = selectedSymptoms.join(', ');
      setAiResponse(`Patient presents with ${summary}. Based on patient history (Diabetes Type 2, Hypertension) and current symptoms, it may require further evaluation. Recommended: Blood Pressure check, ECG, and consultation with specialist.`);
      setStep('summary');
    }, 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="w-full bg-blue-700 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaStethoscope className="text-white text-3xl" />
            <span className="text-white font-bold text-xl">Consultation</span>
          </div>
          <button
            onClick={() => navigateTo('home')}
            className="text-white/70 hover:text-white text-sm transition-colors flex items-center gap-2"
          >
            <FaArrowLeft /> Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8">
          
          {/* Step: Start */}
          {step === 'start' && (
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUserMd className="text-blue-600 text-4xl" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Start New Consultation
              </h2>
              <p className="text-slate-500 mb-8">
                Enter the patient's ABHA ID to begin
              </p>

              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value)}
                  placeholder="Enter ABHA ID"
                  className="w-full p-4 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none text-center"
                />
                <button
                  onClick={handleABHASearch}
                  disabled={!abhaId.trim()}
                  className={`mt-4 w-full py-4 rounded-xl text-white font-bold text-lg transition-all ${
                    abhaId.trim()
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-4">
                For demo: Enter any ABHA ID
              </p>
            </div>
          )}

          {/* Step: Symptoms */}
          {step === 'symptoms' && patientData && (
            <div>
              {/* Patient Summary */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-4">
                  <FaUserCircle className="text-blue-600 text-4xl" />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{patientData.name}</h3>
                    <p className="text-sm text-slate-500">{patientData.age} years, {patientData.gender}</p>
                    <p className="text-sm text-slate-500">ABHA: {patientData.abhaId}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {patientData.conditions.map((c: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          {c}
                        </span>
                      ))}
                      {patientData.allergies.map((a: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                          Allergy: {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Last Visit</p>
                    <p className="text-sm font-medium">{patientData.lastVisit}</p>
                  </div>
                </div>
              </div>

              {/* Symptoms Selection */}
              <h3 className="text-lg font-bold text-slate-800 mb-3">
                Select Patient Symptoms
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {commonSymptoms.map((symptom, index) => (
                  <button
                    key={index}
                    onClick={() => handleSymptomToggle(symptom)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedSymptoms.includes(symptom)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>

              {/* Voice Input */}
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Or describe symptoms here..."
                      className="w-full p-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleVoiceInput}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FaMicrophone /> Speak
                  </button>
                </div>
                {isListening && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                    <FaSpinner className="animate-spin" /> Listening...
                  </div>
                )}
              </div>

              <button
                onClick={handleProceed}
                disabled={selectedSymptoms.length === 0 && !symptoms.trim()}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all ${
                  selectedSymptoms.length > 0 || symptoms.trim()
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Generate Summary
              </button>
            </div>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaSpinner className="text-blue-600 text-4xl animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Analyzing Symptoms...
              </h2>
              <p className="text-slate-500">
                AI is generating consultation summary
              </p>
              <div className="mt-4 w-full bg-slate-200 rounded-full h-2 max-w-xs mx-auto">
                <div className="bg-blue-600 h-2 rounded-full w-3/4 animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Step: Summary */}
          {step === 'summary' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-green-600" /> Consultation Summary
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl text-center">
                  <FaClock className="text-blue-600 text-xl mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Consultation</p>
                  <p className="text-sm font-medium text-slate-800">General OPD</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-center">
                  <FaCalendarAlt className="text-blue-600 text-xl mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Date</p>
                  <p className="text-sm font-medium text-slate-800">{new Date().toLocaleDateString('en-IN')}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-center">
                  <FaHospital className="text-blue-600 text-xl mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Department</p>
                  <p className="text-sm font-medium text-slate-800">General Medicine</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
                <p className="text-sm text-blue-700 font-medium">AI Analysis:</p>
                <p className="text-sm text-slate-700 mt-1">{aiResponse}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                  <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                    <FaPrescription /> Suggestions
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    <li>• Blood Pressure check</li>
                    <li>• ECG test</li>
                    <li>• Specialist consultation</li>
                  </ul>
                </div>
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                  <p className="text-sm text-purple-700 font-medium flex items-center gap-2">
                    <FaClipboardList /> Follow-up
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    <li>• Follow-up in 7 days</li>
                    <li>• Monitor symptoms</li>
                    <li>• Report if worsens</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('symptoms')}
                  className="flex-1 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => navigateTo('home')}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Finish
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-white border-t border-slate-200 py-3">
        <div className="max-w-7xl mx-auto px-6 flex justify-between text-xs text-slate-400">
          <span>Mock Consultation • For Demo Only</span>
          <span>Powered by AI Clinical</span>
        </div>
      </div>
    </div>
  );
};

export default ConsultationPage;