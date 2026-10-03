import { dinero, type Producto } from "./shared";
export { dinero };
export interface LineaCarrito {
  producto: Producto;
  cantidad: number;
}
export const claveCarrito = "struch.cart.v1";
export function validarProducto(raw: unknown): Producto | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (
    typeof p.id !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(
      p.id,
    ) ||
    typeof p.slug !== "string" ||
    !/^[a-z0-9-]{1,128}$/.test(p.slug) ||
    typeof p.nombre !== "string" ||
    p.nombre.length > 160 ||
    typeof p.precio !== "number" ||
    !Number.isFinite(p.precio) ||
    p.precio <= 0 ||
    p.precio > 999999999999.99 ||
    !Number.isInteger(p.stock) ||
    Number(p.stock) < 0 ||
    Number(p.stock) > 2147483647
  )
    return null;
  return {
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    categoria: typeof p.categoria === "string" ? p.categoria.slice(0, 80) : "",
    marca: typeof p.marca === "string" ? p.marca.slice(0, 80) : "",
    precio: p.precio,
    precioAnterior:
      typeof p.precioAnterior === "number" &&
      Number.isFinite(p.precioAnterior) &&
      p.precioAnterior > p.precio
        ? p.precioAnterior
        : null,
    stock: Number(p.stock),
    destacado: p.destacado === true,
    imagenUrl:
      typeof p.imagenUrl === "string" &&
      /^\/api\/productos\/imagenes\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(
        p.imagenUrl,
      )
        ? p.imagenUrl
        : null,
  };
}
export function leerCarrito(valor: string | null): LineaCarrito[] {
  try {
    const raw: unknown = JSON.parse(valor || "[]");
    if (!Array.isArray(raw)) return [];
    const items: LineaCarrito[] = [];
    for (const r of raw.slice(0, 30)) {
      const p = validarProducto(r?.producto);
      if (
        p &&
        Number.isInteger(r.cantidad) &&
        r.cantidad > 0 &&
        r.cantidad <= Math.min(p.stock, 999) &&
        !items.some((l) => l.producto.id === p.id)
      )
        items.push({ producto: p, cantidad: r.cantidad });
    }
    return items;
  } catch {
    return [];
  }
}
export function agregarProducto(
  lineas: LineaCarrito[],
  producto: Producto,
  cantidad = 1,
): LineaCarrito[] {
  const p = validarProducto(producto);
  if (!p || !Number.isInteger(cantidad) || cantidad < 1 || p.stock === 0)
    throw new Error("Producto no disponible");
  const nuevas = lineas.map((l) => ({ ...l }));
  const existente = nuevas.find((l) => l.producto.id === p.id);
  if (!existente && nuevas.length >= 30)
    throw new Error("El carrito admite hasta 30 productos distintos");
  const total = (existente?.cantidad || 0) + cantidad;
  if (total > Math.min(p.stock, 999))
    throw new Error("La cantidad supera el stock disponible");
  if (existente) {
    existente.producto = p;
    existente.cantidad = total;
  } else nuevas.push({ producto: p, cantidad: total });
  return nuevas;
}
export const subtotalCentimos = (lineas: LineaCarrito[]) =>
  lineas.reduce(
    (n, l) => n + Math.round(l.producto.precio * 100) * l.cantidad,
    0,
  );
export function reconciliarCarrito(
  lineas: LineaCarrito[],
  actuales: Producto[],
) {
  return lineas.flatMap((l) => {
    const p = actuales.find((p) => p.id === l.producto.id);
    return !p || p.stock < 1
      ? []
      : [{ producto: p, cantidad: Math.min(l.cantidad, p.stock, 999) }];
  });
}
