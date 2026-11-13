// Sample data so the UI works before the backend is ready (VITE_USE_MOCK=true)
export const mockJobs = [
  { id: 1, title: 'Junior AI Engineer', company: 'ABC Technologies', location: 'Chandigarh', category: 'AI', qualification: 'BTech CSE / IT', salary: '4-6 LPA', description: 'Build and test ML models with a small product team.' },
  { id: 2, title: 'Data Analyst Trainee', company: 'Punjab Data Labs', location: 'Mohali', category: 'Data', qualification: 'BSc / BTech', salary: '3-4 LPA', description: 'Clean data, build dashboards and report weekly insights.' },
  { id: 3, title: 'Clerk (Punjab Govt.)', company: 'Dept. of Revenue, Punjab', location: 'Ludhiana', category: 'Government', qualification: '12th pass', salary: 'Pay Level 2', description: 'Clerical post through state recruitment. Punjabi typing required.' },
  { id: 4, title: 'Full Stack Developer', company: 'TechNest', location: 'Chandigarh', category: 'IT', qualification: 'BTech / BCA', salary: '5-8 LPA', description: 'React and Node.js development for client projects.' },
  { id: 5, title: 'Police Constable', company: 'Punjab Police', location: 'Amritsar', category: 'Government', qualification: '10+2', salary: 'Pay Level 3', description: 'Physical and written tests. Age limit applies.' },
]
export const mockCourses = [
  { id: 1, title: 'Python for Everybody', provider: 'Coursera', category: 'Programming', description: 'Beginner-friendly Python with projects.', url: 'https://www.coursera.org' },
  { id: 2, title: 'Machine Learning Specialization', provider: 'DeepLearning.AI', category: 'AI', description: 'Core ML concepts, from regression to neural networks.', url: 'https://www.deeplearning.ai' },
  { id: 3, title: 'Digital Skills Basics', provider: 'Skill India', category: 'Digital', description: 'Computer basics and online services.', url: 'https://www.skillindiadigital.gov.in' },
]
export const mockProfile = { name: '', education: '', skills: '', experience: 'Fresher', preferred_location: '', preferred_job_type: '' }

export function mockChat({ message, language }) {
  const m = message.toLowerCase()
  const wantsJobs = /job|नौकरी|ਨੌਕਰੀ|recommend|ai|data|govt|government|सरकारी|ਸਰਕਾਰੀ/.test(m)
  const reply = {
    en: wantsJobs ? 'I found some jobs that may suit you.' : 'You can apply for government jobs through the official PGRKAM portal after registering.',
    hi: wantsJobs ? 'मुझे कुछ नौकरियाँ मिली हैं जो आपके लिए उपयुक्त हो सकती हैं।' : 'आप आधिकारिक PGRKAM पोर्टल पर पंजीकरण करके सरकारी नौकरियों के लिए आवेदन कर सकते हैं।',
    pa: wantsJobs ? 'ਮੈਨੂੰ ਕੁਝ ਨੌਕਰੀਆਂ ਮਿਲੀਆਂ ਹਨ ਜੋ ਤੁਹਾਡੇ ਲਈ ਠੀਕ ਹੋ ਸਕਦੀਆਂ ਹਨ।' : 'ਤੁਸੀਂ ਸਰਕਾਰੀ PGRKAM ਪੋਰਟਲ ਤੇ ਰਜਿਸਟਰ ਕਰਕੇ ਸਰਕਾਰੀ ਨੌਕਰੀਆਂ ਲਈ ਅਪਲਾਈ ਕਰ ਸਕਦੇ ਹੋ।',
  }[language] || ''
  return { reply, language, jobs: wantsJobs ? mockJobs.slice(0, 3) : [], sources: ['Employment Knowledge Base (sample)'] }
}
