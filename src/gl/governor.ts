export function buildPixelRatioLevels(dpr: number, weak: boolean): number[] {
  const first = Math.min(dpr, weak ? 1.25 : 1.5);
  return [first, 1.25, 1].filter((v, i) => i === 0 || v < first);
}

export interface GovernorOptions {
  levels: number[];
  onChange: (pixelRatio: number) => void;
  minFps?: number;
  windowSize?: number;
}

export class PerfGovernor {
  private samples: number[] = [];
  private level = 0;
  private readonly minFps: number;
  private readonly windowSize: number;

  constructor(private readonly opts: GovernorOptions) {
    this.minFps = opts.minFps ?? 45;
    this.windowSize = opts.windowSize ?? 30;
  }

  get pixelRatio(): number {
    return this.opts.levels[this.level];
  }

  tick(dt: number | null): void {
    if (dt === null) return;
    this.samples.push(dt);
    if (this.samples.length < this.windowSize) return;

    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.samples = [];
    if (1000 / avg < this.minFps && this.level < this.opts.levels.length - 1) {
      this.level++;
      this.opts.onChange(this.pixelRatio);
    }
  }
}
