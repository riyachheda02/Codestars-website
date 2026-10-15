import React from 'react';
import { ArrowRight } from 'lucide-react';
import { formatEventDate } from '../../data/events';
import './EventCard.css';

export default function EventCard({
  event,
  status,
  onExplore,
}) {
  const handlePointerMove = (e) => {
    // Only on pointer devices, disabled on touch / reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mx', `${x}px`);
    e.currentTarget.style.setProperty('--my', `${y}px`);
  };

  const handlePointerLeave = (e) => {
    e.currentTarget.style.setProperty('--mx', '-1000px');
    e.currentTarget.style.setProperty('--my', '-1000px');
  };

  // Only show status pill for Upcoming or Live events (no "Completed" badge)
  const isUpcomingOrLive = status === 'upcoming' || status === 'live';
  const statusLabel = status === 'live' ? 'Live now' : 'Upcoming';
  const statusClass = status === 'live' ? 'status-live' : 'status-upcoming';

  // Category label: for flagship events show "FLAGSHIP", else event.category.toUpperCase()
  const categoryLabel = event.flagship ? 'FLAGSHIP' : event.category.toUpperCase();

  // Date and venue meta line: format "date - venue", omit whatever is missing
  const formattedDate = formatEventDate(event);
  const metaParts = [];
  if (formattedDate) metaParts.push(formattedDate);
  if (event.venue) metaParts.push(event.venue);
  const metaLine = metaParts.join(' • ');

  const posterFit = event.posterFit || 'cover';

  return (
    <article
      className={`compact-event-card ${event.flagship ? 'is-flagship' : ''}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      data-slug={event.slug}
      data-testid="event-card"
    >
      <div className="compact-card-spotlight" aria-hidden="true" />
      {event.flagship && <div className="compact-flagship-hairline" aria-hidden="true" />}

      {/* Left Poster (38% width, full card height) */}
      <div
        className="compact-poster-wrapper"
        style={{ backgroundColor: posterFit === 'contain' ? '#0B0F1A' : undefined }}
      >
        <img
          src={event.poster}
          alt={`${event.title} poster`}
          className="compact-poster-img"
          style={{ objectFit: posterFit }}
          loading="lazy"
          decoding="async"
        />
        <div className="compact-poster-gradient" aria-hidden="true" />
      </div>

      {/* Right Content Area */}
      <div className="compact-content-area">
        {/* Single row with category label and optional status pill */}
        <div className="compact-badges-row">
          <span className="compact-category-label">{categoryLabel}</span>
          {isUpcomingOrLive && (
            <span className={`compact-status-pill ${statusClass}`}>
              {status === 'live' && <span className="compact-live-dot" />}
              {statusLabel}
            </span>
          )}
        </div>

        {/* Title in Playfair 24px, clamped to at most 2 lines */}
        <h3 className="compact-title-serif">{event.title}</h3>

        {/* Mono 12px meta line "date - venue" */}
        {metaLine && (
          <div className="compact-meta-line">
            <time dateTime={event.startDate}>{metaLine}</time>
          </div>
        )}

        {/* Description in Inter 15px, clamped to 2 lines */}
        <p className="compact-description">
          {event.shortDescription || event.description}
        </p>

        {/* ONE action: a gold "Explore event" button with an arrow */}
        <div className="compact-action-row">
          <button
            type="button"
            className="compact-explore-btn"
            onClick={() => onExplore(event.slug)}
            aria-label={`Explore event ${event.title}`}
          >
            <span>Explore event</span>
            <ArrowRight size={14} className="compact-arrow-icon" />
          </button>
        </div>
      </div>
    </article>
  );
}
