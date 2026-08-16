// ─── Sticky Rush: Multiplayer Sync Manager ──────────────────────────────
// Uses Supabase Realtime Broadcast for high-frequency player state.
// Database writes are reserved for critical events only.

import type { Player, PlayerState } from '../entities/Player';

export interface PlayerSyncPayload {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facingRight: boolean;
  state: PlayerState;
  hasKey: boolean;
  finished: boolean;
  finishTime: number;
}

export interface GameEventPayload {
  type: 'game_start' | 'game_countdown' | 'checkpoint' | 'interactable' | 'finish' | 'character_ready';
  data: any;
}

export class SyncManager {
  private channel: any;
  private sendInterval: ReturnType<typeof setInterval> | null = null;
  private localPlayer: Player | null = null;
  private onRemoteSync: ((payload: PlayerSyncPayload) => void) | null = null;
  private onGameEvent: ((payload: GameEventPayload) => void) | null = null;

  constructor(channel: any) {
    this.channel = channel;
  }

  /** Start listening for remote player updates and game events */
  listen(
    onRemoteSync: (payload: PlayerSyncPayload) => void,
    onGameEvent: (payload: GameEventPayload) => void
  ) {
    this.onRemoteSync = onRemoteSync;
    this.onGameEvent = onGameEvent;

    this.channel.on('broadcast', { event: 'game_sync' }, (msg: any) => {
      if (this.onRemoteSync && msg.payload) {
        this.onRemoteSync(msg.payload);
      }
    });

    this.channel.on('broadcast', { event: 'game_event' }, (msg: any) => {
      if (this.onGameEvent && msg.payload) {
        this.onGameEvent(msg.payload);
      }
    });
  }

  /** Start broadcasting local player state at ~15 Hz */
  startBroadcasting(player: Player) {
    this.localPlayer = player;
    if (this.sendInterval) clearInterval(this.sendInterval);

    this.sendInterval = setInterval(() => {
      if (!this.localPlayer || !this.channel) return;
      const b = this.localPlayer.body;
      const payload: PlayerSyncPayload = {
        id: this.localPlayer.id,
        x: Math.round(b.x * 10) / 10,
        y: Math.round(b.y * 10) / 10,
        vx: Math.round(b.vx),
        vy: Math.round(b.vy),
        facingRight: b.facingRight,
        state: this.localPlayer.state,
        hasKey: this.localPlayer.hasKey,
        finished: this.localPlayer.finished,
        finishTime: this.localPlayer.finishTime,
      };
      this.channel.send({
        type: 'broadcast',
        event: 'game_sync',
        payload,
      });
    }, 66); // ~15 Hz
  }

  /** Broadcast a one-off game event (interactable state change, finish, etc.) */
  sendGameEvent(event: GameEventPayload) {
    this.channel?.send({
      type: 'broadcast',
      event: 'game_event',
      payload: event,
    });
  }

  /** Stop broadcasting */
  stop() {
    if (this.sendInterval) {
      clearInterval(this.sendInterval);
      this.sendInterval = null;
    }
  }

  /** Apply remote player data with interpolation */
  static interpolateRemote(
    remote: Player,
    payload: PlayerSyncPayload,
    lerpFactor: number = 0.3
  ) {
    const b = remote.body;
    // Smooth position towards received state
    b.x += (payload.x - b.x) * lerpFactor;
    b.y += (payload.y - b.y) * lerpFactor;
    b.vx = payload.vx;
    b.vy = payload.vy;
    b.facingRight = payload.facingRight;
    remote.state = payload.state;
    remote.hasKey = payload.hasKey;
    remote.finished = payload.finished;
    remote.finishTime = payload.finishTime;

    // Snap if too far (teleport detection)
    if (Math.abs(payload.x - b.x) > 80 || Math.abs(payload.y - b.y) > 80) {
      b.x = payload.x;
      b.y = payload.y;
    }
  }
}
