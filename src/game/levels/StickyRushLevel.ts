// ─── Sticky Rush: Level 1 ────────────────────────────────────────────────
// A compact co-op + competitive course for two players.
// Total width ≈ 4800px. Designed for side-scrolling at 800px viewport.

import type { Platform, Interactable, Checkpoint, FinishLine } from '../entities/Interactables';

export interface LevelData {
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  platforms: Platform[];
  interactables: Interactable[];
  checkpoints: Checkpoint[];
  finishLine: FinishLine;
  deathY: number; // Y below which player respawns
}

export function createStickyRushLevel(): LevelData {
  const GROUND_Y = 500;
  const W = 5200;
  const H = 650;

  const platforms: Platform[] = [
    // ═══ Ground Segments ═══
    { x: 0, y: GROUND_Y, width: 600, height: 40 },
    { x: 700, y: GROUND_Y, width: 400, height: 40 },

    // ═══ Phase 1: Co-op Section ═══
    // Stepping platforms
    { x: 350, y: 420, width: 100, height: 20 },
    { x: 500, y: 360, width: 100, height: 20 },
    { x: 660, y: 320, width: 120, height: 20 },

    // Platform above button area
    { x: 850, y: 380, width: 160, height: 20 },

    // After door
    { x: 1100, y: GROUND_Y, width: 300, height: 40 },
    { x: 1150, y: 400, width: 100, height: 20 },

    // Key platform (elevated)
    { x: 1280, y: 340, width: 80, height: 20 },

    // ═══ Phase 2: Transition ═══
    { x: 1450, y: GROUND_Y, width: 200, height: 40 },
    // Moving platform
    { x: 1700, y: 420, width: 100, height: 20, color: '#81d4fa',
      moving: { axis: 'y', range: 80, speed: 1.5, startPos: 420 } },
    { x: 1850, y: 380, width: 120, height: 20 },
    { x: 2000, y: GROUND_Y, width: 300, height: 40 },

    // ═══ Checkpoint 1 Area ═══
    { x: 2350, y: GROUND_Y, width: 200, height: 40 },

    // ═══ Phase 3: Lever Section ═══
    { x: 2600, y: 440, width: 120, height: 20 },
    { x: 2750, y: 380, width: 100, height: 20 },
    { x: 2900, y: 340, width: 80, height: 20 },
    // High platform with lever
    { x: 2900, y: GROUND_Y, width: 200, height: 40 },

    // After lever gate
    { x: 3150, y: GROUND_Y, width: 300, height: 40 },

    // ═══ Phase 4: Race Section ═══
    // Route A (upper - tricky jumps)
    { x: 3500, y: 360, width: 80, height: 20 },
    { x: 3640, y: 310, width: 80, height: 20 },
    { x: 3780, y: 260, width: 80, height: 20 },
    { x: 3920, y: 310, width: 80, height: 20 },
    { x: 4060, y: 360, width: 100, height: 20 },

    // Route B (lower - moving platforms)
    { x: 3500, y: GROUND_Y, width: 100, height: 40 },
    { x: 3680, y: GROUND_Y - 20, width: 90, height: 20, color: '#81d4fa',
      moving: { axis: 'x', range: 60, speed: 2, startPos: 3680 } },
    { x: 3860, y: GROUND_Y, width: 100, height: 40 },
    { x: 4020, y: GROUND_Y - 20, width: 90, height: 20, color: '#81d4fa',
      moving: { axis: 'x', range: 50, speed: 2.5, startPos: 4020 } },

    // ═══ Checkpoint 2 & Final Stretch ═══
    { x: 4200, y: GROUND_Y, width: 200, height: 40 },

    // Final obstacles
    { x: 4450, y: 430, width: 80, height: 20 },
    { x: 4560, y: 370, width: 80, height: 20 },
    { x: 4680, y: 320, width: 80, height: 20 },

    // Finish platform
    { x: 4800, y: GROUND_Y, width: 300, height: 40 },
  ];

  const interactables: Interactable[] = [
    // ═══ Phase 1: Button + Door ═══
    // Button on ground — Player 1 stands here
    { id: 'btn1', type: 'button', x: 740, y: GROUND_Y - 20, width: 50, height: 20, activated: false, linkedId: 'door1' },
    // Door that blocks passage
    { id: 'door1', type: 'door', x: 1070, y: GROUND_Y - 80, width: 30, height: 80, activated: false },

    // Key pickup (after door)
    { id: 'key1', type: 'key', x: 1300, y: 300, width: 24, height: 24, activated: false, linkedId: 'door2' },
    // Door that key unlocks
    { id: 'door2', type: 'door', x: 1420, y: GROUND_Y - 80, width: 30, height: 80, activated: false },

    // ═══ Phase 3: Lever + Gate ═══
    { id: 'lever1', type: 'lever', x: 2920, y: 300, width: 40, height: 40, activated: false, linkedId: 'door3' },
    { id: 'door3', type: 'door', x: 3120, y: GROUND_Y - 80, width: 30, height: 80, activated: false },
  ];

  const checkpoints: Checkpoint[] = [
    { id: 'cp1', x: 2400, y: GROUND_Y - 50, width: 20, height: 50, reached: false },
    { id: 'cp2', x: 4250, y: GROUND_Y - 50, width: 20, height: 50, reached: false },
  ];

  const finishLine: FinishLine = {
    x: 4950, y: GROUND_Y - 60, width: 40, height: 60,
  };

  return {
    width: W,
    height: H,
    spawnX: 80,
    spawnY: GROUND_Y - 50,
    platforms,
    interactables,
    checkpoints,
    finishLine,
    deathY: H + 100,
  };
}
