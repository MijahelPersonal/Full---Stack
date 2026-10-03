export interface FrameScheduler {
  request: (callback: (time: number) => void) => number;
  cancel: (id: number) => void;
}
export function browserScheduler(host: {
  requestAnimationFrame: (callback: (time: number) => void) => number;
  cancelAnimationFrame: (id: number) => void;
}): FrameScheduler {
  return {
    request: (callback) => host.requestAnimationFrame(callback),
    cancel: (id) => host.cancelAnimationFrame(id),
  };
}

/** Un solo RAF: duerme cuando step converge. dispose impide cualquier reactivación. */
export class AnimationLoop {
  private frame = 0;
  private last = 0;
  private disposed = false;
  constructor(
    private scheduler: FrameScheduler,
    private step: (time: number, dt: number, elapsed: number) => boolean,
  ) {}
  get pending() {
    return this.frame !== 0;
  }
  wake() {
    if (this.disposed || this.frame) return;
    this.frame = this.scheduler.request(this.update);
  }
  private update = (time: number) => {
    this.frame = 0;
    if (this.disposed) return;
    const elapsed = this.last ? Math.max(1, time - this.last) : 16.667;
    const dt = Math.min(48, elapsed);
    this.last = time;
    if (this.step(time, dt, elapsed)) this.wake();
    else this.last = 0;
  };
  stop() {
    if (this.frame) this.scheduler.cancel(this.frame);
    this.frame = 0;
    this.last = 0;
  }
  dispose() {
    this.disposed = true;
    this.stop();
  }
}
export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export function damp(current: number, target: number, dt: number) {
  if (Math.abs(target - current) < 0.002) return target;
  return current + (target - current) * (1 - Math.pow(0.92, dt / 16.667));
}
