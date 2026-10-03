import {
  AnimationLoop,
  browserScheduler,
  clamp,
  damp,
} from "../lib/animation-loop";

type Options = {
  signal: AbortSignal;
  onHeroVisibility: (visible: boolean) => void;
};
type Target = {
  element: HTMLElement;
  rect: DOMRect;
  x: number;
  y: number;
  tx: number;
  ty: number;
  inside: boolean;
};
export function iniciarMovimiento({ signal, onHeroVisibility }: Options) {
  const controller = new AbortController();
  const mouse = matchMedia("(hover:hover) and (pointer:fine)");
  const desktop = matchMedia("(min-width:761px)");
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  const hero = document.querySelector<HTMLElement>("[data-slider]");
  const header = document.querySelector<HTMLElement>("[data-header]");
  const visibles = new Set<Element>();
  const reveals = new Set<HTMLElement>();
  const magnetic = new WeakMap<HTMLElement, HTMLElement>();
  let card: Target | null = null,
    button: Target | null = null;
  let heroRect: DOMRect | null = null,
    heroInside = false,
    heroVisible = false;
  let hx = 0,
    hy = 0,
    htx = 0,
    hty = 0,
    scrollY = 0,
    targetScroll = 0;
  let geometryDirty = false,
    listeners = 0,
    disposed = false;
  let frames = 0,
    slowFrames = 0,
    activeMs = 0,
    observer: IntersectionObserver | undefined;
  const enabled = () =>
    !disposed &&
    !document.hidden &&
    !reduced.matches &&
    mouse.matches &&
    desktop.matches;
  function listen(
    target: EventTarget,
    type: string,
    handler: EventListener,
    passive = true,
  ) {
    target.addEventListener(type, handler, {
      signal: controller.signal,
      passive,
    });
    listeners++;
  }
  const set = (el: HTMLElement, name: string, value: number, unit = "") =>
    el.style.setProperty(name, value.toFixed(3) + unit);
  function resetCard() {
    if (card) {
      for (const name of [
        "--tilt-x",
        "--tilt-y",
        "--mouse-x",
        "--mouse-y",
        "--image-x",
        "--image-y",
      ])
        card.element.style.removeProperty(name);
      card.element.classList.remove("is-tilting");
    }
    card = null;
  }
  function resetButton() {
    if (button) {
      magnetic.get(button.element)?.style.removeProperty("transform");
      button.element.classList.remove("is-magnetic");
    }
    button = null;
  }
  function reset() {
    loop.stop();
    resetCard();
    resetButton();
    heroInside = false;
    hx = hy = htx = hty = scrollY = targetScroll = 0;
    if (hero)
      for (const name of [
        "--hero-x",
        "--hero-y",
        "--hero-rx",
        "--hero-ry",
        "--hero-bg-x",
        "--hero-bg-y",
        "--hero-scroll",
      ])
        hero.style.removeProperty(name);
  }
  function scrollTarget() {
    if (!hero || !heroVisible || !enabled()) return;
    heroRect = hero.getBoundingClientRect();
    const range = innerHeight + heroRect.height;
    targetScroll = clamp(
      ((innerHeight - heroRect.top) / range - 0.5) * 40,
      -20,
      20,
    );
  }
  const loop = new AnimationLoop(
    browserScheduler(window),
    (_time, dt, elapsed) => {
      if (!enabled()) {
        reset();
        return false;
      }
      frames++;
      activeMs += elapsed;
      if (elapsed > 25) slowFrames++;
      if (geometryDirty) {
        if (card) card.rect = card.element.getBoundingClientRect();
        if (button) button.rect = button.element.getBoundingClientRect();
        scrollTarget();
        geometryDirty = false;
      }
      let moving = false;
      if (card) {
        card.x = damp(card.x, card.tx, dt);
        card.y = damp(card.y, card.ty, dt);
        set(card.element, "--tilt-x", -card.y * 2, "deg");
        set(card.element, "--tilt-y", card.x * 3, "deg");
        set(card.element, "--mouse-x", (card.x + 1) * 50, "%");
        set(card.element, "--mouse-y", (card.y + 1) * 50, "%");
        set(card.element, "--image-x", card.x * 1.5, "px");
        set(card.element, "--image-y", card.y, "px");
        moving ||= card.x !== card.tx || card.y !== card.ty;
      }
      if (button) {
        button.x = damp(button.x, button.tx, dt);
        button.y = damp(button.y, button.ty, dt);
        const content = magnetic.get(button.element);
        if (content)
          content.style.transform = `translate3d(${(button.x * 4).toFixed(3)}px,${(button.y * 3).toFixed(3)}px,0)`;
        moving ||= button.x !== button.tx || button.y !== button.ty;
        if (!button.inside && button.x === 0 && button.y === 0) resetButton();
      }
      if (hero && heroVisible) {
        hx = damp(hx, htx, dt);
        hy = damp(hy, hty, dt);
        scrollY = damp(scrollY, targetScroll, dt);
        set(hero, "--hero-x", hx * 7, "px");
        set(hero, "--hero-y", hy * 7, "px");
        set(hero, "--hero-rx", -hy, "deg");
        set(hero, "--hero-ry", hx * 2, "deg");
        set(hero, "--hero-bg-x", hx * 2, "px");
        set(hero, "--hero-bg-y", hy * 2, "px");
        set(hero, "--hero-scroll", scrollY, "px");
        moving ||= hx !== htx || hy !== hty || scrollY !== targetScroll;
      }
      return moving;
    },
  );
  document
    .querySelectorAll<HTMLElement>(
      ".hero-buttons .button,[data-add-cart]:not([data-buy-now]),.pc-banner .button,.builder-note .button",
    )
    .forEach((el) => {
      let content = el.querySelector<HTMLElement>(":scope > .magnetic-content");
      if (!content) {
        content = document.createElement("span");
        content.className = "magnetic-content";
        content.append(...el.childNodes);
        el.append(content);
      }
      el.dataset.magnetic = "";
      magnetic.set(el, content);
    });
  const local = (e: PointerEvent, rect: DOMRect) => [
    clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
    clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1),
  ];
  listen(document, "pointerover", (event) => {
    const e = event as PointerEvent;
    if (
      e.pointerType !== "mouse" ||
      !enabled() ||
      !(e.target instanceof Element)
    )
      return;
    const c = e.target.closest<HTMLElement>("[data-tilt]");
    if (c && c !== card?.element && visibles.has(c)) {
      resetCard();
      card = {
        element: c,
        rect: c.getBoundingClientRect(),
        x: 0,
        y: 0,
        tx: 0,
        ty: 0,
        inside: true,
      };
      c.classList.add("is-tilting");
    }
    const b = e.target.closest<HTMLElement>("[data-magnetic]");
    if (b && b !== button?.element && !b.matches(":disabled")) {
      resetButton();
      button = {
        element: b,
        rect: b.getBoundingClientRect(),
        x: 0,
        y: 0,
        tx: 0,
        ty: 0,
        inside: true,
      };
      b.classList.add("is-magnetic");
    } else if (b && button) button.inside = true;
    if (hero?.contains(e.target) && heroVisible && !heroInside) {
      heroInside = true;
      heroRect = hero.getBoundingClientRect();
    }
  });
  listen(document, "pointermove", (event) => {
    const e = event as PointerEvent;
    if (e.pointerType !== "mouse" || !enabled()) return;
    if (card) [card.tx, card.ty] = local(e, card.rect);
    if (button?.inside) [button.tx, button.ty] = local(e, button.rect);
    if (heroInside && heroRect) [htx, hty] = local(e, heroRect);
    if (card || button || heroInside) loop.wake();
  });
  listen(document, "pointerout", (event) => {
    const e = event as PointerEvent;
    if (e.pointerType !== "mouse") return;
    const next = e.relatedTarget instanceof Node ? e.relatedTarget : null;
    if (card && (!next || !card.element.contains(next))) {
      loop.stop();
      resetCard();
    }
    if (button && (!next || !button.element.contains(next))) {
      button.inside = false;
      button.tx = button.ty = 0;
    }
    if (heroInside && (!next || !hero?.contains(next))) {
      heroInside = false;
      htx = hty = 0;
    }
    if (enabled() && (button || heroVisible)) loop.wake();
  });
  listen(window, "scroll", () => {
    geometryDirty = true;
    if (enabled() && (heroVisible || card || button)) loop.wake();
  });
  listen(window, "resize", () => {
    geometryDirty = true;
    resetCard();
    resetButton();
    if (enabled() && heroVisible) loop.wake();
  });
  listen(document, "visibilitychange", () => {
    if (document.hidden) reset();
    else {
      geometryDirty = true;
      if (enabled() && heroVisible) loop.wake();
    }
  });
  const reduce = () => {
    reset();
    if (reduced.matches) {
      for (const el of reveals) {
        el.classList.remove("reveal-pending", "reveal-enter");
        observer?.unobserve(el);
      }
      reveals.clear();
      document
        .querySelectorAll(".card-reveal")
        .forEach((el) => el.classList.remove("card-reveal"));
    }
  };
  listen(reduced, "change", reduce);
  listen(mouse, "change", reduce);
  listen(desktop, "change", reduce);
  listen(document, "animationend", (event) => {
    const e = event as AnimationEvent;
    if (!(e.target instanceof HTMLElement)) return;
    if (e.animationName === "card-enter")
      e.target.classList.remove("card-reveal");
    if (e.animationName === "section-enter")
      e.target.classList.remove("reveal-enter");
  });
  const sections = document.querySelectorAll<HTMLElement>(
    "main .product-section,.offers-section > .container,.pc-banner,.brands-section,.benefits",
  );
  if (!reduced.matches)
    sections.forEach((el) => {
      if (el.getBoundingClientRect().top >= innerHeight) {
        el.classList.add("reveal-pending");
        reveals.add(el);
      }
    });
  const cards = document.querySelectorAll<HTMLElement>("[data-tilt]");
  const revealedCards = new WeakSet<Element>();
  cards.forEach((el, i) =>
    el.style.setProperty("--reveal-delay", (i % 4) * 50 + "ms"),
  );
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (el.hasAttribute("data-header-sentinel"))
            header?.classList.toggle("is-scrolled", !entry.isIntersecting);
          else if (el === hero) {
            heroVisible =
              entry.isIntersecting && entry.intersectionRatio >= 0.15;
            onHeroVisibility(heroVisible);
            if (!heroVisible) {
              heroInside = false;
              htx = hty = hx = hy = 0;
            } else {
              geometryDirty = true;
              if (enabled()) loop.wake();
            }
          } else if (el.hasAttribute("data-tilt")) {
            if (entry.isIntersecting) {
              visibles.add(el);
              if (!reduced.matches && !revealedCards.has(el)) {
                revealedCards.add(el);
                el.classList.add("card-reveal");
              }
            } else {
              visibles.delete(el);
              if (card?.element === el) {
                loop.stop();
                resetCard();
              }
            }
          } else if (entry.isIntersecting && reveals.has(el)) {
            el.classList.remove("reveal-pending");
            el.classList.add("reveal-enter");
            reveals.delete(el);
            observer?.unobserve(el);
          }
        }
      },
      { threshold: [0, 0.15] },
    );
    document
      .querySelectorAll("[data-header-sentinel],[data-slider],[data-tilt]")
      .forEach((el) => observer!.observe(el));
    reveals.forEach((el) => observer!.observe(el));
  } else {
    cards.forEach((el) => visibles.add(el));
    reveals.forEach((el) => el.classList.remove("reveal-pending"));
    reveals.clear();
    heroVisible = Boolean(hero);
    onHeroVisibility(heroVisible);
  }
  function dispose() {
    if (disposed) return;
    reset();
    loop.dispose();
    disposed = true;
    controller.abort();
    listeners = 0;
    observer?.disconnect();
    observer = undefined;
    visibles.clear();
    reveals.forEach((el) => el.classList.remove("reveal-pending"));
    reveals.clear();
    signal.removeEventListener("abort", dispose);
  }
  signal.addEventListener("abort", dispose, { once: true });
  if (signal.aborted) dispose();
  return {
    dispose,
    stats: () => ({
      pendingFrames: Number(loop.pending),
      listeners,
      observers: Number(Boolean(observer)),
      visibleCards: visibles.size,
      activeTargets:
        Number(Boolean(card)) + Number(Boolean(button)) + Number(heroInside),
      frames,
      slowFrames,
      activeMs,
      disposed,
      cursorEnabled: mouse.matches && desktop.matches,
      reducedMotion: reduced.matches,
      hidden: document.hidden,
    }),
  };
}
