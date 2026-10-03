export interface Producto {
  id: string;
  slug: string;
  nombre: string;
  categoria: string;
  marca: string;
  precio: number;
  precioAnterior: number | null;
  stock: number;
  destacado: boolean;
  imagenUrl: string | null;
  descripcion?: string;
  especificaciones?: Record<string, string>;
}
export interface Pagina {
  items: Producto[];
  total: number;
  pagina: number;
  paginas: number;
  tamano: number;
}
export class ApiError extends Error {
  constructor(public status: number) {
    super("El catálogo no está disponible");
  }
}
export const origen = () =>
  (
    process.env.API_URL ||
    import.meta.env?.API_URL ||
    "http://localhost:8080"
  ).replace(/\/$/, "");
export async function api<T>(ruta: string): Promise<T> {
  const r = await fetch(`${origen()}/api/public/${ruta}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
    headers: { Accept: "application/json" },
  }).catch(() => {
    throw new ApiError(503);
  });
  if (!r.ok) throw new ApiError(r.status);
  return (await r.json()) as T;
}
export const dinero = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    n,
  );
export function imagen(p: Producto, w = 640) {
  const f = p.imagenUrl?.split("/").pop();
  return f && /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(f)
    ? `/media/${f}?w=${w}`
    : null;
}
