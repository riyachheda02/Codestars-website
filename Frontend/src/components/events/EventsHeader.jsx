import React from 'react';
import Starfield from '../home/Starfield';
import './EventsHeader.css';

export default function EventsHeader() {
  return (
    <header className="events-header-compact">
      {/* Background low density starfield behind header */}
      <div className="events-header-starfield-wrap" aria-hidden="true">
        <Starfield />
      </div>

      <div className="events-header-glow" aria-hidden="true" />

      <div className="events-header-inner">
        {/* Section title in Playfair uppercase style with gold glow & thin underline */}
        <div className="events-head-display">
          <h1 className="events-display-title">EVENTS</h1>
          <div className="events-title-underline" aria-hidden="true" />
          <p className="events-display-subtitle">
            Contests, workshops and talks from DJS CodeStars
          </p>
        </div>
      </div>
    </header>
  );
}
