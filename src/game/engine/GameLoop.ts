// ─── Sticky Rush: Lightweight 2D Game Loop ─────────────────────────────
// Uses requestAnimationFrame. Isolated from React render cycle.

export type UpdateFn = (dt: number) => void;
export type RenderFn = (ctx: CanvasRenderingContext2D, interpolation: number) => void;

export class GameLoop {
  private running = false;
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedStep = 1 / 60; // 60 Hz physics
  private animFrameId = 0;
  private updateFn: UpdateFn;
  private renderFn: RenderFn;
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D, update: UpdateFn, render: RenderFn) {
    this.ctx = ctx;
    this.updateFn = update;
    this.renderFn = render;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now() / 1000;
    this.accumulator = 0;
    this.tick();
  }

  stop() {
    this.running = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  private tick = () => {
    if (!this.running) return;

    const now = performance.now() / 1000;
    let frameTime = now - this.lastTime;
    if (frameTime > 0.25) frameTime = 0.25; // clamp spiral-of-death
    this.lastTime = now;
    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedStep) {
      this.updateFn(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }

    const alpha = this.accumulator / this.fixedStep;
    this.renderFn(this.ctx, alpha);

    this.animFrameId = requestAnimationFrame(this.tick);
  };

  isRunning() { return this.running; }
}
