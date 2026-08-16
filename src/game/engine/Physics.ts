// ─── Sticky Rush: Physics Engine ────────────────────────────────────────
// Minimal AABB physics with gravity, friction, and one-way platforms.

export interface PhysicsBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  facingRight: boolean;
}

export const GRAVITY = 980;
export const MAX_FALL_SPEED = 600;
export const PLAYER_SPEED = 220;
export const JUMP_FORCE = -420;
export const FRICTION = 0.85;

export function applyPhysics(body: PhysicsBody, dt: number) {
  // Gravity
  body.vy += GRAVITY * dt;
  if (body.vy > MAX_FALL_SPEED) body.vy = MAX_FALL_SPEED;

  // Horizontal friction when no input
  body.vx *= FRICTION;
  if (Math.abs(body.vx) < 1) body.vx = 0;

  // Integrate
  body.x += body.vx * dt;
  body.y += body.vy * dt;

  // Reset ground flag — collision pass will set it if appropriate
  body.onGround = false;
}
