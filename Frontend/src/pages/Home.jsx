import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  // Hero Merge State Machine: 'hero' | 'toMerged' | 'merged' | 'toHero'
  const [heroState, setHeroState] = useState(() => {
    if (typeof window !== 'undefined' && window.scrollY > 40) return 'merged';
    return 'hero';
  });
  const heroStateRef = useRef(typeof window !== 'undefined' && window.scrollY > 40 ? 'merged' : 'hero');
  const [heroMergeProgress, setHeroMergeProgress] = useState(typeof window !== 'undefined' && window.scrollY > 40 ? 1 : 0);
  const heroMergeProgressRef = useRef(typeof window !== 'undefined' && window.scrollY > 40 ? 1 : 0);
  const isAnimatingRef = useRef(false);
  const animCancelRef = useRef(null);
  const [sectionAnimStyle, setSectionAnimStyle] = useState(null);
  const [isReversePhaseA, setIsReversePhaseA] = useState(false);

  const updateHeroState = useCallback((nextState, isPhaseA = false) => {
    heroStateRef.current = nextState;
    setHeroState(nextState);
    setIsReversePhaseA(isPhaseA);
    window.__heroState = nextState;
    window.dispatchEvent(
      new CustomEvent('codestars-hero-state-change', {
        detail: { state: nextState, isPhaseA },
      })
    );
  }, []);

  // Snap to target state without animation on interrupt (anchor jump, page reload, scrollbar drag)
  const snapToState = useCallback((targetState) => {
    if (animCancelRef.current) {
      animCancelRef.current();
      animCancelRef.current = null;
    }
    isAnimatingRef.current = false;
    window.__isHeroAnimating = false;

    if (targetState === 'hero') {
      heroMergeProgressRef.current = 0;
      setHeroMergeProgress(0);
      window.dispatchEvent(new CustomEvent('codestars-hero-progress', { detail: { progress: 0 } }));
      setSectionAnimStyle(null);
      updateHeroState('hero', false);
      window.scrollTo(0, 0);
    } else {
      heroMergeProgressRef.current = 1;
      setHeroMergeProgress(1);
      window.dispatchEvent(new CustomEvent('codestars-hero-progress', { detail: { progress: 1 } }));
      setSectionAnimStyle(null);
      updateHeroState('merged', false);
    }
  }, [updateHeroState]);

  // Cubic bezier easing helper
  const cubicBezier = (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return 1 - Math.pow(1 - t, 3.2);
  };

  // State-machine gated transitions
  const animateHero = useCallback((targetProgress) => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      window.__isHeroAnimating = true;

      if (targetProgress === 0) {
        // Reduced motion reverse: 150ms crossfade with gate
        updateHeroState('toHero', true);
        setSectionAnimStyle({ opacity: 0, transition: 'opacity 150ms ease' });
        setTimeout(() => {
          // Gate verified: section opacity is 0
          window.scrollTo(0, 0);
          heroMergeProgressRef.current = 0;
          setHeroMergeProgress(0);
          window.dispatchEvent(new CustomEvent('codestars-hero-progress', { detail: { progress: 0 } }));
          updateHeroState('hero', false);
          setSectionAnimStyle(null);
          isAnimatingRef.current = false;
          window.__isHeroAnimating = false;
        }, 150);
      } else {
        // Reduced motion forward: 150ms crossfade
        updateHeroState('toMerged', false);
        heroMergeProgressRef.current = 1;
        setHeroMergeProgress(1);
        window.dispatchEvent(new CustomEvent('codestars-hero-progress', { detail: { progress: 1 } }));
        setSectionAnimStyle({ opacity: 1, transition: 'opacity 150ms ease' });
        setTimeout(() => {
          updateHeroState('merged', false);
          setSectionAnimStyle(null);
          isAnimatingRef.current = false;
          window.__isHeroAnimating = false;
        }, 150);
      }
      return;
    }

    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    window.__isHeroAnimating = true;

    const isForward = targetProgress === 1;

    if (isForward) {
      // FORWARD TRANSITION (hero -> merged):
      // Sections set visible BEFORE fade-in begins.
      // 0 to 600ms: Wordmark shrinks/travels into navbar (progress 0 -> 1).
      // Section content begins fade-in only when wordmark opacity is at or below 0.15 (~350ms).
      // Mirror rule: Section content opacity <= 0.02 while wordmark > 0.15.
      updateHeroState('toMerged', false);
      const startTime = performance.now();
      let rafId = null;

      animCancelRef.current = () => {
        if (rafId) cancelAnimationFrame(rafId);
      };

      const stepForward = (now) => {
        const elapsed = Math.max(0, now - startTime);

        // 1. Hero wordmark: 0 - 600ms (0 -> 1)
        const wordmarkT = Math.min(1, elapsed / 600);
        const currentP = cubicBezier(wordmarkT);
        heroMergeProgressRef.current = currentP;
        setHeroMergeProgress(currentP);
        window.dispatchEvent(new CustomEvent('codestars-hero-progress', { detail: { progress: currentP } }));

        // Wordmark reaches navbar landing and opacity drops below 0.15 by ~390ms.
        // Before 400ms: Section content opacity MUST be <= 0.02 (strict mirror rule).
        if (elapsed < 400) {
          setSectionAnimStyle({ opacity: 0, transform: 'translate3d(0, 24px, 0)' });
        } else {
          const sectionT = Math.min(1, (elapsed - 400) / 500);
          const easeSection = cubicBezier(sectionT);
          const secOpacity = easeSection;
          const secTranslateY = (1 - easeSection) * 24;
          setSectionAnimStyle({
            opacity: secOpacity,
            transform: `translate3d(0, ${secTranslateY.toFixed(2)}px, 0)`,
          });
        }

        if (elapsed < 900) {
          rafId = requestAnimationFrame(stepForward);
        } else {
          // Final merged state
          heroMergeProgressRef.current = 1;
          setHeroMergeProgress(1);
          window.dispatchEvent(new CustomEvent('codestars-hero-progress', { detail: { progress: 1 } }));
          setSectionAnimStyle(null);
          updateHeroState('merged', false);
          isAnimatingRef.current = false;
          window.__isHeroAnimating = false;
          animCancelRef.current = null;
        }
      };

      rafId = requestAnimationFrame(stepForward);
    } else {
      // REVERSE TRANSITION (merged -> hero):
      // Strict Phase A -> Gate -> Phase B
      updateHeroState('toHero', true);

      // Phase A: Section out (0 to 350ms):
      // Section fades to opacity 0 and moves down 16px.
      // Wordmark, tagline, and decorations have opacity 0 and visibility hidden.
      // Sections pointer-events none.
      const phaseAStartTime = performance.now();
      const phaseADuration = 350;
      let rafIdA = null;

      animCancelRef.current = () => {
        if (rafIdA) cancelAnimationFrame(rafIdA);
      };

      const runPhaseA = () => {
        return new Promise((resolve) => {
          const stepPhaseA = (now) => {
            const elapsed = Math.max(0, now - phaseAStartTime);
            const t = Math.min(1, elapsed / phaseADuration);
            const ease = cubicBezier(t);
            const opacity = 1 - ease;
            const translateY = ease * 16;

            setSectionAnimStyle({
              opacity,
              transform: `translate3d(0, ${translateY.toFixed(2)}px, 0)`,
              pointerEvents: 'none',
            });

            if (elapsed < phaseADuration) {
              rafIdA = requestAnimationFrame(stepPhaseA);
            } else {
              // Ensure opacity is strictly 0 and translateY 16px
              setSectionAnimStyle({
                opacity: 0,
                transform: 'translate3d(0, 16px, 0)',
                pointerEvents: 'none',
              });
              resolve();
            }
          };
          rafIdA = requestAnimationFrame(stepPhaseA);
        });
      };

      runPhaseA().then(() => {
        // GATE: Verify section content opacity is <= 0.02
        const whatWeAreEl = document.querySelector('.what-we-are-content-wrap');
        const computedSecOpacity = whatWeAreEl
          ? parseFloat(window.getComputedStyle(whatWeAreEl).opacity || '0')
          : 0;

        if (computedSecOpacity > 0.02) {
          // Hard gate guard: force 0 before Phase B starts
          if (whatWeAreEl) whatWeAreEl.style.opacity = '0';
        }

        // Phase B: Hero in (350 to 950ms -> 600ms duration)
        // Switch off isReversePhaseA so hero wordmark and viewport can render
        setIsReversePhaseA(false);
        window.dispatchEvent(
          new CustomEvent('codestars-hero-state-change', {
            detail: { state: 'toHero', isPhaseA: false },
          })
        );
        window.scrollTo(0, 0);

        const phaseBStartTime = performance.now();
        const phaseBDuration = 600;
        let rafIdB = null;

        animCancelRef.current = () => {
          if (rafIdB) cancelAnimationFrame(rafIdB);
        };

        const stepPhaseB = (now) => {
          const elapsed = Math.max(0, now - phaseBStartTime);
          const t = Math.min(1, elapsed / phaseBDuration);
          const ease = cubicBezier(t);
          const currentP = 1 - ease;

          heroMergeProgressRef.current = currentP;
          setHeroMergeProgress(currentP);
          window.dispatchEvent(new CustomEvent('codestars-hero-progress', { detail: { progress: currentP } }));

          if (elapsed < phaseBDuration) {
            rafIdB = requestAnimationFrame(stepPhaseB);
          } else {
            // Final hero state
            heroMergeProgressRef.current = 0;
            setHeroMergeProgress(0);
            window.dispatchEvent(new CustomEvent('codestars-hero-progress', { detail: { progress: 0 } }));
            setSectionAnimStyle(null);
            window.scrollTo(0, 0);
            updateHeroState('hero', false);
            isAnimatingRef.current = false;
            window.__isHeroAnimating = false;
            animCancelRef.current = null;
          }
        };

        rafIdB = requestAnimationFrame(stepPhaseB);
      });
    }
  }, [cubicBezier, updateHeroState]);

  // Listen to gestures on window for single-scroll trigger with input locking
  useEffect(() => {
    let touchStartY = null;

    const handleWheel = (e) => {
      if (isAnimatingRef.current) {
        e.preventDefault();
        return;
      }

      const currentY = window.scrollY;
      const currentP = heroMergeProgressRef.current;

      // Downward gesture while expanded at top
      if (e.deltaY > 0 && currentY <= 15 && currentP < 0.5) {
        e.preventDefault();
        animateHero(1);
      }
      // Upward gesture while near top of document
      else if (e.deltaY < 0 && currentY <= 25 && currentP > 0.5) {
        e.preventDefault();
        animateHero(0);
      }
    };

    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (isAnimatingRef.current) {
        e.preventDefault?.();
        return;
      }
      if (touchStartY === null) return;
      const currentTouchY = e.touches[0].clientY;
      const deltaY = touchStartY - currentTouchY; // positive = swipe up / scroll down
      const currentY = window.scrollY;
      const currentP = heroMergeProgressRef.current;

      if (deltaY >= 20 && currentY <= 15 && currentP < 0.5) {
        touchStartY = null;
        e.preventDefault?.();
        animateHero(1);
      } else if (deltaY <= -20 && currentY <= 25 && currentP > 0.5) {
        touchStartY = null;
        e.preventDefault?.();
        animateHero(0);
      }
    };

    const handleKeyDown = (e) => {
      if (isAnimatingRef.current) {
        if (['ArrowDown', 'PageDown', ' ', 'ArrowUp', 'PageUp', 'Home', 'End'].includes(e.key)) {
          e.preventDefault();
        }
        return;
      }

      const currentY = window.scrollY;
      const currentP = heroMergeProgressRef.current;

      if (['ArrowDown', 'PageDown', ' '].includes(e.key) && currentY <= 15 && currentP < 0.5) {
        e.preventDefault();
        animateHero(1);
      } else if (['ArrowUp', 'PageUp'].includes(e.key) && currentY <= 25 && currentP > 0.5) {
        e.preventDefault();
        animateHero(0);
      }
    };

    // Scrollbar jump / direct scroll synchronization / interrupts
    const handleScrollSync = () => {
      const currentY = window.scrollY;
      if (isAnimatingRef.current) {
        // If user scrolls or jumps during an ongoing animation via scrollbar/wheel, snap to final
        if (currentY > 40 && heroStateRef.current !== 'merged') {
          snapToState('merged');
        } else if (currentY === 0 && heroStateRef.current !== 'hero') {
          snapToState('hero');
        }
        return;
      }

      if (currentY > 40 && heroMergeProgressRef.current < 1) {
        snapToState('merged');
      } else if (currentY === 0 && heroMergeProgressRef.current > 0) {
        snapToState('hero');
      }
    };

    // Listen to hash / popstate / beforeunload interrupts
    const handleInterrupt = () => {
      if (isAnimatingRef.current) {
        const currentY = window.scrollY;
        if (currentY > 40) {
          snapToState('merged');
        } else {
          snapToState('hero');
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollSync, { passive: true });
    window.addEventListener('popstate', handleInterrupt);
    window.addEventListener('hashchange', handleInterrupt);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollSync);
      window.removeEventListener('popstate', handleInterrupt);
      window.removeEventListener('hashchange', handleInterrupt);
    };
  }, [animateHero, snapToState]);

  // Track scroll position for secondary effects
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

  // p is driven by heroMergeProgress (time-based tween on gesture, or scroll snap)
  const p = heroMergeProgress;

  // Tagline and chevron: opacity = 1 - clamp(p / 0.25, 0, 1)
  const taglineChevronOpacity = Math.max(0, 1 - Math.min(1, p / 0.25));
  const isTaglineInteractive = taglineChevronOpacity >= 0.1 && heroState === 'hero';

  // Hairline and hero glow: fade out by p = 0.5
  const hairlineGlowOpacity = Math.max(0, 1 - Math.min(1, p / 0.5));

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
      const factor = isHovering ? 0.08 : 0.05;
      currentX += (targetX - currentX) * factor;
      currentY += (targetY - currentY) * factor;

      if (Math.abs(currentX) < 0.001 && Math.abs(targetX) < 0.001) currentX = 0;
      if (Math.abs(currentY) < 0.001 && Math.abs(targetY) < 0.001) currentY = 0;

      heroEl.style.setProperty('--hero-ptr-x', currentX.toFixed(4));
      heroEl.style.setProperty('--hero-ptr-y', currentY.toFixed(4));

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
      if (
        window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        window.scrollY > 40 ||
        heroMergeProgressRef.current > 0.05 ||
        heroStateRef.current !== 'hero'
      ) {
        return;
      }

      const rect = heroEl.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;

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
    animateHero(1);
  };

  return (
    <div
      className={`codestars-homepage-root ${isReversePhaseA ? 'is-reverse-phase-a' : ''}`}
      data-hero-state={heroState}
    >
      {/* Exactly ONE global fixed continuous Starfield across entire page */}
      <Starfield />

      {/* ================= 1. HERO SECTION ================= */}
      <section
        id="hero"
        ref={heroSectionRef}
        className={`codestars-hero-viewport ${heroState === 'merged' ? 'is-merged' : ''}`}
        aria-label="Hero"
        style={{
          opacity: heroState === 'merged' || isReversePhaseA ? 0 : Math.max(0, 1 - Math.min(1, p / 0.85)),
          pointerEvents: heroState === 'merged' || p >= 0.85 ? 'none' : 'auto',
          visibility: heroState === 'merged' || isReversePhaseA ? 'hidden' : 'visible',
        }}
      >
        {/* Background Navy Radial Glow (fades in step 1, fades out by p = 0.5) */}
        <div
          className={`hero-navy-glow ${introState.bg ? 'is-revealed' : ''}`}
          style={{ opacity: introState.bg ? hairlineGlowOpacity : 0 }}
          aria-hidden="true"
        />
        <div
          className={`hero-horizon-glow ${introState.bg ? 'is-revealed' : ''}`}
          style={{ opacity: introState.bg ? hairlineGlowOpacity : 0 }}
          aria-hidden="true"
        />

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
            opacity: introState.tagline && !isReversePhaseA ? taglineChevronOpacity : 0,
            pointerEvents: isTaglineInteractive ? 'auto' : 'none',
          }}
        >
          <p className="hero-tagline-text">{heroData.tagline}</p>
        </div>

        {/* Thin Gold Hairline with small star glyph in center at bottom of hero:
            Fades in step 5 (2.10-2.60s) and fades out by p = 0.5 on scroll */}
        <div
          className={`hero-bottom-hairline-wrap ${introState.chevron ? 'is-revealed' : ''}`}
          style={{ opacity: introState.chevron && !isReversePhaseA ? hairlineGlowOpacity : 0 }}
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
            opacity: introState.chevron && !isReversePhaseA ? taglineChevronOpacity : 0,
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
      <WhatWeAre
        contentStyle={sectionAnimStyle || undefined}
      />

      {/* ================= 3. FEATURED EVENTS (3D COVERFLOW) ================= */}
      <FeaturedEvents onNavigate={onNavigate} />

      {/* ================= 4. LATEST ANNOUNCEMENTS ================= */}
      <Announcements onNavigate={onNavigate} />

      {/* ================= 6. FOOTER ================= */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
