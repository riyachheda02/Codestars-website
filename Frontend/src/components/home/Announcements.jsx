import React, { useState, useMemo } from 'react';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { announcementsData } from '../../data/home';

export default function Announcements({ onNavigate }) {
  const [expanded, setExpanded] = useState({});

  const sortedItems = useMemo(() => {
    return [...announcementsData]
      .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime())
      .slice(0, 3);
  }, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleLinkClick = (e, url) => {
    if (url.startsWith('#')) {
      e.preventDefault();
      const target = url.replace('#', '');
      if (onNavigate) {
        onNavigate(target);
      } else {
        window.location.hash = url;
      }
    }
  };

  return (
    <section id="announcements" className="home-section announcements-section" aria-label="Latest announcements">
      <div className="section-container">
        <div className="section-head-display">
          <h2 className="section-display-title">ANNOUNCEMENTS</h2>
          <div className="section-title-underline" aria-hidden="true" />
        </div>

        <div className="announcements-list">
          {sortedItems.map((ann) => {
            const isExpanded = !!expanded[ann.id];
            const isUpdate = ann.type === 'UPDATE';

            const handleCardPointerMove = (e) => {
              if (window.matchMedia('(pointer: coarse)').matches) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              e.currentTarget.style.setProperty('--mx', `${x}px`);
              e.currentTarget.style.setProperty('--my', `${y}px`);
            };

            const handleCardPointerLeave = (e) => {
              e.currentTarget.style.removeProperty('--mx');
              e.currentTarget.style.removeProperty('--my');
            };

            return (
              <div
                key={ann.id}
                className="announcement-item-card"
                onPointerMove={handleCardPointerMove}
                onPointerLeave={handleCardPointerLeave}
              >
                {/* Gold accent bar on left edge grows scaleY 0 to 1 on hover */}
                <div className="announcement-left-accent-bar" aria-hidden="true" />
                {/* Card spotlight element */}
                <div className="announcement-card-spotlight" aria-hidden="true" />

                {/* Left Square Date Box */}
                <div className="announcement-date-box">
                  <span className="date-month">{ann.date.month}</span>
                  <span className="date-day">{ann.date.day}</span>
                </div>

                {/* Main Content Area */}
                <div className="announcement-body">
                  <div className="announcement-header-row">
                    <h3 className="announcement-heading">{ann.title}</h3>
                    <span
                      className={`announcement-badge ${
                        isUpdate ? 'badge-update-blue' : 'badge-event-gold'
                      }`}
                    >
                      {ann.type}
                    </span>
                  </div>

                  <p className="announcement-preview">{ann.shortDesc}</p>

                  {/* Expandable full description with smooth grid / height animation */}
                  <div className={`announcement-expand-collapse-wrapper ${isExpanded ? 'is-expanded' : ''}`}>
                    <div className="announcement-expand-collapse-inner">
                      <div className="announcement-expanded-content">
                        <p className="announcement-full-desc">{ann.fullDesc}</p>
                        {ann.linkText && ann.linkUrl && (
                          <a
                            href={ann.linkUrl}
                            className="announcement-link-btn"
                            target={ann.linkUrl.startsWith('http') ? '_blank' : undefined}
                            rel={ann.linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                            onClick={(e) => handleLinkClick(e, ann.linkUrl)}
                          >
                            <span>{ann.linkText}</span>
                            <ArrowUpRight size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expand / Collapse toggle */}
                  <button
                    type="button"
                    className="announcement-expand-btn"
                    onClick={() => toggleExpand(ann.id)}
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? 'Read less' : 'Read more'}</span>
                    <ChevronDown
                      size={15}
                      className={`announcement-chevron ${isExpanded ? 'is-rotated' : ''}`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
