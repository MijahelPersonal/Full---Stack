import { iniciarMovimiento } from "./motion";
import {
  agregarProducto,
  claveCarrito,
  leerCarrito,
  reconciliarCarrito,
  subtotalCentimos,
  validarProducto,
  dinero,
  type LineaCarrito,
} from "../lib/cart";
import type { Producto } from "../lib/shared";

let iniciado = false,
  detener = () => {};
function iniciar() {
  if (iniciado) return;
  iniciado = true;
  const controller = new AbortController(),
    signal = controller.signal;
  let toastTimer: ReturnType<typeof setTimeout> | undefined,
    searchTimer: ReturnType<typeof setTimeout> | undefined,
    slideTimer: ReturnType<typeof setTimeout> | undefined,
    megaTimer: ReturnType<typeof setTimeout> | undefined;
  let searchRequest: AbortController | undefined,
    cartRequest: AbortController | undefined;
  const storageGet = (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const storageSet = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  };
  let cart: LineaCarrito[] = leerCarrito(storageGet(claveCarrito));
  let favorites: string[] = [];
  try {
    const data: unknown = JSON.parse(storageGet("struch.favorites.v1") || "[]");
    if (Array.isArray(data))
      favorites = data
        .filter(
          (v): v is string =>
            typeof v === "string" &&
            /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(
              v,
            ),
        )
        .slice(0, 100);
  } catch {}
  const toast = document.querySelector<HTMLElement>("[data-toast]");
  function avisar(mensaje: string, carrito = false) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.replaceChildren(document.createTextNode(mensaje));
    if (carrito) {
      const a = document.createElement("a");
      a.href = "/carrito";
      a.textContent = "Ver carrito →";
      toast.append(a);
    }
    toast.hidden = false;
    toastTimer = setTimeout(() => {
      toast.hidden = true;
      toastTimer = undefined;
    }, 4000);
  }
  const pulses = new Set<Animation>();
  function pulse(elements: Iterable<Element>, scale: number) {
    if (
      document.hidden ||
      matchMedia("(prefers-reduced-motion:reduce)").matches
    )
      return;
    for (const el of elements) {
      el.getAnimations()
        .filter((a) => a.id === "struch-feedback")
        .forEach((a) => a.cancel());
      const animation = el.animate(
        [
          { transform: "scale(1)" },
          { transform: `scale(${scale})`, offset: 0.45 },
          { transform: "scale(1)" },
        ],
        { duration: 280, easing: "ease-out" },
      );
      animation.id = "struch-feedback";
      pulses.add(animation);
      animation.onfinish = animation.oncancel = () => pulses.delete(animation);
    }
  }
  function headerCarrito() {
    const cantidad = cart.reduce((n, l) => n + l.cantidad, 0);
    document
      .querySelectorAll("[data-cart-count]")
      .forEach(
        (e) => (e.textContent = cantidad > 99 ? "99+" : String(cantidad)),
      );
    document
      .querySelectorAll("[data-cart-label]")
      .forEach(
        (e) =>
          (e.textContent = `${cantidad} productos · ${dinero(subtotalCentimos(cart) / 100)}`),
      );
  }
  function actualizarFavoritos() {
    document.querySelectorAll<HTMLElement>("[data-favorite]").forEach((e) => {
      const activo = favorites.includes(e.dataset.favorite || "");
      e.classList.toggle("is-favorite", activo);
      e.setAttribute("aria-pressed", String(activo));
    });
  }
  const cartPage = document.querySelector<HTMLElement>("[data-cart-page]");
  function pintarCarrito() {
  headerCarrito();
    if (!cartPage) return;
    const lines = cartPage.querySelector("[data-cart-lines]"),
      template = document.querySelector<HTMLTemplateElement>(
        "#cart-line-template",
      );
    if (!lines || !template) return;
    const actual = document.activeElement as HTMLElement | null;
    const idActual =
      actual?.closest<HTMLElement>("[data-cart-id]")?.dataset.cartId;
    const selector = actual?.matches("input")
      ? "input"
      : actual?.hasAttribute("data-quantity-plus")
        ? "[data-quantity-plus]"
        : actual?.hasAttribute("data-quantity-minus")
          ? "[data-quantity-minus]"
          : null;
    const fragment = document.createDocumentFragment();
    for (const linea of cart) {
      const p = linea.producto,
        nodo = template.content.firstElementChild!.cloneNode(
          true,
        ) as HTMLElement;
      nodo.dataset.cartId = p.id;
      const enlace = nodo.querySelector<HTMLAnchorElement>(".cart-product")!;
      enlace.href = "/producto/" + encodeURIComponent(p.slug);
      nodo.querySelector(".cart-line-brand")!.textContent = p.marca;
      nodo.querySelector(".cart-line-name")!.textContent = p.nombre;
      nodo.querySelector(".cart-line-stock")!.textContent =
        p.stock + " unidades disponibles";
      nodo.querySelector(".cart-line-price")!.textContent = dinero(p.precio);
      nodo.querySelector(".cart-line-subtotal")!.textContent = dinero(
        (Math.round(p.precio * 100) * linea.cantidad) / 100,
      );
      const input = nodo.querySelector<HTMLInputElement>("input")!;
      input.value = String(linea.cantidad);
      input.max = String(Math.min(p.stock, 999));
      input.setAttribute("aria-label", "Cantidad de " + p.nombre);
      nodo.querySelector<HTMLButtonElement>("[data-quantity-minus]")!.disabled =
        linea.cantidad <= 1;
      nodo.querySelector<HTMLButtonElement>("[data-quantity-plus]")!.disabled =
        linea.cantidad >= Math.min(p.stock, 999);
      nodo
        .querySelector("[data-remove-cart]")!
        .setAttribute("aria-label", "Eliminar " + p.nombre);
      const img = nodo.querySelector<HTMLImageElement>("img")!;
      if (p.imagenUrl) {
        img.src = "/media/" + p.imagenUrl.split("/").pop() + "?w=320";
        img.alt = p.nombre;
        img.hidden = false;
        img.dataset.productImage = "";
      }
      fragment.append(nodo);
    }
    lines.replaceChildren(fragment);
    cartPage.querySelector<HTMLElement>("[data-cart-empty]")!.hidden =
      cart.length > 0;
    const confirmar=document.querySelector<HTMLButtonElement>("[data-confirm-order]");if(confirmar)confirmar.disabled=enviandoPedido||!cart.length;
    const total = dinero(subtotalCentimos(cart) / 100);
    cartPage.querySelector("[data-cart-subtotal]")!.textContent = total;
    cartPage.querySelector("[data-cart-total]")!.textContent = total;
    const checkout = cartPage.querySelector<HTMLAnchorElement>(
      "[data-checkout-link]",
    );
    checkout?.setAttribute("aria-disabled", String(cart.length === 0));
    if (idActual && selector) {
      const node = [...lines.children].find(
        (n) => (n as HTMLElement).dataset.cartId === idActual,
      );
      node
        ?.querySelector<HTMLElement>(selector)
        ?.focus({ preventScroll: true });
    }
  }
  function guardar() {
    if (!storageSet(claveCarrito, JSON.stringify(cart)))
      avisar("El navegador no permite guardar el carrito entre páginas.");
    pintarCarrito();
  }
  async function refrescarCarrito() {
    if (!cartPage || !cart.length) return;
    cartRequest?.abort();
    const request = new AbortController();
    cartRequest = request;
    const mensaje = cartPage.querySelector<HTMLElement>("[data-cart-refresh]")!;
    mensaje.textContent = "Consultando precio y disponibilidad…";
    try {
      const q = new URLSearchParams({
        slugs: cart.map((l) => l.producto.slug).join(","),
      });
      const r = await fetch("/api/carrito?" + q, {
        signal: AbortSignal.any([
          signal,
          request.signal,
          AbortSignal.timeout(6000),
        ]),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      if (request.signal.aborted || request !== cartRequest) return;
      if (!Array.isArray(data.items)) throw new Error();
      const actuales = data.items
        .map(validarProducto)
        .filter((p: Producto | null): p is Producto => p !== null);
      const antes = JSON.stringify(cart);
      cart = reconciliarCarrito(cart, actuales);
      guardar();
      mensaje.textContent =
        JSON.stringify(cart) !== antes
          ? "Tu selección se actualizó con los precios y el stock actuales."
          : "Precios y disponibilidad consultados en el catálogo actual.";
    } catch (e) {
      if (signal.aborted || request.signal.aborted) return;
      mensaje.textContent =
        "No pudimos confirmar precio y stock. Recarga para volver a intentarlo.";
      cartPage
        .querySelector("[data-checkout-link]")
        ?.setAttribute("aria-disabled", "true");
    }
  }
    const confirmar = document.querySelector<HTMLButtonElement>('[data-confirm-order]');
  let enviandoPedido=false;
  confirmar?.addEventListener('click',async()=>{
    if(enviandoPedido||!cart.length)return;
    enviandoPedido=true;confirmar.disabled=true;
    const error=document.querySelector<HTMLElement>('[data-order-error]')!;error.textContent='';
    try{
      const lineas=cart.map(l=>({productoId:l.producto.id,cantidad:l.cantidad}));
      const firma=JSON.stringify(lineas.slice().sort((a,b)=>a.productoId.localeCompare(b.productoId)));
      let intento: {firma:string;clave:string}|null=null;
      try{intento=JSON.parse(sessionStorage.getItem('struch.pedido.intento')||'null');}catch{}
      if(!intento||intento.firma!==firma){intento={firma,clave:crypto.randomUUID()};sessionStorage.setItem('struch.pedido.intento',JSON.stringify(intento));}
      const r=await fetch('/api/cuenta/pedido',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clave:intento.clave,lineas}),signal:AbortSignal.any([signal,AbortSignal.timeout(12000)])});
      const d=await r.json();if(r.status===401){location.assign('/cuenta?volver=/finalizar-compra');return;}if(!r.ok)throw new Error(d.error||'No se pudo registrar el pedido');
      // La constancia se consulta con GET: actualizarla nunca crea otro pedido.
      storageSet(claveCarrito,'[]');sessionStorage.removeItem('struch.pedido.intento');location.assign(d.destino);
    }catch(e){if(signal.aborted)return;error.textContent=e instanceof Error?e.message:'No pudimos conectar. Reintenta con tu selección actual.';enviandoPedido=false;confirmar.disabled=!cart.length;}
  },{signal});
  headerCarrito();
  actualizarFavoritos();
  pintarCarrito();
  void refrescarCarrito();
  document.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (
        img instanceof HTMLImageElement &&
        img.hasAttribute("data-product-image")
      ) {
        img.hidden = true;
        img.parentElement
          ?.querySelector(".image-placeholder")
          ?.removeAttribute("aria-hidden");
      }
    },
    { capture: true, signal },
  );
  document
    .querySelectorAll<HTMLImageElement>("[data-product-image]")
    .forEach((img) => {
      if (img.complete && img.naturalWidth === 0) {
        img.hidden = true;
        img.parentElement
          ?.querySelector(".image-placeholder")
          ?.removeAttribute("aria-hidden");
      }
    });
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as Element;
      if(enviandoPedido && target.closest('[data-cart-id], [data-add-cart]')){e.preventDefault();return;}
      const add = target.closest<HTMLButtonElement>("[data-add-cart]");
      if (add && !add.disabled) {
        try {
          const p = validarProducto(JSON.parse(add.dataset.addCart || "null"));
          if (!p) throw new Error("Producto inválido");
          const cantidad = add.hasAttribute("data-use-quantity")
            ? Number(
                document.querySelector<HTMLInputElement>("#product-quantity")
                  ?.value || 1,
              )
            : 1;
          cart = agregarProducto(cart, p, cantidad);
          guardar();
          pulse(document.querySelectorAll("[data-cart-count]"), 1.25);
          pulse(document.querySelectorAll(".cart-icon > .icon"), 1.08);
          avisar("Producto agregado al carrito.", true);
          if (add.hasAttribute("data-buy-now")) location.assign("/carrito");
        } catch (err) {
          avisar(
            err instanceof Error
              ? err.message
              : "No pudimos agregar el producto",
          );
        }
      }
      const favorite = target.closest<HTMLElement>("[data-favorite]");
      if (favorite) {
        const id = favorite.dataset.favorite!;
        if (favorites.includes(id))
          favorites = favorites.filter((v) => v !== id);
        else if (favorites.length < 100) favorites.push(id);
        else {
          avisar("Puedes guardar hasta 100 favoritos.");
          return;
        }
        if (!storageSet("struch.favorites.v1", JSON.stringify(favorites)))
          avisar("Los favoritos no pueden guardarse en este navegador.");
        actualizarFavoritos();
        pulse([favorite], 1.2);
      }
      const row = target.closest<HTMLElement>("[data-cart-id]");
      if (row) {
        const id = row.dataset.cartId!,
          linea = cart.find((l) => l.producto.id === id);
        if (!linea) return;
        if (target.closest("[data-remove-cart]")) {
          cart = cart.filter((l) => l.producto.id !== id);
          guardar();
          avisar("Producto eliminado del carrito.");
        } else if (
          target.closest("[data-quantity-plus],[data-quantity-minus]")
        ) {
          const delta = target.closest("[data-quantity-plus]") ? 1 : -1;
          linea.cantidad = Math.max(
            1,
            Math.min(linea.producto.stock, 999, linea.cantidad + delta),
          );
          guardar();
        }
      }
      const checkout = target.closest("[data-checkout-link]");
      if (checkout?.getAttribute("aria-disabled") === "true") {
        e.preventDefault();
        avisar(
          cart.length
            ? "Confirma la disponibilidad recargando el carrito."
            : "Agrega un producto para continuar.",
        );
      }
      const quantity =
        document.querySelector<HTMLInputElement>("#product-quantity");
      if (
        quantity &&
        (target.closest("[data-detail-plus]") ||
          target.closest("[data-detail-minus]"))
      ) {
        const delta = target.closest("[data-detail-plus]") ? 1 : -1;
        quantity.value = String(
          Math.max(
            1,
            Math.min(Number(quantity.max), Number(quantity.value || 1) + delta),
          ),
        );
      }
    },
    { signal },
  );
  cartPage?.addEventListener(
    "change",
    (e) => {
      const input = e.target;
      if (!(input instanceof HTMLInputElement)) return;
      const row = input.closest<HTMLElement>("[data-cart-id]"),
        linea = cart.find((l) => l.producto.id === row?.dataset.cartId);
      if (!linea) return;
      if(enviandoPedido){input.value=String(linea.cantidad);return;}
      const cantidad = Number(input.value);
      if (
        !Number.isInteger(cantidad) ||
        cantidad < 1 ||
        cantidad > Math.min(linea.producto.stock, 999)
      ) {
        input.value = String(linea.cantidad);
        avisar("Usa una cantidad válida dentro del stock disponible.");
        return;
      }
      linea.cantidad = cantidad;
      guardar();
    },
    { signal },
  );
  window.addEventListener(
    "storage",
    (e) => {
      if (e.key === claveCarrito) {
        cart = leerCarrito(e.newValue);
        pintarCarrito();
        void refrescarCarrito();
      }
      if (e.key === "struch.favorites.v1") {
        try {
          const raw = JSON.parse(e.newValue || "[]");
          favorites = Array.isArray(raw)
            ? raw.filter((v: unknown) => typeof v === "string").slice(0, 100)
            : [];
        } catch {
          favorites = [];
        }
        actualizarFavoritos();
      }
    },
    { signal },
  );

  // Sugerencias: un debounce y una petición cancelable; nunca se inyecta HTML de la API.
  const searchForm =
      document.querySelector<HTMLFormElement>("[data-search-form]"),
    search = searchForm?.querySelector<HTMLInputElement>("[data-search-input]"),
    results = searchForm?.querySelector<HTMLElement>("[data-search-results]");
  const cerrarResultados = () => {
    clearTimeout(searchTimer);
    searchTimer = undefined;
    searchRequest?.abort();
    searchRequest = undefined;
    if (results) results.hidden = true;
    search?.setAttribute("aria-expanded", "false");
  };
  async function sugerir() {
    if (!search || !results || !searchForm) return;
    const valor = search.value.trim();
    if (valor.length < 2) {
      cerrarResultados();
      return;
    }
    searchRequest?.abort();
    const request = new AbortController();
    searchRequest = request;
    try {
      const q = new URLSearchParams({
        search: valor,
      });
      const r = await fetch("/api/buscar?" + q, {
        signal: AbortSignal.any([
          signal,
          request.signal,
          AbortSignal.timeout(6000),
        ]),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      if (request.signal.aborted) return;
      results.replaceChildren();
      const heading = (text: string) => {
        const h = document.createElement("h3");
        h.textContent = text;
        results!.append(h);
      };
      heading("Productos");
      if (!data.items?.length) {
        const p = document.createElement("p");
        p.textContent = "No encontramos productos.";
        results.append(p);
      } else
        for (const item of data.items.slice(0, 6)) {
          const p = validarProducto(item);
          if (!p) continue;
          const a = document.createElement("a");
          a.href = "/producto/" + encodeURIComponent(p.slug);
          const text = document.createElement("span");
          text.textContent = p.nombre;
          const price = document.createElement("strong");
          price.textContent = dinero(p.precio);
          a.append(text, price);
          results.append(a);
        }
      if (data.categorias?.length) {
        heading("Categorías relacionadas");
        for (const c of data.categorias.slice(0, 5)) {
          const a = document.createElement("a");
          a.href = "/categorias/" + encodeURIComponent(c.slug);
          a.textContent = c.nombre;
          results.append(a);
        }
      }
      results.hidden = false;
      search.setAttribute("aria-expanded", "true");
    } catch {
      if (signal.aborted || request.signal.aborted) return;
      results.textContent =
        "No pudimos consultar el catálogo. Puedes intentar la búsqueda nuevamente.";
      results.hidden = false;
      search.setAttribute("aria-expanded", "true");
    }
  }
  const prepararBusqueda = () => {
    clearTimeout(searchTimer);
    searchRequest?.abort();
    if ((search?.value.trim().length || 0) < 2) {
      cerrarResultados();
      return;
    }
    searchTimer = setTimeout(() => {
      searchTimer = undefined;
      void sugerir();
    }, 280);
  };
  search?.addEventListener("input", prepararBusqueda, { signal });
  search?.addEventListener("focus", prepararBusqueda, { signal });
  searchForm?.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") cerrarResultados();
      if (e.key === "ArrowDown" && results && !results.hidden) {
        e.preventDefault();
        results.querySelector<HTMLAnchorElement>("a")?.focus();
      }
    },
    { signal },
  );
  document.addEventListener(
    "click",
    (e) => {
      if (!searchForm?.contains(e.target as Node)) cerrarResultados();
    },
    { signal },
  );
  document.querySelector<HTMLSelectElement>("[data-sort]")?.addEventListener(
    "change",
    (e) => {
      (e.target as HTMLSelectElement).form?.requestSubmit();
    },
    { signal },
  );
  const filters = document.querySelector<HTMLDetailsElement>(
    "[data-filter-panel]",
  );
  if (filters && matchMedia("(max-width:760px)").matches) filters.open = false;

  // Menú nativo accesible. En móvil se convierte en un dialog con foco contenido.
  const drawer =
      document.querySelector<HTMLDialogElement>("[data-mobile-menu]"),
    openMobile = document.querySelector<HTMLElement>("[data-open-mobile]");
  openMobile?.setAttribute("aria-expanded", "false");
  openMobile?.addEventListener(
    "click",
    () => {
      if (drawer && !drawer.open) {
        drawer.showModal();
        openMobile.setAttribute("aria-expanded", "true");
      }
    },
    { signal },
  );
  drawer
    ?.querySelector("[data-close-mobile]")
    ?.addEventListener("click", () => drawer.close(), { signal });
  drawer?.addEventListener(
    "click",
    (e) => {
      if (e.target === drawer) drawer.close();
    },
    { signal },
  );
  drawer?.addEventListener(
    "close",
    () => openMobile?.setAttribute("aria-expanded", "false"),
    { signal },
  );
  const mega = document.querySelector<HTMLDetailsElement>("[data-mega]");
  let manualMega = false;
  mega?.querySelector("summary")?.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      manualMega = !manualMega;
      mega.open = manualMega;
    },
    { signal },
  );
  if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
    mega?.addEventListener(
      "pointerenter",
      () => {
        clearTimeout(megaTimer);
        mega.open = true;
      },
      { signal },
    );
    mega?.addEventListener(
      "pointerleave",
      () => {
        if (!manualMega)
          megaTimer = setTimeout(() => {
            megaTimer = undefined;
            mega.open = false;
          }, 180);
      },
      { signal },
    );
  }
  document.addEventListener(
    "click",
    (e) => {
      if (mega && !mega.contains(e.target as Node)) {
        mega.open = false;
        manualMega = false;
      }
    },
    { signal },
  );
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && mega) {
        mega.open = false;
        manualMega = false;
      }
    },
    { signal },
  );

  // Tabs con navegación por teclado.
  document.querySelectorAll<HTMLElement>("[data-tabs]").forEach((root) => {
    const tabs = [...root.querySelectorAll<HTMLButtonElement>("[data-tab]")];
    const activar = (button: HTMLButtonElement) => {
      for (const b of tabs) {
        const activo = b === button;
        b.setAttribute("aria-selected", String(activo));
        b.tabIndex = activo ? 0 : -1;
      }
      root
        .querySelectorAll<HTMLElement>("[data-tab-panel]")
        .forEach((p) => (p.hidden = p.dataset.tabPanel !== button.dataset.tab));
    };
    root.addEventListener(
      "click",
      (e) => {
        const b = (e.target as Element).closest<HTMLButtonElement>(
          "[data-tab]",
        );
        if (b) activar(b);
      },
      { signal },
    );
    root.addEventListener(
      "keydown",
      (e) => {
        const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
        if (i < 0) return;
        let n = i;
        if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") n = (i + tabs.length - 1) % tabs.length;
        else if (e.key === "Home") n = 0;
        else if (e.key === "End") n = tabs.length - 1;
        else return;
        e.preventDefault();
        activar(tabs[n]);
        tabs[n].focus();
      },
      { signal },
    );
  });

  // Slider: un único timeout. Pausa fuera de viewport, en pestaña oculta, con hover/foco y reduced motion.
  const slider = document.querySelector<HTMLElement>("[data-slider]"),
    slides = slider
      ? [...slider.querySelectorAll<HTMLElement>("[data-slide]")]
      : [],
    dots = slider
      ? [...slider.querySelectorAll<HTMLButtonElement>("[data-slide-to]")]
      : [];
  const motion = matchMedia("(prefers-reduced-motion:reduce)");
  let indice = Math.max(
      0,
      slides.findIndex((s) => s.classList.contains("is-active")),
    ),
    sliderVisible = true,
    hover = false,
    focus = false,
    paused = motion.matches;
  function programar() {
    clearTimeout(slideTimer);
    slideTimer = undefined;
    if (
      slider &&
      slides.length > 1 &&
      sliderVisible &&
      !document.hidden &&
      !paused &&
      !hover &&
      !focus &&
      !motion.matches
    )
      slideTimer = setTimeout(() => {
        mostrar((indice + 1) % slides.length);
      }, 6500);
  }
  function mostrar(n: number) {
    indice = n;
    slides.forEach((s, i) => {
      const activo = i === n;
      s.classList.toggle("is-active", activo);
      s.setAttribute("aria-hidden", String(!activo));
      s.inert = !activo;
    });
    dots.forEach((b, i) => {
      b.classList.toggle("active", i === n);
      b.setAttribute("aria-pressed", String(i === n));
    });
    const number = slider?.querySelector("[data-slide-number]");
    if (number) number.textContent = String(n + 1).padStart(2, "0");
    programar();
  }
  function actualizarPausa() {
    const b = slider?.querySelector("[data-slide-pause]");
    b?.setAttribute("aria-pressed", String(paused));
    b?.setAttribute(
      "aria-label",
      paused ? "Reanudar banners" : "Pausar banners",
    );
    b?.classList.toggle("paused", paused);
  }
  slider?.addEventListener(
    "click",
    (e) => {
      const target = e.target as Element;
      const dot = target.closest<HTMLElement>("[data-slide-to]");
      if (dot) {
        paused = true;
        mostrar(Number(dot.dataset.slideTo));
      } else if (target.closest("[data-slide-prev]")) {
        paused = true;
        mostrar((indice + slides.length - 1) % slides.length);
      } else if (target.closest("[data-slide-next]")) {
        paused = true;
        mostrar((indice + 1) % slides.length);
      } else if (target.closest("[data-slide-pause]")) {
        paused = !paused;
        programar();
      }
      actualizarPausa();
    },
    { signal },
  );
  slider?.addEventListener(
    "pointerenter",
    () => {
      hover = true;
      programar();
    },
    { signal },
  );
  slider?.addEventListener(
    "pointerleave",
    () => {
      hover = false;
      programar();
    },
    { signal },
  );
  slider?.addEventListener(
    "focusin",
    () => {
      focus = true;
      programar();
    },
    { signal },
  );
  slider?.addEventListener(
    "focusout",
    (e) => {
      focus = slider.contains(e.relatedTarget as Node);
      programar();
    },
    { signal },
  );
  let swipe: { x: number; y: number } | null = null;
  slider?.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType === "touch") swipe = { x: e.clientX, y: e.clientY };
    },
    { passive: true, signal },
  );
  slider?.addEventListener(
    "pointerup",
    (e) => {
      if (e.pointerType !== "touch" || !swipe) return;
      const dx = e.clientX - swipe.x,
        dy = e.clientY - swipe.y;
      swipe = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        paused = true;
        mostrar((indice + (dx < 0 ? 1 : slides.length - 1)) % slides.length);
        actualizarPausa();
      }
    },
    { passive: true, signal },
  );
  slider?.addEventListener(
    "pointercancel",
    () => {
      swipe = null;
    },
    { signal },
  );
  motion.addEventListener(
    "change",
    () => {
      paused = motion.matches;
      if (motion.matches) pulses.forEach((a) => a.cancel());
      actualizarPausa();
      programar();
    },
    { signal },
  );
  actualizarPausa();
  programar();

  // Un único coordinador de RAF y observer para toda la capa visual.
  const movement = iniciarMovimiento({
    signal,
    onHeroVisibility: (visible) => {
      sliderVisible = visible;
      programar();
    },
  });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) pulses.forEach((a) => a.cancel());
      programar();
    },
    { signal },
  );
  const stats = () => ({
    ...movement.stats(),
    timers: [toastTimer, searchTimer, slideTimer, megaTimer].filter(Boolean)
      .length,
    pulses: pulses.size,
  });
  if (document.documentElement.hasAttribute("data-motion-diagnostics")) {
    void import("./motion-diagnostics").then(({ observeMotion }) => {
      if (!signal.aborted) observeMotion(signal, stats);
    });
  }
  detener = () => {
    controller.abort();
    searchRequest?.abort();
    cartRequest?.abort();
    [toastTimer, searchTimer, slideTimer, megaTimer].forEach((t) =>
      clearTimeout(t),
    );
    movement.dispose();
    pulses.forEach((a) => a.cancel());
    pulses.clear();
    iniciado = false;
  };
}
iniciar();
window.addEventListener("pagehide", () => detener());
window.addEventListener("pageshow", (e) => {
  if (e.persisted) iniciar();
});
