'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { themes } from '@/lib/themes';
import type { ThemeName } from '@/types';

const DEFAULT_GRID_COLS = 20;
const DEFAULT_GRID_ROWS = 12;

function parseGridSize(gridSize: string): { cols: number; rows: number } {
  const parts = gridSize.split('x');
  if (parts.length === 2) {
    const cols = parseInt(parts[0]) || DEFAULT_GRID_COLS;
    const rows = parseInt(parts[1]) || DEFAULT_GRID_ROWS;
    return { cols: Math.max(5, Math.min(40, cols)), rows: Math.max(5, Math.min(30, rows)) };
  }
  return { cols: DEFAULT_GRID_COLS, rows: DEFAULT_GRID_ROWS };
}

interface Cell {
  owner: string | null;
  color: string;
  claimedAt: number;
}

interface TerritoryLeader {
  nickname: string;
  color: string;
  count: number;
}

function nicknameToColor(nickname: string): string {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

interface DonationTerritoryProps {
  widgetId?: string;
  config?: Record<string, unknown>;
  theme?: string;
}

export default function DonationTerritory({ widgetId, config, theme }: DonationTerritoryProps) {
  const themeData = themes[(theme as ThemeName) || 'modern'];
  const gridSizeStr = (config?.gridSize as string) ?? '20x12';
  const showLeaderboard = (config?.showLeaderboard as boolean) ?? true;
  const minAmount = (config?.minAmount as number) ?? 1000;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Cell[][]>([]);
  const gridDimsRef = useRef<{ cols: number; rows: number }>({ cols: 0, rows: 0 });
  const [leaders, setLeaders] = useState<TerritoryLeader[]>([]);
  const animFrameRef = useRef<number>(0);

  // Re-initialize grid when gridSize config changes
  useEffect(() => {
    const { cols, rows } = parseGridSize(gridSizeStr);
    gridDimsRef.current = { cols, rows };
    gridRef.current = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ owner: null, color: '#1a1a2e', claimedAt: 0 }))
    );
    setLeaders([]);
  }, [gridSizeStr]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const { cols: GRID_COLS, rows: GRID_ROWS } = gridDimsRef.current;
      if (GRID_COLS === 0 || GRID_ROWS === 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;
      const cellW = w / GRID_COLS;
      const cellH = h / GRID_ROWS;

      ctx.clearRect(0, 0, w, h);

      const grid = gridRef.current;
      const now = Date.now();

      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const cell = grid[r]?.[c];
          if (!cell) continue;
          const x = c * cellW;
          const y = r * cellH;

          // Cell background
          ctx.fillStyle = cell.color;
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

          // Border
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);

          // Recent claim glow (within 2 seconds)
          if (cell.owner && now - cell.claimedAt < 2000) {
            const alpha = 1 - (now - cell.claimedAt) / 2000;
            ctx.shadowColor = cell.color;
            ctx.shadowBlur = 15 * alpha;
            ctx.fillStyle = cell.color;
            ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
            ctx.shadowBlur = 0;

            // Show nickname on recently claimed
            if (now - cell.claimedAt < 1000) {
              ctx.font = `${Math.min(cellW * 0.3, 11)}px sans-serif`;
              ctx.fillStyle = `rgba(255,255,255,${alpha})`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(cell.owner.slice(0, 4), x + cellW / 2, y + cellH / 2);
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [gridSizeStr]);

  const updateLeaders = useCallback(() => {
    const { cols: GRID_COLS, rows: GRID_ROWS } = gridDimsRef.current;
    const counts: Record<string, { color: string; count: number }> = {};
    const grid = gridRef.current;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = grid[r]?.[c];
        if (cell?.owner) {
          if (!counts[cell.owner]) counts[cell.owner] = { color: cell.color, count: 0 };
          counts[cell.owner].count++;
        }
      }
    }
    const sorted = Object.entries(counts)
      .map(([nickname, data]) => ({ nickname, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setLeaders(sorted);
  }, []);

  const triggerClaim = useCallback((amount: number, nickname: string) => {
    if (amount < minAmount) return;
    const { cols: GRID_COLS, rows: GRID_ROWS } = gridDimsRef.current;
    const grid = gridRef.current;
    const color = nicknameToColor(nickname);
    const cellCount = Math.max(1, Math.floor(amount / 2000) + 1);
    const now = Date.now();

    // Find random unclaimed or enemy cells to claim
    const available: [number, number][] = [];
    // First: unclaimed cells
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (grid[r]?.[c]?.owner !== nickname) available.push([r, c]);
      }
    }

    // Shuffle and pick
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }

    const toClaim = available.slice(0, cellCount);
    toClaim.forEach(([r, c]) => {
      if (grid[r]?.[c]) {
        grid[r][c] = { owner: nickname, color, claimedAt: now };
      }
    });

    updateLeaders();
  }, [updateLeaders, minAmount]);

  // Expose for demo
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__donationTerritory = { triggerClaim };
    return () => { delete (window as unknown as Record<string, unknown>).__donationTerritory; };
  }, [triggerClaim]);

  // Socket.IO
  useEffect(() => {
    if (!widgetId) return;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) return;
    let socket: ReturnType<typeof import('socket.io-client').io> | null = null;
    let unmounted = false;
    import('socket.io-client').then(({ io }) => {
      if (unmounted) return;
      socket = io(socketUrl);
      socket.on('connect', () => socket!.emit('widget:subscribe', widgetId));
      socket.on('donation:new', (data: { fan_nickname: string; amount: number }) => {
        triggerClaim(data.amount, data.fan_nickname);
      });
    }).catch(err => console.error('Socket.IO initialization failed:', err));
    return () => { unmounted = true; socket?.disconnect(); };
  }, [widgetId, triggerClaim]);

  return (
    <div className={`relative w-full h-full ${themeData.fontClass} ${themeData.text}`} style={{ background: 'transparent' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Territory leaderboard */}
      {showLeaderboard && leaders.length > 0 && (
        <div className="absolute top-3 right-3 bg-black/60 rounded-lg px-3 py-2 backdrop-blur-sm">
          <p className="text-[10px] text-gray-400 font-bold mb-1">영토 순위</p>
          {leaders.map((l, i) => (
            <div key={l.nickname} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              <span className="text-white font-medium">{l.nickname}</span>
              <span className="text-gray-400 ml-auto">{l.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
