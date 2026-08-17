// ─── Sticky Rush: Collision Detection ────────────────────────────────────
// AABB collision resolution for platforms and interactables.

import type { PhysicsBody } from './Physics';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function aabbOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function pointInRect(px: number, py: number, r: Rect): boolean {
  return px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height;
}

/**
 * Resolves collision between a moving body and a static platform.
 * Returns true if a collision was resolved.
 */
export function resolveStaticCollision(body: PhysicsBody, platform: Rect): boolean {
  let isOverlapping = aabbOverlap(body, platform);

  // Sticky platform logic: if falling, check a slightly extended hitbox downwards
  // This prevents the player from detaching and repeatedly entering "falling" animation on downward moving platforms.
  if (!isOverlapping && body.vy >= 0) {
    const extendedBody = { ...body, height: body.height + 6 };
    if (aabbOverlap(extendedBody, platform)) {
      isOverlapping = true;
    }
  }

  if (!isOverlapping) return false;

  // Calculate overlap on each axis
  const overlapLeft = (body.x + body.width) - platform.x;
  const overlapRight = (platform.x + platform.width) - body.x;
  const overlapTop = (body.y + body.height) - platform.y;
  const overlapBottom = (platform.y + platform.height) - body.y;

  // Find minimum overlap axis
  const minOverlapX = overlapLeft < overlapRight ? -overlapLeft : overlapRight;
  const minOverlapY = overlapTop < overlapBottom ? -overlapTop : overlapBottom;

  if (Math.abs(minOverlapX) < Math.abs(minOverlapY)) {
    // Resolve horizontally
    body.x += minOverlapX;
    body.vx = 0;
  } else {
    // Resolve vertically
    body.y += minOverlapY;
    if (minOverlapY < 0) {
      // Landed on top
      body.vy = 0;
      body.onGround = true;
      if ((platform as any)._dx) {
        body.x += (platform as any)._dx;
      }
    } else {
      // Hit ceiling
      body.vy = 0;
    }
  }

  return true;
}
