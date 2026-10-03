import { test } from "node:test";
import assert from "node:assert/strict";

const base = process.env.STORE_TEST_URL;
test(
  "rutas públicas, enlaces, identidad y códigos de error contra la tienda ejecutada",
  { skip: !base },
  async () => {
    const paths = [
      "/",
      "/productos",
      "/categorias",
      "/ofertas",
      "/marcas",
      "/arma-tu-pc",
      "/contacto",
      "/carrito",
      "/cuenta",
      "/cuenta?modo=registro",
      "/cuenta?seccion=pedidos",
      "/novedades",
      "/finalizar-compra",
    ];
    const linked = new Set();
    for (const path of paths) {
      const response = await fetch(new URL(path, base));
      const html = await response.text();
      assert.equal(response.status, 200, path);
      assert.match(html, /STRUCH/);
      assert.doesNotMatch(html, /Nexo/i);
      assert.doesNotMatch(
        html,
        /VISTA PREVIA|productos de demostración|demo-sprite|demo-gpu|struch-demo-atlas/i,
      );
      assert.doesNotMatch(
        html,
        /precioCompra|stockMinimo|jwtSecret|passwordHash/,
      );
      for (const match of html.matchAll(/href="(\/[^"<>]*)"/g)) {
        if (!match[1].startsWith("//"))
          linked.add(match[1].replaceAll("&amp;", "&"));
      }
    }
    for (const path of linked)
      assert.equal((await fetch(new URL(path, base))).status, 200, path);
    assert.equal(
      (await fetch(new URL("/productos?pagina=-1", base))).status,
      400,
    );
    assert.equal(
      (await fetch(new URL("/producto/inexistente", base))).status,
      404,
    );
    assert.equal(
      (await fetch(new URL("/categorias/inexistente", base))).status,
      404,
    );
    for (const path of [
      "/demo-product-images/gpu-demo.webp",
      "/product-images-library/pcs-armadas/pc-gamer-negra.webp",
    ])
      assert.equal((await fetch(new URL(path, base))).status, 404, path);
  },
);
test(
  "búsqueda y consulta de carrito usan únicamente la API pública",
  { skip: !base },
  async () => {
    const search = await fetch(new URL("/api/buscar?search=ryzen", base));
    assert.equal(search.status, 200);
    const body = await search.json();
    assert.ok(Array.isArray(body.items));
    assert.equal(
      (await fetch(new URL("/api/carrito?slugs=../usuarios", base))).status,
      400,
    );
  },
);
