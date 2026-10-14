import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { heroData } from '../data/home';
import Starfield from '../components/home/Starfield';
import WhatWeAre from '../components/home/WhatWeAre';
import FeaturedEvents from '../components/home/FeaturedEvents';
import Announcements from '../components/home/Announcements';
import Footer from '../components/Footer';
import './Home.css';

export default function Home({ onNavigate }) {
  const [scrollY, setScrollY] = useState(0);
  const [introState, setIntroState] = useState(() => {
    if (typeof window === 'undefined') {
      return { bg: true, tagline: true, navbar: true, chevron: true, isDone: true };
    }
    const played = !!sessionStorage.getItem('codestars_intro_played');
    return { bg: played, tagline: played, navbar: played, chevron: played, isDone: played };
  });

  const heroSectionRef = useRef(null);

  // Cinematic Intro: 2.6s total sequence
  // 1. 0.00 - 0.90s: background fades in (navy radial glow and starfield opacity 0 -> 1)
  // 2. 0.35 - 1.75s: wordmark fades in (handled in HeroWordmark.jsx via CSS transition & timeout)
  // 3. 1.45 - 2.10s: tagline fades in (opacity 0 -> 1, drift 8px -> 0)
  // 4. 1.80 - 2.40s: navbar fades in and slides down 10px (page scrolling unlocks)
  // 5. 2.10 - 2.60s: chevron and hairline-with-star fade in
  useEffect(() => {
    const played = sessionStorage.getItem('codestars_intro_played');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!played && !reduced) {
      // Lock scroll until step 4 (1.80s)
      document.body.style.overflow = 'hidden';

      // Step 1: background fades in immediately (0.00s)
      const tBg = setTimeout(() => {
        setIntroState((prev) => ({ ...prev, bg: true }));
      }, 30);

      // Step 3: tagline fades in at 1.45s
      const tTagline = setTimeout(() => {
        setIntroState((prev) => ({ ...prev, tagline: true }));
      }, 1450);

      // Step 4: navbar fades in at 1.80s (unlock scrolling)
      const tNavbar = setTimeout(() => {
        document.body.style.overflow = '';
        setIntroState((prev) => ({ ...prev, navbar: true }));
        window.dispatchEvent(new CustomEvent('codestars-navbar-reveal'));
      }, 1800);

      // Step 5: chevron & hairline at 2.10s
      const tChevron = setTimeout(() => {
        setIntroState((prev) => ({ ...prev, chevron: true, isDone: true }));
        sessionStorage.setItem('codestars_intro_played', 'true');
        window.dispatchEvent(new CustomEvent('codestars-intro-complete'));
      }, 2100);

      // Skip instantly on scroll, click or keydown (finish transitions in 200ms)
      const handleSkip = () => {
        clearTimeout(tBg);
        clearTimeout(tTagline);
        clearTimeout(tNavbar);
        clearTimeout(tChevron);
        document.body.style.overflow = '';
        setIntroState({ bg: true, tagline: true, navbar: true, chevron: true, isDone: true });
        sessionStorage.setItem('codestars_intro_played', 'true');
        window.dispatchEvent(new CustomEvent('codestars-intro-skip'));
        window.dispatchEvent(new CustomEvent('codestars-navbar-reveal'));
        window.dispatchEvent(new CustomEvent('codestars-intro-complete'));
      };

      window.addEventListener('click', handleSkip, { once: true });
      window.addEventListener('keydown', handleSkip, { once: true });

      const onScrollCheck = () => {
        if (window.scrollY > 10) handleSkip();
      };
      window.addEventListener('scroll', onScrollCheck, { passive: true, once: true });

      return () => {
        clearTimeout(tBg);
        clearTimeout(tTagline);
        clearTimeout(tNavbar);
        clearTimeout(tChevron);
        document.body.style.overflow = '';
        window.removeEventListener('click', handleSkip);
        window.removeEventListener('keydown', handleSkip);
        window.removeEventListener('scroll', onScrollCheck);
      };
    } else {
      document.body.style.overflow = '';
      setIntroState({ bg: true, tagline: true, navbar: true, chevron: true, isDone: true });
      window.dispatchEvent(new CustomEvent('codestars-navbar-reveal'));
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

  // Hero Scroll Bug Fixes:
  // a) Tagline and chevron: opacity = 1 - clamp(p / 0.25, 0, 1)
  // pointer-events none once below 0.1
  const taglineChevronOpacity = Math.max(0, 1 - Math.min(1, p / 0.25));
  const isTaglineInteractive = taglineChevronOpacity >= 0.1;

  // Hairline and starfield: fade out by p = 0.5 (opacity = 1 - clamp(p / 0.5, 0, 1))
  const hairlineStarfieldOpacity = Math.max(0, 1 - Math.min(1, p / 0.5));

  // Hero pointer hover logic: active only while p < 0.05, throttled with rAF
  useEffect(() => {
    const heroEl = heroSectionRef.current;
    if (!heroEl) return;

    let rafId = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isHovering = false;

    const updateVars = () => {
      // Lerp smooth follow (~0.08 per frame)
      const factor = isHovering ? 0.08 : 0.05;
      currentX += (targetX - currentX) * factor;
      currentY += (targetY - currentY) * factor;

      if (Math.abs(currentX) < 0.001 && Math.abs(targetX) < 0.001) currentX = 0;
      if (Math.abs(currentY) < 0.001 && Math.abs(targetY) < 0.001) currentY = 0;

      heroEl.style.setProperty('--hero-ptr-x', currentX.toFixed(4));
      heroEl.style.setProperty('--hero-ptr-y', currentY.toFixed(4));

      // Spotlight coordinates for text gradient (in percentage)
      const spotlightX = (50 + currentX * 40).toFixed(2);
      const spotlightY = (50 + currentY * 40).toFixed(2);
      heroEl.style.setProperty('--hero-spotlight-x', `${spotlightX}%`);
      heroEl.style.setProperty('--hero-spotlight-y', `${spotlightY}%`);

      if (isHovering || Math.abs(currentX) > 0.002 || Math.abs(currentY) > 0.002) {
        rafId = requestAnimationFrame(updateVars);
      } else {
        heroEl.style.removeProperty('--hero-ptr-x');
        heroEl.style.removeProperty('--hero-ptr-y');
        heroEl.style.removeProperty('--hero-spotlight-x');
        heroEl.style.removeProperty('--hero-spotlight-y');
        rafId = null;
      }
    };

    const onPointerMove = (e) => {
      // Disabled on touch devices, prefers-reduced-motion, or when scrolled (p >= 0.05)
      if (
        window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        window.scrollY > 40
      ) {
        return;
      }

      const rect = heroEl.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1 to 1
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1; // -1 to 1

      targetX = Math.max(-1, Math.min(1, nx));
      targetY = Math.max(-1, Math.min(1, ny));
      isHovering = true;
      heroEl.classList.add('is-hero-hovered');

      if (!rafId) {
        rafId = requestAnimationFrame(updateVars);
      }
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      isHovering = false;
      heroEl.classList.remove('is-hero-hovered');
      if (!rafId) {
        rafId = requestAnimationFrame(updateVars);
      }
    };

    heroEl.addEventListener('pointermove', onPointerMove, { passive: true });
    heroEl.addEventListener('pointerleave', onPointerLeave, { passive: true });

    return () => {
      heroEl.removeEventListener('pointermove', onPointerMove);
      heroEl.removeEventListener('pointerleave', onPointerLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

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
        {/* Background Navy Radial Glow & Starfield (fades in step 1, fades out by p = 0.5) */}
        <div
          className={`hero-navy-glow ${introState.bg ? 'is-revealed' : ''}`}
          style={{ opacity: introState.bg ? hairlineStarfieldOpacity : 0 }}
          aria-hidden="true"
        />
        <div
          className={`hero-horizon-glow ${introState.bg ? 'is-revealed' : ''}`}
          style={{ opacity: introState.bg ? hairlineStarfieldOpacity : 0 }}
          aria-hidden="true"
        />

        <div
          className={`hero-starfield-wrapper ${introState.bg ? 'is-revealed' : ''}`}
          style={{ opacity: introState.bg ? hairlineStarfieldOpacity : 0 }}
          aria-hidden="true"
        >
          <Starfield />
        </div>

        {/* Semantic H1 for accessibility */}
        <h1 className="sr-only">DJS CodeStars — Community of builders and competitive programmers</h1>

        {/* Centered Wordmark Anchor Div (Centered horizontally, at ~42vh)
            Used solely for layout and measurement of HeroWordmark.
            Its height matches the rendered wordmark block's height */}
        <div
          id="hero-wordmark-anchor"
          className="hero-wordmark-anchor is-centered"
        >
          {/* Sizing box so anchor has exact width & height of the wordmark */}
          <div className="hero-wordmark-measure-box" aria-hidden="true" />
        </div>

        {/* Centered Tagline directly beneath the wordmark anchor:
            Positioned from measured wordmark rect, margin-top >= 32px (and >= 0.9x CodeStars cap height).
            Fades in step 3 (1.45-2.10s) and fades out by p = 0.25 on scroll.
            Counter-parallax moves slightly counter to pointer (~4px) */}
        <div
          className={`hero-tagline-wrap ${introState.tagline ? 'is-revealed' : ''}`}
          style={{
            opacity: introState.tagline ? taglineChevronOpacity : 0,
            pointerEvents: isTaglineInteractive ? 'auto' : 'none',
          }}
        >
          <p className="hero-tagline-text">{heroData.tagline}</p>
        </div>

        {/* Thin Gold Hairline with small star glyph in center at bottom of hero:
            Fades in step 5 (2.10-2.60s) and fades out by p = 0.5 on scroll */}
        <div
          className={`hero-bottom-hairline-wrap ${introState.chevron ? 'is-revealed' : ''}`}
          style={{ opacity: introState.chevron ? hairlineStarfieldOpacity : 0 }}
          aria-hidden="true"
        >
          <div className="hero-bottom-hairline-line" />
          <div className="hero-bottom-star-glyph">✦</div>
          <div className="hero-bottom-hairline-line" />
        </div>

        {/* Chevron button centered at bottom, just above the hairline:
            Fades in step 5 (2.10-2.60s) and fades out by p = 0.25 on scroll */}
        <div
          className={`hero-chevron-anchor ${introState.chevron ? 'is-revealed' : ''}`}
          style={{
            opacity: introState.chevron ? taglineChevronOpacity : 0,
            pointerEvents: isTaglineInteractive ? 'auto' : 'none',
          }}
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
      </section>

      {/* ================= 2. WHAT WE ARE ================= */}
      <WhatWeAre />

      {/* ================= 3. FEATURED EVENTS (3D COVERFLOW) ================= */}
      <FeaturedEvents onNavigate={onNavigate} />

      {/* ================= 4. LATEST ANNOUNCEMENTS ================= */}
      <Announcements onNavigate={onNavigate} />

      {/* ================= 6. FOOTER ================= */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
