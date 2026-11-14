// UI strings in English, Hindi, Punjabi. Add keys here as you add screens.
export const LANGS = [
  { code: 'en', label: 'English', speech: 'en-IN' },
  { code: 'hi', label: 'हिन्दी', speech: 'hi-IN' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', speech: 'pa-IN' },
]

const S = {
  en: {
    appName: 'PGRKAM Employment Assistant', home: 'Home', chat: 'Assistant', jobs: 'Jobs', profile: 'My profile', courses: 'Courses',
    recommendations: 'For you', recTitle: 'Jobs recommended for you', recSub: 'Ranked using your saved profile.', recBasedOn: 'Based on:', recEdit: 'Edit profile', recIncomplete: 'Add your education and skills to get better matches.', recEmpty: 'No recommendations yet. Save your profile or ask the assistant.', recBest: 'Best match', recRefresh: 'Refresh recommendations',
    heroTitle: 'Find work that fits you, in your own language.',
    heroSub: 'Ask about jobs, eligibility, government vacancies and skill courses.',
    askPlaceholder: 'Try: Find AI jobs for freshers in Punjab', ask: 'Ask assistant',
    recommend: 'Recommend jobs for me', typeMessage: 'Type your message', send: 'Send', thinking: 'Looking through jobs and resources…',
    sources: 'Sources', search: 'Search jobs', location: 'Location', category: 'Category', all: 'All', find: 'Search',
    noJobs: 'No jobs match these filters. Clear a filter or ask the assistant.', qualification: 'Qualification', salary: 'Salary',
    saveProfile: 'Save profile', saved: 'Profile saved', education: 'Education', skills: 'Skills (comma separated)',
    experience: 'Experience', prefLocation: 'Preferred location', prefType: 'Preferred job type', name: 'Name',
    loadError: 'Could not reach the server. Check that the backend is running and try again.', retry: 'Try again',
    openCourse: 'Open course', speak: 'Speak', suggestions: ['Find jobs for BTech freshers', 'How can I apply for government jobs?', 'I want to become a data scientist. What should I learn?'],
  },
  hi: {
    appName: 'पीजीआरकेएएम रोज़गार सहायक', home: 'होम', chat: 'सहायक', jobs: 'नौकरियाँ', profile: 'मेरी प्रोफ़ाइल', courses: 'कोर्स',
    recommendations: 'आपके लिए', recTitle: 'आपके लिए सुझाई गई नौकरियाँ', recSub: 'आपकी सहेजी गई प्रोफ़ाइल के आधार पर क्रमबद्ध।', recBasedOn: 'आधार:', recEdit: 'प्रोफ़ाइल बदलें', recIncomplete: 'बेहतर सुझावों के लिए अपनी शिक्षा और कौशल जोड़ें।', recEmpty: 'अभी कोई सुझाव नहीं है। प्रोफ़ाइल सहेजें या सहायक से पूछें।', recBest: 'सबसे अच्छा मेल', recRefresh: 'सुझाव ताज़ा करें',
    heroTitle: 'अपनी भाषा में अपने लिए सही काम खोजें।',
    heroSub: 'नौकरियों, पात्रता, सरकारी रिक्तियों और स्किल कोर्स के बारे में पूछें।',
    askPlaceholder: 'जैसे: पंजाब में फ्रेशर्स के लिए AI नौकरियाँ खोजें', ask: 'सहायक से पूछें',
    recommend: 'मेरे लिए नौकरियाँ सुझाएँ', typeMessage: 'अपना संदेश लिखें', send: 'भेजें', thinking: 'नौकरियाँ और जानकारी खोजी जा रही है…',
    sources: 'स्रोत', search: 'नौकरी खोजें', location: 'स्थान', category: 'श्रेणी', all: 'सभी', find: 'खोजें',
    noJobs: 'इन फ़िल्टर से कोई नौकरी नहीं मिली। फ़िल्टर हटाएँ या सहायक से पूछें।', qualification: 'योग्यता', salary: 'वेतन',
    saveProfile: 'प्रोफ़ाइल सहेजें', saved: 'प्रोफ़ाइल सहेज ली गई', education: 'शिक्षा', skills: 'कौशल (कॉमा से अलग करें)',
    experience: 'अनुभव', prefLocation: 'पसंदीदा स्थान', prefType: 'पसंदीदा नौकरी का प्रकार', name: 'नाम',
    loadError: 'सर्वर से संपर्क नहीं हो सका। जाँचें कि बैकएंड चल रहा है और फिर कोशिश करें।', retry: 'फिर कोशिश करें',
    openCourse: 'कोर्स खोलें', speak: 'बोलें', suggestions: ['BTech फ्रेशर्स के लिए नौकरियाँ खोजें', 'सरकारी नौकरी के लिए आवेदन कैसे करें?', 'मुझे डेटा साइंटिस्ट बनना है, क्या सीखूँ?'],
  },
  pa: {
    appName: 'ਪੀਜੀਆਰਕੇਏਐਮ ਰੁਜ਼ਗਾਰ ਸਹਾਇਕ', home: 'ਹੋਮ', chat: 'ਸਹਾਇਕ', jobs: 'ਨੌਕਰੀਆਂ', profile: 'ਮੇਰੀ ਪ੍ਰੋਫ਼ਾਈਲ', courses: 'ਕੋਰਸ',
    recommendations: 'ਤੁਹਾਡੇ ਲਈ', recTitle: 'ਤੁਹਾਡੇ ਲਈ ਸੁਝਾਈਆਂ ਨੌਕਰੀਆਂ', recSub: 'ਤੁਹਾਡੀ ਸੰਭਾਲੀ ਪ੍ਰੋਫ਼ਾਈਲ ਦੇ ਆਧਾਰ ਤੇ ਕ੍ਰਮਬੱਧ।', recBasedOn: 'ਆਧਾਰ:', recEdit: 'ਪ੍ਰੋਫ਼ਾਈਲ ਬਦਲੋ', recIncomplete: 'ਬਿਹਤਰ ਸੁਝਾਵਾਂ ਲਈ ਆਪਣੀ ਸਿੱਖਿਆ ਅਤੇ ਹੁਨਰ ਜੋੜੋ।', recEmpty: 'ਅਜੇ ਕੋਈ ਸੁਝਾਅ ਨਹੀਂ। ਪ੍ਰੋਫ਼ਾਈਲ ਸੰਭਾਲੋ ਜਾਂ ਸਹਾਇਕ ਤੋਂ ਪੁੱਛੋ।', recBest: 'ਸਭ ਤੋਂ ਵਧੀਆ ਮੇਲ', recRefresh: 'ਸੁਝਾਅ ਤਾਜ਼ਾ ਕਰੋ',
    heroTitle: 'ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਆਪਣੇ ਲਈ ਸਹੀ ਕੰਮ ਲੱਭੋ।',
    heroSub: 'ਨੌਕਰੀਆਂ, ਯੋਗਤਾ, ਸਰਕਾਰੀ ਅਸਾਮੀਆਂ ਅਤੇ ਸਕਿੱਲ ਕੋਰਸਾਂ ਬਾਰੇ ਪੁੱਛੋ।',
    askPlaceholder: 'ਜਿਵੇਂ: ਪੰਜਾਬ ਵਿੱਚ ਫ੍ਰੈਸ਼ਰਾਂ ਲਈ AI ਨੌਕਰੀਆਂ ਲੱਭੋ', ask: 'ਸਹਾਇਕ ਤੋਂ ਪੁੱਛੋ',
    recommend: 'ਮੇਰੇ ਲਈ ਨੌਕਰੀਆਂ ਸੁਝਾਓ', typeMessage: 'ਆਪਣਾ ਸੁਨੇਹਾ ਲਿਖੋ', send: 'ਭੇਜੋ', thinking: 'ਨੌਕਰੀਆਂ ਅਤੇ ਜਾਣਕਾਰੀ ਲੱਭੀ ਜਾ ਰਹੀ ਹੈ…',
    sources: 'ਸਰੋਤ', search: 'ਨੌਕਰੀ ਲੱਭੋ', location: 'ਥਾਂ', category: 'ਸ਼੍ਰੇਣੀ', all: 'ਸਾਰੇ', find: 'ਲੱਭੋ',
    noJobs: 'ਇਨ੍ਹਾਂ ਫ਼ਿਲਟਰਾਂ ਨਾਲ ਕੋਈ ਨੌਕਰੀ ਨਹੀਂ ਮਿਲੀ। ਫ਼ਿਲਟਰ ਹਟਾਓ ਜਾਂ ਸਹਾਇਕ ਤੋਂ ਪੁੱਛੋ।', qualification: 'ਯੋਗਤਾ', salary: 'ਤਨਖ਼ਾਹ',
    saveProfile: 'ਪ੍ਰੋਫ਼ਾਈਲ ਸੰਭਾਲੋ', saved: 'ਪ੍ਰੋਫ਼ਾਈਲ ਸੰਭਾਲੀ ਗਈ', education: 'ਸਿੱਖਿਆ', skills: 'ਹੁਨਰ (ਕਾਮੇ ਨਾਲ ਵੱਖ ਕਰੋ)',
    experience: 'ਤਜਰਬਾ', prefLocation: 'ਪਸੰਦੀਦਾ ਥਾਂ', prefType: 'ਪਸੰਦੀਦਾ ਨੌਕਰੀ ਦੀ ਕਿਸਮ', name: 'ਨਾਮ',
    loadError: 'ਸਰਵਰ ਨਾਲ ਸੰਪਰਕ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਜਾਂਚੋ ਕਿ ਬੈਕਐਂਡ ਚੱਲ ਰਿਹਾ ਹੈ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।', retry: 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ',
    openCourse: 'ਕੋਰਸ ਖੋਲ੍ਹੋ', speak: 'ਬੋਲੋ', suggestions: ['BTech ਫ੍ਰੈਸ਼ਰਾਂ ਲਈ ਨੌਕਰੀਆਂ ਲੱਭੋ', 'ਸਰਕਾਰੀ ਨੌਕਰੀ ਲਈ ਅਪਲਾਈ ਕਿਵੇਂ ਕਰੀਏ?', 'ਮੈਂ ਡਾਟਾ ਸਾਇੰਟਿਸਟ ਬਣਨਾ ਹੈ, ਕੀ ਸਿੱਖਾਂ?'],
  },
}
export const t = (lang, key) => S[lang]?.[key] ?? S.en[key] ?? key
