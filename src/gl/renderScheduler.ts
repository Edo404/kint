export type Raf = (cb: (t: number) => void) => number;
export type Caf = (id: number) => void;

const IDLE_GAP_MS = 250;

export class RenderScheduler {
  private id: number | null = null;
  private last: number | null = null;
  private dirty = false;
  private loopInterval: number | null = null;

  constructor(
    private readonly draw: (dt: number | null) => void,
    private readonly raf: Raf,
    private readonly caf: Caf,
    private readonly isHidden: () => boolean = () => false,
  ) {}

  request(): void {
    this.dirty = true;
    this.schedule();
  }

  startLoop(fps: number): void {
    this.loopInterval = 1000 / fps;
    this.schedule();
  }

  stopLoop(): void {
    this.loopInterval = null;
  }

  stop(): void {
    if (this.id !== null) this.caf(this.id);
    this.id = null;
    this.last = null;
    this.dirty = false;
    this.loopInterval = null;
  }

  private schedule(): void {
    if (this.id !== null || this.isHidden()) return;
    this.id = this.raf(this.frame);
  }

  private frame = (t: number): void => {
    this.id = null;
    if (!this.dirty && this.loopInterval === null) return;

    const due = this.last === null || t - this.last >= (this.loopInterval ?? 0) - 2;
    if (!this.dirty && !due) {
      this.schedule();
      return;
    }

    this.dirty = false;
    const gap = this.last === null ? null : t - this.last;
    this.last = t;
    this.draw(gap === null || gap >= IDLE_GAP_MS ? null : gap);
    if (this.loopInterval !== null) this.schedule();
  };
}
