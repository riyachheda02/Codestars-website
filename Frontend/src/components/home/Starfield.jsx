import React, { useEffect, useRef } from 'react';
import './Starfield.css';

export default function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let isVisible = true;

    // 3 depth layers of stars:
    // Layer 0: distant (small, faint, shifts 6px)
    // Layer 1: mid (medium, shifts 12px)
    // Layer 2: near (larger, brighter, shifts 18px)
    const stars = [];
    const STAR_COUNT = 66;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < STAR_COUNT; i++) {
      const layer = i % 3; // 0, 1, 2
      const shiftMax = layer === 0 ? 6 : layer === 1 ? 12 : 18;
      const radiusBase = layer === 0 ? 0.7 : layer === 1 ? 1.1 : 1.5;
      const alphaBase = layer === 0 ? 0.25 : layer === 1 ? 0.38 : 0.55;

      stars.push({
        x: Math.random(),
        y: Math.random(),
        layer,
        shiftMax,
        radius: Math.random() * 0.6 + radiusBase,
        alpha: Math.random() * 0.2 + alphaBase,
        speed: Math.random() * 0.02 + 0.008,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Observer to pause when off-screen
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    // Read current --hero-ptr-x and --hero-ptr-y from parent #hero element
    let currentShiftX = 0;
    let currentShiftY = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      if (!isVisible) return;

      const heroEl = document.getElementById('hero');
      let targetPx = 0;
      let targetPy = 0;

      if (heroEl) {
        const valX = parseFloat(heroEl.style.getPropertyValue('--hero-ptr-x') || '0');
        const valY = parseFloat(heroEl.style.getPropertyValue('--hero-ptr-y') || '0');
        if (!isNaN(valX)) targetPx = valX;
        if (!isNaN(valY)) targetPy = valY;
      }

      // Smooth lerp to rest or target opposite to pointer
      currentShiftX += (targetPx - currentShiftX) * 0.08;
      currentShiftY += (targetPy - currentShiftY) * 0.08;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < STAR_COUNT; i++) {
        const star = stars[i];
        star.phase += star.speed;
        const currentAlpha = star.alpha + Math.sin(star.phase) * 0.22;
        const clampedAlpha = Math.max(0.04, Math.min(0.75, currentAlpha));

        // Shift opposite to cursor (-currentShiftX * shiftMax)
        const offsetX = -currentShiftX * star.shiftMax;
        const offsetY = -currentShiftY * star.shiftMax;

        const px = star.x * canvas.width + offsetX;
        const py = star.y * canvas.height + offsetY;

        ctx.fillStyle = `rgba(245, 185, 58, ${clampedAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-starfield-canvas" aria-hidden="true" />;
}

