import React, { useState, useEffect } from 'react';
import { FaStethoscope, FaShieldAlt } from 'react-icons/fa';
import { BsExclamationTriangleFill } from 'react-icons/bs';

interface HomepageProps {
  navigateTo: (page: string) => void;
}

interface Lang {
  code: string;
  name: string;
}

const languages: Lang[] = [
  { code: 'hi', name: 'हिन्दी' },
  { code: 'en', name: 'English' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'mr', name: 'मराठी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'অসমীয়া' },
  { code: 'ur', name: 'اردو' },
];

interface Copy {
  heading: string;
  subheading: string;
  consultTitle: string;
  consultDesc: string;
  consultCta: string;
  emergencyTitle: string;
  emergencyDesc: string;
  langLabel: string;
  secure: string;
  helpline: string;
  ambulance: string;
  splashSubtitle: string;
  splashDept: string;
}

const translations: Record<string, Copy> = {
  hi: {
    heading: 'हम आपकी क्या मदद करें?', subheading: 'नीचे एक विकल्प चुनें',
    consultTitle: 'स्वास्थ्य जाँच', consultDesc: 'अपनी बीमारी के बारे में डॉक्टर से बात करें', consultCta: 'नीचे एक विकल्प चुनें',
    emergencyTitle: 'आपातकाल', emergencyDesc: 'अभी तुरंत मदद पाएँ',
    langLabel: 'भाषा', secure: 'सुरक्षित · आधार-लिंक्ड · निःशुल्क',
    helpline: 'स्वास्थ्य हेल्पलाइन', ambulance: 'एम्बुलेंस',
    splashSubtitle: 'एआई-संचालित नैदानिक निर्णय समर्थन', splashDept: 'आयुष मंत्रालय · भारत सरकार',
  },
  en: {
    heading: 'How can we help you today?', subheading: 'Choose an option below',
    consultTitle: 'Health Check', consultDesc: 'Talk to a doctor about your health', consultCta: 'Choose an option below',
    emergencyTitle: 'Emergency', emergencyDesc: 'Get immediate help now',
    langLabel: 'Language', secure: 'Secure · Aadhaar-linked · Free',
    helpline: 'Health Helpline', ambulance: 'Ambulance',
    splashSubtitle: 'AI-Powered Clinical Decision Support', splashDept: 'Ministry of Ayush · Government of India',
  },
  gu: {
    heading: 'અમે તમારી શું મદદ કરીએ?', subheading: 'નીચે એક વિકલ્પ પસંદ કરો',
    consultTitle: 'સ્વાસ્થ્ય તપાસ', consultDesc: 'તમારી બીમારી વિશે ડોક્ટર સાથે વાત કરો', consultCta: 'નીચે એક વિકલ્પ પસંદ કરો',
    emergencyTitle: 'કટોકટી', emergencyDesc: 'હમણાં જ તાત્કાલિક મદદ મેળવો',
    langLabel: 'ભાષા', secure: 'સુરક્ષિત · આધાર-લિંક્ડ · મફત',
    helpline: 'સ્વાસ્થ્ય હેલ્પલાઇન', ambulance: 'એમ્બ્યુલન્સ',
    splashSubtitle: 'AI-સંચાલિત ક્લિનિકલ નિર્ણય સપોર્ટ', splashDept: 'આયુષ મંત્રાલય · ભારત સરકાર',
  },
  bn: {
    heading: 'আমরা আপনাকে কীভাবে সাহায্য করতে পারি?', subheading: 'নীচে একটি বিকল্প বেছে নিন',
    consultTitle: 'স্বাস্থ্য পরীক্ষা', consultDesc: 'আপনার অসুস্থতা সম্পর্কে ডাক্তারের সাথে কথা বলুন', consultCta: 'নীচে একটি বিকল্প বেছে নিন',
    emergencyTitle: 'জরুরি অবস্থা', emergencyDesc: 'এখনই তাৎক্ষণিক সাহায্য পান',
    langLabel: 'ভাষা', secure: 'নিরাপদ · আধার-লিঙ্কড · বিনামূল্যে',
    helpline: 'স্বাস্থ্য হেল্পলাইন', ambulance: 'অ্যাম্বুলেন্স',
    splashSubtitle: 'এআই-চালিত ক্লিনিকাল সিদ্ধান্ত সমর্থন', splashDept: 'আয়ুষ মন্ত্রণালয় · ভারত সরকার',
  },
  te: {
    heading: 'మేము మీకు ఎలా సహాయం చేయగలం?', subheading: 'క్రింద ఒక ఎంపికను ఎంచుకోండి',
    consultTitle: 'ఆరోగ్య పరీక్ష', consultDesc: 'మీ అనారోగ్యం గురించి డాక్టర్‌తో మాట్లాడండి', consultCta: 'క్రింద ఒక ఎంపికను ఎంచుకోండి',
    emergencyTitle: 'అత్యవసర', emergencyDesc: 'ఇప్పుడే తక్షణ సహాయం పొందండి',
    langLabel: 'భాష', secure: 'సురక్షితం · ఆధార్-లింక్డ్ · ఉచితం',
    helpline: 'ఆరోగ్య హెల్ప్‌లైన్', ambulance: 'అంబులెన్స్',
    splashSubtitle: 'AI-ఆధారిత క్లినికల్ నిర్ణయ మద్దతు', splashDept: 'ఆయుష్ మంత్రిత్వ శాఖ · భారత ప్రభుత్వం',
  },
  mr: {
    heading: 'आम्ही तुमची कशी मदत करू?', subheading: 'खाली एक पर्याय निवडा',
    consultTitle: 'आरोग्य तपासणी', consultDesc: 'तुमच्या आजाराबद्दल डॉक्टरांशी बोला', consultCta: 'खाली एक पर्याय निवडा',
    emergencyTitle: 'आणीबाणी', emergencyDesc: 'आत्ताच तात्काळ मदत मिळवा',
    langLabel: 'भाषा', secure: 'सुरक्षित · आधार-लिंक्ड · मोफत',
    helpline: 'आरोग्य हेल्पलाइन', ambulance: 'रुग्णवाहिका',
    splashSubtitle: 'एआय-चालित क्लिनिकल निर्णय समर्थन', splashDept: 'आयुष मंत्रालय · भारत सरकार',
  },
  ta: {
    heading: 'நாங்கள் உங்களுக்கு எப்படி உதவலாம்?', subheading: 'கீழே ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்',
    consultTitle: 'சுகாதார பரிசோதனை', consultDesc: 'உங்கள் நோய் குறித்து மருத்துவரிடம் பேசுங்கள்', consultCta: 'கீழே ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்',
    emergencyTitle: 'அவசரநிலை', emergencyDesc: 'இப்போதே உடனடி உதவி பெறுங்கள்',
    langLabel: 'மொழி', secure: 'பாதுகாப்பானது · ஆதார்-இணைக்கப்பட்டது · இலவசம்',
    helpline: 'சுகாதார உதவி எண்', ambulance: 'ஆம்புலன்ஸ்',
    splashSubtitle: 'AI-இயக்கப்படும் மருத்துவ முடிவு ஆதரவு', splashDept: 'ஆயுஷ் அமைச்சகம் · இந்திய அரசு',
  },
  kn: {
    heading: 'ನಾವು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?', subheading: 'ಕೆಳಗೆ ಒಂದು ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ',
    consultTitle: 'ಆರೋಗ್ಯ ತಪಾಸಣೆ', consultDesc: 'ನಿಮ್ಮ ಅನಾರೋಗ್ಯದ ಬಗ್ಗೆ ವೈದ್ಯರೊಂದಿಗೆ ಮಾತನಾಡಿ', consultCta: 'ಕೆಳಗೆ ಒಂದು ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ',
    emergencyTitle: 'ತುರ್ತು', emergencyDesc: 'ಈಗಲೇ ತಕ್ಷಣದ ಸಹಾಯ ಪಡೆಯಿರಿ',
    langLabel: 'ಭಾಷೆ', secure: 'ಸುರಕ್ಷಿತ · ಆಧಾರ್-ಲಿಂಕ್ಡ್ · ಉಚಿತ',
    helpline: 'ಆರೋಗ್ಯ ಸಹಾಯವಾಣಿ', ambulance: 'ಆಂಬ್ಯುಲೆನ್ಸ್',
    splashSubtitle: 'AI-ಚಾಲಿತ ಕ್ಲಿನಿಕಲ್ ನಿರ್ಧಾರ ಬೆಂಬಲ', splashDept: 'ಆಯುಷ್ ಸಚಿವಾಲಯ · ಭಾರತ ಸರ್ಕಾರ',
  },
  ml: {
    heading: 'ഞങ്ങൾ നിങ്ങളെ എങ്ങനെ സഹായിക്കും?', subheading: 'താഴെ ഒരു ഓപ്ഷൻ തിരഞ്ഞെടുക്കുക',
    consultTitle: 'ആരോഗ്യ പരിശോധന', consultDesc: 'നിങ്ങളുടെ അസുഖത്തെക്കുറിച്ച് ഡോക്ടറുമായി സംസാരിക്കുക', consultCta: 'താഴെ ഒരു ഓപ്ഷൻ തിരഞ്ഞെടുക്കുക',
    emergencyTitle: 'അടിയന്തരാവസ്ഥ', emergencyDesc: 'ഇപ്പോൾ തന്നെ അടിയന്തര സഹായം നേടുക',
    langLabel: 'ഭാഷ', secure: 'സുരക്ഷിതം · ആധാർ-ലിങ്ക്ഡ് · സൗജന്യം',
    helpline: 'ആരോഗ്യ ഹെൽപ്‌ലൈൻ', ambulance: 'ആംബുലൻസ്',
    splashSubtitle: 'AI-നിയന്ത്രിത ക്ലിനിക്കൽ തീരുമാന പിന്തുണ', splashDept: 'ആയുഷ് മന്ത്രാലയം · ഭാരത സർക്കാർ',
  },
  pa: {
    heading: 'ਅਸੀਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੇ ਹਾਂ?', subheading: 'ਹੇਠਾਂ ਇੱਕ ਵਿਕਲਪ ਚੁਣੋ',
    consultTitle: 'ਸਿਹਤ ਜਾਂਚ', consultDesc: 'ਆਪਣੀ ਬਿਮਾਰੀ ਬਾਰੇ ਡਾਕਟਰ ਨਾਲ ਗੱਲ ਕਰੋ', consultCta: 'ਹੇਠਾਂ ਇੱਕ ਵਿਕਲਪ ਚੁਣੋ',
    emergencyTitle: 'ਐਮਰਜੈਂਸੀ', emergencyDesc: 'ਹੁਣੇ ਤੁਰੰਤ ਮਦਦ ਲਵੋ',
    langLabel: 'ਭਾਸ਼ਾ', secure: 'ਸੁਰੱਖਿਅਤ · ਆਧਾਰ-ਲਿੰਕਡ · ਮੁਫ਼ਤ',
    helpline: 'ਸਿਹਤ ਹੈਲਪਲਾਈਨ', ambulance: 'ਐਂਬੂਲੈਂਸ',
    splashSubtitle: 'AI-ਸੰਚਾਲਿਤ ਕਲੀਨਿਕਲ ਫੈਸਲਾ ਸਹਾਇਤਾ', splashDept: 'ਆਯੁਸ਼ ਮੰਤਰਾਲਾ · ਭਾਰਤ ਸਰਕਾਰ',
  },
  or: {
    heading: 'ଆମେ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବୁ?', subheading: 'ତଳେ ଏକ ବିକଳ୍ପ ବାଛନ୍ତୁ',
    consultTitle: 'ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା', consultDesc: 'ଆପଣଙ୍କ ଅସୁସ୍ଥତା ବିଷୟରେ ଡାକ୍ତରଙ୍କ ସହ କଥାବାର୍ତ୍ତା କରନ୍ତୁ', consultCta: 'ତଳେ ଏକ ବିକଳ୍ପ ବାଛନ୍ତୁ',
    emergencyTitle: 'ଜରୁରୀ', emergencyDesc: 'ବର୍ତ୍ତମାନ ତୁରନ୍ତ ସାହାଯ୍ୟ ପାଆନ୍ତୁ',
    langLabel: 'ଭାଷା', secure: 'ସୁରକ୍ଷିତ · ଆଧାର-ଲିଙ୍କଡ୍ · ମାଗଣା',
    helpline: 'ସ୍ୱାସ୍ଥ୍ୟ ହେଲ୍ପଲାଇନ', ambulance: 'ଆମ୍ବୁଲାନ୍ସ',
    splashSubtitle: 'AI-ଚାଳିତ କ୍ଲିନିକାଲ୍ ନିଷ୍ପତ୍ତି ସମର୍ଥନ', splashDept: 'ଆୟୁଷ ମନ୍ତ୍ରଣାଳୟ · ଭାରତ ସରକାର',
  },
  as: {
    heading: 'আমি আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?', subheading: 'তলত এটা বিকল্প বাছনি কৰক',
    consultTitle: 'স্বাস্থ্য পৰীক্ষা', consultDesc: 'আপোনাৰ ৰোগৰ বিষয়ে চিকিৎসকৰ সৈতে কথা পাতক', consultCta: 'তলত এটা বিকল্প বাছনি কৰক',
    emergencyTitle: 'জৰুৰীকালীন', emergencyDesc: 'এতিয়াই তৎক্ষণাৎ সহায় লাভ কৰক',
    langLabel: 'ভাষা', secure: 'সুৰক্ষিত · আধাৰ-লিংক্ড · বিনামূলীয়া',
    helpline: 'স্বাস্থ্য হেল্পলাইন', ambulance: 'এম্বুলেন্স',
    splashSubtitle: 'AI-চালিত ক্লিনিকেল সিদ্ধান্ত সমৰ্থন', splashDept: 'আয়ুষ মন্ত্ৰালয় · ভাৰত চৰকাৰ',
  },
  ur: {
    heading: 'ہم آپ کی کیا مدد کر سکتے ہیں؟', subheading: 'نیچے ایک آپشن منتخب کریں',
    consultTitle: 'صحت کی جانچ', consultDesc: 'اپنی بیماری کے بارے میں ڈاکٹر سے بات کریں', consultCta: 'نیچے ایک آپشن منتخب کریں',
    emergencyTitle: 'ہنگامی', emergencyDesc: 'ابھی فوری مدد حاصل کریں',
    langLabel: 'زبان', secure: 'محفوظ · آدھار سے منسلک · مفت',
    helpline: 'ہیلتھ ہیلپ لائن', ambulance: 'ایمبولینس',
    splashSubtitle: 'AI سے چلنے والا کلینیکل فیصلہ سپورٹ', splashDept: 'وزارت آیوش · حکومت ہند',
  },
};

const getCopy = (code: string): Copy => translations[code] || translations.en;

const Chakra: React.FC<{ className?: string; strokeWidth?: number }> = ({ className, strokeWidth = 1.5 }) => {
  const spokes = Array.from({ length: 24 });
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="50" cy="50" r="4" fill="currentColor" />
      {spokes.map((_, i) => {
        const angle = (i * 360) / 24;
        const rad = (angle * Math.PI) / 180;
        const x2 = 50 + 46 * Math.sin(rad);
        const y2 = 50 - 46 * Math.cos(rad);
        return <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="currentColor" strokeWidth={strokeWidth} />;
      })}
    </svg>
  );
};

const TricolorBar: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`w-full flex ${className || ''}`}>
    <div className="flex-1 bg-[#FF9933]" />
    <div className="flex-1 bg-white" />
    <div className="flex-1 bg-[#138808]" />
  </div>
);

const SplashScreen: React.FC = () => {
  const copy = getCopy('hi');
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F1D]">
      <TricolorBar className="h-1.5" />
      <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute w-[520px] h-[520px] rounded-full bg-white opacity-[0.04] blur-3xl" />
        <div className="relative flex items-center justify-center">
          <span className="absolute w-40 h-40 rounded-full border border-white/10 animate-ping" style={{ animationDuration: '2.5s' }} />
          <span className="absolute w-32 h-32 rounded-full border border-white/20" />
          <Chakra className="w-28 h-28 text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.4)]" strokeWidth={1.2} />
        </div>
        <h1 className="mt-8 text-3xl font-bold text-white tracking-wide">AI Clinical</h1>
        <p className="mt-2 text-sm text-slate-400 font-medium">{copy.splashSubtitle}</p>
        <p className="text-xs text-slate-500 mt-1">{copy.splashDept}</p>
        <div className="mt-8 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FF9933] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-[#138808] animate-bounce" />
        </div>
      </div>
      <TricolorBar className="h-1.5" />
    </div>
  );
};

const Homepage: React.FC<HomepageProps> = ({ navigateTo }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [langIndex, setLangIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const copy = getCopy(languages[langIndex].code);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // Auto-rotate language every 5s with a soft crossfade
  useEffect(() => {
    if (showSplash) return;
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setLangIndex((prev) => (prev + 1) % languages.length);
        setIsFading(false);
      }, 250);
    }, 3000);
    return () => clearInterval(interval);
  }, [showSplash]);

  const selectLanguage = (index: number) => {
    setIsFading(true);
    setTimeout(() => {
      setLangIndex(index);
      setIsFading(false);
    }, 150);
  };

  if (showSplash) return <SplashScreen />;

  const fadeCls = `transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`;

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#FF9933] opacity-[0.06] blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#138808] opacity-[0.06] blur-3xl" />
      </div>

      {/* Status strip */}
      <div className="w-full bg-slate-900 text-white text-xs py-1.5 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className={fadeCls}>{copy.splashDept.split('·')[1]?.trim() || 'GOVERNMENT OF INDIA'}</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" /> Online
            </span>
            <span className="text-slate-600">|</span>
            <span>{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
      <TricolorBar className="h-1" />

      {/* Header */}
      <div className="w-full bg-white/90 backdrop-blur-sm border-b border-slate-200 py-4 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-900 ring-4 ring-slate-100 flex items-center justify-center">
              <Chakra className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <div className={fadeCls}>
              <h2 className="text-lg font-bold text-black leading-tight">AI Clinical</h2>
              <p className="text-xs text-slate-500">{copy.splashDept}</p>
            </div>
          </div>
          <FaShieldAlt className="text-[#138808] text-lg" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-14 relative z-10">
        <div className="max-w-3xl w-full">
          <div className={`text-center mb-10 ${fadeCls}`}>
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">{copy.heading}</h1>
            <p className="text-slate-500">{copy.subheading}</p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${fadeCls}`}>
            <button
              onClick={() => navigateTo('consultation')}
              className="group text-left bg-white rounded-2xl p-7 shadow-sm hover:shadow-xl transition-all duration-300 border-t-4 border-[#138808] border-x border-b border-slate-200 outline-none ring-0 hover:ring-2 hover:ring-[#138808]/30 focus-visible:ring-2 focus-visible:ring-[#138808] focus-visible:ring-offset-2 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-5 group-hover:ring-emerald-300 transition-all duration-300">
                <FaStethoscope className="text-[#138808] text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-black mb-1.5">{copy.consultTitle}</h3>
              <p className="text-sm text-slate-500 mb-4">{copy.consultDesc}</p>
              <span className="text-sm font-semibold text-[#138808] flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                {copy.consultCta} →
              </span>
            </button>

            <button
              onClick={() => navigateTo('emergency')}
              className="group text-left bg-white rounded-2xl p-7 shadow-sm hover:shadow-xl transition-all duration-300 border-t-4 border-red-600 border-x border-b border-slate-200 outline-none hover:ring-2 hover:ring-red-300 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-red-50 ring-1 ring-red-100 flex items-center justify-center mb-5 group-hover:ring-red-300 transition-all duration-300">
                <BsExclamationTriangleFill className="text-red-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-red-600 mb-1.5">{copy.emergencyTitle}</h3>
              <p className="text-sm text-slate-500 mb-4">{copy.emergencyDesc}</p>
              <span className="text-sm font-bold text-red-600">108 →</span>
            </button>
          </div>

          {/* Language selector — auto-rotates every 5s, click to jump directly */}
          <div className="mt-10 text-center">
            <p className={`text-[11px] font-semibold text-slate-400 tracking-widest uppercase mb-3 ${fadeCls}`}>{copy.langLabel}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {languages.map((l, i) => (
                <button
                  key={l.code}
                  onClick={() => selectLanguage(i)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900 ${
                    langIndex === i
                      ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900 ring-offset-2 shadow-md'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:shadow-sm'
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10">
        <div className={`max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-500 ${fadeCls}`}>
          <span>{copy.secure}</span>
          <span>
            {copy.helpline} <b className="text-black">104</b> &nbsp;·&nbsp; {copy.ambulance} <b className="text-red-600">108</b>
          </span>
        </div>
        <TricolorBar className="h-1.5" />
      </div>
    </div>
  );
};

export default Homepage;