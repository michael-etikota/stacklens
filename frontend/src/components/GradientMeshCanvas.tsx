import { useEffect, useRef } from "react";

export function GradientMeshCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      time += 0.003;
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;

      ctx.clearRect(0, 0, w, h);

      // Blob 1 — primary purple
      const x1 = w * (0.3 + 0.15 * Math.sin(time * 0.7));
      const y1 = h * (0.4 + 0.1 * Math.cos(time * 0.5));
      const g1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, w * 0.45);
      g1.addColorStop(0, "hsla(262, 80%, 60%, 0.18)");
      g1.addColorStop(1, "hsla(262, 80%, 60%, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // Blob 2 — accent orange
      const x2 = w * (0.7 + 0.12 * Math.cos(time * 0.6));
      const y2 = h * (0.3 + 0.15 * Math.sin(time * 0.4));
      const g2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, w * 0.35);
      g2.addColorStop(0, "hsla(25, 95%, 53%, 0.12)");
      g2.addColorStop(1, "hsla(25, 95%, 53%, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Blob 3 — deep purple center
      const x3 = w * (0.5 + 0.1 * Math.sin(time * 0.3));
      const y3 = h * (0.6 + 0.12 * Math.cos(time * 0.8));
      const g3 = ctx.createRadialGradient(x3, y3, 0, x3, y3, w * 0.5);
      g3.addColorStop(0, "hsla(262, 80%, 40%, 0.1)");
      g3.addColorStop(1, "hsla(262, 80%, 40%, 0)");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      // Blob 4 — subtle teal highlight
      const x4 = w * (0.2 + 0.2 * Math.cos(time * 0.9));
      const y4 = h * (0.7 + 0.1 * Math.sin(time * 0.6));
      const g4 = ctx.createRadialGradient(x4, y4, 0, x4, y4, w * 0.3);
      g4.addColorStop(0, "hsla(142, 76%, 36%, 0.06)");
      g4.addColorStop(1, "hsla(142, 76%, 36%, 0)");
      ctx.fillStyle = g4;
      ctx.fillRect(0, 0, w, h);

      animationId = requestAnimationFrame(draw);
    };

    // Respect reduced motion preference
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      draw(); // Draw once, no animation
    } else {
      animationId = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
}
