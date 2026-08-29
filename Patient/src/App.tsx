import React, { useState } from 'react';
import Homepage from './components/HomePage.tsx';
import EmergencyPage from './pages/EmergencyPage.tsx';
import ConsultationPage from './pages/ConsultationPage.tsx';

type Page = 'home' | 'consultation' | 'emergency';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const navigateTo = (page: string) => {
    setCurrentPage(page as Page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Homepage navigateTo={navigateTo} />;
      case 'consultation':
        return <ConsultationPage navigateTo={navigateTo} />;
      case 'emergency':
        return <EmergencyPage navigateTo={navigateTo} />;
      default:
        return <Homepage navigateTo={navigateTo} />;
    }
  };

  return <div>{renderPage()}</div>;
}

export default App;