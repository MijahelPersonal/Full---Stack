import { test } from "node:test";
import assert from "node:assert/strict";
const base = process.env.EMPTY_STORE_TEST_URL;
const offline = process.env.OFFLINE_STORE_TEST_URL;
test(
  "DB vacía se refleja como cero productos, categorías, marcas y sugerencias",
  { skip: !base },
  async () => {
    const search = await fetch(new URL("/api/buscar", base));
    assert.equal(search.status, 200);
    assert.deepEqual(await search.json(), { items: [], categorias: [] });
    const home = await fetch(new URL("/", base));
    const html = await home.text();
    assert.equal(home.status, 200);
    assert.match(html, /No hay productos disponibles todavía/);
    assert.doesNotMatch(
      html,
      /data-product=|data-add-cart|VISTA PREVIA|productos de demostración/i,
    );
    const catalog = await fetch(new URL("/productos", base));
    assert.match(await catalog.text(), /No encontramos productos disponibles/);
  },
);
test(
  "API caída muestra 503 y error en lugar de catálogo demo",
  { skip: !offline },
  async () => {
    for (const path of ["/", "/productos"]) {
      const response = await fetch(new URL(path, offline));
      const html = await response.text();
      assert.equal(response.status, 503);
      assert.match(html, /No pudimos cargar los productos en este momento/);
      assert.doesNotMatch(
        html,
        /data-add-cart|VISTA PREVIA|productos de demostración/i,
      );
    }
  },
);
