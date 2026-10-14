import React, { useEffect, useRef, useState, useMemo } from 'react';
import EventCard from './EventCard';
import YearMarker from './YearMarker';
import TodayMarker from './TodayMarker';
import { getStatus, groupByYear } from '../../data/events';
import './EventsTimeline.css';

// SVG Star matching five-point star shape in CodeStars logo
function StarNode({ flagship, isUpcoming, isLit }) {
  const size = flagship ? 30 : 22;

  return (
    <div
      className={`timeline-star-node ${flagship ? 'is-flagship' : ''} ${
        isUpcoming ? 'is-upcoming' : ''
      } ${isLit ? 'is-reached' : ''}`}
      data-testid="timeline-star"
      aria-hidden="true"
    >
      <div className="star-radial-glow" />
      <svg
        className="star-svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon
          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          className="star-polygon"
        />
      </svg>
    </div>
  );
}

export default function EventsTimeline({
  events = [],
  onExplore,
  referenceNow = new Date(),
}) {
  const timelineColRef = useRef(null);
  const groupedYears = useMemo(() => groupByYear(events), [events]);
  const [expandedYears, setExpandedYears] = useState({});

  const toggleYear = (yr) => {
    setExpandedYears((prev) => ({
      ...prev,
      [yr]: !prev[yr],
    }));
  };

  // Spine progress calculation via a single throttled requestAnimationFrame scroll listener
  useEffect(() => {
    let animId = null;
    let isTicking = false;

    const updateSpine = () => {
      isTicking = false;
      const colEl = timelineColRef.current;
      if (!colEl) return;

      const rect = colEl.getBoundingClientRect();
      const windowH = window.innerHeight;
      const viewportMid = windowH / 2;

      const colTop = rect.top;
      const colHeight = rect.height;

      if (colHeight <= 0) return;

      const progress = Math.max(0, Math.min(1, (viewportMid - colTop) / colHeight));
      colEl.style.setProperty('--spine-progress', progress.toFixed(4));

      // Light up nodes whose top is above viewport middle
      const nodes = colEl.querySelectorAll('.timeline-star-node');
      nodes.forEach((node) => {
        const nodeRect = node.getBoundingClientRect();
        if (nodeRect.top < viewportMid) {
          node.classList.add('is-reached');
        } else {
          node.classList.remove('is-reached');
        }
      });
    };

    const onScroll = () => {
      if (!isTicking) {
        isTicking = true;
        animId = requestAnimationFrame(updateSpine);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateSpine();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [events, groupedYears]);

  // Single IntersectionObserver for reveal animation
  useEffect(() => {
    const colEl = timelineColRef.current;
    if (!colEl) return;

    const cards = colEl.querySelectorAll('.timeline-row-grid');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.1 }
    );

    cards.forEach((card, index) => {
      card.style.setProperty('--card-stagger', `${(index % 6) * 80}ms`);
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, [events, groupedYears, expandedYears]);

  if (events.length === 0) return null;

  // Determine if both upcoming and completed events exist in visible events
  const hasUpcoming = events.some((e) => {
    const s = getStatus(e, referenceNow);
    return s === 'upcoming' || s === 'live';
  });
  const hasCompleted = events.some((e) => {
    const s = getStatus(e, referenceNow);
    return s === 'completed';
  });
  const renderTodayMarkerOverall = hasUpcoming && hasCompleted;

  let globalVisibleIndex = 0;
  let todayMarkerRendered = false;

  return (
    <div className="events-timeline-container" ref={timelineColRef}>
      {/* 2px Gold Spine line runs down center (desktop) / left edge (mobile) */}
      <div className="timeline-spine-track" aria-hidden="true">
        <div className="timeline-spine-draw" />
      </div>

      <div className="timeline-groups-wrap">
        {groupedYears.map((yearGroup, yearIndex) => {
          // Keep older years expander only if more than 2 years of events exist
          const hasMoreThanTwoYears = groupedYears.length > 2;
          const isOlder = hasMoreThanTwoYears && yearIndex >= 2;
          const isExpanded = !isOlder || !!expandedYears[yearGroup.year];

          // Check if the Today marker boundary falls immediately before this year group
          const firstEventInYear = yearGroup.events[0];
          const firstEventStatus = firstEventInYear ? getStatus(firstEventInYear, referenceNow) : null;
          const isFirstEventCompleted = firstEventStatus === 'completed';

          const shouldRenderTodayBeforeYearMarker =
            renderTodayMarkerOverall &&
            !todayMarkerRendered &&
            isFirstEventCompleted;

          const yearElements = [];

          if (shouldRenderTodayBeforeYearMarker) {
            todayMarkerRendered = true;
            yearElements.push(
              <TodayMarker key="today-marker-before-year" />
            );
          }

          // Year Marker pill
          yearElements.push(
            <YearMarker key={`ym-${yearGroup.year}`} year={yearGroup.year} />
          );

          if (isOlder && !isExpanded) {
            yearElements.push(
              <div key={`exp-${yearGroup.year}`} className="timeline-year-expander-wrap">
                <button
                  type="button"
                  className="timeline-year-expander-btn"
                  onClick={() => toggleYear(yearGroup.year)}
                  aria-label={`Expand year ${yearGroup.year}`}
                >
                  <span>Show {yearGroup.year} ({yearGroup.events.length} events)</span>
                  <span className="expander-plus">+</span>
                </button>
              </div>
            );
          } else {
            const rowElements = [];
            yearGroup.events.forEach((event) => {
              const status = getStatus(event, referenceNow);
              const isUpcomingOrLive = status === 'upcoming' || status === 'live';

              // If boundary falls inside this year group before this completed event
              if (
                renderTodayMarkerOverall &&
                !todayMarkerRendered &&
                !isUpcomingOrLive
              ) {
                todayMarkerRendered = true;
                rowElements.push(
                  <TodayMarker key={`today-marker-${event.slug}`} />
                );
              }

              const currentIndex = globalVisibleIndex++;
              // Even index (0, 2, 4...) -> Left card; Odd index (1, 3, 5...) -> Right card
              const isLeftCard = currentIndex % 2 === 0;

              rowElements.push(
                <div
                  key={event.slug}
                  className={`timeline-row-grid ${isLeftCard ? 'card-on-left' : 'card-on-right'}`}
                  data-slug={event.slug}
                >
                  {/* Left Column */}
                  <div className="timeline-col-card left-card-col">
                    {isLeftCard && (
                      <div className="card-and-connector-wrap">
                        <EventCard
                          event={event}
                          status={status}
                          onExplore={onExplore}
                        />
                        <div className="star-connector connector-right" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  {/* Spine Column: Star Node */}
                  <div className="timeline-col-spine">
                    <StarNode
                      flagship={event.flagship}
                      isUpcoming={isUpcomingOrLive}
                      isLit={false}
                    />
                  </div>

                  {/* Right Column */}
                  <div className="timeline-col-card right-card-col">
                    {!isLeftCard && (
                      <div className="card-and-connector-wrap">
                        <div className="star-connector connector-left" aria-hidden="true" />
                        <EventCard
                          event={event}
                          status={status}
                          onExplore={onExplore}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            });

            yearElements.push(
              <div key={`rows-${yearGroup.year}`} className="timeline-rows-container">
                {rowElements}
              </div>
            );
          }

          return (
            <section
              key={yearGroup.year}
              className="timeline-year-section"
              aria-label={`Events in ${yearGroup.year}`}
            >
              {yearElements}
            </section>
          );
        })}
      </div>
    </div>
  );
}
