import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { heroPhotos } from '../constant/photos';
import './ScatteredGallery.css';

// Pre-curated organic scatter positions (x, y offsets relative to center, rotation angle, width)
// Spreads 18 photos naturally around the central "memories" hub
const SCATTER_LAYOUT = [
  // Quadrant 1 (Top-Right)
  { x: 340, y: -200, rot: -3, width: 215 },
  { x: 680, y: -290, rot: 4, width: 220 },
  { x: 480, y: -480, rot: -2, width: 205 },
  { x: 960, y: -160, rot: 5, width: 215 },

  // Quadrant 2 (Top-Left)
  { x: -350, y: -210, rot: 3, width: 215 },
  { x: -690, y: -300, rot: -4, width: 220 },
  { x: -460, y: -490, rot: 2, width: 205 },
  { x: -970, y: -180, rot: -5, width: 215 },

  // Quadrant 3 (Bottom-Left)
  { x: -350, y: 240, rot: -3, width: 215 },
  { x: -700, y: 300, rot: 4, width: 220 },
  { x: -470, y: 510, rot: -2, width: 205 },
  { x: -980, y: 270, rot: 3, width: 215 },

  // Quadrant 4 (Bottom-Right)
  { x: 360, y: 250, rot: 4, width: 215 },
  { x: 710, y: 310, rot: -3, width: 220 },
  { x: 490, y: 520, rot: 3, width: 205 },
  { x: 990, y: 280, rot: -4, width: 215 },

  // Direct Vertical Outer Accents
  { x: 10, y: -430, rot: 2, width: 210 },
  { x: -10, y: 470, rot: -3, width: 215 },
];

export default function ScatteredGallery() {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerRef = useRef(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 });
  const dragDistanceRef = useRef(0);

  // Map each photo to a stable scatter position
  const scatterItems = useMemo(() => {
    return heroPhotos.map((photo, index) => {
      const layout = SCATTER_LAYOUT[index % SCATTER_LAYOUT.length];
      return {
        ...photo,
        ...layout,
      };
    });
  }, []);

  const getContentBounds = useCallback(() => {
    const wrapper = containerRef.current?.closest('.scattered-gallery-wrapper');
    const cards = containerRef.current?.querySelectorAll('.scattered-card');
    if (!wrapper || !cards?.length) return null;

    const scatterScale = Number.parseFloat(
      window.getComputedStyle(wrapper).getPropertyValue('--scatter-scale')
    ) || 1;

    return Array.from(cards).reduce((bounds, card, index) => {
      const photo = scatterItems[index];
      const angle = Math.abs(photo.rot) * (Math.PI / 180);
      const halfWidth = (card.offsetWidth * Math.cos(angle) + card.offsetHeight * Math.sin(angle)) / 2;
      const halfHeight = (card.offsetWidth * Math.sin(angle) + card.offsetHeight * Math.cos(angle)) / 2;
      const centerX = photo.x * scatterScale;
      const centerY = photo.y * scatterScale;

      return {
        left: Math.min(bounds.left, centerX - halfWidth),
        right: Math.max(bounds.right, centerX + halfWidth),
        top: Math.min(bounds.top, centerY - halfHeight),
        bottom: Math.max(bounds.bottom, centerY + halfHeight),
      };
    }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });
  }, [scatterItems]);

  const constrainPan = useCallback((x, y, scale = zoom) => {
    const bounds = getContentBounds();
    const viewport = containerRef.current;
    if (!bounds || !viewport) return { x, y };

    const { width, height } = viewport.getBoundingClientRect();
    const constrainAxis = (position, min, max, size) => {
      const lowerLimit = size / 2 - max * scale;
      const upperLimit = -size / 2 - min * scale;
      if (lowerLimit > upperLimit) return -((min + max) / 2) * scale;
      return Math.max(lowerLimit, Math.min(upperLimit, position));
    };

    return {
      x: constrainAxis(x, bounds.left, bounds.right, width),
      y: constrainAxis(y, bounds.top, bounds.bottom, height),
    };
  }, [getContentBounds, zoom]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedPhoto(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    // Only left click initiates dragging
    if (e.button !== 0) return;
    setIsDragging(true);
    setIsTransitioning(false);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    dragDistanceRef.current = Math.hypot(dx, dy);

    setPan(constrainPan(dragStartRef.current.panX + dx, dragStartRef.current.panY + dy));
  }, [constrainPan, isDragging]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers for mobile/tablet
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setIsTransitioning(false);
      dragStartRef.current = {
        mouseX: touch.clientX,
        mouseY: touch.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      dragDistanceRef.current = 0;
    }
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.mouseX;
    const dy = touch.clientY - dragStartRef.current.mouseY;
    dragDistanceRef.current = Math.hypot(dx, dy);

    setPan(constrainPan(dragStartRef.current.panX + dx, dragStartRef.current.panY + dy));
  }, [constrainPan, isDragging]);

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Click on photo handler: Only open lightbox if not dragged
  const handleCardClick = (photo, e) => {
    e.stopPropagation();
    if (dragDistanceRef.current > 6) {
      // User was dragging to pan, do not open lightbox
      return;
    }
    setSelectedPhoto(photo);
  };

  // Recenter canvas to center (0, 0)
  const handleRecenter = () => {
    setIsTransitioning(true);
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Zoom controls
  const handleZoom = (delta) => {
    const nextZoom = Math.max(0.65, Math.min(1.25, +(zoom + delta).toFixed(2)));
    setIsTransitioning(true);
    setPan((current) => constrainPan(current.x, current.y, nextZoom));
    setZoom(nextZoom);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  return (
    <div className="scattered-gallery-wrapper">
      {/* Top Header Bar with Filter Tabs & Eyebrow */}
      <div className="scattered-topbar">
        <div className="gallery-filter-tabs">
          {['ALL', '2026', '2025'].map((filter) => (
            <button
              key={filter}
              className={`gallery-filter-pill ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === 'ALL' ? 'All Memories' : `Batch ${filter}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Drag Canvas Viewport */}
      <div
        ref={containerRef}
        className={`scattered-viewport ${isDragging ? 'is-dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Dynamic moving dot grid background linked to pan offset */}
        <div
          className="canvas-dot-grid"
          style={{
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {/* Floating Controls Dock */}
        <div className="canvas-controls-dock" onClick={(e) => e.stopPropagation()}>
          <button
            className="dock-btn recenter-btn"
            onClick={handleRecenter}
            title="Recenter view to Memories"
          >
            <span className="dock-icon">⌖</span>
            <span className="dock-label">Center View</span>
          </button>
          <div className="dock-divider" />
          <button
            className="dock-btn zoom-btn"
            onClick={() => handleZoom(0.15)}
            title="Zoom In"
          >
            +
          </button>
          <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
          <button
            className="dock-btn zoom-btn"
            onClick={() => handleZoom(-0.15)}
            title="Zoom Out"
          >
            −
          </button>
        </div>

        {/* Hint Banner in corner */}
        <div className="canvas-hint-pill">
          <span className="hint-pulse" />
          <span className="hint-text">Drag anywhere to explore • Click photo to expand</span>
        </div>

        {/* The Transformed World Plane */}
        <div
          className="scattered-world"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transition: isTransitioning ? 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          }}
        >
          {/* =========================================================
              CENTERPIECE: "memories" HUB
             ========================================================= */}
          <div className="canvas-center-hub">
            {/* Decorative pushpin like in reference photo */}
            <div className="hub-pushpin" title="Pinned to Canvas">
              <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
                <ellipse cx="14" cy="30" rx="9" ry="3" fill="rgba(0,0,0,0.35)" />
                <path d="M14 18L14 30" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="14" cy="12" r="10" fill="#2563eb" />
                <circle cx="14" cy="12" r="7" fill="#3b82f6" />
                <circle cx="11" cy="9" r="2.5" fill="#93c5fd" />
              </svg>
            </div>

            <span className="hub-tag">[ARCHIVES]</span>
            <h1 className="hub-title">memories</h1>
            <p className="hub-subtitle">
              a scattered canvas of moments, hackathons, team triumphs, and community milestones
            </p>

            <div className="hub-drag-pill">
              <svg className="drag-arrows-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="5 9 2 12 5 15" />
                <polyline points="9 5 12 2 15 5" />
                <polyline points="15 19 12 22 9 19" />
                <polyline points="19 9 22 12 19 15" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="12" y1="2" x2="12" y2="22" />
              </svg>
              <span>DRAG TO MOVE</span>
            </div>

            {/* Subtle decorative secondary pushpin */}
            <div className="hub-secondary-pin">
              <svg width="22" height="28" viewBox="0 0 28 34" fill="none">
                <ellipse cx="14" cy="30" rx="8" ry="2.5" fill="rgba(0,0,0,0.3)" />
                <path d="M14 18L14 29" stroke="#aaa" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="14" cy="12" r="9" fill="#F5B93A" />
                <circle cx="11" cy="9" r="2" fill="#fff" />
              </svg>
            </div>
          </div>

          {/* =========================================================
              SCATTERED PHOTO CARDS (Labels placed strictly BELOW)
             ========================================================= */}
          {scatterItems.map((photo) => {
            const isMatch = activeFilter === 'ALL' || photo.year === activeFilter;

            return (
              <div
                key={photo.id}
                className={`scattered-card ${isMatch ? 'card-active' : 'card-dimmed'}`}
                style={{
                  transform: `translate(calc(${photo.x}px * var(--scatter-scale, 1) - 50%), calc(${photo.y}px * var(--scatter-scale, 1) - 50%)) rotate(${photo.rot}deg)`,
                  width: `calc(${photo.width}px * var(--card-width-scale, 1))`,
                }}
                onClick={(e) => isMatch && handleCardClick(photo, e)}
              >
                {/* Photo container without any overlay */}
                <div className="card-image-box">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    loading="lazy"
                    draggable={false}
                  />
                </div>

                {/* LABELS PLACED STRICTLY BELOW THE PHOTO */}
                <div className="card-caption-below">
                  <div className="caption-header">
                    <h3 className="caption-title">{photo.title}</h3>
                    <span className="caption-year-pill">{photo.year}</span>
                  </div>
                  <div className="caption-footer">
                    <span className="caption-sub">
                      {photo.year === '2026' ? 'Recent Highlight' : 'Hall of Fame Archive'}
                    </span>
                    <span className="caption-view-hint">Inspect ↗</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal for Full-Resolution Viewing */}
      {selectedPhoto && (
        <div className="lightbox-backdrop" onClick={() => setSelectedPhoto(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-close"
              onClick={() => setSelectedPhoto(null)}
              aria-label="Close Lightbox"
            >
              ✕
            </button>
            <div className="lightbox-image-holder">
              <img src={selectedPhoto.url} alt={selectedPhoto.title} />
            </div>
            <div className="lightbox-info">
              <div>
                <h3>{selectedPhoto.title}</h3>
                <p className="lightbox-desc">
                  CodeStars Archive • Photographed during official events and competitions.
                </p>
              </div>
              <span className="lightbox-year">Batch of {selectedPhoto.year}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
