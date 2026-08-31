export interface Copy {
  appName: string;
  tagline: string;
  govt: string;

  homeHeading: string;
  homeSub: string;
  consultTitle: string;
  consultDesc: string;
  consultCta: string;
  emergencyTitle: string;
  emergencyDesc: string;
  emergencyCta: string;
  langLabel: string;
  secure: string;
  helpline: string;
  ambulance: string;

  consentTitle: string;
  consentBody: string;
  consentPoint1: string;
  consentPoint2: string;
  consentPoint3: string;
  consentAgree: string;
  consentListen: string;

  faceTitle: string;
  faceSub: string;
  faceCapture: string;
  faceScanning: string;
  faceNotFound: string;
  faceUseAbha: string;
  abhaPlaceholder: string;
  abhaContinue: string;
  cameraDenied: string;

  foundTitle: string;
  foundVisits: string;
  foundConditions: string;
  foundAllergies: string;
  foundMedicines: string;
  foundNone: string;
  notYou: string;
  continueBtn: string;

  modeTitle: string;
  modeSub: string;
  generalTitle: string;
  generalDesc: string;
  ayushTitle: string;
  ayushDesc: string;

  listening: string;
  tapToSpeak: string;
  tapToStop: string;
  thinking: string;
  understoodTitle: string;
  didNotHear: string;
  langSwitched: string;
  redFlagNotice: string;
  progressLabel: string;

  docsTitle: string;
  docsSub: string;
  docsHave: string;
  docsNone: string;
  docsCapture: string;
  docsScanning: string;
  docsExtracted: string;
  docsConfirm: string;
  docsAnother: string;
  docsDone: string;
  docsCheck: string;
  docsAdded: string;

  reviewTitle: string;
  reviewSub: string;
  reviewListen: string;
  reviewCorrect: string;
  reviewConfirm: string;
  reviewKeyPoints: string;
  reviewSummary: string;
  reviewDocs: string;
  correctPrompt: string;

  doneTitle: string;
  doneSub: string;
  tokenLabel: string;
  deptLabel: string;
  donePriority: string;
  doneHome: string;

  back: string;
  retry: string;
  errorTitle: string;
  loading: string;
  starting: string;
}

const en: Copy = {
  appName: 'AI Clinical',
  tagline: 'Patient speaks. AI organises. Doctor decides.',
  govt: 'Ministry of Ayush · Government of India',

  homeHeading: 'How can we help you today?',
  homeSub: 'Touch a box below, or just speak',
  consultTitle: 'See a Doctor',
  consultDesc: 'Tell us about your problem in your own language before you meet the doctor',
  consultCta: 'Start',
  emergencyTitle: 'Emergency',
  emergencyDesc: 'Serious problem right now — get help immediately',
  emergencyCta: 'Get help now',
  langLabel: 'Choose your language',
  secure: 'Secure · Consent based · Free',
  helpline: 'Health Helpline',
  ambulance: 'Ambulance',

  consentTitle: 'Your permission',
  consentBody: 'Before we begin, we need your permission.',
  consentPoint1: 'We will ask you questions about your health and record your answers.',
  consentPoint2: 'We will look at your old medical records if you show them to us.',
  consentPoint3: 'Only your doctor will see this information. You can stop at any time.',
  consentAgree: 'I agree, continue',
  consentListen: 'Listen again',

  faceTitle: 'Look at the camera',
  faceSub: 'We will find your health record. Please look straight ahead.',
  faceCapture: 'Take photo',
  faceScanning: 'Finding your record…',
  faceNotFound: 'We could not find you. Please enter your ABHA number instead.',
  faceUseAbha: 'Enter ABHA number',
  abhaPlaceholder: 'ABHA number',
  abhaContinue: 'Continue',
  cameraDenied: 'Camera not available. Please enter your ABHA number.',

  foundTitle: 'Welcome back',
  foundVisits: 'Previous visits',
  foundConditions: 'Known conditions',
  foundAllergies: 'Allergies',
  foundMedicines: 'Current medicines',
  foundNone: 'None recorded',
  notYou: 'This is not me',
  continueBtn: 'Yes, this is me',

  modeTitle: 'Which department do you want?',
  modeSub: 'Choose the type of treatment you have come for',
  generalTitle: 'General OPD',
  generalDesc: 'Normal medicine — fever, pain, blood pressure, sugar and other problems',
  ayushTitle: 'Ayurveda (AYUSH)',
  ayushDesc: 'Ayurvedic treatment — we will ask about your body, food and daily routine',

  listening: 'Listening…',
  tapToSpeak: 'Tap and speak your answer',
  tapToStop: 'Tap when you finish speaking',
  thinking: 'One moment…',
  understoodTitle: 'What we have written down',
  didNotHear: 'We could not hear you. Please try again.',
  langSwitched: 'We noticed your language and switched',
  redFlagNotice: 'We have told the emergency team. Please stay here.',
  progressLabel: 'Progress',

  docsTitle: 'Do you have old medical papers?',
  docsSub: 'Old prescriptions, blood test reports or hospital discharge papers',
  docsHave: 'Yes, I have papers',
  docsNone: 'No, I have none',
  docsCapture: 'Hold the paper in front of the camera',
  docsScanning: 'Reading your document…',
  docsExtracted: 'This is what we read',
  docsConfirm: 'Yes, this is correct',
  docsAnother: 'Add another paper',
  docsDone: 'I have shown all my papers',
  docsCheck: 'Please check this carefully',
  docsAdded: 'papers added',

  reviewTitle: 'Please check everything',
  reviewSub: 'Listen carefully. Tell us if anything is wrong.',
  reviewListen: 'Listen again',
  reviewCorrect: 'Something is wrong',
  reviewConfirm: 'Everything is correct',
  reviewKeyPoints: 'Main points for your doctor',
  reviewSummary: 'Full summary',
  reviewDocs: 'Your old records',
  correctPrompt: 'Tell us what is wrong',

  doneTitle: 'Done. Please wait for your turn.',
  doneSub: 'Your information has been sent to the doctor',
  tokenLabel: 'Your token number',
  deptLabel: 'Department',
  donePriority: 'You have been given priority. Please sit near the emergency desk.',
  doneHome: 'Finish',

  back: 'Back',
  retry: 'Try again',
  errorTitle: 'Something went wrong',
  loading: 'Please wait…',
  starting: 'Getting ready…'
};

const hi: Copy = {
  appName: 'एआई क्लिनिकल',
  tagline: 'मरीज़ बोलें · एआई व्यवस्थित करे · डॉक्टर तय करें',
  govt: 'आयुष मंत्रालय · भारत सरकार',

  homeHeading: 'हम आपकी क्या मदद करें?',
  homeSub: 'नीचे किसी डिब्बे को छुएँ, या बस बोलें',
  consultTitle: 'डॉक्टर को दिखाएँ',
  consultDesc: 'डॉक्टर से मिलने से पहले अपनी तकलीफ़ अपनी भाषा में बताइए',
  consultCta: 'शुरू करें',
  emergencyTitle: 'आपातकाल',
  emergencyDesc: 'अभी गंभीर तकलीफ़ है — तुरंत मदद पाएँ',
  emergencyCta: 'अभी मदद पाएँ',
  langLabel: 'अपनी भाषा चुनें',
  secure: 'सुरक्षित · अनुमति से · निःशुल्क',
  helpline: 'स्वास्थ्य हेल्पलाइन',
  ambulance: 'एम्बुलेंस',

  consentTitle: 'आपकी अनुमति',
  consentBody: 'शुरू करने से पहले हमें आपकी अनुमति चाहिए।',
  consentPoint1: 'हम आपसे आपकी सेहत के बारे में सवाल पूछेंगे और आपके जवाब लिखेंगे।',
  consentPoint2: 'अगर आप पुराने काग़ज़ दिखाएँगे तो हम उन्हें पढ़ेंगे।',
  consentPoint3: 'यह जानकारी सिर्फ़ आपके डॉक्टर को दिखेगी। आप कभी भी रोक सकते हैं।',
  consentAgree: 'मैं सहमत हूँ, आगे बढ़ें',
  consentListen: 'फिर से सुनें',

  faceTitle: 'कैमरे की ओर देखिए',
  faceSub: 'हम आपका रिकॉर्ड ढूँढ़ेंगे। सीधे सामने देखिए।',
  faceCapture: 'फ़ोटो लें',
  faceScanning: 'आपका रिकॉर्ड ढूँढ़ रहे हैं…',
  faceNotFound: 'हम आपको नहीं ढूँढ़ पाए। कृपया अपना आभा नंबर डालिए।',
  faceUseAbha: 'आभा नंबर डालें',
  abhaPlaceholder: 'आभा नंबर',
  abhaContinue: 'आगे बढ़ें',
  cameraDenied: 'कैमरा उपलब्ध नहीं है। कृपया आभा नंबर डालिए।',

  foundTitle: 'आपका स्वागत है',
  foundVisits: 'पिछली बार आना',
  foundConditions: 'पहले से बीमारियाँ',
  foundAllergies: 'एलर्जी',
  foundMedicines: 'चल रही दवाइयाँ',
  foundNone: 'कुछ दर्ज नहीं है',
  notYou: 'यह मैं नहीं हूँ',
  continueBtn: 'हाँ, यह मैं हूँ',

  modeTitle: 'आपको किस विभाग में दिखाना है?',
  modeSub: 'जिस इलाज के लिए आए हैं वह चुनिए',
  generalTitle: 'सामान्य ओपीडी',
  generalDesc: 'सामान्य दवा — बुखार, दर्द, बीपी, शुगर और दूसरी तकलीफ़ें',
  ayushTitle: 'आयुर्वेद (आयुष)',
  ayushDesc: 'आयुर्वेदिक इलाज — हम आपके शरीर, खान-पान और दिनचर्या के बारे में पूछेंगे',

  listening: 'सुन रहे हैं…',
  tapToSpeak: 'छूकर अपना जवाब बोलिए',
  tapToStop: 'बोलना पूरा होने पर छुएँ',
  thinking: 'एक पल…',
  understoodTitle: 'हमने यह लिखा है',
  didNotHear: 'हम सुन नहीं पाए। कृपया फिर बोलिए।',
  langSwitched: 'हमने आपकी भाषा पहचान ली और बदल दी',
  redFlagNotice: 'हमने आपातकालीन टीम को बता दिया है। यहीं रुकिए।',
  progressLabel: 'प्रगति',

  docsTitle: 'क्या आपके पास पुराने काग़ज़ हैं?',
  docsSub: 'पुरानी पर्ची, जाँच रिपोर्ट या अस्पताल के काग़ज़',
  docsHave: 'हाँ, मेरे पास हैं',
  docsNone: 'नहीं, मेरे पास नहीं हैं',
  docsCapture: 'काग़ज़ को कैमरे के सामने रखिए',
  docsScanning: 'आपका काग़ज़ पढ़ रहे हैं…',
  docsExtracted: 'हमने यह पढ़ा है',
  docsConfirm: 'हाँ, यह सही है',
  docsAnother: 'एक और काग़ज़ दिखाएँ',
  docsDone: 'मेरे सारे काग़ज़ दिखा दिए',
  docsCheck: 'कृपया इसे ध्यान से देखिए',
  docsAdded: 'काग़ज़ जुड़े',

  reviewTitle: 'कृपया सब जाँच लीजिए',
  reviewSub: 'ध्यान से सुनिए। कुछ ग़लत हो तो बताइए।',
  reviewListen: 'फिर से सुनें',
  reviewCorrect: 'कुछ ग़लत है',
  reviewConfirm: 'सब सही है',
  reviewKeyPoints: 'डॉक्टर के लिए मुख्य बातें',
  reviewSummary: 'पूरा विवरण',
  reviewDocs: 'आपके पुराने काग़ज़',
  correctPrompt: 'बताइए क्या ग़लत है',

  doneTitle: 'हो गया। अपनी बारी का इंतज़ार कीजिए।',
  doneSub: 'आपकी जानकारी डॉक्टर के पास भेज दी गई है',
  tokenLabel: 'आपका टोकन नंबर',
  deptLabel: 'विभाग',
  donePriority: 'आपको प्राथमिकता दी गई है। आपातकालीन डेस्क के पास बैठिए।',
  doneHome: 'समाप्त',

  back: 'पीछे',
  retry: 'फिर कोशिश करें',
  errorTitle: 'कुछ गड़बड़ हुई',
  loading: 'कृपया रुकिए…',
  starting: 'तैयार हो रहे हैं…'
};

const overrides: Record<string, Partial<Copy>> = {
  'bn-IN': {
    appName: 'এআই ক্লিনিক্যাল',
    tagline: 'রোগী বলেন · এআই সাজায় · ডাক্তার সিদ্ধান্ত নেন',
    govt: 'আয়ুষ মন্ত্রণালয় · ভারত সরকার',
    homeHeading: 'আমরা আপনাকে কীভাবে সাহায্য করব?',
    homeSub: 'নীচে একটি বাক্স স্পর্শ করুন, বা শুধু বলুন',
    consultTitle: 'ডাক্তার দেখান',
    consultDesc: 'ডাক্তারের সঙ্গে দেখা করার আগে নিজের ভাষায় সমস্যা বলুন',
    consultCta: 'শুরু করুন',
    emergencyTitle: 'জরুরি অবস্থা',
    emergencyDesc: 'এখনই গুরুতর সমস্যা — সঙ্গে সঙ্গে সাহায্য নিন',
    emergencyCta: 'এখনই সাহায্য নিন',
    langLabel: 'আপনার ভাষা বেছে নিন',
    secure: 'নিরাপদ · সম্মতি ভিত্তিক · বিনামূল্যে',
    helpline: 'স্বাস্থ্য হেল্পলাইন',
    ambulance: 'অ্যাম্বুলেন্স',
    consentTitle: 'আপনার অনুমতি',
    consentAgree: 'আমি রাজি, এগিয়ে যান',
    faceTitle: 'ক্যামেরার দিকে তাকান',
    faceCapture: 'ছবি তুলুন',
    modeTitle: 'আপনি কোন বিভাগে দেখাতে চান?',
    generalTitle: 'সাধারণ ওপিডি',
    ayushTitle: 'আয়ুর্বেদ (আয়ুষ)',
    listening: 'শুনছি…',
    tapToSpeak: 'স্পর্শ করে উত্তর বলুন',
    docsTitle: 'আপনার কি পুরনো কাগজ আছে?',
    docsHave: 'হ্যাঁ, আছে',
    docsNone: 'না, নেই',
    reviewTitle: 'সব দেখে নিন',
    reviewConfirm: 'সব ঠিক আছে',
    reviewCorrect: 'কিছু ভুল আছে',
    doneTitle: 'হয়ে গেছে। আপনার পালার জন্য অপেক্ষা করুন।',
    tokenLabel: 'আপনার টোকেন নম্বর',
    back: 'পিছনে'
  },
  'gu-IN': {
    appName: 'એઆઈ ક્લિનિકલ',
    tagline: 'દર્દી બોલે · એઆઈ ગોઠવે · ડૉક્ટર નક્કી કરે',
    govt: 'આયુષ મંત્રાલય · ભારત સરકાર',
    homeHeading: 'અમે તમારી શું મદદ કરીએ?',
    homeSub: 'નીચે એક બોક્સ સ્પર્શ કરો, અથવા બસ બોલો',
    consultTitle: 'ડૉક્ટરને બતાવો',
    consultDesc: 'ડૉક્ટરને મળતા પહેલાં તમારી તકલીફ તમારી ભાષામાં કહો',
    consultCta: 'શરૂ કરો',
    emergencyTitle: 'કટોકટી',
    emergencyDesc: 'અત્યારે ગંભીર તકલીફ છે — તરત મદદ મેળવો',
    emergencyCta: 'હમણાં મદદ મેળવો',
    langLabel: 'તમારી ભાષા પસંદ કરો',
    secure: 'સુરક્ષિત · સંમતિથી · મફત',
    helpline: 'આરોગ્ય હેલ્પલાઇન',
    ambulance: 'એમ્બ્યુલન્સ',
    consentTitle: 'તમારી પરવાનગી',
    consentAgree: 'હું સંમત છું, આગળ વધો',
    faceTitle: 'કેમેરા તરફ જુઓ',
    faceCapture: 'ફોટો લો',
    modeTitle: 'તમારે કયા વિભાગમાં બતાવવું છે?',
    generalTitle: 'સામાન્ય ઓપીડી',
    ayushTitle: 'આયુર્વેદ (આયુષ)',
    listening: 'સાંભળી રહ્યા છીએ…',
    tapToSpeak: 'સ્પર્શ કરીને જવાબ બોલો',
    docsTitle: 'શું તમારી પાસે જૂના કાગળો છે?',
    docsHave: 'હા, છે',
    docsNone: 'ના, નથી',
    reviewTitle: 'બધું તપાસી લો',
    reviewConfirm: 'બધું સાચું છે',
    reviewCorrect: 'કંઈક ખોટું છે',
    doneTitle: 'થઈ ગયું. તમારા વારાની રાહ જુઓ.',
    tokenLabel: 'તમારો ટોકન નંબર',
    back: 'પાછળ'
  },
  'mr-IN': {
    appName: 'एआय क्लिनिकल',
    tagline: 'रुग्ण बोलतो · एआय मांडते · डॉक्टर ठरवतात',
    govt: 'आयुष मंत्रालय · भारत सरकार',
    homeHeading: 'आम्ही तुमची कशी मदत करू?',
    homeSub: 'खाली एक चौकट स्पर्श करा, किंवा फक्त बोला',
    consultTitle: 'डॉक्टरांना दाखवा',
    consultDesc: 'डॉक्टरांना भेटण्यापूर्वी तुमची तक्रार तुमच्या भाषेत सांगा',
    consultCta: 'सुरू करा',
    emergencyTitle: 'आणीबाणी',
    emergencyDesc: 'आत्ता गंभीर त्रास आहे — लगेच मदत घ्या',
    emergencyCta: 'आत्ता मदत घ्या',
    langLabel: 'तुमची भाषा निवडा',
    secure: 'सुरक्षित · संमतीने · मोफत',
    helpline: 'आरोग्य हेल्पलाइन',
    ambulance: 'रुग्णवाहिका',
    consentTitle: 'तुमची परवानगी',
    consentAgree: 'मी सहमत आहे, पुढे चला',
    faceTitle: 'कॅमेऱ्याकडे बघा',
    faceCapture: 'फोटो घ्या',
    modeTitle: 'तुम्हाला कोणत्या विभागात दाखवायचे आहे?',
    generalTitle: 'सामान्य ओपीडी',
    ayushTitle: 'आयुर्वेद (आयुष)',
    listening: 'ऐकत आहोत…',
    tapToSpeak: 'स्पर्श करून उत्तर बोला',
    docsTitle: 'तुमच्याकडे जुने कागद आहेत का?',
    docsHave: 'होय, आहेत',
    docsNone: 'नाही, नाहीत',
    reviewTitle: 'सर्व तपासून घ्या',
    reviewConfirm: 'सर्व बरोबर आहे',
    reviewCorrect: 'काहीतरी चुकीचे आहे',
    doneTitle: 'झाले. तुमच्या वेळेची वाट पहा.',
    tokenLabel: 'तुमचा टोकन क्रमांक',
    back: 'मागे'
  },
  'ta-IN': {
    appName: 'ஏஐ கிளினிக்கல்',
    tagline: 'நோயாளி பேசுகிறார் · ஏஐ ஒழுங்குபடுத்துகிறது · மருத்துவர் முடிவு செய்கிறார்',
    govt: 'ஆயுஷ் அமைச்சகம் · இந்திய அரசு',
    homeHeading: 'நாங்கள் உங்களுக்கு எப்படி உதவலாம்?',
    homeSub: 'கீழே ஒரு பெட்டியைத் தொடுங்கள், அல்லது பேசுங்கள்',
    consultTitle: 'மருத்துவரைப் பாருங்கள்',
    consultDesc: 'மருத்துவரைச் சந்திக்கும் முன் உங்கள் பிரச்சினையை உங்கள் மொழியில் சொல்லுங்கள்',
    consultCta: 'தொடங்கு',
    emergencyTitle: 'அவசரநிலை',
    emergencyDesc: 'இப்போது கடுமையான பிரச்சினை — உடனே உதவி பெறுங்கள்',
    emergencyCta: 'இப்போதே உதவி',
    langLabel: 'உங்கள் மொழியைத் தேர்ந்தெடுங்கள்',
    secure: 'பாதுகாப்பானது · ஒப்புதலுடன் · இலவசம்',
    helpline: 'சுகாதார உதவி எண்',
    ambulance: 'ஆம்புலன்ஸ்',
    consentTitle: 'உங்கள் அனுமதி',
    consentAgree: 'நான் ஒப்புக்கொள்கிறேன், தொடரவும்',
    faceTitle: 'கேமராவைப் பாருங்கள்',
    faceCapture: 'படம் எடு',
    modeTitle: 'எந்தப் பிரிவில் பார்க்க வேண்டும்?',
    generalTitle: 'பொது ஓபிடி',
    ayushTitle: 'ஆயுர்வேதம் (ஆயுஷ்)',
    listening: 'கேட்கிறோம்…',
    tapToSpeak: 'தொட்டு பதில் சொல்லுங்கள்',
    docsTitle: 'உங்களிடம் பழைய ஆவணங்கள் உள்ளதா?',
    docsHave: 'ஆம், உள்ளது',
    docsNone: 'இல்லை',
    reviewTitle: 'எல்லாவற்றையும் சரிபார்க்கவும்',
    reviewConfirm: 'எல்லாம் சரி',
    reviewCorrect: 'ஏதோ தவறு',
    doneTitle: 'முடிந்தது. உங்கள் முறைக்குக் காத்திருங்கள்.',
    tokenLabel: 'உங்கள் டோக்கன் எண்',
    back: 'பின்'
  },
  'te-IN': {
    appName: 'ఏఐ క్లినికల్',
    tagline: 'రోగి మాట్లాడతారు · ఏఐ అమరుస్తుంది · డాక్టర్ నిర్ణయిస్తారు',
    govt: 'ఆయుష్ మంత్రిత్వ శాఖ · భారత ప్రభుత్వం',
    homeHeading: 'మేము మీకు ఎలా సహాయం చేయగలం?',
    homeSub: 'కింద ఒక పెట్టెను తాకండి, లేదా మాట్లాడండి',
    consultTitle: 'డాక్టర్‌ను చూడండి',
    consultDesc: 'డాక్టర్‌ను కలవడానికి ముందు మీ సమస్యను మీ భాషలో చెప్పండి',
    consultCta: 'ప్రారంభించు',
    emergencyTitle: 'అత్యవసరం',
    emergencyDesc: 'ఇప్పుడు తీవ్రమైన సమస్య — వెంటనే సహాయం పొందండి',
    emergencyCta: 'ఇప్పుడే సహాయం',
    langLabel: 'మీ భాషను ఎంచుకోండి',
    secure: 'సురక్షితం · అనుమతితో · ఉచితం',
    helpline: 'ఆరోగ్య హెల్ప్‌లైన్',
    ambulance: 'అంబులెన్స్',
    consentTitle: 'మీ అనుమతి',
    consentAgree: 'నేను అంగీకరిస్తున్నాను, కొనసాగండి',
    faceTitle: 'కెమెరా వైపు చూడండి',
    faceCapture: 'ఫోటో తీయండి',
    modeTitle: 'మీరు ఏ విభాగంలో చూపించాలి?',
    generalTitle: 'సాధారణ ఓపీడీ',
    ayushTitle: 'ఆయుర్వేదం (ఆయుష్)',
    listening: 'వింటున్నాము…',
    tapToSpeak: 'తాకి మీ సమాధానం చెప్పండి',
    docsTitle: 'మీ దగ్గర పాత కాగితాలు ఉన్నాయా?',
    docsHave: 'అవును, ఉన్నాయి',
    docsNone: 'లేదు',
    reviewTitle: 'అన్నీ తనిఖీ చేయండి',
    reviewConfirm: 'అంతా సరైనది',
    reviewCorrect: 'ఏదో తప్పు ఉంది',
    doneTitle: 'పూర్తయింది. మీ వంతు కోసం వేచి ఉండండి.',
    tokenLabel: 'మీ టోకెన్ నంబర్',
    back: 'వెనుకకు'
  },
  'kn-IN': {
    appName: 'ಎಐ ಕ್ಲಿನಿಕಲ್',
    tagline: 'ರೋಗಿ ಮಾತನಾಡುತ್ತಾರೆ · ಎಐ ಜೋಡಿಸುತ್ತದೆ · ವೈದ್ಯರು ನಿರ್ಧರಿಸುತ್ತಾರೆ',
    govt: 'ಆಯುಷ್ ಸಚಿವಾಲಯ · ಭಾರತ ಸರ್ಕಾರ',
    homeHeading: 'ನಾವು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
    homeSub: 'ಕೆಳಗೆ ಒಂದು ಪೆಟ್ಟಿಗೆಯನ್ನು ಸ್ಪರ್ಶಿಸಿ, ಅಥವಾ ಮಾತನಾಡಿ',
    consultTitle: 'ವೈದ್ಯರನ್ನು ನೋಡಿ',
    consultDesc: 'ವೈದ್ಯರನ್ನು ಭೇಟಿಯಾಗುವ ಮೊದಲು ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಹೇಳಿ',
    consultCta: 'ಪ್ರಾರಂಭಿಸಿ',
    emergencyTitle: 'ತುರ್ತು',
    emergencyDesc: 'ಈಗ ಗಂಭೀರ ಸಮಸ್ಯೆ — ತಕ್ಷಣ ಸಹಾಯ ಪಡೆಯಿರಿ',
    emergencyCta: 'ಈಗಲೇ ಸಹಾಯ',
    langLabel: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
    secure: 'ಸುರಕ್ಷಿತ · ಒಪ್ಪಿಗೆಯಿಂದ · ಉಚಿತ',
    helpline: 'ಆರೋಗ್ಯ ಸಹಾಯವಾಣಿ',
    ambulance: 'ಆಂಬ್ಯುಲೆನ್ಸ್',
    consentTitle: 'ನಿಮ್ಮ ಅನುಮತಿ',
    consentAgree: 'ನಾನು ಒಪ್ಪುತ್ತೇನೆ, ಮುಂದುವರಿಯಿರಿ',
    faceTitle: 'ಕ್ಯಾಮೆರಾ ಕಡೆ ನೋಡಿ',
    faceCapture: 'ಫೋಟೋ ತೆಗೆಯಿರಿ',
    modeTitle: 'ನೀವು ಯಾವ ವಿಭಾಗದಲ್ಲಿ ತೋರಿಸಬೇಕು?',
    generalTitle: 'ಸಾಮಾನ್ಯ ಒಪಿಡಿ',
    ayushTitle: 'ಆಯುರ್ವೇದ (ಆಯುಷ್)',
    listening: 'ಕೇಳುತ್ತಿದ್ದೇವೆ…',
    tapToSpeak: 'ಸ್ಪರ್ಶಿಸಿ ಉತ್ತರ ಹೇಳಿ',
    docsTitle: 'ನಿಮ್ಮ ಬಳಿ ಹಳೆಯ ಕಾಗದಗಳಿವೆಯೇ?',
    docsHave: 'ಹೌದು, ಇವೆ',
    docsNone: 'ಇಲ್ಲ',
    reviewTitle: 'ಎಲ್ಲವನ್ನೂ ಪರಿಶೀಲಿಸಿ',
    reviewConfirm: 'ಎಲ್ಲವೂ ಸರಿ',
    reviewCorrect: 'ಏನೋ ತಪ್ಪಿದೆ',
    doneTitle: 'ಆಯಿತು. ನಿಮ್ಮ ಸರದಿಗಾಗಿ ಕಾಯಿರಿ.',
    tokenLabel: 'ನಿಮ್ಮ ಟೋಕನ್ ಸಂಖ್ಯೆ',
    back: 'ಹಿಂದೆ'
  },
  'ml-IN': {
    appName: 'എഐ ക്ലിനിക്കൽ',
    tagline: 'രോഗി പറയുന്നു · എഐ ക്രമീകരിക്കുന്നു · ഡോക്ടർ തീരുമാനിക്കുന്നു',
    govt: 'ആയുഷ് മന്ത്രാലയം · ഭാരത സർക്കാർ',
    homeHeading: 'ഞങ്ങൾ നിങ്ങളെ എങ്ങനെ സഹായിക്കും?',
    homeSub: 'താഴെ ഒരു പെട്ടി തൊടുക, അല്ലെങ്കിൽ സംസാരിക്കുക',
    consultTitle: 'ഡോക്ടറെ കാണുക',
    consultDesc: 'ഡോക്ടറെ കാണുന്നതിന് മുമ്പ് നിങ്ങളുടെ പ്രശ്നം നിങ്ങളുടെ ഭാഷയിൽ പറയുക',
    consultCta: 'തുടങ്ങുക',
    emergencyTitle: 'അടിയന്തരാവസ്ഥ',
    emergencyDesc: 'ഇപ്പോൾ ഗുരുതര പ്രശ്നം — ഉടൻ സഹായം നേടുക',
    emergencyCta: 'ഇപ്പോൾ സഹായം',
    langLabel: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക',
    secure: 'സുരക്ഷിതം · സമ്മതത്തോടെ · സൗജന്യം',
    helpline: 'ആരോഗ്യ ഹെൽപ്‌ലൈൻ',
    ambulance: 'ആംബുലൻസ്',
    consentTitle: 'നിങ്ങളുടെ അനുമതി',
    consentAgree: 'ഞാൻ സമ്മതിക്കുന്നു, തുടരുക',
    faceTitle: 'ക്യാമറയിലേക്ക് നോക്കുക',
    faceCapture: 'ഫോട്ടോ എടുക്കുക',
    modeTitle: 'ഏത് വിഭാഗത്തിൽ കാണിക്കണം?',
    generalTitle: 'ജനറൽ ഒപിഡി',
    ayushTitle: 'ആയുർവേദം (ആയുഷ്)',
    listening: 'കേൾക്കുന്നു…',
    tapToSpeak: 'തൊട്ട് ഉത്തരം പറയുക',
    docsTitle: 'നിങ്ങളുടെ കൈയിൽ പഴയ രേഖകളുണ്ടോ?',
    docsHave: 'ഉണ്ട്',
    docsNone: 'ഇല്ല',
    reviewTitle: 'എല്ലാം പരിശോധിക്കുക',
    reviewConfirm: 'എല്ലാം ശരിയാണ്',
    reviewCorrect: 'എന്തോ തെറ്റുണ്ട്',
    doneTitle: 'കഴിഞ്ഞു. നിങ്ങളുടെ ഊഴത്തിനായി കാത്തിരിക്കുക.',
    tokenLabel: 'നിങ്ങളുടെ ടോക്കൺ നമ്പർ',
    back: 'പിന്നോട്ട്'
  },
  'pa-IN': {
    appName: 'ਏਆਈ ਕਲੀਨਿਕਲ',
    tagline: 'ਮਰੀਜ਼ ਬੋਲੇ · ਏਆਈ ਸੰਭਾਲੇ · ਡਾਕਟਰ ਫ਼ੈਸਲਾ ਕਰੇ',
    govt: 'ਆਯੁਸ਼ ਮੰਤਰਾਲਾ · ਭਾਰਤ ਸਰਕਾਰ',
    homeHeading: 'ਅਸੀਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰੀਏ?',
    homeSub: 'ਹੇਠਾਂ ਇੱਕ ਡੱਬੇ ਨੂੰ ਛੂਹੋ, ਜਾਂ ਬੱਸ ਬੋਲੋ',
    consultTitle: 'ਡਾਕਟਰ ਨੂੰ ਦਿਖਾਓ',
    consultDesc: 'ਡਾਕਟਰ ਨੂੰ ਮਿਲਣ ਤੋਂ ਪਹਿਲਾਂ ਆਪਣੀ ਤਕਲੀਫ਼ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਦੱਸੋ',
    consultCta: 'ਸ਼ੁਰੂ ਕਰੋ',
    emergencyTitle: 'ਐਮਰਜੈਂਸੀ',
    emergencyDesc: 'ਹੁਣੇ ਗੰਭੀਰ ਤਕਲੀਫ਼ ਹੈ — ਤੁਰੰਤ ਮਦਦ ਲਵੋ',
    emergencyCta: 'ਹੁਣੇ ਮਦਦ ਲਵੋ',
    langLabel: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',
    secure: 'ਸੁਰੱਖਿਅਤ · ਸਹਿਮਤੀ ਨਾਲ · ਮੁਫ਼ਤ',
    helpline: 'ਸਿਹਤ ਹੈਲਪਲਾਈਨ',
    ambulance: 'ਐਂਬੂਲੈਂਸ',
    consentTitle: 'ਤੁਹਾਡੀ ਇਜਾਜ਼ਤ',
    consentAgree: 'ਮੈਂ ਸਹਿਮਤ ਹਾਂ, ਅੱਗੇ ਵਧੋ',
    faceTitle: 'ਕੈਮਰੇ ਵੱਲ ਦੇਖੋ',
    faceCapture: 'ਫੋਟੋ ਲਵੋ',
    modeTitle: 'ਤੁਸੀਂ ਕਿਹੜੇ ਵਿਭਾਗ ਵਿੱਚ ਦਿਖਾਉਣਾ ਹੈ?',
    generalTitle: 'ਆਮ ਓਪੀਡੀ',
    ayushTitle: 'ਆਯੁਰਵੇਦ (ਆਯੁਸ਼)',
    listening: 'ਸੁਣ ਰਹੇ ਹਾਂ…',
    tapToSpeak: 'ਛੂਹ ਕੇ ਜਵਾਬ ਬੋਲੋ',
    docsTitle: 'ਕੀ ਤੁਹਾਡੇ ਕੋਲ ਪੁਰਾਣੇ ਕਾਗ਼ਜ਼ ਹਨ?',
    docsHave: 'ਹਾਂ, ਹਨ',
    docsNone: 'ਨਹੀਂ',
    reviewTitle: 'ਸਭ ਕੁਝ ਜਾਂਚ ਲਵੋ',
    reviewConfirm: 'ਸਭ ਸਹੀ ਹੈ',
    reviewCorrect: 'ਕੁਝ ਗ਼ਲਤ ਹੈ',
    doneTitle: 'ਹੋ ਗਿਆ। ਆਪਣੀ ਵਾਰੀ ਦੀ ਉਡੀਕ ਕਰੋ।',
    tokenLabel: 'ਤੁਹਾਡਾ ਟੋਕਨ ਨੰਬਰ',
    back: 'ਪਿੱਛੇ'
  },
  'od-IN': {
    appName: 'ଏଆଇ କ୍ଲିନିକାଲ',
    tagline: 'ରୋଗୀ କୁହନ୍ତି · ଏଆଇ ସଜାଏ · ଡାକ୍ତର ସ୍ଥିର କରନ୍ତି',
    govt: 'ଆୟୁଷ ମନ୍ତ୍ରଣାଳୟ · ଭାରତ ସରକାର',
    homeHeading: 'ଆମେ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିବୁ?',
    homeSub: 'ତଳେ ଏକ ବାକ୍ସ ଛୁଅନ୍ତୁ, କିମ୍ବା କୁହନ୍ତୁ',
    consultTitle: 'ଡାକ୍ତରଙ୍କୁ ଦେଖାନ୍ତୁ',
    consultDesc: 'ଡାକ୍ତରଙ୍କୁ ଭେଟିବା ପୂର୍ବରୁ ଆପଣଙ୍କ ସମସ୍ୟା ନିଜ ଭାଷାରେ କୁହନ୍ତୁ',
    consultCta: 'ଆରମ୍ଭ କରନ୍ତୁ',
    emergencyTitle: 'ଜରୁରୀ',
    emergencyDesc: 'ବର୍ତ୍ତମାନ ଗମ୍ଭୀର ସମସ୍ୟା — ତୁରନ୍ତ ସାହାଯ୍ୟ ନିଅନ୍ତୁ',
    emergencyCta: 'ବର୍ତ୍ତମାନ ସାହାଯ୍ୟ',
    langLabel: 'ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ',
    secure: 'ସୁରକ୍ଷିତ · ସମ୍ମତିରେ · ମାଗଣା',
    helpline: 'ସ୍ୱାସ୍ଥ୍ୟ ହେଲ୍ପଲାଇନ',
    ambulance: 'ଆମ୍ବୁଲାନ୍ସ',
    consentTitle: 'ଆପଣଙ୍କ ଅନୁମତି',
    consentAgree: 'ମୁଁ ରାଜି, ଆଗକୁ ଯାଆନ୍ତୁ',
    faceTitle: 'କ୍ୟାମେରା ଆଡ଼କୁ ଚାହାନ୍ତୁ',
    faceCapture: 'ଫଟୋ ନିଅନ୍ତୁ',
    modeTitle: 'ଆପଣ କେଉଁ ବିଭାଗରେ ଦେଖାଇବେ?',
    generalTitle: 'ସାଧାରଣ ଓପିଡି',
    ayushTitle: 'ଆୟୁର୍ବେଦ (ଆୟୁଷ)',
    listening: 'ଶୁଣୁଛୁ…',
    tapToSpeak: 'ଛୁଇଁ ଉତ୍ତର କୁହନ୍ତୁ',
    docsTitle: 'ଆପଣଙ୍କ ପାଖରେ ପୁରୁଣା କାଗଜ ଅଛି କି?',
    docsHave: 'ହଁ, ଅଛି',
    docsNone: 'ନାହିଁ',
    reviewTitle: 'ସବୁ ଯାଞ୍ଚ କରନ୍ତୁ',
    reviewConfirm: 'ସବୁ ଠିକ୍ ଅଛି',
    reviewCorrect: 'କିଛି ଭୁଲ ଅଛି',
    doneTitle: 'ହୋଇଗଲା। ଆପଣଙ୍କ ପାଳିକୁ ଅପେକ୍ଷା କରନ୍ତୁ।',
    tokenLabel: 'ଆପଣଙ୍କ ଟୋକନ ନମ୍ବର',
    back: 'ପଛକୁ'
  }
};

export const LANGUAGES = [
  { code: 'hi-IN', name: 'हिन्दी', english: 'Hindi' },
  { code: 'en-IN', name: 'English', english: 'English' },
  { code: 'bn-IN', name: 'বাংলা', english: 'Bengali' },
  { code: 'mr-IN', name: 'मराठी', english: 'Marathi' },
  { code: 'te-IN', name: 'తెలుగు', english: 'Telugu' },
  { code: 'ta-IN', name: 'தமிழ்', english: 'Tamil' },
  { code: 'gu-IN', name: 'ગુજરાતી', english: 'Gujarati' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ', english: 'Kannada' },
  { code: 'ml-IN', name: 'മലയാളം', english: 'Malayalam' },
  { code: 'pa-IN', name: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
  { code: 'od-IN', name: 'ଓଡ଼ିଆ', english: 'Odia' }
];

export const getCopy = (code: string): Copy => {
  if (code === 'en-IN') return en;
  if (code === 'hi-IN') return hi;
  const override = overrides[code];
  return override ? { ...hi, ...override } : hi;
};

export const languageLabel = (code: string) =>
  LANGUAGES.find((l) => l.code === code)?.name || code;
