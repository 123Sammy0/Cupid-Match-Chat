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
    { x: 0, y: GROUND_Y, width: 400, height: 40 },
    { x: 500, y: GROUND_Y, width: 200, height: 40 },
    { x: 800, y: GROUND_Y, width: 300, height: 40 },

    // ═══ Phase 1: Co-op Section ═══
    // Stepping platforms
    { x: 300, y: 420, width: 60, height: 20 },
    { x: 450, y: 340, width: 60, height: 20 },
    { x: 600, y: 280, width: 80, height: 20 },

    // Platform above button area
    { x: 850, y: 380, width: 120, height: 20 },

    // After door
    { x: 1150, y: GROUND_Y, width: 200, height: 40 },
    { x: 1250, y: 380, width: 60, height: 20 },

    // Key platform (elevated)
    { x: 1350, y: 280, width: 60, height: 20 },

    // ═══ Phase 2: Transition ═══
    { x: 1450, y: GROUND_Y, width: 100, height: 40 },
    // Moving platform 1
    { x: 1650, y: 420, width: 80, height: 20, color: '#81d4fa',
      moving: { axis: 'y', range: 120, speed: 2.0, startPos: 420 } },
    { x: 1850, y: 320, width: 60, height: 20 },
    // Moving platform 2
    { x: 2050, y: 380, width: 80, height: 20, color: '#81d4fa',
      moving: { axis: 'x', range: 100, speed: 1.5, startPos: 2050 } },
    { x: 2300, y: GROUND_Y, width: 200, height: 40 },

    // ═══ Checkpoint 1 Area ═══
    { x: 2600, y: GROUND_Y, width: 150, height: 40 },

    // ═══ Phase 3: Lever Section ═══
    { x: 2800, y: 440, width: 60, height: 20 },
    { x: 2950, y: 360, width: 60, height: 20 },
    { x: 3100, y: 280, width: 60, height: 20 },
    // High platform with lever
    { x: 3250, y: 200, width: 120, height: 20 },
    
    // Bottom route for partner to wait
    { x: 3100, y: GROUND_Y, width: 200, height: 40 },

    // After lever gate
    { x: 3450, y: GROUND_Y, width: 200, height: 40 },

    // ═══ Phase 4: Race Section ═══
    // Route A (upper - tricky jumps)
    { x: 3700, y: 380, width: 50, height: 20 },
    { x: 3850, y: 320, width: 50, height: 20 },
    { x: 4000, y: 260, width: 50, height: 20 },
    { x: 4150, y: 320, width: 50, height: 20 },
    { x: 4300, y: 380, width: 50, height: 20 },

    // Route B (lower - moving platforms)
    { x: 3750, y: GROUND_Y - 20, width: 70, height: 20, color: '#81d4fa',
      moving: { axis: 'x', range: 80, speed: 2.5, startPos: 3750 } },
    { x: 3950, y: GROUND_Y - 50, width: 70, height: 20, color: '#81d4fa',
      moving: { axis: 'y', range: 60, speed: 3, startPos: GROUND_Y - 50 } },
    { x: 4150, y: GROUND_Y - 20, width: 70, height: 20, color: '#81d4fa',
      moving: { axis: 'x', range: 90, speed: 2.8, startPos: 4150 } },

    // ═══ Checkpoint 2 & Final Stretch ═══
    { x: 4500, y: GROUND_Y, width: 150, height: 40 },

    // Final obstacles
    { x: 4700, y: 440, width: 60, height: 20 },
    { x: 4850, y: 360, width: 60, height: 20 },
    { x: 5000, y: 280, width: 60, height: 20 },

    // Finish platform
    { x: 5200, y: GROUND_Y, width: 300, height: 40 },
  ];

  const interactables: Interactable[] = [
    // ═══ Phase 1: Button + Door ═══
    // Button on ground — Player 1 stands here
    { id: 'btn1', type: 'button', x: 880, y: GROUND_Y - 20, width: 50, height: 20, activated: false, linkedId: 'door1' },
    // Door that blocks passage
    { id: 'door1', type: 'door', x: 1120, y: GROUND_Y - 80, width: 30, height: 80, activated: false },

    // Key pickup (after door)
    { id: 'key1', type: 'key', x: 1370, y: 240, width: 24, height: 24, activated: false, linkedId: 'door2' },
    // Door that key unlocks
    { id: 'door2', type: 'door', x: 1420, y: GROUND_Y - 80, width: 30, height: 80, activated: false },

    // ═══ Phase 3: Lever + Gate ═══
    { id: 'lever1', type: 'lever', x: 3290, y: 160, width: 40, height: 40, activated: false, linkedId: 'door3' },
    { id: 'door3', type: 'door', x: 3420, y: GROUND_Y - 80, width: 30, height: 80, activated: false },
  ];

  const checkpoints: Checkpoint[] = [
    { id: 'cp1', x: 2650, y: GROUND_Y - 50, width: 20, height: 50, reached: false },
    { id: 'cp2', x: 4550, y: GROUND_Y - 50, width: 20, height: 50, reached: false },
  ];

  const finishLine: FinishLine = {
    x: 5350, y: GROUND_Y - 60, width: 40, height: 60,
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
