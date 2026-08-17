// ─── Sticky Rush: Renderer ──────────────────────────────────────────────
// Draws the game world, players, platforms, and interactables to Canvas 2D.

import type { Player } from '../entities/Player';
import type { Platform, Interactable, Checkpoint, FinishLine } from '../entities/Interactables';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private femaleSprites: Record<string, HTMLImageElement> = {};
  private maleSprites: Record<string, HTMLImageElement> = {};

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;

    if (typeof window !== 'undefined') {
      const spriteNames = ['sprite1', 'sprite2', 'sprite3', 'sprite4', 'sprite5', 'sprite6', 'sprite7'];
      spriteNames.forEach(name => {
        const fImg = new Image();
        fImg.src = `/assets/characters/female/${name}.png`;
        this.femaleSprites[name] = fImg;
      });

      const maleSpriteNames = ['sprite1', 'sprite2', 'sprite3', 'sprite4', 'sprite5', 'sprite7'];
      maleSpriteNames.forEach(name => {
        const mImg = new Image();
        mImg.src = `/assets/characters/male/${name}.png`;
        this.maleSprites[name] = mImg;
      });
    }
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  clear() {
    const ctx = this.ctx;
    // Gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#e0f7fa'); // Light blue top
    grad.addColorStop(1, '#fffde7'); // Pale yellow bottom
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  drawBackground(cameraX: number) {
    const ctx = this.ctx;
    // Parallax mountains (distant)
    ctx.fillStyle = '#b0bec5';
    for (let i = 0; i < 5; i++) {
      const mx = ((i * 400 - cameraX * 0.2) % 2000 + 2000) % 2000 - 400;
      ctx.beginPath();
      ctx.moveTo(mx, this.height);
      ctx.lineTo(mx + 200, this.height - 250 + (i % 3) * 50);
      ctx.lineTo(mx + 400, this.height);
      ctx.fill();
    }
    
    // Parallax hills (closer)
    ctx.fillStyle = '#cfd8dc';
    for (let i = 0; i < 8; i++) {
      const hx = ((i * 300 - cameraX * 0.4) % 2400 + 2400) % 2400 - 300;
      ctx.beginPath();
      ctx.arc(hx + 150, this.height + 50, 200, Math.PI, 0);
      ctx.fill();
    }

    // Grid pattern over it
    ctx.strokeStyle = 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    const offsetX = -(cameraX % gridSize);
    for (let x = offsetX; x < this.width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
    }
  }

  drawPlatform(p: Platform, cameraX: number, cameraY: number) {
    const ctx = this.ctx;
    const sx = p.x - cameraX;
    const sy = p.y - cameraY;

    // Solid platform with a slight shadow
    ctx.fillStyle = p.color || '#a1887f';
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 3;

    // Rounded rectangle
    const r = 6;
    ctx.beginPath();
    ctx.moveTo(sx + r, sy);
    ctx.lineTo(sx + p.width - r, sy);
    ctx.quadraticCurveTo(sx + p.width, sy, sx + p.width, sy + r);
    ctx.lineTo(sx + p.width, sy + p.height - r);
    ctx.quadraticCurveTo(sx + p.width, sy + p.height, sx + p.width - r, sy + p.height);
    ctx.lineTo(sx + r, sy + p.height);
    ctx.quadraticCurveTo(sx, sy + p.height, sx, sy + p.height - r);
    ctx.lineTo(sx, sy + r);
    ctx.quadraticCurveTo(sx, sy, sx + r, sy);
    ctx.closePath();
    ctx.fill();

    // Grass top
    ctx.fillStyle = '#81c784';
    ctx.beginPath();
    ctx.moveTo(sx + r, sy);
    ctx.lineTo(sx + p.width - r, sy);
    ctx.quadraticCurveTo(sx + p.width, sy, sx + p.width, sy + r);
    ctx.lineTo(sx + p.width, sy + 8);
    ctx.lineTo(sx, sy + 8);
    ctx.lineTo(sx, sy + r);
    ctx.quadraticCurveTo(sx, sy, sx + r, sy);
    ctx.closePath();
    ctx.fill();

    ctx.stroke();
  }

  drawInteractable(item: Interactable, cameraX: number, cameraY: number) {
    const ctx = this.ctx;
    const sx = item.x - cameraX;
    const sy = item.y - cameraY;

    switch (item.type) {
      case 'button': {
        // Pressure plate
        ctx.fillStyle = item.activated ? '#7cb342' : '#e57373';
        ctx.fillRect(sx, sy + item.height * 0.6, item.width, item.height * 0.4);
        // Top plate (moves down when activated)
        const plateY = item.activated ? sy + item.height * 0.4 : sy;
        ctx.fillStyle = item.activated ? '#558b2f' : '#c62828';
        ctx.fillRect(sx - 4, plateY, item.width + 8, item.height * 0.3);
        break;
      }
      case 'door': {
        if (item.activated) {
          // Open door (dashed outline)
          ctx.strokeStyle = 'rgba(120,120,120,0.3)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(sx, sy, item.width, item.height);
          ctx.setLineDash([]);
        } else {
          // Closed door
          ctx.fillStyle = '#8d6e63';
          ctx.fillRect(sx, sy, item.width, item.height);
          // Lock icon
          ctx.fillStyle = '#5d4037';
          ctx.beginPath();
          ctx.arc(sx + item.width / 2, sy + item.height / 2, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffca28';
          ctx.beginPath();
          ctx.arc(sx + item.width / 2, sy + item.height / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'key': {
        if (!item.activated) {
          // Floating key with bob animation
          const bob = Math.sin(Date.now() / 300) * 4;
          ctx.fillStyle = '#ffd54f';
          ctx.strokeStyle = '#f9a825';
          ctx.lineWidth = 2;
          // Key head (circle)
          ctx.beginPath();
          ctx.arc(sx + item.width / 2, sy + item.height / 2 + bob - 4, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Key shaft
          ctx.fillRect(sx + item.width / 2 - 2, sy + item.height / 2 + bob + 2, 4, 12);
          // Key teeth
          ctx.fillRect(sx + item.width / 2, sy + item.height / 2 + bob + 10, 5, 3);
        }
        break;
      }
      case 'lever': {
        // Base
        ctx.fillStyle = '#78909c';
        ctx.fillRect(sx + item.width / 2 - 4, sy + item.height * 0.5, 8, item.height * 0.5);
        // Handle
        ctx.strokeStyle = '#455a64';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx + item.width / 2, sy + item.height * 0.5);
        if (item.activated) {
          ctx.lineTo(sx + item.width * 0.8, sy + 4);
        } else {
          ctx.lineTo(sx + item.width * 0.2, sy + 4);
        }
        ctx.stroke();
        ctx.lineCap = 'butt';
        // Knob
        const knobX = item.activated ? sx + item.width * 0.8 : sx + item.width * 0.2;
        ctx.fillStyle = item.activated ? '#66bb6a' : '#ef5350';
        ctx.beginPath();
        ctx.arc(knobX, sy + 4, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
  }

  drawCheckpoint(cp: Checkpoint, cameraX: number, cameraY: number) {
    const ctx = this.ctx;
    const sx = cp.x - cameraX;
    const sy = cp.y - cameraY;

    // Flag pole
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy + cp.height);
    ctx.lineTo(sx + 8, sy);
    ctx.stroke();

    // Flag
    ctx.fillStyle = cp.reached ? '#66bb6a' : '#ef5350';
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy);
    ctx.lineTo(sx + 30, sy + 10);
    ctx.lineTo(sx + 8, sy + 20);
    ctx.closePath();
    ctx.fill();
  }

  drawFinishLine(fl: FinishLine, cameraX: number, cameraY: number) {
    const ctx = this.ctx;
    const sx = fl.x - cameraX;
    const sy = fl.y - cameraY;

    // Checkered pattern
    const tileSize = 12;
    for (let row = 0; row < Math.ceil(fl.height / tileSize); row++) {
      for (let col = 0; col < Math.ceil(fl.width / tileSize); col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#263238' : '#fafafa';
        ctx.fillRect(
          sx + col * tileSize,
          sy + row * tileSize,
          tileSize,
          tileSize
        );
      }
    }

    // "FINISH" text above
    ctx.fillStyle = '#263238';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏁 FINISH', sx + fl.width / 2, sy - 8);
    ctx.textAlign = 'start';
  }

  drawPlayer(player: Player, cameraX: number, cameraY: number, isLocal: boolean) {
    const ctx = this.ctx;
    const b = player.body;
    const sx = b.x - cameraX;
    const sy = b.y - cameraY;
    const w = b.width;
    const h = b.height;

    // ─── Sprite Rendering (Male and Female) ───
    if (player.character === 'female' || player.character === 'male') {
      const sprites = player.character === 'female' ? this.femaleSprites : this.maleSprites;
      let imgToDraw = sprites['sprite1']; // Idle default

      // Use player.state (synced for remote players) instead of raw physics values
      // which are only accurate for the local player
      const st = player.state;

      if (st === 'jumping') {
        imgToDraw = sprites['sprite2'] || imgToDraw; // Jump up
      } else if (st === 'falling') {
        // Distinguish mid-air vs landing based on velocity
        if (b.vy < 150) {
          imgToDraw = sprites['sprite4'] || imgToDraw; // Mid air
        } else {
          imgToDraw = sprites['sprite5'] || imgToDraw; // Falling fast / Land
        }
      } else if (st === 'walking') {
        // Run animation
        const runFrames = [sprites['sprite3'], sprites['sprite7']];
        const validFrames = runFrames.filter(img => img && img.complete);
        if (validFrames.length > 0) {
          const frameIndex = Math.floor(Date.now() / 150) % validFrames.length;
          imgToDraw = validFrames[frameIndex];
        }
      } else {
        // Idle (Standing) — default
        imgToDraw = sprites['sprite1'] || imgToDraw;
      }

      if (imgToDraw && imgToDraw.complete) {
        ctx.save();
        ctx.translate(sx + w / 2, sy + h / 2);
        
        // Flip based on facing direction
        const faceDir = b.facingRight ? 1 : -1;
        ctx.scale(faceDir, 1);

        const drawHeight = 90;
        const drawWidth = imgToDraw.width && imgToDraw.height ? drawHeight * (imgToDraw.width / imgToDraw.height) : 90;
        
        // Align the bottom of the sprite (drawHeight/2) to the bottom of the hitbox (h/2 = 20)
        const yOffset = (h / 2) - (drawHeight / 2);
        
        ctx.drawImage(imgToDraw, -drawWidth / 2, -drawHeight / 2 + yOffset, drawWidth, drawHeight);
        ctx.restore();

        // Draw name
        ctx.fillStyle = isLocal ? '#4ade80' : '#f87171';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, sx + w / 2, sy - 36 + yOffset);
        ctx.textAlign = 'start';
      }
      return; // Skip geometric rendering
    }

    // Squash/stretch based on velocity
    let scaleX = 1;
    let scaleY = 1;
    if (!b.onGround) {
      if (b.vy < -100) { scaleX = 0.88; scaleY = 1.15; } // jumping (stretch)
      else if (b.vy > 100) { scaleX = 1.1; scaleY = 0.9; } // falling (squash)
    }

    ctx.save();
    ctx.translate(sx + w / 2, sy + h / 2);
    ctx.scale(scaleX, scaleY);

    // ─── Sticky note body ───
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(-w / 2 + 3, -h / 2 + 3, w, h);

    // Body
    ctx.fillStyle = player.color;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Folded corner
    ctx.fillStyle = player.colorDark;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 10, -h / 2);
    ctx.lineTo(w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2 + 10);
    ctx.closePath();
    ctx.fill();

    // ─── Face ───
    const faceDir = b.facingRight ? 1 : -1;

    // Eyes
    ctx.fillStyle = '#333';
    const eyeY = -4;
    const eyeSpacing = 6;
    // Left eye
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing * faceDir, eyeY, 3, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Right eye
    ctx.beginPath();
    ctx.ellipse(eyeSpacing * faceDir, eyeY, 3, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-eyeSpacing * faceDir + 1, eyeY - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing * faceDir + 1, eyeY - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    if (player.state === 'victory') {
      // Big smile
      ctx.beginPath();
      ctx.arc(0, 4, 6, 0, Math.PI);
      ctx.stroke();
    } else {
      // Small smile
      ctx.beginPath();
      ctx.arc(0, 5, 4, 0.1, Math.PI - 0.1);
      ctx.stroke();
    }

    // Blush
    ctx.fillStyle = player.blush;
    ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.arc(-10, 3, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, 3, 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // ─── Legs ───
    ctx.strokeStyle = player.colorDark;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const legY = h / 2;
    const walkCycle = b.onGround && Math.abs(b.vx) > 10
      ? Math.sin(Date.now() / 80) * 6
      : 0;

    // Left leg
    ctx.beginPath();
    ctx.moveTo(-5, legY - 2);
    ctx.lineTo(-5 - walkCycle, legY + 10);
    ctx.stroke();
    // Right leg
    ctx.beginPath();
    ctx.moveTo(5, legY - 2);
    ctx.lineTo(5 + walkCycle, legY + 10);
    ctx.stroke();

    // ─── Arms ───
    const armWave = b.onGround && Math.abs(b.vx) > 10
      ? Math.sin(Date.now() / 80 + Math.PI) * 15
      : (player.state === 'victory' ? -40 : 10);
    
    // Left arm
    ctx.beginPath();
    ctx.moveTo(-w / 2, 2);
    ctx.lineTo(-w / 2 - 8, 2 + armWave * 0.3);
    ctx.stroke();
    // Right arm
    ctx.beginPath();
    ctx.moveTo(w / 2, 2);
    ctx.lineTo(w / 2 + 8, 2 - armWave * 0.3);
    ctx.stroke();

    // ─── Gender indicator ───
    if (player.character === 'male') {
      // Bow tie
      ctx.fillStyle = player.colorDark;
      ctx.beginPath();
      ctx.moveTo(-4, h / 2 - 4);
      ctx.lineTo(-10, h / 2 - 8);
      ctx.lineTo(-10, h / 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4, h / 2 - 4);
      ctx.lineTo(10, h / 2 - 8);
      ctx.lineTo(10, h / 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, h / 2 - 4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Hair bow
      ctx.fillStyle = player.colorDark;
      const bowY = -h / 2;
      const bowX = -w / 2 + 6;
      ctx.beginPath();
      ctx.moveTo(bowX, bowY);
      ctx.lineTo(bowX - 6, bowY - 6);
      ctx.lineTo(bowX - 6, bowY + 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bowX, bowY);
      ctx.lineTo(bowX + 6, bowY - 6);
      ctx.lineTo(bowX + 6, bowY + 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bowX, bowY - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.lineCap = 'butt';
    ctx.restore();

    // ─── Name label ───
    ctx.fillStyle = isLocal ? '#1b5e20' : '#b71c1c';
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, sx + w / 2, sy - 14);
    ctx.textAlign = 'start';
  }

  drawHUD(
    localPlayer: Player,
    remotePlayer: Player | null,
    elapsed: number,
    levelWidth: number
  ) {
    const ctx = this.ctx;
    const w = this.width;

    // Semi-transparent HUD bar
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(0, 0, w, 44);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(w, 44); ctx.stroke();

    // Player 1 (You)
    ctx.fillStyle = localPlayer.color;
    ctx.fillRect(10, 8, 20, 20);
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.fillText('YOU', 36, 22);

    // Timer
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(timeStr, w / 2, 28);
    ctx.textAlign = 'start';

    // Player 2 (Partner)
    if (remotePlayer) {
      ctx.fillStyle = remotePlayer.color;
      ctx.fillRect(w - 30, 8, 20, 20);
      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('PARTNER', w - 36, 22);
      ctx.textAlign = 'start';
    }

    // Progress bar
    const barY = 36;
    const barW = w - 20;
    const barH = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(10, barY, barW, barH);

    // Local progress
    const localProgress = Math.min(localPlayer.body.x / levelWidth, 1);
    ctx.fillStyle = localPlayer.color;
    ctx.fillRect(10, barY, barW * localProgress, barH);

    // Remote progress
    if (remotePlayer) {
      const remoteProgress = Math.min(remotePlayer.body.x / levelWidth, 1);
      ctx.fillStyle = remotePlayer.color;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(10, barY, barW * remoteProgress, barH);
      ctx.globalAlpha = 1;
    }
  }

  drawMobileControls(canvasWidth: number, canvasHeight: number) {
    const ctx = this.ctx;
    const btnSize = 52;
    const margin = 16;
    const bottomY = canvasHeight - btnSize - margin - 20;

    ctx.globalAlpha = 0.35;

    // Left button
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(margin + btnSize / 2, bottomY + btnSize / 2, btnSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Arrow
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(margin + btnSize / 2 + 8, bottomY + btnSize / 2 - 10);
    ctx.lineTo(margin + btnSize / 2 - 10, bottomY + btnSize / 2);
    ctx.lineTo(margin + btnSize / 2 + 8, bottomY + btnSize / 2 + 10);
    ctx.closePath();
    ctx.fill();

    // Right button
    const rightX = margin + btnSize + 12;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(rightX + btnSize / 2, bottomY + btnSize / 2, btnSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(rightX + btnSize / 2 - 8, bottomY + btnSize / 2 - 10);
    ctx.lineTo(rightX + btnSize / 2 + 10, bottomY + btnSize / 2);
    ctx.lineTo(rightX + btnSize / 2 - 8, bottomY + btnSize / 2 + 10);
    ctx.closePath();
    ctx.fill();

    // Jump button
    const jumpX = canvasWidth - margin - btnSize;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(jumpX + btnSize / 2, bottomY + btnSize / 2, btnSize / 2 + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Up arrow
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(jumpX + btnSize / 2 - 10, bottomY + btnSize / 2 + 6);
    ctx.lineTo(jumpX + btnSize / 2, bottomY + btnSize / 2 - 12);
    ctx.lineTo(jumpX + btnSize / 2 + 10, bottomY + btnSize / 2 + 6);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}
