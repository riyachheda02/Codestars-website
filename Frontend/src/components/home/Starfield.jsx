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

    // Check prefers-reduced-motion
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 3 depth groups of stars:
    // Group 0: faint, static opacity
    // Group 1: slow twinkle (sin wave)
    // Group 2: subtle brightness pulse
    const stars = [];
    const STAR_COUNT = 75; // Low density so it stays subtle and does not reduce text contrast

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    for (let i = 0; i < STAR_COUNT; i++) {
      const group = i % 3; // 0, 1, 2
      const radiusBase = group === 0 ? 0.75 : group === 1 ? 1.05 : 1.35;
      const alphaBase = group === 0 ? 0.22 : group === 1 ? 0.32 : 0.45;

      stars.push({
        x: Math.random(),
        y: Math.random(),
        group,
        radius: Math.random() * 0.4 + radiusBase,
        alpha: Math.random() * 0.15 + alphaBase,
        speed: Math.random() * 0.012 + 0.005,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Scroll parallax translateY calculation: at most 12% of scroll distance, applied via rAF
    let scrollY = window.scrollY || 0;
    let targetScrollY = scrollY;
    let rafScrollId = null;

    const onScroll = () => {
      targetScrollY = window.scrollY || 0;
      if (!rafScrollId) {
        rafScrollId = requestAnimationFrame(() => {
          scrollY = targetScrollY;
          if (canvas) {
            if (reducedMotion) {
              canvas.style.transform = 'none';
            } else {
              // translateY of at most 12% of scroll distance, modulo viewport height to wrap seamlessly
              const maxShift = canvas.height || 900;
              const yOffset = -((scrollY * 0.09) % maxShift);
              canvas.style.transform = `translate3d(0, ${yOffset.toFixed(2)}px, 0)`;
            }
          }
          rafScrollId = null;
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Initial call
    onScroll();

    // Render loop for subtle twinkling on two or three dot groups
    const render = () => {
      animId = requestAnimationFrame(render);
      if (!isVisible) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < STAR_COUNT; i++) {
        const star = stars[i];
        let currentAlpha = star.alpha;

        if (!reducedMotion) {
          if (star.group === 1 || star.group === 2) {
            star.phase += star.speed;
            currentAlpha = star.alpha + Math.sin(star.phase) * 0.14;
          }
        }

        const clampedAlpha = Math.max(0.04, Math.min(0.65, currentAlpha));

        const px = star.x * canvas.width;
        const py = star.y * canvas.height;

        ctx.fillStyle = `rgba(245, 185, 58, ${clampedAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      if (rafScrollId) cancelAnimationFrame(rafScrollId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return <canvas ref={canvasRef} className="global-starfield-canvas" aria-hidden="true" />;
}

