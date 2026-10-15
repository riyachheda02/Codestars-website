import React, { useEffect, useRef, useState, useCallback } from 'react';
import './HeroWordmark.css';

/**
 * Global constant for Hero Wordmark Font
 * Can be changed in ONE place.
 */
export const HERO_FONT = '"Orbitron", "Eurostile", "Segoe UI", sans-serif';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function HeroWordmark({
  currentRoute = 'home',
  customFont = HERO_FONT,
  previewMode = false,
}) {
  const [scrollY, setScrollY] = useState(0);
  const [anchorRect, setAnchorRect] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [introState, setIntroState] = useState(() => {
    if (typeof window === 'undefined') return { revealed: true, animDone: true, skipped: false };
    const played = !!sessionStorage.getItem('codestars_intro_played');
    return { revealed: played, animDone: played, skipped: false };
  });

  // Hero State tracking ('hero', 'toMerged', 'merged', 'toHero')
  const [heroState, setHeroState] = useState(() => {
    if (currentRoute !== 'home') return 'merged';
    if (typeof document !== 'undefined') {
      const root = document.querySelector('.codestars-homepage-root');
      return root?.getAttribute('data-hero-state') || 'hero';
    }
    return 'hero';
  });
  const [isReversePhaseA, setIsReversePhaseA] = useState(false);

  // Track the live logo slot rect broadcast from Navbar
  const [logoSlotRect, setLogoSlotRect] = useState(null);

  // Progress state: driven by codestars-hero-progress or scroll fallback
  const [heroProgress, setHeroProgress] = useState(0);

  useEffect(() => {
    if (previewMode) return;

    const handleHeroStateChange = (e) => {
      if (e.detail?.state) {
        setHeroState(e.detail.state);
        setIsReversePhaseA(!!e.detail.isPhaseA);
      }
    };

    const handleLogoSlotUpdate = (e) => {
      if (e.detail) setLogoSlotRect(e.detail);
    };

    window.addEventListener('codestars-hero-state-change', handleHeroStateChange);
    window.addEventListener('codestars-logo-slot-update', handleLogoSlotUpdate);
    return () => {
      window.removeEventListener('codestars-hero-state-change', handleHeroStateChange);
      window.removeEventListener('codestars-logo-slot-update', handleLogoSlotUpdate);
    };
  }, [previewMode]);

  // When navigating back to home, reset heroState
  useEffect(() => {
    if (currentRoute === 'home') {
      const scrollY = window.scrollY;
      if (scrollY <= 40) {
        setHeroState('hero');
        setHeroProgress(0);
      } else {
        setHeroState('merged');
        setHeroProgress(1);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoute]);

  const scrollYRef = useRef(0);

  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(isReduced);
  }, []);

  // First-load intro sequence listeners
  useEffect(() => {
    if (previewMode) {
      setIntroState({ revealed: true, animDone: true, skipped: false });
      return;
    }

    const played = sessionStorage.getItem('codestars_intro_played');
    if (played || reducedMotion) {
      setIntroState({ revealed: true, animDone: true, skipped: false });
      return;
    }

    // Step 2 starts at 0.35s: wordmark fades in (0.35 - 1.75s)
    const tWordmark = setTimeout(() => {
      setIntroState((prev) => ({ ...prev, revealed: true }));
    }, 350);

    // Filter removal once animation finishes (at 1.75s + buffer = 1.80s)
    const tDone = setTimeout(() => {
      setIntroState((prev) => ({ ...prev, animDone: true }));
    }, 1800);

    const handleSkip = () => {
      clearTimeout(tWordmark);
      clearTimeout(tDone);
      setIntroState({ revealed: true, animDone: true, skipped: true });
    };

    window.addEventListener('codestars-intro-skip', handleSkip);
    window.addEventListener('codestars-intro-complete', handleSkip);

    return () => {
      clearTimeout(tWordmark);
      clearTimeout(tDone);
      window.removeEventListener('codestars-intro-skip', handleSkip);
      window.removeEventListener('codestars-intro-complete', handleSkip);
    };
  }, [previewMode, reducedMotion]);

  // Measure anchor at scrollY = 0 and on resize
  const measureAnchor = useCallback(() => {
    if (previewMode) return;
    const el = document.getElementById('hero-wordmark-anchor');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const currentScrollY = window.scrollY;
      setAnchorRect({
        left: rect.left,
        top: rect.top + currentScrollY,
        width: rect.width,
        height: rect.height,
      });
      setIsReady(true);
    }
  }, [previewMode]);

  useEffect(() => {
    if (previewMode) {
      setAnchorRect({
        left: 0,
        top: 0,
        width: 620,
        height: 140,
      });
      setIsReady(true);
      return;
    }

    let resizeObserver;
    const handleInit = async () => {
      try {
        if (document.fonts) {
          await document.fonts.ready;
          await document.fonts.load(`900 100px ${customFont}`);
        }
      } catch (err) {
        // fallback ready
      }
      measureAnchor();
    };

    handleInit();

    const anchorEl = document.getElementById('hero-wordmark-anchor');
    if (anchorEl && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        measureAnchor();
      });
      resizeObserver.observe(anchorEl);
    }

    window.addEventListener('resize', measureAnchor);
    return () => {
      window.removeEventListener('resize', measureAnchor);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [measureAnchor, previewMode, customFont]);

  // Listen to codestars-hero-progress event
  useEffect(() => {
    if (previewMode) return;

    const handleProgress = (e) => {
      if (typeof e.detail?.progress === 'number') {
        setHeroProgress(e.detail.progress);
      }
    };

    window.addEventListener('codestars-hero-progress', handleProgress);
    return () => window.removeEventListener('codestars-hero-progress', handleProgress);
  }, [previewMode]);

  // Track scroll position as fallback or direct scroll sync
  useEffect(() => {
    if (previewMode) return;

    let frame;
    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        scrollYRef.current = y;
        setScrollY(y);
        // If scrolled past hero section directly without triggering custom event
        if (y > 120 && heroProgress < 1) {
          setHeroProgress(1);
        } else if (y === 0 && heroProgress > 0) {
          setHeroProgress(0);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [previewMode, heroProgress]);

  if ((currentRoute !== 'home' && !previewMode) || !isReady || !anchorRect) {
    return null;
  }

  // Scroll Progress Calculation
  const rawP = previewMode ? 0 : heroProgress;

  // Wordmark reaches its final rect at p = 0.88 or earlier
  // Progress for position & scale:
  const travelP = Math.min(1, Math.max(0, rawP / 0.88));
  const easedTravelP = easeInOutCubic(travelP);

  // Crossfade value t = smoothstep(0.88, 1.0, rawP)
  let t = 0;
  if (rawP <= 0.88) {
    t = 0;
  } else if (rawP >= 1.0) {
    t = 1;
  } else {
    const x = (rawP - 0.88) / (1.0 - 0.88);
    t = x * x * (3 - 2 * x); // smoothstep
  }



  // Fixed layer opacity:
  // If merged or in reverse phase A: 0
  // If rawP >= 0.98: 0
  // Otherwise: 1 - t
  let computedLayerOpacity = 0;
  if (!previewMode && (heroState === 'merged' || isReversePhaseA || rawP >= 0.98)) {
    computedLayerOpacity = 0;
  } else {
    computedLayerOpacity = previewMode ? 1 : 1 - t;
  }

  // Measure navbar slot landing coordinates
  const logoTargetWidth = 98;
  let logoTargetX;
  let logoTargetY = 14;

  if (logoSlotRect) {
    // Use the live slot rect broadcast from Navbar for pixel-perfect landing
    logoTargetX = logoSlotRect.x;
    logoTargetY = logoSlotRect.y;
  } else {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 780;
    if (isMobile) {
      logoTargetX = Math.round((window.innerWidth - logoTargetWidth) / 2);
      const navRect = document.querySelector('.codestars-navbar-pill')?.getBoundingClientRect();
      logoTargetY = navRect ? navRect.top + (navRect.height - 44) / 2 : 10;
    } else {
      // Fallback: center of viewport
      logoTargetX = Math.round((window.innerWidth - logoTargetWidth) / 2);
      const navPill = document.querySelector('.codestars-navbar-pill');
      if (navPill) {
        const navRect = navPill.getBoundingClientRect();
        logoTargetY = navRect.top + (navRect.height - 44) / 2;
      }
    }
  }

  const startX = anchorRect.left;
  const startY = anchorRect.top;

  const currentX = previewMode ? 0 : startX + (logoTargetX - startX) * easedTravelP;
  const currentY = previewMode ? 0 : startY + (logoTargetY - startY) * easedTravelP;

  const targetScale = Math.min(0.24, logoTargetWidth / anchorRect.width);
  const currentScale = previewMode ? 1 : 1 - (1 - targetScale) * easedTravelP;

  // Font metrics for the solid text
  const codeStarsFontSize = Math.min(112, Math.max(50, anchorRect.width * 0.195));
  const djsFontSize = Math.round(codeStarsFontSize * 0.38);

  const isWordmarkHidden = computedLayerOpacity <= 0.001;

  return (
    <div
      className={`hero-wordmark-fixed-layer ${previewMode ? 'is-preview-mode' : ''} ${isReversePhaseA ? 'is-phase-a' : ''}`}
      style={{
        transform: `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentScale})`,
        transformOrigin: 'top left',
        opacity: computedLayerOpacity,
        visibility: isWordmarkHidden ? 'hidden' : 'visible',
        pointerEvents: 'none',
        width: `${anchorRect.width}px`,
        height: `${anchorRect.height}px`,
      }}
      aria-hidden="true"
    >
      {/* Inner wrapper handles first-load cinematic fade-in, blur & drift without conflicting with outer scroll transform.
          Also applies soft 3D parallax tilt (max 4deg) based on --hero-ptr-x and --hero-ptr-y */}
      <div
        className={`hero-wordmark-inner-anim ${introState.revealed ? 'is-revealed' : ''} ${introState.animDone ? 'is-anim-done' : ''} ${introState.skipped ? 'is-skipped' : ''}`}
      >
        <div
          className="hero-wordmark-solid-overlay"
          style={{
            fontFamily: customFont,
          }}
        >
          {/* DJS Line */}
          <div
            className="solid-djs-line"
            style={{
              fontSize: `${djsFontSize}px`,
            }}
          >
            DJS
          </div>

          {/* CodeStars Line */}
          <div
            className="solid-codestars-line"
            style={{
              fontSize: `${codeStarsFontSize}px`,
            }}
          >
            CodeStars
          </div>
        </div>
      </div>
    </div>
  );
}

