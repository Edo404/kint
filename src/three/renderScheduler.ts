export type Raf = (cb: (t: number) => void) => number;
export type Caf = (id: number) => void;

const IDLE_GAP_MS = 250;

export class RenderScheduler {
  private id: number | null = null;
  private last: number | null = null;

  constructor(
    private readonly draw: (dt: number | null) => void,
    private readonly raf: Raf,
    private readonly caf: Caf,
    private readonly isHidden: () => boolean = () => false,
  ) {}

  request(): void {
    if (this.id !== null || this.isHidden()) return;
    this.id = this.raf(this.frame);
  }

  stop(): void {
    if (this.id !== null) this.caf(this.id);
    this.id = null;
    this.last = null;
  }

  private frame = (t: number): void => {
    this.id = null;
    const gap = this.last === null ? null : t - this.last;
    this.last = t;
    this.draw(gap === null || gap >= IDLE_GAP_MS ? null : gap);
  };
}
