import React from 'react';
import './TodayMarker.css';

export default function TodayMarker() {
  return (
    <div className="timeline-today-item" aria-label="Today Marker" data-testid="today-marker">
      <div className="today-marker-pill">
        <span className="today-dot" aria-hidden="true" />
        <span className="today-label">TODAY</span>
      </div>
    </div>
  );
}
