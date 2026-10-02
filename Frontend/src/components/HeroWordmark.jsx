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
  onIntroDone = null,
}) {
  const [scrollY, setScrollY] = useState(0);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Crossfade between particle canvas and solid text:
  // p between 0.4 and 0.75: particle canvas fades out, solid text fades in
  const [solidCrossfade, setSolidCrossfade] = useState(0);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const mouseRef = useRef({ x: -2000, y: -2000, active: false });
  const scrollYRef = useRef(0);
  const hasPlayedIntroRef = useRef(true);

  // Typed Arrays for zero-allocation performance:
  // Layout per particle:
  // [0]: tx (target x)
  // [1]: ty (target y)
  // [2]: x (current x)
  // [3]: y (current y)
  // [4]: vx (velocity x)
  // [5]: vy (velocity y)
  // [6]: alpha (base opacity)
  // [7]: isHighlight (0 or 1 for lighter gold #FFD97A)
  // [8]: glyphIndex
  // [9]: glyphTimer (ms elapsed since last swap)
  // [10]: glyphInterval (ms threshold for next swap: 1500 - 4000)
  // [11]: startDelay (for convergence left-to-right sweep)
  // [12]: rainSpeed (for vertical falling code rain)
  // [13]: idleAngle (for subtle 0.6px idle drift)
  const particleDataRef = useRef(null);
  const particleCountRef = useRef(0);

  // Check prefers-reduced-motion & intro session state
  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(isReduced);

    if (previewMode) {
      setHasPlayedIntro(true);
      hasPlayedIntroRef.current = true;
      return;
    }

    const played = sessionStorage.getItem('codestars_intro_played');
    if (!played && !isReduced) {
      setHasPlayedIntro(false);
      hasPlayedIntroRef.current = false;
    } else {
      setHasPlayedIntro(true);
      hasPlayedIntroRef.current = true;
    }
  }, [previewMode]);

  // Measure anchor at scrollY = 0
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

  // Initialize and measure on mount, font load, and resize
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

  // Track scroll position
  useEffect(() => {
    if (previewMode) return;

    let frame;
    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        scrollYRef.current = y;
        setScrollY(y);

        const vh = window.innerHeight;
        const p = Math.min(1, Math.max(0, y / (0.8 * vh)));

        // Solid crossfade between 0.4 and 0.75
        if (p <= 0.4) {
          setSolidCrossfade(0);
        } else if (p >= 0.75) {
          setSolidCrossfade(1);
        } else {
          setSolidCrossfade((p - 0.4) / 0.35);
        }

        // Skip intro if user scrolls
        if (!hasPlayedIntroRef.current && y > 15) {
          sessionStorage.setItem('codestars_intro_played', 'true');
          setHasPlayedIntro(true);
          hasPlayedIntroRef.current = true;
          window.dispatchEvent(new CustomEvent('codestars-intro-complete'));
          if (particleDataRef.current) {
            const count = particleCountRef.current;
            const data = particleDataRef.current;
            for (let i = 0; i < count; i++) {
              const offset = i * 14;
              data[offset + 2] = data[offset + 0]; // x = tx
              data[offset + 3] = data[offset + 1]; // y = ty
              data[offset + 4] = 0; // vx = 0
              data[offset + 5] = 0; // vy = 0
            }
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [previewMode]);

  // Mouse move listener for repulsion (only when p < 0.05)
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Initialize and run Canvas Particle System
  useEffect(() => {
    if ((currentRoute !== 'home' && !previewMode) || !isReady || !anchorRect || !canvasRef.current || reducedMotion) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.round(anchorRect.width);
    const height = Math.round(anchorRect.height);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Offscreen Canvas Pass: Draw "DJS" at 38% and "CodeStars" large
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;

    // Font calculations
    const codeStarsFontSize = Math.min(88, Math.max(42, width * 0.16));
    const djsFontSize = Math.round(codeStarsFontSize * 0.38);

    // 1. DJS prefix line: wide letter spacing
    offCtx.font = `900 ${djsFontSize}px ${customFont}`;
    offCtx.fillStyle = '#F5B93A';
    offCtx.textBaseline = 'top';
    offCtx.textAlign = 'left';
    offCtx.letterSpacing = '0.22em';
    offCtx.fillText('DJS', 2, 2);

    // 2. CodeStars line: large, thick, angular
    offCtx.font = `900 ${codeStarsFontSize}px ${customFont}`;
    offCtx.fillStyle = '#F5B93A';
    offCtx.letterSpacing = '-0.02em';
    const wordmarkTop = Math.round(djsFontSize + 16);
    offCtx.fillText('CodeStars', 0, wordmarkTop);

    const imgData = offCtx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    // Sampling grid scaled to stroke width:
    // CodeStars: fontSize / 28 (approx 2.5 - 3.2px)
    // DJS: djsFontSize / 20 (approx 1.2 - 1.6px)
    // To keep performance high and glyphs overlapping, use step = 3px on desktop, 4px on mobile
    const isMobile = window.innerWidth <= 640;
    const step = isMobile ? 4 : 3;
    const glyphs = ['0', '1', '{', '}', '<', '>', '/', ';', '=', '+', '#'];
    const maxParticles = isMobile ? 2200 : 5000;

    const sampledPoints = [];
    const isFresh = !hasPlayedIntroRef.current && !previewMode;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const alpha = pixels[idx + 3];
        if (alpha > 70) {
          // Highlight ~8% of particles in lighter gold #FFD97A
          const isHighlight = Math.random() < 0.08 ? 1 : 0;
          // Random brightness between 70% and 100%
          const baseAlpha = 0.7 + Math.random() * 0.3;

          // Intro rain position: vertical falling across left half of hero
          const rainX = isFresh ? Math.random() * (width * 0.95) : x;
          const rainY = isFresh ? -10 - Math.random() * 300 : y;

          // Left to right convergence delay based on target x (0 to 1100ms)
          const leftToRightDelay = isFresh ? 500 + (x / width) * 1100 : 0;

          sampledPoints.push({
            tx: x,
            ty: y,
            x: rainX,
            y: rainY,
            alpha: baseAlpha,
            isHighlight,
            glyphIndex: Math.floor(Math.random() * glyphs.length),
            glyphTimer: Math.random() * 2000,
            glyphInterval: 1500 + Math.random() * 2500, // 1.5s to 4.0s
            startDelay: leftToRightDelay,
            rainSpeed: 4 + Math.random() * 6,
            idleAngle: Math.random() * Math.PI * 2,
          });

          if (sampledPoints.length >= maxParticles) break;
        }
      }
      if (sampledPoints.length >= maxParticles) break;
    }

    const count = sampledPoints.length;
    particleCountRef.current = count;

    // Allocate typed array (14 floats per particle)
    const floatData = new Float32Array(count * 14);
    for (let i = 0; i < count; i++) {
      const p = sampledPoints[i];
      const o = i * 14;
      floatData[o + 0] = p.tx;
      floatData[o + 1] = p.ty;
      floatData[o + 2] = p.x;
      floatData[o + 3] = p.y;
      floatData[o + 4] = 0; // vx
      floatData[o + 5] = 0; // vy
      floatData[o + 6] = p.alpha;
      floatData[o + 7] = p.isHighlight;
      floatData[o + 8] = p.glyphIndex;
      floatData[o + 9] = p.glyphTimer;
      floatData[o + 10] = p.glyphInterval;
      floatData[o + 11] = p.startDelay;
      floatData[o + 12] = p.rainSpeed;
      floatData[o + 13] = p.idleAngle;
    }
    particleDataRef.current = floatData;

    // Intro timeline sequence
    let shimmerStartTime = 0;
    if (isFresh) {
      const skipIntro = () => {
        sessionStorage.setItem('codestars_intro_played', 'true');
        setHasPlayedIntro(true);
        hasPlayedIntroRef.current = true;
        window.dispatchEvent(new CustomEvent('codestars-intro-complete'));
        if (onIntroDone) onIntroDone();
        for (let i = 0; i < count; i++) {
          const o = i * 14;
          floatData[o + 2] = floatData[o + 0];
          floatData[o + 3] = floatData[o + 1];
          floatData[o + 4] = 0;
          floatData[o + 5] = 0;
        }
      };

      const timerDone = setTimeout(() => {
        skipIntro();
      }, 2400);

      window.addEventListener('click', skipIntro, { once: true });
      window.addEventListener('keydown', skipIntro, { once: true });

      var cleanupIntro = () => {
        clearTimeout(timerDone);
        window.removeEventListener('click', skipIntro);
        window.removeEventListener('keydown', skipIntro);
      };
    }

    // Interactive Render & Physics Loop
    let lastTime = performance.now();
    const introStartTime = performance.now();

    // Particle glyph size: ~80% of grid size, slightly larger than grid cell for solid look
    const glyphFontSize = Math.max(7, Math.round(step * 1.55));

    const render = (now) => {
      const dt = Math.min(32, now - lastTime);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // 3. Faint solid "base" under particles: 20% gold with soft 16px blur
      ctx.save();
      ctx.shadowColor = 'rgba(245, 185, 58, 0.35)';
      ctx.shadowBlur = 16;
      ctx.fillStyle = 'rgba(245, 185, 58, 0.20)';

      // Draw base text
      ctx.font = `900 ${djsFontSize}px ${customFont}`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.letterSpacing = '0.22em';
      ctx.fillText('DJS', 2, 2);

      ctx.font = `900 ${codeStarsFontSize}px ${customFont}`;
      ctx.letterSpacing = '-0.02em';
      ctx.fillText('CodeStars', 0, wordmarkTop);
      ctx.restore();

      // Mouse & scroll physics parameters
      const vh = window.innerHeight;
      const p = previewMode ? 0 : Math.min(1, Math.max(0, scrollYRef.current / (0.8 * vh)));
      const repulsionAllowed = p < 0.05 && !previewMode;

      const mouse = mouseRef.current;
      const repelDist = 90;
      const repelDistSq = repelDist * repelDist;
      const mx = mouse.active && repulsionAllowed ? mouse.x - anchorRect.left : -2000;
      const my = mouse.active && repulsionAllowed ? mouse.y - anchorRect.top : -2000;

      // Jitter reduction as scroll progress p increases from 0 to 0.7
      const jitterFactor = Math.max(0, 1 - p / 0.7);

      const elapsedSinceIntro = now - introStartTime;
      const isIntro = !hasPlayedIntroRef.current && !previewMode;

      // Shimmer sweep band: active between 1600ms and 2300ms (700ms duration)
      let shimmerX = -100;
      if (isIntro && elapsedSinceIntro >= 1600 && elapsedSinceIntro <= 2300) {
        const shimmerP = (elapsedSinceIntro - 1600) / 700;
        shimmerX = shimmerP * (width + 120) - 60;
      }

      ctx.font = `700 ${glyphFontSize}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const data = floatData;
      for (let i = 0; i < count; i++) {
        const o = i * 14;
        const tx = data[o + 0];
        const ty = data[o + 1];
        let cx = data[o + 2];
        let cy = data[o + 3];
        let vx = data[o + 4];
        let vy = data[o + 5];
        const baseAlpha = data[o + 6];
        const isHighlight = data[o + 7];
        let glyphIdx = data[o + 8];
        let timer = data[o + 9] + dt;
        const interval = data[o + 10];
        const startDelay = data[o + 11];
        const rainSpeed = data[o + 12];
        let idleAngle = data[o + 13];

        // Glyph swap every 1.5 - 4.0s (slow shimmer)
        if (timer >= interval) {
          timer = 0;
          glyphIdx = Math.floor(Math.random() * glyphs.length);
          data[o + 8] = glyphIdx;
        }
        data[o + 9] = timer;

        // Intro Phase Handling:
        if (isIntro) {
          if (elapsedSinceIntro < startDelay) {
            // 1. Vertical falling code rain
            cy += rainSpeed;
            if (cy > height + 20) {
              cy = -10;
              cx = Math.random() * (width * 0.95);
            }
            data[o + 2] = cx;
            data[o + 3] = cy;

            // Draw falling rain particle
            ctx.fillStyle = 'rgba(245, 185, 58, 0.45)';
            ctx.fillText(glyphs[glyphIdx], cx, cy);
            continue;
          }
        }

        // 2. Convergence with spring ease & tiny overshoot
        const dx = tx - cx;
        const dy = ty - cy;
        vx += dx * 0.12;
        vy += dy * 0.12;

        // Interactive cursor repulsion
        if (repulsionAllowed && mouse.active) {
          const mdx = cx - mx;
          const mdy = cy - my;
          const distSq = mdx * mdx + mdy * mdy;
          if (distSq < repelDistSq && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (repelDist - dist) / repelDist;
            const angle = Math.atan2(mdy, mdx);
            vx += Math.cos(angle) * force * 15;
            vy += Math.sin(angle) * force * 15;
          }
        }

        // Damping / Friction
        vx *= 0.74;
        vy *= 0.74;
        cx += vx;
        cy += vy;

        // Subtle idle motion (0.6px drift around target at rest)
        idleAngle += 0.03;
        data[o + 13] = idleAngle;
        const idleOffsetX = Math.cos(idleAngle) * 0.6 * jitterFactor;
        const idleOffsetY = Math.sin(idleAngle) * 0.6 * jitterFactor;

        data[o + 2] = cx;
        data[o + 3] = cy;
        data[o + 4] = vx;
        data[o + 5] = vy;

        // Color & Shimmer logic
        let renderAlpha = baseAlpha;
        let fillColor = isHighlight === 1 ? '#FFD97A' : '#F5B93A';

        // If shimmer band passes over this particle
        if (shimmerX > -50) {
          const distToShimmer = Math.abs(cx - shimmerX);
          if (distToShimmer < 36) {
            fillColor = '#FFFFFF';
            renderAlpha = 1.0;
          }
        }

        ctx.fillStyle = fillColor;
        ctx.globalAlpha = renderAlpha;
        ctx.fillText(glyphs[glyphIdx], cx + idleOffsetX, cy + idleOffsetY);
      }

      ctx.globalAlpha = 1.0;
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (cleanupIntro) cleanupIntro();
    };
  }, [currentRoute, isReady, anchorRect, reducedMotion, customFont, previewMode, onIntroDone]);

  if ((currentRoute !== 'home' && !previewMode) || !isReady || !anchorRect) {
    return null;
  }

  // Scroll Progress Calculation
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
  const rawP = previewMode ? 0 : Math.min(1, Math.max(0, scrollY / (0.8 * vh)));
  const easedP = easeInOutCubic(rawP);

  // Measure navbar slot landing coordinates
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 780;
  const logoTargetWidth = 145;

  let logoTargetX;
  let logoTargetY = 14 + 6;

  if (isMobile) {
    logoTargetX = Math.round((window.innerWidth - logoTargetWidth) / 2);
    logoTargetY = 14;
  } else {
    const navPill = document.querySelector('.codestars-navbar-pill');
    if (navPill) {
      const navRect = navPill.getBoundingClientRect();
      logoTargetX = navRect.left + 14;
      logoTargetY = navRect.top + 6;
    } else {
      const estimatedPillWidth = 460;
      logoTargetX = (window.innerWidth - estimatedPillWidth) / 2 + 14;
    }
  }

  const startX = anchorRect.left;
  const startY = anchorRect.top;

  const currentX = previewMode ? 0 : startX + (logoTargetX - startX) * easedP;
  const currentY = previewMode ? 0 : startY + (logoTargetY - startY) * easedP;

  const targetScale = Math.min(0.24, logoTargetWidth / anchorRect.width);
  const currentScale = previewMode ? 1 : 1 - (1 - targetScale) * easedP;

  // Layer opacity: fades to 0 at p >= 0.97 as solid logo in navbar finishes dock
  const layerOpacity = rawP >= 0.97 ? 0 : 1;
  const pointerEvents = rawP < 0.05 ? 'auto' : 'none';

  // Font metrics for the solid text overlay
  const codeStarsFontSize = Math.min(88, Math.max(42, anchorRect.width * 0.16));
  const djsFontSize = Math.round(codeStarsFontSize * 0.38);

  return (
    <div
      className={`hero-wordmark-fixed-layer ${previewMode ? 'is-preview-mode' : ''}`}
      style={{
        transform: `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentScale})`,
        transformOrigin: 'top left',
        opacity: layerOpacity,
        pointerEvents: pointerEvents,
        width: `${anchorRect.width}px`,
        height: `${anchorRect.height}px`,
      }}
      aria-hidden="true"
    >
      {reducedMotion ? (
        <div className="hero-wordmark-static-fallback">
          <span className="fallback-prefix-djs" style={{ fontFamily: customFont }}>DJS</span>
          <span className="fallback-wordmark-codestars" style={{ fontFamily: customFont }}>CodeStars</span>
        </div>
      ) : (
        <>
          {/* Particle canvas layer */}
          <canvas
            ref={canvasRef}
            className="hero-wordmark-particle-canvas"
            style={{ opacity: 1 - solidCrossfade }}
          />

          {/* Crisp solid text overlay (crossfades in between p 0.4 and 0.75 for smooth landing) */}
          <div
            className="hero-wordmark-solid-overlay"
            style={{
              opacity: solidCrossfade,
              fontFamily: customFont,
            }}
          >
            <div
              className="solid-djs-line"
              style={{
                fontSize: `${djsFontSize}px`,
                letterSpacing: '0.22em',
              }}
            >
              DJS
            </div>
            <div
              className="solid-codestars-line"
              style={{
                fontSize: `${codeStarsFontSize}px`,
                letterSpacing: '-0.02em',
              }}
            >
              CodeStars
            </div>
          </div>
        </>
      )}
    </div>
  );
}
