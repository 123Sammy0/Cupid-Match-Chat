// ─── Sticky Rush: Player Entity ──────────────────────────────────────────

import type { PhysicsBody } from '../engine/Physics';
import { PLAYER_SPEED, JUMP_FORCE } from '../engine/Physics';
import { sfx } from '../engine/Audio';

export type PlayerState = 'idle' | 'walking' | 'jumping' | 'falling' | 'victory';

export interface Player {
  id: string;
  name: string;
  color: string;
  colorDark: string;
  blush: string;
  body: PhysicsBody;
  state: PlayerState;
  hasKey: boolean;
  lastCheckpointX: number;
  lastCheckpointY: number;
  finished: boolean;
  finishTime: number;
}

export function createPlayer(
  id: string,
  name: string,
  isPlayer1: boolean,
  startX: number,
  startY: number
): Player {
  return {
    id,
    name: name.slice(0, 12),
    color: isPlayer1 ? '#fff59d' : '#f8bbd0',        // Yellow / Pink
    colorDark: isPlayer1 ? '#f9a825' : '#e91e63',
    blush: isPlayer1 ? '#ffcc80' : '#f48fb1',
    body: {
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      width: 36,
      height: 40,
      onGround: false,
      facingRight: true,
    },
    state: 'idle',
    hasKey: false,
    lastCheckpointX: startX,
    lastCheckpointY: startY,
    finished: false,
    finishTime: 0,
  };
}

export function applyInput(player: Player, input: InputState) {
  const b = player.body;

  if (input.left) {
    b.vx = -PLAYER_SPEED;
    b.facingRight = false;
  }
  if (input.right) {
    b.vx = PLAYER_SPEED;
    b.facingRight = true;
  }
  if (input.jump && b.onGround) {
    b.vy = JUMP_FORCE;
    b.onGround = false;
    sfx.playJump();
  }

  // Update animation state
  if (player.finished) {
    player.state = 'victory';
  } else if (!b.onGround) {
    player.state = b.vy < 0 ? 'jumping' : 'falling';
  } else if (Math.abs(b.vx) > 10) {
    player.state = 'walking';
  } else {
    player.state = 'idle';
  }
}

export function respawnAtCheckpoint(player: Player) {
  player.body.x = player.lastCheckpointX;
  player.body.y = player.lastCheckpointY;
  player.body.vx = 0;
  player.body.vy = 0;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export function createInputState(): InputState {
  return { left: false, right: false, jump: false };
}
