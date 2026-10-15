import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { featuredEventsData, isEventUpcoming } from '../../data/home';

const DEFAULT_AUTOPLAY_INTERVAL = 4000;
const DEFAULT_ARROW_PAUSE = 10000;
const AUTOPLAY_TRANSITION_MS = 1200;
const MANUAL_TRANSITION_MS = 650;

// Perspective and 3D depth parameters
const STAGE_PERSPECTIVE = 1200;

// Exact card layout targets based on user requirement:
// Center: scale 1.0, 0px, opacity 1
// First neighbors (offset 1): scale 0.84, translateX +-400px (gap >= 28px), rotateY 14deg, opacity 0.85
// Second neighbors (offset 2): scale 0.70, translateX +-720px, rotateY 18deg, opacity 0.50
// Third neighbors / beyond: opacity 0, pointer-events none
const CARD_METRICS = {
  0: { scale: 1.0, tx: 0, tz: 0, rotY: 0, opacity: 1.0, dimmer: 0, parallax: 0 },
  1: { scale: 0.84, tx: 400, tz: -80, rotY: 14, opacity: 0.85, dimmer: 0.35, parallax: 6 },
  2: { scale: 0.70, tx: 720, tz: -180, rotY: 18, opacity: 0.50, dimmer: 0.65, parallax: 10 },
  3: { scale: 0.50, tx: 1000, tz: -300, rotY: 22, opacity: 0.0, dimmer: 0.90, parallax: 14 },
};

function getCardMetrics(absOffset, sign, viewportWidth) {
  const target = CARD_METRICS[absOffset] || CARD_METRICS[3];
  let tx = target.tx * sign;
  let scale = target.scale;
  let rotY = target.rotY * -sign;
  let tz = target.tz;

  // Responsive adjustments for tablet (<1100px) and mobile (<640px)
  if (viewportWidth && viewportWidth < 640) {
    // Mobile (<640px): center 72vw wide, neighbors peeking 14px with gap >= 12px
    const cardW = Math.min(280, viewportWidth * 0.72);
    const peek = 14;
    const gap = 14;
    const neighborTx = cardW + gap - peek;
    tx = (absOffset === 1 ? neighborTx : neighborTx * 1.8) * sign;
    scale = absOffset === 0 ? 1 : 0.85;
    rotY = absOffset === 0 ? 0 : 8 * -sign;
  } else if (viewportWidth && viewportWidth < 1100) {
    // Tablet (<1100px): center 300x400, neighbors +-340px
    tx = (absOffset === 1 ? 340 : 600) * sign;
    scale = absOffset === 0 ? 1 : (absOffset === 1 ? 0.82 : 0.66);
  }

  return {
    scale,
    tx,
    tz,
    rotY,
    opacity: target.opacity,
    dimmer: target.dimmer,
    parallax: target.parallax * -sign,
  };
}

export default function FeaturedEvents({ onNavigate }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Autoplay state: 'running' | 'paused'
  const [autoplayMode, setAutoplayMode] = useState('running');
  const [transitionDuration, setTransitionDuration] = useState(MANUAL_TRANSITION_MS);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const transitionTimerRef = useRef(null);
  const autoplayTimerRef = useRef(null);
  const dragStartXRef = useRef(null);
  const dragStartTimeRef = useRef(0);
  const lastClientXRef = useRef(0);
  const isSectionVisibleRef = useRef(false);
  const activeIndexRef = useRef(0);
  const autoplayModeRef = useRef('running');

  // Keep refs in sync for timer callbacks
  activeIndexRef.current = activeIndex;
  autoplayModeRef.current = autoplayMode;

  const total = featuredEventsData.length;

  // Check query params for test overrides or slowmo debug mode (?slowmo=5)
  const getIntervals = useCallback(() => {
    if (typeof window !== 'undefined' && window.__COVERFLOW_CONFIG__) {
      return {
        interval: window.__COVERFLOW_CONFIG__.interval || DEFAULT_AUTOPLAY_INTERVAL,
        pause: window.__COVERFLOW_CONFIG__.pause || DEFAULT_ARROW_PAUSE,
      };
    }
    return {
      interval: DEFAULT_AUTOPLAY_INTERVAL,
      pause: DEFAULT_ARROW_PAUSE,
    };
  }, []);

  const getSlowmoMultiplier = useCallback(() => {
    if (typeof window === 'undefined') return 1;
    const params = new URLSearchParams(window.location.search);
    const slowmo = parseFloat(params.get('slowmo'));
    return !isNaN(slowmo) && slowmo > 0 ? slowmo : 1;
  }, []);

  // Preload and decode all event images before carousel display
  useEffect(() => {
    featuredEventsData.forEach((event) => {
      const img = new Image();
      img.src = event.image;
      if (img.decode) {
        img.decode().catch(() => {});
      }
    });
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Slide navigation with duration control (1200ms for autoplay, 650ms for manual)
  const goToSlide = useCallback((newIndex, isAuto = false) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsTransitioning(true);

    const mult = getSlowmoMultiplier();
    const baseDur = isAuto ? AUTOPLAY_TRANSITION_MS : MANUAL_TRANSITION_MS;
    const dur = Math.round(baseDur * mult);

    setTransitionDuration(dur);
    setActiveIndex(newIndex);
    setTilt({ x: 0, y: 0 });

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = setTimeout(() => {
      isTransitioningRef.current = false;
      setIsTransitioning(false);
    }, dur);
  }, [getSlowmoMultiplier]);

  // Decode the next slide's image before autoplay tick initiates slide
  const preloadNextSlideImage = useCallback((nextIdx) => {
    const nextEvent = featuredEventsData[nextIdx];
    if (nextEvent && nextEvent.image) {
      const img = new Image();
      img.src = nextEvent.image;
      if (img.decode) {
        return img.decode().catch(() => {});
      }
    }
    return Promise.resolve();
  }, []);

  // Core timer schedule function
  const scheduleAutoplay = useCallback((delayMs) => {
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }

    if (reducedMotion) return;

    autoplayTimerRef.current = setTimeout(async () => {
      if (autoplayModeRef.current === 'paused') {
        setAutoplayMode('running');
      }

      if (isSectionVisibleRef.current && document.visibilityState === 'visible') {
        const next = (activeIndexRef.current + 1) % total;
        await preloadNextSlideImage(next);
        goToSlide(next, true);
      }

      const { interval } = getIntervals();
      scheduleAutoplay(interval);
    }, delayMs);
  }, [reducedMotion, total, goToSlide, getIntervals, preloadNextSlideImage]);

  // Restart running countdown
  const restartRunningAutoplay = useCallback(() => {
    setAutoplayMode('running');
    const { interval } = getIntervals();
    scheduleAutoplay(interval);
  }, [getIntervals, scheduleAutoplay]);

  // Trigger 10s pause: ONLY on arrow buttons click
  const triggerArrowPause = useCallback(() => {
    setAutoplayMode('paused');
    const { pause } = getIntervals();
    scheduleAutoplay(pause);
  }, [getIntervals, scheduleAutoplay]);

  const nextSlide = useCallback((fromArrow = false) => {
    if (fromArrow) {
      triggerArrowPause();
    } else {
      restartRunningAutoplay();
    }
    goToSlide((activeIndexRef.current + 1) % total, false);
  }, [total, goToSlide, triggerArrowPause, restartRunningAutoplay]);

  const prevSlide = useCallback((fromArrow = false) => {
    if (fromArrow) {
      triggerArrowPause();
    } else {
      restartRunningAutoplay();
    }
    goToSlide((activeIndexRef.current - 1 + total) % total, false);
  }, [total, goToSlide, triggerArrowPause, restartRunningAutoplay]);

  const handleDotClick = useCallback((index) => {
    restartRunningAutoplay();
    goToSlide(index, false);
  }, [restartRunningAutoplay, goToSlide]);

  // Entrance Observer & pause animations when off screen
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isSectionVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          if (!hasEntered) setHasEntered(true);
          if (!autoplayTimerRef.current && !reducedMotion) {
            const { interval } = getIntervals();
            scheduleAutoplay(interval);
          }
        } else {
          if (autoplayTimerRef.current) {
            clearTimeout(autoplayTimerRef.current);
            autoplayTimerRef.current = null;
          }
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasEntered, reducedMotion, getIntervals, scheduleAutoplay]);

  // Document visibility listener
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (autoplayTimerRef.current) {
          clearTimeout(autoplayTimerRef.current);
          autoplayTimerRef.current = null;
        }
      } else {
        if (isSectionVisibleRef.current && !reducedMotion) {
          const { interval } = getIntervals();
          scheduleAutoplay(interval);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [reducedMotion, getIntervals, scheduleAutoplay]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isSectionVisibleRef.current) return;
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide(false);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Pointer drag & swipe handling
  const endDrag = useCallback((e) => {
    if (!dragStartXRef.current && dragStartXRef.current !== 0) return;

    if (stageRef.current && e?.pointerId !== undefined) {
      try {
        if (stageRef.current.hasPointerCapture(e.pointerId)) {
          stageRef.current.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
    }

    const currentOffset = dragOffset;
    const stageWidth = stageRef.current ? stageRef.current.offsetWidth : 600;
    const threshold = stageWidth * 0.18;
    const elapsed = Date.now() - dragStartTimeRef.current;
    const velocity = Math.abs(currentOffset) / Math.max(elapsed, 1);

    if (currentOffset < -threshold || (currentOffset < -25 && velocity > 0.4)) {
      nextSlide(false);
    } else if (currentOffset > threshold || (currentOffset > 25 && velocity > 0.4)) {
      prevSlide(false);
    }

    dragStartXRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
  }, [dragOffset, nextSlide, prevSlide]);

  // Window blur / visibilitychange listeners to prevent stuck drag
  useEffect(() => {
    const handleCancel = () => {
      if (dragStartXRef.current !== null) {
        dragStartXRef.current = null;
        setIsDragging(false);
        setDragOffset(0);
      }
    };

    window.addEventListener('blur', handleCancel);
    document.addEventListener('visibilitychange', handleCancel);
    return () => {
      window.removeEventListener('blur', handleCancel);
      document.removeEventListener('visibilitychange', handleCancel);
    };
  }, []);

  const handlePointerDown = (e) => {
    if (isTransitioningRef.current) return;
    if (e.buttons !== 1) return;

    dragStartXRef.current = e.clientX;
    dragStartTimeRef.current = Date.now();
    lastClientXRef.current = e.clientX;
    setIsDragging(true);
    setDragOffset(0);

    if (stageRef.current && e.pointerId !== undefined) {
      try {
        stageRef.current.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const handlePointerMove = (e) => {
    if (dragStartXRef.current === null) return;
    if (e.buttons !== 1) {
      endDrag(e);
      return;
    }
    const diff = e.clientX - dragStartXRef.current;
    lastClientXRef.current = e.clientX;
    setDragOffset(diff);
  };

  // Center card 3D tilt tracking: only while not transitioning or dragging
  const handleCenterCardPointerMove = (e) => {
    if (reducedMotion || isDragging || isTransitioning || window.matchMedia('(pointer: coarse)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = Math.max(-5, Math.min(5, ((y - centerY) / centerY) * -5));
    const tiltY = Math.max(-5, Math.min(5, ((x - centerX) / centerX) * 5));
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleCenterCardPointerLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleCenterCardClick = (event) => {
    if (isDragging || Math.abs(dragOffset) > 5) return;
    if (event.isExternal && event.actionUrl && !event.actionUrl.startsWith('#')) {
      window.open(event.actionUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const targetHash = event.slug ? `#events/${event.slug}` : (event.actionUrl || '#events');
    window.location.hash = targetHash;
    if (onNavigate) {
      onNavigate(targetHash);
    }
  };

  return (
    <section
      id="featured-events"
      ref={sectionRef}
      className={`home-section featured-events-section ${hasEntered ? 'is-entered' : ''}`}
      aria-label="Featured Events"
      tabIndex={0}
      style={{ '--dur': `${transitionDuration}ms` }}
    >
      {/* Background Concentric Circles */}
      <div className="events-bg-concentric-circles" aria-hidden="true" />
      {/* Base radial glow */}
      <div className="events-bg-warm-radial" aria-hidden="true" />
      {/* Compositor-only transition glow wash layer */}
      <div className={`events-bg-glow-wash ${isTransitioning ? 'is-active' : ''}`} aria-hidden="true" />

      <div className="section-container">
        {/* Section Heading: "EVENTS" with outward underline */}
        <div className="section-head-display">
          <h2 className="section-display-title">EVENTS</h2>
          <div className="section-title-underline" aria-hidden="true" />
        </div>

        {/* 3D Coverflow Stage */}
        <div
          ref={stageRef}
          className={`coverflow-stage ${isDragging ? 'is-dragging' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          role="region"
          aria-roledescription="carousel"
          aria-label="Events Carousel"
        >
          <div className="coverflow-track">
            {featuredEventsData.map((event, index) => {
              // Wrap offset around symmetrically (-total/2 to +total/2)
              let offset = index - activeIndex;
              if (offset > total / 2) offset -= total;
              if (offset < -total / 2) offset += total;
              // For even total (6): if offset is -3, check if it's strictly opposite
              // To ensure perfect symmetry between -2 and +2 at rest
              const absOffset = Math.abs(offset);
              const sign = offset === 0 ? 0 : offset > 0 ? 1 : -1;

              // Only render offsets -2..+2 at rest, and +/-3 while transitioning
              const isAtRestOpposite = absOffset > 2 && !isTransitioning;
              const isRendered = absOffset <= 3 && !isAtRestOpposite;
              const isCenter = offset === 0;

              // Derive metrics from helper function
              const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
              const metrics = getCardMetrics(Math.min(3, absOffset), sign, viewportWidth);

              let tx = metrics.tx;
              let rotY = metrics.rotY;
              let tz = metrics.tz;
              let scale = metrics.scale;
              let opacity = absOffset >= 3 ? 0 : metrics.opacity;
              let overlayOpacity = metrics.dimmer;
              let imgParallax = metrics.parallax;

              // During entrance before hasEntered: cards stack at center
              if (!hasEntered && !reducedMotion) {
                tx = 0;
                rotY = 0;
                tz = 0;
                scale = 1;
                opacity = 1;
                overlayOpacity = 0;
                imgParallax = 0;
              }

              const dragTranslate = isDragging ? `${dragOffset}px` : '0px';

              // Tilt on center card (only when at rest, not transitioning)
              const tiltTransform = (isCenter && !reducedMotion && !isDragging && !isTransitioning)
                ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
                : '';

              const fanDelay = hasEntered ? '0ms' : `${absOffset * 70}ms`;

              // Continuously sorted 3D transform with translate3d & translateZ
              // Center origin with calc(-50% + tx) and -50%
              const cardTransform = `translate3d(calc(-50% + ${tx}px + ${dragTranslate}), -50%, ${tz}px) rotateY(${rotY}deg) ${tiltTransform} scale(${scale})`;

              const cardStyle = {
                transform: cardTransform,
                opacity,
                visibility: isRendered ? 'visible' : 'hidden',
                pointerEvents: (isRendered && absOffset <= 2) ? 'auto' : 'none',
                transitionDelay: fanDelay,
              };

              const glareOpacity = isCenter && !reducedMotion && (Math.abs(tilt.x) > 0 || Math.abs(tilt.y) > 0)
                ? (Math.abs(tilt.x) + Math.abs(tilt.y)) / 10 * 0.4
                : 0;
              const glareX = 50 + tilt.y * 6;
              const glareY = 50 - tilt.x * 6;

              return (
                <div
                  key={event.id}
                  className={`coverflow-card ${isCenter ? 'is-center' : 'is-side'} ${isTransitioning ? 'is-transitioning' : ''}`}
                  style={cardStyle}
                  onPointerMove={isCenter ? handleCenterCardPointerMove : undefined}
                  onPointerLeave={isCenter ? handleCenterCardPointerLeave : undefined}
                  onClick={() => {
                    if (isDragging || Math.abs(dragOffset) > 5) return;
                    if (isCenter) {
                      handleCenterCardClick(event);
                    } else {
                      handleDotClick(index);
                    }
                  }}
                  role={isCenter ? 'button' : 'group'}
                  tabIndex={isCenter ? 0 : -1}
                  aria-label={isCenter ? `Open ${event.title}` : event.title}
                  onKeyDown={(e) => {
                    if (isCenter && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleCenterCardClick(event);
                    }
                  }}
                >
                  <div className="coverflow-card-inner">
                    {/* Blurred darkened backdrop for landscape / contained images */}
                    <div
                      className="coverflow-card-backdrop"
                      style={{ backgroundImage: `url(${event.image})` }}
                      aria-hidden="true"
                    />

                    {/* Main poster image */}
                    <img
                      src={event.image}
                      alt={event.description || event.title}
                      className="coverflow-card-img"
                      style={{
                        transform: imgParallax ? `scale(1.04) translate3d(${imgParallax}%, 0, 0)` : 'scale(1.0) translate3d(0, 0, 0)',
                      }}
                      loading="eager"
                      decoding="async"
                      draggable={false}
                    />

                    {/* Upcoming badge, top-left */}
                    {isEventUpcoming(event.date) && (
                      <div className="coverflow-card-badge-wrap">
                        <span className="coverflow-upcoming-badge">Upcoming</span>
                      </div>
                    )}

                    {/* Bottom Dark Gradient Scrim Overlay */}
                    <div className="coverflow-card-overlay">
                      <div className="coverflow-card-meta">
                        <span className="coverflow-card-category">{event.category || 'EVENT'}</span>
                        <h3 className="coverflow-card-title">{event.title}</h3>
                        <div className="coverflow-card-footer-row">
                          <span className="coverflow-card-date">{event.displayDate || event.date}</span>
                          <span className="coverflow-card-explore">
                            <span>Explore</span>
                            <ArrowUpRight size={14} className="coverflow-explore-icon" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dark Dimming Overlay for non-center cards (opacity-only) */}
                    <div
                      className="coverflow-card-dimmer"
                      style={{ opacity: overlayOpacity }}
                      aria-hidden="true"
                    />

                    {/* Interactive Glare on Center Card */}
                    {isCenter && !reducedMotion && (
                      <div
                        className="coverflow-card-glare"
                        style={{
                          opacity: glareOpacity,
                          background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.45) 0%, transparent 65%)`,
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Standard Fixed Row Below Carousel: [Prev Button] [Pagination Dots] [Next Button] */}
        <div className="coverflow-controls-row">
          <button
            type="button"
            className="coverflow-nav-arrow-btn coverflow-prev-btn"
            onClick={() => prevSlide(true)}
            aria-label="Previous event"
          >
            <ArrowLeft size={18} className="nav-arrow-icon nav-arrow-left" />
          </button>

          <div className="coverflow-pagination-dots" role="tablist" aria-label="Event slides">
            {featuredEventsData.map((event, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={event.id || i}
                  type="button"
                  className={`coverflow-dot ${isActive ? `is-active-pill is-${autoplayMode}` : ''}`}
                  onClick={() => handleDotClick(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  role="tab"
                  aria-selected={isActive}
                >
                  {isActive && <span className="coverflow-dot-fill" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="coverflow-nav-arrow-btn coverflow-next-btn"
            onClick={() => nextSlide(true)}
            aria-label="Next event"
          >
            <ArrowRight size={18} className="nav-arrow-icon nav-arrow-right" />
          </button>
        </div>
      </div>
    </section>
  );
}
