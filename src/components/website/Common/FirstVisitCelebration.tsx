"use client";

import { useEffect, useRef, useState } from "react";

// ─── localStorage helpers (avoids any IndexedDB version conflicts) ────
const VISITED_KEY = "bp_hasVisited";

const hasVisitedBefore = (): boolean => {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(VISITED_KEY) === "true";
};

const markVisited = (): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(VISITED_KEY, "true");
  }
};

// ─── Types ────────────────────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  shape: "rect" | "circle" | "strip";
  fromLeft: boolean;
}

interface Balloon {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  swayAmp: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────
const COLORS = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF",
  "#FF922B", "#CC5DE8", "#F06595", "#20C997",
  "#74C0FC", "#FFA94D", "#A9E34B", "#E599F7",
];

const BALLOON_COLORS = [
  "#FF6B6B", "#FFD93D", "#4D96FF", "#20C997",
  "#FF922B", "#CC5DE8", "#F06595", "#6BCB77",
];

const rand = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const randInt = (min: number, max: number) =>
  Math.floor(rand(min, max + 1));

// ─── Component ────────────────────────────────────────────────────────
export default function FirstVisitCelebration() {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hasVisitedBefore()) return;

    // Mark visited immediately so refresh won't re-trigger
    markVisited();

    // Build particles (confetti + strips)
    const newParticles: Particle[] = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: rand(0, 100),
      color: COLORS[randInt(0, COLORS.length - 1)],
      size: rand(6, 14),
      delay: rand(0, 1.2),
      duration: rand(2.5, 4.5),
      rotation: rand(0, 360),
      shape: (["rect", "circle", "strip"] as const)[randInt(0, 2)],
      fromLeft: i < 60,
    }));

    // Build balloons
    const newBalloons: Balloon[] = Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: rand(2, 98),
      color: BALLOON_COLORS[i % BALLOON_COLORS.length],
      size: rand(36, 62),
      delay: rand(0, 1.5),
      duration: rand(4, 7),
      swayAmp: rand(15, 40),
    }));

    setParticles(newParticles);
    setBalloons(newBalloons);
    setVisible(true);

    // Auto-hide after 5 s
    exitTimer.current = setTimeout(() => setVisible(false), 5000);

    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* ── CSS keyframes ─────────────────────────────────────────── */}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-120px) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes burst-left {
          0%   { transform: translate(-60px, 60px) rotate(0deg); opacity: 1; }
          100% { transform: translate(calc(var(--tx) * 1px), calc(var(--ty) * 1px)) rotate(540deg); opacity: 0; }
        }
        @keyframes burst-right {
          0%   { transform: translate(60px, 60px) rotate(0deg); opacity: 1; }
          100% { transform: translate(calc(var(--tx) * -1px), calc(var(--ty) * 1px)) rotate(-540deg); opacity: 0; }
        }
        @keyframes balloon-rise {
          0%   { transform: translateY(110vh) translateX(0px); opacity: 0; }
          10%  { opacity: 1; }
          50%  { transform: translateY(30vh) translateX(var(--sway-a)); }
          75%  { transform: translateY(5vh) translateX(var(--sway-b)); }
          90%  { opacity: 1; }
          100% { transform: translateY(-20vh) translateX(0px); opacity: 0; }
        }
        @keyframes celebration-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .confetti-particle {
          position: fixed;
          top: 0;
          pointer-events: none;
          z-index: 9999;
          animation: confetti-fall linear forwards;
        }
        .balloon {
          position: fixed;
          bottom: -80px;
          pointer-events: none;
          z-index: 9998;
          animation: balloon-rise ease-in-out forwards;
        }
        .balloon-body {
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          position: relative;
        }
        .balloon-body::after {
          content: "";
          position: absolute;
          bottom: -14px;
          left: 50%;
          transform: translateX(-50%);
          width: 1.5px;
          height: 40px;
          background: rgba(0,0,0,0.25);
        }
        .balloon-shine {
          position: absolute;
          top: 18%;
          left: 22%;
          width: 28%;
          height: 22%;
          background: rgba(255,255,255,0.45);
          border-radius: 50%;
          transform: rotate(-30deg);
        }
      `}</style>

      {/* ── Confetti particles ──────────────────────────────────── */}
      {particles.map((p) => {
        const isStrip = p.shape === "strip";
        return (
          <div
            key={`p-${p.id}`}
            className="confetti-particle"
            style={{
              left: `${p.x}%`,
              width: isStrip ? p.size * 0.4 : p.size,
              height: isStrip ? p.size * 2.5 : p.size,
              background: p.color,
              borderRadius: p.shape === "circle" ? "50%" : isStrip ? "2px" : "2px",
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        );
      })}

      {/* ── Balloons ──────────────────────────────────────────────── */}
      {balloons.map((b) => (
        <div
          key={`b-${b.id}`}
          className="balloon"
          style={{
            left: `${b.x}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            // sway variables
            ["--sway-a" as string]: `${b.swayAmp}px`,
            ["--sway-b" as string]: `${-b.swayAmp * 0.6}px`,
          }}
        >
          <div
            className="balloon-body"
            style={{
              width: b.size,
              height: b.size * 1.2,
              background: b.color,
              boxShadow: `inset -6px -6px 12px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)`,
            }}
          >
            <div className="balloon-shine" />
          </div>
        </div>
      ))}
    </>
  );
}
