import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';
import { heroData } from '../data/home';
import WhatWeAre from '../components/home/WhatWeAre';
import FeaturedEvents from '../components/home/FeaturedEvents';
import Achievements from '../components/home/Achievements';
import Announcements from '../components/home/Announcements';
import Footer from '../components/Footer';
import './Home.css';

// Code background tokens
const BG_CODE_TOKENS = [
  'python', 'c++', 'react', 'github', '0', '1', '{}', '</>',
  'async', 'void', 'const', 'git', 'dp', 'algo', 'icpc', 'tree',
  '1', '0', 'vector', 'int', 'return', 'class', 'let', 'fn'
];

export default function Home({ onNavigate }) {
  const [scrollY, setScrollY] = useState(0);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(true);
  const [animSequence, setAnimSequence] = useState({
    tagline: false,
    navbar: false,
    chevron: false,
  });

  const heroSectionRef = useRef(null);

  // Check sessionStorage and prefers-reduced-motion
  useEffect(() => {
    const played = sessionStorage.getItem('codestars_intro_played');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!played && !reduced) {
      setHasPlayedIntro(false);
      // Intro timeline sequence
      const timer1 = setTimeout(() => {
        setAnimSequence((prev) => ({ ...prev, tagline: true }));
      }, 1600);
      const timer2 = setTimeout(() => {
        setAnimSequence((prev) => ({ ...prev, navbar: true }));
      }, 2000);
      const timer3 = setTimeout(() => {
        setAnimSequence((prev) => ({ ...prev, chevron: true }));
        sessionStorage.setItem('codestars_intro_played', 'true');
        setHasPlayedIntro(true);
      }, 2400);

      const handleSkip = () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        setHasPlayedIntro(true);
        setAnimSequence({ tagline: true, navbar: true, chevron: true });
        sessionStorage.setItem('codestars_intro_played', 'true');
      };

      window.addEventListener('codestars-intro-complete', handleSkip, { once: true });
      window.addEventListener('click', handleSkip, { once: true });
      window.addEventListener('keydown', handleSkip, { once: true });

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        window.removeEventListener('codestars-intro-complete', handleSkip);
        window.removeEventListener('click', handleSkip);
        window.removeEventListener('keydown', handleSkip);
      };
    } else {
      setHasPlayedIntro(true);
      setAnimSequence({ tagline: true, navbar: true, chevron: true });
    }
  }, []);

  // Track scroll position
  useEffect(() => {
    let frame;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // p = clamp(scrollY / (0.8 * window.innerHeight), 0, 1)
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
  const p = Math.min(1, Math.max(0, scrollY / (0.8 * vh)));

  // Tagline, background tokens and chevron fade out between p = 0 and 0.5
  const heroContentOpacity = Math.max(0, 1 - p * 2);

  const scrollToNext = () => {
    document.getElementById('what-we-are')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="codestars-homepage-root">
      {/* ================= 1. HERO SECTION ================= */}
      <section
        id="hero"
        ref={heroSectionRef}
        className="codestars-hero-viewport"
        aria-label="Hero"
      >
        {/* Background Warm Radial Glow & Dotted Grid */}
        <div className="hero-warm-glow" aria-hidden="true" />
        <div className="hero-dotted-grid" aria-hidden="true" />

        {/* Faint drifting code tokens */}
        <div className="hero-floating-tokens" style={{ opacity: heroContentOpacity }} aria-hidden="true">
          {BG_CODE_TOKENS.map((token, i) => (
            <span
              key={i}
              className={`bg-code-token token-drift-${(i % 6) + 1}`}
              style={{
                top: `${(i * 19) % 85 + 6}%`,
                left: `${(i * 29) % 90 + 4}%`,
              }}
            >
              {token}
            </span>
          ))}
        </div>

        {/* Semantic H1 for accessibility */}
        <h1 className="sr-only">DJS CodeStars — Community of builders and competitive programmers</h1>

        {/* The Measured Wordmark Anchor Div (Left-Weighted, ~7vw left, ~52vw width, ~40vh top)
            Used solely for layout and measurement of HeroWordmark. No duplicate text inside! */}
        <div
          id="hero-wordmark-anchor"
          className="hero-wordmark-anchor"
        >
          {/* Sizing box so anchor has exact width & height of the wordmark (prefix + main wordmark) */}
          <div className="hero-wordmark-measure-box" aria-hidden="true" />

          {/* Centered Tagline under wordmark's width */}
          <div
            className={`hero-tagline-wrap ${animSequence.tagline || hasPlayedIntro ? 'is-revealed' : ''}`}
            style={{ opacity: heroContentOpacity }}
          >
            <p className="hero-tagline-text">{heroData.tagline}</p>
          </div>
        </div>

        {/* Animated Layered Translucent Waves at the bottom edge */}
        <div className="hero-bottom-waves" aria-hidden="true">
          <svg className="hero-wave-svg wave-back" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path
              d="M0,45 C320,85 540,15 720,50 C900,85 1140,25 1440,60 L1440,120 L0,120 Z"
              fill="var(--bg-warm-2)"
              fillOpacity="0.45"
            />
          </svg>
          <svg className="hero-wave-svg wave-mid" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path
              d="M0,60 C260,20 520,75 760,45 C1000,15 1220,70 1440,40 L1440,120 L0,120 Z"
              fill="var(--bg-warm)"
              fillOpacity="0.7"
            />
          </svg>
          <svg className="hero-wave-svg wave-front" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path
              d="M0,75 C340,35 600,90 840,65 C1080,40 1260,85 1440,65 L1440,120 L0,120 Z"
              fill="var(--bg)"
            />
          </svg>

          {/* Chevron button centered on the waves */}
          <div
            className={`hero-chevron-anchor ${animSequence.chevron || hasPlayedIntro ? 'is-revealed' : ''}`}
            style={{ opacity: heroContentOpacity }}
          >
            <button
              type="button"
              className="hero-chevron-btn"
              onClick={scrollToNext}
              aria-label="Scroll down to What we are section"
            >
              <ArrowDown size={17} className="hero-chevron-icon" />
            </button>
          </div>
        </div>
      </section>

      {/* ================= 2. WHAT WE ARE ================= */}
      <WhatWeAre />

      {/* ================= 3. FEATURED EVENTS (3D COVERFLOW) ================= */}
      <FeaturedEvents onNavigate={onNavigate} />

      {/* ================= 4. ACHIEVEMENTS (AWARDS) ================= */}
      <Achievements />

      {/* ================= 5. LATEST ANNOUNCEMENTS ================= */}
      <Announcements onNavigate={onNavigate} />

      {/* ================= 6. FOOTER ================= */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
