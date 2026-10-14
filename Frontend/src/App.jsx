import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import Navbar from './components/Navbar';
import ParticleField from './components/ParticleField';
import Home from './pages/Home';
import './App.css';

const Events = lazy(() => import('./pages/Events'));
const Team = lazy(() => import('./pages/Team'));
const Resources = lazy(() => import('./pages/Resources'));

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
  const [cursor, setCursor] = useState({ x: -100, y: -100, visible: false });
  const [atFooter, setAtFooter] = useState(false);

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

  useEffect(() => {
    let frame;
    const updateCursor = (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const hoveredElement = document.elementFromPoint(event.clientX, event.clientY);
        setCursor({
          x: event.clientX,
          y: event.clientY,
          visible: true,
          onOrange: Boolean(hoveredElement?.closest('.main-footer')),
        });
      });
    };
    const hideCursor = () => setCursor((previous) => ({ ...previous, visible: false }));
    const updateFooterState = () => {
      const footer = document.querySelector('.main-footer');
      setAtFooter(Boolean(footer && footer.getBoundingClientRect().top <= window.innerHeight - 24));
    };

    document.addEventListener('mousemove', updateCursor, { passive: true });
    document.addEventListener('mouseleave', hideCursor);
    window.addEventListener('scroll', updateFooterState, { passive: true });
    window.addEventListener('resize', updateFooterState);
    updateFooterState();
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('mousemove', updateCursor);
      document.removeEventListener('mouseleave', hideCursor);
      window.removeEventListener('scroll', updateFooterState);
      window.removeEventListener('resize', updateFooterState);
    };
  }, [currentRoute]);

  const handlePageJump = () => {
    if (atFooter) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.querySelector('.main-footer')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  return (
    <div className="app-shell">
      <ParticleField />
      <div
        className={`site-cursor ${cursor.visible ? 'is-visible' : ''} ${cursor.onOrange ? 'on-orange' : ''}`}
        style={{ transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)` }}
        aria-hidden="true"
      >
        <span className="site-cursor-dot" />
      </div>
      <Navbar
        currentRoute={currentRoute}
        onNavigate={navigateTo}
      />
      <main className="app-main-content">
        <Suspense fallback={<div className="route-loading" aria-hidden="true" />}>
          {currentRoute === 'events' && <Events onNavigate={navigateTo} />}
          {currentRoute === 'team' && <Team onNavigate={navigateTo} />}
          {currentRoute === 'resources' && <Resources onNavigate={navigateTo} />}
          {currentRoute === 'home' && <Home onNavigate={navigateTo} />}
        </Suspense>
      </main>
      <button
        type="button"
        className={`page-jump-button ${atFooter ? 'is-up' : ''}`}
        onClick={handlePageJump}
        aria-label={atFooter ? 'Back to top' : 'Go to footer'}
      >
        {atFooter ? <ArrowUp size={19} /> : <ArrowDown size={19} />}
      </button>
    </div>
  );
}

export default App;

