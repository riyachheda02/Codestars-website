import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  House,
  Calendar,
  Terminal,
  BookOpen,
  Users,
  Image as ImageIcon,
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
  const [navVisible, setNavVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (currentRoute !== 'home') return true;
    return !!sessionStorage.getItem('codestars_intro_played');
  });
  // Auto-hide state for inner pages (scrolled down past 120px)
  const [isNavHiddenOnScroll, setIsNavHiddenOnScroll] = useState(false);

  const navRef = useRef(null);
  const logoSlotRef = useRef(null);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleReveal = () => setNavVisible(true);
    window.addEventListener('codestars-navbar-reveal', handleReveal);
    window.addEventListener('codestars-intro-complete', handleReveal);
    return () => {
      window.removeEventListener('codestars-navbar-reveal', handleReveal);
      window.removeEventListener('codestars-intro-complete', handleReveal);
    };
  }, []);

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

  // Scroll merge tracking (Home page) & Auto-hide tracking (Inner pages)
  useEffect(() => {
    lastScrollYRef.current = window.scrollY || 0;

    if (currentRoute === 'home') {
      // Home page: no auto-hide, only merge logic
      setIsNavHiddenOnScroll(false);

      const updateWithP = (rawP) => {
        const eased = rawP < 0.5 ? 4 * rawP * rawP * rawP : 1 - Math.pow(-2 * rawP + 2, 3) / 2;
        setRawPVal(rawP);
        setMergeProgress(eased);
        setScrolled(rawP > 0.1 || window.scrollY > 20);
        broadcastSlotRect();
      };

      const handleHeroProgress = (e) => {
        if (typeof e.detail?.progress === 'number') {
          updateWithP(e.detail.progress);
        }
      };

      let frame;
      const onScroll = () => {
        const scrollY = window.scrollY;
        // Direct scroll fallback if scrolled past hero without trigger
        if (scrollY > 120 && rawPVal < 1) {
          updateWithP(1);
        } else if (scrollY === 0 && rawPVal > 0) {
          updateWithP(0);
        }
        setScrolled(scrollY > 20);
        broadcastSlotRect();
      };

      const requestUpdate = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(onScroll);
      };

      window.addEventListener('codestars-hero-progress', handleHeroProgress);
      window.addEventListener('scroll', requestUpdate, { passive: true });
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('codestars-hero-progress', handleHeroProgress);
        window.removeEventListener('scroll', requestUpdate);
      };
    }

    // Inner pages:
    setMergeProgress(1);
    setRawPVal(1);
    setScrolled(true);
    setIsNavHiddenOnScroll(false);

    let scrollRafId = null;

    const handleInnerScroll = () => {
      const currentScrollY = window.scrollY;
      const prevScrollY = lastScrollYRef.current;
      const delta = currentScrollY - prevScrollY;

      if (currentScrollY < 80) {
        setIsNavHiddenOnScroll(false);
      } else if (Math.abs(delta) >= 8) {
        if (delta > 0 && currentScrollY > 120) {
          // Scrolling down past 120px: hide
          setIsNavHiddenOnScroll(true);
        } else if (delta < 0) {
          // Scrolling up: show
          setIsNavHiddenOnScroll(false);
        }
      }

      lastScrollYRef.current = currentScrollY;
    };

    const onScrollThrottled = () => {
      if (scrollRafId) return;
      scrollRafId = requestAnimationFrame(() => {
        handleInnerScroll();
        scrollRafId = null;
      });
    };

    // Keyboard focus & Tab key shows navbar
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setIsNavHiddenOnScroll(false);
      }
    };

    const handleFocusIn = () => {
      setIsNavHiddenOnScroll(false);
    };

    window.addEventListener('scroll', onScrollThrottled, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    const navEl = navRef.current;
    if (navEl) {
      navEl.addEventListener('focusin', handleFocusIn);
    }

    return () => {
      if (scrollRafId) cancelAnimationFrame(scrollRafId);
      window.removeEventListener('scroll', onScrollThrottled);
      window.removeEventListener('keydown', handleKeyDown);
      if (navEl) {
        navEl.removeEventListener('focusin', handleFocusIn);
      }
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

  const renderNavbarItems = (items) => items.map((item) => {
    const Icon = item.icon;
    const isActive = !item.isExternal && currentRoute === item.route;

    return (
      <div key={item.id} className="navbar-item-wrapper">
        <a
          href={item.isExternal ? item.url : item.hash}
          target={item.isExternal ? '_blank' : undefined}
          rel={item.isExternal ? 'noopener noreferrer' : undefined}
          className={`navbar-nav-btn ${isActive ? 'is-active' : ''}`}
          onClick={(event) => handleItemClick(event, item)}
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
  });

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('home');
    } else {
      window.location.hash = '#home';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isInner = currentRoute !== 'home';
  const targetSlotWidth = 98;
  const slotProgress = isInner ? 1 : Math.min(1, Math.max(0, rawPVal / 0.88));
  const logoSlotWidth = isInner ? targetSlotWidth : Math.round(slotProgress * targetSlotWidth);

  let t = 0;
  if (isInner) {
    t = 1;
  } else if (rawPVal <= 0.88) {
    t = 0;
  } else if (rawPVal >= 1.0) {
    t = 1;
  } else {
    const x = (rawPVal - 0.88) / (1.0 - 0.88);
    t = x * x * (3 - 2 * x); // smoothstep
  }

  return (
    <>
      <header
        ref={navRef}
        data-testid="navbar"
        className={`codestars-navbar-pill ${scrolled ? 'is-scrolled' : ''} ${isInner ? 'is-inner-page' : ''} ${logoSlotWidth > 5 ? 'is-expanded' : ''} ${!navVisible ? 'is-hidden-intro' : ''} ${isNavHiddenOnScroll ? 'is-nav-scroll-hidden' : ''}`}
        aria-label="Main Navigation"
      >
        <div className="navbar-pill-glass-filter" aria-hidden="true" />
        <div className="navbar-pill-glass-overlay" aria-hidden="true" />
        <div className="navbar-pill-glass-specular" aria-hidden="true" />

        <div
          className="navbar-pill-inner"
          style={{ '--nav-logo-slot-width': `${logoSlotWidth}px` }}
        >
          <nav className="navbar-items-group navbar-items-group-left" aria-label="Primary navigation">
            {renderNavbarItems(NAV_ITEMS.slice(0, 3))}
          </nav>

          <div
            ref={logoSlotRef}
            className="navbar-logo-slot-expanding"
            style={{
              width: `${logoSlotWidth}px`,
              opacity: isInner ? 1 : (logoSlotWidth > 0 ? 1 : 0),
            }}
          >
            <a
              href="#home"
              className={`navbar-docked-logo ${t > 0.01 ? 'is-active-crossfade' : ''}`}
              style={{
                opacity: t,
                pointerEvents: t > 0.5 ? 'auto' : 'none',
              }}
              onClick={handleLogoClick}
              aria-label="DJS CodeStars Home"
              tabIndex={t > 0.5 ? 0 : -1}
            >
              <span className="navbar-logo-djs">DJS</span>
              <span className="navbar-logo-codestars">CodeStars</span>
            </a>
          </div>

          <nav className="navbar-items-group navbar-items-group-right" aria-label="Secondary navigation">
            {renderNavbarItems(NAV_ITEMS.slice(3))}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Dock (<= 640px) */}
      <nav
        className={`codestars-mobile-dock ${isNavHiddenOnScroll ? 'is-dock-scroll-hidden' : ''}`}
        aria-label="Mobile Navigation"
      >
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
