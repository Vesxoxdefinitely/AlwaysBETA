import React, { useEffect, useRef } from 'react';

const STAR_COUNT = 120;
const STAR_COLOR = 'rgba(255,255,255,0.85)';
const STAR_SIZE = [1, 2, 3];
const STAR_SPEED = [0.05, 0.1, 0.2];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export default function StarBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stars = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Generate stars
    stars.current = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: STAR_SIZE[Math.floor(Math.random() * STAR_SIZE.length)],
      speed: STAR_SPEED[Math.floor(Math.random() * STAR_SPEED.length)],
      alpha: randomBetween(0.5, 1),
      alphaDir: Math.random() > 0.5 ? 1 : -1,
    }));

    let animationId: number;
    function animate() {
      ctx!.clearRect(0, 0, width, height);
      for (const star of stars.current) {
        // Twinkle
        star.alpha += 0.01 * star.alphaDir * star.speed;
        if (star.alpha > 1) { star.alpha = 1; star.alphaDir = -1; }
        if (star.alpha < 0.5) { star.alpha = 0.5; star.alphaDir = 1; }
        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
        ctx!.fillStyle = `rgba(255,255,255,${star.alpha})`;
        ctx!.shadowColor = STAR_COLOR;
        ctx!.shadowBlur = 8 * star.r;
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }
      animationId = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      if (!canvas) return;
      canvas.width = width;
      canvas.height = height;
      // Reposition stars
      stars.current.forEach(star => {
        star.x = Math.random() * width;
        star.y = Math.random() * height;
      });
    }
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        background: 'transparent',
      }}
    />
  );
}
