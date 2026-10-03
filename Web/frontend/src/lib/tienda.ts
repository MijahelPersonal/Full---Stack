import { api, ApiError, type Producto, type Pagina } from "./catalogo";
import { slugCategoria } from "./shared";
export interface EstadoCatalogo {
  categorias: string[];
  marcas: string[];
  total: number;
}
export async function estadoCatalogo(): Promise<EstadoCatalogo> {
  const [pagina, categorias, marcas] = await Promise.all([
    api<Pagina>("productos?tamano=1"),
    api<string[]>("categorias"),
    api<string[]>("marcas"),
  ]);
  return {
    total: pagina.total,
    categorias,
    marcas,
  };
}
export function consultaNormalizada(params: URLSearchParams) {
  const q = new URLSearchParams();
  for (const key of [
    "categoria",
    "marca",
    "disponibilidad",
    "min",
    "max",
    "orden",
    "pagina",
    "tamano",
    "destacado",
    "oferta",
  ]) {
    const v = params.get(key);
    if (v) q.set(key, v);
  }
  const busqueda = params.get("search") ?? params.get("q");
  if (busqueda) q.set("q", busqueda);
  const pagina = Number(q.get("pagina") || 0),
    tamano = Number(q.get("tamano") || 12),
    min = q.has("min") ? Number(q.get("min")) : null,
    max = q.has("max") ? Number(q.get("max")) : null;
  if (
    !Number.isInteger(pagina) ||
    pagina < 0 ||
    pagina > 10000 ||
    !Number.isInteger(tamano) ||
    tamano < 1 ||
    tamano > 48 ||
    (min !== null && (!Number.isFinite(min) || min < 0)) ||
    (max !== null && (!Number.isFinite(max) || max < 0)) ||
    (min !== null && max !== null && min > max) ||
    (q.get("q") || "").length > 120 ||
    !["recientes", "precio-menor", "precio-mayor", "destacados"].includes(
      q.get("orden") || "recientes",
    ) ||
    !["", "con-stock", "sin-stock"].includes(q.get("disponibilidad") || "") ||
    ["oferta", "destacado"].some(
      (k) => q.has(k) && !["true", "false"].includes(q.get(k)!),
    )
  )
    throw new ApiError(400);
  return q;
}
export async function listarProductos(
  _estado: EstadoCatalogo,
  params: URLSearchParams,
) {
  const q = consultaNormalizada(params);
  return api<Pagina>("productos?" + q);
}
export async function prepararCatalogo(
  query: URLSearchParams,
  inicial?: EstadoCatalogo,
) {
  let estado = inicial;
  try {
    consultaNormalizada(query);
    estado ??= await estadoCatalogo();
    const pagina = await listarProductos(estado, query);
    return { estado, pagina, error: "", status: 200 };
  } catch (e) {
    const bad = e instanceof ApiError && e.status === 400;
    return {
      estado,
      pagina: undefined,
      error: bad
        ? "Revisa los filtros y el rango de precios."
        : "No pudimos cargar los productos en este momento.",
      status: bad ? 400 : 503,
    };
  }
}
export async function detalleProducto(slug: string): Promise<Producto> {
  return api<Producto>("productos/" + encodeURIComponent(slug));
}
export async function conteosCategorias(estado: EstadoCatalogo) {
  const resultados: { nombre: string; slug: string; cantidad: number }[] =
    new Array(estado.categorias.length);
  let siguiente = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, estado.categorias.length) }, async () => {
      while (siguiente < estado.categorias.length) {
        const i = siguiente++,
          nombre = estado.categorias[i];
        const cantidad = (
          await api<Pagina>(
            "productos?categoria=" + encodeURIComponent(nombre) + "&tamano=1",
          )
        ).total;
        resultados[i] = { nombre, slug: slugCategoria(nombre), cantidad };
      }
    }),
  );
  return resultados;
}
