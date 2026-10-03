/** Instrumentación opt-in para validar rendimiento; nunca se carga en la tienda normal. */
type Stats = {
  pendingFrames: number;
  listeners: number;
  observers: number;
  visibleCards: number;
  activeTargets: number;
  frames: number;
  slowFrames: number;
  activeMs: number;
  disposed: boolean;
  timers: number;
  pulses: number;
};
export function observeMotion(signal: AbortSignal, stats: () => Stats) {
  const root = document.documentElement;
  let timer: ReturnType<typeof setTimeout> | undefined,
    longTasks = 0,
    longTaskMs = 0;
  let observer: PerformanceObserver | undefined;
  if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTasks++;
        longTaskMs += entry.duration;
      }
    });
    observer.observe({ type: "longtask", buffered: false });
  }
  function sample() {
    if (signal.aborted) return;
    const memory = (
      performance as Performance & {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
      }
    ).memory;
    const s = stats();
    root.dataset.motionMetrics = JSON.stringify({
      ...s,
      heapBytes: memory?.usedJSHeapSize ?? null,
      heapAllocated: memory?.totalJSHeapSize ?? null,
      activeFps: s.activeMs ? Math.round((s.frames / s.activeMs) * 1000) : null,
      longTasks,
      longTaskMs: Math.round(longTaskMs),
      time: Math.round(performance.now()),
    });
    timer = setTimeout(sample, 2000);
  }
  const visibility = () => {
    clearTimeout(timer);
    timer = undefined;
    if (!document.hidden) sample();
  };
  document.addEventListener("visibilitychange", visibility, { signal });
  signal.addEventListener(
    "abort",
    () => {
      clearTimeout(timer);
      observer?.disconnect();
      root.dataset.motionMetrics = JSON.stringify({
        ...stats(),
        probeStopped: true,
      });
    },
    { once: true },
  );
  sample();
}
