import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Events from './pages/Events';
import Team from './pages/Team';
import Resources from './pages/Resources';
import './App.css';

function getRouteFromLocation() {
  const hash = (window.location.hash || '').toLowerCase();
  const path = (window.location.pathname || '').toLowerCase();
  if (hash.includes('event') || path.includes('event')) {
    return 'events';
  }
  if (hash.includes('team') || path.includes('team')) {
    return 'team';
  }
  if (hash.includes('resource') || path.includes('resource')) {
    return 'resources';
  }
  return 'home';
}

function App() {
  const [currentRoute, setCurrentRoute] = useState(getRouteFromLocation);
  const [selectedYear, setSelectedYear] = useState('2026');

  const navigateTo = useCallback((route) => {
    const r = (route || '').toLowerCase();
    if (r.includes('event')) {
      if (window.location.hash !== '#events') window.location.hash = '#events';
      setCurrentRoute('events');
    } else if (r.includes('team')) {
      if (window.location.hash !== '#team') window.location.hash = '#team';
      setCurrentRoute('team');
    } else if (r.includes('resource')) {
      if (window.location.hash !== '#resources') window.location.hash = '#resources';
      setCurrentRoute('resources');
    } else {
      if (window.location.hash !== '' && window.location.hash !== '#') window.location.hash = '#';
      setCurrentRoute('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      const nextRoute = getRouteFromLocation();
      setCurrentRoute(nextRoute);
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    // Intercept any link clicks pointing to team/events/home across all components
    const handleDocumentClick = (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';

      if (
        href === '#team' ||
        href === '#teams' ||
        href === '#/team' ||
        href === '#/teams' ||
        href.includes('/team')
      ) {
        e.preventDefault();
        navigateTo('team');
      } else if (
        href === '#events' ||
        href === '#/events' ||
        href.includes('/events')
      ) {
        e.preventDefault();
        navigateTo('events');
      } else if (
        href === '#resources' ||
        href === '#/resources' ||
        href.includes('/resources')
      ) {
        e.preventDefault();
        navigateTo('resources');
      } else if (href === '#home' || href === '#hero') {
        const route = getRouteFromLocation();
        if (route !== 'home') {
          e.preventDefault();
          navigateTo('home');
        }
      }
    };

    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [navigateTo]);

  return (
    <div className="app-shell">
      <Navbar
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />
      <main className="app-main-content">
        {currentRoute === 'events' && <Events onNavigate={navigateTo} />}
        {currentRoute === 'team' && <Team onNavigate={navigateTo} />}
        {currentRoute === 'resources' && <Resources onNavigate={navigateTo} />}
        {currentRoute === 'home' && (
          <Home
            onNavigate={navigateTo}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
        )}
      </main>
    </div>
  );
}

export default App;

