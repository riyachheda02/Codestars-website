import React from 'react';
import './YearMarker.css';

export default function YearMarker({ year }) {
  return (
    <div className="timeline-year-marker" id={`year-${year}`} data-testid="year-marker">
      <div className="year-marker-pill">
        <span className="year-marker-number">{year}</span>
      </div>
    </div>
  );
}
