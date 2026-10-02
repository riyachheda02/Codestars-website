import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { featuredEventsData } from '../../data/home';

export default function FeaturedEvents({ onNavigate }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [kenBurnsKey, setKenBurnsKey] = useState(0);

  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const transitionTimerRef = useRef(null);
  const dragStartXRef = useRef(null);
  const dragStartTimeRef = useRef(0);
  const lastClientXRef = useRef(0);
  const isSectionVisibleRef = useRef(false);

  const total = featuredEventsData.length;

  // Check prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Entrance Observer (at ~35% visibility, once) & pause animations when off screen
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isSectionVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !hasEntered) {
          setHasEntered(true);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasEntered]);

  // Clean up any pending transition timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  // Slide navigation with 450ms navigation lock
  const goToSlide = useCallback((newIndex) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setActiveIndex(newIndex);
    setTilt({ x: 0, y: 0 });
    setKenBurnsKey((k) => k + 1);

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = setTimeout(() => {
      isTransitioningRef.current = false;
    }, 450);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide((activeIndex + 1) % total);
  }, [activeIndex, total, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((activeIndex - 1 + total) % total);
  }, [activeIndex, total, goToSlide]);

  // Keyboard navigation: only while section is focused or in view
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isSectionVisibleRef.current) return;
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Pointer drag & swipe handling with pointer capture and robust release
  const endDrag = useCallback((e) => {
    if (!dragStartXRef.current && dragStartXRef.current !== 0) return;

    if (stageRef.current && e?.pointerId !== undefined) {
      try {
        if (stageRef.current.hasPointerCapture(e.pointerId)) {
          stageRef.current.releasePointerCapture(e.pointerId);
        }
      } catch (err) {
        // Ignore pointer capture errors if already released
      }
    }

    const currentOffset = dragOffset;
    const stageWidth = stageRef.current ? stageRef.current.offsetWidth : 600;
    const threshold = stageWidth * 0.18; // ~18% card/stage width
    const elapsed = Date.now() - dragStartTimeRef.current;
    const velocity = Math.abs(currentOffset) / Math.max(elapsed, 1);

    if (currentOffset < -threshold || (currentOffset < -25 && velocity > 0.4)) {
      nextSlide();
    } else if (currentOffset > threshold || (currentOffset > 25 && velocity > 0.4)) {
      prevSlide();
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
    // Only primary button
    if (e.buttons !== 1) return;

    dragStartXRef.current = e.clientX;
    dragStartTimeRef.current = Date.now();
    lastClientXRef.current = e.clientX;
    setIsDragging(true);
    setDragOffset(0);

    if (stageRef.current && e.pointerId !== undefined) {
      try {
        stageRef.current.setPointerCapture(e.pointerId);
      } catch (err) {
        // Fallback if not supported
      }
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

  // Center card 3D tilt tracking: onPointerMove/Leave on center card ONLY (max 5 deg)
  const handleCenterCardPointerMove = (e) => {
    if (reducedMotion || isDragging || window.matchMedia('(pointer: coarse)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Limit to max 5 degrees
    const tiltX = Math.max(-5, Math.min(5, ((y - centerY) / centerY) * -5));
    const tiltY = Math.max(-5, Math.min(5, ((x - centerX) / centerX) * 5));
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleCenterCardPointerLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Click on center card opens event page
  const handleCenterCardClick = (event) => {
    if (isDragging || Math.abs(dragOffset) > 5) return;
    if (event.isExternal && event.actionUrl) {
      window.open(event.actionUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (onNavigate) {
      onNavigate('events');
    } else {
      window.location.hash = '#events';
    }
  };

  return (
    <section
      id="featured-events"
      ref={sectionRef}
      className={`home-section featured-events-section ${hasEntered ? 'is-entered' : ''}`}
      aria-label="Featured Events"
      tabIndex={0}
    >
      {/* Background Concentric Circles & Warm Ambient Glow */}
      <div className="events-bg-concentric-circles" aria-hidden="true" />
      <div className="events-bg-warm-radial" aria-hidden="true" />

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
              let offset = index - activeIndex;
              if (offset > total / 2) offset -= total;
              if (offset < -total / 2) offset += total;

              const isVisible = offset >= -2 && offset <= 2;
              const isCenter = offset === 0;

              // Compute transform based on offset
              // offset 0: scale 1, no rotation, z-index 10
              // offset ±1: translateX ±58%, rotateY ∓28deg, scale 0.82, z-index 9
              // offset ±2: translateX ±92%, rotateY ∓38deg, scale 0.66, z-index 8
              let txPercent = 0;
              let rotY = 0;
              let scale = 1;
              let overlayOpacity = 0;

              if (offset === 0) {
                txPercent = 0;
                rotY = 0;
                scale = 1;
                overlayOpacity = 0;
              } else if (Math.abs(offset) === 1) {
                txPercent = offset * 58;
                rotY = -offset * 28;
                scale = 0.82;
                overlayOpacity = 0.45;
              } else if (Math.abs(offset) === 2) {
                txPercent = offset * 92;
                rotY = -offset * 38;
                scale = 0.66;
                overlayOpacity = 0.70;
              }

              // During entrance before hasEntered: cards start stacked at center
              if (!hasEntered && !reducedMotion) {
                txPercent = 0;
                rotY = 0;
                scale = 1;
                overlayOpacity = 0;
              }

              // Dynamic drag offset in pixels applied to transform if dragging
              const dragTranslate = isDragging ? `${dragOffset}px` : '0px';

              // Tilt on center card
              const tiltTransform = (isCenter && !reducedMotion && !isDragging)
                ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
                : '';

              const zIndex = isVisible ? 10 - Math.abs(offset) : 1;

              // Fan-out stagger delay on initial entrance (70ms stagger outward from center)
              const fanDelay = hasEntered ? '0ms' : `${Math.abs(offset) * 70}ms`;

              const cardStyle = {
                transform: `translateX(calc(-50% + ${txPercent}% + ${dragTranslate})) translateZ(${isCenter ? '0px' : '-100px'}) rotateY(${rotY}deg) ${tiltTransform} scale(${scale})`,
                zIndex,
                visibility: isVisible ? 'visible' : 'hidden',
                pointerEvents: isVisible ? 'auto' : 'none',
                transitionDelay: fanDelay,
              };

              // Glare style for center card tilt
              const glareOpacity = isCenter && !reducedMotion && (Math.abs(tilt.x) > 0 || Math.abs(tilt.y) > 0)
                ? (Math.abs(tilt.x) + Math.abs(tilt.y)) / 10 * 0.4
                : 0;
              const glareX = 50 + tilt.y * 6;
              const glareY = 50 - tilt.x * 6;

              return (
                <div
                  key={event.id}
                  className={`coverflow-card ${isCenter ? 'is-center' : 'is-side'} ${!isVisible ? 'is-hidden' : ''}`}
                  style={cardStyle}
                  onPointerMove={isCenter ? handleCenterCardPointerMove : undefined}
                  onPointerLeave={isCenter ? handleCenterCardPointerLeave : undefined}
                  onClick={() => {
                    if (isDragging || Math.abs(dragOffset) > 5) return;
                    if (isCenter) {
                      handleCenterCardClick(event);
                    } else {
                      goToSlide(index);
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
                    <img
                      key={isCenter ? `center-poster-${kenBurnsKey}` : `poster-${event.id}`}
                      src={event.image}
                      alt={event.description || event.title}
                      className={`coverflow-card-img ${isCenter && !reducedMotion ? 'is-ken-burns' : ''}`}
                      loading={isCenter ? 'eager' : 'lazy'}
                      draggable={false}
                    />
                    {/* Dark Dimming Overlay for non-center cards */}
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
            className="coverflow-nav-arrow-btn"
            onClick={prevSlide}
            aria-label="Previous event"
          >
            <ArrowLeft size={18} className="nav-arrow-icon nav-arrow-left" />
          </button>

          <div className="coverflow-pagination-dots" role="tablist" aria-label="Event slides">
            {featuredEventsData.map((event, i) => (
              <button
                key={event.id || i}
                type="button"
                className={`coverflow-dot ${i === activeIndex ? 'is-active-pill' : ''}`}
                onClick={() => goToSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                role="tab"
                aria-selected={i === activeIndex}
              />
            ))}
          </div>

          <button
            type="button"
            className="coverflow-nav-arrow-btn"
            onClick={nextSlide}
            aria-label="Next event"
          >
            <ArrowRight size={18} className="nav-arrow-icon nav-arrow-right" />
          </button>
        </div>
      </div>
    </section>
  );
}
