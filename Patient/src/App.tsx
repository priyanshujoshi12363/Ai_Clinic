import { useState } from 'react';
import Homepage from './components/HomePage';
import EmergencyPage from './pages/EmergencyPage';
import ConsultationPage from './pages/ConsultationPage';

type Page = 'home' | 'consultation' | 'emergency';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [language, setLanguage] = useState('hi-IN');

  const navigateTo = (page: string) => setCurrentPage(page as Page);

  if (currentPage === 'consultation') {
    return <ConsultationPage key="consultation" navigateTo={navigateTo} language={language} setLanguage={setLanguage} />;
  }

  if (currentPage === 'emergency') {
    return <EmergencyPage key="emergency" navigateTo={navigateTo} language={language} setLanguage={setLanguage} />;
  }

  return <Homepage navigateTo={navigateTo} language={language} setLanguage={setLanguage} />;
}

export default App;
