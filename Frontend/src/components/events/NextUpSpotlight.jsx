import React, { useState, useEffect, useRef } from 'react';
import './NextUpSpotlight.css';
import {
  getRegistrationState,
  getCountdown,
  buildIcs,
  buildGoogleCalendarUrl,
} from '../../utils/eventState';

function formatEventMeta(event) {
  const parts = [];
  if (event.startDate) {
    const d = new Date(event.startDate);
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    parts.push(dateStr);
  }
  if (event.time) {
    parts.push(event.time);
  }
  if (event.venue) {
    parts.push(event.venue);
  }
  return parts.join(' \u2022 ');
}

function formatEndsIn(endDate, now) {
  const end = new Date(endDate).getTime();
  const diffMs = Math.max(0, end - now);
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours > 0) {
    return `Ends in ${hours}h ${mins}m`;
  }
  return `Ends in ${mins}m`;
}

function formatRegistrationDate(opensAt) {
  if (!opensAt) return '';
  const d = new Date(opensAt);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function NextUpSpotlight({ event, onNowTick }) {
  const [now, setNow] = useState(() => Date.now());
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [secFlipping, setSecFlipping] = useState(false);

  const prevSecondsRef = useRef(null);
  const popoverRef = useRef(null);
  const calendarBtnRef = useRef(null);
  const containerRef = useRef(null);

  // Interval timer tracking Date.now() every second, paused on document.hidden
  useEffect(() => {
    let intervalId = null;

    const startTimer = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(() => {
        const current = Date.now();
        setNow(current);
        if (onNowTick) {
          onNowTick(current);
        }
      }, 1000);
    };

    const stopTimer = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        const current = Date.now();
        setNow(current);
        if (onNowTick) {
          onNowTick(current);
        }
        startTimer();
      }
    };

    if (!document.hidden) {
      startTimer();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onNowTick]);

  // Viewport reveal observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-revealed');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-revealed');
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Popover outside click & escape handler
  useEffect(() => {
    if (!popoverOpen) return;

    const handlePointerDown = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        calendarBtnRef.current &&
        !calendarBtnRef.current.contains(e.target)
      ) {
        setPopoverOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPopoverOpen(false);
        if (calendarBtnRef.current) {
          calendarBtnRef.current.focus();
        }
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [popoverOpen]);

  if (!event) return null;

  const startMs = new Date(event.startDate).getTime();
  const endMs = new Date(event.endDate).getTime();
  const isLive = now >= startMs && now <= endMs;

  const countdown = getCountdown(event.startDate, now);
  const regState = getRegistrationState(event, now);

  // Trigger seconds flip animation if changed and not live
  const currentSec = countdown.seconds;
  useEffect(() => {
    if (isLive) return;
    if (prevSecondsRef.current !== null && prevSecondsRef.current !== currentSec) {
      setSecFlipping(true);
      const timer = setTimeout(() => setSecFlipping(false), 260);
      return () => clearTimeout(timer);
    }
    prevSecondsRef.current = currentSec;
  }, [currentSec, isLive]);

  // Calendar handlers
  const handleDownloadIcs = () => {
    const icsContent = buildIcs(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.slug || 'event'}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPopoverOpen(false);
  };

  const handleCopyLink = async () => {
    const eventUrl = `${window.location.origin}${window.location.pathname}#events/${event.slug}`;
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // Fallback
    }
    setPopoverOpen(false);
  };

  const googleCalUrl = buildGoogleCalendarUrl(event);
  const exploreHref = `#events/${event.slug}`;
  const posterFitClass = event.posterFit === 'contain' ? 'nextup-poster-contain' : 'nextup-poster-cover';

  return (
    <section
      className="nextup-spotlight-container"
      aria-label="Featured next event"
      ref={containerRef}
    >
      <div className="nextup-spotlight-card">
        {/* Glow edge on top border */}
        <div className="nextup-gold-glow" aria-hidden="true" />

        {/* Poster (left 40%) */}
        <div className="nextup-poster-wrapper">
          {event.poster ? (
            <img
              src={event.poster}
              alt={event.title}
              className={`nextup-poster-img ${posterFitClass}`}
              loading="eager"
            />
          ) : (
            <div className="nextup-poster-placeholder">
              <span className="nextup-poster-title">{event.title}</span>
            </div>
          )}
          <div className="nextup-poster-gradient" aria-hidden="true" />
        </div>

        {/* Content (right 60%) */}
        <div className="nextup-content-area">
          {/* Eyebrow */}
          <div className="nextup-eyebrow-row">
            {isLive ? (
              <span className="nextup-eyebrow nextup-eyebrow-live">
                <span className="nextup-live-dot" aria-hidden="true" />
                HAPPENING NOW
              </span>
            ) : (
              <span className="nextup-eyebrow">NEXT UP</span>
            )}
          </div>

          {/* Title */}
          <h2 className="nextup-title">{event.title}</h2>

          {/* Meta line */}
          <p className="nextup-meta-line">{formatEventMeta(event)}</p>

          {/* Countdown or Live Pill */}
          <div className="nextup-timer-area">
            {isLive ? (
              <div className="nextup-live-banner">
                <span className="nextup-live-pill">LIVE NOW</span>
                <span className="nextup-live-ends">{formatEndsIn(event.endDate, now)}</span>
              </div>
            ) : (
              <div
                className="nextup-countdown-row"
                role="timer"
                aria-live="off"
                aria-label={`Countdown to ${event.title}: ${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds`}
              >
                <div className="countdown-block">
                  <div className="countdown-number-wrap">
                    <span className="countdown-number nextup-count-num">{String(countdown.days).padStart(2, '0')}</span>
                  </div>
                  <span className="countdown-label">DAYS</span>
                </div>
                <div className="countdown-block">
                  <div className="countdown-number-wrap">
                    <span className="countdown-number nextup-count-num">{String(countdown.hours).padStart(2, '0')}</span>
                  </div>
                  <span className="countdown-label">HOURS</span>
                </div>
                <div className="countdown-block">
                  <div className="countdown-number-wrap">
                    <span className="countdown-number nextup-count-num">{String(countdown.minutes).padStart(2, '0')}</span>
                  </div>
                  <span className="countdown-label">MINUTES</span>
                </div>
                <div className="countdown-block">
                  <div className="countdown-number-wrap">
                    <span
                      className={`countdown-number nextup-count-num seconds-digit ${
                        secFlipping ? 'is-ticking' : ''
                      }`}
                    >
                      {String(countdown.seconds).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="countdown-label">SECONDS</span>
                </div>
              </div>
            )}
          </div>

          {/* Buttons Row */}
          <div className="nextup-action-row">
            {/* Primary / state-dependent button */}
            {regState === 'open' && (
              <a
                href={event.registration?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="nextup-btn-primary"
              >
                Register now
              </a>
            )}

            {regState === 'not-open' && (
              <span
                className="nextup-pill-disabled nextup-btn-disabled"
                aria-disabled="true"
              >
                Registration opens {formatRegistrationDate(event.registration?.opensAt)}
              </span>
            )}

            {regState === 'closed' && (
              <span
                className="nextup-pill-disabled nextup-btn-disabled"
                aria-disabled="true"
              >
                Registration closed
              </span>
            )}

            {regState === 'none' && (
              <a
                href={exploreHref}
                className="nextup-btn-primary"
              >
                Explore event
              </a>
            )}

            {/* Calendar Popover Button (if enabled) */}
            {event.calendarEnabled !== false && (
              <div className="nextup-calendar-wrap nextup-calendar-dropdown-wrap">
                <button
                  type="button"
                  ref={calendarBtnRef}
                  className="nextup-btn-ghost"
                  aria-haspopup="menu"
                  aria-expanded={popoverOpen}
                  onClick={() => setPopoverOpen((prev) => !prev)}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ marginRight: 6 }}
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Add to calendar
                </button>

                {popoverOpen && (
                  <div
                    ref={popoverRef}
                    className="nextup-calendar-popover"
                    role="menu"
                    aria-label="Add to calendar options"
                  >
                    <a
                      href={googleCalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      role="menuitem"
                      className="calendar-popover-item nextup-popover-item"
                      onClick={() => setPopoverOpen(false)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Google Calendar
                    </a>

                    <button
                      type="button"
                      role="menuitem"
                      className="calendar-popover-item nextup-popover-item"
                      onClick={handleDownloadIcs}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download .ics
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      className="calendar-popover-item nextup-popover-item"
                      onClick={handleCopyLink}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      {copyFeedback ? 'Link copied!' : 'Copy link'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Explore event text link (always present beside buttons) */}
            <a
              href={exploreHref}
              className="nextup-explore-link"
            >
              Explore event &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
