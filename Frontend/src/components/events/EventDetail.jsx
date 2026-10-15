import React from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
  Building2,
  ExternalLink,
  Sparkles,
  Flame,
  Zap,
  Coffee,
} from 'lucide-react';
import { getEventBySlug, getStatus, formatEventDate } from '../../data/events';
import Footer from '../Footer';
import './EventDetail.css';

const CATEGORY_ICONS = {
  flagship: Sparkles,
  contest: Trophy,
  workshop: Flame,
  mentorship: Zap,
  talk: Coffee,
};

export default function EventDetail({
  slug,
  onBack,
  onNavigate,
  referenceNow = new Date(),
}) {
  const event = getEventBySlug(slug);

  if (!event) {
    return (
      <div className="event-detail-notfound-page">
        <div className="event-detail-container">
          <button type="button" className="event-detail-back-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back to events</span>
          </button>
          <div className="notfound-card">
            <h1 className="notfound-title">Event Not Found</h1>
            <p className="notfound-desc">
              We couldn't find an event matching <code>{slug}</code>. It might have been moved or removed.
            </p>
            <button type="button" className="notfound-return-btn" onClick={onBack}>
              View All Events
            </button>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const status = getStatus(event, referenceNow);
  const CategoryIcon = CATEGORY_ICONS[event.category] || Sparkles;

  const statusLabel =
    status === 'upcoming'
      ? 'Upcoming'
      : status === 'live'
      ? 'Live now'
      : 'Completed';

  const statusClass =
    status === 'upcoming'
      ? 'status-upcoming'
      : status === 'live'
      ? 'status-live'
      : 'status-completed';

  const hasStats =
    event.stats &&
    (event.stats.prizePool ||
      event.stats.participants ||
      event.stats.institutes ||
      event.stats.teams);

  return (
    <div className="event-detail-page">
      <div className="event-detail-ambience" aria-hidden="true" />

      <div className="event-detail-container">
        {/* Back Button */}
        <div className="event-detail-top-nav">
          <button
            type="button"
            className="event-detail-back-btn"
            onClick={onBack}
            aria-label="Back to events list"
          >
            <ArrowLeft size={16} />
            <span>Back to events</span>
          </button>
        </div>

        {/* Hero Banner with Poster & Overview */}
        <article className="event-detail-card-glass">
          <div className="detail-media-banner">
            <img
              src={event.poster}
              alt={event.title}
              className="detail-poster-img"
              width={event.posterDimensions?.width || 1200}
              height={event.posterDimensions?.height || 600}
            />
            <div className="detail-poster-overlay" aria-hidden="true" />
            <div className="detail-poster-badges">
              <span className="detail-category-badge">
                <CategoryIcon size={12} strokeWidth={2.5} />
                <span>{event.category.toUpperCase()}</span>
              </span>
              <span className={`detail-status-badge ${statusClass}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="detail-body-content">
            <h1 className="detail-title-serif">{event.title}</h1>

            {/* Meta chips */}
            <div className="detail-meta-strip">
              <div className="detail-meta-chip">
                <Calendar size={14} />
                <time dateTime={event.startDate}>{formatEventDate(event)}</time>
              </div>
              {event.time && (
                <div className="detail-meta-chip">
                  <Clock size={14} />
                  <span>{event.time}</span>
                </div>
              )}
              {event.venue && (
                <div className="detail-meta-chip">
                  <MapPin size={14} />
                  <span>{event.venue}</span>
                </div>
              )}
              {event.mode && (
                <div className="detail-meta-chip detail-mode-chip">
                  <span>{event.mode.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="detail-description-section">
              <h2 className="detail-section-heading">About the Event</h2>
              <p className="detail-full-text">{event.description}</p>
            </div>

            {/* Stats chips */}
            {hasStats && (
              <div className="detail-stats-section">
                <h2 className="detail-section-heading">Highlights & Numbers</h2>
                <div className="detail-stats-grid">
                  {event.stats.prizePool && (
                    <div className="detail-stat-card">
                      <Trophy size={18} className="stat-gold-icon" />
                      <div className="stat-card-text">
                        <span className="stat-card-val gold">{event.stats.prizePool}</span>
                        <span className="stat-card-lbl">Prize Pool</span>
                      </div>
                    </div>
                  )}
                  {event.stats.participants && (
                    <div className="detail-stat-card">
                      <Users size={18} className="stat-gold-icon" />
                      <div className="stat-card-text">
                        <span className="stat-card-val">{event.stats.participants}</span>
                        <span className="stat-card-lbl">Participants</span>
                      </div>
                    </div>
                  )}
                  {event.stats.institutes && (
                    <div className="detail-stat-card">
                      <Building2 size={18} className="stat-gold-icon" />
                      <div className="stat-card-text">
                        <span className="stat-card-val">{event.stats.institutes}</span>
                        <span className="stat-card-lbl">Institutes</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="detail-actions-row">
              {status === 'upcoming' && event.registration?.url && (
                <a
                  href={event.registration.url}
                  target="_blank"
                  rel="noreferrer"
                  className="detail-btn detail-btn-primary"
                >
                  <span>Register Now</span>
                </a>
              )}
              {event.externalUrl && (
                <a
                  href={event.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="detail-btn detail-btn-secondary"
                >
                  <span>Visit Official Website</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </article>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
