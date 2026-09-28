import React, { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import codestarsLogo from '../assets/djs_codestarsLogo.jpeg';
import './Navbar.css';

export default function Navbar({
  currentRoute = 'home',
  onNavigate,
  selectedYear = '2026',
  onYearChange,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const handleNavClick = (e, target) => {
    e.preventDefault();
    setMenuOpen(false);
    if (onNavigate) {
      onNavigate(target);
    } else {
      window.location.hash = target === 'home' ? '#' : `#${target}`;
    }
  };

  return (
    <header className="app-navbar-sticky">
      {/* Left: Brand CODESTARS */}
      <div className="app-nav-brand">
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, 'home')}
          title="DJS CodeStars Home"
        >
          CODESTARS
        </a>
      </div>

      {/* Center: Full Menu with Circular Logo */}
      <button
        type="button"
        className="app-nav-menu-toggle"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={21} />}
      </button>

      <nav className={`app-nav-center ${menuOpen ? 'is-open' : ''}`} aria-label="Main Navigation">
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
          Events
        </a>

        <a
          href="https://codeuncode.djscodestars.in/"
          className="app-nav-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Code UnCode
        </a>

        {/* Circular CodeStars Logo in center */}
        <a
          href="#home"
          className="app-nav-logo-circle"
          onClick={(e) => handleNavClick(e, 'home')}
          title="DJS CodeStars Home"
        >
          <img
            src={codestarsLogo}
            alt="DJS CodeStars Logo"
            className="app-nav-logo-img"
          />
        </a>

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
      </nav>

      {/* Right: Year Switcher on Home / Back to Home on other pages */}
      <div className="app-nav-right">
        {currentRoute === 'home' ? (
          <div className="app-nav-year-switcher">
            <span className="app-year-label">ARCHIVE</span>
            <div className="app-year-toggle-group">
              <button
                type="button"
                className={`app-year-btn ${selectedYear === '2026' ? 'active' : ''}`}
                onClick={() => onYearChange && onYearChange('2026')}
                title="Switch to 2026 photos"
              >
                2026
              </button>
              <span className="app-year-divider">/</span>
              <button
                type="button"
                className={`app-year-btn ${selectedYear === '2025' ? 'active' : ''}`}
                onClick={() => onYearChange && onYearChange('2025')}
                title="Switch to 2025 photos"
              >
                2025
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="app-nav-back-btn"
            onClick={(e) => handleNavClick(e, 'home')}
            title="Return to Home"
          >
            <ArrowRight size={13} style={{ transform: 'rotate(180deg)' }} />
            <span>Back to Home</span>
          </button>
        )}
      </div>
    </header>
  );
}
