'use client';
import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';

const EMOJIS = ['⭐', '💜', '🔥', '💎', '🎉', '❤️', '✨', '🌟', '💫', '🎵'];

interface DonationPhysicsProps {
  widgetId?: string;
  config?: { maxObjects?: number; gravity?: string; emojiSize?: string };
}

export default function DonationPhysics({ widgetId, config }: DonationPhysicsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderLoopRef = useRef<number>(0);
  const bodiesMetaRef = useRef<Map<number, { emoji: string; nickname: string; color: string; showName: boolean }>>(new Map());
  const timeoutIdsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const maxObjects = config?.maxObjects ?? 50;

  // Initialize physics engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.parentElement?.clientWidth || 800;
    const height = canvas.parentElement?.clientHeight || 600;
    canvas.width = width;
    canvas.height = height;

    const gravityValues: Record<string, number> = { low: 0.8, medium: 1.5, high: 3.0 };
    const gravityY = gravityValues[config?.gravity || 'medium'] || 1.5;
    const engine = Matter.Engine.create({ gravity: { x: 0, y: gravityY } });
    engineRef.current = engine;

    // Walls (invisible)
    const ground = Matter.Bodies.rectangle(width / 2, height + 25, width, 50, { isStatic: true });
    const leftWall = Matter.Bodies.rectangle(-25, height / 2, 50, height, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(width + 25, height / 2, 50, height, { isStatic: true });
    Matter.Composite.add(engine.world, [ground, leftWall, rightWall]);

    // Render loop
    const ctx = canvas.getContext('2d')!;
    const render = () => {
      Matter.Engine.update(engine, 1000 / 60);
      ctx.clearRect(0, 0, width, height);

      const bodies = Matter.Composite.allBodies(engine.world).filter(b => !b.isStatic);

      bodies.forEach(body => {
        const meta = bodiesMetaRef.current.get(body.id);
        if (!meta) return;

        const { position, circleRadius } = body;
        const r = circleRadius || 20;

        // Glow
        ctx.shadowColor = meta.color;
        ctx.shadowBlur = 15;

        // Circle body
        ctx.beginPath();
        ctx.arc(position.x, position.y, r, 0, Math.PI * 2);
        ctx.fillStyle = meta.color + '40';
        ctx.fill();
        ctx.strokeStyle = meta.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Emoji
        ctx.font = `${r}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta.emoji, position.x, position.y);

        // Nickname (briefly)
        if (meta.showName) {
          ctx.font = '12px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 4;
          ctx.fillText(meta.nickname, position.x, position.y - r - 10);
          ctx.shadowBlur = 0;
        }
      });

      renderLoopRef.current = requestAnimationFrame(render);
    };

    renderLoopRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(renderLoopRef.current);
      timeoutIdsRef.current.forEach(id => clearTimeout(id));
      timeoutIdsRef.current.clear();
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      bodiesMetaRef.current.clear();
    };
  }, []);

  const triggerDrop = useCallback((amount: number, nickname: string) => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    // Size based on amount (15-60 radius) or config override
    const radius = config?.emojiSize === 'small' ? 15
      : config?.emojiSize === 'large' ? 40
      : Math.min(15 + Math.log10(Math.max(amount, 1000)) * 12, 60);

    // Color based on amount
    let color = '#6b7280';
    if (amount >= 50000) color = '#ef4444';
    else if (amount >= 30000) color = '#f472b6';
    else if (amount >= 10000) color = '#c084fc';
    else if (amount >= 5000) color = '#818cf8';
    else if (amount >= 3000) color = '#a78bfa';
    else if (amount >= 1000) color = '#8b5cf6';

    const x = 50 + Math.random() * (canvas.width - 100);
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

    const body = Matter.Bodies.circle(x, -radius * 2, radius, {
      restitution: 0.5,
      friction: 0.3,
      density: 0.001 + amount / 10000000,
    });

    Matter.Composite.add(engine.world, body);
    bodiesMetaRef.current.set(body.id, { emoji, nickname, color, showName: true });

    // Hide nickname after 3s
    const timeoutId = setTimeout(() => {
      const meta = bodiesMetaRef.current.get(body.id);
      if (meta) meta.showName = false;
      timeoutIdsRef.current.delete(timeoutId);
    }, 3000);
    timeoutIdsRef.current.add(timeoutId);

    // Remove old objects if too many
    const allBodies = Matter.Composite.allBodies(engine.world).filter(b => !b.isStatic);
    if (allBodies.length > maxObjects) {
      const oldest = allBodies[0];
      Matter.Composite.remove(engine.world, oldest);
      bodiesMetaRef.current.delete(oldest.id);
    }
  }, [maxObjects]);

  // Expose for demo
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__donationPhysics = { triggerDrop };
    return () => { delete (window as unknown as Record<string, unknown>).__donationPhysics; };
  }, [triggerDrop]);

  // Socket.IO
  useEffect(() => {
    if (!widgetId) return;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) return;
    let socket: ReturnType<typeof import('socket.io-client').io>;
    import('socket.io-client').then(({ io }) => {
      socket = io(socketUrl);
      socket.on('connect', () => socket.emit('widget:subscribe', widgetId));
      socket.on('donation:new', (data: { fan_nickname: string; amount: number }) => {
        triggerDrop(data.amount, data.fan_nickname);
      });
    });
    return () => { socket?.disconnect(); };
  }, [widgetId, triggerDrop]);

  return (
    <div className="relative w-full h-full" style={{ background: 'transparent' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
