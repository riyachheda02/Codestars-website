import { useEffect, useRef } from 'react';

// Tune the visual response and workload here; counts are hard-capped by device class.
const CONFIG = {
  desktopParticles: 100,
  mobileParticles: 60,
  color: '#FF7A00',
  baseSpeed: 0.15,
  mouseInfluence: 35,
  mouseSmoothing: 0.08,
  mouseVelocityInfluence: 0.15,
  parallaxStrength: 0.04,
  scrollSmoothing: 0.08,
  minSize: 1,
  maxSize: 2.5,
  maxDpr: 2,
};

// Three layers share a broad flow. Depth only changes size, opacity, speed, and displacement.
const DEPTH_LAYERS = [
  { depth: 0.28, speed: 0.45, size: 0.66, opacity: 0.25, flowX: 0.18, flowY: 0.08 },
  { depth: 0.6, speed: 0.72, size: 0.84, opacity: 0.42, flowX: 0.28, flowY: -0.05 },
  { depth: 0.92, speed: 1, size: 1, opacity: 0.62, flowX: 0.4, flowY: 0.1 },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const wrap = (value, size) => ((value % size) + size) % size;

export default function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !context) return undefined;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let previousFrame = 0;
    let particles = [];
    let pointerX = 0;
    let pointerY = 0;
    let targetPointerX = 0;
    let targetPointerY = 0;
    let previousPointerX = 0;
    let previousPointerY = 0;
    let pointerVelocityX = 0;
    let pointerVelocityY = 0;
    let pointerInside = false;
    let fieldOffsetX = 0;
    let fieldOffsetY = 0;
    let targetOffsetX = 0;
    let targetOffsetY = 0;
    let targetScrollY = window.scrollY;
    let scrollY = targetScrollY;
    let isMobile = window.innerWidth < 768;

    // A lightly staggered grid makes the dots read as one spatial sheet.
    const createParticle = (index, count) => {
      const columns = Math.ceil(Math.sqrt(count * (width / height)));
      const rows = Math.ceil(count / columns);
      const column = index % columns;
      const row = Math.floor(index / columns);
      const jitterX = 0.22 + ((index * 37) % 17) / 17 * 0.56;
      const jitterY = 0.22 + ((index * 53) % 19) / 19 * 0.56;
      const layerIndex = (index * 2) % DEPTH_LAYERS.length;
      const layer = DEPTH_LAYERS[layerIndex];

      return {
        x: (column + jitterX) * width / columns,
        y: (row + jitterY) * height / rows,
        vx: layer.flowX * CONFIG.baseSpeed * layer.speed,
        vy: layer.flowY * CONFIG.baseSpeed * layer.speed,
        depth: layer.depth,
        layerIndex,
        size: (CONFIG.minSize + (CONFIG.maxSize - CONFIG.minSize) * layer.size)
          * (0.92 + (index % 5) * 0.02),
        opacity: layer.opacity,
      };
    };

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, bounds.width);
      const nextHeight = Math.max(1, bounds.height);
      const nextDpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
      const oldWidth = width;
      const oldHeight = height;
      isMobile = window.innerWidth < 768;

      if (nextWidth !== width || nextHeight !== height || nextDpr !== dpr) {
        const scaleX = oldWidth ? nextWidth / oldWidth : 1;
        const scaleY = oldHeight ? nextHeight / oldHeight : 1;
        width = nextWidth;
        height = nextHeight;
        dpr = nextDpr;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (oldWidth && oldHeight) {
          pointerX *= scaleX;
          targetPointerX *= scaleX;
          previousPointerX *= scaleX;
          pointerY *= scaleY;
          targetPointerY *= scaleY;
          previousPointerY *= scaleY;
          for (let index = 0; index < particles.length; index += 1) {
            particles[index].x *= scaleX;
            particles[index].y *= scaleY;
          }
        } else {
          pointerX = targetPointerX = previousPointerX = width / 2;
          pointerY = targetPointerY = previousPointerY = height / 2;
        }
      }

      // Keep particle objects when resizing; only adjust count at the mobile breakpoint.
      const targetCount = isMobile ? CONFIG.mobileParticles : CONFIG.desktopParticles;
      while (particles.length > targetCount) particles.pop();
      while (particles.length < targetCount) {
        particles.push(createParticle(particles.length, targetCount));
      }
    };

    // Input handlers only update targets. All smoothing and movement runs in RAF.
    const handlePointerMove = (event) => {
      targetPointerX = event.clientX;
      targetPointerY = event.clientY;
      pointerInside = true;
    };
    const handlePointerLeave = () => { pointerInside = false; };
    const handlePointerUp = (event) => {
      if (event.pointerType === 'touch') pointerInside = false;
    };
    const handleTouchMove = (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      targetPointerX = touch.clientX;
      targetPointerY = touch.clientY;
      pointerInside = true;
    };
    const handleScroll = () => { targetScrollY = window.scrollY; };

    const animate = (timestamp) => {
      frameId = 0;
      if (document.visibilityState !== 'visible') return;

      const delta = previousFrame ? Math.min((timestamp - previousFrame) / 16.67, 4) : 1;
      previousFrame = timestamp;
      const pointerBlend = 1 - (1 - CONFIG.mouseSmoothing) ** delta;
      const velocityBlend = 1 - (1 - 0.2) ** delta;
      const scrollBlend = 1 - (1 - CONFIG.scrollSmoothing) ** delta;

      pointerX += (targetPointerX - pointerX) * pointerBlend;
      pointerY += (targetPointerY - pointerY) * pointerBlend;
      const pointerDeltaX = pointerX - previousPointerX;
      const pointerDeltaY = pointerY - previousPointerY;
      pointerVelocityX += (pointerDeltaX - pointerVelocityX) * velocityBlend;
      pointerVelocityY += (pointerDeltaY - pointerVelocityY) * velocityBlend;
      previousPointerX = pointerX;
      previousPointerY = pointerY;

      if (pointerInside) {
        const normalizedX = (pointerX / width - 0.5) * 2;
        const normalizedY = (pointerY / height - 0.5) * 2;
        targetOffsetX = normalizedX * CONFIG.mouseInfluence
          + clamp(pointerVelocityX * CONFIG.mouseVelocityInfluence, -18, 18);
        targetOffsetY = normalizedY * CONFIG.mouseInfluence
          + clamp(pointerVelocityY * CONFIG.mouseVelocityInfluence, -18, 18);
      } else {
        targetOffsetX = 0;
        targetOffsetY = 0;
      }

      fieldOffsetX += (targetOffsetX - fieldOffsetX) * pointerBlend;
      fieldOffsetY += (targetOffsetY - fieldOffsetY) * pointerBlend;
      scrollY += (targetScrollY - scrollY) * scrollBlend;

      context.clearRect(0, 0, width, height);
      context.fillStyle = CONFIG.color;

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        // Small layer drift remains secondary to the shared mouse-driven sheet offset.
        particle.x = wrap(particle.x + particle.vx * delta, width);
        particle.y = wrap(particle.y + particle.vy * delta, height);

        const drawX = wrap(particle.x + fieldOffsetX * particle.depth, width);
        const scrollOffset = scrollY * particle.depth * CONFIG.parallaxStrength;
        const drawY = wrap(particle.y + fieldOffsetY * particle.depth - scrollOffset, height);

        context.globalAlpha = particle.opacity;
        context.beginPath();
        context.arc(drawX, drawY, particle.size, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
      frameId = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (document.visibilityState !== 'visible' || frameId) return;
      previousFrame = 0;
      frameId = window.requestAnimationFrame(animate);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      } else {
        startAnimation();
      }
    };

    const touchFallback = !('PointerEvent' in window);
    resizeCanvas();
    startAnimation();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    window.addEventListener('pointercancel', handlePointerLeave, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Older browsers use passive touch listeners; native scrolling is never prevented.
    if (touchFallback) {
      window.addEventListener('touchstart', handleTouchMove, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handlePointerLeave, { passive: true });
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('pointercancel', handlePointerLeave);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (touchFallback) {
        window.removeEventListener('touchstart', handleTouchMove);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handlePointerLeave);
      }
    };
  }, []);

  return <canvas id="background" ref={canvasRef} className="particle-field" aria-hidden="true" />;
}
