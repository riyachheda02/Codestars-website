import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  House,
  Calendar,
  Terminal,
  BookOpen,
  Users,
  Image as ImageIcon,
  ArrowLeft,
} from 'lucide-react';
import './Navbar.css';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: House, isRoute: true, route: 'home', hash: '#home' },
  { id: 'events', label: 'Event', icon: Calendar, isRoute: true, route: 'events', hash: '#events' },
  {
    id: 'codeuncode',
    label: 'Code UnCode',
    icon: Terminal,
    isExternal: true,
    url: 'https://codeuncode.djscodestars.in/',
  },
  { id: 'resources', label: 'Resources', icon: BookOpen, isRoute: true, route: 'resources', hash: '#resources' },
  { id: 'team', label: 'Team', icon: Users, isRoute: true, route: 'team', hash: '#team' },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon, isRoute: true, route: 'gallery', hash: '#gallery' },
];

export default function Navbar({ currentRoute = 'home', onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(currentRoute === 'home' ? 0 : 1);
  const [rawPVal, setRawPVal] = useState(currentRoute === 'home' ? 0 : 1);
  const navRef = useRef(null);
  const logoSlotRef = useRef(null);

  // Broadcast logo slot rect whenever needed for the hero wordmark landing coordinates
  const broadcastSlotRect = useCallback(() => {
    if (!logoSlotRef.current) return;
    const rect = logoSlotRef.current.getBoundingClientRect();
    window.dispatchEvent(
      new CustomEvent('codestars-logo-slot-update', {
        detail: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        },
      })
    );
  }, []);

  useEffect(() => {
    broadcastSlotRect();
    window.addEventListener('resize', broadcastSlotRect);
    return () => window.removeEventListener('resize', broadcastSlotRect);
  }, [broadcastSlotRect, currentRoute]);

  // Scroll merge tracking
  useEffect(() => {
    if (currentRoute !== 'home') {
      setMergeProgress(1);
      setRawPVal(1);
      setScrolled(true);
      return undefined;
    }

    let frame;
    const onScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      // p = clamp(scrollY / (0.8 * window.innerHeight), 0, 1)
      const rawP = Math.max(0, Math.min(1, scrollY / (0.8 * vh)));
      // easeInOutCubic curve
      const eased = rawP < 0.5 ? 4 * rawP * rawP * rawP : 1 - Math.pow(-2 * rawP + 2, 3) / 2;

      setRawPVal(rawP);
      setMergeProgress(eased);
      setScrolled(scrollY > 20);
      broadcastSlotRect();
    };

    const requestUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(onScroll);
    };

    onScroll();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
    };
  }, [currentRoute, broadcastSlotRect]);

  const handleItemClick = (e, item) => {
    if (item.isExternal) return;

    e.preventDefault();
    if (onNavigate) {
      onNavigate(item.route);
    } else {
      window.location.hash = item.hash;
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('home');
    } else {
      window.location.hash = '#home';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Expand logo slot width as scroll progresses from 0 to 1
  // On inner pages it is fully 145px
  const isInner = currentRoute !== 'home';
  const logoSlotWidth = isInner ? 145 : Math.round(mergeProgress * 145);
  // Docked & visible only when rawP reaches about 0.97
  const isDocked = isInner || rawPVal >= 0.97;

  return (
    <>
      <header
        ref={navRef}
        className={`codestars-navbar-pill ${scrolled ? 'is-scrolled' : ''} ${isInner ? 'is-inner-page' : ''} ${logoSlotWidth > 5 ? 'is-expanded' : ''}`}
        aria-label="Main Navigation"
      >
        <div className="navbar-pill-glass-filter" aria-hidden="true" />
        <div className="navbar-pill-glass-overlay" aria-hidden="true" />
        <div className="navbar-pill-glass-specular" aria-hidden="true" />

        <div className="navbar-pill-inner">
          {/* Logo slot that expands smoothly from width 0 to 145px */}
          <div
            ref={logoSlotRef}
            className="navbar-logo-slot-expanding"
            style={{
              width: `${logoSlotWidth}px`,
              opacity: isInner ? 1 : (mergeProgress > 0.02 ? 1 : 0),
            }}
          >
            <a
              href="#home"
              className={`navbar-docked-logo ${isDocked ? 'is-visible' : ''}`}
              onClick={handleLogoClick}
              aria-label="DJS CodeStars Home"
              tabIndex={isDocked ? 0 : -1}
            >
              <span className="navbar-logo-djs">DJS</span>
              <span className="navbar-logo-codestars">CodeStars</span>
            </a>
          </div>

          {/* Navigation Items (Short pill at rest when logo slot width is 0) */}
          <nav className="navbar-items-group" aria-label="Desktop menu">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = !item.isExternal && currentRoute === item.route;

              return (
                <div key={item.id} className="navbar-item-wrapper">
                  <a
                    href={item.isExternal ? item.url : item.hash}
                    target={item.isExternal ? '_blank' : undefined}
                    rel={item.isExternal ? 'noopener noreferrer' : undefined}
                    className={`navbar-nav-btn ${isActive ? 'is-active' : ''}`}
                    onClick={(e) => handleItemClick(e, item)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="navbar-icon-box">
                      {isActive && <span className="navbar-active-glow-pill" aria-hidden="true" />}
                      <Icon size={19} className="navbar-icon" />
                    </div>
                    <span className="navbar-item-label">{item.label}</span>
                  </a>
                </div>
              );
            })}
          </nav>

          {/* Back to Home Button on inner pages */}
          {isInner && (
            <div className="navbar-back-wrap">
              <button
                type="button"
                className="navbar-back-home-btn"
                onClick={handleLogoClick}
                title="Return to Home"
                aria-label="Return to Home page"
              >
                <ArrowLeft size={14} />
                <span>Back to Home</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bottom Dock (<= 640px) */}
      <nav className="codestars-mobile-dock" aria-label="Mobile Navigation">
        <div className="mobile-dock-glass-filter" aria-hidden="true" />
        <div className="mobile-dock-glass-overlay" aria-hidden="true" />
        <div className="mobile-dock-inner">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = !item.isExternal && currentRoute === item.route;

            return (
              <a
                key={item.id}
                href={item.isExternal ? item.url : item.hash}
                target={item.isExternal ? '_blank' : undefined}
                rel={item.isExternal ? 'noopener noreferrer' : undefined}
                className={`mobile-dock-btn ${isActive ? 'is-active' : ''}`}
                onClick={(e) => handleItemClick(e, item)}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="mobile-icon-box">
                  {isActive && <span className="mobile-active-indicator" aria-hidden="true" />}
                  <Icon size={18} className="mobile-dock-icon" />
                </div>
                <span className="mobile-dock-label">{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
