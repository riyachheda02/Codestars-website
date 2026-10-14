import fs from 'fs';

let c = fs.readFileSync('src/pages/Home.css', 'utf8').replace(/\r\n/g, '\n');

// 1. Update .featured-events-section padding
const oldSection = `.featured-events-section {
  position: relative;
  background: linear-gradient(180deg, var(--bg) 0%, #0F1626 50%, var(--bg) 100%);
  overflow: hidden;
  padding-bottom: 130px;
}`;

const newSection = `.featured-events-section {
  position: relative;
  background: linear-gradient(180deg, var(--bg) 0%, #0F1626 50%, var(--bg) 100%);
  overflow: hidden;
  padding-top: 96px;
  padding-bottom: 110px;
}`;

if (c.includes(oldSection)) {
  c = c.replace(oldSection, newSection);
  console.log('Replaced featured-events-section padding');
} else {
  console.log('featured-events-section not matched');
}

// 2. Update heading in featured events: position relative, z-index 2, margin-bottom 40px
const oldHeading = `.featured-events-section .section-head-display {
  position: relative;
  z-index: 2;
  margin-bottom: 40px;
}`;

// Check if section-head-display inside featured-events needs its own rule
if (!c.includes('.featured-events-section .section-head-display')) {
  const headPos = c.indexOf('.featured-events-section .section-display-title');
  if (headPos !== -1) {
    const insertHead = `.featured-events-section .section-head-display {
  position: relative;
  z-index: 2;
  margin-bottom: 40px;
}

`;
    c = c.slice(0, headPos) + insertHead + c.slice(headPos);
    console.log('Inserted .featured-events-section .section-head-display rule');
  }
}

// 3. Update coverflow-stage and coverflow-card
const stageStart = c.indexOf('/* Coverflow Stage: Perspective 1200px');
const stageEnd = c.indexOf('/* Center Card 3D Glare effect', stageStart);

if (stageStart !== -1 && stageEnd !== -1) {
  const newCoverflow = `/* Coverflow Stage: Perspective 1200px for true 3D sorting, no z-index fighting */
.coverflow-stage {
  position: relative;
  width: 100%;
  height: clamp(260px, 31vw, 380px);
  perspective: 1200px;
  perspective-origin: 50% 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  touch-action: pan-y;
  margin-bottom: 32px;
  z-index: 1;
  isolation: isolate;
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
   Center card width clamp(300px, 37vw, 560px) with 16:9 ratio.
   Animate ONLY transform and opacity. Depth ordering via continuous translateZ.
   Fixed shadows on pseudo-element. backface-visibility: hidden. */
.coverflow-card {
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(300px, 37vw, 560px);
  aspect-ratio: 16 / 9;
  height: auto;
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

`;
  c = c.slice(0, stageStart) + newCoverflow + c.slice(stageEnd);
  console.log('Replaced coverflow stage and card CSS');
}

// 4. Update dot animation from 6s to 4s
c = c.replace('animation: dotFillAnim 6s linear forwards;', 'animation: dotFillAnim 4s linear forwards;');

// 5. Update responsive coverflow-stage heights
c = c.replace('.coverflow-stage {\n    height: 320px;\n  }', '.coverflow-stage {\n    height: clamp(220px, 50vw, 320px);\n  }');
c = c.replace('.coverflow-stage {\n    height: 240px;\n  }', '.coverflow-stage {\n    height: clamp(190px, 54vw, 250px);\n  }');

fs.writeFileSync('src/pages/Home.css', c);
console.log('Home.css successfully updated');
