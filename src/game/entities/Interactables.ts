// ─── Sticky Rush: Game World Entities ────────────────────────────────────
// Platforms, buttons, doors, keys, levers, checkpoints, and finish line.

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  moving?: {
    axis: 'x' | 'y';
    range: number;
    speed: number;
    startPos: number;
  };
  // Runtime for moving platforms
  _offset?: number;
}

export interface Interactable {
  type: 'button' | 'door' | 'key' | 'lever';
  x: number;
  y: number;
  width: number;
  height: number;
  activated: boolean;
  linkedId?: string; // ID of the thing this controls (e.g., a door)
  id: string;
}

export interface Checkpoint {
  x: number;
  y: number;
  width: number;
  height: number;
  reached: boolean;
  id: string;
}

export interface FinishLine {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function updateMovingPlatform(p: Platform, time: number) {
  if (!p.moving) return;
  const offset = Math.sin(time * p.moving.speed) * p.moving.range;
  const dx = p.moving.axis === 'x' ? (offset - (p._offset || 0)) : 0;
  
  if (p.moving.axis === 'x') {
    p.x = p.moving.startPos + offset;
  } else {
    p.y = p.moving.startPos + offset;
  }
  p._offset = offset;
  (p as any)._dx = dx;
}
