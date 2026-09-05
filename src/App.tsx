import React, { useState, useEffect, useCallback } from 'react';
import { LandingPage } from './components/LandingPage';
import { AirMagicApp } from './AirMagicApp';

function getInitialRoute(): 'landing' | 'app' {
  if (typeof window === 'undefined') return 'landing';
  const path = window.location.pathname.replace(/\/+$/, '');
  const hash = window.location.hash.toLowerCase();
  if (path === '/app' || hash === '#/app' || hash === '#app') {
    return 'app';
  }
  return 'landing';
}

export const App: React.FC = () => {
  const [route, setRoute] = useState<'landing' | 'app'>(getInitialRoute);

  useEffect(() => {
    const handleNavigation = () => {
      setRoute(getInitialRoute());
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  const handleLaunch = useCallback(() => {
    // Navigate to /app using HTML5 history API
    try {
      window.history.pushState({ page: 'app' }, '', '/app');
    } catch {
      window.location.hash = '/app';
    }
    setRoute('app');
    window.scrollTo(0, 0);
  }, []);

  if (route === 'app') {
    return <AirMagicApp />;
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth bg-[#030308]">
      <LandingPage onLaunch={handleLaunch} />
    </div>
  );
};

export default App;
