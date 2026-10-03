import { test } from "node:test";
import assert from "node:assert/strict";
import {
  agregarProducto,
  leerCarrito,
  reconciliarCarrito,
  subtotalCentimos,
  validarProducto,
} from "../src/lib/cart.ts";
import { categoriasRelacionadas } from "../src/lib/shared.ts";
import {
  consultaNormalizada,
  estadoCatalogo,
  listarProductos,
  prepararCatalogo,
  detalleProducto,
} from "../src/lib/tienda.ts";

// Fixtures exclusivas del runner de tests; nunca se importan desde src.
const product = {
  id: "10000000-0000-4000-8000-000000000001",
  slug: "producto-prueba",
  nombre: "GPU RTX de prueba",
  categoria: "Tarjetas gráficas",
  marca: "Marca de prueba",
  precio: 0.1,
  precioAnterior: null,
  stock: 3,
  destacado: false,
  imagenUrl: null,
};
const second = {
  ...product,
  id: "10000000-0000-4000-8000-000000000002",
  slug: "otro-producto-prueba",
};
test("las sugerencias relacionan RTX con su categoría aunque el nombre de categoría no contenga RTX", () => {
  assert.deepEqual(
    categoriasRelacionadas(
      ["Tarjetas gráficas", "Procesadores"],
      [product],
      "RTX",
    ),
    ["Tarjetas gráficas"],
  );
});
test("el carrito acumula cantidades sin mutar y rechaza cantidades superiores al stock", () => {
  const first = agregarProducto([], product, 2);
  const next = agregarProducto(first, product);
  assert.equal(first[0].cantidad, 2);
  assert.equal(next[0].cantidad, 3);
  assert.throws(() => agregarProducto(next, product));
  assert.throws(() => agregarProducto([], product, 1.5));
});
test("el total se calcula en céntimos sin errores de coma flotante", () => {
  const cart = agregarProducto(
    agregarProducto([], product, 3),
    { ...second, precio: 0.2 },
    2,
  );
  assert.equal(subtotalCentimos(cart), 70);
});
test("almacenamiento corrupto, duplicado o manipulado no se acepta", () => {
  assert.deepEqual(leerCarrito("{"), []);
  const line = { producto: product, cantidad: 2 };
  assert.equal(leerCarrito(JSON.stringify([line, line])).length, 1);
  assert.deepEqual(leerCarrito(JSON.stringify([{ ...line, cantidad: 4 }])), []);
  assert.equal(
    validarProducto({ ...product, imagenUrl: "https://evil.test/a.jpg" })
      .imagenUrl,
    null,
  );
  assert.equal(validarProducto({ ...product, precio: Infinity }), null);
});
test("la consulta actualiza precio, limita stock y elimina productos retirados", () => {
  const old = agregarProducto(agregarProducto([], product, 3), second);
  const updated = reconciliarCarrito(old, [
    { ...product, stock: 1, precio: 5 },
  ]);
  assert.equal(updated.length, 1);
  assert.equal(updated[0].cantidad, 1);
  assert.equal(subtotalCentimos(updated), 500);
});
test("búsqueda conserva texto, filtros y orden para enviarlos a Spring Boot", () => {
  const q = consultaNormalizada(
    new URLSearchParams(
      "search=GRÁFICAS&categoria=Tarjetas+gráficas&oferta=true",
    ),
  );
  assert.equal(q.get("q"), "GRÁFICAS");
  assert.equal(q.get("categoria"), "Tarjetas gráficas");
  assert.equal(q.get("oferta"), "true");
  const ordered = consultaNormalizada(
    new URLSearchParams("orden=precio-menor&min=200&max=1000"),
  );
  assert.equal(ordered.get("orden"), "precio-menor");
  assert.equal(ordered.get("min"), "200");
});
test("filtros inválidos se rechazan", () => {
  for (const q of [
    "pagina=-1",
    "tamano=500",
    "min=10&max=1",
    "orden=desconocido",
    "oferta=si",
  ]) {
    assert.throws(() => consultaNormalizada(new URLSearchParams(q)));
  }
});
test("el catálogo consulta solamente la API incluso cuando una búsqueda queda vacía", async (t) => {
  const previous = process.env.API_URL;
  process.env.API_URL = "http://backend.test";
  const responses = [
    { items: [product], total: 1 },
    ["Real"],
    ["Real"],
    { items: [], total: 0 },
  ];
  const fetchMock = t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(JSON.stringify(responses.shift()), { status: 200 }),
  );
  try {
    const state = await estadoCatalogo();
    assert.equal(state.total, 1);
    assert.equal(
      (await listarProductos(state, new URLSearchParams("search=inexistente")))
        .total,
      0,
    );
    fetchMock.mock.mockImplementation(async () => {
      throw new Error("offline");
    });
    await assert.rejects(estadoCatalogo(), (e) => e.status === 503);
  } finally {
    if (previous === undefined) delete process.env.API_URL;
    else process.env.API_URL = previous;
  }
});
test("un catálogo global vacío permanece vacío, sin productos ni facetas inventadas", async (t) => {
  const previous = process.env.API_URL;
  process.env.API_URL = "http://backend.test";
  t.mock.method(
    globalThis,
    "fetch",
    async (url) =>
      new Response(
        JSON.stringify(
          String(url).includes("productos?") ? { items: [], total: 0 } : [],
        ),
      ),
  );
  try {
    const state = await estadoCatalogo();
    assert.deepEqual(state, { total: 0, categorias: [], marcas: [] });
    assert.equal(
      (await listarProductos(state, new URLSearchParams())).total,
      0,
    );
  } finally {
    if (previous === undefined) delete process.env.API_URL;
    else process.env.API_URL = previous;
  }
});
test("API caída devuelve 503 y un error diferente del catálogo vacío", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("offline");
  });
  const result = await prepararCatalogo(new URLSearchParams());
  assert.equal(result.status, 503);
  assert.equal(result.pagina, undefined);
  assert.equal(
    result.error,
    "No pudimos cargar los productos en este momento.",
  );
});
test("cada consulta lee precio, stock e imagen actuales sin cachear catálogo", async (t) => {
  let version = 0;
  const snapshots = [
    {
      ...product,
      precio: 1499,
      stock: 5,
      imagenUrl:
        "/api/productos/imagenes/10000000-0000-4000-8000-000000000003.webp",
    },
    {
      ...product,
      precio: 1399,
      stock: 2,
      imagenUrl:
        "/api/productos/imagenes/10000000-0000-4000-8000-000000000004.webp",
    },
    { ...product, precio: 1399, stock: 0, imagenUrl: null },
  ];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.cache, "no-store");
    assert.match(String(url), /\/api\/public\/productos\/producto-prueba$/);
    return Response.json(snapshots[version++]);
  });
  for (const expected of snapshots)
    assert.deepEqual(await detalleProducto(product.slug), expected);
});
test("la selección persistida anterior con IDs ficticios se descarta", () => {
  const legacy = { ...product, id: "demo-gpu", slug: "demo-gpu" };
  assert.equal(validarProducto(legacy), null);
  assert.deepEqual(
    leerCarrito(JSON.stringify([{ producto: legacy, cantidad: 1 }])),
    [],
  );
});
