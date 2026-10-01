import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import './Navbar.css';

export default function Navbar({
  currentRoute = 'home',
  onNavigate,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [titleMotion, setTitleMotion] = useState({});
  const [navMotion, setNavMotion] = useState({ '--title-slot': '0px', '--nav-gap': '24px' });
  const [titleDocked, setTitleDocked] = useState(currentRoute !== 'home');
  const navRef = useRef(null);

  // The title is a single, fixed element.  Its position and scale are tied to
  // the first part of the page scroll, so it appears to travel into its slot
  // in the navigation rather than being swapped for a second copy.
  useEffect(() => {
    if (currentRoute !== 'home') {
      setTitleDocked(true);
      setTitleMotion({
        transform: 'translate(-50%, -50%)',
        top: '34px',
        left: '50%',
        fontSize: '11px',
        letterSpacing: '-0.02em',
      });
      setNavMotion({ '--title-slot': '92px', '--nav-gap': '29px' });
      return undefined;
    }

    let frame;
    const updateTitle = () => {
      const navHeight = navRef.current?.getBoundingClientRect().height || 68;
      const viewportHeight = window.innerHeight;
      const travelDistance = Math.min(620, viewportHeight * 0.72);
      const progress = Math.max(0, Math.min(1, window.scrollY / travelDistance));
      setTitleDocked(progress > 0.82);
      // A smoothstep curve gives the move a deliberate take-off and landing.
      const eased = progress * progress * (3 - 2 * progress);
      const startY = navHeight + (viewportHeight - navHeight) / 2;
      const endY = navHeight / 2;
      const startSize = Math.min(220, Math.max(52, window.innerWidth * 0.14));
      const fontSize = startSize + (11 - startSize) * eased;

      setTitleMotion({
        top: `${startY + (endY - startY) * eased}px`,
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: `${fontSize}px`,
        letterSpacing: `${-0.045 + 0.025 * eased}em`,
      });
      setNavMotion({
        '--title-slot': `${92 * eased}px`,
        '--nav-gap': `${24 + 5 * eased}px`,
      });
    };
    const requestUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateTitle);
    };

    updateTitle();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, [currentRoute]);
  const handleNavClick = (e, target) => {
    e.preventDefault();
    setMenuOpen(false);
    if (target === 'gallery') {
      if (currentRoute === 'home') {
        document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
      } else if (onNavigate) {
        onNavigate('home');
        window.setTimeout(() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' }), 250);
      }
      return;
    }
    if (onNavigate) {
      onNavigate(target);
    } else {
      window.location.hash = target === 'home' ? '#' : `#${target}`;
    }
  };

  return (
    <header ref={navRef} className="app-navbar-sticky">
      <a
        href="#home"
        className={`app-scroll-title ${titleDocked ? 'is-docked' : ''}`}
        onClick={(e) => handleNavClick(e, 'home')}
        style={titleMotion}
        aria-label="DJS CodeStars Home"
      >
        <span>DJS</span>
        <span className="app-scroll-title-codestars">CodeStars</span>
      </a>

      <button
        type="button"
        className="app-nav-menu-toggle"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={21} />}
      </button>

      <nav className={`app-nav-center ${menuOpen ? 'is-open' : ''}`} style={navMotion} aria-label="Main Navigation">
        <div className="app-nav-side app-nav-side-left">
          <a
            href="#home"
            className={`app-nav-link ${currentRoute === 'home' ? 'active' : ''}`}
            onClick={(e) => handleNavClick(e, 'home')}
          >
            Home
          </a>

          <a
            href="#events"
            className={`app-nav-link ${currentRoute === 'events' ? 'active' : ''}`}
            onClick={(e) => handleNavClick(e, 'events')}
          >
            Event
          </a>

          <a
            href="https://codeuncode.djscodestars.in/"
            className="app-nav-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Code UnCode
          </a>
        </div>

        {/* Keeps clear space for the title as it lands in the nav. */}
        <span className="app-nav-title-slot" aria-hidden="true" />

        <div className="app-nav-side app-nav-side-right">
          <a
            href="#resources"
            className={`app-nav-link ${currentRoute === 'resources' ? 'active' : ''}`}
            onClick={(e) => handleNavClick(e, 'resources')}
          >
            Resources
          </a>

          <a
            href="#team"
            className={`app-nav-link ${currentRoute === 'team' ? 'active' : ''}`}
            onClick={(e) => handleNavClick(e, 'team')}
          >
            Team
          </a>

          <a
            href="#gallery"
            className="app-nav-link"
            onClick={(e) => handleNavClick(e, 'gallery')}
          >
            Gallery
          </a>
        </div>
      </nav>

      {currentRoute !== 'home' && (
        <div className="app-nav-right">
          <button
            type="button"
            className="app-nav-back-btn"
            onClick={(e) => handleNavClick(e, 'home')}
            title="Return to Home"
          >
            <ArrowRight size={13} style={{ transform: 'rotate(180deg)' }} />
            <span>Back to Home</span>
          </button>
        </div>
      )}
    </header>
  );
}
