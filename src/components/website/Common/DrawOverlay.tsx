"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type DrawPoint = { x: number; y: number };
type DrawStroke = { color: string; points: DrawPoint[]; mode: "draw" | "erase" };

interface DrawOverlayProps {
  active: boolean;
  color: string;
  mode?: "draw" | "erase";
  clearSignal?: number;
}

const STROKE_WIDTH = 3;
const ERASER_WIDTH = 18;

export default function DrawOverlay({ active, color, mode = "draw", clearSignal = 0 }: DrawOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<DrawStroke[]>([]);
  const drawingStrokeRef = useRef<DrawStroke | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const pointerCursor = useMemo(
    () =>
      mode === "erase"
        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 22 22'%3E%3Crect x='4' y='8' width='12' height='8' rx='2' transform='rotate(-35 10 12)' fill='%23f3f4f6' stroke='%23111111' stroke-width='1.1'/%3E%3Cpath d='M13.5 5.8l2 2.8' stroke='%23111111' stroke-width='1.1' stroke-linecap='round'/%3E%3C/svg%3E") 4 18, crosshair`
        : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M3 17l3.4-.8L15.8 6.8a1.7 1.7 0 0 0 0-2.4l-.2-.2a1.7 1.7 0 0 0-2.4 0L3.8 13.6 3 17z' fill='${encodeURIComponent(
            color
          )}' stroke='%23111111' stroke-width='1.2' stroke-linejoin='round'/%3E%3C/svg%3E") 2 18, crosshair`,
    [color, mode]
  );

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    strokesRef.current.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.globalCompositeOperation = stroke.mode === "erase" ? "destination-out" : "source-over";
      ctx.strokeStyle = stroke.mode === "erase" ? "rgba(0,0,0,1)" : stroke.color;
      ctx.lineWidth = stroke.mode === "erase" ? ERASER_WIDTH : STROKE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      if (stroke.points.length === 1) {
        ctx.lineTo(stroke.points[0].x + 0.01, stroke.points[0].y + 0.01);
      }
      ctx.stroke();
    });
    ctx.globalCompositeOperation = "source-over";
  };

  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.width || !size.height) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size.width * dpr);
    canvas.height = Math.floor(size.height * dpr);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    redrawCanvas();
  }, [size]);

  useEffect(() => {
    strokesRef.current = [];
    drawingStrokeRef.current = null;
    redrawCanvas();
  }, [clearSignal]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>): DrawPoint => ({
    x: event.clientX,
    y: event.clientY,
  });

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!active) return;
    const stroke: DrawStroke = { color, points: [getPoint(event)], mode };
    drawingStrokeRef.current = stroke;
    strokesRef.current = [...strokesRef.current, stroke];
    event.currentTarget.setPointerCapture(event.pointerId);
    redrawCanvas();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!active || !drawingStrokeRef.current) return;
    drawingStrokeRef.current.points.push(getPoint(event));
    redrawCanvas();
  };

  const finishStroke = () => {
    drawingStrokeRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[45]"
      style={{
        pointerEvents: active ? "auto" : "none",
        cursor: active ? pointerCursor : "default",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishStroke}
      onPointerLeave={finishStroke}
      onPointerCancel={finishStroke}
    />
  );
}
