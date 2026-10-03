import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AnimationLoop,
  browserScheduler,
  clamp,
  damp,
} from "../src/lib/animation-loop.ts";

function scheduler() {
  let id = 0,
    time = 0,
    max = 0;
  const pending = new Map();
  return {
    request(fn) {
      pending.set(++id, fn);
      max = Math.max(max, pending.size);
      return id;
    },
    cancel(id) {
      pending.delete(id);
    },
    tick() {
      time += 16.667;
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((fn) => fn(time));
    },
    get size() {
      return pending.size;
    },
    get max() {
      return max;
    },
  };
}
test("el adaptador conserva el receptor Window de las APIs nativas", () => {
  let cancelled = 0;
  const host = {
    requestAnimationFrame() {
      assert.equal(this, host);
      return 7;
    },
    cancelAnimationFrame(id) {
      assert.equal(this, host);
      cancelled = id;
    },
  };
  const loop = new AnimationLoop(browserScheduler(host), () => false);
  loop.wake();
  loop.stop();
  assert.equal(cancelled, 7);
});
test("eventos intensivos comparten un RAF y la inercia converge sin loop en reposo", () => {
  const clock = scheduler();
  let x = 0,
    target = 1;
  const loop = new AnimationLoop(clock, (_t, dt) => {
    x = damp(x, target, dt);
    return x !== target;
  });
  for (let i = 0; i < 1000; i++) loop.wake();
  assert.equal(clock.size, 1);
  for (let i = 0; i < 300 && clock.size; i++) clock.tick();
  assert.equal(x, 1);
  assert.equal(clock.size, 0);
  assert.equal(loop.pending, false);
  assert.equal(clock.max, 1);
});
test("entrar/salir repetidamente no acumula callbacks y dispose impide reactivación", () => {
  const clock = scheduler();
  let calls = 0;
  const loop = new AnimationLoop(clock, () => {
    calls++;
    return true;
  });
  for (let i = 0; i < 500; i++) {
    loop.wake();
    loop.wake();
    clock.tick();
    loop.stop();
    assert.equal(clock.size, 0);
  }
  loop.wake();
  loop.dispose();
  const before = calls;
  loop.wake();
  clock.tick();
  assert.equal(clock.size, 0);
  assert.equal(calls, before);
  assert.equal(clock.max, 1);
});
test("destruir durante el frame no permite dejar otro RAF programado", () => {
  const clock = scheduler();
  let loop;
  loop = new AnimationLoop(clock, () => {
    loop.dispose();
    return true;
  });
  loop.wake();
  clock.tick();
  assert.equal(clock.size, 0);
});
test("interpolación mantiene límites, evita sobrepasar el objetivo y respeta la frecuencia de refresco", () => {
  assert.equal(clamp(4, -1, 1), 1);
  assert.equal(clamp(-4, -1, 1), -1);
  const full = damp(0, 1, 16.667),
    half = damp(damp(0, 1, 8.3335), 1, 8.3335);
  assert.ok(Math.abs(full - half) < 0.000001);
  assert.ok(full > 0 && full < 1);
  assert.equal(damp(0.9999, 1, 16), 1);
});
