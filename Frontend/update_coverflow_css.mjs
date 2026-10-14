import fs from 'fs';

let c = fs.readFileSync('src/pages/Home.css', 'utf8').replace(/\r\n/g, '\n');
const start = c.indexOf('/* Coverflow Stage */');
const end = c.indexOf('/* Standard Fixed Row Below Carousel:', start);

if (start !== -1 && end !== -1) {
  const replacement = `/* Coverflow Stage: Perspective 1200px for true 3D sorting, no z-index fighting */
.coverflow-stage {
  position: relative;
  width: 100%;
  height: clamp(240px, 42vw, 420px);
  perspective: 1200px;
  perspective-origin: 50% 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  touch-action: pan-y;
  margin-bottom: 28px;
  z-index: 5;
}

.coverflow-stage.is-dragging {
  cursor: grabbing;
}

.coverflow-track {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

/* Cards: Transitions governed by --dur and cubic-bezier(0.45, 0, 0.15, 1).
   Animate ONLY transform and opacity. Depth ordering via continuous translateZ.
   Fixed shadows on pseudo-element. backface-visibility: hidden. */
.coverflow-card {
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(300px, 58vw, 640px);
  height: clamp(190px, 36vw, 360px);
  margin-top: calc(-1 * clamp(190px, 36vw, 360px) / 2);
  border-radius: 20px;
  background: var(--bg-3);
  border: 1px solid rgba(245, 185, 58, 0.22);
  transition:
    transform var(--dur, 650ms) cubic-bezier(0.45, 0, 0.15, 1),
    opacity var(--dur, 650ms) cubic-bezier(0.45, 0, 0.15, 1);
  transform-origin: center center;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* Card only receives will-change during active transition */
.coverflow-card.is-transitioning {
  will-change: transform, opacity;
}

/* Fixed static shadow on pseudo-element (no animated box-shadow or filter blur) */
.coverflow-card::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 22px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.9);
  pointer-events: none;
  z-index: -1;
}

/* Center card highlight */
.coverflow-card.is-center {
  cursor: pointer;
  border-color: rgba(245, 185, 58, 0.5);
}

.coverflow-card.is-center::before {
  box-shadow:
    0 32px 75px rgba(0, 0, 0, 0.98),
    0 0 65px rgba(245, 185, 58, 0.28);
}

.coverflow-card.is-center:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 4px;
}

/* Side cards cursor */
.coverflow-card.is-side {
  cursor: pointer;
}

.coverflow-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 20px;
  background: #000;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.coverflow-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: transform var(--dur, 650ms) cubic-bezier(0.45, 0, 0.15, 1);
}

/* Dark Dimming Overlay for non-center cards (opacity-only transition) */
.coverflow-card-dimmer {
  position: absolute;
  inset: 0;
  background: #000000;
  pointer-events: none;
  transition: opacity var(--dur, 650ms) cubic-bezier(0.45, 0, 0.15, 1);
  backface-visibility: hidden;
}

/* Center Card 3D Glare effect */
.coverflow-card-glare {
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: screen;
  transition: opacity 0.15s ease-out;
}

`;
  c = c.slice(0, start) + replacement + c.slice(end);
  fs.writeFileSync('src/pages/Home.css', c);
  console.log('Coverflow card styles updated successfully');
} else {
  console.error('Could not find start/end marks:', start, end);
  process.exit(1);
}
